---
title: Shapes
description: Closed variant families with groups, match exhaustiveness, required operations, and per-target representation.
---

A shape is a closed family of cases. Each case has a name and its own fields. A
value of the shape type holds one case at a time. Groups name restricted views
of that family; they can carry shared fields and required operations, and they
are usable as types. The compiler knows every case, so `match` can require that
every reachable case is handled.

The useful reading order is:

**Shape → Groups → Cases → `match` → Methods / capabilities → Value or reference → Representation**

```lisp
shape Value {
    group Printable {
        fn render:string ()
    }

    group Numeric does Printable {
        fn asDouble:double ()
    }

    case Num does Numeric {
        def value:double 0.0

        fn render:string () {
            return (to_string value)
        }

        fn asDouble:double () {
            return value
        }
    }

    case Text does Printable {
        def value:string ""

        fn render:string () {
            return value
        }
    }

    case Nothing
}
```

A shape has one target-independent semantic model. The compiler may lower it
through case records and a closed union, but each backend is free to use a more
native representation. No target language needs the word `shape` in its source.

## Groups

A group is a **nominal restricted view** of a closed shape family. It can carry
shared fields and behavioral requirements, and it can itself be used as a type.
A case joins a group with `does`. Nested groups widen membership:

```text
Value.Num <: Value.Numeric <: Value.Printable <: Value
```

The first useful group example is a group-typed parameter. Member cases are
accepted without wrapping:

```lisp
shape Ev {
    group Callable {
        fn invoke:string (arg:string)
    }

    case Fn does Callable {
        def name:string ""
        fn invoke:string (arg:string) {
            return ((name + ":") + arg)
        }
    }

    case Builtin does Callable {
        def opcode:string ""
        fn invoke:string (arg:string) {
            return ((opcode + "(") + arg) + ")"
        }
    }
}

fn callIt:string (c:Ev.Callable arg:string) {
    return (Ev.Callable.invoke(c arg))
}
```

Widening follows the subset of cases. A child group may be passed where a parent
group is expected (`Numeric` → `Printable`). The reverse is an error: a
`Printable` may hold a `Text`, so it cannot be passed as `Numeric` without
narrowing.

```lisp
fn needsNumeric:void (v:Value.Numeric) {
}

fn hasPrintable:void (v:Value.Printable) {
    ; needsNumeric(v)   ; compile error — Printable is not Numeric
}
```

## Cases and construction

The constructor of a case takes the fields of the case in order, including
fields inherited from its groups.

```lisp
def a:Value (new Value.Nothing())
def b:Value (new Value.Num(42.0))
def c:Value (new Value.Text("hello"))
```

A case type such as `Value.Num` is also a type. Exact-case methods are available
only when the value is known to be that case.

## `match`

`match` is the checked way to cover a closed family. The compiler requires every
reachable case exactly once. A missing case, a duplicate case, or a catch-all
wildcard is a compile error.

```lisp
fn describe:string (v:Value) {
    match v {
        Nothing {
            return "nothing"
        }
        Num n {
            return (to_string n.value)
        }
        Text t {
            return t.value
        }
    }
}
```

The more important form is a match over a **group** type. Exhaustiveness is
relative to the declared type, not to the whole shape:

```lisp
fn describePrintable:string (v:Value.Printable) {
    match v {
        Num n {
            return (to_string n.value)
        }
        Text t {
            return t.value
        }
    }
}
```

That match is complete because `v` is `Value.Printable`. It does not need to
cover `Nothing`. An arm may also name a group, or join several cases with `|`.

## Required operations

A bodyless method on a group is a **required operation**. Every member case must
provide a compatible implementation. These are not ordinary abstract methods or
virtual dispatch: calls are statically qualified and lower to generated ops
classes with exhaustive dispatch.

```lisp
group Callable {
    fn invoke:string (arg:string)
}

fn callIt:string (c:Ev.Callable arg:string) {
    return (Ev.Callable.invoke(c arg))
}
```

A missing implementation or an incompatible signature is a compiler error. A
group may also supply a default body; a case that replaces it must mark the
replacement with `@(override)`.

Case-only methods stay on the case. Call them after narrowing, or through the
exact case type — for example `Value.Num.doubled(n)` after a `Num n` arm, not
on a `Value.Printable` value.

