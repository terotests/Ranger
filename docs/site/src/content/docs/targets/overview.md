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
| Swift | `-l=swift6` | `.swift` | `-l=swift3` writes the older dialect. |
| C# | `-l=csharp` | `.cs` | |
| C++ | `-l=cpp` | `.cpp` | Some operators add a polyfill function. |
| PHP | `-l=php` | `.php` | The main routine is at the top level of the file. |
| Scala | `-l=scala` | `.scala` | The main routine compiles to `object AppMain extends App`. |

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
- **The remainder of a negative number.** The sign of the result of `%` follows
  the target language.
- **String indexes.** The index of a character is a code point index. The
  compiler writes the correct operation for each target.
- **Object identity.** An object is a reference on eleven targets: two names
  give one object. The Rust output gives a class a plain `struct`, so a second
  name moves the value and `rustc` rejects the read of the first name.
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
