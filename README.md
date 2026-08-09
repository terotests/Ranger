# Ranger cross language compiler

**Version 3.3.0** | Status: `experimental`

Ranger is a self-hosting cross-language compiler for writing portable algorithms, parsers, generators, and small tools once and compiling them to multiple target languages.

It includes a compact typed language with classes, inheritance, traits, lambdas, type inference, extension methods, custom operators, and host integration through system classes.

Ranger is best approached today as a compiler and language lab with practical multi-target output, not as a polished general-purpose language ecosystem.

## What Ranger Is Good At

- Writing one algorithm or tool and emitting several target languages from the same source
- Building parsers, analyzers, generators, and DSL-like tooling with a small runtime surface
- Experimenting with language design, operator templates, and code generation strategies
- Studying a self-hosting compiler that is actively used to compile itself

## Word of Warning

- Ranger is still `experimental`, which means: be ready to fix bugs or add new capabilities when needed
- Target quality varies by language and by feature area
- The compiler is self-hosting, but the official and best-supported host is Node.js
- Not every example in this repository works fully out of the box on every machine
- Several examples in `gallery/` are research or showcase projects and may require extra toolchains, platform-specific commands, or manual setup

If you want one sentence of positioning: Ranger is currently more convincing as a portable algorithm compiler / DSL toolchain than as a drop-in replacement for mainstream application languages.

## `@process` runtime (experimental)

Ranger can mark classes with `@process` to get a **small object runtime** in generated code (especially JavaScript/TypeScript): parent/child tree, instance registry, `proc_start` / `proc_stop`, and UI refresh via `markStateDirty()`.

| Piece | What it does |
| --- | --- |
| `@process` / `@process(true)` | Process instance with lifecycle hooks (`start`, `stop`, …) |
| `proc_start` / `proc_stop` | Activate or tear down a process subtree (children first) |
| `proc_send target handler arg…` | Typed message dispatch to `fn on…` handlers on a live instance |
| `ProcessNameRegistry.findProcess(path)` | Lookup by `@name("app.foo")` (TypeScript path literals when using `-typescript`) |
| `markStateDirty()` | Bump generation + notify host (`ProcessUiHost`) for UI binding |
| `beginSuppressUiNotify` / `endSuppressUiNotify` | Batch parent↔child sync without notify storms |

**Typical app shape:** domain logic and UI flags live in `@process` classes; **view DTOs** are plain Ranger classes filled by a builder; React/CLI/native hosts subscribe to `ProcessUiHost` and call `findProcess` — I/O and async work stay in the host (Node, Swift, …), not inside the process bytecode.

```ranger
class CounterPage @process @name("app.counter") extends RangerProcessBase {
  def count:int 0
  fn onUiIncrement:void () {
    count = count + 1
    this.markStateDirty()
  }
}
```

```typescript
// Host (TypeScript): wire notify once, then bind UI to process fields
const host = ProcessUiHost.__singleton();
host.notifyPath = (path) => { /* sync view model + re-render */ };
```

**Docs:** [PROCESS_MVP.md](PROCESS_MVP.md) (scope), [PROCESS_STATUS.md](PROCESS_STATUS.md) (compiler checklist), [PROCESS_RUNTIME_INVARIANTS.md](PROCESS_RUNTIME_INVARIANTS.md) (dispatch turn / one notify), [PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md) (notify batching), [PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md) (view DTO assignment). **Gallery:** [process_counter_board](gallery/process_counter_board/README.md) (Vite + React host for `@process`).

## Where To Start

