import * as cp from 'child_process'
import * as fs from 'fs'
import * as inquirer from 'inquirer'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:uninstall', () => {

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])

    // Write a mock cog registry entry.
    fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify([{
      name: 'automatoninc/metacog',
      label: 'Meta Cog',
      version: '0.0.0',
      // Note: metadata pulled dynamically from Cog, not from below.
      stepDefinitionsList: [],
      authFieldsList: [],
      _runConfig: {
        strategy: 'custom',
        cmd: './bin/run cog:meta',
        cwd: process.cwd(),
      },
    }]), {encoding: 'utf8'})

    // Write a mock default profile entry.
    fs.writeFileSync(`${cacheDir}/default-profile.json`, JSON.stringify([{
      cog: "automatoninc/metacog",
      auth: {
        password: 'Crank123'
      }
    }]), {encoding: 'utf8'})
  })

  test
    .stdout()
    .stub(inquirer, 'prompt', async () => {return {confirm: true}})
    .command(['cog:uninstall', 'automatoninc/metacog'])
    .it('can uninstall a cog through interactive confirmation', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Uninstalled automatoninc/metacog')

      // An entry should no longer exist in the cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(0)

      // An entry should no longer exist in the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      expect(profile.length).to.equal(0)
    })

  test
    .stdout()
    .command(['cog:uninstall', 'automatoninc/metacog', '--force'])
    .it('can uninstall a cog forcefully', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Uninstalled automatoninc/metacog')

      // An entry should no longer exist in the cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(0)

      // An entry should no longer exist in the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      expect(profile.length).to.equal(0)
    })

  test
    .stdout()
    .command(['cog:uninstall', 'automatoninc/metacog', '--force', '--ignore-auth'])
    .it('can uninstall a cog and leave auth details intact', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Uninstalled automatoninc/metacog')

      // An entry should no longer exist in the cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(0)

      // An entry should still exist in the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      expect(profile.length).to.equal(1)
    })

  test
    .stdout()
    .do(() => {
      // Mock the existing cog reg entry as a docker-based cog.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      registry[0]._runConfig = {
        strategy: 'docker',
        dockerImage: 'some/docker-image',
      }
      fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify(registry), {encoding: 'utf8'})
    })
    .stub(cp, 'spawnSync', (cmd: string, args: string[]) => {
      // Assert that the docker rmi command is invoked correctly.
      expect(cmd).to.equal('docker')
      expect(args[0]).to.equal('rmi')
      expect(args[1]).to.equal('some/docker-image')
      return
    })
    .command(['cog:uninstall', 'automatoninc/metacog', '--force'])
    .it('can uninstall a docker-based cog', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Uninstalled automatoninc/metacog')

      // An entry should no longer exist in the cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(0)

      // An entry should still exist in the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      expect(profile.length).to.equal(0)
    })

  test
    .stdout()
    .do(() => {
      // Mock the existing cog reg entry as a docker-based cog.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      registry[0]._runConfig = {
        strategy: 'docker',
        dockerImage: 'some/docker-image',
      }
      fs.writeFileSync(`${cacheDir}/cog-registry.json`, JSON.stringify(registry), {encoding: 'utf8'})
    })
    .stub(cp, 'spawnSync', () => {
      throw new Error('Child process spawnSync was called when it should not have been')
    })
    .command(['cog:uninstall', 'automatoninc/metacog', '--force', '--keep-docker-image'])
    .it('can uninstall a docker-based cog but keep the image', ctx => {
      // Success message should have been printed.
      expect(ctx.stdout).to.contain('Uninstalled automatoninc/metacog')

      // An entry should no longer exist in the cog registry.
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(0)

      // An entry should still exist in the default profile.
      const profile = JSON.parse(fs.readFileSync(`${cacheDir}/default-profile.json`, {encoding: 'utf8'}))
      expect(profile.length).to.equal(0)
    })

  test
    .stderr()
    .command(['cog:uninstall', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits 1 when non-existent cog is uninstalled', ctx => {
      // Success message should have been printed.
      expect(ctx.stderr).to.contain("There's no Cog named automatoninc/does-not-exist installed")
    })

  test
    .stdout()
    .stub(inquirer, 'prompt', async () => {return {confirm: false}})
    .command(['cog:uninstall', 'automatoninc/metacog'])
    .it('quietly exits when the user interactively cancels confirmation', ctx => {
      const registry = JSON.parse(fs.readFileSync(`${cacheDir}/cog-registry.json`, {encoding: 'utf8'}))
      expect(registry.length).to.equal(1)
    })

  afterEach(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
