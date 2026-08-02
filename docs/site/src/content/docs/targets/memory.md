---
title: Memory and ownership
description: How the compiler analyses object lifetime, what the analysis changes in the output today, and what the memory annotations do for each target.
---

Nine of the twelve target languages collect the memory that a program stops
using. Three do not: C++ and Swift count references, and Rust owns and borrows.
For those three the compiler must decide where each object lives and who keeps
it alive.

This page states what the compiler analyses, and what that analysis changes in
the output today. Each statement here comes from the compiler sources and from
the code that the compiler writes.

## Two analyses

The compiler has two passes that read the flow of the program.

### 1. The mutation pass, for C++

The pass finds a local variable that takes its value from a member field and
that a later statement changes in place. It then writes a reference in the
place of a copy:

```ranger
fn writeByte:void (b:int) {
    def buf:buffer currentChunk.data
    buffer_set buf 0 b
}
```

```cpp
std::vector<uint8_t>& buf = currentChunk->data;   // a reference
buf[0] = static_cast<uint8_t>(b);                 // changes the field
```

Without the pass the local is a copy, and the change is lost. The pass runs for
every C++ compilation, and the program needs no annotation. The operators that
count as a change in place are the buffer operators, `push`, `set`, `clear`,
`remove`, `removeIndex` and `put`.

### 2. The ownership inference

The second pass reads where a parameter goes, and gives each parameter one of
five states:

| State | Meaning |
| --- | --- |
| `borrowed` | The function reads the argument. The argument does not escape. |
| `moved` | The argument goes into the object graph of another object: `x.field = p`, or `push self.items p`. |
| `owned` | The function holds the value. |
| `shared` | More than one owner. |
| `unknown` | The pass cannot decide. |

The flag `-strict-ownership` runs the pass and prints the result:

```sh
rgrc program.rgr -l=cpp -strict-ownership
```

```text
ownership[infer] fn attach:
  param 'parent' -> borrowed
  param 'child' -> moved (parent.left)
ownership[infer] fn sumValue:
  param 'a' -> borrowed
  param 'b' -> borrowed
```

**The pass reports and does not change the output.** The comment in
`compiler/ng_StaticAnalysis.rgr` states it: "Phase A only records + reports; it
does not change code generation." The result is a diagnostic today, and the
writers do not read it.

The numbers are large. The compilation of
`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` analyses 110 functions and gives
`borrowed` to 255 parameters of 256. In the C++ output of the same file, 64
object parameters are `std::shared_ptr<T>` by value and none is a reference.

## What the annotations change

Ranger has four annotations for memory: `weak`, `strong`, `lives` and `temp`.
The table states what each target does with them today, measured by a
compilation of the same program with and without each annotation.

| Annotation | Rust | C++ | Swift | The nine other targets |
| --- | --- | --- | --- | --- |
| `weak` | The field becomes `Option<Weak<RefCell<T>>>`, and the assignment becomes `Rc::downgrade(…)` | No change. The field stays `std::shared_ptr<T>` | No change. The field stays `var x : T?` | No change, and none is necessary |
| `strong` | — | No change | No change | No change |
| `lives` | No change | No change | No change | No change |
| `temp` | No change | No change | No change | No change |

`lives` and `temp` are read by the lifetime bookkeeping of the compiler
(`compiler/ng_RangerAppParamDesc.rgr`), not by a writer of a target language.

The [questions page](/Ranger/docs/faq/) holds the same information with a
compiled example, and it states what to write in a program while C++ and Swift
do not read `weak`: break the reference cycle in the program.

## What this means for a program

- **On C++ and on Swift, two objects that hold each other stay in memory.**
  The `weak` annotation does not prevent it today. Give one direction of the
  pair a name or an index in the place of a reference, or clear the back
  reference before the pair goes out of use.
- **On Rust, `weak` works.** Use it for a back reference.
- **The mutation pass needs no help.** A local that takes a member field and
  changes it in place becomes a reference by itself.
- **`-strict-ownership` is a reading tool.** It states where the compiler
  believes each argument goes. Use it to check that a function you believe to
  be pure holds only `borrowed` parameters.
