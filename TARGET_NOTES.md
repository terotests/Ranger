# Target notes

Capabilities and caveats that are specific to one target language. The
[README](README.md) has the compatibility snapshot; this file has the detail.
Version-by-version changes belong in [CHANGELOG.md](CHANGELOG.md), and known
bugs in [ISSUES.md](ISSUES.md).

## Cross-target gate: TypeScript engine

The interpreter in `gallery/game_engine/v2/interp` is the largest program used
as a multi-target gate. Besides C++ and Rust, it compiles to **Go, Kotlin,
Python, C#, Swift 6 and Dart**. Each of those six builds and answers all of the
Node benchmark cases when its toolchain is on `PATH` (`kotlinc`+`java`,
`swiftc`, `dart`, `go`, `python3`, `mcs`+`mono`). C# in CI uses Mono 6.8
(`mcs`); a modern .NET SDK is fine when available. See `TS_ENGINE_PERF.md` and
`npm run test:tsengine`.

One defect showed up on three targets at once: an unused `def` whose
initializer is a call was commented out, so `def ignored:T (this.work())`
dropped the call. That form is how the engine writes a for-loop update. Go and
Python failed to compile; C# compiled and ran with infinite loops until the
interpreter guard stopped them. The writers now keep the statement live.

## Cross-target gate: the compiler itself, on C++, Dart, Python, C#, Go and Kotlin

The compiler is self-hosting, but until now only its **JavaScript** output was
exercised. Compiling the compiler for another target is a different question,
and it is the sharpest test the language has: the compiler is the largest
Ranger program in the repository, and it reaches parts of the language no
fixture does.

It now works end to end:

```bash
npm run selfhost:check:cpp     # generate the C++ and run g++ -fsyntax-only
npm run selfhost:build:cpp     # ...and link ./tmp/selfhost/rangerc

# the C++ binary compiles a Ranger program
RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  ./tmp/selfhost/rangerc -es6 hello.rgr -d=./tmp/out -o=hello.js -nodecli

# ...including the compiler
RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  ./tmp/selfhost/rangerc -es6 ./compiler/ng_Compiler.rgr -nodecli \
    -d=./tmp/self -o=output.js
```

`selfhost:build:cpp` copies `Lang.rgr`, `stdops.rgr` and `lib/` next to the
binary, the same way `compile:copylibs` does for `bin/`: the compiler looks for
its library beside the executable, and `install_directory` on C++ is the
directory of `argv[0]`.

The JavaScript the C++ build writes for the compiler is byte-identical to what
the Node build writes, save for one line — see *32-bit `int`* below — and the
compiler that comes out of it compiles the compiler again to a file that
matches the Node build exactly.

**Dart** goes the same way, and there is no build step — `dart run` takes the
file:

```bash
npm run selfhost:check:dart    # generate the Dart and run `dart analyze`
npm run selfhost:build:dart    # ...and put the library beside it

RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  dart run ./tmp/selfhost-dart/ranger_compiler.dart \
    -es6 ./compiler/ng_Compiler.rgr -nodecli -d=./tmp/self -o=output.js
```

The JavaScript the Dart build writes for the compiler is **byte-identical** to
the Node build's, and the compiler that comes out of it reproduces that file
exactly. `dart analyze` reports no errors (it does report ~2400 warnings, nearly
all `unnecessary_non_null_assertion` — the writer adds `!` wherever the Ranger
type is optional, and Dart's flow analysis can often prove the value is already
non-null).

**Python** is the third, and needs no toolchain beyond the interpreter:

```bash
npm run selfhost:build:python   # generate the Python, py_compile it, copy the library

RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  python3 ./tmp/selfhost-python/ranger_compiler.py \
    -es6 ./compiler/ng_Compiler.rgr -nodecli -d=./tmp/self -o=output.js
```

Its output is **byte-identical** to the Node build's as well, and reproduces
itself the same way.

**C#** is the fourth. Mono's `mcs` is enough — nothing generated needs a
language version past C# 7, and the JSON runtime is hand written rather than
`System.Text.Json`, so the same file builds on .NET too:

```bash
npm run selfhost:build:csharp   # generate the C#, build it with mcs, copy the library

cd tmp/selfhost-csharp && RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  mono ranger_compiler.exe -es6 ../../compiler/ng_Compiler.rgr -nodecli \
    -d=../../tmp/self -o=output.js
```

Its output is **byte-identical** to the Node build's, the compiler that comes
out of it reproduces that file exactly, and asking the C# build for C# gives
back the same 1.98 MB source it was built from.

**Go** is the fifth, and the only one that already reported zero compiler
errors before any of this — and still would not build:

```bash
npm run selfhost:build:go      # generate the Go, go build it, copy the library

RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  ./tmp/selfhost-go/rangerc -es6 ./compiler/ng_Compiler.rgr -nodecli \
    -d=./tmp/self -o=output.js
```

Its output is **byte-identical** to the Node build's, the compiler that comes
out of it reproduces that file exactly, and asking the Go build for Go gives
back the same 70k-line source it was built from.

**Kotlin** is the sixth:

```bash
npm run selfhost:build:kotlin   # generate the Kotlin, kotlinc it, copy the library

cd tmp/selfhost-kotlin && RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  java -Xmx8g -jar rangerc.jar -es6 ../../compiler/ng_Compiler.rgr -nodecli \
    -d=../../tmp/self -o=output.js
```

