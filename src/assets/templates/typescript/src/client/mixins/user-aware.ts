
import * as needle from 'needle';

export class UserAwareMixin {
  client: any;

  /**
   * An example of how to expose the underlying API client to your steps. Any
   * public methods exposed on this class can be invoked in your steps'
   * executeStep methods like so: this.client.getUserByEmail()
   */
  public async getUserByEmail(email: string): Promise<needle.NeedleResponse> {
    // Naturally, the code here will depend on the actual API client you use.
    return this.client(`https://jsonplaceholder.typicode.com/users?email=${email}`);
  }
}
