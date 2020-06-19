/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

import { baseOperators } from './../../client/constants/operators';
import * as util from '@run-crank/utilities';
import { isNullOrUndefined } from 'util';
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
  protected stepExpression: string = 'the (?<field>.+) field on JSON Placeholder user (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectation>.+)?';

  /**
   * Extra help text describing how this step works: used in auto-generated docs.
   */
  protected stepHelp: string = "This step attempts to find a user on JSON Placeholder and check a field's value on that user.";

  /**
   * An array of Fields that this step expects to be passed via step data. The value of "field"
   * will be used as the field value's key when passed over the step data Struct.
   */
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "User's email address",
    help: 'This email address is used to uniquely identify and find the JSON Placeholder user.',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
  }];

  /**
   * An array of Record definitions that this step may return as structured data. This metadata
   * is used in auto-generated step documentation, and powers dynamic token value substitution. In
   * the example below, a token like {{cog.user.id}} could be used in a Scenario step following the
   * invocation of this step.
   */
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'user',
    type: RecordDefinition.Type.KEYVALUE,
    dynamicFields: true,
    fields: [{
      field: 'id',
      description: 'User ID',
      type: FieldDefinition.Type.NUMERIC,
    }, {
      field: 'name',
      description: "User's full name",
      type: FieldDefinition.Type.STRING,
    }, {
      field: 'email',
      description: "User's e-mail address",
      type: FieldDefinition.Type.EMAIL,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let apiRes: any;
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator.toLowerCase();

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

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
        const user = this.keyValue('user', 'User Record', apiRes.body[0]);
        return this.error('The %s field does not exist on user %s', [field, email], [user]);
      }

      const user = this.keyValue('user', 'User Record', apiRes.body[0]);
      const result = this.assert(operator, apiRes.body[0][field], expectedValue, field);

      // If the value of the field matches expectations, pass.
      // If the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], [user])
        : this.fail(result.message, [], [user]);
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
