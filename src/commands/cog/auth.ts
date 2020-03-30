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
      this.error(`No Cog found named ${args.cogName}`, {exit: false})
      return this.exit(1)
    }

    if (!cogRegEntry.authFieldsList || cogRegEntry.authFieldsList.length === 0) {
      this.log("This Cog doesn't require authentication")
      return
    }

    // Check environment for supplied authentication details in the form of
    // CRANK_COG_NAME__AUTHFIELDKEY (all caps, where non-alphanum chars are
    // replaced with underscores).
    const envPrefix = `crank_${cogRegEntry.name}`.replace(/[^a-zA-Z0-9]+/g, '_')
    let authFields: any = cogRegEntry.authFieldsList.map(field => {
      const key = `${envPrefix}__${field.key.replace(/[^a-zA-Z0-9]+/g, '_')}`.toUpperCase()
      return process.env[key] ? {[field.key]: process.env[key]} : undefined
    })

    if (authFields.filter((a: any) => a === undefined).length) {
      this.log('Please provide authentication details required by the cog:')
      authFields = await Bluebird.mapSeries(cogRegEntry.authFieldsList, async (authField): Promise<inquirer.Answer> => {
        return inquirer.prompt({
          name: authField.key,
          message: authField.description || authField.key,
          type: this.authFieldMayBeSensitive(authField.key) ? 'password' : 'input',
          mask: this.authFieldMayBeSensitive(authField.key) ? '*' : undefined
        })
      })
    }

    await this.installCogAuth(args.cogName, authFields)
    this.log(`Successfully updated authentication details for ${args.cogName}`)
  }

}
