import Command from '@oclif/command'
import {IConfig} from '@oclif/config'
import * as inquirer from 'inquirer'

import {CogManifest} from './proto/cog_pb'
import {CogConfig} from './services/cog-manager'
import {AuthRegistryEntry, CogRegistryEntry, Registries} from './services/registries'

export default abstract class extends Command {
  protected registry: Registries

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.registry = new Registries(process.env.CRANK_CACHEDIR || this.config.cacheDir)
  }

  protected installCogAuth(cogName: string, authFields: inquirer.Answer[]): void {
    const authEntry: AuthRegistryEntry = {
      cog: cogName,
      auth: {}
    }

    authFields.forEach((field: any) => {
      const key: string = Object.keys(field)[0]
      authEntry.auth[key] = field[key]
    })

    this.registry.addAuthRegistryEntry(authEntry)
  }

  protected async installCogRegEntry(manifest: CogManifest, force: boolean, runConfig: CogConfig | null = null): Promise<CogRegistryEntry> {
    return new Promise((resolve, reject) => {
      const cogRegEntry: CogRegistryEntry = manifest.toObject()

      if (runConfig) {
        cogRegEntry._runConfig = runConfig
      }

      try {
        this.registry.addToCogRegistry(cogRegEntry, force)
        resolve(cogRegEntry)
      } catch (e) {
        reject(e)
      }
    })
  }

  protected authFieldMayBeSensitive(key: string): boolean {
    const lkey = key.toLowerCase()
    return lkey.includes('key') || lkey.includes('pass') || lkey.includes('secret')
  }

}
