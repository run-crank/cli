import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('registry:steps', () => {

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])

    // Write a mock, incomplete existing cog registry.
    fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify([{
      name: 'automatoninc/salesforce',
      label: 'Salesforce',
      version: '0.1.1',
      stepDefinitionsList: [{expression: 'delete the (?<email>.+) salesforce lead'}],
      _runConfig: {
        strategy: 'docker',
        dockerImage: 'automatoninc/salesforce:0.1.1',
      },
    }, {
      name: 'automatoninc/metacog',
      label: 'Meta Cog',
      version: '0.0.0',
      stepDefinitionsList: [{expression: 'the text (?<moreThanText>.*) should equal Zounds!'}],
      _runConfig: {
        strategy: 'custom',
        cmd: './bin/run cog:meta',
        cwd: process.cwd(),
      },
    }]), {encoding: 'utf8'})
  })

  test
    .stdout()
    .command(['registry:steps', '--no-truncate'])
    .it('can list all steps', ctx => {
      // Table rows should have been printed.
      expect(ctx.stdout).to.match(/System\s+Expression/)
      expect(ctx.stdout).to.match(/Meta Cog\s+the text \(\?\<moreThanText\>\.\*\) should equal Zounds\!/)
      expect(ctx.stdout).to.match(/Salesforce\s+delete the \(\?\<email\>\.\+\) salesforce lead/)
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
