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

## What the compiler writes

Each target language has its own way to hold an empty value. The compiler
writes the correct one:

| Target | Empty value |
| --- | --- |
| JavaScript | `undefined` |
| Go | A structure with a `has_value` field |
| Rust | `Option<T>` |
| Swift | An optional type |
| Java | `null` |

The [generic operators](/Ranger/docs/reference/operators/generic/) page shows
the generated code of each operator for each target.

## Strict mode

The flag `-strict` stops the automatic read of an optional value outside of a
`try` block. Use the flag when the program must handle each empty value.
