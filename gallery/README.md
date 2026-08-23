# Gallery

The Ranger **application technology stack**: graphics, office formats, editors,
and other large programs written in Ranger. These are not Hello World samples.
They are the engines and reference applications built on the language — EVG,
display lists, DataGrid / XLSX, DOCX, PPTX, PDF, and the rest of the advanced
implementations.

**License: AGPL-3.0-or-later** for Ranger-authored code under this directory,
unless a file or subdirectory says otherwise. See [`LICENSE`](LICENSE) in
this folder and [`../LICENSE-AGPL-3.0`](../LICENSE-AGPL-3.0) for the full
text. Ranger-authored code outside `gallery/` stays MIT unless a file says
otherwise ([`../LICENSE`](../LICENSE)). Third-party files keep their own
licenses.

Several projects need extra toolchains, platform-specific commands, or manual
setup. The main [README](../README.md) stays focused on the language and the
compiler — the long-form writeups live here.

| Project | What it is |
| --- | --- |
| [`js_parser`](js_parser/README.md) | JavaScript ES6+ lexer, parser and pretty-printer written in Ranger, with a benchmark suite |
| [`ts_parser`](ts_parser/README.md) | TypeScript/TSX parser used by the EVG ComponentEngine |
| [`pdf_writer`](pdf_writer/README.md) | EVG document tooling: TSX documents, live preview server, HTML and PDF output |
| [`invaders`](invaders/) | Terminal Space Invaders compiled to several targets, including the experimental LLVM backend |
| [`game_engine`](game_engine/README.md) | Retained-mode game runner, SDL launcher, and TSX games (Pong, Breakout, Invaders, Pac-Man); scripting is documented in [`docs/GAME_SCRIPTING.md`](game_engine/docs/GAME_SCRIPTING.md) |
| [`ranger_engine`](ranger_engine/README.md) | An engine that runs **Ranger** source directly: bytecode VM plus a JIT tier that compiles hot functions to host code |
| [`vela`](vela/README.md) | Vega-compatible visualization runtime: a Vega spec in, a scene out, checked against official Vega |
| [`text_editor`](text_editor/README.md) | EVG/SoftCanvas multiline text-editor prototype (canvas-editor benchmark target), JS validation + bench |
| [`book`](book/README.md) | Visual book composition engine **and editor**: stories, linked text frames, master pages, auto layout, preflight, PDF through the EVG tooling — and a spread editor that runs in the browser on WebGL with no server |
| [`pptx`](pptx/README.md) | PPTX Lite reader/viewer: OPC ZIP → PptxModel → theme resolve → EVG display list |
| [`pptx/android`](pptx/android/README.md) | The same PPTX viewer as an **Android app**: Ranger → Kotlin → `android.graphics`, plus a Java2D twin of the painter so the port can be checked without a device |
| [`docx_viewer`](docx_viewer/README.md) | DOCX viewer + editing MVP: WordprocessingML → RichDocument → paginated layout → EVG; Word-style keyboard, multi-paragraph selection, and pastes a spreadsheet selection as a table |
| [`rangerflow`](rangerflow/README.md) | React Flow-shaped interactive graph editor on EVG + WebGL, with a database ERD / UML class editor on top and PDF export |
| [`datagrid`](datagrid/README.md) | EVG DataGrid / Excel-style spreadsheet viewer **and editor** (virtualized layout engine → display list → WebGL) |
| [`rangerdbviewer`](rangerdbviewer/README.md) | A database workbench: open SQLite / DuckDB / RangerDB, introspect the real schema, browse it, draw it in RangerFlow and export it |
| [`rangerdb`](rangerdb/README.md) | A database API with three engines behind it — a columnar engine written in Ranger, plus SQLite and DuckDB adapters — feeding the DataGrid |
| [`rangersql`](rangersql/README.md) | SQL parser, generator and dialect transpiler, checked against SQLGlot's own identity corpus — and RangerDB's SQL front end |
| [`process_counter_board`](process_counter_board/README.md) | Vite + React host for `@process` classes |
| `process_counter_ios`, `process_counter_android` | Native hosts for the same `@process` demo |
| [`ooxml`](ooxml/README.md) | What the three OOXML editors share: one OPC package reader (parts, content types, relationships) and the XML text rules — plus the roadmap for what moves there next |
| [`office`](office/README.md) | The rest of what they share: which font face draws a run, offset↔x measurement, a style property that knows it was not stated, and the DrawingML theme palette |
| `evg`, `evg_video`, `watch_evg`, `zip`, `ts_to_ranger` | Smaller experiments |

---

## JavaScript ES6+ Parser

A JavaScript ES6+ parser written entirely in Ranger, demonstrating the
language's capability to build complex tools. It includes a full lexer, a
recursive descent parser, and a pretty-printer.

