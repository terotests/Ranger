---
title: Types
description: The value types of Ranger and how the compiler writes them for each target language.
---

Ranger has static types. The compiler finds the type of a variable from the
value, or the program declares the type after a colon.

```lisp
def count 10            ; the compiler finds the type int
def ratio:double 0.5    ; the program declares the type
```

## Primitive types

| Type | Content | Example of a value |
| --- | --- | --- |
| `int` | A whole number. The target uses a 64 bit integer when it has one. | `42` |
| `double` | A number with a fraction. | `3.14` |
| `string` | Text. | `"Ranger"` |
| `char` | One character. | `'a'` |
| `boolean` | `true` or `false`. | `true` |

The compiler also has fixed width integer types: `int8`, `int16`, `int32`,
`int64` and the unsigned types. Use them when the program writes a binary
format or when it must agree with a C structure.

## Collections

| Type | Content | Declaration |
| --- | --- | --- |
| Array | Values of one type, in order. | `def items:[int]` |
| Hash map | Values with a key. | `def ages:[string:int]` |

```lisp
def items:[int]
push items 10
print ("count " + (size items))

def ages:[string:int]
set ages "ada" 36
```

The [array operators](/Ranger/docs/reference/operators/array/) and the
[map operators](/Ranger/docs/reference/operators/map/) hold the complete list.

## Buffers

A buffer holds binary data. The types are `buffer`, `int_buffer`,
`double_buffer` and `charbuffer`. A buffer compiles to the binary type of the
target: `Uint8Array` in JavaScript, `[]byte` in Go, `Vec<u8>` in Rust.

## Optional types

An optional value is a value that can be empty. The annotation `@(optional)`
marks it:

```lisp
def name@(optional):string
```

[Optional values](/Ranger/docs/language/optionals/) describes the operators that
read an optional value.

## Generic types

The letter `T` in an operator signature is a type parameter. The operator
accepts a value of any type, and the compiler holds the type through the call.
The [generic operators](/Ranger/docs/reference/operators/generic/) use this.
