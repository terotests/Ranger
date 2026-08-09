# TS engine — native compilation and performance

> **Update (2026-08-09): Dart joins the gate.** The engine compiles to
> **Go, Kotlin, Python, C#, Swift 6 and Dart** as well as C++ and Rust. Go,
> Kotlin, Python, C# and Dart each build with their own toolchain and answer
> the Node benchmark cases exactly as Node does. Swift 6 gets as far as the
> compiler accepting the program and writing all ~31k lines; a Swift toolchain
> is not always available in CI, so that column is compile-only there.
>
> `tests/ts-engine-targets.test.ts` guards the set: it compiles the engine to
> each target, and builds and runs the Go, Python, C# and Dart results wherever
> those toolchains exist. It has its own config for the reason `syntax-app`
> does — a minute of blocking child processes starves the Vitest reporter — so
> it runs as `npm run test:tsengine` rather than inside `npm test`. Kotlin is
> compiled but not built there: `kotlinc` takes several minutes on a file this
> size.
>
> **What had to be fixed.** Two defects turned out to be the *same* defect on
> three different targets, and it is the interesting one:
>
> **An unused `def` whose initializer is a CALL was being commented out**, so
> the call disappeared. `def ignored:T (this.work())` is the language's
> evaluate-and-discard form, and the TypeScript engine writes its for-loop
> update clause that way. On Go and Python the result did not compile; on C#
> it compiled and *ran*, with every `for` loop looping until the interpreter's
> own iteration guard stopped it — `loop` answered 0 instead of
> 1249975000. Rust had the same bug and it was fixed on master; Go, Python and
> C# now keep the statement live under an underscore name.
>
> The rest, by target. `compiler/Lang.rgr`: **Go** refuses `1.0 / 0.0` at
> compile time when both sides are constants, and **Python** raises on it —
> both go through a helper now, because Infinity and NaN are how the engine
> spells them. **Python** had no `shell_arg`, `shell_arg_cnt` or `file_mtime`,
> and `(get map key)` fell through to `m[k]`, which raises instead of
> answering the empty optional. **Kotlin** gained the whole `buffer` /
> `int_buffer` / `double_buffer` family, the bitwise operators (`and`, `shl`,
> `inv()` — not the C spellings), `file_mtime` and `file_exists`, and its
> `shell_arg_cnt` counted one argument too few. **C#** had no `random`, no
> `to_string` for a double or a boolean (it fell through to the JavaScript
> `.toString()`), and `(get map key)` threw on a miss.
>
> In the writers: **Go** wrote an empty type assertion `.value.(())` for
> `(unwrap (get map key))`, had no `__singleton` accessor, and emitted locals
> Go rejects as "declared and not used". **Kotlin** sliced double literals out
> of the source text by file position, which a CRLF file shifts
> (`def value:double 0.0` wrote `= lue`); rewrote `EVGColor.create(...)` to
> `this.create(...)`, which cannot reach a companion object; marked
> `equals(other:T)` `override` when `Any.equals` takes `Any?`; left `$`
> unescaped in string literals; and called methods on a nullable receiver
> without `!!`. **Swift 6** had that last defect too. **Python** emitted
> nothing for an empty block, so the `if:` above it had no body, and had no
> `utilities` tag, so every `create_polyfill` was written to a writer nobody
> read. **C#** declared an optional primitive as a plain value type rather
> than `T?`, gave every constructor private visibility, and wrote method
> *declarations* with the un-renamed name while the *call sites* already used
> the reserved-word rename — so `EvalValue.string(...)` never resolved.
>
> **Same-session measurement** (engine work-only ms, best of three, native
> builds measured out-of-process with the `reps=0` startup cost subtracted —
> the same subtraction `run.cjs` makes):
>
> | case | engine on Node | C++ | Go | C# (Mono) | Kotlin (JVM) | Python |
> |---|---|---|---|---|---|---|
> | loop | 30.7 | 24.4 | 95.0 | 83.6 | 110.3 | 526.9 |
> | fib | 15.4 | 18.5 | 24.7 | 47.0 | 78.6 | 487.2 |
> | strcat | 18.9 | 29.4 | 161.6 | 429.1 | 176.6 | 245.6 |
> | array | 63.5 | 109.0 | 117.4 | 174.9 | 128.7 | 955.3 |
> | object | 32.0 | 31.8 | 59.7 | 82.1 | 83.9 | 472.4 |
> | method | 43.4 | 43.0 | 99.1 | 132.0 | 134.4 | 969.4 |
> | regex | 34.4 | 35.5 | 79.0 | 87.1 | 103.8 | 645.6 |
>
> None of the four new targets has had any of the optimization work C++ and
> Rust got, so read these as a starting line rather than a verdict. Two
> caveats on top of that: the Kotlin column runs three reps per process, which
> barely warms the JIT up and understates the JVM by an unknown amount; and the
> C# column is Mono 6.8, not .NET — a modern .NET build would very likely read
> differently. The rows worth a look on their own are `strcat` on C# and Go
> (the immutable-string accumulator cost the C++ build pays, without the
> reserve) and everything on Python.
>
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

