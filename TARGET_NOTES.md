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

## The compiler on LLVM: how far it gets

LLVM is the seventh target the compiler has been compiled for, and the first
one that is a **code generator rather than a source writer**: there is no
text template to fall back on, every construct has to be lowered to IR, and
nothing about the result is checked by another compiler's front end.

```bash
npm run selfhost:compile:llvm   # generate the IR, report the error count
npm run selfhost:check:llvm     # ...and run `opt -passes=verify` over it
npm run selfhost:build:llvm     # ...and link ./tmp/selfhost-llvm/rangerc
```

**Where it stands.** The compiler compiles for LLVM with **zero errors** (631
before this work), the ~525k lines / 22 MB of IR it produces for itself **pass
`opt -passes=verify`**, and `clang` links them with the C runtime into a 3 MB
`rangerc`.

That binary **runs the whole pipeline and writes real output**. On a small
class it produces JavaScript byte-identical to the Node build's, and the
JavaScript runs:

```bash
npm run selfhost:build:llvm
./tmp/selfhost-llvm/rangerc -l=es6 tmp/probe/hello2.rgr -nodecli -d=tmp/probe -o=hello2.js
node tmp/probe/hello2.js
```

`compiler/CLIProgress.rgr` -- 250 lines, a class with a dozen methods, string
building, ANSI escapes and a switch -- also comes out byte-identical.

It is **not yet** a self-hosting target the way C++, Dart, Python, C#, Go and
Kotlin are: pointed at the compiler's own sources it still stops. On the larger
library files it now runs the front end cleanly (`ng_CodeNode.rgr` and
`ng_writer.rgr` type-check with no errors) and fails in the writer.

`lib/CmdParams.rgr` -- the compiler's own command-line parser, which has a
`main` of its own -- is the useful small program to check against, because it
exercises the shapes that broke first (a `[string:string]` map, `strsplit`,
`join`, `remove_index`) and it now answers correctly natively:

```bash
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" node bin/output.js \
  -l=llvm ./lib/CmdParams.rgr -nodecli -d=tmp/probe -o=cmdparams.ll \
  -target=native-linux-gnu
clang -O0 tmp/probe/cmdparams.ll runtime/ranger_rt.c runtime/ranger_mem.c \
  runtime/ranger_json.c runtime/ranger_buffer.c -o tmp/probe/cmdparams -lm
./tmp/probe/cmdparams -l=es6 x.rgr -d=out -o=x.js
#   l = es6 / d = out / o = x.js, flag nodecli, value x.rgr
```

Getting that far took two runtime fixes worth naming, because both were
silent: a `[string:string]` map stored the pointer it was given rather than a
copy, so it held memory the caller had already freed (the compiler's own
`-o=` value came back out as another string), and `remove_index` had no
lowering at all, so it did nothing.

### What LLVM took

The front-end half was the same shape as the C++ round, and the JSON gap was
the same gap:

1. **JSON had no LLVM support at all** — 421 of the last 435 errors, every one
   of them in the generated `extension CompilerInterface`. Each `@serialize`
   class generates a `toDictionary` / `fromDictionary` pair, so a target with
   no JSON cannot compile the compiler at all. `runtime/ranger_json.c` is a
   reference-counted tagged value with insertion-ordered objects, a parser and
   a writer; `case v x:JSONDataObject` lowers to a kind test plus one read.
2. **Operators with no `llvm` entry did not match at all**, so the call failed
   type checking rather than falling back to something wrong: startsWith,
   endsWith, replace, indexOfFrom, sort, reverse, insert, remove, cast,
   nullify, error_msg, sha256, dir_exists, create_dir, write_file, env_var,
   normalize, path_dirname, install_directory, current_directory, is_tty, the
   ANSI escapes, and `for` over a `[string:T]` map.
3. **Operators that carried a `*` template but no lowering** were worse: they
   type checked and then emitted their own name as a value. `ccode`, the
   ternary (`max` and `min` expand to it), `join`, `array_extract`,
   `to_charbuffer`, `current_time_ms`, `charcode` — and `removeLast`, `clear`
   and `remove_index`, which compiled to *nothing at all*, a silent no-op. The
   compiler pops the last segment off a path with `removeLast` when it builds
   its library search path, so every candidate directory kept the file name on
   it; `remove_index` is how `-o=x.js` becomes the key `o` and the value
   `x.js`, so without it every parameter kept its own name in its value.

