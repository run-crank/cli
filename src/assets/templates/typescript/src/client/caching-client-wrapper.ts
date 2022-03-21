import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';

class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario run and requestor (org)
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // User aware methods
  // -------------------------------------------------------------------

  /**
   * An example of how to expose the use caching. This methods will
   * first check the cache for a user with that email, then it will
   * make the api call if it is not in the cache.
   */
   public async getUserByEmail(email: string) {
    const cachekey = `CogName|User|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getUserByEmail(email);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  /**
   * This method will delete the entire cache for this scenario
   * before it makes the api call.
   */
  public async deleteUserByEmail(email: string) {
    await this.clearCache();
    return await this.client.deleteUserByEmail(email);
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  /**
   * This is an example of a method that does not need to interact with
   * the cache. Just pass it the original function from the client-wrapper
   */
  public async getUserById(id: string) {
    return await this.client.getUserById(id);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}

export { CachingClientWrapper as CachingClientWrapper };