---

## 5. LLVM: an earlier-stage target than Rust

Attempted 2026-08-03, clang/llc 18.1.3. **No binary was produced**, for either the
engine or the parser.

### The engine: 247 errors, all missing operator templates

`-l=llvm` on the interpreter fails in Ranger codegen, before any IR is written.
The LLVM backend has **40 operator templates in `compiler/Lang.rgr`, against 172
for C++ and 148 for Rust** — roughly a quarter of the surface. Missing families,
by error count: `indexOf` (35), `keys` (27), `itemAt` (17), `array_length` (17),
plus `push`, `contains`, `unwrap`, `get`/`set` on several signatures, `M_PI`,
`tan`, `to_lowercase`, `to_uppercase`.

The apparent failures on core operators — `if` (20), `while` (16), `<` (16),
`>=` (20) — are **cascades, not separate bugs**. An operator with no template
for the active target resolves to *no type*, and every comparison and branch
reading its result inherits that. It is the same failure shape the missing Rust
operator templates produced, and the same shape that made those look like 15
unrelated type-inference errors.

### The parser: codegen passes, and the IR does not link

The TypeScript parser is the useful calibration point, because it compiles to
LLVM IR with **zero** Ranger-side errors and emits 3.4 MB of IR. clang then
rejects that IR. Fixing each error exposes the next:

| # | clang error | Cause | Status |
|---|---|---|---|
| 1 | ``use of undefined value `%floor` `` | `floor` had no `llvm` template, so it fell through to the `*` catch-all — which is JavaScript's `Math.floor(...)` — and became a bare SSA reference nothing defined | **fixed** |
| 2 | ``'%.c13' defined with type 'i64' but expected 'i32'`` | pushing one ptr-array's element into another emitted `zext i32 <i64 value> to i64`; `exprIsObjectPtr` only recognises VRefs, so an `itemAt` result was treated as a scalar | **fixed** |
| 3 | ``'%.c75' defined with type 'i64' but expected 'ptr'`` | a string element read from a ptr array is `i64`, and every consumer (`ranger_strdup`, concat, compare) takes `i8*` | open |
| 4 | ``use of undefined value `%.cast14` `` | reached while attempting (3): a cast is *named* in an instruction but its defining instruction is never emitted | open |

Fixes 1 and 2 are in this branch and were verified not to move any gate. Fix 3
was attempted and reverted: casting at the read site alone leaves the write side
inconsistent and surfaced (4), which is a builder-internals problem rather than a
missing cast.

The root issue behind (3) and (4) is representational: pointer-array elements are
stored as `i64` and every use site needs its own cast rule, applied ad hoc.
Making string elements pointer-typed means changing the read, the write and the
push paths together.

### Why it drifted: the gate was switched off — now fixed

**Update: the gate is green and back in `npm test`.** All 37 LLVM/WAT tests
pass, and the exclusion is gone from `tests/vitest.config.ts`.

Three backend bugs were behind the red suite, all of the same kind — codegen
reporting success while emitting IR the toolchain rejects:

| Bug | Cause |
|---|---|
| `@ranger_cli_init` called but never declared | the declaration lived only in `ensureLibcExtern`, which runs for libc targets, while the call is emitted for every `@main` |
| `%heap_next` defined twice in one function | the bump allocator used a fixed SSA name for its pointer update |
| `call $realloc` against nothing | three targets, three answers: libc has `realloc`, the free-list heap has `Heap_realloc`, and plain `-freestanding` has a bump allocator with neither |

Eleven of the seventeen failures were simpler: the native tests linked only
`runtime/ranger_mem.c` and not `runtime/ranger_rt.c`, so they failed on the
`ranger_cli_init` symbol at link time.

Every `.ll` the suite produces is now checked with `opt -passes=verify` in
addition to its content assertions. That is the part that matters for the
future: all three bugs above satisfied every `toContain` check in the suite and
failed at clang. A string match cannot see invalid IR.

### The parser now links — 283 KB, and it is the smallest binary of the three

Continued after the fixes above. The TypeScript parser reaches a **linked,
running LLVM binary**, and its IR passes `opt -passes=verify` clean.

Same program, same machine, both `-O2`:

