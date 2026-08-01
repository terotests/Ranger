---
title: The first program
description: A small Ranger program, the compile command and the code that the compiler writes for three targets.
---

## The program

Write this text into `hello.rgr`:

```lisp
class Main {
    sfn main:void () {
        def name "world"
        print ("hello " + name)
    }
}
```

The program has one class. The static function `main` is the entry point. The
operator `def` declares a variable, and the compiler finds the type of the
variable from the value.

## Compile the program

```sh
rgrc hello.rgr -l=es6 -d=./bin -o=hello.js
node bin/hello.js
```

The program writes `hello world`.

## The same program for other targets

```sh
rgrc hello.rgr -l=go -d=./bin -o=hello.go
rgrc hello.rgr -l=python -d=./bin -o=hello.py
rgrc hello.rgr -l=rust -d=./bin -o=hello.rs
```

The [operator reference](/Ranger/docs/reference/operators/statements/) shows the
generated code of each operator for each target language.

## The next step

- [Program structure](/Ranger/docs/language/structure/) describes classes and functions.
- [Types](/Ranger/docs/language/types/) describes the type system.
- [Target languages](/Ranger/docs/targets/overview/) describes what each target supports.
