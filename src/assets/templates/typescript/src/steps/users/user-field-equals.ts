/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition } from '../../proto/cog_pb';

import { baseOperators } from './../../client/constants/operators';
import * as util from '@run-crank/utilities';

/**
 * Note: the class name here becomes this step's stepId.
 * @see BaseStep.getId()
 */
export class UserFieldEqualsStep extends BaseStep implements StepInterface {

  /**
   * The name of this step: used when identifying this step to humans.
   */
  protected stepName: string = 'Check a field on a JSON Placeholder user';

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
  protected stepExpression: string = 'the (?<field>.+) field on JSON Placeholder user (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';

  /**
   * An array of Fields that this step expects to be passed via step data. The value of "field"
   * will be used as the field value's key when passed over the step data Struct.
   */
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "User's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let apiRes: any;
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator.toLowerCase();

    // Search JSON Placeholder API for user with given email.
    try {
      apiRes = await this.client.getUserByEmail(email);
    } catch (e) {
      return this.error('There was a problem connecting to JSON Placeholder.');
    }

    try {
      if (apiRes.body.length === 0) {
        // If no results were found, return an error.
        return this.error('No user found for email %s', [email]);
      } else if (!apiRes.body[0].hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.error('The %s field does not exist on user %s', [field, email]);
      } else if (this.compare(operator, apiRes.body[0][field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(util.operatorSuccessMessages[operator], [
          field,
          expectedValue,
        ]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(util.operatorFailMessages[operator], [
          field,
          expectedValue,
          apiRes.body[0][field],
        ]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation: %s', [e.message]);
    }
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { UserFieldEqualsStep as Step };
