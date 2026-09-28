# CEr — ComponentEngine's JavaScript evaluator as a strict Rust module

An experiment beside [`interp`](../interp), which it does not replace: a
JavaScript engine written once in Rust (`src/`, a strict module in the sense
of `docs/plans/PLAN_RUST_SYNTAX.md`) and built two ways:

- by **cargo** into native code (`cargo run --release --bin cer -- file.js`);
- by **`rgrc`** into the Ranger targets, like any `.rs` module:
  `npm run cer:build` writes `bin/Cer.cjs`, and `bench/CerMain.rgr` — a
  Ranger program importing `src/lib.rs` — builds for C++ and Go.

The questions: how much of what ComponentEngine runs does it run, and how
fast is it, natively and as Ranger output, next to ComponentEngine itself?

```sh
npm run cer:conformance      # ComponentEngine's runtime-conformance probes
npm run cer:micro            # ComponentEngine's micro benchmark workloads
npm run cer:octane           # the Octane suites of interp/bench/zoo_octane
npx vitest run --config tests/vitest.config.ts cer.test.ts
```

`bench/micro.mjs` and `bench/octane.mjs` take `--engines=` with any of
`node`, `ce-js` (ComponentEngine's es6 build), `cer-rust`, `cer-js`,
`cer-cpp`, `cer-go`; they build what they need.

## How it works

- `lexer.rs`, `parser.rs`: tokens, then a tree in an arena (a node is an
  index). ES5 and the common later forms: `let` / `const`, arrow functions,
  classes (fields, accessors, `static`, `extends`, `super`), template
  literals, spread and rest, destructuring with defaults, `for … of`,
  optional chaining, `??`, `**`, shorthand members. Class fields and static
  blocks become two synthetic methods in the parser.
- `compiler.rs`: two passes. The first builds the scopes, hoists `var` and
  function declarations and resolves every name, marking a binding captured
  when a nested function reaches it. The second places each binding — a
  stack slot, a slot of its scope's heap object when captured (one per
  block that needs it, copied per iteration for `for (let …)`), or a
  property of the global object — and writes bytecode for a stack machine
  (`ops.rs`). `finally` blocks are inlined on the exits that cross them.
- `vm.rs`: the interpreter loop and the heap. Objects live in an arena and a
  value is an index (`value.rs`); strings are shared `Rc<String>`. Property
  reads and writes carry an inline cache of the slot found last time, method
  calls one for the prototype's slot. Property names are interned atoms.
  `f.call` / `f.apply` run inside the loop. A mark-and-sweep collector runs
  at calls and backward jumps.
- `builtins.rs`, `builtins2.rs`: Object, Function, Array, String, Number,
  Boolean, Symbol, the Error family, Math, JSON, Reflect, RegExp, Date
  (UTC), Map / Set / WeakMap / WeakSet, a small Promise with a job queue,
  URI functions.
- `regex.rs`: a backtracking matcher over UTF-16 units: groups (named too),
  back references, lookahead and lookbehind, lazy quantifiers, classes, the
  flags `gimsuy`.

Not there: generators, `async` / `await` (parsed, run as plain calls),
Proxy, typed arrays, BigInt (literals read as numbers), `with`, `eval`,
modules, Intl, Unicode normalization and locale-aware collation.

## Conformance

`bench/conformance.mjs` runs the 2,143 probes of
`tests/runtime-conformance.test.ts` — each the body of a function whose value
Node gives — through CEr, one engine per probe.

| | agrees with Node |
| --- | ---: |
| ComponentEngine | 2,143 (its KNOWN_GAPS list is empty) |
| CEr, native | 1,580 |

Every probe CEr gets right ComponentEngine gets right too. Where CEr falls
short, by the probe groups: the unicode group (92 of 191: no normalization,
no locale collation), async (10 of 41), es2017 / es2018 / es2024 / es2025
(generators, async iteration, the newest built-ins), proxy (1 of 33), typed
arrays (1 of 20), holes (6 of 24: a hole is stored as `undefined`), `with`
(1 of 12), completion values (0 of 10) and Function.prototype.toString
(2 of 12). The number, regex, coercion, registry, object and string groups
all agree.

