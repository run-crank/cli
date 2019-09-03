import {flags} from '@oclif/command'
import {IConfig} from '@oclif/config'
import {Promise as Bluebird} from 'bluebird'
import chalk from 'chalk'
import {cli} from 'cli-ux'
import * as debug from 'debug'

import {AuthenticationError} from '../errors/authentication-error'
import {MissingStepError} from '../errors/missing-step-error'
import {Scenario} from '../models/scenario'
import {Step as RunnerStep} from '../models/step'
import {RunStepResponse} from '../proto/cog_pb'
import {CogManager} from '../services/cog-manager'
import {Timer} from '../services/timer'
import StepAwareCommand from '../step-aware-command'

export default class Run extends StepAwareCommand {
  static description = 'Run one or several scenario files or folders.'
  static examples = [
    '$ crank run /path/to/scenario.yml',
    '$ crank run --use-ssl /path/to/scenario-folder',
  ]

  static flags = {
    'use-ssl': flags.boolean({
      char: 's',
      description: 'Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs you are building).'
    }),
    debug: flags.boolean({
      description: 'More verbose output to aid in diagnosing issues using Crank',
    }),
  }
  static args = [{name: 'fileOrFolder', required: true}]

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
    let scenario: Scenario

    try {
      this.logDebug('Parsing scenario file %', args.fileOrFolder)
      scenario = new Scenario({registries: this.registry, fromFile: args.fileOrFolder})
      this.logDebug('Starting Cogs needed to run scenario %s', args.fileOrFolder)
      await this.cogManager.decorateStepsWithClients(scenario.steps, flags['use-ssl'])
    } catch (e) {
      this.log()
      this.log(chalk.red('Error running scenario:'))
      this.log(chalk.red(`  ${e}`))

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

      process.exitCode = 1
      return
    }

    // Run through steps.
    this.log(`\n${scenario.name}\n`)
    const timer: Timer = new Timer()
    await Bluebird.mapSeries(scenario.optimizedSteps, (step: RunnerStep | RunnerStep[], index: number) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (step instanceof Array) {
            const stepRunner = new RunnerStep({
              cog: step[0].cog,
              protoSteps: step.map(s => s.protoSteps instanceof Array ? s.protoSteps[0] : s.protoSteps),
              stepText: step.map(s => s.stepText instanceof Array ? s.stepText[0] : s.stepText),
              client: step[0].client,
              registries: this.registry,
              waitFor: step.map(s => s.waitFor[0]),
              failAfter: step.map(s => s.failAfter[0]),
            })
            await this.runSteps(stepRunner, 2, true, false)
            timer.addPassedStep(step.length)
            resolve()
          } else {
            await this.runStep(step, 2, true, false)
            timer.addPassedStep()
            resolve()
          }
        } catch (e) {
          let failures: any
          if (e instanceof Array) {
            failures = e.filter((s: RunStepResponse) => s.getOutcome() !== RunStepResponse.Outcome.PASSED)
            timer.addPassedStep(e.length - failures.length)
            timer.addFailedStep(failures.length)
          } else {
            timer.addFailedStep()
          }
          process.exitCode = 1
          reject({
            innerIndex: e instanceof Array ? e.length : 0,
            stepIndex: index
          })
        }
      })
    }).catch(({stepIndex, innerIndex}) => {
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
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

}
