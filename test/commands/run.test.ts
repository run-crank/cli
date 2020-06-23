import * as fs from 'fs'
import * as moment from 'moment';
import {expect, test} from '@oclif/test'
import { sync as rmRfSync } from 'rimraf';

const chrono = require('chrono-node');
const cacheDir: string = `${__dirname}/../.test_cache`;
const scenarioDir: string = `${__dirname}/../fixtures/scenarios`;

describe('run', () => {

  let dateTokenValues: Record<string, moment.Moment> = {};

  before(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir]);
  });

  beforeEach(() => {
    dateTokenValues = {};
    fs.writeFileSync(`${cacheDir}/default-profile.json`, JSON.stringify([{
      cog: 'automatoninc/metacog',
      auth: {
        password: 'Crank123',
      }
    }]), {encoding: 'utf8'});
  });

  test
    .stdout()
    .stderr()
    .command(['cog:install', '--source', 'local', '--local-start-command', './bin/run cog:meta', '--ignore-auth'])
    .it('is setup', ctx => {
      // The remaining tests rely on this cog being installed as normal.
      expect(ctx.stdout).to.contain('Successfully installed automatoninc/metacog cog.')
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/fail-then-pass.crank.yml`])
    .exit(1)
    .it('can run a simple scenario', ctx => {
      expect(ctx.stdout).to.contain('Fail Then Pass');
      expect(ctx.stdout).to.contain('✘ The text Not Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('✓ Then the text Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('1 passing');
      expect(ctx.stdout).to.contain('1 failing');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/fail-then-pass.crank.yml`, '--use-ssl'])
    .exit(1)
    .it('can run a simple scenario over ssl', ctx => {
      expect(ctx.stdout).to.contain('Fail Then Pass');
      expect(ctx.stdout).to.contain('✘ The text Not Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('✓ Then the text Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('1 passing');
      expect(ctx.stdout).to.contain('1 failing');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/can-fail-after.crank.yml`])
    .exit(1)
    .it('respects failAfter setting', ctx => {
      expect(ctx.stdout).to.contain('Can Fail After');
      expect(ctx.stdout).to.contain('✘ The text Not Zounds! should equal Zounds!');
      expect(ctx.stdout).to.match(/\(after \ds\)/is)
      // @todo fix: expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/can-wait-for.crank.yml`])
    .it('respects waitFor setting', ctx => {
      expect(ctx.stdout).to.contain('Can Wait For');
      expect(ctx.stdout).to.contain('✓ The text Zounds! should equal Zounds!');
      expect(ctx.stdout).to.match(/1 passing \(2\.\d+s\)/is)
      expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/cog-step-ids.crank.yml`])
    .it('can run scenarios with cog/step IDs', ctx => {
      expect(ctx.stdout).to.contain('Cog Step IDs');
      expect(ctx.stdout).to.contain('✓ AssertZoundsStep');
      expect(ctx.stdout).to.contain('1 passing');
      expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/uses-embedded-tokens.crank.yml`])
    .it('can use tokens embedded in scenario', ctx => {
      expect(ctx.stdout).to.contain('Uses Embedded Tokens');
      expect(ctx.stdout).to.contain('✓ Then the text Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('1 passing');
      expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/uses-cli-sourced-tokens.crank.yml`, '--token', 'txt.1=Zounds!', '-t', 'txt.2=lol'])
    .exit(1)
    .it('can use tokens from cli flags', ctx => {
      expect(ctx.stdout).to.contain('Uses CLI-Sourced Tokens');
      expect(ctx.stdout).to.contain('✓ Then the text Zounds! should equal Zounds!');
      expect(ctx.stdout).to.contain('✘ And the text lol should equal Zounds!')
      expect(ctx.stdout).to.contain('1 passing');
      expect(ctx.stdout).to.contain('1 failing');
      expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/uses-dynamic-token.crank.yml`])
    .it('can use dynamic tokens', ctx => {
      expect(ctx.stdout).to.contain('Uses Dynamic Token');
      expect(ctx.stdout).to.matches(/✓ Then the text Zounds! should equal Zounds!.*✓ Then the text Zounds! should equal Zounds!/is);
      expect(ctx.stdout).to.contain('2 passing');
      expect(ctx.stdout).to.not.contain('skipped');
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      // It is possible for this test to fail in instances when this step starts
      // just before an hour/day change, and command execution begins just after.
      // ¯\_(ツ)_/¯
      const anchor = new Date();
      dateTokenValues.hourAgo = moment(chrono.parseDate('1 hour ago', anchor));
      dateTokenValues.hourFromNow = moment(chrono.parseDate('1 hour from now', anchor));
      dateTokenValues.dayAgo = moment(chrono.parseDate('1 day ago', anchor));
      dateTokenValues.dayFromNow = moment(chrono.parseDate('1 day from now', anchor));
      dateTokenValues.today = moment(chrono.parseDate('today', anchor));
      dateTokenValues.midnightYesterdayUtc = moment(chrono.parseDate('midnight yesterday utc', anchor));
      dateTokenValues.midnight2DaysAgoUtc = moment(chrono.parseDate('midnight 2 days ago utc', anchor));
      dateTokenValues.midnightTomorrowUtc = moment(chrono.parseDate('midnight tomorrow utc', anchor));
      dateTokenValues.midnight2DaysFromNowUtc = moment(chrono.parseDate('midnight 2 days from now utc', anchor));
    })
    .command(['run', `${scenarioDir}/uses-date-token.crank.yml`])
    .exit(1)
    .it('can use date tokens', ctx => {
      expect(ctx.stdout).to.match(new RegExp(`1 hour ago is ${dateTokenValues.hourAgo.utc().format('YYYY-MM-DD[T]HH')}`));
      expect(ctx.stdout).to.match(new RegExp(`1 hour from now is ${dateTokenValues.hourFromNow.utc().format('YYYY-MM-DD[T]HH')}`));
      expect(ctx.stdout).to.match(new RegExp(`1 day ago is ${dateTokenValues.dayAgo.utc().format('YYYY-MM-DD')}`));
      expect(ctx.stdout).to.match(new RegExp(`1 day from now is ${dateTokenValues.dayFromNow.utc().format('YYYY-MM-DD')}`));
      expect(ctx.stdout).to.match(new RegExp(`today is ${dateTokenValues.today.utc().format('YYYY-MM-DD')}`));
      expect(ctx.stdout).to.match(new RegExp(`m-y is ${dateTokenValues.midnightYesterdayUtc.utc().format('YYYY-MM-DD[T]HH:mm:ss')}`));
      expect(ctx.stdout).to.match(new RegExp(`m-2 is ${dateTokenValues.midnight2DaysAgoUtc.utc().format('YYYY-MM-DD[T]HH:mm:ss')}`));
      expect(ctx.stdout).to.match(new RegExp(`m-t is ${dateTokenValues.midnightTomorrowUtc.utc().format('YYYY-MM-DD[T]HH:mm:ss')}`));
      expect(ctx.stdout).to.match(new RegExp(`mx2 is ${dateTokenValues.midnight2DaysFromNowUtc.utc().format('YYYY-MM-DD[T]HH:mm:ss')}`));
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/many`])
    .exit(1)
    .it('can run a folder of scenarios', ctx => {
      expect(ctx.stdout).to.match(/Many Scenarios 1.*1 passing/is);
      expect(ctx.stdout).to.match(/Many Scenarios 2.*1 passing.*1 failing/is);
      expect(ctx.stdout).to.match(/All Scenarios:.*1 passing.*1 failing/is);
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/error-non-existent-step.crank.yml`])
    .exit(1)
    .it('prints step missing error', ctx => {
      expect(ctx.stdout).to.contain('Error running scenario');
      expect(ctx.stdout).to.contain('Missing step definition for "No step corresponds to this step text."');
      expect(ctx.stdout).to.match(/Run the following to list available steps.*crank registry:steps/is);
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      // Remove credentials to simulate un-authenticated cog.
      fs.writeFileSync(`${cacheDir}/default-profile.json`, JSON.stringify([]), {encoding: 'utf8'});
    })
    .command(['run', `${scenarioDir}/error-unauthenticated-cog.crank.yml`])
    .exit(1)
    .it('prints authentication error', ctx => {
      expect(ctx.stdout).to.contain('Error running scenario');
      expect(ctx.stdout).to.contain('No authentication details found for automatoninc/metacog');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/error-invalid-scenario-yaml.crank.yml`])
    .exit(1)
    .it('prints invalid yaml error', ctx => {
      expect(ctx.stdout).to.contain('Error running scenario');
      expect(ctx.stdout).to.contain('Unable to parse the scenario file');
    });

  test
    .stdout()
    .stderr()
    .command(['run', `${scenarioDir}/error-invalid-scenario-no-steps.crank.yml`])
    .exit(1)
    .it('prints invalid yaml error', ctx => {
      expect(ctx.stdout).to.contain('Error running scenario');
      expect(ctx.stdout).to.contain('Scenario is missing a list of steps');
    });

  after(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
