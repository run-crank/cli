import * as grpc from 'grpc';
import { Struct, Value } from 'google-protobuf/google/protobuf/struct_pb';
import * as fs from 'fs';
import * as redis from 'redis';
import * as mailgun from 'mailgun-js';

import { Field, StepInterface } from './base-step';

import { ClientWrapper } from '../client/client-wrapper';
import { ICogServiceServer } from '../proto/cog_grpc_pb';
import { ManifestRequest, CogManifest, Step, RunStepRequest, RunStepResponse, FieldDefinition,
  StepDefinition } from '../proto/cog_pb';

export class Cog implements ICogServiceServer {

  private steps: StepInterface[];
  private redisClient: any;

  constructor (private clientWrapperClass, private stepMap: Record<string, any> = {}, private redisUrl: string = undefined, private mailgunCredentials: Record<string, any> = {}) {
    // Dynamically reads the contents of the ./steps folder for step definitions and makes the
    // corresponding step classes available on this.steps and this.stepMap.
    // tslint:disable-next-line:max-line-length
    this.steps = [].concat(...Object.values(this.getSteps(`${__dirname}/../steps`, clientWrapperClass)));

    // The following code will connect to redis
    // If mailgun credentials are provided, it will send a warning email on redis connection error
    this.redisClient = null;
    if (this.redisUrl) {
      const c = redis.createClient(this.redisUrl);
      let emailSent = false;
      // Set the "client" variable to the actual redis client instance
      // once a connection is established with the Redis server
      c.on('ready', () => {
        this.redisClient = c;
      });
      // Handle the error event so that it doesn't crash
      c.on('error', () => {
        // Send an email if a bad redisUrl is passed
        if (this.mailgunCredentials.apiKey && this.mailgunCredentials.domain && this.mailgunCredentials.alertEmail && !emailSent) {
          const mg = mailgun({ apiKey: this.mailgunCredentials.apiKey, domain: this.mailgunCredentials.domain });
          const emailData = {
            from: `Cog <noreply@${this.mailgunCredentials.domain}>`,
            to: this.mailgunCredentials.alertEmail,
            subject: 'Broken Redis Url in Cog',
            text: 'The redis url in the Cog is no longer working. Caching is disabled for the Cog.',
          };
          mg.messages().send(emailData, (error, body) => {
            console.log('email sent: ', body);
          });
          // Set emailSent to true so we don't send duplicate emails on multiple errors
          emailSent = true;
        }
      });
    }
  }

  private getSteps(dir: string, clientWrapperClass) {
    const steps = fs.readdirSync(dir, { withFileTypes: true })
    .map((file: fs.Dirent) => {
      if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
        const step = require(`${dir}/${file.name}`).Step;
        const stepInstance: StepInterface = new step(clientWrapperClass);
        this.stepMap[stepInstance.getId()] = step;
        return stepInstance;
      } if (file.isDirectory()) {
        return this.getSteps(`${__dirname}/../steps/${file.name}`, clientWrapperClass);
      }
    });

