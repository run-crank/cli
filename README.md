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
crank/0.0.0 darwin-x64 node-v10.13.0
$ crank --help [COMMAND]
USAGE
  $ crank COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`crank hello [FILE]`](#crank-hello-file)
* [`crank help [COMMAND]`](#crank-help-command)

## `crank hello [FILE]`

describe the command here

```
USAGE
  $ crank hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ crank hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/the-automaton/crank/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
