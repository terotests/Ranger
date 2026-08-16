# A Ranger engine — running Ranger, compiling the hot parts

Status: **works** (`gallery/ranger_engine/`, `npm run engine:demo`). Bytecode is
a file (`.rgb`) and `rangercli` runs one as a 237 KB native binary with no
compiler in it. Tier 3 exists on the native runtime, through the system C
compiler, and **beats the Ranger compiler's own JavaScript output by 1.4–3×**
(`npm run engine:tiers`). The WebAssembly route is still only designed.

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
3. *Could it ever be FASTER than the JavaScript build?*

## The short answer

Yes, and the size objection dissolves once the engine is cut in two halves that
do not depend on each other:

| Half | What it is | Built size (ES6) |
| --- | --- | --- |
| runtime | `RgBytecode` + `RgVM` + `RgJsJit` | **33 KB** |
| runtime, as a native CLI | the same plus tier 3, `-l=cpp` + `g++ -O2` | **237 KB** |
| build-time | the compiler frontend + `RgLower` | **2.9 MB** |

The compiler is only large because it parses, analyzes and typechecks Ranger and
emits twelve target languages. None of that has to be present to *run* code. If
bytecode is produced ahead of time, a program ships the 33 KB half; if the host
is Node, where the compiler is just another module, both halves load and the
engine takes source directly.

On the second doubt: the interpreter is 8–29× slower than compiled JavaScript
output, and the JavaScript JIT tier closes most of that without the engine
containing a code generator of its own — it writes JavaScript and lets the host
compile it. Call-heavy code lands **1.3×** off compiled output, loops 2–6×.
Parity is its ceiling, because it is asking V8 to compile V8's own competition.

On the third: **yes, on the native runtime.** There the host has a C compiler
installed, and `RgCJit` uses it — the hot call group goes out as C, through
`cc -O3 -fPIC -shared`, back in through `dlopen`. On the benchmark that is 1 ms
against JavaScript's 3, 2 against 6, and 7 against 10, with the ordinary C++
build at 0, 1 and 5. The price is 299 ms of `cc` for five functions, paid once
per run, which is why the tier is opt-in.

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

## Measurements (Node 22, `npm run engine:bench`, best of 7)

| case | tier 1 | tier 2 | compiled `.js` | tier1/tier2 | tier2 vs compiled |
| --- | --- | --- | --- | --- | --- |
| `fib(24)` | 15.2 ms | 0.5 ms | 0.4 ms | 29× | **1.3×** |
| `loopChunks(8, 50000)` | 23.5 ms | 1.3 ms | 0.6 ms | 19× | 2.2× |
| `collatzMax(3000)` | 22.3 ms | 2.6 ms | 0.5 ms | 8.7× | 5.6× |

Load cost, once per program: ~220 ms frontend, ~2 ms lowering. Almost all of the
frontend time is parsing and analyzing `Lang.rgr` — the operator library — not
the program.

### Where the gap was, measured rather than guessed

The first version of tier 2 was 15× off compiled output on `fib`, and the
obvious suspect was the generated shape: a `switch(pc)` dispatch loop with one
`case` per instruction does not look like code an optimiser will love. Four
hand-written variants of `fib`, each adding one piece of the machinery,
say otherwise:

| variant | time | vs plain |
| --- | --- | --- |
| plain JavaScript, what the compiler emits | 8.2 ms | 1.0× |
| the `pc` dispatch loop, direct recursion | 10.2 ms | 1.3× |
| plain control flow, calls through the VM | 92.3 ms | **11.3×** |
| both | 97.1 ms | 11.9× |

The dispatch shape costs 30%. The calling convention cost an order of
magnitude — an argument array, a tier test and a return slot per call — and it
was invisible until it was separated from the thing that looked slow.

So compiled bodies are now generated in two forms: `direct(vm, a0, …)`, which
takes its arguments as parameters and returns its result, and a thin
`entry(vm)` for calls arriving from the interpreter. Self-recursion is a plain
call. A call to another function links itself the first time it finds that one
compiled — an inline cache in the factory's scope — and uses the buffer until
then, because a callee is often promoted after its caller.

`fib` went from 6.5 ms to 0.5 ms on that change alone. What is left is the
dispatch loop and the guards the engine keeps for semantics (division by zero
fails the program instead of producing `Infinity`), which is why a tight
arithmetic loop like `collatzMax` is further off than a call-heavy recursion.

Correctness is gated differentially: `tests/ranger-engine.test.ts` runs three
example programs through the engine and through the ordinary compiler and
requires the same output from both, and pins signed `idiv` / `%` against the
host's own semantics in both tiers.

