---
title: Operators
description: What an operator is in Ranger, how a template writes the target code, and how to read the reference.
---

An operator is the smallest unit of the language. `print`, `+`, `if`, `push`
and `substring` are operators. The compiler does not hold their code: it holds
a template per target language, and the template writes the target code.

## Where the operators are

| Source | Availability |
| --- | --- |
| `compiler/Lang.rgr` | Always. The core of the language. |
| `lib/stdops.rgr` | Always. The compiler loads it with the core. |
| The other files in `lib/` | After an `Import` statement in the program. |

The [operator reference](/Ranger/docs/reference/operators/statements/) holds the
core operators. The [library operators](/Ranger/docs/reference/libraries/json/)
hold the rest.

## A definition

This is the definition of the remainder operator in `compiler/Lang.rgr`:

```lisp
%  _:int (left:int right:int) {
    templates {
        * ( (e 1) " % " (e 2) )
    }
}
```

| Part | Meaning |
| --- | --- |
| `%` | The name of the operator. |
| `_` | No implementation function. A name here calls a function of the compiler. |
| `:int` | The operator gives an integer. |
| `(left:int right:int)` | Two integer arguments. |
| `templates` | The code that each target writes. |
| `*` | The default template. Each target that has no template of its own uses it. |

## Template commands

| Command | Function |
| --- | --- |
| `(e N)` | Write argument `N` as an expression. The first argument is 1. |
| `(block N)` | Write argument `N` as a block. |
| `(typeof N)` | Write the type name of argument `N`. |
| `nl` | Write a new line. |
| `I` and `i` | Increase and decrease the indentation. |
| `"text"` | Write the text. |
| `(imp "x")` | Add an import statement for `x` to the output file. |
| `(polyfill "location" "code")` | Add helper code to the output file. |

A polyfill is helper code that the operator needs. The compiler adds it one
time, also when the program uses the operator many times.

## Target support

An operator does not have a template for every target. The reference states
this for each operator:

| State | Meaning |
| --- | --- |
| Own template | The operator has a template for that target. |
| Default template | The operator uses the `*` template. |
| No template | The compiler writes no code. A program that uses the operator does not compile for that target. |

The [coverage page](/Ranger/docs/reference/coverage/) counts the three states
per target.

## Overloads

Two operators can have the same name and different argument types. `+` for two
integers and `+` for two strings are different operators with different
templates. The reference gives each one its own entry, and the argument types
in the entry show which one the compiler selects.
