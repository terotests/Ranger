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
is narrowed in the same way. `if x { … }` on an optional object is the same
test as `if (!null? x) { … }`.

In a narrowed block, `def q:Person p` gives `q` the value, not the optional.
The compiler writes it as `def q:Person (unwrap p)`. Each target gets one
unwrap, and the program can also write the `unwrap`: the result is the same.

The value is also not empty in these places:

- the else branch of `if (null? p)`
- the code after `if (null? p) { return … }`. The block can also end with
  `throw`, `break` or `continue`.
- the code after `if (!null? p) { … } { return … }`
- the code after `p = (new Person)`

```lisp
fn describe:string (p@(optional):Person) {
    if (null? p) {
        return "nobody"
    }
    return p.name
}
```

`if ((null? a) || (null? b)) { return … }` is true when one of the values is
empty, so after it both values are not empty.

These are not narrowed at this time:

- `!null?` tests joined with `||`
- an optional `int` or `double`: use `(unwrap n)`

`p = q`, when `q` can be empty, stops the narrowing of `p`.

## Fields

A field without a value is optional:

```lisp
class Encoder {
    def output:Buffer
    Constructor () {
        output = (new Buffer)
    }
    fn write:void (b:int) {
        output.writeByte(b)
    }
}
```

When the constructor assigns the field in its own body, not in an `if` or a
loop, the object always has the value. The flag `-strict` accepts
`output.writeByte(b)` without `unwrap`. In the constructor, the value is there
after the statement that assigns it.

A field that a method sets before the program reads it has the annotation
`@(late)`:

```lisp
class SheetView {
    def model@(late):SheetModel
    fn attach:void (m:SheetModel) {
        model = m
    }
    fn rowCount:int () {
        return model.rowCount
    }
}
```

The flag `-strict` accepts `model.rowCount`. The field stays optional in the
generated code. Use `@(late)` only when the program sets the field first. A
field that can stay empty is `@(optional)`, and the program examines it with
`!null?`.

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
value outside of a `try` block, a narrowed `if (!null? …)` block, a field
that the constructor assigns and a `@(late)` field. Use the flag when the
program must handle each empty value.
