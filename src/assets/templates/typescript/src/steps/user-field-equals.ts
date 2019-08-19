import { BaseStep, Field, StepInterface } from '../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';

export class UserFieldEqualsStep extends BaseStep implements StepInterface {

  /**
   * The name of this step: used when identifying this step to humans.
   */
  protected stepName: string = 'Assert that a field on a JSON Placeholder user has a given value';

  /**
   * Type of step (either Action or Validation).
   */
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;

  /**
   * A string that can be evaluated as an ECMAScript-compatible regular expression. This is used to
   * identify and evaluate this step in cucumber-like scenario files. You are encouraged to use
   * named regex capturing groups that correspond to the expected fields below.
   */
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>.+) field on JSON Placeholder user (?<email>.+) has value (?<expectedValue>.+)';

  /**
   * An array of Fields that this step expects to be passed via step data. The value of "field"
   * will be used as the field value's key when passed over the step data Struct.
   */
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'The email address of the user to test',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'The user field to inspect (e.g. "username")',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The expected value of the given field',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let apiRes: any;
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const response: RunStepResponse = new RunStepResponse();

    // Search JSON Placeholder API for user with given email.
    try {
      apiRes = await this.client.getUserByEmail(email);
    } catch (e) {
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('There was a problem connecting to JSON Placeholder.');
      return response;
    }

    if (apiRes.body.length === 0) {
      // If no results were found, return an error.
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('No user found for email %s');
      response.addMessageArgs(Value.fromJavaScript(email));
    } else if (!apiRes.body[0].hasOwnProperty(field)) {
      // If the given field does not exist on the user, return an error.
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('The %s field does not exist on user %s');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(email));
      // tslint:disable-next-line:triple-equals
    } else if (apiRes.body[0][field] == expectedValue) {
      // If the value of the field matches expectations, pass.
      response.setOutcome(RunStepResponse.Outcome.PASSED);
      response.setMessageFormat('The %s field was set to %s, as expected');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(apiRes.body[0][field]));
    } else {
      // If the value of the field does not match expectations, fail.
      response.setOutcome(RunStepResponse.Outcome.FAILED);
      response.setMessageFormat('Expected %s field to be %s, but it was actually %s');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(expectedValue));
      response.addMessageArgs(Value.fromJavaScript(apiRes.body[0][field]));
    }

    return response;
  }

}

export { UserFieldEqualsStep as Step };
