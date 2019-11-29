import chalk from 'chalk'
import {Struct, Value} from 'google-protobuf/google/protobuf/struct_pb'
import * as inquirer from 'inquirer'
import * as moment from 'moment'
import {Subject} from 'rxjs'
import {URL} from 'url'
import * as util from 'util'

import {Step as StepRunner} from './models/step'
import {FieldDefinition, RunStepResponse, Step as ProtoStep} from './proto/cog_pb'
import RegistryAwareCommand from './registry-aware-command'
import {CogRegistryEntry} from './services/registries'

interface PrintStepArgs {
  step: StepRunner
  stepIndex?: number
  stepResponse: RunStepResponse
  indent: number
  printStepText: boolean
  printMessage: boolean
}

export default abstract class extends RegistryAwareCommand {
  protected async runStep(stepRunner: StepRunner, indentBy = 0, shouldPrintStepText = true, shouldPrintSuccessMessage = false): Promise<RunStepResponse> {
    let response: RunStepResponse

    try {
      response = await stepRunner.runStep()
    } catch (responseError) {
      response = responseError
    }

    this.printStepResult({
      step: stepRunner,
      stepResponse: response,
      indent: indentBy,
      printMessage: shouldPrintSuccessMessage,
      printStepText: shouldPrintStepText
    })

    if (response.getOutcome() === RunStepResponse.Outcome.PASSED) {
      return response
    } else {
      throw response
    }
  }

  protected async runSteps(stepRunner: StepRunner, indentBy = 0, shouldPrintStepText = true, shouldPrintSuccessMessage = false): Promise<RunStepResponse[]> {
    let responses: RunStepResponse[] = []
    let hasErrors = false

    try {
      responses = await stepRunner.runSteps()
    } catch (responsesWithErrors) {
      responses = responsesWithErrors
      hasErrors = true
    }

    responses.forEach((response, i) => {
      this.printStepResult({
        step: stepRunner,
        stepIndex: i,
        stepResponse: response,
        indent: indentBy,
        printMessage: shouldPrintSuccessMessage,
        printStepText: shouldPrintStepText
      })
    })

    if (hasErrors) {
      throw responses
    } else {
      return responses
    }
  }

  protected printStepResult({step, stepIndex, stepResponse, indent, printStepText, printMessage}: PrintStepArgs): void {
    const passed = stepResponse.getOutcome() === RunStepResponse.Outcome.PASSED
    const color = passed ? chalk.green : chalk.red
    const symbol = passed ? '\u2713' : '\u2718'
    let prefix = ' '.repeat(indent)
    let stepTextPrinted = false
    let stepText: any

    if (printStepText && step.stepText) {
      stepText = stepIndex === undefined ? step.stepText : step.stepText[stepIndex]
      this.log(`${prefix}${color(`${symbol} ${stepText}`)}`)
      stepTextPrinted = true
      if (!passed) {
        prefix += '  '
      }
    }

    if (printMessage || !passed) {
      const formatArgs: any = stepResponse.getMessageArgsList().map((value: Value) => {
        // If the value is null, replace with empty string.
        const jsValue = value.toJavaScript()
        return jsValue === null ? '' : jsValue
      })
      formatArgs.unshift(stepResponse.getMessageFormat())
      const resultMessage: string = util.format.apply(util, formatArgs)
      if (stepTextPrinted) this.log()
      this.log(`${prefix}${color(resultMessage)}`)
      if (stepTextPrinted) this.log()
    }
  }

