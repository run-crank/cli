import {Promise as Bluebird} from 'bluebird'
import * as grpc from 'grpc'

import {AuthenticationError} from '../errors/authentication-error'
import {CogServiceClient} from '../proto/cog_grpc_pb'
import {RunStepRequest, RunStepResponse, Step as ProtoStep} from '../proto/cog_pb'
import {Registries} from '../services/registries'

/* tslint:disable:no-unused */

interface StepConstructorArgs {
  cog: string
  protoSteps: ProtoStep | ProtoStep[]
  stepText: string | string[]
  client?: CogServiceClient
  registries: Registries
}

export class Step {
  public cog: string
  public protoSteps: ProtoStep[]
  public stepText: string | string[]
  public client?: CogServiceClient

  private readonly auth: any = {}

  constructor({cog, protoSteps, stepText, client, registries}: StepConstructorArgs) {
    this.cog = cog
    this.protoSteps = protoSteps instanceof Array ? protoSteps : [protoSteps]
    this.stepText = stepText
    this.client = client

    const matchingReg = registries.buildCogRegistry().filter(a => a.name === cog)[0]
    const matchingAuth = registries.buildAuthRegistry().filter(a => a.cog === cog)

    // If this Cog does not expect any authentication details, then we are done.
    if (matchingReg && matchingReg.authFieldsList && matchingReg.authFieldsList.length === 0) {
      return
    }

    // If there is literally no auth registry entry, throw an error.
    if (matchingAuth.length !== 1) {
      this.throwAuthenticationError(
        `No authentication details found for ${cog}. Please run \`crank cog:auth ${cog}\` and try again`,
        matchingReg.authHelpUrl || matchingReg.homepage,
      )
    }

    // If every value on the auth registry entry is empty, throw an error.
    if (!this.checkRegistryAuthIsValid(matchingAuth[0].auth)) {
      this.throwAuthenticationError(
        `It looks like ${cog} isn't properly authenticated yet. Please run \`crank cog:auth ${cog}\` and try again`,
        matchingReg.authHelpUrl || matchingReg.homepage,
      )
    }

    // Otherwise, set the auth details!
    this.auth = matchingAuth[0].auth
  }

  public async runStep(): Promise<RunStepResponse> {
    const request = new RunStepRequest()
    request.setStep(this.protoSteps[0])
    const meta = this.getAuthMeta()

    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject('No client initialized.')
        return
      }

      this.client.runStep(request, meta, (err, response: RunStepResponse) => {
        if (err) {
          reject(err)
          return
        }

        if (response.getOutcome() === RunStepResponse.Outcome.PASSED) {
          resolve(response)
        } else {
          reject(response)
        }
      })
    })
  }

  public async runSteps(): Promise<RunStepResponse[]> {
    let hadFailure = false
    let responses: RunStepResponse[] = []

    if (!this.client) {
      return Promise.reject('No client initialized.')
    }

    const meta = this.getAuthMeta()
    const stream: grpc.ClientDuplexStream<RunStepRequest, RunStepResponse> = this.client.runSteps(meta)

    try {
      await Bluebird.mapSeries(this.protoSteps, protoStep => {
        return new Promise((resolve, reject) => {
          // Listen (only once) for data from the server.
          stream.once('data', (data: RunStepResponse) => {
            responses.push(data)
            if (data.getOutcome() !== RunStepResponse.Outcome.PASSED) {
              hadFailure = true
              reject()
            }
            resolve()
          })

          // Write the step request onto the stream.
          const request = new RunStepRequest()
          request.setStep(protoStep)
          stream.write(request)
        })
      })
    } catch (e) {}

    return new Promise((resolve, reject) => {
      stream.end()
      stream.on('end', () => {
        hadFailure ? reject(responses) : resolve(responses)
      })
    })
  }

  private getAuthMeta() {
    const meta = new grpc.Metadata()
    Object.keys(this.auth).forEach(key => {
      if (this.auth.hasOwnProperty(key)) {
        meta.add(key, this.auth[key])
      }
    })
    return meta
  }

  private checkRegistryAuthIsValid(authDetails: Record<string, any>): boolean {
    let emptyProps: string[] = []
    Object.keys(authDetails).forEach(prop => {
      if (authDetails.hasOwnProperty(prop)) {
        if (!authDetails[prop]) {
          emptyProps.push(prop)
        }
      }
    })

    return emptyProps.length < Object.keys(authDetails).length
  }

  private throwAuthenticationError(message: string, helpUrl = '') {
    const err = new AuthenticationError(message)
    if (helpUrl) {
      err.helpUrl = helpUrl
    }
    throw err
  }

}
