import * as fs from 'fs'
import * as inquirer from 'inquirer'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:install', () => {

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])
  })

  test
    .stdout()
    .command(['cog:install', '--source', 'local', '--local-start-command', './bin/run cog:meta', '--ignore-auth'])
    .it('can install local cog', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/metacog cog.')

      // Cog should have been added to registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      const cog = registry.find((c: any) => c.name === 'automatoninc/metacog')
      expect(cog.label).to.equal('Meta Cog')
      expect(cog._runConfig.strategy).to.equal('custom')
      expect(cog._runConfig.cmd).to.equal('./bin/run cog:meta')
      expect(cog._runConfig.cwd).to.equal(process.cwd())
    })

  test
    .stdout()
    .command(['cog:install', 'automatoninc/salesforce:0.1.1', '--ignore-auth'])
    .it('can install cog from docker hub', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/salesforce cog.')

      // Cog should have been added to registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      const cog = registry.find((c: any) => c.name === 'automatoninc/salesforce')
      expect(cog.label).to.equal('Salesforce')
      expect(cog._runConfig.strategy).to.equal('docker')
      expect(cog._runConfig.dockerImage).to.equal('automatoninc/salesforce:0.1.1')
    })

  test
    .stdout()
    .do(() => {
      // Write a mock existing cog registry to simulate update.
      fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify([{
        name: 'automatoninc/salesforce',
        label: 'Salesforce',
        version: '0.1.0',
        _runConfig: {
          strategy: 'docker',
          dockerImage: 'automatoninc/salesforce:0.1.0',
        },
      }]), {encoding: 'utf8'})
    })
    .command(['cog:install', 'automatoninc/salesforce:0.1.1', '--ignore-auth', '--force'])
    .it('can "update" previously installed cog', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/salesforce cog.')

      // Cog should have been added to registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      const cog = registry.find((c: any) => c.name === 'automatoninc/salesforce')
      expect(cog._runConfig.dockerImage).to.equal('automatoninc/salesforce:0.1.1')
    })

  test
    .env({CRANK_AUTOMATONINC_METACOG__PASSWORD: 'Crank123'})
    .stdout()
    .command(['cog:install', '--source', 'local', '--local-start-command', './bin/run cog:meta'])
    .it('can install cog with auth details via environment', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/metacog cog.')

      // Auth details should have been written to the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      const cog = profile.find((c: any) => c.cog === 'automatoninc/metacog')
      expect(cog.auth.password).to.equal('Crank123')
    })

  test
    .stdout()
    .stub(inquirer, 'prompt', () => {return {password: 'Crank123'}})
    .command(['cog:install', '--source', 'local', '--local-start-command', './bin/run cog:meta'])
    .it('can install cog with auth details interactively', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/metacog cog.')

      // Auth details should have been written to the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      const cog = profile.find((c: any) => c.cog === 'automatoninc/metacog')
      expect(cog.auth.password).to.equal('Crank123')
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
