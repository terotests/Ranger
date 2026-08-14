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

## Cross-target gate: the compiler itself, on C++ and Dart

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

`npm test` runs the codegen for both targets and checks the result — `g++
-fsyntax-only` for C++, `dart analyze` for Dart (`tests/compiler-selfhost.test.ts`,
~35 s together). The binary build and the bootstrap rounds are a manual step.

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

### The same self-compile on the other targets

Measured with `node bin/output.js -l=<target> ./compiler/ng_Compiler.rgr
-nodecli`, so this is the compiler's own diagnosis, not the target toolchain's:

| Target | Errors | First thing in the way |
| --- | ---: | --- |
| C++ | **0** | — builds and runs, see above |
| Dart | **0** | — `dart analyze` clean, runs, see above |
| Go | **0** | generates ~70k lines; `go build` then reports the three defects below |
| Swift 6 | 12 | |
| Rust | 16 | |
| Kotlin | 19 | |
| Python | 72 | |
| C# | 499 | |

Go reached zero the same way C++ did — `RangerCompilerPlugin` is a systemclass
and named no Go type, so the single error was the plugin loader. What `go
build` finds after that is a shortlist worth having:

- a nested collection type is not converted: `[string:[string]]` comes out as
  `map[string]*[string]`, and the Ranger spelling also reaches a generated
  function name (`r_has_key_string_[string]`);
- a `case` over a **system** union writes the Ranger tag scheme against
  `interface{}`: `item.tag == interface{}_tag_string`.

Neither is specific to the compiler; both are Go writer work, and both are the
kind of thing only a program this size reaches.

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
