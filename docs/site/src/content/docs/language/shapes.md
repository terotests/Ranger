---
title: Shapes
description: A shape is a closed set of cases with a payload. The page states the declaration, the narrowing operators and the output of each target language.
---

A shape is a closed set of cases. Each case has a name and its own fields. A
value of the shape type holds one case at a time. The compiler knows every
case, so it can report a case that a `match` statement does not cover.

```lisp
shape Value {
    case Nothing
    case Num {
        def n:double 0.0
    }
    case Text {
        def s:string ""
    }
}
```

The declaration writes one class for each case and one union over the classes.
No target language knows the word `shape`. A target carries a shape as well as
it carries a union.

## The construction of a value

The constructor of a case takes the fields of the case in order.

```lisp
def a:Value (new Value.Nothing())
def b:Value (new Value.Num(42.0))
def c:Value (new Value.Text("hello"))
```

## The narrowing of a value

The operator `case` tests the value and binds the narrowed value to a name. The
block reads the fields of the case.

```lisp
case v x:Value.Num {
    print (to_string x.n)
}
```

## The kind test

The operator `is` answers the question "does the value hold this case?". It
gives a boolean, and it binds nothing.

```lisp
fn isNumber:boolean (v:Value) {
    return (is v _:Value.Num)
}
```

The name `_` is the binding that the operator does not take. The compiler reads
the case from the type after the colon, so the case needs a name in front of
it. The operator defines no variable, and the same form can appear two times in
one block.

`is` is an expression. It goes into a `return`, into an `if` condition, and
into a boolean operator.

```lisp
if (is v _:Value.Nothing) {
    return "nothing"
}
return ((is v _:Value.Num) || (is v _:Value.Text))
```

Use `case` when the block reads the payload of the case. Use `is` when the
program needs the answer only. The binding of `case` has a cost: on the Rust
target it writes a clone of the value.

## Groups

A group is a name for a set of cases. A case joins a group with `does`. A group
declares fields that each case of the group receives.

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

The operator `is` accepts a group. The compiler writes one test for each case
of the group and joins the tests with `||`.

```lisp
def b:boolean (is v _:Value.Prim)
```

## The output of each target language

The operator `is` writes the test that the target language already uses for
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

## The state of each target language

The test `tests/is-operator.test.ts` runs one program on JavaScript, Python,
Go, Rust and Kotlin. It compares the answer of `case` against the answer of
`is` for each case and for each group. The same program also runs on C++, Java
and PHP.

The Swift toolchain is not available in the test container. The test reads the
output of the Swift writer instead of a run of the program.

The page [Target languages](/Ranger/docs/targets/overview/) states the limits
of a shape on each target language.
