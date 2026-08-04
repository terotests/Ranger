# TS engine — native compilation and performance

> **Update (branch `claude/ts-engine-native-perf-fixes`, 2026-08-03).** The
> two headline defects below are found and fixed; the numbers in the body of
> this document are kept as the historical baseline.
>
> **Why C++ was slower than JavaScript — two causes, both measured by
> callgrind on the `array_half` workload (62% of all instructions in
> `std::vector` copy-construction/destruction, 14% in `std::string`
> construction from literals):**
>
> 1. **The array path copied the whole backing vector on every builtin
>    call.** `invokeBuiltin`'s array block opened with
>    `def elems:[EvalValue] recv.arrayValue` — an alias on the es6 target,
>    a full `std::vector` copy on C++ — before dispatching, so every
>    `a.push(x)` copied the entire array first: O(n²) where the same source
>    is linear on es6. The copy is now skipped for the eight mutator names
>    (they write through `recv.arrayValue` directly and never read `elems`).
>    `array` fell from 1296 ms to 116 ms and the scaling canary from 4.9x
>    to ~1.9x for 2x elements (linear, same as the JS build).
> 2. **Every string comparison against a literal allocated.** The C++
>    writer emitted `name == std::string("push")` — 2016 sites, and the
>    interpreter's dispatch is a chain of such comparisons per call. The
>    writer now emits the literal bare (`name == "push"`,
>    `operator==(const std::string&, const char*)` — no construction).
>
> With both fixes the C++ build's geometric mean improved from **190x to
> 84x** vs Node (the JS build is 40x) — from ~4x slower than the JS build
> to ~2x — with every workload still returning the same answer. The
> remaining gap is the value model this document already describes (an
> `EvalValue` allocation per arithmetic result, red-black-tree maps per
> object), which suits V8's nursery and charges list price under malloc:
> the flat profile is now string-compare dispatch, `std::map::find` and
> `shared_ptr` traffic, with no single defect left on top.
>
> **Rust:** the backend work that landed on master since this document was
> written (the shared-class `Rc<RefCell<T>>` default, `&self` receivers,
> the borrow routing) plus this branch's fixes — the phantom-optional
> collection type drop (`let x :  = …` with a spurious `.unwrap()`), the
> statement-temp emitted inside a `let` initializer, `let`/`fn`/`mod` and
> other keywords as identifiers, cast parens in `<` comparisons
> (`x as i64 < 2` parses as generics), tail-expression borrows of body
> locals (E0597), and a move of a named String argument — take the
> **Both native targets now build AND answer correctly. The TS parser
> went from 37 errors to 0, and the interpreter from 676 to 0 — it
> compiles, runs, and produces the exact JavaScript answers on all 8
> benchmark cases** (keyorder included — see the key-order note below).
> Getting from "compiles" to "correct" took two runtime-semantics fixes
> on top of the borrow work: an unused `def` whose initializer CALLS
> something now emits as a live `let _x = …` instead of a comment (the
> for-loop update clause was silently dropped this way), and call sites
> borrow a receiver's RefCell in the mode the method actually needs —
> `borrow()` for `&self` methods — so an argument aliasing the receiver
> (`v.equals(objectProto)` where v IS the prototype) no longer panics.
> A conformance probe binary (`bench/native/probe_main.rgr`) evaluates
> one JS snippet from argv for quick divergence hunting.
>
> **Native benchmark, after the optimization rounds (engine work-only
> ms, interleaved same-session best-of-3; all three builds produce the
> same answers; the Node column runs the SAME improved engine source):**
>
> | case | engine on Node | Rust | C++ |
> |---|---|---|---|
> | loop | 53.5 | 34.4 | 33.9 |
> | fib | 25.3 | 23.2 | 24.6 |
> | strcat | 26.9 | 54.4 | 37.6 |
> | array | 84.4 | 65.0 | 74.3 |
> | object | 37.4 | 27.9 | 32.6 |
> | method | 64.3 | 60.0 | 58.9 |
> | regex | 39.8 | 33.7 | 38.8 |
>
> Geometric mean: **Rust 0.92x and C++ 0.93x — BOTH native targets are
> now FASTER than the same engine running on Node** (stable across
> repeated interleaved runs; Rust 0.89–0.93, C++ 0.91–0.94). Each beats
> V8 on six of seven cases; only `strcat` still loses, because V8's rope
> strings make `+=` amortized O(1) where immutable native strings copy
> the accumulator. The last two C++ steps: dropping the
> `std::string("")` assignments the constructor made to
> already-default-constructed members, and comparing literal strings as
> SIZED `std::string_view`s (the bare `s == "lit"` form paid a
> non-folded `strlen(lit)` per compare and had no length gate), plus
> converting the remaining ~134 `nodeType` string compares to the
> integer kind memo. Both targets started this branch
> unable to compile (Rust) or 4x-and-quadratic (C++). What got them
> here, in measured order of impact: integer-interned nodeType/operator
> dispatch, borrowed `&String` parameters, FxHash + bare-literal map
> keys, an insertion-ordered C++ map replacing `std::map`, memoised
> hoisting, a compiled-regex cache, small-integer value pooling,
> single-walk scope updates, and a thread-local freelist allocator
> (`-native-fast-alloc`). Remaining C++ gap: string local copies and
> `shared_ptr` release chains — value-model flattening territory.
>
> **Calibration against real JS engines (same session, same workload
> bodies run RAW — no interpreter — with JIT warmup; ms per run):**
>
> | case | raw V8 | raw QuickJS | engine/Node | engine/Rust | engine/C++ |
> |---|---|---|---|---|---|
> | loop | 0.036 | 0.78 | 55.4 | 34.2 | 33.8 |
> | fib | 0.175 | 0.86 | 25.6 | 22.9 | 24.6 |
> | strcat | 0.164 | 11.39 | 27.8 | 55.2 | 38.3 |
> | array | 0.304 | 2.03 | 93.6 | 66.2 | 77.2 |
> | object | 1.94 | 4.45 | 41.1 | 27.9 | 31.5 |
> | method | 0.663 | 4.98 | 67.1 | 62.2 | 58.3 |
> | regex | 1.50 | 7.23 | 45.1 | 35.4 | 39.2 |
>
> Geometric means: raw QuickJS is **8.8x** slower than warmed-up V8;
> the interpreter is **116x** (native builds) / **133x** (on Node)
> slower than raw V8, i.e. **~13x slower than QuickJS**. That is the
> honest weight class for a tree-walking AST interpreter against a
> bytecode interpreter (QuickJS) and a JIT (V8): the engine's closest
> races against QuickJS are the cases dominated by runtime work rather
> than dispatch — strcat 3.4x (C++), regex 4.9x, object 6.3x (Rust) —
> and the widest is `loop` at ~44x, which is pure dispatch overhead per
> AST node. Closing toward QuickJS's class would take a bytecode
> compilation stage, not more peephole work.
>
> **Key order: CLOSED.** Both native targets now enumerate keys exactly
> as JavaScript does — the `keyorder` canary answers
> `1,2,zebra,apple,mango|{"1":5,"2":4,...}` identically on Node, Rust
> and C++, making it **8 of 8 cases byte-identical across all three
> builds**. Three pieces: the C++ `rg_ordered_map` and a mirrored Rust
> `RgOrderedMap` (vector entries + open-addressed FxHash index, aliased
> over the `HashMap` name so declarations are untouched) keep INSERTION
> order, and the engine's two key-listing helpers apply the ES2015
> integer-first rule (`orderEnumKeys`: canonical array indices ascending,
> then insertion order) in one place, so `Object.keys`, `for-in` and
> `JSON.stringify` all agree. The ordered maps cost nothing measurable —
> the benchmark still reads Rust 0.91x / C++ 0.88x vs engine-on-Node.
>
> **Static-string promotion (`&'static str`), 2026-08-04.** Ranger
> strings are immutable values, so a string field or local whose every
> written value is a string LITERAL — or a copy of another such string —
> never needs an owned `String`. A new whole-program fixpoint pass
> (`StaticAnalyzer.analyzeRustStaticStrings`, rust-only) promotes such
> descs to `rust_static_str`; the writer then emits the field/local as
> `&'static str`, assignments as bare pointer copies
> (`fnNode.borrow_mut().nodeType = "FunctionExpression";` — previously
> `"FunctionExpression".to_string()`, an allocation per assignment), and
> converts with `.to_string()` only where a static value flows into an
> owned `String` position (returns, map inserts, array pushes, owned
> parameters). Sources that demote: any computed value (concat, call
> result, element read); demotions propagate over desc-to-desc copy
> edges to a fixpoint, and the Rust type system turns any flow the pass
> mis-judges into a compile error, never silent corruption. In the same
> change, borrowed read-only string parameters moved from `&String` to
> `&str` (call sites coerce, string-literal arguments now pass BARE
> instead of `&"lit".to_string()`), which deleted that allocation from
> every literal-argument call. In the engine: `nodeType`, `declKind` and
> friends are `&'static str`, all 224 `nodeType = "…"` assignments are
> pointer copies, and total `.to_string()` calls dropped 2592 → 2305.
> A/B on one machine (same rustc flags, interleaved, best-of-3):
> geomean **0.967x** vs the pre-change Rust engine — loop −6%, fib
> −10%, nothing slower. C++ output is byte-identical (the analysis runs
> only for the Rust target). Parameters and returns are not yet
> promoted — a `kind:string` parameter assigned only literals at every
> call site still takes owned `String` (`tokenType` stays owned for
> this reason); interprocedural promotion through call-site arguments
> is the natural next step.

