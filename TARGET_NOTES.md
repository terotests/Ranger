# Target notes

Capabilities and caveats that are specific to one target language. The
[README](README.md) has the compatibility snapshot; this file has the detail.
Version-by-version changes belong in [CHANGELOG.md](CHANGELOG.md), and known
bugs in [ISSUES.md](ISSUES.md).

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

## Swift 6 (`-l=swift6`)

- Modern Swift 6 compatible code generation
- Simple `main()` entry point (avoids `@main` conflicts with operator overloads)
- Integer-to-string conversion through `String()`
- Array operations using `.append()` instead of `.push()`
- File I/O through the `Foundation` framework
- String operations: `substring`, `indexOf`, `startsWith`, `endsWith`, `contains`, `split`, `trim`
- Optional handling with `unwrap` and `!!`
- Command-line argument access
- CRLF grapheme cluster handling for cross-platform string compatibility

```bash
node bin/output.js myfile.rgr -l=swift6 -o=myfile.swift
sed -i '' $'s/\r$//' myfile.swift  # Fix line endings on macOS
swiftc myfile.swift -o myfile
```

Both `gallery/js_parser` (4500+ lines) and `gallery/invaders` compile and run
on this target.

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
work on both Windows and Unix. See `ai/INSTRUCTIONS.md` for how to write
operators with polyfills.
