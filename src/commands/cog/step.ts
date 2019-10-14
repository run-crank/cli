import {IConfig} from '@oclif/config'
import {flags} from '@oclif/parser'
import cli from 'cli-ux'
import * as debug from 'debug'
import * as inquirer from 'inquirer'

import {Step as StepRunner} from '../../models/step'
import {CogServiceClient} from '../../proto/cog_grpc_pb'
import {Step as ProtoStep} from '../../proto/cog_pb'
import {CogManager} from '../../services/cog-manager'
import StepAwareCommand from '../../step-aware-command'

export default class Step extends StepAwareCommand {
  static description = 'Run a single Cog step interactively.'
  static examples = [
    '$ crank cog:step MyCog',
    '$ crank cog:step MyCog --step=MyStepId'
  ]

  static flags = {
    'use-ssl': flags.boolean({
      char: 's',
      description: 'Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs you are building).'
    }),
    step: flags.string({
      description: 'The stepId of the step you wish to run'
    }),
    debug: flags.boolean({
      description: 'More verbose output to aid in diagnosing issues using Crank',
    })
  }

  static args = [{name: 'cogName', required: true}]

  protected cogManager: CogManager
  protected logDebug: debug.Debugger

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
    this.logDebug = debug('crank:step')
  }

  async init() {
    const {flags} = this.parse(Step)
    if (flags.debug) {
      debug.enable('crank:*')
      this.cogManager.setDebug(true)
    }
  }

  async run() {
    const {args, flags} = this.parse(Step)
    const cogConfig = this.registry.getCogConfigFromRegistry(args.cogName)
    let cogClient: CogServiceClient
    if (!cogConfig || !cogConfig._runConfig || !cogConfig.stepDefinitionsList) {
      this.log(`Couldn't find a Cog named ${args.cogName}`)
      process.exitCode = 1
      return
    }

    let stepId = flags.step || ''
    if (!stepId) {
      this.logDebug('Prompting for step name')
      const stepResponse: any = await inquirer.prompt({
        name: 'step',
        message: 'Step',
        type: 'list',
        choices: cogConfig.stepDefinitionsList.map(stepDef => {
          return {value: stepDef.stepId, name: stepDef.name}
        })
      })
      stepId = stepResponse.step
    }

    this.logDebug('Building protobuffer step for %s', stepId)
    const protoStep: ProtoStep = await this.gatherStepInput(cogConfig, stepId)
    this.coerceProtoStepTypes(protoStep, args.cogName)

    try {
      this.logDebug('Attempting to start Cog')
      cogClient = await this.cogManager.startCogAndGetClient(cogConfig._runConfig, flags['use-ssl'])
    } catch (e) {
      this.log(`There was a problem starting Cog ${args.cogName}: ${e && e.message ? e.message : 'unknown error'}`)
      this.log('You may need to reinstall it')
      process.exitCode = 1
      return
    }

    cli.action.start('Running')

    const step = new StepRunner({
      cog: args.cogName,
      stepText: '',
      client: cogClient,
      registries: this.registry,
      protoSteps: [protoStep]
    })

    this.log()
    try {
      await this.runStep(step, 2, false, true)
    } catch (e) {
      process.exitCode = e ? 1 : 1
    }
    this.log()

    cli.action.stop('Done')
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

}