The second half had no precedent on the other targets, because nothing had
ever run the compiler's own IR through the verifier:

4. **Enum members emitted a bare `%RangerNodeType.NoType`** — 900 undefined
   values. An enum member is an integer constant, an enum-typed field is an
   i32, and an enum-typed value is not an object (a call returning one had its
   result handed to `ranger_obj_release`).
5. **Inherited fields were missing from the flat struct**, so every read of one
   was `getelementptr … i32 -1`. Inherited *methods* are emitted once, under
   the class that declares them, so a call to one named the derived class and
   referenced a function the module did not contain.
6. **The synthetic `operatorsOf…` classes were skipped whole** — the holders
   the matcher creates for `operator type:T { fn forEach … }`. 44 functions
   were called and never emitted.
7. **Closures were WAT-only.** The LLVM writer had no `call_indirect` case at
   all, and the hoisting pass that assigns each lambda its table index ran only
   under `-wat`: on the native path every closure record carried index 0 into
   an empty table and the call jumped to address 0. The record also used
   four-byte slots and i32 stores for every capture, which truncates a pointer
   on a 64-bit target.
8. **Widths.** Booleans (i1) and ints (i32) and pointers (i64) disagreed at
   almost every boundary — array elements, map values, call arguments, branch
   conditions, comparisons, returns, closure captures. The lowering decided
   these from the shape of the source node, which a dozen constructs hide. The
   builder now **records the IR type it actually emitted for each SSA name**,
   and the store / call / compare / branch paths reconcile against that. This
   is the single change that closed most of the tail.

### What the RUN took

Nothing above is visible until the binary runs, and nine defects stood between
"links" and "writes correct JavaScript". Every one of them was silent — no
diagnostic, no verifier complaint, usually not even a crash at the site of the
mistake. They are worth naming because they are the shape of the problem for
any code-generating target:

9. **`switch` had templates but no lowering**, so the whole statement — every
   case with it — was dropped. Every writer in the compiler dispatches on a
   switch, which is why the binary emitted bare identifiers
   (`classDemosfnmprintreturn`) instead of code. `try` was the same: the body
   was lowered and the handler thrown away.
10. **A `def` that redeclares a live name shared its slot.** With a narrower
    outer type — ng_TTypes' `baseTypeAsEval` declares `vType` as an enum and
    again, in the else branch, as a string — an 8-byte `store i8*` went into an
    `alloca i32` and smashed the locals beside it. With the *same* type it was
    worse: `convertToUnion` takes `wr:CodeWriter` and does `def wr (new
    CodeWriter)` inside an `if`, so the name joined the owned-object list and
    the single scope-end release freed whatever the slot held — on the paths
    where that `if` never ran, the caller's writer.
11. **Lowering did not stop at a terminator.** A LowIRBlock keeps its
    terminator apart from its instructions and the writer prints the
    instructions first, so anything lowered after a `return` was emitted
    *before* the `ret` and therefore ran. `WalkCollectMethods` has a bare
    `return` with a page of dead code after it: every owned local was released
    twice, and the operator nodes it had just built went back to the allocator
    while `stdCommands` still pointed at them.
12. **Method calls bound statically.** This target emits one plain function per
    method, named after the class that *declares* it, so
    `langWriter.writeClass(…)` — `langWriter` is declared
    `RangerGenericClassWriter` and holds a `RangerJavaScriptClassWriter` — went
    to the base implementation. The compiler is one base writer plus a dozen
    overriding subclasses, so nothing target-specific was ever reached and every
    language got the base writer's output. Dispatch is now by runtime type
    descriptor: `ranger_obj_type` hands back the descriptor an object was
    created with, and a generated `__vd_<class>_<method>` compares it against
    each candidate.
13. **Closures nested inside closures captured nothing.** The frontend's
    capture set is per lambda, so a name only an *inner* lambda reads reached
    neither env. And `myLambdas` is flat, so the pass that names lambdas
    reached the same descriptor twice and renamed it — the capture layout
    cached while lowering the resulting dead copy was the one the live nested
    lambda used.
