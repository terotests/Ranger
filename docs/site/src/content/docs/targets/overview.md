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
| Rust | `-l=rust` | `.rs` | A class the compiler finds shared becomes `Rc<RefCell<T>>`. Every other class stays a plain `struct`. |
| Python | `-l=python` | `.py` | Signatures carry type annotations. |
| Java | `-l=java7` | `.java` | One file per class. |
| Kotlin | `-l=kotlin` | `.kt` | |
| Dart | `-l=dart` | `.dart` | Flutter-ready packages via `-pubspec` (optional `-flutter`). Shared logic for Flutter apps, not full widget trees. |
| Swift | `-l=swift6` | `.swift` | `-l=swift3` writes the older dialect. |
| C# | `-l=csharp` | `.cs` | |
| C++ | `-l=cpp` | `.cpp` | Some operators add a polyfill function. |
| PHP | `-l=php` | `.php` | The main routine is at the top level of the file. |
| Scala | `-l=scala` | `.scala` | The main routine compiles to `object AppMain extends App`. |

## What the tests prove

The targets are not equal. The
[coverage page](/Ranger/docs/reference/coverage/) counts operator templates; a
high count does not mean a large program has run on that target.

The directory
[`gallery/friendly`](https://github.com/terotests/Ranger/blob/master/gallery/friendly/README.md)
is the current measurement. It compiles twelve small programs to each target
language. A run diffs the printed output of each program across the targets
that execute.

Eight targets run those twelve programs and give the same answers:
JavaScript, Python, Go, C++, Rust, Kotlin, Java and C#. PHP has no study
folder yet. It ran the same programs and agreed with JavaScript. Dart, Swift
and Scala: the compiler writes the files. A job does not always have `dart`,
`swiftc` or `scalac`.

The same directory holds a timed run of five kernels, and a reading of how
close each generated file is to the idiom of the target. Those numbers change
with the compiler. Read them in the repository.

`npm run test:tsengine` still compiles the TypeScript engine in
`gallery/game_engine/v2/interp` to several targets when those toolchains are
installed.

Each [operator page](/Ranger/docs/reference/operators/statements/) lists every
command-line target in the support row. A mark ✔ is an own template; ✱ is the
default `*` template; ✕ means the operator has no template for that target.

## Shapes

A [shape](/Ranger/docs/language/shapes/) is a closed family of cases. The
compiler writes a native form where the target has one: a typed union, a
native enum, a tagged struct, an interface, or a variant with scalar cases
stored by value.

The operator `is` accepts a group on each target language. The compiler
writes one test for each case of the group. The operator `case` does not
accept a group, because it must bind a narrowed value, and no target has a
type for the group on every writer. Use `is` for the test of a group.

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

The tests `tests/shapes.test.ts` and `tests/is-operator.test.ts` compile and
run the fixtures on the toolchains that the job has. The llvm writer has no
template for `case`, so it compiles no shape.

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

- **Integer width.** Ranger has one integer type. JavaScript, Python, PHP, Go
  and Rust give a 64 bit integer. C++, C#, Java and Kotlin give a 32 bit
  integer. `(100000 * 100000)` is `10000000000` on the first group and
  `1410065408` on the second. On C++ the overflow is undefined behaviour.
  Use `int64` when the program must cross 2³¹ on every target.
- **Integer division.** `/` on two integers gives a double. Use `idiv` when
  the program needs a whole number. `idiv` truncates toward zero.
  `to_int` converts a double to an integer.
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
