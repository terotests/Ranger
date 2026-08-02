# Target notes

Capabilities and caveats that are specific to one target language. The
[README](README.md) has the compatibility snapshot; this file has the detail.
Version-by-version changes belong in [CHANGELOG.md](CHANGELOG.md), and known
bugs in [ISSUES.md](ISSUES.md).

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

See [RUST_ISSUES.md](RUST_ISSUES.md) and [RUST_TODO.md](RUST_TODO.md).

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