| Build | Binary | Stripped | Works |
|---|---|---|---|
| **LLVM** (`clang` + `ranger_rt.c` + `ranger_mem.c`) | **283 KB** | 278 KB | starts, prints help, **segfaults on the demo workload** |
| C++ (`g++`, libstdc++) | 469 KB | 426 KB | yes |

So the size premise holds — **the LLVM build is 1.7x smaller**, and that gap is
the libstdc++ and STL instantiation weight the C++ target carries. It is not yet
a working parser: something on the demo path faults, and that is the next thing
to chase.

Six more backend bugs were fixed to get there, each found by linking and each a
type-representation mistake rather than a missing feature:

| Bug | Fix |
|---|---|
| a string element read from a ptr array was a raw `i64` where every consumer takes `i8*` | `inttoptr` on the way out, `ptrtoint` on the way in — a `push(get(x))` round trip folds to a no-op |
| `emitCast("ptrtoint" …)` produced an instruction the writer had no case for | use the existing `ptr_to_int` / `inttoptr_i8` ops |
| `def names:[string] (this.collect())` never recorded its element type | the call path was missing the `isStringArrayTypeNode` case the no-initialiser path documents |
| `(itemAt names a) == (itemAt names b)` compared ADDRESSES | `exprIsStringish` now recognises an element read from a `[string]` array, so it routes to `strcmp` |
| `if (node.left)` on an optional reference emitted `icmp ne i32 <i64 value>, 0` | pointer-sized conditions and comparisons are tested in the pointer type |
| `push xs (this.parseThing())` widened an i64 with `zext i32` | a call returning a class counts as pointer-sized |

### It no longer crashes — the parser is correct on both workloads

Continued. The binary now parses the 1148-line sample and prints its AST
**byte-for-byte identically to the JavaScript build** (147 lines on the demo,
2440 on the large file), and valgrind reports **0 errors** on both.

Three bugs, found by debugger and valgrind rather than by reading:

**1. Type descriptors disagreed with the struct layout.** `fieldByteOffset`
aligned each field before adding its *size*, but answered for the target field
**without aligning it first**. In a struct laid out `{ … i32, i64 … }` the i64
was reported at 44 where LLVM puts it at 48 — so the object destructor read a
pointer out of the seam between two fields and called `free()` on it. It was
`free(0x555c453000000000)`, a value made of two half-fields. Every class with a
narrow field before a wide one had a wrong descriptor.

**2. Assigning one owned local to another double-freed.** `left = nullish`
between two owned object locals left both slots pointing at one object, and each
released it at scope end. `x = (new T)` had release-before-reassign handling;
`x = y` had none, so ownership was copied rather than moved. This is the shape
every precedence level of an expression parser is written in —

```ranger
def left (this.parseTernary())
while (this.matchValue("??")) {
    def nullish (new TSNode())
    nullish.left = left
    left = nullish          ; <- two owners, one object
}
return left                 ; <- returned, then freed by the other owner
```

— so `parseNullishCoalescing` freed the node it had just returned and the caller
wrote through a dangling pointer. The source local is now marked escaped:
ownership moves.

**3. Concatenating a double emitted `%d` and passed the f64 in an i32 slot.**
Every non-string concat operand was assumed to be an int. Format and argument
type are now chosen per operand, `%g` for a double — matching what `to_string`
already did.

### Size and speed, same program, same machine

| Build | Binary | Stripped | Parses large.ts | Output |
|---|---|---|---|---|
| **LLVM** (`clang -O2`, `ranger_rt.c` + `ranger_mem.c`) | **297 KB** | 283 KB | **85.9 ms** | identical |
| C++ (`g++ -O2`, libstdc++) | 469 KB | 426 KB | 1240.5 ms | identical |

Both print the same 2440 lines. The LLVM build is **1.6x smaller and 14x
faster** on this workload — the C++ figure is the `std::string`/`std::map` cost
this document describes elsewhere, on a program that does nothing but build and
walk a tree.

For reference the JavaScript build runs the *demo* in 67.8 ms; it cannot be
compared on `-i`, because its own file-reading path is broken — the ESM output
calls `require`, which does not exist in a module. That is a pre-existing bug in
the es6 target, unrelated to this work, and it means the native builds currently
do something the JavaScript one cannot.

### The writer silently dropped unknown instructions

Worth calling out separately, because it is why two of the above cost hours
rather than minutes. `writeInstr` emitted the two-space indent, ran a `switch`
on the op, and if no case matched wrote **nothing** — while the instruction's
SSA temp had already been handed to whatever consumed it. The module then
referenced a value nothing defined, and the only symptom was clang's "use of
undefined value" a long way from the cause.

It now compares the output line length across the switch and emits a
deliberately invalid `UNHANDLED-LOWIR-OP <op>` line when no case ran — the build
has to stop, not carry on producing a broken module.

