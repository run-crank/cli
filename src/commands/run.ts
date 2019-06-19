import {flags} from '@oclif/command'
import {IConfig} from '@oclif/config'
import {Promise as Bluebird} from 'bluebird'
import chalk from 'chalk'

import {Scenario} from '../models/scenario'
import {Step as RunnerStep} from '../models/step'
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
  }
  static args = [{name: 'fileOrFolder', required: true}]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    const {args, flags} = this.parse(Run)
    let scenario: Scenario

    try {
      scenario = new Scenario({registries: this.registry, fromFile: args.fileOrFolder})
    } catch (e) {
      this.log(chalk.red('Error running scenario:'))
      this.log(chalk.red(`  ${e}`))
      process.exitCode = 1
      return
    }
    await this.cogManager.decorateStepsWithClients(scenario.steps, flags['use-ssl'])

    // Run through steps.
    this.log(`\n${scenario.name}\n`)
    const timer: Timer = new Timer()
    await Bluebird.mapSeries(scenario.steps, (step: RunnerStep, index: number) => {
      return new Promise(async (resolve, reject) => {
        try {
          await this.runStep(step, 2, true, false)
          timer.addPassedStep()
          resolve()
        } catch (e) {
          timer.addFailedStep()
          process.exitCode = e ? 1 : 1
          reject(index)
        }
      })
    }).catch(stepIndex => {
      scenario.steps.slice(stepIndex).forEach(step => {
        this.log(`  ${chalk.gray(`✀  ${step.stepText}`)}`)
        timer.addSkippedStep()
      })
    })
    timer.printTime(this.log.bind(this))
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

}
