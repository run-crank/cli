import {flags} from '@oclif/command'
import {IConfig} from '@oclif/config'
import {Promise as Bluebird} from 'bluebird'
import chalk from 'chalk'
import {cli} from 'cli-ux'
import * as debug from 'debug'
import * as fs from 'fs'
import * as glob from 'glob'
import * as _ from 'lodash'

import {AuthenticationError} from '../errors/authentication-error'
import {MissingStepError} from '../errors/missing-step-error'
import {Scenario} from '../models/scenario'
import {Step as RunnerStep} from '../models/step'
import {RunStepResponse} from '../proto/cog_pb'
import {CogManager} from '../services/cog-manager'
import {Timer} from '../services/timer'
import StepAwareCommand from '../step-aware-command'

export default class Run extends StepAwareCommand {
  static description = 'Run a .crank.yml scenario file or folder of files.'
  static examples = [
    '$ crank run /path/to/scenario.crank.yml',
    '$ crank run --use-ssl /path/to/scenario-folder',
    '$ crank run scenario.crank.yml --token utmSource=Email -t "utmCampaign=Test Campaign"'
  ]

  static flags = {
    'use-ssl': flags.boolean({
      char: 's',
      description: 'Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs you are building).'
    }),
    debug: flags.boolean({
      description: 'More verbose output to aid in diagnosing issues using Crank',
    }),
    token: flags.string({
      char: 't',
      description: 'Set one or more contextual token values for this scenario; provide several by passing this flag multiple times.',
      multiple: true,
    }),
  }
  static args = [{name: 'file', required: true}]