- **Full ES6+ support** — classes, arrow functions, async/await, generators, destructuring, spread operators, template literals
- **Pretty-printer** — parses JavaScript and outputs formatted code
- **Comment preservation** — line comments, block comments and JSDoc are attached to AST nodes
- **Multi-target** — the parser compiles to JavaScript, Swift, Go, Python and others

**Quick start (JavaScript):**

```bash
# Compile the parser
node bin/output.js gallery/js_parser/js_parser_main.rgr -o=js_parser.js -d=gallery/js_parser

# Parse and pretty-print a JavaScript file
node gallery/js_parser/js_parser.js -i input.js -o output.js

# Show AST structure
node gallery/js_parser/js_parser.js -i input.js --ast
```

**Quick start (Swift):**

```bash
# Compile to Swift (from gallery/js_parser directory)
cd gallery/js_parser
node ../../bin/output.js js_parser_main.rgr -l=swift6 -o js_parser.swift

# Fix line endings and compile
sed -i '' $'s/\r$//' bin/js_parser_main.swift
swiftc -o js_parser_swift bin/js_parser_main.swift

# Run the native Swift binary
./js_parser_swift -i input.js --ast
./js_parser_swift -d
```

**Quick start (C++ on Windows via WSL):**

```bash
# Compile to C++ (from Ranger root)
node bin/output.js gallery/js_parser/js_parser_main.rgr -l=cpp -d=gallery/js_parser -o=js_parser.cpp

# Cross-compile from WSL to Windows
wsl -d Ubuntu -- bash -c "
  cd /mnt/c/path/to/Ranger/gallery/js_parser && \
  sed -i 's/\r$//' js_parser.cpp && \
  x86_64-w64-mingw32-g++-posix -std=c++17 -static -o js_parser_cpp.exe js_parser.cpp
"

# Run the native Windows binary
./js_parser_cpp.exe -i input.js --ast
./js_parser_cpp.exe -d
```

**Supported ES6+ features:**

| Category     | Features                                                               |
| ------------ | ---------------------------------------------------------------------- |
| Declarations | `let`, `const`, `var`, function declarations/expressions               |
| Classes      | `class`, `extends`, `constructor`, `static`, getters, `super`          |
| Functions    | Arrow functions (`=>`), async/await, generators (`function*`, `yield`) |
| Operators    | Spread (`...`), rest parameters, destructuring (array/object)          |
| Literals     | Template literals with interpolation, computed property names          |
| Control Flow | `for-of`, `for-in`, `while`, `if/else`, `switch`, `try/catch`          |

**Performance benchmark.** The parser was benchmarked against popular
JavaScript parsers, all running in-process with warm-up:

| Rank   | Parser               | Large (17KB) | XL (35KB)   |
| ------ | -------------------- | ------------ | ----------- |
| #1     | meriyah              | 0.51 ms      | 0.84 ms     |
| **#2** | **Ranger js_parser** | **0.88 ms**  | **1.39 ms** |
| #3     | acorn                | 1.41 ms      | 2.70 ms     |
| #4     | esprima              | 1.41 ms      | 2.33 ms     |
| #5     | espree (ESLint)      | 1.58 ms      | 3.47 ms     |
| #6     | @babel/parser        | 2.63 ms      | 3.06 ms     |

```bash
# Run the benchmark yourself
cd gallery/js_parser/benchmark
npm install
npm run benchmark:large
```

See [js_parser/benchmark](js_parser/benchmark) for the full suite and
[js_parser/README.md](js_parser/README.md) for complete documentation.

---

## Space Invaders

A terminal-based Space Invaders game. The same source compiles to several
targets:

| Target         | Output              | Build Command               |
| -------------- | ------------------- | --------------------------- |
| ES6/JavaScript | `invaders.js`       | `npm run game:compile`      |
| **LLVM native**| `tmp/invaders-native/invaders` | `npm run game:build:llvm` |
| Rust           | `invaders_rust.exe` | `npm run game:build:rust`   |
| Go             | `invaders_go.exe`   | `npm run game:build:go`     |
| Kotlin         | `invaders.jar`      | `npm run game:build:kotlin` |
| C++            | `invaders_cpp.exe`  | Cross-compile via WSL       |
| Swift          | `invaders_swift`    | macOS/Linux only            |

> **Note:** the Kotlin target renders correctly, but keyboard input has issues
> on Windows (it uses a PowerShell subprocess for key reading, which is slow).

```bash
# Build all targets at once
npm run game:build:all

# Run the game
npm run game:run        # JavaScript
npm run game:run:rust   # Rust
npm run game:run:go     # Go
./tmp/invaders-native/invaders   # LLVM native (after game:build:llvm)
```

