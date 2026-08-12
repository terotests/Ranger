# Self-hosting: the Ranger compiler running on ComponentEngine

`bin/output.js` is the Ranger compiler, compiled to JavaScript by itself. This
bench runs that 2.6 MB program **inside ComponentEngine** — the engine
interpreting the compiler — and compares what it emits against the same compile
run natively on Node.

It is the strongest end-to-end check the engine has. A compile exercises the
parser, the type checker and every writer over ~5 MB of source, and the result
is compared byte for byte, so a single wrong answer anywhere shows up as a diff
rather than as a plausible-looking output.

```bash
bash scripts/build-engine-module.sh
node gallery/game_engine/v2/interp/bench/self_host/compile-on-engine.cjs \
     tests/fixtures/chain_fluent_builder.rgr
```

Exit status is 0 only when every emitted file matches the Node oracle.

## What the harness supplies

The compiler is an ordinary Node program. None of that surface exists inside
the engine, so it is provided in two layers (`engine-host.cjs`):

| Layer | Provides |
|---|---|
| `HostBridge` | real file reads, `sha256`, path math — reached from guest code through `setNativeBridge` |
| `buildPrelude` | the guest-side `process`, `require('fs'\|'path'\|'crypto')` and `__dirname`, written on top of those bridge calls |

Everything else runs on the engine. Writes are **captured, never applied to
disk**, so a run can never damage the tree it was built from.

Two details are easy to get wrong and are handled here:

- The compiler's entry is `async`. Calling it returns a promise and does
  nothing else; its continuations only run when `drainJobs()` is called, and
  every file read is another await, so the harness drains until the run
  settles.
- The compiler resolves `-d` against its own cwd **even when the path looks
  absolute**, so both runs are given directories relative to the repo root.

## Results

Measured on a 4-core, 15 GB machine.

| Input | Engine | Node | Output |
|---|---|---|---|
| hello (5 lines) | ~35 s | ~0.9 s | byte-identical |
| `chain_fluent_builder.rgr` | ~70 s | ~1 s | byte-identical (534 B) |
| `process_nesting.rgr` (10 KB, process/actor feature) | ~93 s | ~1 s | byte-identical (42,639 B) |
| the compiler itself (`ng_Compiler.rgr`, 76 files, 5 MB) | — | ~9 s | **does not fit in memory** |

Loading the 2.6 MB bundle takes ~1 s; the rest is the compile.

### The compiler compiling itself

This does not complete here. It exhausts the heap: OOM at a 12 GB cap after
~6 minutes, and again at 13.6 GB on a machine with 15 GB total, with V8
spending ~96 % of its time in GC before it dies. The engine holds the program
AST, 5 MB of source and the compiler's whole working set as interpreter
objects at once, and that multiplier is what does not fit — not any single
allocation.

So the honest statement is: **the engine runs the compiler correctly, and
compiles real programs to byte-identical output, but compiling the compiler
itself needs more memory than this machine has.** Whether it fits at all is a
question about the engine's memory model, not about correctness.

Note this is a different question from whether the compiler is *reproducible*,
which it now is: `bin/output.js` is built from `compiler/*.rgr` alone, and the
compiler compiling itself on Node converges in one generation (gen2 == gen3,
byte for byte).

## Bugs this found

Running a real program instead of a test corpus surfaced four engine faults,
each fixed with regression coverage:

- **A pooled call frame kept its `const` marks**, so one function's `const c`
  made an unrelated `let c` in the next call through that frame throw
  "Assignment to constant variable". Order- and warmth-dependent, invisible in
  short runs.
- **`await` lost its value** — every awaited result answered undefined (master
  only; already fixed on the branch this bench landed with).
- **The native bridge was reachable only from the walker.** The `fs` shim's
  methods compile, so every file probe died on "not defined" while the
  identical call from top level worked.
- **`return ";"` returned undefined.** The parser decides "no argument" by
  comparing the next token's *value* to the statement terminators, and a
  string literal's value is its text. The JS writer's `lineEnding()` returns
  `";"`, so codegen died on `undefined.charCodeAt` with no stack — which is
  why a trivial program compiled and every real one failed.