## Group fields

A field declared on a group is projected through the group type without
narrowing. For a reference group the field is readable and writable; the
compiler lowers the access to generated `get_` / `set_` helpers.

```lisp
shape Value {
    group Ref {
        def identityId:int 0
    }
    case Items does Ref {
        def items:[int]
    }
}

fn readId:int (r:Value.Ref) {
    return r.identityId
}
```

## Value and reference semantics

`@(value)` and `@(reference)` declare observable copy, equality and identity
rules. They are not layout hints.

| | `@(value)` | `@(reference)` |
| --- | --- | --- |
| Copy | copies the payload | shares the payload |
| `==` | compares content | compares identity |
| Identity | none | stable for the value's lifetime |
| Mutable fields | not allowed | allowed |

```lisp
shape Value {
    group Prim @(value)
    group Ref @(reference) {
        def identityId:int 0
    }

    case Nothing does Prim
    case Num does Prim {
        def n:double 0.0
    }
    case Text does Ref {
        def s:string ""
    }
}
```

A value case is immutable: assigning to one of its fields is a compile error.
Build a new value instead. A reference case keeps identity across copies and
across subgroup → parent widening.

When a case is in no annotated group, the compiler defaults to `@(value)` for
scalar-only payloads and `@(reference)` otherwise, and it may warn so the
program states the choice explicitly.

## Narrowing with `case` and `is`

The operator `case` tests the value and binds the narrowed value to a name. Use
it when the block reads the payload of one case.

```lisp
case v x:Value.Num {
    print (to_string x.n)
}
```

The operator `is` answers whether the value holds a case or a group. It gives a
boolean and binds nothing. The name `_` is the unused binding; the compiler
reads the case from the type after the colon.

```lisp
fn isNumber:boolean (v:Value) {
    return (is v _:Value.Num)
}

def b:boolean (is v _:Value.Printable)
```

`is` is an expression. It goes into a `return`, into an `if` condition, and into
a boolean operator. Prefer `match` when the program must cover the family;
prefer `case` when one arm reads a payload; prefer `is` when only the boolean
matters. The choice is what the program does with the answer, not what it costs:
a binding the block only reads is a reference on every target, and copies
nothing. A block that needs the payload as a value of its own must copy it.

## Representation per target

Semantics stay the same across targets. The physical form does not:

| Target | Typical representation |
| --- | --- |
| TypeScript | Typed union with a discriminant (`__rg_kind`) |
| ES6 / Python | Tagged object with a stable kind field |
| Rust / Swift | Native enum |
| Go | Tagged struct |
| Kotlin / C# / Dart | Interface (or sealed interface) implemented by each case |
| C++ | Variant; scalar value cases stored by value |
| Java / PHP / Scala | Portable class-per-case union where a native form is not selected |

The operator `is` writes the discriminant test that the target already uses for
`case`. It adds no new form.

| Target | The output of `is v _:Value.Num` |
| --- | --- |
| JavaScript | `(v != null && v.__rg_kind === "Value_Num")` |
| Python | `(v is not None and getattr(v, "_rg_kind", None) == "Value_Num")` |
| Go | `(v.tag == union_Value_tag_Value_Num)` |
| Rust | `matches!(v, union_Value::Value_Num(..))` |
| C++ | `mpark::holds_alternative<Value_Num>(v)` |
| Kotlin, Dart, C# | `(v is Value_Num)` |
| Java | `(v instanceof Value_Num)` |
| Scala | `(v.isInstanceOf[Value_Num])` |
| Swift | `({ () -> Bool in if case .Value_Num = v { return true }; return false })()` |
| PHP | `(is_object($v) && get_class($v) == "Value_Num")` |

Swift has no expression form of `if case`. The compiler writes a closure and
calls it. The value operand has one name in the output, so the program reads it
one time.

## Tests and target status

The fixtures under `tests/fixtures/shape_*.rgr` and `tests/shapes.test.ts` cover
construction, `match` exhaustiveness, group and case methods, required
operations, field projection, subgroup widening, and value/reference rules. The
test `tests/is-operator.test.ts` compares `case` against `is` on the toolchains
present in CI.

The page [Target languages](/Ranger/docs/targets/overview/) states the limits of
a shape on each target language.
