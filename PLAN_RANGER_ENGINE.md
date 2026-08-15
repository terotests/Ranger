# A Ranger engine — running Ranger, compiling the hot parts

Status: **first version works** (`gallery/ranger_engine/`, `npm run engine:demo`).
Tier 3 (WebAssembly / LLVM) is designed here but not built.

## The question

Ranger already has `ComponentEngine`: an engine, written in Ranger, that parses
and evaluates **TypeScript** at runtime, with an AST walker and a bytecode tier
under it. The obvious mirror image is an engine that takes **Ranger** in and
runs it — interpreting where that is fine, and compiling classes to fast code
where it is not, so that parts of a program stop being interpreted at all.

Two doubts come with the idea, and both deserve an answer before the design:

1. *The Ranger compiler is several megabytes. How small can a Ranger interpreter
   get?*
2. *Is there anything to gain on Node, where the alternative is JavaScript that
   V8 already compiles?*

## The short answer

Yes, and the size objection dissolves once the engine is cut in two halves that
do not depend on each other:

| Half | What it is | Built size (ES6) |
| --- | --- | --- |
| runtime | `RgBytecode` + `RgVM` + `RgJsJit` | **29 KB** |
| build-time | the compiler frontend + `RgLower` | **2.9 MB** |

The compiler is only large because it parses, analyzes and typechecks Ranger and
emits twelve target languages. None of that has to be present to *run* code. If
bytecode is produced ahead of time, a program ships the 29 KB half; if the host
is Node, where the compiler is just another module, both halves load and the
engine takes source directly.

On the second doubt: interpreting is 3–18× slower than compiled JavaScript
output on the benchmark, and the JIT tier recovers most of that gap without the
engine containing a code generator of its own — it writes JavaScript and lets
the host compile it. So "not necessarily faster than running JavaScript on
Node" is right for the *ceiling*, and the interesting result is how cheaply the
tiering machinery gets close to it.

## Shape

```
program.rgr
    │  parse → CollectMethods → WalkNode → typecheck        (existing frontend)
    ▼
analyzed CodeNode tree
    │  RgLower: one RgFunction per method, register-allocated
    ▼
RgModule ─── tier 1: RgVM, a two-bank register machine
         └── tier 2: RgJsJit, bytecode → JavaScript → new Function → V8
         └── tier 3: bytecode → WAT → wasm                  (not built)
```

`RgLower` walks the same `RangerAppClassDesc` / `RangerAppFunctionDesc` /
`CodeNode` shapes every language writer walks, so it inherits name resolution,
overload selection and type inference instead of re-deriving them. That is what
keeps it at ~2000 lines rather than ~8000 (`ng_LowIRBuilder.rgr`, for
comparison, is 7939 and covers a narrower language subset for LLVM).

### Why a register machine with two banks

Ranger is statically typed, so the bank a value lives in — numeric or reference
— is known at lowering time. `ADD` is always two numbers; `SCAT` is always two
strings. The interpreter never inspects a tag, never boxes an integer, and a
frame is a window on a shared stack rather than an allocation.

The same property is what makes the JIT tier almost trivial: every register is a
JavaScript local of a known kind, so a bytecode instruction is one JavaScript
statement, and the generated function is ordinary numeric code that V8's own
optimiser is happy with. A dynamically typed bytecode would have forced the
generated code to carry tag checks that V8 could not remove.

### Tier 2 in one paragraph

After a threshold of calls, `RgJsJit` emits one `case` per instruction inside a
`for(;;) switch(pc)`, hands the source to `new Function` through an operator
with per-target templates, and stores the handle on the `RgFunction`. The VM
checks the tier once per entry, never inside the instruction loop. On a host
without runtime compilation the operator's `*` template makes
`rg_jit_available` false and everything keeps running as bytecode — the reason
the JIT lives behind a hook class (`RgJitHook`) that the VM-only build still
satisfies.

## Measurements (Node 22, `npm run engine:bench`)

| case | tier 1 | tier 2 | compiled `.js` | tier1/tier2 |
| --- | --- | --- | --- | --- |
| `fib(24)` | 32.6 ms | 5.9 ms | 0.5 ms | 5.6× |
| `loopChunks(8, 50000)` | 29.9 ms | 1.6 ms | 0.6 ms | 18.4× |
| `collatzMax(3000)` | 29.1 ms | 3.3 ms | 0.8 ms | 8.8× |

