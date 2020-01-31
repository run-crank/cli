import * as grpc from 'grpc';
import * as needle from 'needle';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { UserAwareMixin } from './mixins';

/**
 * This is a wrapper class around the API client for your Cog. An instance of
 * this class is passed to the constructor of each of your steps, and can be
 * accessed on each step as this.client.
 */
class ClientWrapper {

  /**
   * This is an array of field definitions, each corresponding to a field that
   * your API client requires for authentication. Depending on the underlying
   * system, this could include bearer tokens, basic auth details, endpoints,
   * etc.
   *
   * If your Cog does not require authentication, set this to an empty array.
   */
  public static expectedAuthFields: Field[] = [{
    field: 'userAgent',
    type: FieldDefinition.Type.STRING,
    description: 'User Agent String',
    help: 'This is for demonstration purposes only. In an actual Cog, you would use this field to describe how to find this auth field in the underlying system.',
  }];

  /**
   * Private instance of the wrapped API client. You will almost certainly want
   * to swap this out for an API client specific to your Cog's needs.
   */
  public client: any;

  /**
   * Constructs an instance of the ClientWwrapper, authenticating the wrapped
   * client in the process.
   *
   * @param auth - An instance of GRPC Metadata for a given RunStep or RunSteps
   *   call. Will be populated with authentication metadata according to the
   *   expectedAuthFields array defined above.
   *
   * @param clientConstructor - An optional parameter Used only as a means to
   *   simplify automated testing. Should default to the class/constructor of
   *   the underlying/wrapped API client.
   */
  constructor (auth: grpc.Metadata, clientConstructor = needle) {
    // Call auth.get() for any field defined in the static expectedAuthFields
    // array here. The argument passed to get() should match the "field" prop
    // declared on the definition object above.
    const uaString: string = auth.get('userAgent').toString();
    this.client = clientConstructor;

    // Authenticate the underlying client here.
    this.client.defaults({ user_agent: uaString });
  }

}

interface ClientWrapper extends UserAwareMixin {}
applyMixins(ClientWrapper, [UserAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
