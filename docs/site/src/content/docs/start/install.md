---
title: Install the compiler
description: How to install the Ranger compiler from npm and how to read its command line options.
---

## Requirements

The compiler is a JavaScript program. Node.js 18 or a later version runs it.

## Installation

Install the compiler from npm:

```sh
npm install -g ranger-compiler
```

The command `rgrc` is then available.

## Command line

The compiler reads one source file and writes one output file:

```sh
rgrc program.rgr -l=go -d=./bin -o=program.go
```

| Option | Function |
| --- | --- |
| `-l=<target>` | The target language. One of `es6`, `go`, `scala`, `java7`, `swift3`, `swift6`, `kotlin`, `cpp`, `php`, `csharp`, `python`, `rust`. |
| `-d=<directory>` | The output directory. The default is `bin/`. |
| `-o=<file>` | The output file. The default is `output.<extension>`. |
| `-typescript` | Write JavaScript with TypeScript annotations. |
| `-nodemodule` | Export the classes as CommonJS modules. |
| `-esm` | Export the classes as ES6 modules. |
| `-sourcemap` | Write a source map with the JavaScript or the TypeScript output. |
| `-operatordoc=<file>` | Write the operator table into a Markdown file. |
| `-classdoc=<file>` | Write the class documentation into a Markdown file. |

To see the complete list, run `rgrc` with no arguments.

## Compile without an installation

The playground compiles Ranger in the browser. It needs no installation. Open
[the playground](/Ranger/) and write the program in the editor.
