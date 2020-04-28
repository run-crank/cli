import * as cp from 'child_process';
import * as fs from 'fs';
import { expect, test } from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:scaffold', () => {
  let stashedCwd: string
  let child: Record<string, any>

  // Note: before instead of beforeEach, as scaffolding a cog is expensive.
  before(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(`${cacheDir}/cog`)
    rmRfSync(cacheDir)
    cp.spawnSync('mkdir', [cacheDir])
    cp.spawnSync('mkdir', [`${cacheDir}/cog`])
    stashedCwd = process.cwd()
    process.chdir(`${cacheDir}/cog`)
  })

  test
    .stdout()
    .stderr()
    .env({CRANK_AUTOMATONINC_TEST_COG__USERAGENT: 'Any/Thing'})
    .command(['cog:scaffold', '--name=Test Cog', '--language=typescript', '--org=automatoninc', '--copyright-owner=Atoma Tommy Ltd', '--include-example-step', '--include-mit-license', `--output-directory=${cacheDir}/cog`])
    .it('can scaffold a typescript cog', () => {
      expect(true).to.equal(true);
    })

  test
    .it('produces correct package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(`${cacheDir}/cog/package.json`, {encoding: 'utf8'}));
      expect(pkg.name).to.equal('cog-test-cog');
      expect(pkg.cog.name).to.equal('automatoninc/test-cog');
      expect(pkg.cog.label).to.equal('Test Cog');
    })

  test
    .it('applies MIT license correctly', () => {
      const license = fs.readFileSync(`${cacheDir}/cog/LICENSE`, {encoding: 'utf8'});
      const pkg = JSON.parse(fs.readFileSync(`${cacheDir}/cog/package.json`, {encoding: 'utf8'}));
      expect(license).to.contain('MIT License');
      expect(license).to.contain('Atoma Tommy Ltd');
      expect(pkg.license).to.equal('MIT');
    })

  test
    .stdout()
    .command(['registry:steps'])
    .it('installs sample step correctly', ctx => {
      expect(ctx.stdout).to.contain('the (?<field>.+) field on JSON Placeholder user');
    })

  test
    .do(() => {
      child = cp.spawnSync('npm', ['test'], {encoding: 'utf8'})
    })
    .it('produces passing tests', () => {
      expect(child.status).to.equal(0)
      expect(child.stdout).to.contain('UserFieldEqualsStep')
      expect(child.stdout).to.not.contain('failing');
      expect(child.stderr).to.not.contain('failing');
    })

  after(() => {
    process.chdir(stashedCwd)
    delete process.env.CRANK_CACHEDIR;
  });

});