Where the TypeScript/JavaScript interpreter (`gallery/game_engine/v2/interp`)
stands when compiled to a native target, why the C++ build is currently slower
than the JavaScript one, and why the Rust build does not compile at all.

Measured 2026-08-03 on `origin/master` (`4586fc70`), g++ 13.3.0, rustc 1.94.1,
Node 22.22.2. Harness: `gallery/game_engine/v2/interp/bench/native/`.

---

## Summary

| Target | Ranger → target | Native toolchain | Runs JS | Speed |
|---|---|---|---|---|
| es6 (Node) | passes | — | yes | **48x slower than Node**, baseline for this table |
| cpp | passes | `g++ -O2` passes | yes | 190x slower than Node — **~4x slower than the es6 build** |
| rust | passes (32111 lines) | `rustc -O` **fails, 676 errors** | no | — |

Two things are worth stating plainly, because both cut against the usual
expectation that a native build is the fast one:

1. **The C++ build is slower than the JavaScript build**, by about 4x on a
   geometric mean over seven workloads.
2. **The C++ build is not conformant.** It enumerates object keys in sorted
   order rather than insertion order, so `Object.keys`, `for-in` and
   `JSON.stringify` all differ from JavaScript. The 6838/6839 test262 ES5 score
   in `gallery/game_engine/v2/interp/CONFORMANCE.md` is a property of the
   **JavaScript** build and does not transfer to the binary.

