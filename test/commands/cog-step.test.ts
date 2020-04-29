import * as fs from 'fs'
import {expect, test} from '@oclif/test'
import * as inquirer from 'inquirer'
import { sync as rmRfSync } from 'rimraf';

const cacheDir: string = `${__dirname}/../.test_cache`;

describe('cog:step', () => {

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
        doneCallback();
      }}}};
    })
    .command(['cog:step', 'automatoninc/metacog', '--step=AssertZoundsStep'])
    .exit(1)
    .it('error response rendered correctly', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Password is incorrect.');
      expect(ctx.stderr).to.contain('Done');

      // Assert step response records.
      expect(ctx.stdout).to.contain('Contrived Error Table:');
      expect(ctx.stdout).to.match(/Error Code\s+Error Message\s+Error Name/gmi);
      expect(ctx.stdout).to.match(/401\s+Re-auth with blah-blah-blah...\s+Incorrect Password/gmi);
      expect(ctx.stdout).to.match(/500\s+I told you this was contrived...\s+Some other error/gmi);
      expect(ctx.stdout).to.contain('Contrived Error Image written to:');
    });

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'NotZounds.'});
        doneCallback();
      }}}};
    })
    .command(['cog:step', 'automatoninc/metacog', '--step=AssertZoundsStep'])
    .exit(1)
    .it('fail response rendered correctly', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Text equals NotZounds., but Zounds! was expected.');
      expect(ctx.stderr).to.contain('Running... Done');

      // Assert step response records.
      expect(ctx.stdout).to.contain('Contrived Zound Record:');
      expect(ctx.stdout).to.match(/Field\s+Value/gmi);
      expect(ctx.stdout).to.match(/text\s+NotZounds\./gmi);
      expect(ctx.stdout).to.match(/zounds\s+0/gmi);
    })

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'Zounds!'});
        doneCallback();
      }}}};
    })
    .command(['cog:step', 'automatoninc/metacog', '--step=AssertZoundsStep'])
    .it('pass response rendered correctly', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Text Zounds! equals Zounds!, as expected.');
      expect(ctx.stderr).to.contain('Running... Done');

      // Assert step response records.
      expect(ctx.stdout).to.contain('Contrived Zound Record:');
      expect(ctx.stdout).to.match(/Field\s+Value/gmi);
      expect(ctx.stdout).to.match(/text\s+Zounds!/gmi);
      expect(ctx.stdout).to.match(/zounds\s+1/gmi);
    })

  test
    .stdout()
    .stderr()
    .stub(inquirer, 'prompt', () => {
      // This is the only sensible way to stub step prompt inquiry.
      return {ui: {process: {subscribe: (answer: Function, errCallback: Function, doneCallback: Function) => {
        answer({name: 'moreThanText', answer: 'Zounds!'});
        doneCallback();
      }}}};
    })
    .command(['cog:step', 'automatoninc/metacog', '--step=AssertZoundsStep', '--use-ssl'])
    .it('runs step using ssl', ctx => {
      // Assert running helpers and basic response text.
      expect(ctx.stdout).to.contain('Text Zounds! equals Zounds!, as expected.');
      expect(ctx.stderr).to.contain('Running... Done');
    })

  test
    .stdout()
    .stderr()
    .command(['cog:step', 'automatoninc/does-not-exist'])
    .exit(1)
    .it('exits 1 when cog is non-existent', ctx => {
      // Assert basic response text.
      expect(ctx.stderr).to.contain("Couldn't find a Cog named automatoninc/does-not-exist");
    })

  after(() => {
    delete process.env.CRANK_CACHEDIR;
  });

});
