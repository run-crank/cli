import {IConfig} from '@oclif/config'
import {flags} from '@oclif/parser'
import {Promise as Bluebird} from 'bluebird'
import * as cp from 'child_process'
import {ServiceError} from 'grpc'
import * as inquirer from 'inquirer'

import {CogServiceClient} from '../../proto/cog_grpc_pb'
import {CogManifest, ManifestRequest} from '../../proto/cog_pb'
import RegistryAwareCommand from '../../registry-aware-command'
import {CogConfig, CogManager} from '../../services/cog-manager'
import {CogRegistryEntry} from '../../services/registries'

export default class Install extends RegistryAwareCommand {
  static description = 'Install an Automaton cog on this system.'
  static examples = [
    '$ crank install --source=local',
  ]

  static flags = {
    source: flags.string({
      description: 'Use if you are installing a locally developed cog',
      default: 'docker',
    }),
    'local-start-command': flags.string({
      description: 'Command to start the local cog (used in combo with --source=local)',
    }),
    force: flags.boolean({
      char: 'f',
      description: 'Install this cog over any preexisting installation with the same name'
    }),
    'ignore-auth': flags.boolean({
      description: 'Suppress prompts for cog auth details'
    })
  }

  static args = [{
    name: 'cogName',
    description: 'The name:version of the Cog to install (e.g. org-name/cog-name:1.0.0)',
  }]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    const {flags, args} = this.parse(Install)
    let cogConfig

    if (flags.source === 'docker') {
      // Check that a cog name was passed.
      if (!args.cogName) {
        this.log('You must specify the Cog to install.')
        process.exitCode = 1
        return
      }

      // Download from docker hub...
      this.log(`Attempting to pull ${args.cogName} from docker hub`)
      const dockerPullProc = cp.spawnSync('docker', ['pull', args.cogName], {
        stdio: 'inherit'
      })

      if (dockerPullProc.status !== 0) {
        this.log('There was a problem pulling the Cog from docker hub.')
        process.exitCode = 1
        return
      }

      cogConfig = {
        strategy: 'docker',
        dockerImage: args.cogName
      }
    } else {
      if (!flags['local-start-command']) {
        const inquiry: any = await inquirer.prompt({
          name: 'localStartCommand',
          type: 'input',
          message: `${Install.flags['local-start-command'].description} (e.g. npm start)`,
          validate: this.validateLocalCogCommand.bind(this)
        })
        flags['local-start-command'] = inquiry.localStartCommand
      }

      const cmd = flags['local-start-command'] || ''
      cogConfig = this.getCogConfigForLocalCommand(cmd)
    }

    try {
      const client = await this.cogManager.startCogAndGetClient(cogConfig, false)
      const cogRegEntry: CogRegistryEntry = await this.installCog(client, cogConfig, flags.force)
      const cogName = cogRegEntry.name || ''
      this.log(`Successfully installed ${cogName} cog.`)
      if (!cogRegEntry.authFieldsList || cogRegEntry.authFieldsList.length === 0 || flags['ignore-auth']) {
        return
      }

      this.log('Please provide authentication details required by the cog:')
      const authFields = await Bluebird.mapSeries(cogRegEntry.authFieldsList, async (authField): Promise<inquirer.Answer> => {
        return inquirer.prompt({
          name: authField.key,
          message: authField.description || authField.key,
          type: 'password'
        })
      })

      await this.installCogAuth(cogName, authFields)
    } catch (e) {
      this.log(`There was a problem installing the Cog: ${e && e.message ? e.message : 'unknown error'}`)
      process.exitCode = 1
      return
    }

  }

  async finally() {
    this.cogManager.stopAllCogs()
  }

  protected async validateLocalCogCommand(command: string): Promise<string | boolean> {
    const cogConfig = this.getCogConfigForLocalCommand(command)

    return new Promise(async (resolve, reject) => {
      if (!command) {
        reject('Start command is required')
        return
      }

      try {
        await this.cogManager.startCogAndGetClient(cogConfig, false)
        resolve(true)
      } catch (e) {
        let errMessage = `${command} doesn't appear to be a valid cog`
        if (e && e.message) {
          errMessage += `: ${e.message}`
        }
        reject(errMessage)
      }
    })
  }

  protected getCogConfigForLocalCommand(command: string): CogConfig {
    return {
      strategy: 'custom',
      cmd: command,
      cwd: process.cwd()
    }
  }

  protected async installCog(client: CogServiceClient, runConfig: any, force = false): Promise<CogRegistryEntry> {
    return new Promise((resolve, reject) => {
      client.getManifest(new ManifestRequest(), (err: ServiceError | null, manifest: CogManifest) => {
        if (err) {
          reject(err)
          return
        }

        this.installCogRegEntry(manifest, force, runConfig)
          .then(resolve)
          .catch(reject)
      })
    })
  }

}
