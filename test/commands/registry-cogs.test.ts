import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('registry:cogs', () => {

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])

    // Write a mock, incomplete existing cog registry.
    fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify([{
      name: 'automatoninc/salesforce',
      label: 'Salesforce',
      version: '0.1.1',
      _runConfig: {
        strategy: 'docker',
        dockerImage: 'automatoninc/salesforce:0.1.1',
      },
    }, {
      name: 'automatoninc/metacog',
      label: 'Meta Cog',
      version: '0.0.0',
      _runConfig: {
        strategy: 'custom',
        cmd: './bin/run cog:meta',
        cwd: process.cwd(),
      },
    }]), {encoding: 'utf8'})
  })

  test
    .stdout()
    .command(['registry:cogs'])
    .it('can list all cogs', ctx => {
      // Table rows should have been printed.
      expect(ctx.stdout).to.match(/Label\s+Name\s+Version\s+Type/)
      expect(ctx.stdout).to.match(/Meta Cog\s+automatoninc\/metacog\s+0\.0\.0\s+custom/)
      expect(ctx.stdout).to.match(/Salesforce\s+automatoninc\/salesforce\s+0\.1\.1\s+docker/)
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