---

## 1. Rust: does not compile

`TARGET=rust bash gallery/game_engine/v2/interp/bench/native/build.sh`

The Ranger side is clean — the backend emits 32111 lines of Rust with no
compiler errors. `rustc -O` then rejects them with **676 errors**.

Getting the Ranger side to that point required five operator templates that were
simply absent for Rust: `M_PI`, `tan`, `to_lowercase`, `to_uppercase` and
`file_mtime`. An operator with no template for the active target resolves to
*no type*, and every binding that reads one inherits that, so their absence
surfaced as 15 apparently-unrelated type-inference failures rather than as
"this operator is missing". Those are now in `compiler/Lang.rgr`.

### What blocks rustc

Counted by distinct message, most frequent first:

| n | Error | What it is |
|---|---|---|
| 416 | `mismatched types` | broad: owned vs borrowed, `T` vs `Rc<RefCell<T>>`, `i64` vs `usize` |
| 35 | ``expected expression, found `let` statement`` | a temp emitted *into* a binding |
| 27 | ``no method named `has` for `&mut Rc<RefCell<EvalContext>>``` | method calls not routed through the borrow |
| 17 | ``no field `isHole` on `Rc<RefCell<EvalValue>>``` | field reads not routed through the borrow |
| 16 | ``cannot find value `context` in this scope`` | a captured field referenced as a bare local |
| 13 | ``expected type, found `=``` | the declared type is dropped |
| 11 | ``no method named `unwrap` for `Vec<String>``` | a non-optional treated as `Option` |

