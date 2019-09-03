import {IConfig} from '@oclif/config'
import {Promise as Bluebird} from 'bluebird'
import * as inquirer from 'inquirer'

import RegistryAwareCommand from '../../registry-aware-command'
import {CogManager} from '../../services/cog-manager'

export class Auth extends RegistryAwareCommand {
  static description = '(Re-)Authenticate an installed Cog.'
  static examples = [
    '$ crank cog:auth MyCog',
  ]

  static args = [{
    name: 'cogName',
    required: true,
    description: 'The name/version of the Cog to authenticate.',
  }]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    const {args} = this.parse(Auth)
    const cogRegEntry = this.registry.getCogConfigFromRegistry(args.cogName)
    if (!cogRegEntry || !cogRegEntry.authFieldsList) {
      process.exitCode = 1
      this.log(`No Cog found named ${args.cogName}`)
      return
    }

    this.log('Please provide authentication details required by the cog:')
    const authFields = await Bluebird.mapSeries(cogRegEntry.authFieldsList, async (authField): Promise<inquirer.Answer> => {
      return inquirer.prompt({
        name: authField.key,
        message: authField.description || authField.key,
      })
    })

    await this.installCogAuth(args.cogName, authFields)
    this.log(`Successfully updated authentication details for ${args.cogName}`)
  }

}