### Experimental LLVM backend

Ranger can lower the same `invaders.rgr` through a **Low IR → LLVM IR**
pipeline (`-l=llvm`), then link with `clang` and a small C runtime
(`runtime/ranger_term.c`) for terminal I/O.

```bash
npm run compile              # refresh bin/output.js after compiler changes
npm run game:build:llvm      # invaders.rgr → tmp/invaders-native/invaders.ll → native binary
npm run test:llvm            # LLVM/WASM fixture tests (vitest)
npm run demo:wasm            # smaller freestanding WASM demo (tests/fixtures/llvm_wasm_demo.rgr)
```

**Checked-in sample:** [`invaders/llvm/invaders.ll`](invaders/llvm/invaders.ll)
is LLVM IR kept in the repo so you can inspect codegen without building.
Regenerate it with `cp tmp/invaders-native/invaders.ll gallery/invaders/llvm/invaders.ll`
after `game:build:llvm` (see [`invaders/llvm/README.md`](invaders/llvm/README.md)).

Status: experimental — libc-linked native builds are the most reliable path.
The freestanding WAT/WASM path (`-wasmrc`) now has a reference-counting runtime
(free-list heap with `memory.grow`, typedesc-driven recursive object
destruction), classes with reference-counted fields, singletons, strings,
`[T]`/`[K:V]` collections, and lambdas/closures (function table plus
`call_indirect`, with value/object capture and mutation); the
`game_engine/games/ranger_autopeli` guest is authored in Ranger and compiles to
WASM this way. Terminal-import lowering for the full Space Invaders game is
still incomplete. Smaller freestanding demos run under `npm run demo:wasm`.

### Cross-compiling the game

**JavaScript (ES6)**

```bash
npm run game:compile        # Generates invaders.js
node gallery/invaders/invaders.js
```

**Rust**

```bash
npm run game:compile:rust   # Generates invaders.rs
cd gallery/invaders && rustc invaders.rs -o invaders_rust.exe
# Or use the combined command:
npm run game:build:rust
```

**Go**

```bash
npm run game:compile:go     # Generates invaders.go
cd gallery/invaders && go build -o invaders_go.exe invaders.go
# Or use the combined command:
npm run game:build:go
```

**C++ (Windows via WSL)**

C++ compilation requires POSIX-threaded MinGW for `std::thread` and
`std::mutex` support:

```bash
npm run game:compile:cpp    # Generates invaders.cpp

# Cross-compile from WSL to Windows:
wsl -d Ubuntu -- bash -c "
  cd /mnt/c/path/to/Ranger/gallery/invaders && \
  sed -i 's/\r$//' invaders.cpp && \
  x86_64-w64-mingw32-g++-posix -std=c++17 -static -pthread invaders.cpp -o invaders_cpp.exe
"
```

> **Note:** the standard MinGW compiler (`x86_64-w64-mingw32-g++`) uses win32
> threads, which do not support `<mutex>` and `<thread>`. You must use the
> POSIX variant (`g++-posix`).

**Swift (macOS/Linux only)**

```bash
npm run game:compile:swift  # Generates invaders.swift
swiftc invaders.swift -o invaders_swift
```

**LLVM native (macOS / Linux, experimental)**

```bash
npm run game:build:llvm
./tmp/invaders-native/invaders
```

Requires `clang` on `PATH`. On macOS the script picks `arm64-apple-macos` or
`x86_64-apple-macos` automatically.

### Platform-specific keyboard input

The game uses `on_keypress` and `poll_keypress` operators with
platform-specific implementations, plus terminal control operators
(`clear_screen`, `move_cursor`, `hide_cursor` and others):

| Platform | Windows                           | Unix/Linux/macOS           |
| -------- | --------------------------------- | -------------------------- |
| Rust     | `windows-sys` crate               | `termios` + `libc`         |
| Go       | `msvcrt.dll` (`_kbhit`, `_getch`) | `stty` + `os.Stdin`        |
| C++      | `<conio.h>` (`_kbhit`, `_getch`)  | `<termios.h>` + `read()`   |
| Swift    | `_kbhit` / `_getch` via C interop | `Darwin` / `Glibc` termios |

### Target comparison: code size and executable size

The game is a useful comparison of how the same Ranger source translates to
different targets.

**Source code sizes:**