  protected cogManager: CogManager
  protected logDebug: debug.Debugger

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
    this.logDebug = debug('crank:run')
  }

  async init() {
    const {flags} = this.parse(Run)
    if (flags.debug) {
      debug.enable('crank:*')
      this.cogManager.setDebug(true)
    }
  }

  async run() {
    const {args, flags} = this.parse(Run)
    const tokens = this.parseTokens(flags.token || [])
    let scenarios: Scenario[] = []
    let exitCode = 0

    try {
      this.logDebug('Parsing scenario file or directory %s', args.file)
      scenarios = await this.parseScenarioFiles(args.file, tokens)
      this.logDebug('Starting Cogs needed to run scenario(s)')
      await this.cogManager.decorateStepsWithClients(
        _.flatten(scenarios.map(s => s.steps)),
        flags['use-ssl'],
      )
    } catch (e) {
      this.log()
      this.log(chalk.red('Error running scenario:'))
      this.log(chalk.red(`  ${e.message || e}`))

      // Provide friendlier authentication help/documentation.
      if (e instanceof AuthenticationError && e.helpUrl) {
        this.log()
        this.log('Relevant authentication docs for your reference:')
        await cli.url(e.helpUrl, e.helpUrl)
      }

      // Provide friendlier missing step help
      if (e instanceof MissingStepError) {
        this.log()
        this.log('Run the following to list available steps')
        this.log('  crank registry:steps')
      }

      return this.exit(1)
    }

    // Coerce types on steps.
    scenarios.forEach(scenario => {
      scenario.optimizedSteps.forEach(step => {
        const runnerSteps = step instanceof Array ? step : [step]
        runnerSteps.forEach(runnerStep => {
          runnerStep.protoSteps.forEach(protoStep => {
            this.coerceProtoStepTypes(protoStep, runnerStep.cog)
          })
        })
      })
    })

    // Run through scenarios.
    const overallTimer = new Timer()
    await Bluebird.mapSeries(scenarios, async (scenario: Scenario) => {
      let hasFailures = false

      // Run through steps.
      this.logDebug(`Running scenario in ${scenario.file}`)
      this.log(`\n${scenario.name}\n`)
      const timer: Timer = new Timer()
      await Bluebird.mapSeries(scenario.optimizedSteps, (step: RunnerStep | RunnerStep[], index: number) => {
        return new Promise(async (resolve, reject) => {
          try {
            if (step instanceof Array) {
              const stepRunner = new RunnerStep({
                cog: step[0].cog,
                tokens: scenario.tokens,
                protoSteps: step.map(s => s.protoSteps instanceof Array ? s.protoSteps[0] : s.protoSteps),
                stepText: step.map(s => s.stepText instanceof Array ? s.stepText[0] : s.stepText),
                client: step[0].client,
                registries: this.registry,
                waitFor: step.map(s => s.waitFor[0]),
                failAfter: step.map(s => s.failAfter[0]),
                priorFailure: hasFailures,
                scenarioId: scenario.id,
              })
              await this.runSteps(stepRunner, 2, true, false, flags.debug)
              timer.addPassedStep(step.length)
            } else {
              await this.runStep(step, 2, true, false, flags.debug)
              timer.addPassedStep()
            }

            // If there has been a failure, and either the next step/series of
            // steps is or begins with an action or there is no next step, then
            // reject. Otherwise, continue on as usual.
            if (hasFailures) {
              const nextStep = scenario.optimizedSteps[index + 1]

              if (!nextStep) {
                // Decrement the failed step count because we're about to reject,
                // which will erroneously inflate the fail count.
                overallTimer.addFailedStep(-1)
                return reject({innerIndex: 0, stepIndex: index + 1})
              }

              if (nextStep instanceof Array && !nextStep[0].isValidationStep(0)) {
                overallTimer.addFailedStep(-1)
                return reject({innerIndex: 0, stepIndex: index + 1})
              }

              if (!(nextStep instanceof Array) && !nextStep.isValidationStep(0)) {
                overallTimer.addFailedStep(-1)
                return reject({innerIndex: 0, stepIndex: index + 1})
              }
            }

            resolve()
          } catch (e) {
            let failures: any
            hasFailures = true

            if (e instanceof Array) {
              failures = e.filter((s: RunStepResponse) => s.getOutcome() !== RunStepResponse.Outcome.PASSED)
              timer.addPassedStep(e.length - failures.length)
              timer.addFailedStep(failures.length)
            } else {
              timer.addFailedStep()
            }
            exitCode = 1

            // If the next step/series of steps is or begins with a validation,
            // then resolve and let the next step be executed.
            if (scenario.optimizedSteps[index + 1]) {
              const nextStep = scenario.optimizedSteps[index + 1]
              if (nextStep instanceof Array && nextStep[0].isValidationStep(0)) {
                return resolve()
              } else if (!(nextStep instanceof Array) && nextStep.isValidationStep(0)) {
                return resolve()
              }
            }

            // Otherwise, reject as usual.
            reject({
              innerIndex: e instanceof Array ? e.length : 0,
              stepIndex: index
            })
          }
        })
      }).then(() => {
        overallTimer.addPassedStep()
      }).catch(({stepIndex, innerIndex}) => {
        overallTimer.addFailedStep()
        scenario.optimizedSteps.slice(stepIndex).forEach(step => {
          if (step instanceof Array) {
            step.slice(innerIndex).forEach(s => {
              this.log(`  ${chalk.gray(`✀  ${s.stepText}`)}`)
              timer.addSkippedStep()
            })
            innerIndex = 0
          } else {
            this.log(`  ${chalk.gray(`✀  ${step.stepText}`)}`)
            timer.addSkippedStep()
          }
        })
      })
      timer.printTime(this.log.bind(this))
    })

    // If more than one scenario was run, print overall details.
    if (scenarios.length > 1) {
      this.log('\nAll Scenarios:')
      overallTimer.printTime(msg => {
        this.log(msg.trim())
      })
    }

    if (exitCode > 0) {
      this.exit(exitCode)
    }
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

  /**
   * Parses the raw input from token flag into a dictionary of token names
   * to token values.
   * @param tokensFromFlags - Raw value of --token flag
   */
  protected parseTokens(tokensFromFlags: string[]): Record<string, string> {
    let tokens: Record<string, any> = {}

    tokensFromFlags.forEach(token => {
      // Note, token-substitute npm package takes care of substituting vars in
      // when they represent nested objects (e.g. foo.bar=baz), so no need to
      // split/regex that out here.
      const splat = token.split('=', 2)
      if (splat[0] && splat[1]) {
        tokens[splat[0]] = splat[1]
      }
    })

    return tokens
  }

  protected async parseScenarioFiles(fileOrDirectory: string, tokens: Record<string, any>): Promise<Scenario[]> {
    const windowsSafeGlob = fileOrDirectory.replace(/\\/g, '/')
    let isDirectory = false
    let scenarios: Scenario[] = []

    try {
      isDirectory = fs.lstatSync(fileOrDirectory).isDirectory()
      // tslint:disable-next-line:no-unused
    } catch (e) {}

    // If the provided file is legitimately just a file, parse it.
    if (!isDirectory) {
      scenarios.push(new Scenario({
        registries: this.registry,
        fromFile: fileOrDirectory,
        tokenOverrides: tokens
      }))
    } else {
      // Otherwise, recursively find all *.crank.yml files and parse them.
      const files = glob.sync(`${windowsSafeGlob}/**/*.crank.yml`, {absolute: true})
      if (files.length === 0) {
        throw new Error(`No .crank.yml files found in ${fileOrDirectory}`)
      }

      scenarios = files.map(file => {
        return new Scenario({
          registries: this.registry,
          fromFile: file,
          tokenOverrides: tokens
        })
      })
    }

    return scenarios
  }

}