Its output is **byte-identical** to the Node build's, the compiler that comes
out of it reproduces that file exactly, and asking the Kotlin build for Kotlin
gives back the same 57k-line source it was built from. `kotlinc` needs
`-J-Xmx12g` for a file this size: the default heap runs out and it dies with an
internal `OutOfMemoryError` rather than a diagnostic.

`npm test` runs the codegen for all six and checks the result — `g++
-fsyntax-only` for C++, `dart analyze` for Dart, `py_compile` for Python, `mcs`
for C#, `go build` for Go, `kotlinc` for Kotlin
(`tests/compiler-selfhost.test.ts`). The binary build and the bootstrap rounds
are a manual step.

### What C++ took

Seven kinds of defect, and only one of them was in the C++ writer's own
templates. The rest are the shape of the problem for **any** target that is not
JavaScript — the Dart round hit the same JSON gap and the same two source-level
ones, before adding five of its own:

1. **A systemclass reached the output under its Ranger name.** The C++ writer
   fell through to `std::shared_ptr<JSONDataObject>`, which names no C++ type.
   It now reads `systemNames["cpp"]`, the way the Rust writer already did.
2. **JSON had no C++ template at all** (441 of the 441 errors on the first
   run). Every `@serialize` class generates a `toDictionary` that calls
   `json_object` / `set` / `keys`, so the compiler could not be compiled for
   C++ at all. See *JSON on C++* below.
3. **An operator declared for one target only.** `pathname` in
   `VirtualCompiler.rgr` had an `es6` template and nothing else, so the
   compiler's own path handling compiled for no other target.
4. **A signed `char`.** A UTF-8 byte over 127 is negative in a C++ `char`, and
   the parser skips a comment with `while (charAt s i) > 31`. The compiler
   stopped at the first em dash in a comment in `Lang.rgr` and read the rest of
   the line as code. `charAt` and `charcode` now give an unsigned code unit on
   C++, which is what `charCodeAt` / `ord` / `rune` give everywhere else.
5. **`weak` is a no-op on JavaScript.** Four fields in the compiler were marked
   `@(weak)` and were the only reference to their object. On JavaScript the
   garbage collector kept them alive and nobody noticed; on C++ they were
   already destroyed at the read. See *`weak` in a self-hosted compiler* below.
6. **An out-of-range read.** `at(list, 0)` on an empty list, `charcode("")`,
   `charAt(s, i + 5)` past the end: JavaScript answers `undefined` / `NaN` and
   the program carries on. C++ throws, Python and Rust raise. Four of these
   were live in the compiler; each is fixed at the source, not papered over in
   the template.
7. **A C++ reference bound to a temporary.** A local aliasing a member gets `&`
   in C++, and the analysis read `(unwrap this.block)` and `(array_extract
   node.children 0)` as member accesses — both are temporaries. A non-const
   reference parameter had the same problem at the call site, where Ranger
   passes an array literal.

### JSON on C++

`JSONDataObject` and `JSONArrayObject` are handles (`std::shared_ptr`), so
pushing an object into an array and then filling it behaves the way it does on
JavaScript. `JSONValueUnion` is a `std::variant`, so `case v x:JSONDataObject`
lowers to the same `std::holds_alternative` every other closed family uses, and
the generic `case` for `string` / `int` / `double` / `boolean` gained a C++
template for the same reason. The reader, the writer and the parser are
polyfills — a C++ build needs no library and no download.

Two things do not survive the trip, both because C++ has no place to put
"absent":

- `getStr` gives `""` for a missing key, so a key whose value is the empty
  string reads as missing. This is the same trade `read_file` already makes.
- `getBoolean` gives `false` for a missing key.

`getInt` and `getDouble` keep the distinction (`r_optional_primitive<T>`), and
`getObject` / `getArray` keep it too (a null handle).

### `weak` in a self-hosted compiler

`@(weak)` means "do not keep this alive". On JavaScript it means nothing at
all — the field is an ordinary reference and the collector keeps the object.
So a Ranger program can mark an **owning** edge `weak`, run correctly on
JavaScript forever, and dangle the moment it is compiled for C++, Swift or any
other target with real weak references.

The compiler had four of these, and each one produced a different symptom:

| Field | What broke |
| --- | --- |
| `RangerAppClassDesc.ctx` | null context in `defineVariable`, segfault |
| `RangerAppParamDesc.node` / `nameNode` / `fnBody` | null node in the flow parser, segfault |
| `CodeNode.evalCtx` / `flow_ctx` | code generation silently used the wrong context: a local that shadowed a field of the same name resolved to the **field**, so `values_1` came out as `this.values_1` |
| `CompilerResults.ctx` / `fileSystem` | the compile reported success and wrote no file |

The third one is the one to remember: it is not a crash. It is wrong output,
from a compile that reports success.

If you are porting a Ranger program to a target that is not JavaScript, read
every `@(weak)` in it and ask who else holds the object. `g++
-fsanitize=address` answers the first two rows immediately; the third and
fourth need a diff against the JavaScript build.

### 32-bit `int`

Ranger `int` is 64 bits on Go (`int64`), Rust (`i64`), Java (`long`), Kotlin
and Python, and **32 bits** on C++ (`int`) — even though `int_buffer` on C++ is
`std::vector<int64_t>`. The compiler contains the literal `2147483648`, which
has no C++ `int` to land in: `std::stoi` threw and the value silently became
`0`, so the C++ build read its own `INT_MIN` bound as zero. `str2int` now
saturates instead, which leaves one line of difference between the C++ build's
output and the Node build's (`0 - 2147483647` against `0 - 2147483648`) rather
than a wrong answer.