| Target     | Generated File   | Size (bytes) | Lines | Notes                           |
| ---------- | ---------------- | ------------ | ----- | ------------------------------- |
| **Ranger** | `invaders.rgr`   | 11,289       | ~400  | Original source                 |
| **LLVM IR**| `llvm/invaders.ll` | ~60,000    | ~1,700 | Low-level IR (sample in repo)   |
| Python     | `invaders.py`    | 9,271        | ~330  | Most compact generated code     |
| JavaScript | `invaders.js`    | 10,301       | ~350  | Clean, readable output          |
| Swift      | `invaders.swift` | 12,554       | ~470  | Verbose type annotations        |
| Go         | `invaders.go`    | 13,701       | ~480  | Explicit error handling         |
| C++        | `invaders.cpp`   | 14,148       | ~500  | Headers and type declarations   |
| Rust       | `invaders.rs`    | 17,918       | ~600  | Most verbose (ownership, types) |

**Executable sizes (native binaries):**

| Target | Executable           | Size   | Notes                             |
| ------ | -------------------- | ------ | --------------------------------- |
| **LLVM** | `tmp/invaders-native/invaders` | ~34 KB (arm64 macOS) | Smallest in recent local builds; libc + minimal runtime |
| Swift  | `invaders_swift.exe` | 76 KB  | Dynamic link to system libraries  |
| Rust   | `invaders_rust.exe`  | 291 KB | Optimized, statically linked      |
| Go     | `invaders_go.exe`    | 2.3 MB | Includes Go runtime               |
| C++    | `invaders_cpp.exe`   | 3.0 MB | Static linking with MinGW/pthread |

- **Python** generates the most compact code thanks to its concise syntax (no type annotations, no braces)
- **Rust** generates the most verbose code because of explicit ownership (`clone()`, `&mut`), type annotations and safety features
- **Swift** produces the smallest conventional native executable because it links dynamically to system libraries
- **Go** and **C++** have large executables because their runtimes are linked statically
- **JavaScript** runs on Node.js, so there is no standalone executable

**Known issues:** console rendering may have timing artifacts on some
terminals, and the Swift target requires macOS or Linux.

---

## EVG document tooling (`pdf_writer`)

Tools for creating and previewing documents with a React-like TSX syntax. The
EVG (Extensible Vector Graphics) system supports multi-page documents with
flexbox layout.

**Live preview server:**

```bash
# Build the preview server (one-time)
npm run evgpreview:build

# Start live preview with auto-reload
cd gallery/pdf_writer
./bin/evg_preview_server examples/test_gallery.tsx 3006

# Open http://localhost:3006 - auto-refreshes on file save!
```

**HTML generation:**

```bash
# Build the HTML tool (one-time)
npm run evg:tool:build:go

# Convert TSX to HTML
cd gallery/pdf_writer
./bin/evg_tool examples/test_gallery.tsx output.html

# With component imports
./bin/evg_tool document.tsx --assets=../components;../assets
```

Features: live reload, reusable TSX component imports, multi-page documents
(`Print`, `Section`, `Page`), flexbox layout, and image and font assets served
from configurable paths. See [pdf_writer/README.md](pdf_writer/README.md) for
the full TSX syntax reference.

### ComponentEngine TypeScript evaluation

The EVG ComponentEngine evaluates TypeScript control flow, so functions defined
in TSX files can use loops, array operations, and return arrays of elements.

| Feature | Syntax | Description |
|---------|--------|-------------|
| For loops | `for (let i = 0; i < n; i++)` | Standard for loop with init/test/update |
| Decrement loops | `for (let i = 5; i > 0; i--)` | Countdown loops |
| Step loops | `for (let i = 0; i < n; i += 2)` | Custom step increments |
| Array.push | `arr.push(<Element />)` | Build arrays of JSX elements |
| Array indexing | `colors[i]` | Access array elements by index |
| Compound assignment | `total += value` | `+=`, `-=`, `*=`, `/=`, `%=` operators |
| Update expressions | `i++`, `++i`, `i--`, `--i` | Pre/post increment/decrement |
| Function calls in JSX | `{buildItems()}` | Call functions that return element arrays |

```tsx
const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

function buildColorBoxes() {
  const boxes: any[] = [];

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    boxes.push(
      <View backgroundColor={color} padding={8}>
        <Label color="#ffffff">Box {i + 1}: {color}</Label>
      </View>
    );
  }

  return boxes;
}
```

See `pdf_writer/examples/test_for_loop.tsx` for a complete demonstration.

---

## TypeScript parser (`ts_parser`)

The TSParser backs the EVG ComponentEngine. Beyond the base TypeScript syntax
it supports:

- **UpdateExpression** — `i++`, `++i`, `i--`, `--i` with correct prefix/postfix semantics
- **Compound assignment** — `+=`, `-=`, `*=`, `/=`, `%=`
- **Computed member access** — array indexing `arr[i]` sets the `computed` flag

See [ts_parser/README.md](ts_parser/README.md) and
[ts_parser/COMPLIANCE.md](ts_parser/COMPLIANCE.md).