  protected async gatherStepInput(cogConfig: CogRegistryEntry, stepId: string): Promise<ProtoStep> {
    const optionalMsg = 'Field is optional. Press enter to skip.'
    if (!cogConfig || !cogConfig._runConfig || !cogConfig.stepDefinitionsList) {
      this.log(`Couldn't find a Cog named ${cogConfig.name}`)
      process.exitCode = 1
      throw new Error('Cog not found')
    }

    const matchingFields: any[] = cogConfig.stepDefinitionsList.filter(stepDef => {
      return stepDef.stepId === stepId
    })
    if (matchingFields.length === 0) {
      this.log(`Couldn't find step ${stepId} on ${cogConfig.name} cog.`)
      process.exitCode = 1
      throw new Error('Step not found')
    }
    const expectedFields: any[] = matchingFields[0].expectedFieldsList

    const fieldResponses: any = await new Promise((resolve, reject) => {
      let hasObjectNeed = false
      let lastDynamicKey: string
      let lastParentKey: string
      let response: any = {}
      const prompts: any = new Subject()

      inquirer.prompt(prompts).ui.process.subscribe(answer => {
        let parentKey: string
        if (answer.name.indexOf('nonscalar.') === 0) {
          if (answer.name.indexOf('.key') === answer.name.length - 4) {
            parentKey = answer.name.replace('nonscalar.', '').replace('.key', '')
            lastDynamicKey = answer.answer
            lastParentKey = parentKey

            // Scrub out the optional message, don't even set a key.
            if (answer.answer !== optionalMsg) {
              try {
                response[parentKey] = response[parentKey] || {}
                response[parentKey][answer.answer] = null
                // tslint:disable-next-line:no-unused
              } catch (e) {}
            }
          } else if (answer.name.indexOf('.value') === answer.name.length - 6) {
            parentKey = answer.name.replace('nonscalar.', '').replace('.value', '')

            // Scrub out the optional message, don't even set a key.
            if (answer.answer !== optionalMsg) {
              try {
                response[parentKey][lastDynamicKey] = answer.answer
                // tslint:disable-next-line:no-unused
              } catch (e) {}
            }
          }
        } else {
          if (answer.name === ':internal:confirm:') {
            if (answer.answer) {
              prompts.next({
                name: `nonscalar.${lastParentKey}.key`,
                message: `${lastParentKey} object key`,
                type: 'input',
              })
              prompts.next({
                name: `nonscalar.${lastParentKey}.value`,
                message: `${lastParentKey} object value`,
                type: 'input',
              })
              prompts.next({
                name: ':internal:confirm:',
                message: `Add another ${lastParentKey} field?`,
                type: 'confirm'
              })
            } else {
              prompts.complete()
            }
          } else {
            // Scrub out the optional message, don't even set a key.
            if (answer.answer !== optionalMsg) {
              response[answer.name] = answer.answer
            }
          }
        }
      }, () => {
        reject()
      }, () => {
        resolve(response)
      })

      expectedFields.forEach(field => {
        if (field.type === FieldDefinition.Type.ANYNONSCALAR || field.type === FieldDefinition.Type.MAP) {
          prompts.next({
            name: `nonscalar.${field.key}.key`,
            message: `${field.key} object key`,
            type: 'input',
            default: field.optionality === FieldDefinition.Optionality.OPTIONAL ? optionalMsg : null,
          })
          prompts.next({
            name: `nonscalar.${field.key}.value`,
            message: `${field.key} object value`,
            type: 'input',
            default: field.optionality === FieldDefinition.Optionality.OPTIONAL ? optionalMsg : null,
          })
          prompts.next({
            name: ':internal:confirm:',
            message: `Add another ${field.key} field?`,
            type: 'confirm'
          })
          hasObjectNeed = true
        } else {
          prompts.next({
            name: field.key,
            message: field.description || field.key,
            type: 'input',
            default: field.optionality === FieldDefinition.Optionality.OPTIONAL ? optionalMsg : null,
            validate: (input: any) => {
              // Assume optional message text as valid; it's scrubbed out later.
              if (input === optionalMsg) {
                return true
              }

              let isValid: boolean | string = true
              if (field.type === FieldDefinition.Type.BOOLEAN) {
                if (['true', 'false'].indexOf(input) === -1) {
                  isValid = `Unable to parse ${input} as a boolean. Must be one of: true, false`
                }
              } else if (field.type === FieldDefinition.Type.DATE || field.type === FieldDefinition.Type.DATETIME) {
                const parsedDate = moment(input)
                if (parsedDate.isValid() === false) {
                  isValid = `Unable to parse ${input} as a date${field.type === FieldDefinition.Type.DATETIME ? 'time' : ''}.`
                }
              } else if (field.type === FieldDefinition.Type.EMAIL) {
                const emailRegexIsh = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                if (!emailRegexIsh.test(input)) {
                  isValid = `Unable to parse ${input} as an email. Please enter a valid email address`
                }
              } else if (field.type === FieldDefinition.Type.NUMERIC) {
                if (!(!isNaN(parseFloat(input)) && isFinite(input))) {
                  isValid = `Unable to parse ${input} as a number. Please enter a numeric value`
                }
              } else if (field.type === FieldDefinition.Type.URL) {
                try {
                  new URL(input)
                  // tslint:disable-next-line:no-unused
                } catch (e) {
                  isValid = `Unable to parse ${input} as a URL. Please enter a valid URL, including protocol.`
                }
              }
              return isValid
            }
          })
        }
      })

      if (!hasObjectNeed) {
        prompts.complete()
      }
    })

    const protoStep = new ProtoStep()
    protoStep.setStepId(stepId)
    protoStep.setData(Struct.fromJavaScript(fieldResponses || {}))

    return protoStep
  }

  protected coerceProtoStepTypes(protoStep: ProtoStep, cogName: string) {
    const rawData = protoStep.getData()
    const data: Record<string, any> = rawData ? rawData.toJavaScript() : {}
    const stepRegistry = this.registry.buildStepRegistry()
    const stepDef = stepRegistry.filter(step => {
      return step.stepId === protoStep.getStepId() && step._cog === cogName
    })[0]
    stepDef.expectedFieldsList.forEach(field => {
      // Only coerce values that are set.
      if (data.hasOwnProperty(field.key)) {
        // For boolean fields
        if (field.type === FieldDefinition.Type.BOOLEAN) {
          // Only coerce if the type is not already boolean
          if (typeof data[field.key] !== 'boolean') {
            data[field.key] = data[field.key] === 'true'
          }
        }

        // For numeric fields
        if (field.type === FieldDefinition.Type.NUMERIC) {
          // Only coerce if the type is not already numeric and its parsed
          // version is a real number.
          if (typeof data[field.key] !== 'number' && !Number.isNaN(parseFloat(data[field.key]))) {
            data[field.key] = parseFloat(data[field.key])
          }
        }

        // For date fields
        if (field.type === FieldDefinition.Type.DATE) {
          data[field.key] = moment(data[field.key]).utc().format('YYYY-MM-DD')
        }

        // For datetime fields
        if (field.type === FieldDefinition.Type.DATETIME) {
          data[field.key] = moment(data[field.key]).utc().format('YYYY-MM-DDTHH:mm:ss')
        }
      }
    })
    protoStep.setData(Struct.fromJavaScript(data))
  }

}