## The whole ladder (`npm run engine:tiers`, best of 5 inside the program)

| way to run `bench_cli.rgr` | fib(27) | loopChunks | collatzMax |
| --- | --- | --- | --- |
| bytecode, Node host | 111 ms | 226 ms | 620 ms |
| bytecode, native host | 74 ms | 158 ms | 364 ms |
| **tier 3: `cc -O3` JIT, native** | **1 ms** | **2 ms** | **7 ms** |
| compiled JavaScript on V8 | 3 ms | 6 ms | 10 ms |
| compiled C++ at `-O2` | 0 ms | 1 ms | 5 ms |

Two things that had to be true for the third row:

- **The call group, not the function.** Compiling `fib` alone leaves every
  recursive call going out through a function pointer; compiling `fib` and
  everything it calls into one translation unit lets `cc` inline.
- **Integer registers.** The interpreter's numeric bank is doubles, and the
  first C backend inherited that: every `%` became `fmod` and every `idiv` a
  `trunc`, both library calls. Ranger's types say which values are integers,
  the `.rgb` carries it (`I` versus `N` on parameters and return types), and a
  fixpoint over the instruction stream propagates it to the rest. Collatz went
  17 ms → 9 ms on that alone, then 7 ms at `-O3`.

## What is missing, in the order it should be added

### 1. Structured control flow instead of the `pc` loop

Worth 20–30% on straight-line code, and more on a tight loop, where re-entering
the dispatch once per iteration is a bigger share of the work. The bytecode has
arbitrary jumps; recovering `while` and `if` from them is the relooper problem,
but the lowering pass *knows* the structure — it produced the jumps from a
`while` in the first place. Recording loop and branch boundaries in the module
would let the JavaScript backend (and the WebAssembly one, which cannot do
arbitrary jumps at all) emit structured code without recovering anything.

### 2. On-stack replacement, or loop-level promotion

Promotion happens between calls. A function entered once that loops ten million
times never leaves tier 1. Two ways out, in increasing order of work: promote a
function when a *back edge* has been taken often enough and re-enter the
compiled body at the loop head (real OSR), or lower long-running loops into
their own hidden functions so the existing call-count heuristic sees them.

### 3. Tier 3, part two: WebAssembly

The C route (`RgCJit`) is built and is the fast one, but it needs a C compiler
on the machine and a host that can `dlopen`. WebAssembly would cover the
browser and the hosts where neither is true, and everything needed is already
in the repository: `ng_WATWriter.rgr` emits WAT from Low IR, `wabt` is a
devDependency, and `npm run test:llvm` already assembles WAT and runs it under
`WebAssembly.Instance`. Two routes:

- **From bytecode.** Emit WAT with the same `pc` dispatch the other two tiers
  use — WebAssembly has no arbitrary jumps, but the standard nested-`block` +
  `br_table` shape reproduces a switch exactly. The typed register pass
  (`i32` versus `f64`) that tier 3 already needs is the same one WAT wants.
  Numeric functions need no imports; anything touching the heap needs the VM's
  memory to be visible to wasm, which is the hard part.
- **From Low IR.** `RgLower` gains a second output and reuses
  `ng_LowIRBuilder`'s existing lowering for the subset it supports. Less new
  code, narrower subset, and it inherits the LLVM path for free.

On Node this is unlikely to beat the C tier. It matters for the browser, where
a compiled module can be cached across loads, and for hosts with no `cc`.

### 4. Bytecode as a file format — **done**

`.rgb` is line-oriented text with one tag character per line and opcodes
written by name; `RgModuleIO` writes and reads it and depends only on
`RgBytecode`. `rg_build` produces one (it has the compiler), `rangercli`
consumes one (it does not). Compiled through the C++ target, `rangercli` is a
**178 KB** binary that runs `demo.rgb`'s 209k instructions in 1 ms against 36 ms
for the same bytecode on the JavaScript-hosted VM.

Names rather than ordinals in the file, because an enum's number shifts when an
opcode is inserted and a shifted number is a program that quietly does
something else. The writer refuses an opcode it cannot name and the reader
refuses a name it does not know — a check that paid for itself the first time
the table lagged the enum and `SPLIT` was written as `NOP`.

Host I/O is deliberately small: `print`, the command line, `read_file` /
`write_file` / `file_exists`, the clock, `strsplit` and `trim`. Each is the
ordinary Ranger operator of the same name, so a VM compiled for C++ gets the
C++ implementation and the engine never learns what a file is.

What the format does not do yet: a binary encoding (smaller, but harder to
debug than the current text), a hash or a signature, source positions for
runtime errors, and any notion of separate modules linking against each other.

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