14. **A captured local that a lambda MUTATES was copied**, so the write was
    never seen outside. The flow parser counts a method's `static` prefix that
    way, so every `static fn` in a class was read one child off.
15. **The object pool wrote past the end of a zero-field object.** A pooled
    block keeps its free-list link in the body; a class with no fields has none,
    so the link went eight bytes past the allocation and corrupted the arena.
16. **`strfromcode` UTF-8-encoded its argument.** A string is bytes here and
    `charAt` hands back one byte, so the round-trip `strfromcode (charAt s i)`
    — which is how the compiler copies a string literal through `EncodeString`
    — turned every non-ASCII character into mojibake.

### What is left

- **The writer.** The front end is clean on the compiler's own library files;
  `RangerJavaScriptClassWriter.writeClass` then stores through a null object.
  That is the next thing to bisect.
- **The second `initOpList`** — the pass that re-reads the operator table after
  the program's own `operators { }` blocks are merged — was the last thing to
  stop the run and is worth watching: it walks `stdCommands.children`, which is
  where a use-after-free shows up first.
- **Closures are incomplete.** A lambda whose capture layout was never built —
  one only ever *called*, never constructed in the same module — loses its
  captures; the calls it makes through an unresolved receiver are dropped rather
  than emitted, which keeps the module valid and loses the call.
- **`remove` and `clear` leak** an owned element instead of releasing it. That
  is deliberate for now: leaking is safer than a double free while the
  ownership analysis on this backend is young. `array_extract` hands the
  element to the caller, which is what its `@(strong)` says. A block-scoped
  redeclaration leaks its inner value for the same reason.
- **Plugins cannot work.** `load_compiler_plugin` loads an npm module; a native
  binary has no Node to load it into.
- **No exceptions.** `try` has no unwinding. The handler is an ordinary block
  and a null `unwrap` inside a `try` branches to it, which covers the one thing
  the compiler's own sources use `try` for; `error_msg` answers the same
  placeholder the C++ template does.

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
| Rust | **0** | `rustc` clean; the binary compiles the compiler, byte-identical |
| Java 7 | 16 | |
| Scala | 467 | no JSON templates, the same wall C++, Dart and C# started at |

A zero in that column is the compiler's own diagnosis and nothing more. Go sat
at zero through all of this work and did not build until the five defects above
were fixed; Kotlin's 19 became 3490 `kotlinc` errors; PHP is at zero now and has
never been built or run.

### `substring` counts the unit its neighbours count — `utf8_substring` counts characters

An index has to mean one thing to all of `strlen`, `charAt` and `substring`,
because a scanner finds a character with one and slices it out with the others.
C++ used to disagree with itself: `strlen` is `std::string::length()` and
`charAt` is `s.at(i)`, both **bytes**, while `substring` was `r_utf8_substr` and
counted **characters**. A scan over `"—b"` finds `b` at byte 3, and asking for
characters 3..4 of a two-character string gives back nothing — C++ was the only
target of seven to answer `scan: []` where the rest answer `scan: [b]`.

`substring` now slices bytes on C++. That still round-trips UTF-8: the pieces of
a multi-byte character concatenate back into the character, which is what the
compiler's own string parser relies on when it walks a literal one index at a
time.

Counting characters is a separate job, so it has its own operator.
`utf8_substring` always counts code points, whatever unit the target's own
`substring` counts — for truncating a label to twenty characters without cutting
one in half. It uses `r_utf8_substr` on C++, the rune slice on Go, `chars()` on
Rust, `offsetByCodePoints` on the JVM targets, `runes` on Dart, `mb_substr` on
PHP, a surrogate-aware walk on C#, and `Array.from` elsewhere.

`tests/string-index-semantics.test.ts` pins both halves across seven targets.

### How long the compiler takes to compile itself

Same input (`./compiler/ng_Compiler.rgr` to ES6), same machine, a 4-core Xeon at
2.80 GHz. Median of three, after a warm-up run. All three renderings emit the
same bytes — the comparison is only meaningful because the outputs are identical.

| Rendering | Self-compile | Peak RSS |
| --- | ---: | ---: |
| C++ (`g++ -O2`) | **4.05 s** | 772 MB |
| Rust (`rustc -O`) | **4.59 s** | 708 MB |
| JavaScript (node) | 10.5 s | — |