Widening C++ `int` to `int64_t` would remove the difference and is the change
this note argues for, but it moves every scalar in the generated C++ and the
engine tuning in `CPP_ENGINE_ANALYSIS.md` is measured against the current
width, so it is not made here.

### What Dart took

Dart started at 482 errors — the same JSON gap as C++, and then five of its own,
four of which are in the **writer**, not in a template:

1. **A lambda with a body came out as `(a, b) => { … }`.** That is the
   JavaScript arrow form; `=>` in Dart introduces a single *expression*. 356
   syntax errors in one file. No Dart program in the tests had a
   multi-statement lambda, which is why nothing caught it before.
2. **An optional in the middle of a path had no `!`.** The writer added one for
   the first segment only, so `target.nameNode.hasFlag(…)` was an error even
   inside `if (!null? target.nameNode)` — Dart promotes a local after a null
   test but never a field. 751 errors.
3. **A local holding a lambda was declared with an empty type.** `writeTypeDef`
   had no case for a function type, so `def set_async (fn:void (f:T) {…})` came
   out as a bare assignment to a name Dart had never seen. Dart spells the type
   `void Function(T)`.
4. **An enum in a type position wrote its Ranger name.** Only the
   `value_type == Enum` path knew an enum is an `int` on Dart; a return type or
   a collection element went through `getObjectTypeString`, which did not.
5. **Every library search path collapsed to `"./"`.** `normalize` has a `*`
   fallback that returns the literal `"./"`, so the compiler looked for its
   library in one place and found nothing. `normalize`, `path_dirname`,
   `install_directory` and `current_directory` now have real Dart entries.

Plus the operators only the compiler reaches: `create_dir`, `dir_exists`,
`write_file`, `env_var`, `error_msg`, `sha256` (a polyfill — SHA-256 is not in
the Dart SDK), `reverse`, `sort`, `trimEnd`, `remove_index`, `array_extract`,
and the `charbuffer` overloads of `substring` / `charAt` / `to_string` /
`to_charbuffer` (a `charbuffer` is `List<int>` on Dart, so the JavaScript
`String` fallback did not apply). `shell_arg` read the `args` of `main`, which
nothing but `main` can see; the writer now copies it into a `__g_args` global,
the same shape as `__g_argv` on C++.

Two source-level fixes were needed as well, both of the same kind as the C++
ones: an optional handed to a lambda parameter that is not optional, and an
optional read through a parenthesised receiver — `(at xs 1).paramDesc.name`,
where the writer has no named path to hang the `!` on.

### What Python took

Python started at 72 — the JSON templates were already there from an earlier
round — but the errors the compiler reports were not the hard part. What the
interpreter then found was:

1. **Python has no multi-statement lambda at all.** The writer had a comment
   saying so and emitted the single-expression form anyway, which is a syntax
   error for any lambda with a body: 231 of them. A lambda now becomes a named
   nested `def` hoisted above the statement that uses it, and the statement
   carries only the name. Hoisting to the top of the enclosing body rather than
   to the exact statement is safe because Python resolves a closure's free
   variables when the function *runs*.
2. **A closure that assigns an enclosing local needs `nonlocal`.** Without it
   Python makes the name a local of the `def` and the read raises
   `UnboundLocalError` — `total = total + doubled` inside a `forEach` is the
   shape, and it is everywhere in the compiler. The writer collects what the
   body assigns minus what it declares (including a nested lambda's own
   parameters and defs) and writes the `nonlocal` line.
3. **The entry point ran before the operator helpers existed.** `if __name__ ==
   "__main__": main()` was written after the class holding `main`, and the
   `operatorsOf…` helper classes come after all user classes, so any program
   using a collection operator died with `NameError`. It goes to `file_end` now.
4. **A `switch` over an ENUM fell through to a C `switch`.** The int overload
   has a Python `match` entry and the generic one did not, so the arms came out
   as Python `case` under a C head. Rust had the same hole.
5. **A body whose only statement was elided had no suite.** An unused `def` is
   written as a comment, and a comment is not a statement: `def joo(self, cm):`
   with nothing under it is an `IndentationError`. The elided line now starts
   with `pass`.

Plus the operators: `read_file`, `write_file`, `env_var`, `sha256`,
`normalize`, `path_dirname`, `install_directory`, `current_directory`,
`is_tty` (the `*` fallback is the JavaScript literal `false`, which Python
reads as a name), `clear` (`.length = 0`), `array_extract` (`.splice().pop()`),
and the `charbuffer` overloads of `length` / `charAt` / `substring` — Python
passes a charbuffer through as a `str`, so the JavaScript String methods of the
fallback did not apply.

### What C# took

C# started at 499, and every one of them was downstream of `JSON.rgr` having no
`csharp` template: an unknown `JSONDataObject` made 77 "Unknown type" errors and
the rest cascaded through them. The shapes are `Dictionary<string, object>`,
`List<object>` and `object`, the same mapping Go and Python use, and the reader
and the writer are hand written rather than `System.Text.Json` so the generated
file builds on Mono and on .NET alike with no package reference.

After that the compiler reported zero and `mcs` reported 188. Two of the things
it found are worth naming, because neither was an error anywhere — they were
**warnings and a program that ran**:

1. **A subclass field that redeclares a parent's field is a second storage
   slot.** `RangerAppFunctionDesc` redeclares `name`, `node`, `nameNode` and
   five more from `RangerAppParamDesc`, all with the same initializer, the way
   JavaScript lets you. In C# a write through the subclass and a read through a
   base-typed reference then touch different memory. The writer now skips a
   variable an ancestor already declares, which is one slot, like every other
   target.
2. **A subclass method that redeclares a parent's method without `override` is
   a second method**, and a call through a base-typed reference runs the *base*
   one. Every language writer redeclares `writeClass` from
   `RangerGenericClassWriter`, so `langWriter.writeClass(...)` ran the generic
   placeholder: the C# build of the compiler emitted
   `class LambdaHoist { /* static main */ }` for every target and reported
   success. The writer now emits `virtual` on a method of a class that is
   extended and `override` when an ancestor declares the same compiled name
   with the same argument count. That removed 894 CS0108 warnings with it.

Then three more, all C#-specific:

3. **A lambda parameter may not reuse a name that is live in an enclosing
   scope** (CS0136). `xs.forEach({ ys.forEach({ ... }) })` writes the implicit
   `item` and `index` twice, and that shape is 96 of the 188. The writer renames
   the inner parameter — renaming the ParamDesc renames the reads with it.
4. **A nested collection kept its Ranger spelling.** `[string:[string]]` came
   out as `Dictionary<String,[string]>`; the C# writer got the recursive
   conversion the Dart writer already had.
5. **`removeLast` wrote `Array.Resize`**, which is for `T[]` and not for
   `List<T>` — 84 errors from one line.

Plus the operators: `read_file`, `write_file`, `create_dir` and `dir_exists`
were **stubs that compiled to a comment**, so the C# compiler would have
reported success and written nothing; `normalize`, `path_dirname` and
`install_directory` fell to the `*` fallback, which is the literal `"./"`, so
the library search path collapsed and no import resolved; `env_var`, `sha256`,
`sort`, `clear`, `length`, `indexOf`, `remove_index`, `array_extract`,
`double2str`, `current_time_ms` and the `charbuffer` overloads of `substring`
and `to_charbuffer` had no entry or a wrong one. `str2int` and `str2double`
returned a plain `int`/`double` where the operator declares an optional, and
`charcode` returned `int` where the declared type is `char`.

Two of the existing C# entries were quietly wrong rather than missing:

- `to_charbuffer` used `Encoding.ASCII.GetBytes`, which writes `0x3F` for every
  byte over 127 — a source file with one non-ASCII character would have parsed
  as question marks. It is UTF-8 now, and `substring` over a charbuffer decodes
  the same way (its old entry named `Encoding.UTF`, which is not a type, and
  passed an end index where `GetRange` takes a count).
- `strsplit` split on `token[0]`, the **first character** of the delimiter. The
  parser normalizes line endings by splitting on the two-character sequence
  CR LF, so splitting on CR alone left every LF behind as an extra empty field:
  the C# build doubled the newline inside every multi-line string literal it
  read. That was the last difference between its output and the Node build's.

One more thing the C# target needs that the others do not: a `create_polyfill`
lands in the `utilities` tag, and the C# writer opens that tag **inside a class
body**, so a helper written there is a private member of whichever class
happened to claim it. Every helper added here goes to `after_imports` as a
file-scope `static class` instead.

### What Go took

Go is the interesting one: it reported **zero** compiler errors from the very
beginning, generated ~70k lines, and `go build` still refused it. An error count
of zero says only that the compiler found nothing to say.

Four of the defects were the writer's:

1. **A nested collection kept its Ranger spelling.** `[string:[string]]` came
   out as `map[string]*[string]` — and because the map helpers are *named* after
   the type they serve, also as `func r_has_key_string_[string](`. The writer
   got the recursive conversion the Dart and C# writers have, plus a rule that
   an element which is itself a collection takes no `*` (a slice and a map are
   already reference types). `(r_atype_fname N)` now maps every character that
   is not an identifier character, one for one, so no two types can collapse
   onto the same helper name.
2. **A `case` over a system union wrote the tagged-struct compare.** A union
   holding a primitive is not sealable, so its Go type is `interface{}` and
   there is no tag: `item.tag == interface{}_tag_string` is not even Go syntax.
   The six per-primitive `case` overloads narrow with a type assertion now.
3. **The function TYPE of a lambda ignored `@(optional)`.** An optional is a
   `*GoNullable` in every other place the writer emits one — the struct field,
   the method parameter, the local — so `callback:( fn:void
   (left@(optional):CodeNode …))` was declared `func(*CodeNode, …)` while the
   lambda handed to it took `*GoNullable`, and neither side accepted the other.
4. **`(goset N)` wrote nothing for an expression.** It writes the *setter* form
   of a variable path, but `??` expands to `(? (!null? X) (unwrap X) Y)` and X
   can be any expression: `(?? (get env.envVars name) "")` is a call, with no
   name path, so the output was `if (.has_value)`.

Then the one that was not a compile error anywhere, and is the reason this
target is worth the trouble:

