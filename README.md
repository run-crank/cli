crank
=====

Developer SDK for Automaton.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/crank.svg)](https://npmjs.org/package/crank)
[![Downloads/week](https://img.shields.io/npm/dw/crank.svg)](https://npmjs.org/package/crank)
[![License](https://img.shields.io/npm/l/crank.svg)](https://github.com/the-automaton/crank/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g crank
$ crank COMMAND
running command...
$ crank (-v|--version|version)
crank/0.1.0 darwin-x64 node-v10.13.0
$ crank --help [COMMAND]
USAGE
  $ crank COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`crank cog:auth COGNAME`](#crank-cogauth-cogname)
* [`crank cog:install [COGNAME]`](#crank-coginstall-cogname)
* [`crank cog:scaffold`](#crank-cogscaffold)
* [`crank cog:step COGNAME`](#crank-cogstep-cogname)
* [`crank cog:steps COGNAME`](#crank-cogsteps-cogname)
* [`crank cog:uninstall COGNAME`](#crank-coguninstall-cogname)
* [`crank help [COMMAND]`](#crank-help-command)
* [`crank registry:rebuild`](#crank-registryrebuild)
* [`crank run FILEORFOLDER`](#crank-run-fileorfolder)
* [`crank update [CHANNEL]`](#crank-update-channel)

## `crank cog:auth COGNAME`

(Re-)Authenticate an installed cog.

```
USAGE
  $ crank cog:auth COGNAME

ARGUMENTS
  COGNAME  The name/version of the cog to authenticate.

EXAMPLE
  $ crank cog:auth MyCog
```

_See code: [src/commands/cog/auth.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/auth.ts)_

## `crank cog:install [COGNAME]`

Install an Automaton cog on this system.

```
USAGE
  $ crank cog:install [COGNAME]

ARGUMENTS
  COGNAME  The name/version of the cog to install (@todo not implemented yet)

OPTIONS
  -f, --force                                Install this cog over any preexisting installation with the same name
  --ignore-auth                              Suppress prompts for cog auth details
  --local-start-command=local-start-command  Command to start the local cog (used in combo with --source=local)
  --source=source                            [default: docker] Use if you are installing a locally developed cog

EXAMPLE
  $ crank install --source=local
```

_See code: [src/commands/cog/install.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/install.ts)_

## `crank cog:scaffold`

Generate boilerplate code for a new cog in a language of your choice.

```
USAGE
  $ crank cog:scaffold

OPTIONS
  -o, --output-directory=output-directory  [default: /Users/eapeterson/Sites/automaton/crank] The directory where
                                           scaffolded code will be placed (defaults to the current working directory).

  --[no-]include-example-step              Scaffolded code will include an example step and tests (prepend with --no- to
                                           negate

  --language=typescript                    The programming language you want to use to build your cog.

  --name=name                              The friendly, human name of your cog

  --org=org                                Your organization's name (e.g. from docker hub or github)

EXAMPLE
  $ crank cog:scaffold
```

_See code: [src/commands/cog/scaffold.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/scaffold.ts)_

## `crank cog:step COGNAME`

Run a single cog step interactively.

```
USAGE
  $ crank cog:step COGNAME

OPTIONS
  -s, --use-ssl  Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs
                 you are building).

  --step=step    The stepId of the step you wish to run

EXAMPLES
  $ crank cog:step MyCog
  $ crank cog:step MyCog --step=MyStepId
```

_See code: [src/commands/cog/step.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/step.ts)_

## `crank cog:steps COGNAME`

Run multiple cog steps interactively.

```
USAGE
  $ crank cog:steps COGNAME

OPTIONS
  -s, --use-ssl  Use SSL when invoking all cogs (useful for testing SSL support for cogs you are building).
  --step=step    The stepId of the step you wish to run. Provide multiple steps by passing this flag multiple times.

EXAMPLE
  $ crank cog:steps MyCog
```

_See code: [src/commands/cog/steps.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/steps.ts)_

## `crank cog:uninstall COGNAME`

Uninstall an Automaton cog from this system.

```
USAGE
  $ crank cog:uninstall COGNAME

OPTIONS
  --ignore-auth  Will retain any cog auth details in cache

EXAMPLE
  $ crank uninstall MyCog
```

_See code: [src/commands/cog/uninstall.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/cog/uninstall.ts)_

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

## `crank registry:rebuild`

Rebuild the cog registry (not unlike blowing on an old video game cartridge)

```
USAGE
  $ crank registry:rebuild

EXAMPLE
  $ crank registry:rebuild
```

_See code: [src/commands/registry/rebuild.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/registry/rebuild.ts)_

## `crank run FILEORFOLDER`

Run one or several scenario files or folders.

```
USAGE
  $ crank run FILEORFOLDER

OPTIONS
  -s, --use-ssl  Use SSL to secure communications between crank and all cogs (useful for testing SSL support for cogs
                 you are building).

EXAMPLES
  $ crank run /path/to/scenario.yml
  $ crank run --use-ssl /path/to/scenario-folder
```

_See code: [src/commands/run.ts](https://github.com/the-automaton/crank/blob/v0.1.0/src/commands/run.ts)_

## `crank update [CHANNEL]`

update the crank CLI

```
USAGE
  $ crank update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.9/src/commands/update.ts)_
<!-- commandsstop -->