## Speed

### ComponentEngine's micro benchmark

The seven workloads of `interp/bench/bench.cjs`. Each script runs its
workload five times and reports the fastest, timed inside the script with
`performance.now`, so no engine's parsing or setup is counted. Every engine
gave Node's answer on every case. Milliseconds, one run on the development
container:

| case | Node | ComponentEngine (es6) | CEr rustc | CEr → JS | CEr → C++ | CEr → Go |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| loop | 0.10 | 2.20 | 2.49 | 9.67 | 21.8 | 15.1 |
| fib | 0.12 | 7.18 | 2.34 | 5.79 | 16.6 | 15.4 |
| strcat | 0.20 | 2.63 | 18.7 | 5.57 | 48.7 | 125 |
| array | 0.38 | 6.96 | 4.13 | 18.1 | 24.1 | 29.9 |
| object | 1.02 | 20.7 | 4.67 | 67.0 | 20.3 | 20.0 |
| method | 0.34 | 67.6 | 12.4 | 31.5 | 48.2 | 55.8 |
| regex | 1.01 | 62.5 | 8.64 | 25.4 | 39.3 | 41.7 |

### Octane

OCTANE_TABLE

## The Ranger targets

The same 16,000 lines compile with rgrc to JavaScript, C++ and Go without a
change of source for any one target. What the targets needed from the
source is the portable subset: byte access only through
`s.as_bytes()[i]` / `.len()`, no 64-bit bit operations (JavaScript's are 32
bits wide: `>>>` and `Math.imul` are computed in doubles or in 16-bit
halves), integers inside 32 bits (C++'s `int` is 32 bits: dates and
`ToInt32` go through doubles), negative zero made at run time (Go folds the
constant `-0.0` to +0), and `ranger::native!` for the string primitives the
JavaScript build would otherwise re-encode as UTF-8 on every call.

- JavaScript: the fixture scripts, the micro workloads and seven of the
  eight Octane suites give Node's answers.
- Go: all eight Octane suites pass their checks.
- C++: seven of eight; RegExp reports `Wrong checksum.` (not found yet).
  `Math.cbrt(27)` answers 3.0000000000000004, which is glibc's `cbrt`.

## Found on the way

Writing a 16,000-line interpreter in the subset found these, fixed in the
compiler, the prelude or the writers:

- An identifier pattern naming a constant (`match op { OP_ADD => … }`)
  bound a new variable instead of comparing: every `match` over opcodes took
  its first arm.
- A `for` loop's pattern was checked as a value moved in a previous
  iteration (`for a in args { v.push(a) }`).
- `matches!` was not in the subset; `char::from_u32` was not either.
- `-x` on a double lowered to `0.0 - x`, which is +0 for x = 0; a `-0.0`
  literal lost its sign.
- `f64::asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`, `asinh`,
  `acosh`, `atanh`, `cbrt`, `exp_m1`, `ln_1p`, `log2` had no templates.
- A public function with a `&mut String` / `&mut Vec` parameter failed the
  API check: its box class was not public.
- The Ranger writer left the parentheses out of nested infix expressions in
  macro expansions, so `!(a == b && c < d)` did not parse.
- `Vec::insert` lost its element on Go (a push inside the helper made a new
  slice); `arr[i] = v` of an enum value did not compile on Go.
- A NUL in a string literal was a raw byte on Go (a compile error) and ended
  the literal on C++ (`std::string("\0")` is empty).
- `ranger::native!` needed an arm for every target; the `rust` arm is now
  the fallback, lowered like the rest of the module.
- An enum whose payloads are all numbers, strings or `Rc` was deep-copied on
  every `clone()` on the reference targets; it is shared now. A literal
  `const` is written where it is used rather than called as a function.

One found and not fixed: mutating an enum payload through a `match` on a
`&mut` value (`V::N(n) => *n += 1.0`) compiles on the reference targets but
the change is lost; it should be written back or refused.