5. **An optional is a `*GoNullable` BOX, and `def` aliased it.** `def wr
   (file.getWriter())` compiled to `wr = file.getWriter()` — the local pointing
   at *the very box the CodeFile owns*. Thirty lines later `wr = contentFork`
   wrote through that alias and replaced the **file's** writer. Every tag slice
   — the import lines, the polyfills, the entry point — belonged to the writer
   that had just been dropped, so the Go build produced files with no `using` /
   `#include` lines, no polyfill classes and no `main`, and reported success.
   The C# it generated had no `RgJson`; the Python had no
   `if __name__ == "__main__"`. A `def` of an optional now copies the two
   fields through a temporary instead of aliasing the box.

And the one that only shows up when the Go build generates Go:
`findClass` ends in `(unwrap (get definedClasses name))` with no guard of its
own, which answers `undefined` on JavaScript and **panics** on Go. Its one
caller that relied on the undefined — `goWriteUnionValue` — asks `hasClass`
first now.

Go is also stricter than every other target in two ways that turn a dropped
template argument into an error rather than a warning: an unread local and an
unused import are both build failures. That is what surfaced `path_dirname`,
`normalize` and `install_directory` having no Go entry (they fell to the `*`
fallback, the literal `"./"`, which drops `(e 1)` — so the library search path
collapsed *and* its argument went unread), the plugin-host templates dropping
the plugin they were handed, and three genuinely dead locals in
`CLIProgress.printFailure`.

Two more, both worth naming:

- `return` from inside a `catch` block: Go's catch is a deferred closure running
  `recover()`, so the return leaves the *closure*. `VirtualCompiler.run` had two;
  the nesting says the same thing without one.
- `error_msg` on Go was the empty string, so a Go build reported "Unexpected
  compiler error" and nothing else. It is the recovered value now — which is how
  the panic above was found at all.

`getInt` over JSON never matched anything that came back from `from_string`:
`encoding/json` decodes **every** number as `float64` and the polyfill asserted
`int`. It answered "absent" for a key that plainly held `3`. Both number getters
accept either now, the way the Dart, Python, Rust and C# entries do.

### What Kotlin took

Kotlin started at 19 compiler errors and, once those were gone, **3490**
`kotlinc` errors — by far the largest of the six. Most of that was two missing
pieces in the writer, and the one that mattered was a typo in a template.

The writer had **no lambda support at all**: no function type, no lambda
emission. So a lambda-valued parameter was declared with an empty type —
`fun forTree(cb : )` — and every lambda came out in the JavaScript arrow form
`(a, b) => { … }`, which declares no parameters. Roughly 1000 "unresolved
reference: item" errors and most of the 800 parse errors were those two.

A Kotlin lambda is written as an anonymous **function**, `fun(a: T, b: Int): R
{ … }`, and not as `{ a, b -> … }`: Kotlin does not allow a bare `return` inside
a lambda literal — it would return from the *enclosing* function, and is only
legal when the lambda is inline. The compiler's lambdas return values (`map`,
`filter`, `sort`), which was another 120 errors with 78 more downstream of the
body's type then being inferred as `Unit`.

Then the one worth the whole exercise, which produced **no error anywhere**:

> **`default` had `(block 2)` where the operator takes one argument.** Every
> `switch`'s `else` branch came out with an empty body. In the compiler that is
> the flow parser's dispatch, whose default clears a `b_found` that starts
> `true` — so `WalkNode` returned "already handled" for the root node, the
> Kotlin build analysed **nothing**, reported success, and wrote the source back
> out as bare tokens with no whitespace. `hasClassDescription` was never set, so
> `writeClass` was never called on any writer.

Finding it took working backwards from an 813 KB file of run-together
identifiers: the JavaScript writer's `writeClass` never ran, nor the generic
one, nor the Ranger one; `CollectMethods` found its 17 classes; `StartWalk` ran
once and stopped.

The rest:

