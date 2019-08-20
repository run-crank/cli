import {IConfig} from '@oclif/config'
import {flags} from '@oclif/parser'
import * as cp from 'child_process'
import * as debug from 'debug'
import * as inquirer from 'inquirer'

import registryAwareCommand from '../../registry-aware-command'

export default class Uninstall extends registryAwareCommand {
  static description = 'Uninstall a Cog from this system.'
  static examples = [
    '$ crank uninstall automatoninc/my-cog',
  ]

  static flags = {
    'ignore-auth': flags.boolean({
      description: 'Will retain any Cog auth details in cache'
    }),
    force: flags.boolean({
      description: 'Will uninstall the Cog without prompting for confirmation'
    }),
    'keep-docker-image': flags.boolean({
      description: 'Will keep the docker image associated with the Cog'
    }),
    debug: flags.boolean({
      description: 'More verbose output to aid in diagnosing issues using Crank',
    })
  }

  static args = [{name: 'cogName', required: true}]

  protected logDebug: debug.Debugger

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.logDebug = debug('crank:uninstall')
  }

  async init() {
    const {flags} = this.parse(Uninstall)
    if (flags.debug) {
      debug.enable('crank:*')
    }
  }

  async run() {
    const {args, flags} = this.parse(Uninstall)

    const regEntry = this.registry.getCogConfigFromRegistry(args.cogName)

    if (!regEntry) {
      this.log(`There's no Cog named ${args.cogName} installed. Maybe a typo?`)
      process.exitCode = 1
      return
    }

    if (!flags.force) {
      const stepCount = (regEntry.stepDefinitionsList || []).length
      const authCount = (regEntry.authFieldsList || []).length
      this.log(`${args.cogName} defines (${stepCount}) steps and (${authCount}) auth fields.`)
      const inquiry: any = await inquirer.prompt({
        name: 'confirm',
        type: 'confirm',
        default: false,
        message: `Are you sure you want to uninstall ${args.cogName}?`,
      })

      if (!inquiry.confirm) {
        return
      }
    }

    this.logDebug('Removing Cog registry entry from cache')
    this.registry.removeCogFromRegistry(args.cogName)
    this.log(`Uninstalled ${args.cogName}.`)

    if (regEntry._runConfig && regEntry._runConfig.dockerImage && !flags['keep-docker-image']) {
      this.log(`Removing docker image ${regEntry._runConfig.dockerImage}`)
      this.logDebug('Running `docker rmi %s`', regEntry._runConfig.dockerImage)
      cp.spawnSync('docker', ['rmi', regEntry._runConfig.dockerImage], {
        stdio: 'inherit'
      })
    }

    if (!flags['ignore-auth']) {
      this.logDebug('Removing Cog auth entry from cache')
      this.registry.removeAuthFromRegistry(args.cogName)
      this.log(`Removed ${args.cogName} Cog authentication details.`)
    }
  }

}
