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

An array and a hash map are ready for use after the declaration. The compiler
initializes them.

```lisp
def items:[int]
push items 10
print ("count " + (size items))

def ages:[string:int]
set ages "ada" 36                ; write a key
if (has ages "ada") { }          ; test a key
def age (get ages "ada")         ; read a key
```

The `get` operator gives an optional value, because the key can be absent.
[Optional values](/Ranger/docs/language/optionals/) describes how the program
reads it.

The [array operators](/Ranger/docs/reference/operators/array/) and the
[map operators](/Ranger/docs/reference/operators/map/) hold the complete list.

## Enum

An `Enum` declares a set of names. The compiler gives each name an integer
value, and it checks the type of each use.

```lisp
Enum LineJoin (
    Undefined
    Miter
    Round
    Bevel
)

class Pen {
    def lineType:LineJoin LineJoin.Undefined
}
```

The target language receives the type `int`. The type check is in the compiler.

An `Enum` gives a name no fields. Use a [shape](/Ranger/docs/language/shapes/)
when each name must carry its own data.

## Shapes

A shape is a closed family of cases. Groups name restricted views of that
family; `match` checks that every reachable case is handled.

```lisp
shape Value {
    group Printable {
        fn render:string ()
    }
    case Num does Printable {
        def n:double 0.0
        fn render:string () {
            return (to_string n)
        }
    }
    case Text does Printable {
        def s:string ""
        fn render:string () {
            return s
        }
    }
}
```

The page [Shapes](/Ranger/docs/language/shapes/) covers groups, `match`,
required operations, value/reference semantics and per-target representation.

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

A class takes type parameters with the `@params(...)` annotation. A reference
gives the arguments with `@(...)`.

```lisp
class History @params(Op) {
    def ops:[Op]

    fn record:void (op:Op) {
        push ops op
    }
    fn newest:Op () {
        def v:Op (last ops)
        return v
    }
}

def ints:History@(int) (new History@(int) ())
def texts:History@(string) (new History@(string) ())
```

A type parameter is usable as an array element, as a map value, as a parameter
type and as a return type. A generic class can hold another generic class at
its own parameter, can have a constructor with arguments, and can extend a
plain class.

| The argument can be | Example |
| --- | --- |
| A primitive | `History@(int)` |
| A class or a record | `History@(SlideOp)` |
| A shape | `History@(EditOp)` |
| An array | `History@([string])` |
| A map | `Store@([string:int])` |

There are no bounds and no constraints. Nothing is asked of the argument type.
When a generic class must compare two values, give it the comparison function
at construction.

The compiler makes one concrete class for each set of arguments before it
writes the target code. `History@(int)` becomes the class `History_int`. Two
instantiations are two separate classes. A target language does not need
generics of its own, and no target writes the type parameter.

A generic class has no static side. Only the instantiations exist, so a `sfn`
in a generic class is not reachable. Put the static functions in a plain class.

A trait takes `@params(...)` in the same way. See
[Structure](/Ranger/docs/language/structure/).