1. **`char` was mapped to Kotlin's `Char`**, which is not an integer type and
   does not compare with an `Int` literal — `c == 10` was an error at 150+
   sites. Ranger's `char` is an integer code unit on every other target
   (`unsigned char` on C++, `byte` on C#/Go, `ord()` on Python, `int` on Dart),
   and the Kotlin templates already produced one: `charAt` and `charcode` both
   end in `.code`. Only the type said otherwise.
2. **An optional in the middle of a path had no `!!`**, the same hole Dart had.
   Kotlin smart-casts a local after a null test but never a mutable property, so
   this was ~640 errors between "only safe (?.) or non-null asserted (!!.) calls
   are allowed" and "smart cast is impossible, because it is a mutable property
   that could have been changed by this time".
3. **A property a subclass redeclares is an error**, not a second field: "hides
   member of supertype and needs 'override'", and `@JvmField` cannot go on an
   override at all. Same root cause as the C# storage-slot problem — Kotlin just
   refuses it outright.
4. **A parameter is a `val`.** The compiler assigns to two of its own
   (`node = (this.spliceFunctionBody(…))`), which every other target takes
   without comment. The parameter gets a suffixed name in the signature and the
   body opens with a `var` copied from it.
5. A systemclass reached the output under its Ranger name (`JSONValueUnion`),
   an enum in a return position wrote its Ranger name, an optional function type
   needs parentheses before the `?`, `reversed()` and `sortedWith()` answer a
   read-only `List` where the writer wants a `MutableList`, and `shell_arg` read
   the `args` of `main`, which nothing outside `main` can see.

The Kotlin **JSON polyfill was a stub**: `constructor(source: String) : this()
{}` took the text and threw it away, so `from_string` answered an empty object
and every getter after it read absent, while `to_string` returned Kotlin's map
rendering rather than JSON. It is a real reader and writer now — Kotlin has no
JSON in the standard library and the output has to build with a plain `kotlinc`
line, so the object, the array, the parser and the serializer all live in the
polyfill. `org.json` is no longer imported on top of it: nothing puts that
package on the classpath.

### The same self-compile on the other targets

Measured with `node bin/output.js -l=<target> ./compiler/ng_Compiler.rgr
-nodecli`, so this is the compiler's own diagnosis, not the target toolchain's:

| Target | Errors | First thing in the way |
| --- | ---: | --- |
| C++ | **0** | — builds and runs, see above |
| Dart | **0** | — `dart analyze` clean, runs, see above |
| Python | **0** | — `py_compile` clean, runs, see above |
| C# | **0** | — `mcs` clean, runs, see above |
| Go | **0** | — `go build` clean, runs, see above |
| Kotlin | **0** | — `kotlinc` clean, runs, see above |
| PHP | **0** | not built or run |
| Swift 6 | 12 | |
| Rust | **0** | `rustc` still refuses it — see below |
| Java 7 | 16 | |
| Scala | 467 | no JSON templates, the same wall C++, Dart and C# started at |

A zero in that column is the compiler's own diagnosis and nothing more. Go sat
at zero through all of this work and did not build until the five defects above
were fixed; Kotlin's 19 became 3490 `kotlinc` errors; PHP is at zero now and has
never been built or run.

### `strlen` counts bytes, `substring` counts characters

On C++ `strlen` is `std::string::length()` (bytes) and `charAt` indexes bytes,
but `substring` is `r_utf8_substr` and counts UTF-8 **characters**. A loop
written as `while (i < (strlen s))` over `(substring s i (i + 1))` therefore
runs past the end of a string that holds any non-ASCII character. Every other
target counts the same unit in both. Prefer `charAt` for a scan; the compiler's
own `advanceColumnForString` was rewritten that way.

## Dart (`-l=dart`)

Flutter-ready **package** generation for shared application logic (models,
validation, parsers, algorithms). The first milestone does **not** emit Flutter
widget trees.

- Sound null safety: Ranger `@(optional)` → Dart `T?`; unwrap / `!!` → `!`
- Collections: `List<T>`, `Map<K,V>`; buffers map to `dart:typed_data` types
- Top-level `void main(List<String> args)`
- Imports as `import 'dart:math';` / `import 'package:…';`
- `-pubspec` writes `pubspec.yaml` (requires `-name=` `-version=` `-description=`)
- `-flutter` with `-pubspec` adds a Flutter SDK dependency block
- Conformance and `npm run test:dart` exercise the target when the Dart SDK is on `PATH`

```bash
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node bin/output.js examples/dart_flutter_logic/CounterLogic.rgr \
    -l=dart -pubspec -name=counter_logic -version=0.1.0 \
    -description="Shared counter logic from Ranger" \
    -d=examples/dart_flutter_logic/generated -o=counter_logic.dart
dart run examples/dart_flutter_logic/generated/counter_logic.dart
```

See `PLAN_DART.md` and `examples/dart_flutter_logic/`.

**Golden module:** `gallery/ts_parser` compiles with `-l=dart -nodecli` and the
`-d` demo AST matches the JavaScript reference byte-for-byte
(`npm run tsparser:compile:dart && npm run tsparser:run:dart`, or
`npm run test:dart:tsparser`). String literals escape `$` as `\$` so Dart
interpolation does not break the lexer.

**TS engine gate:** the full interpreter (`bench_main.rgr`) also compiles with
`-l=dart` (~40k lines) and, when the Dart SDK is on `PATH`, answers the same
Node benchmark cases as Go/Python/C# (`npm run test:tsengine`).

## Swift 6 (`-l=swift6`)

- Modern Swift 6 compatible code generation
- Top-level `__main__swift()` entry point (avoids `@main` conflicts with
  file-level `func ==` overloads for Hashable classes)
- Integer-to-string conversion through `String()`
- Array operations using `.append()` instead of `.push()`
- File I/O through the `Foundation` framework
- String operations: `substring`, `indexOf`, `startsWith`, `endsWith`, `contains`, `split`, `trim`
- Optional handling with `unwrap` and `!!`
- Command-line argument access
- CRLF grapheme cluster handling for cross-platform string compatibility
- Value-type collections (`Array` / `Dictionary` / buffers) use `inout` + `&`
  when flow marks them mutated; uninitialized optionals emit `= nil`

```bash
node bin/output.js myfile.rgr -l=swift6 -o=myfile.swift
sed -i '' $'s/\r$//' myfile.swift  # Fix line endings on macOS
swiftc myfile.swift -o myfile
```

Both `gallery/js_parser` (4500+ lines) and `gallery/invaders` compile and run
on this target.

**TS engine gate:** the full interpreter (`bench_main.rgr`) compiles with
`-l=swift6` (~39k lines) and, when `swiftc` is on `PATH`, answers the same
Node benchmark cases as Go/Python/C#/Dart (`npm run test:tsengine`).

## Rust (`-l=rust`)

Preliminary support:

- Classes compiled to structs with `impl` blocks
- Constructors as `pub fn new()` returning owned structs
- Static factory methods
- Instance methods with `&mut self`
- String handling with `.to_string()` for literals
- Array operations (`push`, `itemAt`, `set`) over `Vec<T>`
- String concatenation through the `format!` macro
- Ternary expressions as `if`/`else` expressions
- Automatic `#[derive(Clone)]` for structs
- Mutability detection (`let` vs `let mut`)

```bash
node bin/output.js myfile.rgr -l=rust -o=myfile.rs
rustc myfile.rs -o myfile
```

**Test the output.** A simple program builds: eight of ten sample fixtures give
Rust that `rustc` accepts. Three limits are structural, and a program meets them
without a message from the Ranger compiler:

- **An object is a value.** A class becomes a plain `struct`, so two names do
  not share one object. `def b:Counter a` moves, and a later read of `a` is
  `error[E0382]: borrow of moved value`. The writer adds `.clone()` in many
  places, so a program can compile and still give a wrong answer.
- **Inheritance is not in the layout.** The subclass struct does not receive the
  fields of the parent: `no field 'name' on type 'Cat'`.
- **`weak` does not compile**, and the `Rc` that it downgrades is a temporary.

See [RUST_ISSUES.md](RUST_ISSUES.md) for the measurements and the order of the
work, and [RUST_TODO.md](RUST_TODO.md).

### What the compiler's own sources took, and where they still stop

Rust is the one target in this round that does **not** self-host. It is worth
recording how far it got, because the number in the table above says `0` and
that number means less here than anywhere else.

`node bin/output.js -l=rust ./compiler/ng_Compiler.rgr` reported 21 errors, and
all 21 were one writer bug: a `this.method(…)` written inside a `forEach` body
came out as *"a method that stores `this` cannot be called from here on Rust:
the constructor runs before the object is inside its Rc"*. None of the 21 was in
a constructor. `StaticAnalyzer.computeSelfRcNeeds` walks `cl.methods` and skips
lambdas, so a lambda's own desc never carries `rust_needs_self_rc`; the writer
asked the lambda rather than the method that declares it, and a lambda always
answers no. The lambda desc already points at its declaring method through
`insideFn` — `rustEnclosingMethod` hops to it first. That, plus operator entries
for `sha256`, `env_var`, `dir_exists` and `create_dir`, takes the target to 0.

`rustc` is the real gate, and it still refuses the result. Three writer defects
came out of the attempt and are fixed:

- A shared local of a class that has subclasses was declared
  `Rc<RefCell<Rc<RefCell<dyn XTrait>>>>`. `getObjectTypeString` returns the
  whole handle for such a class, and six sites wrapped it a second time —
  `.borrow()` then yields another `Rc`, so every field read through the name
  failed. About 1700 errors.
- Lambdas were written in the generic writer's JavaScript form,
  `(item, index) => {`. The Rust writer had no `CreateLambda`. `rustc` stopped
  at the arrow, 222 parse errors, hiding whatever they covered.
- A callback parameter's type was written as nothing at all — `cb : )` —
  because `writeTypeDef` had no `ExpressionType` case.

What is left is one structural thing, not a list of small ones. `rustc` reports
about 4700 errors on the 67k-line output, and the largest single share — 1659 —
is the *"Inheritance is not in the layout"* limit above, met at scale:
`RangerAppParamDesc` has three subclasses, so it is written as
`Rc<RefCell<dyn RangerAppParamDescTrait>>`, that trait declares methods and no
fields, and the compiler reads fields through parent-typed references
constantly. 39 distinct fields are involved. Field accessors on the trait are
the obvious repair, but they cannot be written yet: the subclass structs do not
carry the parent's fields at all (`RangerAppFunctionDesc` has 37 fields and none
of the 39), so inherited fields have to be flattened into the subclass layout
first. That is the same defect the bullet above names, and self-hosting Rust
means fixing it rather than working around it.

