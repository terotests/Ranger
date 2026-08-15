# ranger_engine — running Ranger without emitting a target

Ranger's [`ComponentEngine`](../game_engine/v2/interp/) is written in Ranger and
runs **TypeScript**. This is the mirror image: an engine written in Ranger that
runs **Ranger**, and compiles the functions a program leans on into host code
while the program runs.

```bash
npm run engine:build     # build the hosts into gallery/ranger_engine/bin/
npm run engine:demo      # run examples/demo.rgr through the engine
npm run engine:bench     # tier 1 vs tier 2 vs the ordinary compiler
npm run test:engine      # the vitest suite
```

```
$ node bin/rg_run.js examples/demo.rgr -report -jit=100
fib(20)     = 6765
sumTo(100)  = 5050
arraySum(5) = 20
counter = 42
hello, ranger

classes: 4   functions: 8 (8 lowered)
frontend: 225 ms   lowering: 2 ms   interpreted steps: 1133
  Demo.fib  jit  calls=21891
  Demo.sumTo  bytecode  calls=1
  …
```

## The shape of it

```
  program.rgr
      │
      │  the ordinary compiler frontend: parse, collect, analyze, typecheck
      ▼
  analyzed CodeNode tree  ──RgLower──▶  RgModule (bytecode)
                                            │
                              ┌─────────────┴──────────────┐
                              ▼                            ▼
                     tier 1: RgVM                tier 2: RgJsJit
                  register machine,            bytecode → JavaScript
                  two typed banks              → new Function → V8
```

| File | Role | Needs the compiler? |
| --- | --- | --- |
| `src/RgBytecode.rgr` | instruction set, module / class / function model | no |
| `src/RgVM.rgr` | the interpreter, the heap, the calling convention | no |
| `src/RgJsJit.rgr` | tier 2: bytecode → host source → `new Function` | no |
| `src/RgLower.rgr` | analyzed Ranger → bytecode | **yes** |
| `src/RgEngine.rgr` | front door: load a file, run it, report tiers | **yes** |
| `tools/rg_run.rgr` | command line | yes |
| `tools/rg_api.rgr` | the engine as a Node module | yes |
| `tools/rg_vm_only.rgr` | VM + JIT alone, to measure the runtime half | no |
| `tools/rg_dump.rgr` | prints the analyzed tree the pass lowers from | yes |

The split is the interesting part. `RgBytecode` + `RgVM` + `RgJsJit` compile to
**29 KB** of JavaScript; the same engine with the frontend linked in is **2.9
MB**. A program whose bytecode was produced ahead of time needs only the first
number.

## The machine

A register machine with two banks, not one boxed value type:

- **numeric registers** (`[double]`) — `int`, `double`, `boolean`, `char`
- **reference registers** (`[RgRef]`) — strings, arrays, objects

Ranger is statically typed, so the lowering pass knows which bank every value
belongs to and bakes the choice into the opcode: `ADD` is always numbers,
`SCAT` is always strings. Nothing is tagged and nothing is checked at runtime.
That is also what makes tier 2 nearly free — each register becomes one
JavaScript local of a known kind, so `n3 = n1 + n2` comes out as itself.

A call does not allocate a frame: it takes the next window of a shared register
stack, and frames live on the host's call stack because `execute` recurses.

## Tier 2, the JIT

After a function has been entered more than `-jit=N` times, `RgJsJit`
translates its bytecode into JavaScript and asks the host to compile it, using
an operator whose template is per target:

```ranger
rg_jit_compile _:RgHostFn ( src:string ) {
  templates {
    es6 ( "(new Function('vm', " (e 1) "))" )
    * ( "null" )
  }
}
```

Generated code for `fib`, verbatim (one `case` per instruction, fall-through
for sequential flow, `pc` for jumps):

```javascript
var n0 = 0; var n1 = 0; var n2 = 0; var n3 = 0; var n4 = 0;
n0 = vm.argNums[0];
vm.argNums = [];
rgl: for(;;) { switch(pc) {
case 0:  n1 = 2;
case 1:  n2 = (n0 < n1) ? 1 : 0;
case 2:  if (n2 === 0) { pc = 4; continue rgl; }
case 3:  vm.retNum = n0; return;
case 4:  n1 = 1;
case 5:  n2 = n0 - n1;
case 6:  vm.argNums.push(n2);
case 7:  vm.callFunction(2); if (vm.failed) { return; } n3 = vm.retNum;
…
```

On a host with no way to compile source, `rg_jit_available` is false and every
function keeps running as bytecode; nothing else changes.

### What it buys (Node 22, `npm run engine:bench`)

| case | tier 1 | tier 2 | compiled `.js` | tier1/tier2 |
| --- | --- | --- | --- | --- |
| `fib(24)` | 32.6 ms | 5.9 ms | 0.5 ms | 5.6× |
| `loopChunks(8, 50000)` | 29.9 ms | 1.6 ms | 0.6 ms | 18.4× |
| `collatzMax(3000)` | 29.1 ms | 3.3 ms | 0.8 ms | 8.8× |

Loading is a separate cost, paid once: ~220 ms of frontend (parse + analyze +
typecheck of the file *and* `Lang.rgr`) and ~2 ms of lowering.

Two honest gaps in those numbers:

- **Calls still go through the VM.** A compiled function reaches another one
  via `vm.callFunction`, which pushes arguments through the VM's buffers. That
  is most of the remaining distance to the compiled column on `fib`, which is
  almost all call. Direct linking between compiled functions is the next win.
- **Promotion happens between calls, never inside one.** A function that is
  entered once and loops ten million times stays interpreted for the whole
  run — there is no on-stack replacement. `loopChunks` in the benchmark exists
  to make that visible: it calls the loop repeatedly, so promotion can happen.

## What lowers today

Static functions and instance methods of plain classes; `int` / `double` /
`boolean` / `char` / `string`; arrays of primitives and of objects; `def`,
assignment, `if` / `else`, `while`, `for`-over-array, `break`, `continue`,
`return`, `print`; arithmetic, comparison, short-circuit boolean, string
concatenation; static calls, instance calls, `this.method()`, constructors and
declared field defaults.

Not yet: maps (`[K:V]`), lambdas and closures, inheritance and virtual
dispatch, traits, unions and shapes, enums, `try` / `throw`, optionals beyond
`null?`, generics, operator overloads, `@process`.

Nothing on that second list is a crash. The pass marks the function
`unsupported` with a reason, the rest of the module still lowers and runs, and
the reason shows up in `-report`:

```
  Partial.tally  unsupported: maps are not supported yet
```

## Working on it

`tools/rg_dump.rgr` prints the analyzed tree the pass reads, which is the
fastest way to see why something bailed:

```bash
node bin/rg_dump.js examples/demo.rgr Demo
```

The engine needs `RANGER_LIB` pointed at the compiler's library directories,
the same as any other program that embeds the compiler:

```bash
RANGER_LIB="./compiler/;./lib/" node bin/rg_run.js program.rgr
```

The design notes, and the reasoning behind the two-half split, are in
[`PLAN_RANGER_ENGINE.md`](../../PLAN_RANGER_ENGINE.md).
