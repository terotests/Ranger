---
title: Target languages
description: The target languages of the compiler, the file that each one writes, and the state of each target.
---

The compiler writes source code. It does not write an executable file and it
does not run the program. A target toolchain compiles or runs the output.

## Targets of the command line

The option `-l=<target>` selects the target language.

| Target | Option | Output | Note |
| --- | --- | --- | --- |
| JavaScript | `-l=es6` | `.js` | The playground and the compiler itself use this target. |
| TypeScript | `-l=es6 -typescript` | `.ts` | The JavaScript writer with type annotations. A TypeScript program uses the JavaScript template of an operator, so its operator support is the support of JavaScript. |
| Go | `-l=go` | `.go` | An optional value compiles to a structure with a `has_value` field. |
| Rust | `-l=rust` | `.rs` | A class becomes a plain `struct`, so two names do not share one object, and the writer adds `.clone()` where the value would move. Inheritance is not in the layout. Test the output. |
| Python | `-l=python` | `.py` | |
| Java | `-l=java7` | `.java` | One file per class. |
| Kotlin | `-l=kotlin` | `.kt` | |
| Dart | `-l=dart` | `.dart` | Flutter-ready packages via `-pubspec` (optional `-flutter`). Shared logic for Flutter apps, not full widget trees. |
| Swift | `-l=swift6` | `.swift` | `-l=swift3` writes the older dialect. |
| C# | `-l=csharp` | `.cs` | Verified on the TypeScript engine with Mono `mcs` (8/8 vs Node). |
| C++ | `-l=cpp` | `.cpp` | Some operators add a polyfill function. |
| PHP | `-l=php` | `.php` | The main routine is at the top level of the file. |
| Scala | `-l=scala` | `.scala` | The main routine compiles to `object AppMain extends App`. |

## Maturity

The targets are not equal. The table below states what the test suite and the
large gallery programs currently prove. The
[coverage page](/Ranger/docs/reference/coverage/) counts operator templates; a
high count does not mean a large program has run on that target.

| Target | Ranger accepts | Builds with a toolchain | Matches a Node reference |
| --- | --- | --- | --- |
| JavaScript | yes | yes (`node`) | baseline |
| Go | yes | yes | TS engine 8/8; syntax app |
| Kotlin | yes | yes (`kotlinc`) | TS engine 8/8 |
| Python | yes | yes (`python3`) | TS engine 8/8 |
| C# | yes | yes (Mono `mcs` in CI; .NET also) | TS engine 8/8 |
| Rust | yes | yes (`rustc`) | jpeg scaler; TS engine path |
| C++ | yes | yes (`g++`) | jpeg scaler; TS engine path |
| Dart | yes | yes (`dart`, when on `PATH`) | TS engine (same Node answers); `gallery/ts_parser` AST = JS |
| Swift 6 | yes | when `swiftc` is present | TS engine compiles (~31k lines); run not always in CI |
| Java, PHP, Scala | yes, with more gaps | varies | syntax-app matrix; no large-engine golden |

`npm run test:tsengine` compiles the TypeScript engine in
`gallery/game_engine/v2/interp` to Go, Kotlin, Python, C#, Swift 6 and Dart, and
builds and runs the Go, Python, C# and Dart results when those tools are
installed. `npm run test:dart` and `npm run test:dart:tsparser` still exercise
the smaller Dart golden.

Each [operator page](/Ranger/docs/reference/operators/statements/) lists every
command-line target in the support row, including Dart. A mark ✔ is an own
template; ✱ is the default `*` template; ✕ means the operator has no template
for that target.

## The state of a shape on each target language

A [shape](/Ranger/docs/language/shapes/) is a closed set of cases. The
declaration writes one class for each case and one union over the classes. The
table states the result of one program that tests each case and each group. The
program compares the answer of the operator `case` against the answer of the
operator `is`.

