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

## The examination of a value

`match` reads one value against every case of the shape. It is the usual way to
work with a shape.

```lisp
match v {
    Num n {
        return ("num" + (to_string n.n))
    }
    Text t {
        return ("text" + t.s)
    }
    Nothing {
        return "nothing"
    }
}
```

An arm names a case and, when the block reads the payload, a name for the
narrowed value. An arm covers several cases with `|`:

```lisp
match v {
    Num | Text {
        return "has a payload"
    }
    Nothing {
        return "empty"
    }
}
```

The compiler knows every case of the shape, so it reports an arm that is
missing, an arm that appears two times, and a name that is not a case of this
shape. An arm may also name a [group](#groups), which covers every case of that
group.

### One case at a time

`case` narrows one case without listing the others. Use it when the program
needs one case and does not answer for the rest.

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

Use `match` to answer for every case, `case` for one case, and `is` when the
program needs the answer only. The three are the same discriminant test; the
choice is what the program does with the answer, not what it costs. A binding
that the block only reads is a reference on every target — it copies nothing.

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

### A group is a type

A group is a type of its own, so a function takes the subset instead of the
whole shape. The caller may pass only a case of that group, and the body may
narrow further.

```lisp
fn describeRef:string (r:Value.Ref) {
    match r {
        Text t {
            return t.s
        }
    }
}
```

The compiler knows the group holds exactly the cases that name it, so a `match`
over a group value is exhaustive when it covers those cases — not every case of
the shape.

### A group declares methods

A group declares a method with no body. Every case of the group must then
define it. This states a requirement that the compiler checks, and it gives the
group a method the program can call on any of its cases.

```lisp
shape EvalValue {
    group Callable does Reference {
        fn invokeLabel:string ()
    }

    case Function does Callable {
        def core:EvFunctionCore
        fn invokeLabel:string () {
            def c:EvFunctionCore core
            return c.functionName
        }
    }
}
```

A case that does not define `invokeLabel` is a compile error. A group may also
give a method a body, which each case receives and may replace with
`@(override)`.

Groups nest: `group Callable does Reference` puts every callable case in
`Reference` as well, and a value of the narrower group widens to the wider one.

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
