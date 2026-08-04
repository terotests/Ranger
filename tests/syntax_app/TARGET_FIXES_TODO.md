# Target fixes: what is done and where to continue

The syntax app in this directory measures every target on every test run
([`TARGET_REPORT.md`](TARGET_REPORT.md)). This file tracks the work of closing
the gaps it found. It is a working document: delete an entry when the matrix
shows it fixed, and re-record the baseline with
`npm run test:syntaxapp:update`.

## Where the matrix stands

Measured against `master` at the point this branch is based on.

| | master | now |
| --- | --- | --- |
| cells the Ranger compiler rejects | 82 / 238 | **40 / 238** |
| cells that compile, run and print the expected output | 42 / 238 | **60 / 238** |

Per target, `ok` cells and cells the compiler rejects, out of 17 units:

| target | ok | rejected |
| --- | --- | --- |
| es6 | 15 → 15 | 0 → 0 |
| typescript | 10 → 10 | 0 → 0 |
| go | 5 → 7 | 2 → 1 |
| python | 2 → 6 | 5 → 1 |
| rust | 0 → 0 | 7 → 3 |
| cpp | 4 → 8 | 2 → 1 |
| kotlin | 0 → 0 | 6 → 1 |
| swift6 | 0 → 0 | 3 → 2 |
| swift3 | 0 → 0 | 6 → 4 |
| java7 | 0 → 7 | 17 → 3 |
| csharp | 0 → 0 | 8 → 3 |
| scala | 0 → 0 | 10 → 6 |
| php | 6 → 7 | 5 → 4 |
| llvm | 0 → 0 | 11 → 11 |

Kotlin, Swift, C# and Scala have no toolchain on this machine, so their cells
stop at `compiled`. What moved for them is the number the Ranger compiler
rejects.

## Done

All of these are in `compiler/Lang.rgr` unless the entry says otherwise, so
they take effect without rebuilding the compiler.

**Templates that wrote source no target could parse.** `regex_test` and the
three `iso_*` operators fell back to a Ranger-spelled call —
`RegexMatch.testIgnoreCase(a b)`, with a space where the target needs a comma —
for every target with no entry of its own. `regex_test` now has Go, Python,
C++, PHP, Scala, C# and a fixed Java entry, and no `*` fallback: a target with
no regular expression engine fails the match at compile time instead of
emitting a file that does not parse. `pushString` fell back to the JavaScript
`.push()`; `rawbytechar` and `strfromcode` to `String.fromCharCode`; `join` to
`.join()`. All four now carry a real spelling per target.

**Operators that existed on one or two targets.** `sort` (es6, go), `reverse`
(es6), `remove` (es6, swift6, kotlin), `error_msg` (6 targets) and — the one
that mattered most — **`for` over a hash map, which was es6 only**, so no
program that walked a map compiled anywhere else. All five now cover the
target list.

