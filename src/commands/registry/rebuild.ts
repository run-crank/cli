import {IConfig} from '@oclif/config'
import {Promise as Bluebird} from 'bluebird'

import {CogServiceClient} from '../../proto/cog_grpc_pb'
import {CogManifest, ManifestRequest} from '../../proto/cog_pb'
import RegistryAwareCommand from '../../registry-aware-command'
import {CogManager} from '../../services/cog-manager'
import {CogRegistryEntry} from '../../services/registries'

export class Rebuild extends RegistryAwareCommand {
  static description = 'Rebuild the Cog registry (not unlike blowing on an old video game cartridge)'
  static examples = [
    '$ crank registry:rebuild',
    '$ crank registry:rebuild my-org/my-cog'
  ]

  static args = [{
    name: 'cogName',
    description: 'The name of a specific Cog whose registry entry should be rebuilt',
    required: false,
  }]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    const {args} = this.parse(Rebuild)
    const registry = this.registry.buildCogRegistry().filter(entry => {
      if (args.cogName) {
        return entry.name === args.cogName
      }
      return true
    })

    if (args.cogName && registry.length === 0) {
      this.log(`Error rebuilding registry for ${args.cogName}`)
      this.log('  Cog not found')
      process.exitCode = 1
      return
    }

    await Bluebird.mapSeries(registry, this.rebuildCogRegistryEntry.bind(this))
  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

  protected async rebuildCogRegistryEntry(cogRegEntry: CogRegistryEntry) {
    this.log(`Rebuilding registry entry for ${cogRegEntry.name}`)

    return new Promise(async resolve => {
      let client: CogServiceClient

      if (!cogRegEntry._runConfig) {
        this.log(`No run configuration found for ${cogRegEntry.name}. Try re-installing.`)
        process.exitCode = 1
        resolve()
        return
      }

      const runConfig = cogRegEntry._runConfig

      try {
        client = await this.cogManager.startCogAndGetClient(runConfig, false)
      } catch (e) {
        this.log(`There was a problem rebuilding registry entry for ${cogRegEntry.name}`)
        if (e && e.message) {
          this.log('  ' + e.message)
        }
        process.exitCode = 1
        resolve()
        return
      }

      client.getManifest(new ManifestRequest(), async (err, manifest: CogManifest) => {
        if (err) {
          this.log(`Problem rebuilding registry entry for ${cogRegEntry.name}: ${err}`)
          process.exitCode = 1
          resolve()
          return
        }

        try {
          await this.installCogRegEntry(manifest, true, runConfig)
          this.log(`Successfully rebuilt registry entry for ${cogRegEntry.name}`)
          resolve()
        } catch (e) {
          this.log(e)
          process.exitCode = 1
          resolve()
        }
      })
    })
  }

}