### The original diagnosis, for the record

`tests/vitest.config.ts` line 9 excludes the LLVM suite from `npm test`:

```js
exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**", "**/compiler-llvm.test.ts"],
```

Run explicitly, `tests/compiler-llvm.test.ts` is **20 passed / 17 failed** — and
it fails identically with and without the fixes in this branch, so it was
already red when it was excluded. Both committed LLVM demo scripts are broken
too: `scripts/compile-ts-parser-llvm.sh` fails at the link step, and
`scripts/compile-jpeg-scaler-llvm.sh` fails in codegen on `buffer_alloc`.

```bash
npm run test:llvm      # or just `npm test`, which now includes it
```

### Is LLVM still the right route to a small binary?

Probably yes, and that is why the gap is worth closing. The LLVM path links
against `runtime/ranger_rt.c` and `runtime/ranger_mem.c` — a small hand-written
C runtime with **no libstdc++ dependency**. The 1.7 MB of the C++ binary is
mostly STL: `std::map` and `std::vector` template instantiations, plus iostreams.
An LLVM build would not pay for those.

No size figure is claimed here, because no binary exists to measure. The
statement is about what is *linked*, not about a measurement.

### Order of work

1. ~~Re-enable the gate~~ and ~~get the 17 failing tests passing~~ — **done**;
   37/37, in `npm test`, with IR verification on every compile.
2. **The ptr-array element representation** — (3) and (4) together. Reaching a
   linked parser binary would give the first real size measurement.
4. **The ~20 operator families for the engine.** Each needs a lowering in
   `compiler/ng_LowIRBuilder.rgr`, not just template text: the `llvm` entries in
   `Lang.rgr` are s-expressions consumed by the LowIR builder's intrinsic
   dispatch. This is a project, and it should follow (1)–(3), not precede them.

---

## `at` and `strlen` mean different things on different targets

Found while chasing why the C++ TS parser was 27x slower than the LLVM one.
The same four-character string, same program, three targets:

```ranger
def s:string "café"
```

| target | `strlen s` | `at s 3` | `at s 4` |
|---|---:|---|---|
| es6 / Node | **4** | `é` | undefined |
| C++ | **5** | `é` | (empty) |
| LLVM | **5** | `<0xC3>` | `<0xA9>` |

es6 counts **codepoints**; C++ and LLVM count **bytes**. es6 and C++ return a
codepoint from `at`; LLVM returns a single byte. Three targets, three
behaviours, on a string every JavaScript engine calls length 4.

### It also explains the speed gap

`r_utf8_char_at` on C++ walks the string from byte 0 on every call to find
codepoint `pos`. That is correct UTF-8 and **O(n²) to iterate one string** —
callgrind put **99.65% of all instructions** in it for the parser workload. The
LLVM runtime is O(1) because `ranger_char_at` indexes bytes, and
`runtime/ranger_rt.c` says so:

```c
/* substring: heap-allocated copy of bytes [start, end) of text.
 * Byte-indexed to match ranger_char_at semantics on this runtime. */
```

So the **27x LLVM-over-C++ figure on the parser is substantially a semantics
difference, not an optimisation**. It is recorded here rather than claimed as a
speedup.

### Why the obvious fix does not work

Detect ASCII, index bytes. Written and measured: **0% —** 1215.4 ms against
1215.2. Checking whether a string is ASCII is itself O(n), the same walk it
would replace, so there is nothing to gain per call.

A win needs the flag **cached with the string**, and caching it on the
`data()` pointer is unsound: allocators reuse addresses, so a later string of
the same size but different content would be byte-indexed and answer wrongly.
Ranger strings are immutable-ish (concat and substring allocate new ones), which
makes same-address-same-size reuse *more* likely, not less.

### The three options that do work

Each changes behaviour, so the choice belongs to whoever owns the semantics:

1. **Byte-index everywhere.** Make C++ `at`/`strlen` byte-based, matching LLVM.
   O(1), all native targets agree — and es6 becomes the odd one out, which
   matters because es6 is the target the conformance score is measured on.
2. **Codepoint-index everywhere.** Give LLVM the UTF-8 walk. Correct and
   consistent, and makes the LLVM build *slower* — the 27x would largely
   disappear, because it was never a real gap.
3. **Carry the flag on the string.** Replace raw `std::string` in the C++ target
   with a thin wrapper holding an `is_ascii` bit computed once at construction.
   Keeps UTF-8 correctness *and* gets O(1) for the ASCII case, which is the only
   option that has both. It is also much the largest change: every string-typed
   field, local, parameter and return in the emitted C++.

Option 3 is the right end state if `at` is meant to be UTF-8-aware. Option 1 is
the cheap one, and it is what the LLVM runtime already assumes.