**Missing entries.** `M_PI` / `fabs` / `tan` (Rust, Kotlin, C#, Scala),
`to_double(int)` (Python, C#), `cast` (Python, Rust, C#, Scala), `insert`
(Java, Swift 3, C#, Scala), `indexOf` / `indexOfFrom` / `lastIndexOf` on
strings (C#, Scala), `to_lowercase` / `to_uppercase` (Rust), `charcode` (six
targets), `switch` / `case` / `default` (Python 3.10 `match`, Rust `match`),
the four `if`-over-an-optional-int/double forms (all targets — they had only
C++), `throw` (Python raises, Rust panics).

**Answers that differed between targets.**

- `to_string(boolean)` printed `True` on Python.
- A double reaching a string printed `1.500000` on Go and C++ — both used a
  fixed six digits. Both now write the shortest form that reads back as the
  same value, which is what every other target does.
- `replace` changed the first occurrence on es6, Go, C++ and Python and every
  occurrence on the other seven. It now changes every occurrence everywhere —
  which is what the compiler's own trigraph escaping in
  `ng_RangerCppClassWriter.rgr` has always assumed.
- `+` between a string and an enum broke Python, `+` between a string and a
  double had no Go, C++ or Python entry on the `double`-first side.
- `to_int(double)` truncated toward zero on Go and refused an untyped constant;
  it now floors, as the other targets do.
- `indexOf` on a string gave the empty string rather than `-1` on PHP.
- `/` between two integers is real division, and Java, C#, Scala, Swift, Python
  and PHP were all left with their own `/`. Java refused the program outright.
- C++ `r_optional_primitive` left `has_value` uninitialised, so a failed
  `str2int` read back as a value.

**Wrong templates.** `if!` carried a Rust entry that was a *macro* — so it
wrote Ranger source — but spelled the else branch the Rust way and dropped the
parentheses the parser needs. Deleting it left the correct target-independent
`*` macro. `!!` on Java called `java.util.Optional.get()` while `unwrap` on the
same target wrote the value itself. `remove_index` on Java and Scala wrote no
statement terminator and dropped the cast that picks `remove(int)` over
`remove(Object)`.

**Reserved words.** `reserved_words` had no `java7`, `csharp` or `scala`
section, so `def double (fn:int …)` wrote `LambdaSignature1 double = …` on
Java — which is what `section:lambdas` failed on. All three now list their
keywords. **PHP deliberately has none**: its writer emits every function as a
class method, PHP 7 allows a reserved word as a method name, and a variable is
`$name` and never clashes — so a section would rename `list`, `empty`, `clone`,
`match` and `print` across some fifty files for no gain. Measured: the PHP
column of the matrix is identical with and without it.

**The language server build.** `ranger-vscode-extension/compiler/output.js` is
a second, separately built copy of the compiler that `introspection.test.ts`
loads, and neither `npm run compile` nor anything in CI rebuilds it. It had
fallen behind `compiler/Lang.rgr` far enough to stop parsing the operator
definitions, and four of its thirty-seven tests failed on `master` with
`Could not match argument types for *`. `npm run compile:langserver` rebuilds
it; all thirty-seven pass again. Worth running whenever `Lang.rgr` moves.

**The TypeScript engine on Go, Kotlin and Swift.**
`gallery/game_engine/v2/interp` — the JavaScript/TypeScript interpreter, the
largest program in the repository — now compiles to all three. Go and Kotlin
build with their own toolchain and answer all eight benchmark cases exactly as
Node does; Swift 6 is accepted by the compiler and written out in full, but no
Swift toolchain is reachable here, so it is unverified past a read of the
generated source. `tests/ts-engine-targets.test.ts` compiles the engine to each
target on every run and, where Go is installed, builds and runs the binary.
The whole list of what it took is in `TS_ENGINE_PERF.md`; the parts that belong
here are the **Kotlin buffer family** (item 1 of the list below, now done), the
Kotlin bitwise operators — Kotlin spells them `and` / `or` / `xor` / `shl` /
`shr` / `ushr` / `inv()`, not the C way — and `file_mtime` / `file_exists` on
the targets that had no entry.

**Test harness.** `tests/helpers/syntax-app.ts` looked for the single file that
`-o` names. The Java target writes one file per class and ignores `-o`, so the
whole java7 column read `compile-error` when Java in fact compiled. It now
accepts any file with the extension of the target, prefers the one holding
`main`, and hands every `.java` in the directory to `javac`. It also runs the
TypeScript of the repository rather than whichever `tsc` is first on PATH.

## Next, in the order I would take them

### 1. Buffers on Swift 3, Scala and PHP

`buffer` / `int_buffer` / `double_buffer` — 22 operators. **Kotlin is done**
(`ByteArray` / `LongArray` / `DoubleArray`); Swift 6 already had the family.
Swift 3 has only `buffer_alloc`, and Scala and PHP have nothing, so
`section:buffers` and the whole app still stop there on those three.
Mechanical: `[UInt8]` on Swift 3, `Array[Byte]` on Scala, a plain `array` of
ints on PHP.

### 2. The Go writer

One defect left in `compiler/ng_RangerGolangClassWriter.rgr`, so it needs
`npm run compile`. (Two others are now fixed: `for` over an array of objects
dropping the item binding, on `master`; and `(unwrap (get map key))` writing
the empty type assertion `.value.(())`, which is what stopped the TypeScript
engine on Go.)

- **`if!` with one block does not negate** — the program builds and prints the
  wrong answer. `gaps/go_if_not_single_branch.rgr`; `section:control` shows it
  as a `diff`. The `*` macro is right, so the defect is in how Go compiles
  `(false == (x > 100))`.
- **Nested collection types.** `[[int]]` writes `[]*[int]` and
  `[string:[int]]` writes `map[string]*[int]`, neither of which is Go.


### 3. The Python writer

- **An empty method body emits nothing under `def`.**
  `gaps/python_empty_method.rgr`. The app's base class works around it.
- **A lambda whose body is more than one expression** writes `x = lambda n:`
  followed by statements. Python has no multi-statement lambda, so the writer
  has to hoist the body into a named nested function. This is what stops
  `section:lambdas` and, through `stdlib`, most collection code.

### 4. The Rust writer

Rust rejects nothing much now but runs nothing either. Two structural items,
both already in `TARGET_NOTES.md`:

- **A subclass struct does not receive the fields of its parent** — every
  section fails with `no field 'rows' on type '…'`, because the app's sections
  extend `SyntaxSection`. Nothing else can be measured until this moves.
- **A lambda passed as an operator argument** writes the JavaScript
  `(left, right) => {` instead of a Rust closure.
- Smaller: `[[int]]` writes `Vec<[int]>`, and `regex_test` has no entry
  because the target builds with no crates — a small backtracking matcher as a
  polyfill would close it.

### 5. The C++ writer

- `r_optional_primitive` is not emitted when the only user is `get` on an
  array (`section:arrays`: `'r_optional_primitive' was not declared`).
- `(get map key)` on a missing key returns a value rather than an empty
  optional (`section:maps`: `get_miss` differs).
- `buffer_from_string` gives the length of the wrong thing
  (`section:buffers`: 38 rather than 6).
- Comparing an optional against `NULL` where the value is a `std::string`
  (`section:optionals`).

### 6. Smaller, per target

- **TypeScript**: `sayD` is called with a number where the emitted signature
  says string (`section:numeric`), and a record constructor is emitted with no
  parameters but called with one (`section:oop`).
- **PHP**: `>` inside a generated expression is unparenthesised
  (`section:bitwise`), and a static call writes `$Shape` for a class name
  (`section:oop`).
- **Scala**: `for` with `continue` is refused by the writer with its own
  message — a real limitation worth either fixing or documenting in
  `TARGET_NOTES.md`.
- **LLVM**: 11 units rejected. The LLVM templates are passthrough markers that
  the backend implements natively, so adding templates without backend support
  would move the failure rather than fix it. Left alone on purpose.
- **Java**: `[string:[int]]` writes `HashMap<String,[int]>`; `section:strings`
  and `section:buffers` still fail on generated syntax.

### 7. The gaps that are pure `Lang.rgr` and still open

Each has a probe in `gaps/` and an entry in `known_gaps.md`. None is fixed yet:
`last_index` (one pair of parentheses in its macro), `make` (the es6 template
drops the fill value), `nullify` (does not count as a mutation, so the writer
emits `const`), `empty` (keeps the generic type), the elvis operator not being
infix, `for` over an array of arrays, an array of function values, three-level
inheritance, `super` in a subclass constructor, string ordering operators,
`string + boolean`, `create_dir` inside `if!`, and the two `lib/stdlib.rgr`
methods `has` and `contains`.

## Verification

Run against these changes, rebased onto `master` (`84ed7fc`), with the compiler
rebuilt from them (`npm run compile`) and the language server build regenerated
(`npm run compile:langserver`):

| | result |
| --- | --- |
| 20 test files, batch 1 | 18 passed, 2 skipped — 196 tests |
| 32 test files, batch 2 | 31 passed, 1 skipped — 230 tests |
| 8 Go / Kotlin / Swift codegen files | 6 passed, 2 skipped — 64 tests |
| `runtime-conformance` | 1281 passed |
| `physics-cannon` | 90 passed |
| `game-runner` | 19 passed |
| `tsx-engine` | 6 passed |
| `introspection` | 37 passed |
| `ts-engine-targets` (new) | 4 passed |
| `syntax-app` | 6 passed; baseline and report re-recorded |

The syntax app matrix moved five cells, all of them forward, none back:
`app`, `section:buffers` and `http` on Kotlin from `compile-error` to
`compiled`, `section:maps` on C++ from `output-differs` to `ok`, and
`section:oop` on Go from `run-error` to `ok`.

**One file still fails, and fails identically on pristine `master`:**
`ts-to-ranger-native.test.ts`, one test, `function variable not found
voiceEvent` in a generated file.

**`npm test` in one go stops early, before and after.** A test file that runs
for two minutes or more starves the Vitest reporter under `singleFork`; the run
ends with `Timeout calling "onTaskUpdate"` and the files after it never run. It
lands on whichever long file comes first — `physics-cannon` (112 s),
`game-runner` (137 s), the syntax app (117 s). Each of them passes when run on
its own, which is how the table above was produced.
`syntax-app.test.ts` is out of the default config for that reason and has its
own, `tests/vitest.syntaxapp.config.ts`. The underlying fragility is older than
this branch and is worth a separate look.

**Two toolchains are not on the machine that produced this table.** Swift has
none — `download.swift.org` is not reachable through the proxy — so every
Swift cell stops at `compiled` and the Swift build of the TypeScript engine is
unverified beyond reading it. A Kotlin compiler was fetched to check the engine
end to end, but deliberately left off `PATH`: the syntax app harness probes for
toolchains, and a Kotlin column that only exists on one machine would make the
recorded baseline machine-dependent.
