import {flags} from '@oclif/parser'
import * as cp from 'child_process'
import * as inquirer from 'inquirer'

import registryAwareCommand from '../../registry-aware-command'

export default class Uninstall extends registryAwareCommand {
  static description = 'Uninstall an Automaton cog from this system.'
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
    })
  }

  static args = [{name: 'cogName', required: true}]

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

    this.registry.removeCogFromRegistry(args.cogName)
    this.log(`Uninstalled ${args.cogName}.`)

    if (regEntry._runConfig && regEntry._runConfig.dockerImage && !flags['keep-docker-image']) {
      this.log(`Removing docker image ${regEntry._runConfig.dockerImage}`)
      cp.spawnSync('docker', ['rmi', regEntry._runConfig.dockerImage], {
        stdio: 'inherit'
      })
    }

    if (!flags['ignore-auth']) {
      this.registry.removeAuthFromRegistry(args.cogName)
      this.log(`Removed ${args.cogName} cog authentication details.`)
    }
  }

}
