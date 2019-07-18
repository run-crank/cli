import chalk from 'chalk'
import {Struct, Value} from 'google-protobuf/google/protobuf/struct_pb'
import * as inquirer from 'inquirer'
import {Subject} from 'rxjs'
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
        return value.toJavaScript()
      })
      formatArgs.unshift(stepResponse.getMessageFormat())
      const resultMessage: string = util.format.apply(util, formatArgs)
      if (stepTextPrinted) this.log()
      this.log(`${prefix}${color(resultMessage)}`)
      if (stepTextPrinted) this.log()
    }
  }

  protected async gatherStepInput(cogConfig: CogRegistryEntry, stepId: string): Promise<ProtoStep> {
    if (!cogConfig || !cogConfig._runConfig || !cogConfig.stepDefinitionsList) {
      this.log(`Couldn't find a cog named ${cogConfig.name}`)
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
            response[parentKey] = response[parentKey] || {}
            response[parentKey][answer.answer] = null
          } else if (answer.name.indexOf('.value') === answer.name.length - 6) {
            parentKey = answer.name.replace('nonscalar.', '').replace('.value', '')
            response[parentKey][lastDynamicKey] = answer.answer
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
            response[answer.name] = answer.answer
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
          })
          prompts.next({
            name: `nonscalar.${field.key}.value`,
            message: `${field.key} object value`,
            type: 'input',
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
            type: 'input'
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

}
