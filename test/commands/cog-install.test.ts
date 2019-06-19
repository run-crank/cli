import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

describe('cog:install', () => {
  const cacheDir: string = `${__dirname}/../../../.test_cache`;

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
  })

  /*test
  .stdout()
  .command(['cog:install', '--source=local', '--local-start-command="crank cog:meta"', '--ignore-auth'])
  .it('shows user email when logged in', ctx => {
    expect(ctx.stdout).to.equal('Successfully installed MetaCog cog.\n')
  })*/

  /*test
  .nock('https://api.heroku.com', api => api
    .get('/account')
    // HTTP 401 means the user is not logged in with valid credentials
    .reply(401)
  )
  .command(['auth:whoami'])
  // checks to ensure the command exits with status 100
  .exit(100)
  .it('exits with status 100 when not logged in')*/

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
    console.log('yup');
  });

});
