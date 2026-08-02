---
title: Ownership and lifetime
description: Who keeps an object alive in a Ranger program, what the compiler infers by itself, and the annotations that state what it cannot infer.
---

Nine of the twelve target languages collect the memory that a program stops
using. Three do not: C++ and Swift count references, and Rust owns and moves.
One Ranger program compiles to all twelve, so the language needs one model.

This page states the model. The
[memory page](/Ranger/docs/targets/memory/) states what each target writes for
it.

## The rule of the program

**An object is a reference.** An assignment gives a second name to the same
object. It does not copy the object.

```lisp
class Counter {
    def value:int 0
    fn add:void (amount:int) {
        value = value + amount
    }
}

def a:Counter (new Counter())
def b:Counter a
b.add(1)
print ("a " + (to_string a.value))    ; a 1 — a and b are one object
```

This holds for a `class` and for a `record`. A number, a boolean and a string
are values, and an assignment copies them.

The program does not free an object. No operator releases memory, and no
destructor runs at a place that the program selects. The compiler decides where
the object ends.

:::caution[The Rust output is different]
The program above prints `a 1` on JavaScript, Go, Python, C++, Swift and the
other targets that hold an object as a reference. It does not compile for Rust:
the Rust writer gives a class a plain `struct`, so `let mut b : Counter = a;`
moves the value and `rustc` rejects the read of `a` after it. Write a program
that shares an object between two names for the eleven other targets, and test
the Rust output before you depend on it.
:::

## What the compiler infers

The compiler has a pass that reads the flow of each function and decides what
happens to each parameter. It gives each parameter one of five states:

| State | The pass saw | Example in a method |
| --- | --- | --- |
| `borrowed` | The function reads the argument, and the argument does not leave the function. | `return n.name` |
| `moved` | The argument goes into the object graph of one other object. | `push items p` |
| `shared` | The argument goes into more than one object graph. | `this.last = p` and `push items p` |
| `owned` | The function holds the value. | |
| `unknown` | The pass cannot decide, because the argument goes into a call whose own summary the pass does not hold. | `grid.setVal(idx 0 v)` |

The pass covers the methods, the static methods and the constructor of each
class. It needs no annotation, and it decides most parameters: a compilation of
`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` reads 110 functions and gives
`borrowed` to 255 parameters of 256.

### Read the result

The flag `-strict-ownership` prints the summary. It applies to each target:

```sh
rgrc program.rgr -l=cpp -strict-ownership
```

```text
ownership[infer] fn keepTwice:
  param 'p' -> shared (this.last, items)
ownership[infer] fn distance:
  param 'a' -> borrowed
  param 'b' -> borrowed
ownership[infer] fn paint:
  param 'g' -> borrowed
  param 'idx' -> unknown
    WARNING: ownership of 'idx' could not be determined (escapes via call; needs interprocedural summary)
```

Read the summary when you want to know what the compiler believes. A function
that you believe to be read-only must show `borrowed` for each parameter.

The pass counts a field store that names the receiver: `this.last = p`. It does
not count the short form `last = p`, so a parameter that the short form stores
can read `borrowed`. This makes the summary careful in the wrong direction, and
it changes no output: the assignment of the field copies the reference and the
object stays alive.

### `@(pure)`

The annotation `@(pure)` on a function states that the function transfers no
argument. Each parameter of a pure function is `borrowed`, and the pass does not
read the body to find it.

```lisp
fn distance@(pure):double (a:Point b:Point) {
    return (sqrt (((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y))))
}
```

### Where the result goes

The C++ writer reads the summary. A `borrowed` object parameter becomes
`const std::shared_ptr<T>&` in the place of a copy of the pointer, so the call
changes no reference count:

```cpp
double  Reg::distance( const std::shared_ptr<Point>& a , const std::shared_ptr<Point>& b ) {
void    Reg::keepTwice( std::shared_ptr<Point> p ) {
```

A parameter in one of the four other states keeps the copy, because the function
can hold the object after the call. The eleven other writers do not read the
summary, so for them the pass is a reading tool.

## What the compiler cannot infer

One fact is a decision and not a property of the code: **which direction of a
cycle is the back reference.**

Two objects that hold each other keep each other alive. The reference count of
each one never falls to zero, so C++ and Swift never free the pair. A parent
that holds its children and a child that holds its parent is a cycle. So is a
node and its list, and an observer and its subject.

```lisp
class Parent {
    def name:string ""
    def kids:[Child]

    fn adopt:void (c:Child) {
        c.parent = this
        push kids c
    }
}

class Child {
    def name:string ""
    def parent@(weak optional):Parent
}
```

The annotation `@(weak)` states that the field does not keep the object alive.
The compiler cannot find this by itself: both directions are ordinary
assignments, and only the program knows which object owns which.

A weak reference can be empty, because the object can go away while the
reference exists. Declare a `weak` field `@(weak optional)` and read it with the
[optional operators](/Ranger/docs/language/optionals/).

## The four memory annotations

| Annotation | Function |
| --- | --- |
| `weak` | The field does not keep the object alive. |
| `strong` | The field keeps the object alive. This is the default, so the annotation states it and changes nothing. |
| `lives` | The value lives longer than its block. The compiler uses it in its reference bookkeeping. |
| `temp` | The value is temporary. The compiler uses it in its reference bookkeeping. |

`weak` is the one that changes the output, and it does not work on each target
yet. [The memory page](/Ranger/docs/targets/memory/) holds the emission and the
state of each target.

`strong`, `lives` and `temp` change no output on any target. The compiler reads
`lives` and `temp` in `compiler/ng_RangerAppParamDesc.rgr`, where it follows the
strength and the lifetime of each reference through the assignments.

## What to write in a program

1. Write the program without a memory annotation. The compiler decides the rest.
2. Find each cycle. Two objects that point at each other are a cycle, and a
   longer ring is a cycle.
3. Give one direction of each cycle `@(weak optional)`. Select the direction
   that does not own: the child points at the parent, the observer points at the
   subject.
4. Compile for C++ with `-strict-ownership` and read the summary. A parameter
   that you believe to be read-only and that the pass calls `unknown` costs a
   copy of a pointer at each call.

The nine targets that collect memory need none of this. The program is the same
for them, and the annotations change nothing in their output.