The last two rows are **one bug seen twice**. For

```ranger
def savedctorLabels:[string] this.activeLabels
```

the backend emits

```rust
let mut savedctorLabels :  = self.activeLabels.unwrap().clone();
```

— the declared `[string]` is lost *and* a spurious `.unwrap()` is added to a
field that was never optional. A local declared with an explicit type and
initialised from a field is common enough that this shape alone accounts for 24
errors.

### It is not simply that the interpreter is large

The TypeScript parser — a smaller, simpler program in the same repository —
fails the same way:

```
npm run tsparser:compile:rust     # Ranger -> Rust: OK
rustc -O gallery/ts_parser/bin/ts_parser_main.rs
                                  # 37 errors, same categories
```

Meanwhile the Rust gates themselves pass (`compiler-rust.test.ts` and
`codegen-rust.test.ts`, 67 checks). So the Rust backend is real and correct for
the programs it is tested against; the gap is between those programs and one of
this size and shape.

### Suggested order of attack

1. The empty-type / spurious-`unwrap` bug on `def x:T <field>` — one shape, 24
   errors, and the only one whose root cause is already pinned down.
2. The `let`-as-expression temp (35) — a statement emitted where an expression
   was required, so probably a single emit path.
3. Route field reads and method calls on a shared class through the `RefCell`
   borrow (44).

That is roughly 100 of 676. The remaining `mismatched types` bulk needs a
narrower reproduction than "the interpreter" — the TS parser at 37 errors is the
better harness for it.

---

## 2. C++: compiles, runs, and is slower

Nine errors blocked the C++ build, all from one cause: a local named `short` in
`Regex.rgr`. The compiler has a per-target reserved-word table in
`compiler/Lang.rgr`; `short` and eighteen other C++ keywords were missing from
it. With those added the engine compiles clean and every workload returns the
same answer as Node.

```
case        node ms   js engine   cpp engine  |  js/node  cpp/node   cpp vs js
loop           0.65        56.8        149.6  |      87x      230x       0.38x
fib            0.47        37.3        126.3  |      80x      271x       0.30x
strcat         0.52        31.4        115.3  |      60x      220x       0.27x
array          1.51        96.2       2186.6  |      64x     1452x       0.04x
object         2.32        43.7        116.5  |      19x       50x       0.38x
method         2.10        87.7        252.0  |      42x      120x       0.35x
regex          1.77        46.6        132.4  |      26x       75x       0.35x
geometric mean vs Node:  js engine 48x,  cpp engine 190x
```

`-O3` was measured and is worth 0–4%. The cost is not instruction scheduling.

### Why the native build is the bottleneck

**The value model is written for a tracing GC, and C++ charges list price for
it.** Every `EvalValue` carries three `std::vector`s and four `std::map`s:

```cpp
class EvalValue {
    std::vector<std::shared_ptr<EvalValue>> arrayValue;
    std::vector<std::shared_ptr<EvalValue>> mapVals;
    std::map<std::string, std::shared_ptr<EvalValue>> objectMap;
    std::map<std::string, std::shared_ptr<EvalValue>> getterMap;
    std::map<std::string, std::shared_ptr<EvalValue>> setterMap;
    std::vector<std::shared_ptr<EvalValue>> boundArgs;
    std::map<std::string, int> attrFlags;
    std::map<std::string, bool> suppressedKeys;
    ...
};
```

One of these is allocated for **every arithmetic result**. On V8 those are
nursery allocations that a generational collector sweeps in bulk — the same
profiling that drove the recent 5x speedup on recursive calls showed 50% of time
in GC, which is the price of that model *and also* what makes it cheap. In C++
each is a separate allocation freed by `shared_ptr` refcounting, and each
`std::map` is a red-black tree with a node allocation per key. The engine
allocates the way a JavaScript program does, because it is one.

**The array path is superlinear.** `run.cjs` measures this on every run:

