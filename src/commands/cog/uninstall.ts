import {flags} from '@oclif/parser'

import registryAwareCommand from '../../registry-aware-command'

export default class Uninstall extends registryAwareCommand {
  static description = 'Uninstall an Automaton cog from this system.'
  static examples = [
    '$ crank uninstall MyCog',
  ]

  static flags = {
    'ignore-auth': flags.boolean({
      description: 'Will retain any cog auth details in cache'
    })
  }

  static args = [{name: 'cogName', required: true}]

  async run() {
    const {args, flags} = this.parse(Uninstall)
    this.registry.removeCogFromRegistry(args.cogName)
    this.log(`Uninstalled ${args.cogName}.`)

    if (!flags['ignore-auth']) {
      this.registry.removeAuthFromRegistry(args.cogName)
      this.log(`Removed ${args.cogName} cog authentication details.`)
    }
  }

}
