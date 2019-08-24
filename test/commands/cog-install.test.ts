import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

describe('cog:install', () => {
  const cacheDir: string = `${__dirname}/../.test_cache`;

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])
  })

  test
    .stdout()
    .command(['cog:install', '--source', 'local', '--local-start-command', './bin/run cog:meta', '--ignore-auth'])
    .it('can install local cog', ctx => {
      expect(ctx.stdout).to.equal('Successfully installed automatoninc/metacog cog.\n')
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