## C++ static analysis optimizer (`-l=cpp`)

The C++ target runs a static analysis pass that detects mutation patterns and
emits references instead of copies. Local variables assigned from member fields
used to be copied, so mutations were lost:

```ranger
fn writeByte:void (b:int) {
    def buf:buffer currentChunk.data   ; Assigned from member field
    buffer_set buf 0 b                  ; Mutates the buffer
}
```

```cpp
// Without the analysis pass
void writeByte(int b) {
    std::vector<uint8_t> buf = currentChunk->data;  // COPY!
    buf[0] = static_cast<uint8_t>(b);               // Modifies copy, not original!
}

// With it
void writeByte(int b) {
    std::vector<uint8_t>& buf = currentChunk->data;  // REFERENCE!
    buf[0] = static_cast<uint8_t>(b);                // Modifies original
}
```

The analyzer emits a reference when a local is assigned from a member field
*and* later mutated in place:

| Category   | Operators                                                     |
| ---------- | ------------------------------------------------------------- |
| Buffer     | `buffer_set`, `int_buffer_set`, `double_buffer_set`, `*_fill` |
| Array      | `push`, `set`, `clear`, `remove`, `removeIndex`               |
| Dictionary | `put`                                                         |

No source changes are needed; the pass runs automatically.

## Ownership inference

A second pass reads where each parameter goes and gives it an OwnershipKind:
`borrowed` (read only, does not escape), `moved` (stored into another object's
graph, `x.field = p` or `push self.items p`), `owned`, `shared` or `unknown`.
It covers instance methods, static methods and the constructor of every class.

The pass runs for a C++ compilation always, because the C++ writer reads the
result. `-strict-ownership` runs it for any target and prints it:

```bash
node bin/output.js program.rgr -l=cpp -strict-ownership
```

```text
ownership[infer] fn attach:
  param 'parent' -> borrowed
  param 'child' -> moved (parent.left)
```