    // Note: this filters out files that do not match the above (e.g. READMEs
    // or .js.map files in built folder, etc).
    return steps.filter(s => s !== undefined);
  }

  /**
   * Implements the cog:getManifest grpc method, responding with a manifest definition, including
   * details like the name of the cog, the version of the cog, any definitions for required
   * authentication fields, and step definitions.
   */
  getManifest(
    call: grpc.ServerUnaryCall<ManifestRequest>,
    callback: grpc.sendUnaryData<CogManifest>,
  ) {
    const manifest: CogManifest = new CogManifest();
    const pkgJson: Record<string, any> = JSON.parse(
      fs.readFileSync('package.json').toString('utf8'),
    );
    const stepDefinitions: StepDefinition[] = this.steps.map((step: StepInterface) => {
      return step.getDefinition();
    });

    manifest.setName(pkgJson.cog.name);
    manifest.setLabel(pkgJson.cog.label);
    manifest.setVersion(pkgJson.version);
    if (pkgJson.cog.homepage) {
      manifest.setHomepage(pkgJson.cog.homepage);
    }
    if (pkgJson.cog.authHelpUrl) {
      manifest.setAuthHelpUrl(pkgJson.cog.authHelpUrl);
    }

    manifest.setStepDefinitionsList(stepDefinitions);

    ClientWrapper.expectedAuthFields.forEach((field: Field) => {
      const authField: FieldDefinition = new FieldDefinition();
      authField.setKey(field.field);
      authField.setOptionality(FieldDefinition.Optionality.REQUIRED);
      authField.setType(field.type);
      authField.setDescription(field.description);
      if (field.help) {
        authField.setHelp(field.help);
      }
      manifest.addAuthFields(authField);
    });

    callback(null, manifest);
  }

  /**
   * Implements the cog:runSteps grpc method, responding to a stream of RunStepRequests and
   * responding in kind with a stream of RunStepResponses. This method makes no guarantee that the
   * order of step responses sent corresponds at all with the order of step requests received.
   */
  runSteps(call: grpc.ServerDuplexStream<RunStepRequest, RunStepResponse>) {
    // Instantiate a single client for all step requests.
    let processing = 0;
    let clientEnded = false;
    let client: any = null;
    let idMap: any = null;
    let clientCreated = false;

    call.on('data', async (runStepRequest: RunStepRequest) => {
      processing = processing + 1;

      if (!clientCreated) {
        idMap = this.redisClient ? {
          requestId: runStepRequest.getRequestId(),
          scenarioId: runStepRequest.getScenarioId(),
          requestorId: runStepRequest.getRequestorId(),
        } : null;
        client = await this.getClientWrapper(call.metadata, idMap);
        clientCreated = true;
      }

      const step: Step = runStepRequest.getStep();
      const response: RunStepResponse = await this.dispatchStep(step, runStepRequest, call.metadata, client);
      call.write(response);

      processing = processing - 1;

      // If this was the last step to process and the client has ended the stream, then end our
      // stream as well.
      if (processing === 0 && clientEnded) {
        call.end();
      }
    });

    call.on('end', () => {
      clientEnded = true;

      // Only end the stream if we are done processing all steps.
      if (processing === 0) {
        call.end();
      }
    });
  }

  /**
   * Implements the cog:runStep grpc method, responding to a single RunStepRequest with a single
   * RunStepResponse.
   */
  async runStep(
    call: grpc.ServerUnaryCall<RunStepRequest>,
    callback: grpc.sendUnaryData<RunStepResponse>,
  ) {
    const step: Step = call.request.getStep();
    const response: RunStepResponse = await this.dispatchStep(step, call.request, call.metadata);
    callback(null, response);
  }

  /**
   * Helper method to dispatch a given step to its corresponding step class and handle error
   * scenarios. Always resolves to a RunStepResponse, regardless of any underlying errors.
   */
  private async dispatchStep(
    step: Step,
    runStepRequest: RunStepRequest,
    metadata: grpc.Metadata,
    client = null,
  ): Promise<RunStepResponse> {
    let wrapper = client;
    if (!client) {
      // Get scoped IDs for building cache keys
      const idMap: {} = {
        requestId: runStepRequest.getRequestId(),
        scenarioId: runStepRequest.getScenarioId(),
        requestorId: runStepRequest.getRequestorId(),
      };
      wrapper = this.getClientWrapper(metadata, idMap);
    }

    const stepId = step.getStepId();
    let response: RunStepResponse = new RunStepResponse();

    if (!this.stepMap.hasOwnProperty(stepId)) {
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('Unknown step %s');
      response.addMessageArgs(Value.fromJavaScript(stepId));
      return response;
    }

    try {
      const stepExecutor: StepInterface = new this.stepMap[stepId](wrapper);
      response = await stepExecutor.executeStep(step);
    } catch (e) {
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setResponseData(Struct.fromJavaScript(e));
    }

    return response;
  }

  /**
   * Helper method to instantiate an API client wrapper for this Cog.
   * If a redisUrl is passed in in the grpc-server.ts, then the
   * caching-client-wrapper will be used.
   */
  private getClientWrapper(auth: grpc.Metadata, idMap: {} = null) {
    if (this.redisClient) {
      const client = new ClientWrapper(auth);
      return new this.clientWrapperClass(client, this.redisClient, idMap);
    } else {
      return new this.clientWrapperClass(auth);
    }
  }

}
