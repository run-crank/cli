import * as retry from 'async-retry'
import {Promise as Bluebird} from 'bluebird'
import {Value} from 'google-protobuf/google/protobuf/struct_pb'
import * as grpc from 'grpc'
import * as uuidv4 from 'uuid/v4'

import {AuthenticationError} from '../errors/authentication-error'
import {CogServiceClient} from '../proto/cog_grpc_pb'
import {RunStepRequest, RunStepResponse, Step as ProtoStep, StepDefinition} from '../proto/cog_pb'
import {CogRegistryEntry, Registries, StepRegistryEntry} from '../services/registries'

/* tslint:disable:no-unused */

interface StepConstructorArgs {
  cog: string
  protoSteps: ProtoStep | ProtoStep[]
  stepText: string | string[]
  waitFor?: number | number[]
  failAfter?: number | number[]
  priorFailure?: boolean
  scenarioId: string
  client?: CogServiceClient
  registries: Registries
}

export class Step {
  public cog: string
  public protoSteps: ProtoStep[]
  public stepText: string | string[]
  public client?: CogServiceClient
  public waitFor: number[]
  public failAfter: number[]
  public priorFailure: boolean

  private readonly auth: any = {}
  private readonly reg: CogRegistryEntry
  private readonly requestId: string
  private readonly scenarioId: string
  private readonly requestorId: string

  constructor({cog, protoSteps, stepText, client, registries, waitFor, failAfter, scenarioId, priorFailure = false}: StepConstructorArgs) {
    this.cog = cog
    this.protoSteps = protoSteps instanceof Array ? protoSteps : [protoSteps]
    this.stepText = stepText
    this.client = client
    this.waitFor = waitFor && waitFor instanceof Array ? waitFor : [(waitFor || 0)]
    this.failAfter = failAfter && failAfter instanceof Array ? failAfter : [(failAfter || 0)]
    this.priorFailure = priorFailure
    this.requestId = uuidv4()
    this.scenarioId = scenarioId
    this.requestorId = registries.getRegistryRequestorId()

    const matchingReg = registries.buildCogRegistry().filter(a => a.name === cog)[0]
    const matchingAuth = registries.buildAuthRegistry().filter(a => a.cog === cog)
    this.reg = matchingReg

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
    // Wait before running this step, if configured.
    await this.waitBeforeExecution()
    const startedAt = Date.now()

    const request = new RunStepRequest()
    request.setStep(this.protoSteps[0])
    request.setRequestId(this.requestId)
    request.setScenarioId(this.scenarioId)
    request.setRequestorId(this.requestorId)
    const meta = this.getAuthMeta()

    // Well, this is getting quite unwieldy, isn't it?
    return new Promise(async (returnResponse, rejectResponse) => {
      try {
        await retry(bail => {
          return new Promise((doneTrying, keepTrying) => {
            if (!this.client) {
              bail(new Error('No client initialized.'))
              return
            }

            this.client.runStep(request, meta, (err, response: RunStepResponse) => {
              if (err) {
                bail(err)
                return
              }

              if (response.getOutcome() === RunStepResponse.Outcome.PASSED) {
                doneTrying(returnResponse(response))
              } else {
                if (this.shouldRetryStep(startedAt)) {
                  keepTrying(response)
                } else {
                  // If configured to retry and we still failed, append helpful
                  // error text indicating how long we tried before giving up.
                  if (this.failAfter[0]) {
                    let originalResponse = response.getMessageFormat()
                    originalResponse += ' (after %s)'
                    response.setMessageFormat(originalResponse)
                    response.addMessageArgs(Value.fromJavaScript(`${Math.ceil((Date.now() - startedAt) / 1000)}s`))
                  }
                  rejectResponse(response)
                  bail(new Error('Ran out of time before getting a satisfactory response.'))
                }
              }
            })
          })
        }, {
          retries: 1000,
          factor: 1.25,
          minTimeout: 5000,
          maxTimeout: 120000,
        })
      } catch (e) {
        // Error handled above. Catching here prevents an ugly stacktrace, etc.
      }
    })
  }

