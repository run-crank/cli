import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:readme', () => {
  let stashedCwd: string;

  beforeEach(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir])
    stashedCwd = process.cwd()
    process.chdir(cacheDir)

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
        cwd: stashedCwd,
      },
    }]), {encoding: 'utf8'})
  })

  test
    .stdout()
    .do(() => {
      fs.writeFileSync(`${cacheDir}/README.md`, '# Meta Cog\n<!-- authenticationDetails -->', {encoding: 'utf8'});
    })
    .command(['cog:readme', 'automatoninc/metacog'])
    .it('adds authentication details to readme', ctx => {
      // The README.md file should not have been unchanged.
      const readme = fs.readFileSync(`${cacheDir}/README.md`, {encoding: 'utf8'});
      expect(readme).to.contain('# Meta Cog')
      expect(readme).to.contain('<!-- authenticationDetails -->')
      expect(readme).to.contain('| Field | Install-Time Environment Variable | Description |')
      expect(readme).to.contain('| --- | --- | --- |')
      expect(readme).to.contain('| **password** | `CRANK_AUTOMATONINC_METACOG__PASSWORD` | Password for demonstration purposes. Just type Crank123 |')
      expect(readme).to.contain('# Re-authenticate by running this')
      expect(readme).to.contain('$ crank cog:auth automatoninc/metacog')
      expect(readme).to.contain('<!-- authenticationDetailsEnd -->')

      // Check for log messages too.
      expect(ctx.stdout).to.contain('replacing <!-- authenticationDetails --> in README.md')
    })

  test
    .stdout()
    .do(() => {
      fs.writeFileSync(`${cacheDir}/README.md`, '# Meta Cog\n<!-- stepDetails -->', {encoding: 'utf8'});
    })
    .command(['cog:readme', 'automatoninc/metacog'])
    .it('adds step details to readme', ctx => {
      // The README.md file should not have been unchanged.
      const readme = fs.readFileSync(`${cacheDir}/README.md`, {encoding: 'utf8'});
      expect(readme).to.contain('# Meta Cog')
      expect(readme).to.contain('<!-- stepDetails -->')
      expect(readme).to.contain('| Name (ID) | Expression | Expected Data |')
      expect(readme).to.contain('| --- | --- | --- |')
      expect(readme).to.contain('| **Assert Text Equals Zounds!**<br>(`AssertZoundsStep`) | `the text (?<moreThanText>.*) should equal Zounds!` | - `moreThanText`: The text whose value is expected to be "Zounds!" |')
      expect(readme).to.contain('<!-- stepDetailsEnd -->')

      // Check for log messages too.
      expect(ctx.stdout).to.contain('replacing <!-- stepDetails --> in README.md')
    })

  test
    .do(() => {
      fs.writeFileSync(`${cacheDir}/README.md`, '# Meta Cog', {encoding: 'utf8'});
    })
    .command(['cog:readme', 'automatoninc/metacog'])
    .it('does not alter readme without special comment tags', ctx => {
      // The README.md file should not have been unchanged.
      const readme = fs.readFileSync(`${cacheDir}/README.md`, {encoding: 'utf8'});
      expect(readme).to.equal('# Meta Cog\n')
    })

  test
    .stdout()
    .stderr()
    .command(['cog:readme', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits 1 when non-existent cog readme is requested', ctx => {
      // Error/success messages should have been printed.
      expect(ctx.stderr).to.contain('Cog with name automatoninc/does-not-exist not found')
      expect(ctx.stdout).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .command(['cog:readme', 'automatoninc/metacog'])
    .exit(1)
    .it('exits 1 when no readme is found in the current working directory', ctx => {
      // Error/success messages should have been printed.
      expect(ctx.stderr).to.contain('No README.md file found')
      expect(ctx.stdout).to.equal('')
    })

  afterEach(() => {
    process.chdir(stashedCwd)
    delete process.env.CRANK_CACHEDIR;
  });

});
