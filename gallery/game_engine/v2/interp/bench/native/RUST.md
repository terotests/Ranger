# The Rust target runs the interpreter

Recorded 2026-08-07, rustc 1.94.1. This file used to document why
`TARGET=rust bash build.sh` could not build the interpreter (676 rustc errors
at the first recording, 28 after the E4 storage migration). All of them are
fixed: the Rust binary now builds clean, answers all seven benchmark workloads
and the keyorder canary identically to Node, the es6 engine and the C++
binary, and the array path is linear (1.95x for 2x the elements).

`build.sh` still defaults to `cpp`; `TARGET=rust bash build.sh` produces
`bin/rust/engine_bench` (36.5k lines of generated Rust, `rustc -C opt-level=3`).

## What was actually wrong

Four writer bugs in `ng_RangerRustClassWriter.rgr`, found by building this
binary and running these workloads. Each one is general — none was specific to
the interpreter.

**1. An expression receiver of a `__self_rc` method dropped the hidden
argument (23 × E0061).** A method that uses `this` as a value takes the
receiver's Rc as a hidden first parameter, and the call site passes it. When
the receiver was an expression rather than a named local —
`(evaluateExpr(x)).toString()` — the emission had no name to pass and silently
passed nothing. Such calls are now wrapped in a block that binds the receiver
first: `{ let __t = EXPR; let __t_r = (__t).borrow_mut().m(&__t, …); __t_r }`
(the result rides through a binding because a block-tail expression keeps its
`RefMut` temporary alive past the receiver's drop, E0597).

**2. The hidden argument named de-shadowed locals by their source name
(5 × E0425).** The receiver itself is written through `WriteVRef`, which
prefers the de-shadowed `compiledName` (`left` → `left_1`); the hidden-arg
path rebuilt the name from the raw source path and emitted `&left` next to a
receiver spelled `left_1`. It now follows `compiledName` too.

**3. A bare `this` receiver routed through the expression-call path emitted
`(__self_rc).borrow()` — a guaranteed RefCell double-borrow panic.** Inside a
`&mut self` frame, borrowing the same cell again panics at runtime. The
expression-call path now recognises a `this` receiver (bare or wrapped in
expression nodes) and calls straight through `self.`, passing `__self_rc` on
when the callee needs it. Relatedly, `EvHandle.equals` now delegates to
`matches()` — the field-reading comparison that never takes a mutable borrow —
so `x == x` on the same pooled handle (undefined, an interned small int)
cannot panic either.

**4. A pre-extracted argument was evaluated a second time — recursion went
exponential.** To keep a nested self-call's borrow from overlapping its
enclosing call (E0502), the writer extracts it into a `let _tmp_N = …;` ahead
of the statement and marks the argument node to substitute the temp. Two of
the three call-emission paths never consulted the mark and re-walked the
argument, so the expression ran **twice** — harmless for a pure read,
catastrophic for `callResultOf(evaluateFunctionBodyValue(body))`, where it ran
every guest function body twice per frame: a recursive guest call tree cost
2^depth. Measured directly: `g(20)` counted 4,194,302 invocations instead
of 21, and `fib` (depth 20) did not finish in 150 s. With the substitution
honored everywhere, fib runs in ~85 ms.

## Where it stands

ms/run on this machine (reps=3 minus a reps=0 startup run, same subtraction
`run.cjs` makes), next to the C++ build measured the same way the same day:

| case | rust | cpp |
|---|---:|---:|
| loop | 78 | 45 |
| fib | 93 | 58 |
| strcat | 276 | 148 |
| array | 204 | 229 |
| object | 125 | 94 |
| method | 248 | 154 |
| regex | 158 | 143 |

Same league as C++ — ahead of it on `array`, behind on the string-heavy rows
(`Rc<RefCell>` borrows plus owned `String` clones on every property key).
All seven answers and the keyorder canary agree with Node.

## What to watch

- The interpreter exercises one deep path through the writer, not all of them.
  The four fixes above are general, but the next program through this target
  may find the next bug; keep `probe_main.rgr` around — arbitrary JS through
  the Rust engine is how the exponential-recursion bug was isolated
  (`./probe "function g(k){…} return g(20);"`).
- RefCell discipline is structural: any new `&mut self` method on a shared
  class that touches a cell it may alias will panic at runtime, not fail to
  compile. `matches()`-style field reads (shared borrows, no method calls on
  the other handle) are the pattern that survives.
