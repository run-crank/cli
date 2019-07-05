import Command from '@oclif/command'
import {Struct, Value} from 'google-protobuf/google/protobuf/struct_pb'
import * as grpc from 'grpc'

import {CogServiceService, ICogServiceServer} from '../../proto/cog_grpc_pb'
import {CogManifest, FieldDefinition, ManifestRequest, RunStepRequest, RunStepResponse, Step, StepDefinition} from '../../proto/cog_pb'

let server: grpc.Server

export default class Meta extends Command {
  static hidden = true

  async run() {
    server = new grpc.Server()
    const port = process.env.PORT || 28866
    const host = process.env.HOST || '0.0.0.0'
    let credentials: grpc.ServerCredentials

    if (process.env.USE_SSL) {
      credentials = grpc.ServerCredentials.createSsl(
        Buffer.from(process.env.SSL_ROOT_CRT || '', 'base64'), [{
          cert_chain: Buffer.from(process.env.SSL_CRT || '', 'base64'),
          private_key: Buffer.from(process.env.SSL_KEY || '', 'base64')
        }], true)
    } else {
      credentials = grpc.ServerCredentials.createInsecure()
    }

    server.addService(CogServiceService, new MetaCogService())
    server.bind(`${host}:${port}`, credentials)
    server.start()
    this.log(`Server started, listening: ${host}:${port}`)
  }

}

class MetaCogService implements ICogServiceServer {
  protected onlyKnownStepId = 'AssertZoundsStep'

  /* tslint:disable:no-unused */
  getManifest(call: grpc.ServerUnaryCall<ManifestRequest>, callback: grpc.sendUnaryData<CogManifest>) {
    // Set basic cog details.
    const manifest: CogManifest = new CogManifest()
    manifest.setName('automatoninc/metacog')
    manifest.setVersion('0.1.0')

    // Declare a "password" authentication field.
    const authField: FieldDefinition = new FieldDefinition()
    authField.setKey('password')
    authField.setDescription('Password for demonstration purposes. Just type Crank123')
    authField.setOptionality(FieldDefinition.Optionality.REQUIRED)
    authField.setType(FieldDefinition.Type.STRING)
    manifest.addAuthFields(authField)

    // Define a single "AssertZoundsStep"
    const stepDefinition: StepDefinition = new StepDefinition()
    stepDefinition.setStepId(this.onlyKnownStepId)
    stepDefinition.setName('Assert Text Equals Zounds!')
    stepDefinition.setExpression('the text (?<moreThanText>.*) should equal Zounds!')
    const textField: FieldDefinition = new FieldDefinition()
    textField.setKey('moreThanText')
    textField.setDescription('The text whose value is expected to be "Zounds!"')
    textField.setType(FieldDefinition.Type.STRING)
    textField.setOptionality(FieldDefinition.Optionality.REQUIRED)
    stepDefinition.addExpectedFields(textField)
    manifest.setStepDefinitionsList([stepDefinition])

    callback(null, manifest)
  }

  runSteps(call: grpc.ServerDuplexStream<RunStepRequest, RunStepResponse>) {
    let processing = 0
    let clientEnded = false

    call.on('data', (RunStepRequest: RunStepRequest) => {
      processing++

      const step: Step = RunStepRequest.getStep() || new Step()
      const stepResponse: RunStepResponse = this.dispatchStep(step, call.metadata)

      call.write(stepResponse)
      processing--

      // If this was the last step to process and the client has ended the
      // stream, then end our stream as well.
      if (processing === 0 && clientEnded) {
        call.end()
      }
    })

    call.on('end', () => {
      clientEnded = true

      // Only end the stream if we are done processing all steps.
      if (processing === 0) {
        call.end()
      }
    })
  }

  runStep(call: grpc.ServerUnaryCall<RunStepRequest>, callback: grpc.sendUnaryData<RunStepResponse>) {
    const step: Step = call.request.getStep() || new Step()
    const stepResponse: RunStepResponse = this.dispatchStep(step, call.metadata)

    callback(null, stepResponse)
  }

  protected assertTextEqualsZounds(text: string): RunStepResponse {
    const stepResponse = new RunStepResponse()
    if (text === 'Zounds!') {
      stepResponse.setOutcome(RunStepResponse.Outcome.PASSED)
      stepResponse.setMessageFormat('Text %s equals Zounds!, as expected.')
      stepResponse.addMessageArgs(Value.fromJavaScript(text))
    } else {
      stepResponse.setOutcome(RunStepResponse.Outcome.FAILED)
      stepResponse.setMessageFormat('Text equals %s, but Zounds! was expected.')
      stepResponse.addMessageArgs(Value.fromJavaScript(text))
    }

    return stepResponse
  }

  protected dispatchStep(step: Step, metadata: grpc.Metadata): RunStepResponse {
    const password: any = metadata.get('password')
    const stepId: string = step.getStepId()
    const stepDataStruct: Struct = step.getData() || new Struct()
    const stepDataObject: any = stepDataStruct.toJavaScript()
    let stepResponse: RunStepResponse

    if (password.toString() !== 'Crank123') {
      stepResponse = new RunStepResponse()
      stepResponse.setOutcome(RunStepResponse.Outcome.ERROR)
      stepResponse.setMessageFormat('Password is incorrect. Re-auth with `$ crank cog:auth MetaCog` and enter Crank123')
      return stepResponse
    }

    switch (stepId) {
    case this.onlyKnownStepId:
      stepResponse = this.assertTextEqualsZounds(stepDataObject.moreThanText)
      break

    default:
      stepResponse = new RunStepResponse()
      stepResponse.setOutcome(RunStepResponse.Outcome.ERROR)
      stepResponse.setMessageFormat('Unknown step %s')
      stepResponse.addMessageArgs(Value.fromJavaScript(stepId))
    }

    return stepResponse
  }

}

// Always ensure all instantiated cogs are stopped.
function stopMetaCog() {
  if (server) {
    server.forceShutdown()
  }
}

process.on('exit', stopMetaCog)
process.on('SIGINT', stopMetaCog)
process.on('SIGTERM', stopMetaCog)