Building the compiler *binary* is the slow part, not running it: generating the
C++ takes ~15 s and `g++ -O2` another ~175 s; Rust is ~15 s and `rustc -O`
~170 s. The two native builds run concurrently in about the time of one.

Three defects stood between this and where it started, and the order they were
found in is the order of their cost:

1. **A lambda copied a by-reference parameter** (C++ only). The writer captures
   an enclosing parameter by value so a stored callback keeps its own handle —
   right for a `shared_ptr`, wrong for a parameter the signature already passes
   as a reference. `markAsyncFromVariant` guards its recursion with a `visited`
   list and recurses from inside a `forEach`, so every branch got a private copy
   of the list, saw nothing its siblings had marked, and re-walked the call
   graph. The answers were right; the cost was not. The C++ binary had not
   finished after **775 s**.
2. **Seven dead source-line lookups.** `WalkNode` — the flow parser's main tree
   walk — opened by computing the line its node sat on and never read it.
   `getLine` sums the length of every line from the start of the file, so that
   was one pass over the whole source *per node*; `stdParamMatch` did the same
   once per operator match. Deleting the seven bindings took C++ from 29.0 s to
   4.05 s, Rust from 47.9 s to 4.59 s, and node from 14.2 s to 10.5 s. It was
   86% of the C++ run and 90% of the Rust one.
3. **`findMethod` rebuilt the key list** (`keys method_variants`, an allocation
   plus a copy of every method name) to answer a single map lookup, and
   `hasMethod` asked each parent twice — 2^depth over an inheritance chain.

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

Rust compiles. `rustc --edition 2021` accepts the 67k-line rendering of the
compiler's own sources with **0 errors** (229 warnings), and `rustc -O` links an
11 MB binary from it:

```bash
bash scripts/rust-selfhost-check.sh          # regenerate and count rustc errors
rustc -O --edition 2021 tmp/selfhost-rust/ranger_compiler.rs \
  -o tmp/selfhost-rust/ranger_rust
```

That binary does not yet **run** a compilation to completion — see *What the
binary still hits* at the end of this section. The rest of this records how the
compile got there, because the number started at 4981.

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

The biggest single thing in the way was the *"Inheritance is not in the layout"*
limit above, met at scale: `RangerAppParamDesc` has three subclasses, so it is
written as `Rc<RefCell<dyn RangerAppParamDescTrait>>`, that trait declared
methods and no fields, and the compiler reads fields through parent-typed
references constantly — 1881 errors between the two halves of it. Both halves
are fixed. `rustAllStructVars` gives a class its own fields plus everything it
inherits and has not restated, so the struct, the constructor's literal and the
`derive(Clone)` question all work from one list; and the trait hands each field
of the trait-defining class out by reference, `rgf_x()` to read and
`rgf_x_mut()` to write, with `WriteVRef` routing a segment through the accessor
when the segment before it is a class with children.

Everything after that has been ordinary codegen work, measured one shape at a
time. `rustc` on the 67k-line output is down from **4981 errors to 7**
(`bash scripts/rust-selfhost-check.sh` regenerates and counts). The shapes that
carried real defects, rather than Rust-specific plumbing:

- `indexOf` over an array compiled to `.position(…).unwrap()`, which **panics on
  a miss** where the operator has to answer −1. Every "is this here" question in
  the compiler would have aborted the process.
- A Ranger `switch` without a `default` produced a non-exhaustive `match`.
- `remove_index` and `array_extract` fell through to JavaScript's `splice`/`pop`
  pair, and their target was walked as a read while `Vec::remove` mutates it.
- A no-argument operator call — `(ansi_green)` — is an expression holding one
  bare name, the same shape as a parenthesised variable, so the concat collector
  unwrapped it and wrote the operator's *name* as if it were a value.
- The mutation graph that picks `&self` vs `&mut self` never looked at inherited
  or trait methods, so a `&self` method could call a `&mut self` one.
- The compiler-plugin operators had no Rust entry at all, so they still had the
  bug this file's own plugin section describes: an empty template writing
  `plugin = ;`, a syntax error that stopped `rustc` reading the region around
  it. Six other targets had been given entries; Rust had been missed.