  public async runSteps(): Promise<RunStepResponse[]> {
    let hadFailure = this.priorFailure
    let responses: RunStepResponse[] = []

    if (!this.client) {
      return Promise.reject('No client initialized.')
    }

    const meta = this.getAuthMeta()
    const stream: grpc.ClientDuplexStream<RunStepRequest, RunStepResponse> = this.client.runSteps(meta)

    // Well, this is getting quite unwieldy, isn't it?
    try {
      await Bluebird.mapSeries(this.protoSteps, (protoStep, stepNumber) => {
        return new Promise(async (returnResponse, rejectResponse) => {
          try {
            // Wait before executing this step (if configured)
            await this.waitBeforeExecution(stepNumber)
            const startedAt = Date.now()

            await retry(bail => {
              return new Promise((doneTrying, keepTrying) => {
                // Listen (only once) for data from the server.
                stream.once('data', (data: RunStepResponse) => {
                  if (data.getOutcome() !== RunStepResponse.Outcome.PASSED) {
                    if (this.shouldRetryStep(startedAt, stepNumber)) {
                      // Have to pass an empty object due to bug in async-retry...
                      keepTrying({})
                    } else {
                      hadFailure = true
                      // If configured to retry and we still failed, append helpful
                      // error text indicating how long we tried before giving up.
                      if (this.failAfter[stepNumber]) {
                        let originalResponse = data.getMessageFormat()
                        originalResponse += ' (after %s)'
                        data.setMessageFormat(originalResponse)
                        data.addMessageArgs(Value.fromJavaScript(`${Math.ceil((Date.now() - startedAt) / 1000)}s`))
                      }
                      responses.push(data)
                      // If this is a validation step, and the next step is a
                      // validation step, then resolve, allowing the next step
                      // to execute. Otherwise, reject, preventing any further
                      // step execution.
                      if (this.isValidationStep(stepNumber) && !!this.protoSteps[stepNumber + 1] && this.isValidationStep(stepNumber + 1)) {
                        doneTrying(returnResponse())
                      } else {
                        rejectResponse()
                        bail(new Error('Ran out of time before getting a satisfactory response.'))
                      }
                    }
                  } else {
                    responses.push(data)
                    // If this is a validation step, and the next step isn't,
                    // (or there is no next step) and a step has already failed,
                    // then reject. Otherwise, carry on.
                    if (hadFailure && this.isValidationStep(stepNumber) && (!this.protoSteps[stepNumber + 1] || !this.isValidationStep(stepNumber + 1))) {
                      rejectResponse()
                      bail(new Error('A prior consecutive validation step failed. Aborting before moving on to '))
                    } else {
                      doneTrying(returnResponse())
                    }
                  }
                })

                // Write the step request onto the stream.
                const request = new RunStepRequest()
                request.setStep(protoStep)
                request.setRequestId(this.requestId)
                request.setScenarioId(this.scenarioId)
                request.setRequestorId(this.requestorId)
                stream.write(request)
              })
            }, {
              retries: 1000,
              factor: 1.25,
              minTimeout: 5000,
              maxTimeout: 120000,
            })
          } catch (e) {
            // Error handled above. Catching here prevents an ugly stacktrace, etc.
          }
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

  /**
   * Returns whether or not the given step (identified by index) is of type
   * `validation`.
   *
   * @param stepIndex - Step to check whether or not is of type validation.
   */
  public isValidationStep(stepIndex: number): boolean {
    if (!this.reg.stepDefinitionsList) {
      return false
    }

    const stepReg: StepRegistryEntry = this.reg.stepDefinitionsList.filter(s => s.stepId === this.protoSteps[stepIndex].getStepId())[0]
    return stepReg.type === StepDefinition.Type.VALIDATION
  }

  protected async waitBeforeExecution(stepNumber = 0) {
    if (this.waitFor[stepNumber] <= 0) {
      return
    }

    return new Promise((resolve: () => void) => {
      setTimeout(resolve, this.waitFor[stepNumber] * 1000)
    })
  }

  /**
   * Returns whether or not the step should be retried.
   *
   * @param startedAt - The timestamp (ms) when the step started executing.
   *
   * @param stepNumber - If this step represents an optimized set of multiple
   *   steps, then this number represents the zero-index'd step number whose
   *   failAfter setting should be checked.
   */
  protected shouldRetryStep(startedAt: number, stepNumber = 0): boolean {
    return Date.now() - startedAt < (this.failAfter[stepNumber] * 1000)
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
