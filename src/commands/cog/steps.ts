import {IConfig} from '@oclif/config'
import {flags} from '@oclif/parser'
import {Promise as Bluebird} from 'bluebird'
import cli from 'cli-ux'
import * as inquirer from 'inquirer'
import {Subject} from 'rxjs'

import {Step as StepRunner} from '../../models/step'
import {CogServiceClient} from '../../proto/cog_grpc_pb'
import {RunStepResponse, Step as ProtoStep} from '../../proto/cog_pb'
import {CogManager} from '../../services/cog-manager'
import {CogRegistryEntry} from '../../services/registries'
import {Timer} from '../../services/timer'
import StepAwareCommand from '../../step-aware-command'

export default class Step extends StepAwareCommand {
  static description = 'Run multiple cog steps interactively.'
  static examples = [
    '$ crank cog:steps MyCog',
  ]

  static flags = {
    'use-ssl': flags.boolean({
      char: 's',
      description: 'Use SSL when invoking all cogs (useful for testing SSL support for cogs you are building).'
    }),
    step: flags.string({
      description: 'The stepId of the step you wish to run. Provide multiple steps by passing this flag multiple times.',
      multiple: true
    })
  }

  static args = [{name: 'cogName', required: true}]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    const {args, flags} = this.parse(Step)
    const cogConfig = this.registry.getCogConfigFromRegistry(args.cogName)
    let cogClient: CogServiceClient

    if (!cogConfig || !cogConfig._runConfig || !cogConfig.stepDefinitionsList) {
      this.log(`Couldn't find a cog named ${args.cogName}`)
      process.exitCode = 1
      return
    }

    const stepIds: string[] = flags.step ? flags.step : await this.gatherStepIds(cogConfig)
    let steps: ProtoStep[]
    try {
      steps = await Bluebird.mapSeries(stepIds, async stepId => {
        try {
          return await this.gatherStepInput(cogConfig, stepId)
        } catch (e) {
          return e ? Promise.reject() : Promise.reject()
        }
      })
    } catch (e) {
      if (e) {}
      return
    }

    cli.action.start('Running')

    try {
      cogClient = await this.cogManager.startCogAndGetClient(cogConfig._runConfig, flags['use-ssl'])
    } catch (e) {
      this.log(`There was a problem starting cog ${args.cogName}: ${e && e.message ? e.message : 'unknown error'}`)
      this.log('You may need to reinstall it')
      process.exitCode = 1
      return
    }

    const step = new StepRunner({
      cog: args.cogName,
      stepText: '',
      client: cogClient,
      registries: this.registry,
      protoSteps: steps
    })

    this.log('\nAd-hoc scenario\n')
    const timer: Timer = new Timer()
    const responses: RunStepResponse[] = await this.runSteps(step, 2, false, true)
    responses.forEach((response: RunStepResponse) => {
      if (response.getOutcome() === RunStepResponse.Outcome.PASSED) {
        timer.addPassedStep()
      } else {
        timer.addFailedStep()
        process.exitCode = 1
      }
    })
    this.log()

    cli.action.stop('Done')
    timer.printTime(this.log.bind(this))
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

  protected async gatherStepIds(cogConfig: CogRegistryEntry): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!cogConfig.stepDefinitionsList) {
        reject()
        return
      }

      let response: string[] = []
      let n = 1
      const prompts: any = new Subject()
      const stepDefinitions = cogConfig.stepDefinitionsList
      const stepChoices = stepDefinitions.map(stepDef => {
        return {value: stepDef.stepId, name: stepDef.name}
      })

      inquirer.prompt(prompts).ui.process.subscribe(async answer => {
        if (answer.answer !== 'noMorePleaseThankYou') {
          response.push(answer.answer)
          prompts.next({
            name: 'step',
            message: `Step ${++n}`,
            type: 'list',
            choices: stepChoices
          })
        } else {
          prompts.complete()
        }
      }, () => {
        reject()
      }, () => {
        resolve(response)
      })

      prompts.next({
        name: 'step',
        message: `Step ${n}`,
        type: 'list',
        choices: stepChoices
      })
      stepChoices.push({value: 'noMorePleaseThankYou', name: '[No More Steps]'})
    })
  }

}
