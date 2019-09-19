import * as fs from 'fs'
import {Struct} from 'google-protobuf/google/protobuf/struct_pb'
import * as YAML from 'yaml'

import {MissingStepError} from '../errors/missing-step-error'
import {Step} from '../proto/cog_pb'
import {Registries} from '../services/registries'

import {Step as RunnerStep} from './step'

const substitute = require('token-substitute')

// tslint:disable:prefer-object-spread
// tslint:disable:no-console

interface ScenarioConstructorArgs {
  registries: Registries
  fromFile: string
  tokenOverrides: Record<string, any>
}

export class Scenario {
  public name: string
  public description: string
  public steps: RunnerStep[]
  public optimizedSteps: (RunnerStep | RunnerStep[])[]

  private readonly registries: Registries

  constructor({registries, fromFile, tokenOverrides}: ScenarioConstructorArgs) {
    this.registries = registries

    const scenario = YAML.parse(fs.readFileSync(fromFile).toString('utf8'))
    const combinedTokens = Object.assign({}, (scenario.tokens || {}), tokenOverrides)
    let rawSteps = this.applyTokens(scenario.steps, combinedTokens)
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
            Object.keys(data).forEach((dataKey) => {
              if (typeof data[dataKey] === 'undefined') {
                delete data[dataKey]
              }
            });
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
      throw new MissingStepError(`Missing step definition for ${step.step}`)
    }

    return new RunnerStep({
      cog: cogName,
      protoSteps: protoStep,
      stepText: step.step || stepDefName || stepDefExpression || stepDefId,
      registries: this.registries,
      waitFor: step.waitFor || 0,
      failAfter: step.failAfter || 0,
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