- [Documentation site](https://terotests.github.io/Ranger/docs/) — install, first program, types, optionals, and the **generated operator reference** (838 operators, compiled from the sources of the commit that publishes the site, so it cannot drift)
- [Online playground](https://terotests.github.io/Ranger/) — try Ranger in the browser (`playground/`, Vite + current compiler)
- `README.md` - language overview, installation, and syntax notes
- [`gallery/README.md`](gallery/README.md) - index of the larger examples: parsers, EVG/TSX document tooling, games, and `@process` host apps
- [`TARGET_NOTES.md`](TARGET_NOTES.md) - what each target language supports and where it falls short
- [`CHANGELOG.md`](CHANGELOG.md) - version history
- [`AGENTS.md`](AGENTS.md) — git/PR rules and Ranger gotchas for AI agents; links the [FAQ](https://terotests.github.io/Ranger/docs/faq/)
- `ai/` — short offline notes for assistants (`README.md`, `QUICKREF.md`, `GRAMMAR.md`, `INTROSPECTION.md`); prefer the docs site when online

## Targets and compatibility

The compiler is _self hosting_: it is written in Ranger and compiled by itself,
so it can run on several platforms. Node.js is the official host, because
external plugins are only available as npm packages.

**Primary targets** — exercised by the test suite and large gallery programs:
`JavaScript` / `TypeScript` (ES2015), `Go`, `Python` (3.x), `Kotlin`, `C#`
(Mono `mcs` in CI; modern .NET also fine), `Rust`, `Dart`, `Swift` (3 and 6),
and `C++` (C++14).

The TypeScript/ES5 interpreter in `gallery/game_engine/v2/interp` is the largest
cross-target gate: Go, Kotlin, Python, C#, Dart and Swift 6 each compile, and
where the toolchain is on `PATH` they build and answer the Node benchmark cases
(`npm run test:tsengine`). Dart also keeps the `gallery/ts_parser` golden
(AST identical to the JS `-d` demo). Details:
[`TS_ENGINE_PERF.md`](TS_ENGINE_PERF.md), [`TARGET_NOTES.md`](TARGET_NOTES.md).

**Thinner CI** — `PHP`, `Java 7` and `Scala` still have operator templates and
appear in the syntax-app matrix, but they are not on the large-engine golden
path. Treat them as usable with more gaps.

Older language versions can be supported by writing custom operators that target
a compiler flag. Support is uneven:

| Area | Current expectation |
| --- | --- |
| Host/runtime | Node.js is the primary supported host for the compiler |
| Self-hosting | Actively used, but full compiler generation quality is strongest in JavaScript |
| JavaScript / ES6 | Best baseline target and most reliable place to start |
| Go / Python / Kotlin / C# / Rust / C++ | Large programs verified (TS engine and/or jpeg / parsers); expect remaining edge cases |
| Dart / Swift | Strong for substantial modules (ts_parser; TS engine builds and matches Node on both when toolchains are present); Flutter packages via `-l=dart -pubspec` |
| PHP / Java / Scala | Templates + syntax-app coverage; fewer end-to-end goldens |
| **LLVM / WASM** (`-l=llvm`) | **Experimental.** Lowers to LLVM IR; optional WAT export for freestanding WASM. Native libc builds work for demos like Space Invaders; browser WASM is still rough. Another codegen path from the same sources, not a separate surface language. See `npm run test:llvm`, `npm run game:build:llvm`. |
| Gallery examples | Good for understanding direction and capability, but some require manual setup or platform-specific tooling |

**Targets are not equally demanding of the source.** A target with a garbage
collector — JavaScript, Go, Python, Kotlin, Dart, Java, C# — takes almost any Ranger
source as written. A target without one — C++, Rust, and Swift's reference
counting — needs the ownership annotations (`@(weak)`, `@(strong)`, `@(lives)`,
`@(temp)`, see [Annotations](#annotations)) wherever the object graph has a
cycle or a non-owning reference. Code that runs on ES6 can therefore still fail
to build, or leak, on C++ or Rust until those annotations are added. Write for
the strictest target you intend to support, not for JavaScript.

[Target languages](https://terotests.github.io/Ranger/docs/targets/overview/)
documents what each target writes and the semantic differences a portable
program has to know.

### Conformance suite (Track 1)

Cross-target semantic fixtures live in `tests/conformance/`. Run `npx vitest run tests/compiler-conformance.test.ts`.
Regenerate the fixture list with `node scripts/generate-conformance-table.mjs`.

<!-- BEGIN CONFORMANCE_TABLE -->
| Fixture | Topic | Targets |
| --- | --- | --- |
| `array_param_mutate` | array parameters use reference semantics (Issue #58; Go known gap) | ES6, Go, Kotlin, Dart (when toolchain present) |
| `clear_then_push` | clear resets slice without nil, push refills (Issue #59) | ES6, Go, Kotlin, Dart (when toolchain present) |
| `int_division_to_double` | Conformance: integer division promoted to double (Issue #4) | ES6, Go, Kotlin, Dart (when toolchain present) |
| `lf_line_endings` | LF-only source (Issue #12 class must not break operator spacing) | ES6, Go, Kotlin, Dart (when toolchain present) |
| `math_ops` | Conformance: arithmetic and comparisons | ES6, Go, Kotlin, Dart (when toolchain present) |
| `string_codepoint_index` | Conformance: Unicode code-point string indexing (Issue #57) | ES6, Go, Kotlin, Dart (when toolchain present) |
| `while_loop` | Conformance: while loop control flow | ES6, Go, Kotlin, Dart (when toolchain present) |
<!-- END CONFORMANCE_TABLE -->

## Quick start

Source files use the `.rgr` extension (`.clj` is the legacy extension and still
works) and the CLI is `rgrc`:

```bash
# Install globally
npm install -g ranger-compiler

# Compile to JavaScript
rgrc -l=es6 myfile.rgr -o=output.js

# Compile to TypeScript
rgrc -l=es6 -typescript myfile.rgr -o=output.ts

# Compile to Python
rgrc -l=python myfile.rgr -o=output.py
```

See [CHANGELOG.md](CHANGELOG.md) for the version history.

---

## Common pitfalls

The things people hit first, in the order they usually hit them.

**Ranger is still a Lisp.** It reads like a braces-and-newlines language, but
that surface is a set of shortcuts for S-expressions — the expressions are
still there underneath. When something does not parse or does not type-check,
the fix is almost always a pair of parentheses.

**Negation needs the parentheses.** `!` is an operator like any other, so it
takes its argument in prefix form:

```
if (! this.flag) { }     ; correct
if !this.flag { }        ; FAIL: Could not match argument types for if
```

Because the bare form does not compile, people fall back to
`if (this.flag == false)`. That works, but it is not needed — `(! this.flag)`
is the direct form.

**Singletons are an annotation, not a pattern you write by hand.** Mark the
class and call the generated accessor:

```
class Config @singleton(true) {
    def path:string "/etc/app"
}

def c (Config.__singleton())
```

**Optionals have to be wrapped and unwrapped.** Any variable declared without a
value is optional, and several operators — `get` on a hash above all — always
return one. Reading the value takes `unwrap` / `!!`, or `??` for a default;
`wrap` makes an optional out of a plain value. Forgetting this shows up as a
type error between `T` and `<optional>T`. See
[Optional variables](#optional-variables).

**Extending the language does not mean recompiling the compiler.**
`compiler/Lang.rgr` is read at compile time, not baked into `bin/output.js`.
Add or change an operator template there, and the very next compile uses it —
no `npm run compile` in between. The compiler looks for `Lang.rgr` in the
working directory first, so a copy beside your sources overrides the installed
one, which makes an experiment cheap to try and cheap to throw away.

## Gallery and demos

The `gallery/` folder holds the larger examples: parsers, EVG/TSX document
tooling, games, and `@process` host apps. They show what the compiler can do,
but they are research and showcase projects — some need extra toolchains or
platform-specific setup. [gallery/README.md](gallery/README.md) indexes them
and holds the writeups (build commands, benchmarks, target comparisons); each
project also has its own README.

## Target-specific notes

Swift 6, Rust, the C++ static analysis optimizer, HTTP servers on the Go
target, and the operator polyfill system are documented in
[TARGET_NOTES.md](TARGET_NOTES.md).

## Testing

```bash
npm test                  # Run all tests
npm run test:es6          # JavaScript/ES6 tests only
npm run test:python       # Python target tests
npm run test:dart         # Dart target tests (requires Dart SDK)
npm run test:go           # Go target tests
npm run test:rust         # Rust target tests
npm run test:syntaxapp    # The syntax app on every target
```

ES6/JavaScript has full runtime coverage; Python and Go have compilation and
runtime tests; Rust has compilation tests, with runtime tests in progress.

### Syntax app (every target, measured)

[`tests/syntax_app/`](tests/syntax_app/README.md) is one program that uses 203
of the 207 core operator names of `compiler/Lang.rgr` together with classes,
inheritance, traits, records, enums, extensions, lambdas, optionals, buffers,
custom operators and the collection methods of `lib/stdlib.rgr`.
`npm run test:syntaxapp` compiles it — and each of its sections on its own — to
all fifteen targets the CLI accepts, then builds and runs the output with
`node`, `tsc`, `go`, `python3`, `rustc`, `g++`, `javac`, `php` and `lli`,
whichever of them the machine has, and compares what each one printed with the
output of the reference target.

The result is a matrix that the test asserts against a checked-in baseline, so
a target getting worse **and** a target getting better both fail until the
record is updated (`npm run test:syntaxapp:update`). The current measurement is
in [`tests/syntax_app/TARGET_REPORT.md`](tests/syntax_app/TARGET_REPORT.md) and
what does not work at all is in
[`tests/syntax_app/known_gaps.md`](tests/syntax_app/known_gaps.md).

## The JavaScript engine, built and measured

`gallery/game_engine/v2/interp` is a JavaScript interpreter written in Ranger —
so it compiles to every target the compiler has. Four commands build it and
measure it, and each skips any target whose toolchain is not installed.

```bash
npm run jsengine:build         # es6 module + cpp and rust binaries
npm run jsengine:bench         # against Node, and QuickJS if `qjs` is on PATH
npm run jsengine:conformance   # 1303 JS probes, answers checked against Node
npm run jsengine:all           # all three in order
```

`jsengine:build` needs `g++` for the C++ target and `rustc` for the Rust one;
without them it still writes the generated source and says which it skipped.
`jsengine:bench` reports one table across every engine that got built:

```
case           node       qjs       es6       cpp      rust   vs node   ok
loop          0.031     0.530     2.574     1.574     2.229    51.4x   OK
fib           0.134     0.690     7.079     6.380     6.262    46.9x   OK
...
against QuickJS (lower is better, 1.0x would be parity):
  es6    4.0x   (6.2x excluding strcat)
  cpp    2.9x   (4.7x excluding strcat)
  rust   3.1x   (5.0x excluding strcat)
```

Two things about that table are worth knowing before quoting it. **Every row is
checked against Node's answer** and the command exits non-zero if any engine
disagrees — a fast wrong answer is not a result. And **the strcat row flatters
us**: QuickJS 2021-03-27 has no string ropes, so its `s += "ab"` is quadratic.
Quote the excluding-strcat number. [`QUICKJS_COMPARISON.md`](QUICKJS_COMPARISON.md)
has the measurement methodology and a source-level comparison of what the two
engines do differently.

For the engine's own test coverage:

```bash
npm run jsengine:test          # the runtime-conformance suite, in-process
npm run jsengine:test:targets  # the engine compiled to every other target
```

## Known issues

`toString` as a method name crashes the compiler (use `getSymbol` or a similar
name), the Go target has integer division type conversion issues, and the
Python target has inheritance constructor argument issues. See
[ISSUES.md](ISSUES.md) for the full list and status.

## AI documentation

Language questions for humans and agents belong on the
[documentation site](https://terotests.github.io/Ranger/docs/), especially the
[FAQ](https://terotests.github.io/Ranger/docs/faq/). Repo-local agent notes:

- [`AGENTS.md`](AGENTS.md) — git/PR workflow and syntax gotchas
- [`ai/README.md`](ai/README.md) — index of what remains under `ai/`
- [`ai/QUICKREF.md`](ai/QUICKREF.md) — offline syntax card
- [`ai/GRAMMAR.md`](ai/GRAMMAR.md) — simplified BNF and operator-template notation
- [`ai/INTROSPECTION.md`](ai/INTROSPECTION.md) — compiler introspection API (type at
  line/column, class shape) for IDE hover, autocomplete, and type-safe generation

The long `ai/INSTRUCTIONS.md` / `ai/EXAMPLES.md` guides were removed; they
duplicated the docs site and had drifted (`.clj` paths, obsolete operators).

## Installing the compiler

Install the compiler from npm:

```
 npm install -g ranger-compiler
```

Running `ranger-compiler` without arguments shows available command-line options:

```
Ranger Compiler v3.0.1

Usage: rgrc <file> [options] [flags]
Options: -<option>=<value>
    -l=<value>             Selected language, one of es6, go, scala, java7, swift3, swift6, kotlin, cpp, php, csharp, python, rust
  -d=<value>             output directory, default directory is "bin/"
  -o=<value>             output file, default is "output.<language>"
  -classdoc=<value>      write class documentation .md file
  -operatordoc=<value>   write operator documention into .md file
Flags: -<flag>
  -forever       Leave the main program into eternal loop (Go, Swift)
  -allowti       Allow type inference at target lang (creates slightly smaller code)
  -plugins-only  ignore built-in language output and use only plugins
  -plugins       (node compiler only) run specified npm plugins -plugins="plugin1,plugin2"
  -strict        Strict mode. Do not allow automatic unwrapping of optionals outside of try blocks.
  -typescript    Writes JavaScript code with TypeScript annotations
  -npm           Write the package.json to the output directory
  -nodecli       Insert node.js command line header #!/usr/bin/env node to the beginning of the JavaScript file
  -nodemodule    Export classes as CommonJS modules using module.exports (disables static main function)
  -esm           Export classes as ES6/ESM modules using export keyword (disables static main function)
  -sourcemap     Emit .js.map / .ts.map with embedded .rgr sourcesContent (ES6/TypeScript only)
  -client        the code is ment to be run in the client environment
  -scalafiddle   scalafiddle.io compatible output
  -compiler      recompile the compiler
  -copysrc       copy all the source codes into the target directory
Pragmas: (inside the source code files)
   @noinfix(true)   disable operator infix parsing and automatic type definition checking
```

### JavaScript Module Formats

The compiler supports three JavaScript module output formats:

| Flag          | Format   | Output                    | Use Case                         |
| ------------- | -------- | ------------------------- | -------------------------------- |
| (none)        | Plain JS | No exports, runs `main()` | Standalone scripts               |
| `-nodemodule` | CommonJS | `module.exports.X = X;`   | Node.js require()                |
| `-esm`        | ES6/ESM  | `export class X`          | Modern ES modules, import/export |

**Examples:**

```bash
# Standalone JavaScript (runs main function)
node bin/output.js -es6 myfile.rgr -o=myfile.js

# CommonJS module (.cjs)
node bin/output.js -es6 -nodemodule myfile.rgr -o=myfile.cjs

# ES6/ESM module (.mjs)
node bin/output.js -es6 -esm myfile.rgr -o=myfile.mjs
```

**File Extensions:**
The compiler automatically detects JavaScript-related extensions (`.js`, `.ts`, `.mjs`, `.cjs`) and won't double-add them. You can safely specify the full filename with extension.

### JavaScript / TypeScript source maps (`-sourcemap`)

Use `-sourcemap` with `-es6` or `-typescript` to emit a sibling `.js.map` / `.ts.map` file and append `//# sourceMappingURL=…` to the generated output. Kotlin, Swift, and other non-JS targets ignore this flag.

**What you get**

| Output | Purpose |
| --- | --- |
| `output.js.map` | Source map v3 (VLQ `mappings`, `names`, `sources`) |
| `sourcesContent` | Full `.rgr` source embedded in the map — Chrome DevTools can open `.rgr` files without a separate file server |
| Statement + expression mappings | `LiveCompiler.WalkNode` walk context plus `outMapped()` on identifiers, calls, literals |

**Compile example**

```bash
# Standalone ES module + map
node bin/output.js -es6 -esm -nodemodule -sourcemap ./myapp/App.rgr -o=app.js

# Result: bin/app.js and bin/app.js.map
```

**Debug in Chrome / Edge**

1. Serve the generated `.js` (and `.map` beside it). Vite/webpack are optional when `sourcesContent` is embedded.
2. Open DevTools → **Sources**. Original `.rgr` files appear under the map tree (from `sourcesContent`).
3. Set breakpoints on **executable** lines (e.g. `def`, `if`, `return`) — not only blank lines or signatures.
4. Breakpoints must be **solid red**. A hollow/grey breakpoint means no mapping for that line; rebuild with `-sourcemap` and hard-refresh (disable cache).

**Tests**

```bash
npm run compile
npx vitest run tests/compiler-sourcemap.test.ts
```

**Implementation notes** (for compiler hackers)

- `compiler/ng_SourceMap.rgr` — `SourceMapBuilder`, VLQ encoder, `addMappingFromNode()` uses `node.getLine()` + `node.code.getColumn(sp)` (not stale `node.row`).
- `compiler/ng_writer.rgr` — `lineNumber` / `columnNumber` on emit, `walkNodeStack`, `outMapped()`, `.map` write in `CodeFileSystem.saveTo`.
- Flag: `compiler/ng_Compiler.rgr` → `flag sourcemap`; enabled in `VirtualCompiler.rgr` via `fileSystem.enableSourceMaps()`.

## Getting started with Hello World

Create file `hello.rgr`

```
class Hello {
    sfn m@(main):void () {
        print "Hello World"
    }
}
```

```
ranger-compiler hello.rgr            ; writes bin/output.js
ranger-compiler hello.rgr -o=hello.js
```

[The first program](https://terotests.github.io/Ranger/docs/start/first-program/)
walks through the same program and shows the output the compiler writes for Go,
Python and Rust.

## Compiling using TypeScript

The compiler can be used from TypeScript, which makes possible to create new versions of the
compiler just using TypeScript.

Note: the example requires `Lang`, `stdlib`, `stdops`, and `JSON` to be loaded for the compiler. In this example they are loaded from the filesystem using `readFileSync`.

```typescript
// Notice this part of example is required:
addFile("Lang.rgr", fs.readFileSync("./libs/Lang.rgr", "utf8"));
addFile("stdlib.rgr", fs.readFileSync("./libs/stdlib.rgr", "utf8"));
addFile("stdops.clj", fs.readFileSync("./libs/stdops.clj", "utf8"));
addFile("JSON.clj", fs.readFileSync("./libs/JSON.clj", "utf8"));
```

The full compiler code:

```typescript
import * as R from "ranger-compiler";
import { CodeNode } from "ranger-compiler";

const compilerInput = new R.InputEnv();
compilerInput.use_real = false;

// manually create a filesystem
const folder = new R.InputFSFolder();
const addFile = (name: string, contents: string) => {
  const newFile = new R.InputFSFile();
  newFile.name = name;
  newFile.data = contents;
  folder.files.push(newFile);
};
addFile(
  "hello.clj",
  ` 
class hello {
    static fn main() {
        print "Hello World"
    }
}  
`
);

// compiler requires language definition and libraries to work
const fs = require("fs");
addFile("Lang.clj", fs.readFileSync("./libs/Lang.clj", "utf8"));
addFile("stdlib.clj", fs.readFileSync("./libs/stdlib.clj", "utf8"));
addFile("stdops.clj", fs.readFileSync("./libs/stdops.clj", "utf8"));
addFile("JSON.clj", fs.readFileSync("./libs/JSON.clj", "utf8"));

compilerInput.filesystem = folder;

// set compiler options -l=es6 -typescript
const params = new R.CmdParams();
// target language is Go
params.params["l"] = "go";
params.params["o"] = "hello.go";
params.values.push("hello.clj");
compilerInput.commandLine = params;

// Run compiler
const vComp = new R.VirtualCompiler();

// Check results...
const res = await vComp.run(compilerInput);

// browse through the target compiler file system
res.fileSystem.files.forEach((file) => {
  console.log(file.getCode());
});
```

## Switching to different target language

`-l=<language>` selects the target; running the compiler with no arguments
lists the available ones, and the supported versions are under
[Targets and compatibility](#targets-and-compatibility). JavaScript
additionally has `-typescript`, which adds TypeScript annotations to the
generated source.

[Target languages](https://terotests.github.io/Ranger/docs/targets/overview/)
documents what each target writes for the main function, and the semantic
differences a portable program has to know (integer division, the sign of `%`,
string indexing, reference counting).

# Operators

Operators are short, typed commands like `get` or `push`. The compiler holds no
code for them, only one emission template per target language, which is how
platform-specific code and native polyfills are expressed. `M_PI` in
`compiler/Lang.rgr` is a small example:

```
    M_PI mathPi:double () {
        templates {
            es6 ("Math.PI")
            go ( "math.Pi" (imp "math"))
            swift3 ( "Double.pi" (imp "Foundation"))
            java7 ( "Math.PI" (imp "java.lang.Math"))
            php ("pi()")
            cpp ("M_PI" (imp "<math.h>"))
            csharp ("Math.PI" (imp "System"))
        }
    }
```

A target with no template of its own, and no `*` fallback, emits nothing — so
adding a target to an operator is a one-line change. Operators can also be
written as macros in Ranger itself.

**Reference:**
[the operator concept page](https://terotests.github.io/Ranger/docs/language/operators/)
explains templates and the second mechanism (type methods, which every target
gets for free), and
[the generated reference](https://terotests.github.io/Ranger/docs/reference/operators/statements/)
lists every operator with its signature, per-target support, and compiled
example output. The `-operatordoc=<file>` compiler option writes the same kind
of table locally when you need one without a network.

# Plugins

Compiling as CommonJS module:

```
ranger-compiler hello.clj -npm -nodemodule
```

Compiling as ES6/ESM module:

```
ranger-compiler hello.clj -npm -esm
```

Example

```javascript
Import "VirtualCompiler.clj"

flag npm (
  name "hello"
  version "0.0.1"
  description "Plugin Hello World"
  author "Tero Tolonen"
  license "MIT"
)

class Plugin {
  fn features:[string] () {
      return ([]  "postprocess")
  }
  fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    print "*** plugin postprocess was called ***"
  }
}
```

# Notes about the syntax

> The rest of this README is the language reference. The documentation site
> covers part of the same ground in shorter, edited pages —
> [program structure](https://terotests.github.io/Ranger/docs/language/structure/),
> [types](https://terotests.github.io/Ranger/docs/language/types/) and
> [optional values](https://terotests.github.io/Ranger/docs/language/optionals/) —
> and those pages carry the per-target detail (what an optional compiles to in
> Go, Rust and Swift, for instance) that the sections below do not. What follows
> here is the material the site does not have yet: traits, custom operators,
> system classes, unions, class extensions, and the annotation list.

Ranger syntax is originally based on Lisp -language syntax and most operators will use prefix notation. However, the Ranger modifies
the original Lisp so that inside block expression `{ ... }` there is no need to insert parenthesis which makes the language appear to
be a bit more like standard languages. Thus you can write exressions like

```
class Hello {
    fn sayHello:void () {
        def x 20
        if ( x < 10 ) {
            print "x < 10"
        } {
            print "x >= 10"
        }
    }
}
```

However, when you go deeper in the expression you may have to include the parenthesis, for example when invoking object you have to write

```
def obj (new Hello)
```

For most common mathematical symbols and boolean operators infix notation can be used and they are automatically converted to lisp expressions.
Thus you can write expressions such as `(x + y * z)` instead of `(+ x (* y z))`

```
def x 100
def y 200
def z ( x + y * 10)
if ( x < 20 || y == 0 ) {

}
```

The assigment operator is also automatically prefixed from infix notation so you can say

```
x = y
```

Instead of common lisp syntax `(= x y)`

## Functions, main and comments

`fn` declares a function of an object and `sfn` a static function of the class.
Each file can have a static main function, which is the entry point of the
program. A function that is not `void` must return a value with `return`. A
comment starts with `;`.

```
; here is a comment
class Hello {
    sfn main@(main):void () {
        def o (new Hello)
        o.SomeNonStaticFn()
    }
    fn SomeNonStaticFn () {
    }
    sfn SomeStaticFn () {
    }
}

Hello.SomeStaticFn()   ; calling a static function of a class
```

[Program structure](https://terotests.github.io/Ranger/docs/language/structure/)
covers `class`, `record`, `systemclass`, `Import`, `Extend` and `Enum` in one
table, and explains how blocks are passed to operators.

## Types

Type inference determines the type of local variables and class properties, or
the program declares it after a colon:

```
def x 100      ; inferred type = int
def y:int 200
def o (new myClass) ; inferred type myClass
```

The primitive types are `int`, `boolean`, `string`, `double`, `char` and
`charbuffer`, plus the fixed-width integer types; a function that returns
nothing is `void`. Arrays, hashes and anonymous functions are usable as
variable types but need a signature. `Enum`, `class`, `systemclass`,
`systemunion` and `trait` need a declaration of their own.

[Types](https://terotests.github.io/Ranger/docs/language/types/) has the full
table with example values, the buffer types and what each one compiles to.

## Strings, enums and collections

String literals use JSON escaping rules and can be multiline:

```
def long_string "
    this is
    a multiline string
"
```

The rest moved to the documentation site, where each operator also shows the
code it writes per target:
[Strings](https://terotests.github.io/Ranger/docs/language/strings/) (the
operator set, concatenation, the code-point index rule) and
[Types](https://terotests.github.io/Ranger/docs/language/types/) (arrays,
hashes, `get` returning an optional, and `Enum`).

## Anonymous functions / lambdas

Anonymous function type declaration is automatically inferred

```
def name "foo"
def myFilter (fn:boolean (param:string) {
    return (param == name)
})
if(myFilter("foo")) {
    print "it was foo"
}
```

To give declare Anonymous function as parameter of function you must include the full signature, for
example for a callback taking `string` and `int` signature is `fn:void (txt:string i:int)`

```
fn foo:void ( callback:( fn:void (txt:string i:int)) ) {
    callback("got this?" 10)
}
```

When giving lambda as a parameter, the formal type definition can be omitted, the named parameters are
automatically declared to the block scope of the lambda.

```
this.foo({
    print txt + " = " i
})
```

Lambdas compile on every backend, including the freestanding WASM/WAT path (`-wasmrc`): each body is hoisted to a function-table entry and calls go through `call_indirect`, with the value a reference-counted closure record. Captured variables are copied (values/strings) or retained (objects); a captured object can be mutated through the closure, and a captured value can be shared by boxing it in a heap cell.

# Automatically infixed math support

It is easy to define new mathematical operations in the Lang.clj file or in modules. However, some mathematical operations are automatically infixed
for easier usage. Thus, instead of using common lips notation `(* 4 10)` you can use easier to read infixed `4 * 10` -syntax

## Boolean logic operators

```
a && b
a || b
```

## Math operators

```
a * b
a / b
a - b
a + b
```

## Logical comparisions

```
a < b
a <= b
a > b
a >= b
a != b
```

# Common set of Operators and the Grammar file

The file `compiler/Lang.rgr` holds the common set of operators and the
compilation rules. The most common operators — `to_double`, `read_file`,
`array_length` and the rest — are defined there, and the
[generated reference](https://terotests.github.io/Ranger/docs/reference/operators/statements/)
is built from it. Editing the file makes it easy to extend the language with
new operators or to change existing rules, but it describes the common set of
rules and should be edited sparingly, not daily.

The file has couple of sections, but the `reserved_words` and `commands`. The Reserved words section declares (surprise!)
the reserved words and their transformation. This is required because for example in Go the word `map` is a keyword and can
not be used unless it is conveted to some other name, for example to `FnMap`.

```
    reserved_words {
        * {
            map FnMap
            forEach forEachItem
            self _self
            func _func
        }
        cpp {
            operator _operator
            static _static
            union _union
            bool _bool
            ref _ref
            class _class
            new _new
            delete _delete
            template _template
            namespace _namespace
            virtual _virtual
            public _public
            private _private
            protected _protected
        }
        go {
            type _type
        }
        rust {
            type r#type
            static r#static
            ref r#ref
            union r#union
            bool r#bool
        }
        swift3 {
            operator _operator
            static _static
            init _init
        }
        swift6 {
            operator _operator
            static _static
            init _init
        }
    }
```

The `*` section defines global mappings that apply to all target languages. Language-specific sections (like `cpp`, `rust`, `go`, `swift3`, `swift6`) define additional reserved word mappings for that particular target. For Rust, the `r#` prefix is used to escape keywords (raw identifiers).

What the result should be is of course highly opinionated. In this example, the line `map FnMap` means that if possible the
compiler will transform anything named `map` to `fnMap` if possible. If transformation is not possible, compiler error is
generated.

The common operators are declared in section `commands`, which describe commands, their expected parameters
and return values and rules on how they should be compiled into the target languages, possible imported libraries
and possible macros or helper function which should be created if the operator is used.

Example of simple operator is `(M_PI)` which will return double value of mathematical symbol "pi".

```
    commands {
        M_PI mathPi:double () {
            templates {
                es6 ("Math.PI")
                go ( "math.Pi" (imp "math"))
                swift3 ( "Double.pi" (imp "Foundation"))
                java7 ( "Math.PI" (imp "java.lang.Math"))
                php ("pi()")
                cpp ("M_PI" (imp "<math.h>"))
            }
        }
        ...
```

Most operators are simple, but some require creating custom macros, helpoer functions and some of them are so complex
that they may be implemented in the compiler core.

# Modules, classes and operators

The basic unit of the program is class. The functions of classes can not be overloaded at the moment, which means that you can not
have two functions with different parameters or different return values.

Each source file can import other files using `Import` command.

```
Import "Vec2.clj"

class vectorTest {
    fn testVectors () {
        def v (new Vec2 ( 5 4 ))
    }
}
```

## Class declaration

```
class fatherClass {
    def msg "Hello "
    fn foo:string ( txt:string ) {
        return (msg + txt)
    }
}
class childClass {
    Extends( fatherClass )
}
class mainProgram {
    sfn m@(main) {
        ; invoke the class
        def cc (new childClass)
        cc.foo("World!")
    }
}

```

## Class constructor

```
class myClass {
    def name:string ""
    Constructor (n:string) {
        name = s
    }
}
```

Notes:

1. currently only a single variant of the constructor is possible.
2. as of this writing calling the parent class constructor does not work properly

## Class invocation

```
def obj (new myClass ("name"))
```

classes without constructor can be invocated without arguments

```
def obj (new simpleClass)
```

## Creating a class extension

Class extensions are useful for keeping classes simple and moving dependencies to external Modules
which can extend the classes.

Extension can

- add new functions to the class
- add new member variables to the class

```
extension childClass {
    def name:string ""
    fn bar:string ( txt:string ) {
        return ("Hello from exteision: " + txt)
    }
}
```

## Optional variables

An optional value must be unwrapped before use, and unwrapping a non-nullable
value is a compiler error. Any variable declared without a value is optional,
which corresponds to the Swift `?` type. The `@(optional)` annotation declares
one explicitly, and some operators — `(get <hash> <key>)` among them — always
return one.

```
    def item@(optional):myClass

    def strMap:[string:string]
    def str (get strMap "myKey")
    if(!null? str) {
        print (unwrap str)
    }
```

[Optional values](https://terotests.github.io/Ranger/docs/language/optionals/)
lists the operators (`??`, `!!`, `unwrap`, `null?`, `!null?`, `wrap`,
`nullify`), what each target uses for an empty value, and the `-strict` flag.

**Two warnings that apply to the current implementation.** Optionals are not
"safe" in the sense of preventing programming errors: a variable that was
unwrapped automatically can still be misused. Making them safer is planned, and
the options are being considered. Ranger also does not protect against mistakes
when automatically unwrapping long reference chains such as
`obj.property.subProperty.foo`, where `property` and `subProperty` are optional.

## Control flow

### if

If statement is quite similar to other language, but `then` and `else` keywords are not used

```
def x 100
if ( x < 10 ) {
    ; then branch
} {
    ; else branch
}
```

### switch - case

Note: currently case statement does not support multiple matching values, it is planned to add support for that later.

```
def name "John"
switch name {
    case "John" {

    }
    case "Flat Eric" {

    }
    default {

    }
}
```

## Loops

### for -loop

```
def list:[string]
for list s:string i {
    print s
}
```

You can use `break` and `continue` to control the for -loop.

### while -loop

```
def cnt 10
while (cnt > 0 ) {
    print "round " + cnt
}
```

You can use `break` and `continue` to control the while -loop.

## Custom operators

One of the most important features or Ranger is the ability to create custom operators which can target some specific language or all languages
using macros. Together with `systemclass` they allow the system to integrate to target environment or to create new abstraction over existing
native API's.

Operators allow type matching against

- defined primitive types
- defined classes
- Enums
- optionality
- traits

Operators can be writing directly target language construct or they can be macros, which write code in Ranger and the compiler will then
transform the resulting AST tree into the target language's code using the conventions of target language. Which is better depends on the
situation, for example operators for system classes usually are written directly to the traget language while operators which are using
Ranger's own classes or datatypes are usually better to write with macros.

Simple example of useful macro is Matrix and Vector multiplication. Let's say that you have defined a Matrix class and
want to overload the `*` -operator for easy matrix multiplication.

```
class Mat2 {
  def m0 1.0
  def m1 0.0
  def m2 0.0
  def m3 1.0
  def m4 0.0
  def m5 0.0
  fn multiply:Mat2 ( b:Mat2 ) {
      def t0 (m0*b.m0 + m1 * b.m2)
      def t2 (m2*b.m0 + m3 * b.m2)
      def t4 (m4*b.m0 + m5 * b.m2 + b.m4)

      def res (new Mat2)
      res.m1 = (m0 * b.m1 + m1 * b.m3)
      res.m3 = (m2 * b.m1 + m3 * b.m3)
      res.m5 = (m4 * b.m1 + m5 * b.m3 + b.m5)
      res.m0 = t0
      res.m2 = t2
      res.m4 = t4
      return res
  }
}
operators {
    *  base:Mat2 ( a:Mat2 b:Mat2) {
        templates {
            * @macro(true) ( (e 1 ) ".multiply(" (e 2) " )" )
        }
    }
}

```

The `* @macro(true)` means that we target all languages and this is a macro, not actual target language construct.

## Custom operators and System classes

To integrate with the target languages running environment, Ranger modules can declare `systemclass` which can be used
together with the code.

```
systemclass DOMElement {
    es6 DOMElement
}

operators {
    find  base:DOMElement ( id:string) {
        templates {
            es6 ("document.getElementById( " (e 1) " )")
        }
    }
    setAttribute  _:void ( elem:DOMElement name:string value:string) {
        templates {
            es6 ( (e 1) ".setAttribute(" (e 2) ", " (e 3) ")" )
        }
    }
}

class tester {
    fn modifyDom () {
        def e (find "#someelem")
        setAttribute( e "className", "activeElement")
    }
}
```

Note: Definition of system classes will be revisited in near future and there will be potentially small changes to it.

## Unions of system classes

Sometimes the system class can be of union type. This means that the traget language can accept multiple types in place of
a single type.

```
systemunion DOMElementUnion ( DOMElement string )
```

The you can create operator which accepts either `DOMElement` or `string` and reduces that to a single type.

## Traits

Traits are like extensions, which can be plugged into several classes using `does` keyword.

Traits

```
trait bar {
    fn hello() {
        print "Hello"
    }
}

; foo implements "bar" trait
class foo {
    does bar
}
```

Traits are very useful when used together with custom operators, because operators can also match traits.

Another useful feature of traits is their genericity. While classes can not be generic, traits can and thus
it is possible to implement for example generic collections using generic traits.

```
trait GenericCollection @params(T S) {
    def items:[T]
    fn  add (item:T) {
        push items item
    }
    fn  map:S ( callback:( f:T (item:T))  ) {
        def res:S (new S ())
        for items ch@(lives):T i {
            def new_item@(lives):T (callback (ch))
            res.add(new_item)
        }
        return res
    }
    ; ... TODO: add more collection functions...
}

; then create a specific "string" collection..
class StringCollection {
    does GenericCollection @params(string StringCollection)
}

class Main {
    fn testCollection:void () {
        def coll:StringCollection (new StringCollection)
        coll.add("A")
        coll.add("B")
        def n (coll.map({
            return ("item = " + item)
        }))
        print (join n.items " ")
    }
    sfn hello@(main):void () {
        def hello (new Main ())
        hello.testCollection()
    }
}
```

## Variable definitions

Values can be defined using `def` keyword.

```
def x:double
def x:double 0.4            ; double with initializer
def list1:[double]          ; list of doubles
def strList:[string]        ; list of Strings
def strMap:[string:string]  ; map of string -> string
def strObjMap:[string:someClass]    ; map of string -> object of type someClass
```

# Advanced topics

## Changing the compiler

There are two levels of change, and only the second one needs a rebuild.

**Level 1 — the language definition.** Operators, their per-target templates,
the reserved words and the compilation rules live in `compiler/Lang.rgr`, which
the compiler reads at compile time. Adding a target to an existing operator, or
adding a whole operator, takes effect on the next compile with no rebuild step.
The compiler looks for `Lang.rgr` in the working directory first and falls back
to the copy beside `bin/output.js`, so a modified copy next to your sources
overrides the installed one — which makes an experiment cheap to try and cheap
to revert. `lib/stdops.rgr` (macros, the `ret` operator) works the same way.

**Level 2 — the compiler itself.** The parser, the type checker and the writers
are Ranger source under `compiler/`. Changing them means compiling the compiler
with itself:

```bash
npm run compile      # compiler/ng_Compiler.rgr -> bin/output.js, and copies Lang.rgr to bin/
npm test             # the suite runs against the compiler you just built
```

`npm run compile` is the self-hosting step: the current `bin/output.js` compiles
the new sources into the next `bin/output.js`. A change that breaks codegen can
therefore break the compiler that builds the next one, so keep the previous
`bin/output.js` until the tests pass; `versions/<target>/compiler.js` holds
earlier builds. The standalone form is `ranger-compiler -compiler -copysrc`,
which writes `bin/ng_Compiler.js`.

# Annotations

Compiler is using annotation syntax for specifying some parameters for class, trait and variable construction.

## sfn someFn@(main)

Static functions can be annotated to be the start point of compiled application using `@(main)` annotation.

## trait myTrait @params(...)

@params(...) annotation can be used to greate generic traits.

```
trait GenericCollection @paras(T V) {
    def items:[T]
    fn  map:S ( callback:( f:T (item:T))  ) {
        def res:S (new S ())
        for children ch@(lives):T i {
            def new_item@(lives):T (callback (ch))
            res.add(new_item)
        }
        return res
    }
}

class StringCollection {
    does GenericCollection @params(string StringCollection)
}
```

## def variableName@(optional)

Optional variables can be used as return values of functions where the result is not certain. You can
force the unwrapping of the variable with `(unwrap <variable>)`

## def variableName@(weak)

Weak variables are ment to be compiled in the target language as weak references

## def variableName@(strong)

Weak variables are ment to be compiled in the target language as strong references

## def variableName@(lives)

@(lives) annotation can be used to note the compiler that the variable is supposed to outlive it's current scope.

The variables have lifetime, which determines the point where the variable should be removed. In garbage collected
languages you do not have to worry about the lifetime, but in the future there can be target languages which require
the lifetime calculations.

## def variableName@(temp)

@(temp) annotation can be used to note the compiler that it should not worry about freeing the variable, in case the
target language has option to release the variable.