- Ranger writes an initializer parenthesised — `def p (h.payload)` — and the
  move/clone analysis was inspecting the *wrapper* rather than the name inside
  it, so every test in it answered "no" and a non-`Copy` field was moved out of
  a borrowed struct at 45 sites.
- A no-argument operator call is an expression holding one bare name, the same
  shape as a parenthesised variable, so the concat collector unwrapped it and
  wrote the operator's *name* as if it were a value.

- `==` on an object means IDENTITY in every other target, where the handle is a
  pointer, a reference or a shared_ptr. Rust will not compare two `Rc`s at all,
  so the comparison had to go through `Rc::ptr_eq`; until it did, the writer had
  no reading of object equality at all.
- Two `length` templates handed back a `usize` where every Ranger `int` is
  `i64`, and the string one counted BYTES where go and swift count runes.
- `normalize` and `install_directory` had no Rust template and fell through to
  the catch-all, which answers with the literal `"./"` — so every path the
  compiler built for its library search came out as that literal.
- `@(weak)` on a RETURN was written as the `Weak` form, which disagreed with
  every caller (they bind the result to an `Rc` name) and with every body (they
  return one).

### The last four, and why they were fixed in the sources

The tail ended in two shapes Rust cannot borrow-check at all, and both were
answered by expressing the lambda as a method — which every other target
already handles, so nothing was lost:

- **Recursive closures.** The compiler declared a lambda in a local and then
  assigned the real body to it so the body could call the name — `walk_xml`,
  `set_async`, `set_called`, `just_vref`. A `&mut |…|` literal is a temporary
  that dies at the end of its statement (E0716), and the fix is not local:
  binding the literal to a `let` first only trades E0716 for E0506, because the
  body captures the very name being assigned to. Giving such a name the owned
  `Box<dyn FnMut(…)>` form was written and measured — 25 → 39 — and reverted.
  The bodies also mutate captured scalars (`currCnt = currCnt + 1`), which rules
  out the `Rc<RefCell<Option<Rc<dyn Fn>>>>` self-reference cell that would
  otherwise work: `FnMut` cannot be re-entered through a `RefCell`. So each
  became a method: `isJustVref` captured nothing, `markCalledFromMain` captured
  `ctx`, `markAsyncFrom` / `markAsyncFromVariant` captured the visited list, and
  `walkXmlCreate` threads the register counter through its return value so the
  generated register names are unchanged.
- **A closure that calls back into its own receiver.**
  `this.EnterFn(node ctx wr { … this.walkFunctionBody(…) … })` handed a closure
  needing `&mut self` to a method that had already taken `&mut self`. `EnterFn`
  now returns the four parts it used to pass to a callback, so `EnterMethod` and
  `EnterStaticMethod` call `walkFunctionBody` directly. The parts object is
  returned non-optional with an `ok` field: an optional return out of a function
  holding a `try` is a shape the Go writer types from the catch value rather
  than from the declaration.

Downcasts used to be a third family. They are now written: every generated trait
carries an `RgAnyRef` supertrait, every participating class implements it in one
line, and `cast` is a Rust CustomOperator that checks the concrete type through
`Any` and rebuilds the `Rc` around the same allocation — what
`Rc::<dyn Any>::downcast` does in std. It is the one place the writer emits
`unsafe`, and it is sound behind the assert.

The measurements that mattered, including the changes that made things worse and
were backed out, are recorded in comments at the sites they belong to, so the
next pass starts from the number rather than the guess.

### Running it: the re-entrancy work

The compile being clean is not the same as the binary working. Every method
call in the output used to be `x.borrow_mut().m(…)`, which holds the cell for
the whole call, so any method that reaches its own object again panics —
`already borrowed`. The compiler does that constantly: `RangerAppWriterContext`
alone has 48 methods that fetch `this.getRoot()` and then read or write through
it, and for the root context that handle IS `this`.

The binary now gets through **method collection, code analysis and type
checking** — stages 1 to 3 of five — and enters code generation, where it used
to abort on the first file it opened. What moved it:

- **Every instance method of a shared class is emitted with no receiver.** It
  takes the object's handle instead and borrows one statement at a time. This
  is the change that mattered: a `&self` receiver is a borrow of the cell held
  for the whole call, and anything the body then calls can come back to the
  same object. The narrower rules tried before — only methods that pass `this`
  on, only bodies that fetch another handle of their own class — each fixed the
  panic in front of them and left the next one.
- **A field READ takes a shared borrow and a field WRITE the mutable one.**
  Shared borrows nest, so two field reads in one statement are two live `Ref`s
  and nothing more; the mutable form there is what turned them into a panic.
  The write side is already marked for the writer: assignment sets it, and the
  template expander sets the same flag for the target of a mutating operator
  (`push`, `set`, `insert`, …). Compound assignment (`x += 1`) had to be taught
  to set it too.
- **`this` at the head of a PATH is always a read.** `this.langWriter.write(…)`
  borrows the writer's cell for the call, not this one, so the navigation to
  the field takes the shared form. The mutable question belongs to the last
  cell in the path.
- **A `switch` subject lands in a `let` first.** `match x.borrow().f { … }`
  keeps the `Ref` alive for the whole match, so every arm that touched the same
  cell panicked. The string overload already did this; the integer and enum
  ones did not.
- **A static-spelled call takes the LAST segment of the path as the method
  name**, wraps a raw value handed to a borrowed shared parameter, and honours
  an argument that was hoisted to a temporary. That last one is the sharpest:
  the hoisting ran, wrote its `let`, and this emission path ignored it — which
  is exactly the double borrow the hoisting exists to prevent.
- **Argument hoisting also runs for a call node that carries `has_call` but is
  spelled `(fnRef args)`.** No argument of such a call was examined before.
- **A read through a weak field takes a shared borrow.** It was always
  `borrow_mut()`, so two reads of one parent in a single expression panicked.
- **The receiver handle is unsized where the callee declares the trait
  object.** A method of a trait family declares its hidden argument as
  `dyn XTrait`, and a call site holding the concrete class now writes the
  coercion.

Source sites were changed where the fix was one line and the alternative was a
codegen special case — always the same shape, reading one field while writing
another in a single statement:

- `defineNodeTypeToSelf` is the aliasing form of `defineNodeTypeTo`, which was
  called as `cn.defineNodeTypeTo(cn ctx)` — one object read and written at once.
- `CodeNode.setFlag`, `cloneWithType`, `rebuildWithType`, `getLine` and
  `getColumnStr` bind `code`, `sp` and `ep` before constructing.
- `CodeWriter.createTag`, `addIndent`, `syncColumnFromCurrentLine` and
  `writeSlice` bind the value they are about to append to.
- `RangerAppEnum.add` and the three signature counters take the counter into a
  local before storing it.
- `changeStrengthSelf`, `getTargetLangName`, `getRootFile`, `setRootFile`,
  `addError`, `addParserError` and `transformWord` from the earlier pass.

### It self-hosts

The Rust rendering of the compiler compiles **the compiler's own sources**, and
the JavaScript it produces is **byte-identical** to what the JavaScript build
produces from the same input — same md5. The compiler that comes out of it runs
and compiles programs.

```
$ npm run selfhost:parity:rust
[1/4] generating the Rust rendering
[2/4] building it
[3/4] the Rust binary compiles the compiler
[4/4] comparing with the JavaScript build
OK: byte-identical
```

That makes Rust the seventh target to build the compiler, alongside C++, Dart,
Python, C#, Go and Kotlin.

### How it got there

```
[1/5] Collecting methods...
[2/5] Analyzing code...
[3/5] Type checking...
[4/5] Generating code...
[5/5] Writing output...
[OK] Compilation successful!
```

The Rust rendering of the compiler compiles a program end to end, and its
output is **byte-identical** to what the JavaScript build produces from the
same input. `scripts/rust-selfhost-run.sh` builds it and runs it over
`tests/rust_run/hello.rgr`.

What finally moved it was the trait families — the language writers. A trait
method cannot be dispatched without a receiver, so `&mut self` on one means
`wr.borrow_mut().WalkNode(…)` at every call site, holding the writer's cell
for the whole call while `LiveCompiler` calls back into it. Two SHARED borrows
nest, so the only question was which of these methods actually needs to mutate.

