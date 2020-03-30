import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('registry:rebuild', () => {

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
    .command(['registry:rebuild'])
    .it('can rebuild all cog metadata', ctx => {
      // Success messages should have been printed.
      expect(ctx.stdout).to.contain('Successfully rebuilt registry entry for automatoninc/metacog')
      expect(ctx.stdout).to.contain('Successfully rebuilt registry entry for automatoninc/salesforce')

      // Extra details should have been added to registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      const metaCog = registry.find((c: any) => c.name === 'automatoninc/metacog')
      expect(metaCog.stepDefinitionsList.length).to.be.greaterThan(0);
      const sfdcCog = registry.find((c: any) => c.name === 'automatoninc/salesforce')
      expect(sfdcCog.stepDefinitionsList.length).to.be.greaterThan(0);
    })

  test
    .stdout()
    .command(['registry:rebuild', 'automatoninc/metacog'])
    .it('can rebuild specific cog metadata', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully rebuilt registry entry for automatoninc/metacog')
      expect(ctx.stdout).to.not.contain('Successfully rebuilt registry entry for automatoninc/salesforce')

      // Extra details should have been added to only the meta cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      const metaCog = registry.find((c: any) => c.name === 'automatoninc/metacog')
      expect(metaCog.stepDefinitionsList.length).to.be.greaterThan(0);
      const sfdcCog = registry.find((c: any) => c.name === 'automatoninc/salesforce')
      expect(!!sfdcCog.stepDefinitionsList).to.equal(false);
    })

  test
    .stdout()
    .stderr()
    .command(['registry:rebuild', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits with error when rebuilding non-existent cog', ctx => {
      // Error message should have been printed.
      expect(ctx.stderr).to.contain('Cog not found')
      expect(ctx.stdout).to.equal('')
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