**The C++ writer passes a `borrowed` object parameter as
`const std::shared_ptr<T>&`.** The caller holds the object for the whole call,
so the callee needs no reference count of its own, and each call saves one
atomic increment and one atomic decrement. `const` applies to the pointer and
not to the object, so `p->mutate()` still compiles. A parameter that the
program assigns to, or that the pass calls `moved`, `owned`, `shared` or
`unknown`, stays a copy, and so does every parameter of a class that takes part
in inheritance — a base and an override must keep the same signature.

`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` gives `borrowed` to 255 of 256
parameters across 110 functions. Its C++ output held 64 object parameters by
value and none by reference; it now holds 64 by reference and none by value.
Built with `g++ -std=c++17` and run five times over a photograph, the program
takes 4.4 s before the change and 3.9 s after it, and writes the same bytes.

## `enable_shared_from_this` (C++)

A class gets `public std::enable_shared_from_this<T>` when the writer emits a
`shared_from_this()` call for it — that is, where the program uses `this` as a
value — or when another class extends it, because a subclass can call through
the base. Every other class does without. The base costs a `std::weak_ptr` in
every object of the class.

`jpeg_scaler.rgr` had the base on all 22 of its classes and `js_ast.rgr` on all
41, with zero calls to `shared_from_this()` in either. Both now emit none.

## `weak` fields (C++)

A field that states `weak` becomes `r_weak<T>` in the place of
`std::shared_ptr<T>`. `r_weak<T>` is a small wrapper that the writer puts above
the classes of the file. It holds a `std::weak_ptr<T>` and gives the shared
pointer back at the read, so every read site of the generated code stays as it
was — a field access, a null test and an assignment all work unchanged. The
wrapper appears only in a file that holds a `weak` field.

A parent that holds its children and a child that points back keeps itself in
memory with a strong back reference: `g++ -fsanitize=address` reports
`168 byte(s) leaked in 3 allocation(s)` for that program. With `weak` on the
back reference the same program leaks nothing.

## `final class` and `weak var` (Swift)

Swift calls a method of a `final` class directly, and must go through the
witness table for an open one. A class that no class in the compilation extends
is therefore `final`.

A field that states `weak` **together with** `optional` becomes `weak var x : T?`.
Swift needs both: a weak reference must be a `var`, and it must be optional,
because Swift sets it to nil when the object goes away. `@(weak)` alone keeps
the strong form.

```ranger
def parent@(weak optional):Node
```

```swift
weak var parent : Node?
```

## The `record` constructor (all targets)

The compiler builds the constructor of a `record` from its fields, and the
signature it builds holds two parameters per field: a marker that carries the
name of the keyword and no type, next to the parameter that carries the value.

```text
Constructor (xpos@(keyword) xpos:int ypos@(keyword) ypos:int)
```

Only a language with keyword arguments writes the marker. Every writer now
drops it, in the signature and at the constructor call. Before, only the
JavaScript writer did, so the record constructor of the eleven other targets
did not compile — for example `pub fn new(xpos : , xpos : i64, …)` on Rust and
`Point::Point( xpos , int xpos , … )` on C++.

See [PLAN_CODEGEN_OWNERSHIP.md](PLAN_CODEGEN_OWNERSHIP.md) for the
before-and-after of each target, and for the one change that is not made:
`record` as a value type in C++ and in Swift. That one stays open because it
would make the same program share an object on nine targets and copy it on
two.

## HTTP servers (Go target)

Classes annotated with `@(HttpServer)` can use HTTP operators and route
annotations. Only the **Go** target is supported today.

```ranger
Import "stdlib.rgr"

class MyServer@(HttpServer) {
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) {
        http_set_header res "Content-Type" "text/html"
        http_set_status res 200
        http_send res "<h1>Hello from Ranger!</h1>"
    }

    fn handleEvents@(SSE "/events"):void (client:SSEClient) {
        sse_send client "message" "Welcome!"
    }
}

sfn main@(main):void () {
    def server:MyServer (new MyServer())
    start server 3000
}
```

- **Systemclass types:** `HttpRequest`, `HttpResponse`, `SSEClient`, `HttpServer`
- **HTTP operators:** `http_get_method`, `http_get_path`, `http_set_status`, `http_set_header`, `http_send`
- **SSE operators:** `sse_send`, `sse_is_connected`
- **Route annotations:** `@(GET "/path")`, `@(POST "/path")`, `@(SSE "/path")`
- **Lifecycle:** `start server port`, `stop server`

```bash
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./myserver.rgr -d=./bin -o=myserver.go -nodecli
cd bin && go run myserver.go
```

`tests/fixtures/http_server.rgr` is a complete example. See
[PLAN_HTTP.md](PLAN_HTTP.md) and [TODO_HTTP.md](TODO_HTTP.md).

## Polyfills

Operators that need helper functions in the target language can carry
polyfills — utility functions, types or constants added to the generated output
when the operator is used.

- **Automatic deduplication** — a polyfill is emitted once no matter how often the operator appears
- **Per-target definitions** — each target language can have its own implementation
- **Platform-specific code** — polyfills may contain conditionals such as `#[cfg(windows)]` in Rust

For example, `on_keypress` in Rust generates raw terminal input helpers that
work on both Windows and Unix. See `ai/GRAMMAR.md` (operator templates /
`create_polyfill`) for how to write
operators with polyfills.