```
array scaling (20000 vs 10000 elements; 2x = linear)
  js engine   96.2 / 54.6 = 1.76x
  cpp engine  2186.6 / 377.1 = 5.80x
```

Doubling the element count costs the C++ build nearly six times the work, where
the same source is linear on the JavaScript target. That is a **codegen defect,
not a property of C++** — something on the array path is copying rather than
sharing. Until it is found, the `array` row measures that defect and nothing
else, and it drags the geometric mean: excluding it, the C++ build is roughly
3x slower than the JavaScript one rather than 4x.

### The binary is not conformant

`run.cjs` ends with a canary, and it fails:

```
keyorder   node: 1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}
           js:   1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}   OK
           cpp:  1,2,apple,mango,zebra|{"1":5,"2":4,"apple":2,"mango":3,"zebra":1}   DIVERGES
```

JavaScript enumerates string keys in **insertion** order. A Ranger string map
becomes a JavaScript object on the es6 target — insertion-ordered, so correct by
construction — and `std::map` on the C++ target, which is **sorted**.

Switching the C++ map template to `std::unordered_map` would be faster but is
**not** a fix: unordered is a third wrong answer rather than the right one.
Insertion order needs an insertion-ordered container (an index vector alongside
the map, or a small ordered-map type in the C++ runtime support).

---

## 3. Open question: was the native build previously faster?

The observation prompting this document is that the engine used to be
considerably faster natively than it is now. **This has not been verified**, and
nothing measured here confirms or refutes it — the numbers above are a first
reading of the native target for this engine, with no earlier native reading to
compare against. Recorded so the question is not lost:

- No native benchmark for the interpreter exists in the repository's history;
  `bench/native/` is the first. There is no baseline to regress against.
- `gallery/ts_parser/benchmark/benchmark_native.ps1` compares Rust, C++, Go and
  Node builds of the **TS parser**, but the committed
  `gallery/ts_parser/benchmark/README.md` records only the JavaScript-parser
  comparison — no native numbers are checked in.

The cheapest way to settle it, and the one worth doing first:

1. **Build the TS parser to C++ and compare it against its own JavaScript
   build.** The parser and the interpreter share a backend but not a value
   model — the parser's `TSNode` is a plain struct, while `EvalValue` is the
   allocation-heavy shape above. If the parser's C++ build is *faster* than its
   JavaScript build, the C++ backend is fine and the interpreter's value model
   is the whole story. If the parser's C++ build is *also* slower, something
   regressed in the backend and the parser is the smaller reproduction.
2. If (1) points at a backend regression, bisect `compiler/Lang.rgr` and the C++
   emit path across the recent shared-class/ownership work.

Until (1) is run, "the C++ engine is the bottleneck" is supported by the
measurements here, but "it used to be faster" is not yet distinguishable from
"it was never measured".

---

## 4. What to fix, in order

1. **C++ array path superlinearity.** A 5.80x cost for a 2x input is the single
   largest number in this document, and it is a defect rather than a trade-off.
2. **C++ map ordering.** The native build is not running JavaScript until this
   is fixed, whatever its speed.
3. **Run the parser C++ comparison in §3.** It decides whether the remaining
   slowness is the value model (redesign) or a backend regression (bisect).
4. **Rust: the `def x:T <field>` bug**, then the `let`-as-expression temp, then
   the `RefCell` routing.

The value model itself — nine allocations per `EvalValue` — is a real cost on
any non-GC target, but it is deliberate and it is what makes the JavaScript
build fast. Changing it is a redesign, not a fix, and should wait until (1)–(3)
have said how much of the gap it actually accounts for.

---

## Reproducing

```bash
bash gallery/game_engine/v2/interp/bench/native/build.sh   # Ranger -> C++ -> binary
node gallery/game_engine/v2/interp/bench/native/run.cjs    # three-way comparison
TARGET=rust bash gallery/game_engine/v2/interp/bench/native/build.sh
                                                           # generates Rust, fails in rustc
npm run interp:bench                                       # JS build vs Node only
```

See `gallery/game_engine/v2/interp/bench/native/README.md` and `RUST.md` for the
harness details, and `gallery/game_engine/v2/interp/CONFORMANCE.md` for what the
JavaScript build is measured against.
