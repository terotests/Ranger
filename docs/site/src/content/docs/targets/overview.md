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
| Rust | `-l=rust` | `.rs` | Reference counting with `Rc` and `RefCell`. |
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

## Differences that a program must know

- **Integer division.** `/` on two integers gives a double. Use `to_int` when
  the program needs a whole number.
- **The remainder of a negative number.** The sign of the result of `%` follows
  the target language.
- **String indexes.** The index of a character is a code point index. The
  compiler writes the correct operation for each target.
- **Reference counting.** The Rust and the C++ output use reference counting.
  The annotations `weak`, `strong`, `lives` and `temp` control it.