Load cost, once per program: ~220 ms frontend, ~2 ms lowering. Almost all of the
frontend time is parsing and analyzing `Lang.rgr` — the operator library — not
the program.

Correctness is gated differentially: `tests/ranger-engine.test.ts` runs
`examples/demo.rgr` through the engine and through the ordinary compiler and
requires the two to print the same lines.

## What is missing, in the order it should be added

### 1. Direct linking between compiled functions

A compiled function calls another one through `vm.callFunction`, which pushes
arguments into the VM's buffers and re-enters the dispatch. On `fib`, which is
almost pure call, this is most of the remaining distance to the compiled column.

The fix is a calling convention for compiled bodies: generate
`function(vm, a0, a1, …)`, keep the handles in an array the generated code can
index, and emit a direct call when the callee is already compiled — with a
guard, because the callee may be promoted later. Once a call is direct, V8 can
inline it, which is where the rest of the gap lives.

### 2. On-stack replacement, or loop-level promotion

Promotion happens between calls. A function entered once that loops ten million
times never leaves tier 1. Two ways out, in increasing order of work: promote a
function when a *back edge* has been taken often enough and re-enter the
compiled body at the loop head (real OSR), or lower long-running loops into
their own hidden functions so the existing call-count heuristic sees them.

### 3. Tier 3: WebAssembly

Everything needed already exists in the repository:
`ng_WATWriter.rgr` emits WAT from Low IR, `wabt` is a devDependency, and
`npm run test:llvm` already assembles WAT and runs it under
`WebAssembly.Instance`. Two routes:

- **From bytecode.** Emit WAT with the same `pc` dispatch the JavaScript tier
  uses — WebAssembly has no arbitrary jumps, but the standard nested-`block` +
  `br_table` shape reproduces a switch exactly. Numeric functions with numeric
  calls need no imports; anything touching the heap needs the VM's memory to be
  visible to wasm, which is the hard part and the reason to start numeric.
- **From Low IR.** `RgLower` gains a second output and reuses
  `ng_LowIRBuilder`'s existing lowering for the subset it already supports
  (`int`/`double`/`bool`, static methods, `if`/`while`, heap through `Mem`
  intrinsics). Less new code, narrower subset, and it inherits the LLVM path for
  free — the same IR that already produces `.ll` for native builds.

On Node this is unlikely to beat tier 2, because V8 compiles both. It matters
for the browser (where a compiled wasm module can be cached across loads) and
for hosts where `eval` is unavailable but `WebAssembly.instantiate` is not.

### 4. Bytecode as a file format

The module model is already the whole interface between the halves; it has no
serialization yet. A `.rgb` file — a header, the constant pools, the four
instruction columns, the class layouts — would let a build step produce bytecode
and a 29 KB runtime execute it with no compiler anywhere. That is the
configuration where "how small can a Ranger interpreter be" has a real answer,
and it is also what a browser playground or an embedded scripting host would
want.

### 5. Language coverage

Maps, lambdas and closures, inheritance and virtual dispatch (the class model
already carries method tables for it), traits, unions and shapes, enums,
`try`/`throw`, optionals beyond `null?`, generics, `@process`. Each is a named
bail today, which is the point: the report says what is missing instead of the
engine failing somewhere deep in a call.

One design debt to pay early: functions are keyed by `Class.method`, so
overloaded methods collide and the second variant is dropped. Keying by the
frontend's variant identity fixes it.

## Relation to `ComponentEngine`

Both are engines written in Ranger, and both tier. The differences are
instructive:

| | `ComponentEngine` (TS) | this engine (Ranger) |
| --- | --- | --- |
| front end | its own TS lexer/parser | the Ranger compiler's frontend |
| values | `EvHandle` / `EvalValue`, tagged | two typed banks, untagged |
| tier 1 | AST walker | bytecode only |
| tier 2 | its own bytecode VM | host-compiled native code |
| why | JavaScript is dynamically typed; the engine must carry the semantics | Ranger is statically typed; the types are already resolved before lowering |

The static types are the whole reason this engine can be smaller and its JIT
simpler than the TypeScript one: by the time `RgLower` sees a node, the question
"what is this value" has already been answered by the compiler that produced it.