The old answer was "all of them", by fiat. Replacing that blanket with the
truth took the following, in order, each one uncovered by the next failure:

- **One mutation analysis for the whole family, on one merged call graph.**
  Per-class graphs get the transitive step wrong, and the merge has to UNION
  the call edges: `writeClass` calls `writeTypeDef` in one writer and not in
  the next, and whichever was written last used to be the only one with edges.
- **The blanket had to come out of `buildInheritedMutationGraph` too.** It
  marked every inherited trait method as mutating, which fed straight back
  into the analysis meant to replace it — and separately made every caller of
  an inherited method `&mut self` for no reason.
- **A scalar field of a trait-family class lives behind interior mutability** —
  `Cell<T>`, `RefCell<String>`, `RefCell<Vec/HashMap>`, and `RefCell<Option<T>>`
  for a field never reached through a path. Writing one is then not a mutation
  of the struct. Reads take `.get()` or `.borrow()`; a string reads inside a
  block so its `Ref` dies before the statement continues; writes compute the
  value into a temporary first, because naming the field as the receiver
  borrows the object for the whole statement.
- **Three mutation rules counted writes that were never to this object**: a
  call through a field holding an Rc borrows the FIELD's cell, a mutating
  operator on `ctx.someMap` writes the context's field and not this one, and
  neither is a mutation of the struct.
- **Call sites had to learn the same answer.** A call through a trait-typed
  field asks the family, so a `&self` callee is reached with `.borrow()`.
- **A call through one of this object's handle fields hoists the handle to a
  local first.** `langWriter.writeClass(…)` reads the field out of this
  object, and that read's `Ref` lives to the end of the statement — which is
  the whole call, which is when the callee reaches back in.
- **A read through a trait accessor takes a shared borrow.** Two reads of one
  object in a single statement — `outMapped(…, p.compiledName, …, p.name)` —
  are two live `Ref`s, and the mutable form there is a panic rather than a
  borrow error.

**The entry point runs on a thread with a 512MB stack.** Rust gives the main
thread 8MB, and a recursive-descent walk over a real program overflows it with
`fatal runtime error: stack overflow` and no diagnostic at all — the compiler's
own sources do it. A spawned thread's stack size is ours to choose, so `main`
is a shim that spawns the real body.

Three source sites changed where the fix was one line: the JavaScript writer
records its ReactNative flag on the context rather than on an inherited map
field, the Go writer builds its HTTP-server writer per call instead of holding
one, and `RangerAppParamDesc`'s aliasing cases from the earlier passes.

**2379 methods now take `&self`** where 848 did before this pass, and the
writer trait declares exactly two `&mut self` methods, both field accessors.

Two more defects showed up only at full scale, and both were real:

- **A weak optional field reads with `and_then`, not `map` then `unwrap`.** A
  weak reference whose referent is gone means NULL, which is what `@(weak)`
  means on every other target; unwrapping the upgrade turned it into a panic.
  `RangerCompilerMessage.node` also became owning: a diagnostic outlives the
  tree it points at, and the error printer is the one place that must not fail.
- **A trait-interface method always keeps its receiver.** Without one the call
  site writes `Parent::m(…)`, which is the parent's own implementation — the
  override never runs. `lineEnding` came back as the generic writer's `""`
  instead of the JavaScript writer's `";"`, and the difference reached the
  emitted code. This was the last thing between the two builds and byte
  equality.

Of the 189 programs in `tests/fixtures`, the Rust binary compiles 136 cleanly
and reports diagnostics on the rest; a handful still panic on shape and process
fixtures, which is where to continue.

One conflict is worth naming because no codegen change can settle it:
`RangerAppParamDesc` declares `node`, `nameNode` and `fnBody` as owning and
three subclasses restated them `@(weak)`. A restatement is the same slot, an
inherited method body is emitted into every subclass's impl unchanged, and a
trait accessor's signature comes from the parent while its body reads the
subclass's slot — so neither declaration can win everywhere. The subclasses were
changed to agree with the parent, which the parent's own comment explains: a
descriptor outlives the tree it came from whenever that tree was a copy or a
macro expansion, `weak` is a no-op on the JavaScript host so nothing noticed,
and on C++ the nodes were already gone by the time the flow parser read them.

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
