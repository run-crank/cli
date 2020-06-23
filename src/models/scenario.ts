import * as fs from 'fs'
import {Struct} from 'google-protobuf/google/protobuf/struct_pb'
import * as uuidv4 from 'uuid/v4'
import * as YAML from 'yaml'

import {InvalidScenarioError} from '../errors/invalid-scenario-error'
import {MissingStepError} from '../errors/missing-step-error'
import {Step} from '../proto/cog_pb'
import {Registries} from '../services/registries'

import {Step as RunnerStep} from './step'

const substitute = require('token-substitute')
const chrono = require('chrono-node')

// tslint:disable:prefer-object-spread
// tslint:disable:no-console
// tslint:disable:ignore no-unused

interface ScenarioConstructorArgs {
  registries: Registries
  fromFile: string
  tokenOverrides: Record<string, any>
}

export class Scenario {
  public readonly id: string
  public name: string
  public description: string
  public tokens: Record<string, any>
  public steps: RunnerStep[]
  public optimizedSteps: (RunnerStep | RunnerStep[])[]
  public file: string

  private readonly registries: Registries

  constructor({registries, fromFile, tokenOverrides}: ScenarioConstructorArgs) {
    let scenario: Record<string, any>
    this.registries = registries
    this.file = fromFile
    this.id = uuidv4()

    try {
      scenario = YAML.parse(fs.readFileSync(fromFile).toString('utf8'))
    } catch (e) {
      throw new InvalidScenarioError(`Unable to parse the scenario file (${fromFile})`)
    }

    // Ensure there is a steps key and that it is an array.
    if (!scenario || !scenario.steps || !Array.isArray(scenario.steps)) {
      throw new InvalidScenarioError(`Scenario is missing a list of steps (${fromFile})`)
    }

    this.tokens = Object.assign({}, (scenario.tokens || {}), tokenOverrides)
    let rawSteps = this.applyTokens(scenario.steps, this.tokens)
    rawSteps = this.replaceSpecialDateTokens(rawSteps)
    this.name = scenario.scenario
    this.description = scenario.description
    this.steps = rawSteps.map((step: any) => {
      return this.getRunnerStepForStep(step)
    })
    this.optimizedSteps = this.optimizeSteps(this.steps)
  }

  protected getRunnerStepForStep(step: any): RunnerStep {
    let protoStep: Step = new Step()
    let cogName = ''
    let stepDefName = ''
    let stepDefExpression = ''
    let stepDefId = ''
    let data: any = step.data ? step.data : {}
    const stepRegistry = this.registries.buildStepRegistry()

    // If all necessary details were provided, sweet.
    if (!step.step && step.stepId && step.cog) {
      protoStep.setStepId(step.stepId)
      protoStep.setData(Struct.fromJavaScript(step.data))
      cogName = step.cog
      stepDefId = step.stepId
    } else {
      // Otherwise, try and match this step expression against the registry.
      stepRegistry.forEach((stepDef: any) => {
        const StepRegex: RegExp = new RegExp(stepDef.expression, 'i')
        let matches

        if (matches = StepRegex.exec(step.step)) {
          protoStep.setStepId(stepDef.stepId)

          if (matches.hasOwnProperty('groups')) {
            data = Object.assign(data, matches.groups)

            // Allow for optional fields.
            Object.keys(data).forEach(dataKey => {
              if (data[dataKey] === undefined) {
                delete data[dataKey]
              }
            })
          }

          protoStep.setData(Struct.fromJavaScript(data))
          cogName = stepDef._cog
          stepDefExpression = stepDef.expression
          stepDefId = stepDef.stepId
          stepDefName = stepDef.name
        }
      })
    }

    if (!protoStep.getStepId()) {
      throw new MissingStepError(`Missing step definition for "${step.step}" (${this.file})`)
    }

    return new RunnerStep({
      cog: cogName,
      tokens: this.tokens,
      protoSteps: protoStep,
      stepText: step.step || stepDefName || stepDefExpression || stepDefId,
      registries: this.registries,
      waitFor: step.waitFor || 0,
      failAfter: step.failAfter || 0,
      scenarioId: this.id,
    })
  }

  protected applyTokens(steps: any[], tokens: Record<string, any>) {
    try {
      return substitute(steps, {
        tokens,
        prefix: '{{',
        suffix: '}}',
        preserveUnknownTokens: true,
      })
      // tslint:disable-next-line:no-unused
    } catch (e) {
      console.error('Error substituting token values, but continuing. Check your tokens')
      return steps
    }
  }

  protected replaceSpecialDateTokens(steps: any[]) {
    const dateAnchor = new Date()

    const replaceDateTokens = (text: any): any => {
      const dateRegex = /{{date\(([^[\(\)]*)\)}}/gm
      let returnString = text
      let match

      if (typeof text !== 'string') {
        return text
      }

      // Iterate through all potential matches (in case more than 1 in a step).
      while (match = dateRegex.exec(text)) {
        // This is necessary to avoid infinite loops with zero-width matches.
        if (match.index === dateRegex.lastIndex) {
          dateRegex.lastIndex++
        }

        try {
          returnString = returnString.replace(match[0], chrono.parseDate(match[1], dateAnchor).toISOString())
        } catch (e) {
          throw new InvalidScenarioError(`Unable to parse token ${match[0]} as date (${this.file})`)
        }
      }

      return returnString
    }

    steps.forEach((step: any) => {
      // Replace any step text.
      step.step = replaceDateTokens.call(this, step.step)

      // If there is a data property, replace any keys and sub-keys.
      if (step.hasOwnProperty('data')) {
        Object.keys(step.data).forEach((key: string) => {
          if (step.data.hasOwnProperty(key)) {
            if (step.data[key].constructor === Object) {
              Object.keys(step.data[key]).forEach((subKey: string) => {
                step.data[key][subKey] = replaceDateTokens.call(this, step.data[key][subKey])
              })
            } else {
              step.data[key] = replaceDateTokens.call(this, step.data[key])
            }
          }
        })
      }
    })

    return steps
  }

  protected optimizeSteps(steps: RunnerStep[]): (RunnerStep | RunnerStep[])[] {
    let optimized: RunnerStep[][] = []
    let currentIndex = 0

    for (let i = 0; i < steps.length; i++) {
      if (i === 0) {
        optimized[currentIndex] = [steps[i]]
      } else {
        if (optimized[currentIndex][0].cog === steps[i].cog) {
          optimized[currentIndex].push(steps[i])
        } else {
          currentIndex++
          optimized[currentIndex] = [steps[i]]
        }
      }
    }

    const optimizedSteps: (RunnerStep | RunnerStep[])[] = optimized.map(elem => {
      if (elem.length === 1) {
        return elem[0]
      } else {
        return elem
      }
    })

    return optimizedSteps
  }
}
