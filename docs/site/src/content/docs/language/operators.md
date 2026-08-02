---
title: Operators
description: What an operator is in Ranger, how a template writes the target code, and how to read the reference.
---

An operator is the smallest unit of the language. `print`, `+`, `if`, `push`
and `substring` are operators. The compiler does not hold their code: it holds
a template per target language, and the template writes the target code.

## The two mechanisms

Ranger has two operator mechanisms, and the difference decides the portability
of the operator.

| Mechanism | Declaration | The compiler writes it for |
| --- | --- | --- |
| Template operator | `operators { }` or `commands { }`, with one template per target | The targets that have a template, and the targets that the `*` template covers |
| Type method | `operator type:<T> all { fn … }`, with a Ranger body | Every target that compiles the library |

A template operator is a primitive: the compiler has no code for it, only a
string per target. A type method is ordinary Ranger code. The compiler compiles
it for the target in the same way as the program, so a new target gets it with
no work.

The call form is different:

```lisp
def rem (% a b)                          ; a template operator, prefix form
def large (numbers.filter({ return (item > 3) }))   ; a type method
```

## Where the operators are

| Source | Availability |
| --- | --- |
| `compiler/Lang.rgr` | Always. The core of the language. |
| `lib/stdops.rgr` | Always. The compiler loads it with the core. |
| The other files in `lib/` | After an `Import` statement in the program. |

The [operator reference](/Ranger/docs/reference/operators/statements/) holds the
core template operators. The
[library operators](/Ranger/docs/reference/libraries/json/) hold the library
template operators, and the
[type methods](/Ranger/docs/reference/methods/stdlib/) hold the second
mechanism.

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

| State | Mark | Meaning |
| --- | --- | --- |
| Own template | ✔ | The operator has a template for that target. The operator works. |
| Default template | ✱ | The operator has no template of its own, and the `*` template writes the code. |
| No template | ✕ | The operator has no template and no `*` template. The compiler writes no code, and a program that uses the operator does not compile for that target. |

### What the default template can hold

Most `*` templates are portable, because they hold an expression that each
target language accepts. The template of `%` is `(e 1) " % " (e 2)`, and every
target writes `%` for a remainder.

The `*` template is also the JavaScript template of many operators. The
JavaScript writer needs no entry of its own when the default holds its form.
Such a template is correct for JavaScript and wrong for a target that falls
back to it:

```lisp
ceil  _:int (value:double) {
    templates {
        ...
        * ( "Math.ceil(" (e 1) ")" )
    }
}
```

Python had no `ceil` template until this release, so it took the default one.
The compilation reported success and the Python file held `Math.ceil(d)`, which
Python cannot run. `ceil` now has a Python template, and the
[coverage page](/Ranger/docs/reference/coverage/) states which operators are
still in that state.

The mark ✱ therefore states the origin of the code. Compile the output of a new
operator with the toolchain of the target before you depend on it.

TypeScript is the JavaScript writer with type annotations, so a TypeScript
program uses the `es6` template of the operator. The reference gives TypeScript
the state of JavaScript when the operator holds no TypeScript template of its
own.

The reference gives the first two states the same colour and a different mark,
because the difference between them is the origin of the code. The
[coverage page](/Ranger/docs/reference/coverage/) counts the three states per
target.

## Overloads

Two operators can have the same name and different argument types. `+` for two
integers and `+` for two strings are different operators with different
templates. The reference gives each one its own entry, and the argument types
in the entry show which one the compiler selects.
