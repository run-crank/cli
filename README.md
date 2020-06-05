crank
=====

[![CircleCI](https://circleci.com/gh/run-crank/cli/tree/master.svg?style=svg)](https://circleci.com/gh/run-crank/cli/tree/master)

BDD test automation for integrated SaaS, by Automaton.

* [Usage](#usage)
* [Commands](#commands)
* [Development](#development)

# Usage
```sh-session
$ curl -s https://get.crank.run/install.sh | sh
$ crank COMMAND
running command...
$ crank (-v|--version|version)
crank/x.y.z darwin-x64 node-vA.B.C
$ crank --help [COMMAND]
USAGE
  $ crank COMMAND
...
```

# Commands
<!-- commands -->
* [`crank cog:auth COGNAME`](#crank-cogauth-cogname)
* [`crank cog:install [COGNAME]`](#crank-coginstall-cogname)
* [`crank cog:readme [COGNAME]`](#crank-cogreadme-cogname)
* [`crank cog:scaffold`](#crank-cogscaffold)
* [`crank cog:step COGNAME`](#crank-cogstep-cogname)
* [`crank cog:steps COGNAME`](#crank-cogsteps-cogname)
* [`crank cog:uninstall COGNAME`](#crank-coguninstall-cogname)
* [`crank help [COMMAND]`](#crank-help-command)
* [`crank registry:cogs`](#crank-registrycogs)
* [`crank registry:rebuild [COGNAME]`](#crank-registryrebuild-cogname)
* [`crank registry:steps`](#crank-registrysteps)
* [`crank run FILE`](#crank-run-file)
* [`crank update [CHANNEL]`](#crank-update-channel)

## `crank cog:auth COGNAME`

(Re-)Authenticate an installed Cog.

```
USAGE
  $ crank cog:auth COGNAME

ARGUMENTS
  COGNAME  The name/version of the Cog to authenticate.

EXAMPLE
  $ crank cog:auth MyCog
```

_See code: [src/commands/cog/auth.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/auth.ts)_

## `crank cog:install [COGNAME]`

Install a Cog on this system.

```
USAGE
  $ crank cog:install [COGNAME]

ARGUMENTS
  COGNAME  The name:version of the Cog to install (e.g. org-name/cog-name:1.0.0)

OPTIONS
  -f, --force                                Install this Cog over any preexisting installation with the same name
  --debug                                    More verbose output to aid in diagnosing issues using Crank
  --ignore-auth                              Suppress prompts for Cog auth details
  --local-start-command=local-start-command  Command to start the local Cog (used in combo with --source=local)
  --source=source                            [default: docker] Use if you are installing a locally developed Cog

EXAMPLE
  $ crank install --source=local
```

_See code: [src/commands/cog/install.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/install.ts)_

## `crank cog:readme [COGNAME]`

Adds usage instructions to README.md in current directory

```
USAGE
  $ crank cog:readme [COGNAME]

ARGUMENTS
  COGNAME  The name of the Cog the README.md represents

DESCRIPTION
  The readme must have any of the following tags inside of it for it to be replaced or else it will do nothing:
  ### Authentication
  <!-- authenticationDetails -->
  ### Steps
  <!-- stepDetails -->
```

_See code: [src/commands/cog/readme.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/readme.ts)_

## `crank cog:scaffold`

Generate boilerplate code for a new Cog in a language of your choice.

```
USAGE
  $ crank cog:scaffold

OPTIONS
  -o, --output-directory=output-directory  [default: /Users/eapeterson/Sites/automaton/crank] The directory where
                                           scaffolded code will be placed (defaults to the current working directory).

  --copyright-owner=copyright-owner        Name of the copyright owner to include in the license file, if specified.

  --[no-]include-example-step              Scaffolded code will include an example step and tests (prepend with --no- to
                                           negate)

  --[no-]include-mit-license               Scaffolded code will include MIT license text in LICENSE file at the project
                                           root.

  --language=typescript                    The programming language you want to use to build your cog.

  --name=name                              The friendly, human name of your cog

  --org=org                                Your organization's name (e.g. from docker hub or github)

EXAMPLE
  $ crank cog:scaffold
```

_See code: [src/commands/cog/scaffold.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/scaffold.ts)_

## `crank cog:step COGNAME`

Run a single Cog step interactively.

```
USAGE
  $ crank cog:step COGNAME

OPTIONS
  -s, --use-ssl  Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs
                 you are building).

  --debug        More verbose output to aid in diagnosing issues using Crank

  --step=step    The stepId of the step you wish to run

EXAMPLES
  $ crank cog:step MyCog
  $ crank cog:step MyCog --step=MyStepId
```

_See code: [src/commands/cog/step.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/step.ts)_

## `crank cog:steps COGNAME`

Run multiple Cog steps interactively.

```
USAGE
  $ crank cog:steps COGNAME

OPTIONS
  -s, --use-ssl  Use SSL when invoking all Cogs (useful for testing SSL support for Cogs you are building).
  --debug        More verbose output to aid in diagnosing issues using Crank
  --step=step    The stepId of the step you wish to run. Provide multiple steps by passing this flag multiple times.

EXAMPLE
  $ crank cog:steps MyCog
```

_See code: [src/commands/cog/steps.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/steps.ts)_

## `crank cog:uninstall COGNAME`

Uninstall a Cog from this system.

```
USAGE
  $ crank cog:uninstall COGNAME

OPTIONS
  --debug              More verbose output to aid in diagnosing issues using Crank
  --force              Will uninstall the Cog without prompting for confirmation
  --ignore-auth        Will retain any Cog auth details in cache
  --keep-docker-image  Will keep the docker image associated with the Cog

EXAMPLE
  $ crank uninstall automatoninc/my-cog
```

_See code: [src/commands/cog/uninstall.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/cog/uninstall.ts)_

## `crank help [COMMAND]`

display help for crank

```
USAGE
  $ crank help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `crank registry:cogs`

List Cogs that are currently installed on this machine

```
USAGE
  $ crank registry:cogs

OPTIONS
  -x, --extended     show extra columns
  --columns=columns  only show provided columns (comma-separated)
  --csv              output is csv format
  --filter=filter    filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --sort=sort        property to sort by (prepend '-' for descending)

EXAMPLES
  $ crank registry:cogs
  $ crank registry:cogs --extended --no-truncate
```

_See code: [src/commands/registry/cogs.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/registry/cogs.ts)_

## `crank registry:rebuild [COGNAME]`

Rebuild the Cog registry (not unlike blowing on an old video game cartridge)

```
USAGE
  $ crank registry:rebuild [COGNAME]

ARGUMENTS
  COGNAME  The name of a specific Cog whose registry entry should be rebuilt

EXAMPLES
  $ crank registry:rebuild
  $ crank registry:rebuild my-org/my-cog
```

_See code: [src/commands/registry/rebuild.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/registry/rebuild.ts)_

## `crank registry:steps`

List steps that are currently available on this machine

```
USAGE
  $ crank registry:steps

OPTIONS
  -x, --extended     show extra columns
  --columns=columns  only show provided columns (comma-separated)
  --csv              output is csv format
  --filter=filter    filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --sort=sort        property to sort by (prepend '-' for descending)

EXAMPLES
  $ crank registry:steps
  $ crank registry:steps --extended --no-truncate
```

_See code: [src/commands/registry/steps.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/registry/steps.ts)_

## `crank run FILE`

Run a .crank.yml scenario file or folder of files.

```
USAGE
  $ crank run FILE

OPTIONS
  -s, --use-ssl      Use SSL to secure communications between crank and all cogs (useful for testing SSL support for
                     cogs you are building).

  -t, --token=token  Set one or more contextual token values for this scenario; provide several by passing this flag
                     multiple times.

  --debug            More verbose output to aid in diagnosing issues using Crank

EXAMPLES
  $ crank run /path/to/scenario.crank.yml
  $ crank run --use-ssl /path/to/scenario-folder
  $ crank run scenario.crank.yml --token utmSource=Email -t "utmCampaign=Test Campaign"
```

_See code: [src/commands/run.ts](https://github.com/run-crank/cli/blob/v0.10.1/src/commands/run.ts)_

## `crank update [CHANNEL]`

update the crank CLI

```
USAGE
  $ crank update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.9/src/commands/update.ts)_
<!-- commandsstop -->

# Development

Contributions are welcome and encouraged. For any major changes or additions,
please open up an issue first.

1. Fork and clone this repository
2. Run `npm install` to retrieve all packaged dependencies
3. Run `npm test` to run any automated tests and check code style
4. Modify commands and other code in the `src` folder (tests in `test`)
5. Run modified commands by running `./bin/run` from the root of your cloned
   project. For example, `./bin/run cog:step automatoninc/web` would run the
   `cog:step` command modified within the repo, rather than the global
   `crank cog:step` command. Confusingly `./bin/run run` is equivalent to
   running `crank run`.
