---
title: Optional values
description: How Ranger declares a value that can be empty, and the operators that read it.
---

An optional value holds a value or holds nothing. The compiler does not let the
program read the value directly, because the value can be empty.

## Declaration

```lisp
def name@(optional):string
```

The annotation `@(optional)` is after the name and before the type.

## Read an optional value

| Operator | Function |
| --- | --- |
| `??` | Give the value, or give the second argument when the value is empty. |
| `!!` | Give the value. The program stops when the value is empty. |
| `unwrap` | The same as `!!`. |
| `null?` | Give `true` when the value is empty. |
| `!null?` | Give `true` when the value is not empty. |
| `wrap` | Make an optional value from a value. |
| `nullify` | Make the optional value empty. |

```lisp
def name@(optional):string
def shown (?? name "unknown")
print ("name " + shown)

if (null? name) {
    print "the name is empty"
}
```

The operators are in prefix form: the operator is first and the arguments are
after it.

## Narrowing with `if (!null? …)`

In the then block of `if (!null? x)`, an optional object is not empty. The
program can read its fields and call its methods without `unwrap`:

```lisp
fn describe:string (p@(optional):Person) {
    if (!null? p) {
        return (p.greet() + " " + p.name)
    }
    return "nobody"
}
```

A condition narrows the value only when it must be true for the block to run:
one `!null?`, or `!null?` checks joined with `&&`. A path such as `a.friend`
is narrowed in the same way.

These are not narrowed at this time:

- a condition with `||`
- the code after `if (null? p) { return … }`
- the else branch of `if (null? p)`
- an optional `int` or `double`: use `(unwrap n)`
- a copy such as `def q:Person p`: `q` is optional

## What the compiler writes

Each target language has its own way to hold an empty value. The compiler
writes the correct one:

| Target | Empty value |
| --- | --- |
| JavaScript | `undefined` |
| Go | A structure with a `has_value` field |
| Rust | `Option<T>` |
| C++ | `std::optional<T>` |
| Swift | An optional type |
| Java | `null` |

The [generic operators](/Ranger/docs/reference/operators/generic/) page shows
the generated code of each operator for each target.

## Strict mode

Without a flag, the compiler reads an optional value automatically where the
program uses it. The flag `-strict` stops the automatic read of an optional
value outside of a `try` block or a narrowed `if (!null? …)` block. Use the
flag when the program must handle each empty value.
