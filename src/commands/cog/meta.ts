import Command from '@oclif/command'
import {Struct, Value} from 'google-protobuf/google/protobuf/struct_pb'
import * as grpc from 'grpc'

import {CogServiceService, ICogServiceServer} from '../../proto/cog_grpc_pb'
import {BinaryRecord, CogManifest, FieldDefinition, ManifestRequest, RecordDefinition, RunStepRequest, RunStepResponse, Step, StepDefinition, StepRecord, TableRecord} from '../../proto/cog_pb'

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
    // Set basic Cog details.
    const manifest: CogManifest = new CogManifest()
    manifest.setName('automatoninc/metacog')
    manifest.setLabel('Meta Cog')
    manifest.setVersion('0.0.0')

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
    stepDefinition.setType(StepDefinition.Type.VALIDATION)
    const textField: FieldDefinition = new FieldDefinition()
    textField.setKey('moreThanText')
    textField.setDescription('The text whose value is expected to be "Zounds!"')
    textField.setType(FieldDefinition.Type.STRING)
    textField.setOptionality(FieldDefinition.Optionality.REQUIRED)
    stepDefinition.addExpectedFields(textField)
    const recordDefinition: RecordDefinition = new RecordDefinition()
    recordDefinition.setId('zound')
    recordDefinition.setType(RecordDefinition.Type.KEYVALUE)
    recordDefinition.setMayHaveMoreFields(false)
    const recordTextField: FieldDefinition = new FieldDefinition()
    recordTextField.setKey('text')
    recordTextField.setDescription('The expected text provided by the user.')
    recordTextField.setType(FieldDefinition.Type.STRING)
    recordDefinition.addGuaranteedFields(recordTextField)
    const recordNumberField: FieldDefinition = new FieldDefinition()
    recordNumberField.setKey('zounds')
    recordNumberField.setDescription('The number of zounds found.')
    recordNumberField.setType(FieldDefinition.Type.NUMERIC)
    recordDefinition.addGuaranteedFields(recordNumberField)
    stepDefinition.addExpectedRecords(recordDefinition)
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
    const stepRecord = new StepRecord()
    const record: Record<string, any> = {}

    if (text === 'Zounds!') {
      stepResponse.setOutcome(RunStepResponse.Outcome.PASSED)
      stepResponse.setMessageFormat('Text %s equals Zounds!, as expected.')
      stepResponse.addMessageArgs(Value.fromJavaScript(text))
      record.zounds = 1
      record.text = text
    } else {
      stepResponse.setOutcome(RunStepResponse.Outcome.FAILED)
      stepResponse.setMessageFormat('Text equals %s, but Zounds! was expected.')
      stepResponse.addMessageArgs(Value.fromJavaScript(text))
      record.zounds = 0
      record.text = text
    }

    // Add a contrived key/value step record to the response.
    stepRecord.setId('zound')
    stepRecord.setName('Contrived Zound Record')
    stepRecord.setKeyValue(Struct.fromJavaScript(record))
    stepResponse.addRecords(stepRecord)

    return stepResponse
  }

  protected dispatchStep(step: Step, metadata: grpc.Metadata): RunStepResponse {
    const password: any = metadata.get('password')
    const stepId: string = step.getStepId()
    const stepDataStruct: Struct = step.getData() || new Struct()
    const stepDataObject: any = stepDataStruct.toJavaScript()
    const stepRecord1 = new StepRecord()
    const tableRecord = new TableRecord()
    const stepRecord2 = new StepRecord()
    const binaryRecord = new BinaryRecord()
    let stepResponse: RunStepResponse

    if (password.toString() !== 'Crank123') {
      stepResponse = new RunStepResponse()
      stepResponse.setOutcome(RunStepResponse.Outcome.ERROR)
      stepResponse.setMessageFormat('Password is incorrect. Re-auth with `$ crank cog:auth automatoninc/metacog` and enter Crank123')

      // Add a contrived table step record to the response.
      stepRecord1.setId('error_table')
      stepRecord1.setName('Contrived Error Table')
      tableRecord.setHeaders(Struct.fromJavaScript({
        code: 'Error Code',
        name: 'Error Name',
        msg: 'Error Message',
      }))
      tableRecord.addRows(Struct.fromJavaScript({
        code: 401,
        name: 'Incorrect Password',
        msg: 'Re-auth with blah-blah-blah...',
      }))
      tableRecord.addRows(Struct.fromJavaScript({
        code: 500,
        name: 'Some other error',
        msg: 'I told you this was contrived...'
      }))
      stepRecord1.setTable(tableRecord)
      stepResponse.addRecords(stepRecord1)

      // Add a contrived binary record to the response.
      stepRecord2.setId('error_image')
      stepRecord2.setName('Contrived Error Image')
      binaryRecord.setMimeType('image/png')
      binaryRecord.setData(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAACzElEQVRYCdVWv2/TUBA+/0qKa+w0VUtRUShRljZQVWRjQJbIGtElYmSL+A8Y606MTIi9Y9qhEwugVupaJISULkwwIIGQoEJIkGKbu5f3XCd2YsdVQ3nSyzvf++67793ZjgH+gyGdRaPvA8UP5RjckDAANjcdaWPDQas3JAkCW/jSru12Uzk62sZ4Jwgh7ggnKeVqA+A5GZLjODIJI35WAUocUXRO2QWtjyK2VzpY28mdXOQOVt93ZGru4H0QACZhyG8OQZ1Q72PPI1tfKnLszoSccuV6fpxHjNqV1DI6UBImON44pycsiaU5LI78HsekEjGMCDn6BpF5rVZLazQaOtk44xJ4zXrd4pEkNA7DtwWqU80l3IRM5O2bN1bnZi+/my0aH5aXS3Uezl4mIlG5vPC4YOnHi1eLO7ZdNThmtAg/WYBKREulhee4sBZcWyy+4uQkgAlcX7cLlqn/IkxOU/y1W0v3OYbFczuypGkBJYUpXdkyDe2joSvf8qr6LMTE2rG7u/992tCeTuUlzzS115eM6QOOcUPYqJmiAhTEylirla07q1fmOQv5wpO5a9WZkm3b4tTJB0wpgMjDZHm8Fv1nifl1TlzgGsaH3P1mKhAPoVIL/G+03VoNtGIRTNsGOjGVuouTBuEInzgkqgCsdE5S/BtSuX3DgDlM9eDEhXuYZd71QZZlcPFJ+qyp8NJUYOfTD/iKWIZPUiB6lYSjfTqViz+Puh7cVTXYyuXgLfqOu10ooKi1Py48/KnADPqe4EwlAN6/qOQT3gPIdTqazUjvTzd71uC9Mbjff+0fgjaOAB5N1dBwivcArXRN/vFGhuRU2lEjaT8am0FElCSDh74NmVohIMWTkCFNfIjjDLSLRJBTiIkPO7OXfXnTt+DQPD0hIwAZNBDn3p7NPv2GJs7AmzqEKttu4wsvZoz/2MSQXHiXaMGFF/pPBP4FQ7nDM1YIhMUAAAAASUVORK5CYII=', 'base64'))
      stepRecord2.setBinary(binaryRecord)
      stepResponse.addRecords(stepRecord2)

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
