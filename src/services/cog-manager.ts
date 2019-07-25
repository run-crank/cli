import * as retry from 'async-retry'
import {Promise as BlueBird} from 'bluebird'
import {ChildProcess, spawn, spawnSync} from 'child_process'
import * as debug from 'debug'
import * as grpc from 'grpc'

import {Step} from '../models/step'
import {CogServiceClient} from '../proto/cog_grpc_pb'
import {ManifestRequest} from '../proto/cog_pb'

import {Registries} from './registries'
import {Ssl} from './ssl'

let privateInstance: CogManager

export interface CogConfig {
  strategy: string
  dockerImage?: string
  cmd?: string
  cwd?: string
}

interface CogManagerConstructorArgs {
  registries: Registries
  ssl?: Ssl
}

export class CogManager {
  private static instance: CogManager

  protected debug = false
  protected logDebug: debug.Debugger
  protected cogProcesses: ChildProcess[] = []
  private readonly dockerImageNames: string[] = []
  private readonly clientCache: any = {}
  private readonly host: string = 'localhost'
  private lastPort = 28865

  private readonly ssl: Ssl
  private readonly registries: Registries

  constructor({ssl, registries}: CogManagerConstructorArgs) {
    this.ssl = ssl || new Ssl()
    this.registries = registries
    this.logDebug = debug('crank:cogManager')

    if (CogManager.instance) {
      return CogManager.instance
    }

    CogManager.instance = this
    privateInstance = this
  }

  public setDebug(to: boolean) {
    this.debug = to
  }

  public async startCogAndGetClient(cogConfig: CogConfig, useSsl: boolean): Promise<CogServiceClient> {
    const cogIdentifier: string = cogConfig.dockerImage || cogConfig.cwd || ''
    let clientCredentials: grpc.ChannelCredentials
    let sslConfigs = null
    const cogPort = this.lastPort + 1
    this.lastPort++

    if (useSsl) {
      sslConfigs = this.ssl.getSslRequisites(this.host)
      clientCredentials = grpc.credentials.createSsl(
        Buffer.from(sslConfigs.certs.server, 'utf8'),
        Buffer.from(sslConfigs.keys.client.privateKey, 'utf8'),
        Buffer.from(sslConfigs.certs.client, 'utf8')
      )
    } else {
      clientCredentials = grpc.credentials.createInsecure()
    }

    this.startCog(this.host, cogPort, cogConfig, sslConfigs)

    this.logDebug('Attempting to establish connection with Cog %s', cogIdentifier)
    return retry(async () => {
      const client: CogServiceClient = await new Promise((resolve, reject) => {
        const client = new CogServiceClient(`${this.host}:${cogPort}`, clientCredentials)
        client.waitForReady(Date.now() + 10000, err => {
          if (err) {
            reject(err)
            return
          }

          // Validate it's actually ready by attempting to get its manifest.
          client.getManifest(new ManifestRequest(), err => {
            if (err) {
              reject(err)
              return
            }
            this.logDebug('Established connection with Cog %s', cogIdentifier)
            resolve(client)
          })
        })
      })
      return client
    }, {
      retries: 5,
      onRetry: err => {
        this.logDebug('Re-attempting Cog connection establishment with %s: %s', cogIdentifier, err.toString())
      }
    })
  }

  public startCog(cogHost: string, cogPort: number, config: CogConfig, sslConfig: any): void {
    let dockerImage = config.dockerImage || 'dockerImageNotSpecified'
    let dockerName = dockerImage.replace(/[\W_]+/g, '.')
    let cmd = config.cmd || 'commandNotSpecified'
    let sslEnv: any = {}
    let cogProc: ChildProcess
    let cogEnv: any
    let args: string[]

    if (sslConfig) {
      sslEnv.USE_SSL = '1'
      sslEnv.SSL_ROOT_CRT = Buffer.from(sslConfig.certs.client, 'utf8').toString('base64')
      sslEnv.SSL_CRT = Buffer.from(sslConfig.certs.server, 'utf8').toString('base64')
      sslEnv.SSL_KEY = Buffer.from(sslConfig.keys.server.privateKey, 'utf8').toString('base64')
    }

    if (config.strategy === 'docker') {
      args = ['run', '--rm', '-p', `${cogPort}:28866`, '-e', 'HOST=0.0.0.0', '--name', dockerName]
      Object.keys(sslEnv).forEach(envVar => {
        if (sslEnv.hasOwnProperty(envVar)) {
          args.push('-e')
          args.push(`${envVar}=${sslEnv[envVar]}`)
        }
      })
      args.push(dockerImage)
      this.logDebug('Running `docker %s`', args.join(' '))
      cogProc = spawn('docker', args, {
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
        },
        cwd: config.cwd || process.cwd(),
        stdio: this.debug ? 'inherit' : 'ignore',
        detached: true,
      })
      this.dockerImageNames.push(dockerName)
      this.cogProcesses.push(cogProc)
    } else if (config.strategy === 'custom') {
      /* tslint:disable:prefer-object-spread */
      cogEnv = Object.assign({
        HOME: process.env.HOME,
        PATH: process.env.PATH,
        PORT: cogPort,
        HOST: cogHost,
      }, sslEnv)
      const cmdParts = cmd.split(' ')
      this.logDebug('Running `%s`', cmdParts.join(' '))
      cogProc = spawn(cmdParts.shift() || cmd, cmdParts, {
        env: cogEnv,
        cwd: config.cwd || process.cwd(),
        stdio: this.debug ? 'inherit' : 'ignore',
        detached: true,
      })
      this.cogProcesses.push(cogProc)
    }
  }

  public async decorateStepsWithClients(steps: Step[], useSsl = false) {
    const cogRegistry = this.registries.buildCogRegistry()

    return BlueBird.mapSeries(steps, (step: Step, index: number) => {
      return new Promise(async (resolve, reject) => {
        const matches: any = cogRegistry.filter(cog => cog.name === step.cog)

        if (matches.length > 0) {
          if (this.clientCache.hasOwnProperty(matches[0].name)) {
            steps[index].client = this.clientCache[matches[0].name]
            resolve()
            return
          }

          try {
            this.clientCache[matches[0].name] = await this.startCogAndGetClient(matches[0]._runConfig, useSsl)
            steps[index].client = this.clientCache[matches[0].name]
            resolve()
          } catch (e) {
            reject(`Unable to start cog corresponding to "${step.stepText}": ${e && e.message ? e.message : 'unknown error'}`)
          }
        } else {
          reject(`Unable to find cog corresponding to ${step.stepText}`)
        }
      })
    })
  }

  public stopAllCogs() {
    if (this.cogProcesses) {
      this.cogProcesses.forEach((cog: ChildProcess) => {
        this.logDebug('Sending SIGINT to process %s', cog.pid)
        cog.kill('SIGINT')
        cog.kill()
        cog.unref()
      })
    }
    if (this.dockerImageNames) {
      this.dockerImageNames.forEach((image: string) => {
        this.logDebug('Running `docker kill %s`', image)
        spawnSync('docker', ['kill', image])
      })
    }
  }

}

// Always ensure all instantiated cogs are stopped.
function stopAllCogsGlobal() {
  if (privateInstance) {
    privateInstance.stopAllCogs()
  }
}

process.on('exit', stopAllCogsGlobal)
process.on('SIGINT', stopAllCogsGlobal)
process.on('SIGTERM', stopAllCogsGlobal)
