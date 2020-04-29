import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import * as inquirer from 'inquirer'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:steps', () => {

  before(() => {
    process.env.CRANK_CACHEDIR = cacheDir;
    rmRfSync(cacheDir);
    require('child_process').spawnSync('mkdir', [cacheDir]);
  });

  beforeEach(() => {
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
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      // Write bad password to default profile; this triggers step error condition.
      fs.writeFileSync(`${cacheDir}/default-profile.json`, JSON.stringify([{
        cog: 'automatoninc/metacog',
        auth: {
          password: 'NotCrank123',
        }
      }]), {encoding: 'utf8'});
    })
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'Does not matter'});
        answer({name: 'moreThanText', answer: 'Does not matter'});
        doneCallback();
      }}}};
    })
    .command(['cog:steps', 'automatoninc/metacog', '--step=AssertZoundsStep', '--step=AssertZoundsStep'])
    .exit(1)
    .it('error responses rendered correctly', ctx => {
      // Assert running helpers and basic response text (x2)
      expect(ctx.stdout).to.contain('Ad-hoc scenario');
      expect(ctx.stdout).to.match(/Password is incorrect.*Password is incorrect/is);
      expect(ctx.stderr).to.contain('Done');

      // Assert step response records (x2)
      expect(ctx.stdout).to.match(/Contrived Error Table:.*Contrived Error Table:/is);
      expect(ctx.stdout).to.match(/Contrived Error Image written to:.*Contrived Error Image written to:/is);

      // Assert timer and pass/fail messages.
      expect(ctx.stdout).to.match(/2 failing \(\d+\.\d+s\)/is);
    });

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'NotZounds.'});
        answer({name: 'moreThanText', answer: 'NotZounds.'});
        doneCallback();
      }}}};
    })
    .command(['cog:steps', 'automatoninc/metacog', '--step=AssertZoundsStep', '--step=AssertZoundsStep'])
    .exit(1)
    .it('fail responses rendered correctly', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Ad-hoc scenario');
      expect(ctx.stdout).to.match(/Text equals NotZounds\., but Zounds! was expected\..*Text equals NotZounds\., but Zounds! was expected\./is);
      expect(ctx.stderr).to.contain('Running... Done');

      // Assert step response records.
      expect(ctx.stdout).to.match(/Contrived Zound Record:.*Contrived Zound Record:/is);

      // Assert timer and pass/fail messages.
      expect(ctx.stdout).to.match(/2 failing \(\d+\.\d+s\)/is);
    })

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'Zounds!'});
        answer({name: 'moreThanText', answer: 'Zounds!'});
        doneCallback();
      }}}};
    })
    .command(['cog:steps', 'automatoninc/metacog', '--step=AssertZoundsStep', '--step=AssertZoundsStep'])
    .it('pass responses rendered correctly', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Ad-hoc scenario');
      expect(ctx.stdout).to.match(/Text Zounds! equals Zounds!, as expected\..*Text Zounds! equals Zounds!, as expected\./is);
      expect(ctx.stderr).to.contain('Running... Done');

      // Assert step response records.
      expect(ctx.stdout).to.match(/Contrived Zound Record:.*Contrived Zound Record:/is);

      // Assert timer and pass/fail messages.
      expect(ctx.stdout).to.match(/2 passing \(\d+\.\d+s\)/is);
    })

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'Zounds!'});
        answer({name: 'moreThanText', answer: 'Zounds!'});
        doneCallback();
      }}}};
    })
    .command(['cog:steps', 'automatoninc/metacog', '--step=AssertZoundsStep', '--step=AssertZoundsStep', '--use-ssl'])
    .it('runs steps using ssl', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Ad-hoc scenario');
      expect(ctx.stdout).to.match(/Text Zounds! equals Zounds!, as expected\..*Text Zounds! equals Zounds!, as expected\./is);
      expect(ctx.stderr).to.contain('Running... Done');
    })

  test
    .stdout()
    .stderr()
    .command(['cog:steps', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits 1 when cog is non-existent', ctx => {
      // Assert basic response text.
      expect(ctx.stderr).to.contain("Couldn't find a Cog named automatoninc/does-not-exist");
    })

  test
    .stdout()
    .stderr()
    .command(['cog:steps', 'automatoninc/metacog', '--step=StepDoesNotExist'])
    .exit(1)
    .it('exits 1 when step is non-existent', ctx => {
      // Assert basic response text.
      expect(ctx.stdout).to.contain("Couldn't find step StepDoesNotExist on automatoninc/metacog cog.");
    })

  after(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
