import * as fs from 'fs'
import * as inquirer from 'inquirer'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:auth', () => {

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])

    // Write a mock, incomplete existing cog registry.
    fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify([{
      name: 'automatoninc/metacog',
      label: 'Meta Cog',
      version: '0.0.0',
      authFieldsList: [{
        key: 'password',
        optionality: 1,
        type: 1,
        description: 'Password for demonstration purposes. Just type Crank123',
        help: ''
      }],
      _runConfig: {
        strategy: 'custom',
        cmd: './bin/run cog:meta',
        cwd: process.cwd(),
      },
    }]), {encoding: 'utf8'})
  })

  test
    .env({CRANK_AUTOMATONINC_METACOG__PASSWORD: 'Crank123'})
    .stdout()
    .command(['cog:auth', 'automatoninc/metacog'])
    .it('can authenticate cog with auth details via environment', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully updated authentication details for automatoninc/metacog')

      // Auth details should have been written to the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      const cog = profile.find((c: any) => c.cog === 'automatoninc/metacog')
      expect(cog.auth.password).to.equal('Crank123')
    })

  test
    .stdout()
    .stub(inquirer, 'prompt', () => {return {password: 'Crank321'}})
    .command(['cog:auth', 'automatoninc/metacog'])
    .it('can authenticate cog with auth details interactively', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Successfully updated authentication details for automatoninc/metacog')

      // Auth details should have been written to the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      const cog = profile.find((c: any) => c.cog === 'automatoninc/metacog')
      expect(cog.auth.password).to.equal('Crank321')
    })

  test
    .stdout()
    .stderr()
    .command(['cog:auth', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits 1 when non-existent cog is authenticated', ctx => {
      // Error/success messages should have been printed.
      expect(ctx.stderr).to.contain('No Cog found named automatoninc/does-not-exist')
      expect(ctx.stdout).to.equal('')
    })

  test
    .stdout()
    .do(() => {
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      registry[0].authFieldsList = [];
      fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify(registry), {encoding: 'utf8'});
    })
    .command(['cog:auth', 'automatoninc/metacog'])
    .it('prints friendly message when cog does not require authentication', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain("This Cog doesn't require authentication")
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