| Target | The program runs | The known limit |
| --- | --- | --- |
| JavaScript | yes | none |
| Python | yes | none |
| Go | yes | none |
| Kotlin | yes | none |
| Java | yes | none |
| C++ | yes | The variant holds a scalar case behind a pointer. The test asks for the case by value. |
| Rust | yes | A case value is not wrapped into the union. See the note below. |
| PHP | yes | none for a shape |
| Swift | not tested | The toolchain is not available in the test container. The test reads the output of the writer. |
| Dart, C#, Scala | not tested | No toolchain in the test container. |
| llvm | no | The writer has no template for `case`, so it compiles no shape. |

**The limit of the Rust target.** A value of a case type does not become a
value of the union type at an argument. The program below does not compile,
because `add` takes the union and `n` has the type of the case:

```lisp
def n:Value (new Value.Num(2.0))
p.add(n)          ; expected &union_Value, found &Value_Num
```

Give the value a name of the union type first. The writer then wraps the value:

```lisp
def n:Value (new Value.Num(2.0))
def v:Value n
p.add(v)
```

This limit is the reason for 8 of the 11 shape tests that fail today.

**A group.** The operator `is` accepts a group on each target language. The
compiler writes one test for each case of the group. The operator `case` does
not accept a group, because it must bind a narrowed value, and no target has a
type for the group on every writer. Use `is` for the test of a group.

## Other targets in the language file

The file `compiler/Lang.rgr` declares more targets than the command line lists:
`es5`, `ts`, `flow`, `nim` and `llvm`. Their template coverage is small. The
[coverage page](/Ranger/docs/reference/coverage/) counts the templates per
target, and the count states the true condition of each one.

## The main function

The compiler writes the main routine in the form of the target:

| Target | Form |
| --- | --- |
| JavaScript | `function __js_main()` and a call at the end of the file |
| Go, Rust, C++ | `func main`, `fn main`, `int main` |
| Java, C# | A static `main` method of the class |
| Python | `def main()` with a `__main__` guard |
| Dart | Top-level `void main(List<String> args)` |
| PHP | Statements at the top level |
| Scala | `object AppMain extends App` |

The reference shows the body of that function for each operator, and the
complete file is behind the link under the code.

## Memory

C++, Rust and Swift do not collect memory.
[Ownership and lifetime](/Ranger/docs/language/ownership/) states the model of
the language, and the
[memory page](/Ranger/docs/targets/memory/) states what the compiler writes for
each target.

## Differences that a program must know

- **Integer division.** `/` on two integers gives a double. Use `to_int` when
  the program needs a whole number.
- **`to_int` of a negative double.** The reference semantics is floor:
  `(to_int -1.5)` is `-2`. JavaScript, C++, Python, PHP, Rust and Go follow
  it; C#, Swift, Kotlin and Scala still truncate toward zero (`-1`), so the
  two families differ on every negative value until those targets are
  aligned.
- **The remainder of a negative number.** The sign of the result of `%` follows
  the target language.
- **String indexes.** The index of a character is a code point index. The
  compiler writes the correct operation for each target.
- **Object identity.** An object is a reference on every target, Rust
  included: two names give one object. On Rust a class the compiler proves
  shared becomes `Rc<RefCell<T>>`, and every other class stays a plain
  `struct`; the flag `-rust-value-classes` restores the old all-value model,
  under which a second name moves the value. See
  [Memory management](/Ranger/docs/targets/memory/).
- **Reference counting.** The C++ output counts references with
  `std::shared_ptr`, and the Swift output counts them with ARC. Two objects
  that hold each other therefore stay in memory. The annotation `weak` breaks
  the cycle. See
  [Ownership and lifetime](/Ranger/docs/language/ownership/).
- **The catch block in Rust.** Rust has no exceptions. The compiler writes the
  try block of `try { } { }` and it does not write the catch block. A program
  for the Rust target must report a fault with a return value.
- **JSON in Rust.** The Rust output uses no crate, so the compiler adds the
  enum `RJson` and the functions that read and write the text. A JSON object is
  a `HashMap<String, RJson>` and a JSON array is a `Vec<RJson>`.
- **JSON in Python.** A JSON object is a `dict`, a JSON array is a `list`, and
  the module `json` of the standard library reads and writes the text.
