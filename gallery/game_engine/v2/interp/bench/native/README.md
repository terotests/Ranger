# The interpreter as a native binary

The interpreter compiles to C++ and runs JavaScript from a `g++ -O2` binary.
This folder builds it and measures it against the two other ways the same engine
runs: as JavaScript under Node, and against Node executing the script directly.

```bash
bash build.sh                 # Ranger -> C++ -> engine_bench
node run.cjs                  # the three-way comparison
TARGET=rust bash build.sh     # Ranger -> Rust -> engine_bench; see RUST.md
TARGET=go bash build.sh       # Ranger -> Go -> engine_bench
TARGET=kotlin bash build.sh   # Ranger -> Kotlin -> engine_bench.jar
TARGET=python bash build.sh   # Ranger -> Python -> engine_bench.py
TARGET=csharp bash build.sh   # Ranger -> C# -> engine_bench.exe
TARGET=swift6 bash build.sh   # Ranger -> Swift (needs a Swift toolchain to build)
```

Each target after the Ranger step is skipped when its compiler is not on the
machine; the generated source is still written, which is what
`npm run test:tsengine` (`tests/ts-engine-targets.test.ts`) checks. That test
also builds and runs the Go, Python and C# results wherever those toolchains
exist and compares their answers on all seven workloads against the ones Node
gives for the same JavaScript.

`bench_main.rgr` holds the same seven workloads as `../bench.cjs`, at the same
sizes. The language has no clock operator, so the binary times nothing itself: a
`reps=0` run does the startup work and no iterations, a `reps=N` run does N, and
`run.cjs` subtracts. That is the same subtraction the in-process columns make
against their own empty case, so all three columns are measured alike.

## The result

It works — every workload returns the same answer from the C++ binary as from
Node — and the two divergences this README used to document are fixed and now
only guarded:

```
case        node ms   js engine   cpp engine  |  js/node  cpp/node   cpp vs js
loop          0.41        25.8         18.8  |      63x       46x       1.37x
fib           0.36        40.8         35.0  |     113x       97x       1.17x
strcat        0.55        9.89         9.91  |      18x       18x       1.00x
array         1.14        48.4         35.0  |      42x       31x       1.38x
object        1.68        44.7         53.9  |      27x       32x       0.83x
method        1.69        78.6         67.1  |      47x       40x       1.17x
regex         1.56        67.4         74.7  |      43x       48x       0.90x
geometric mean vs Node:  js engine 43x,  cpp engine 40x
```

The C++ build is now FASTER than the JavaScript build overall (1.10x) and
wins five of the seven rows. It started this work at 190x vs Node with a
quadratic array row. Two families of change closed the distance.

**The union stopped being copied gratuitously.** Kind checks and primitive
accessors pass `body` straight to the static predicate; read-only shape
parameters pass as `const r_union_X&` on C++ and `&union_X` on Rust; a case
that carries a string rides behind a pointer in the variant like the
collection cases (content equality is untouched — the generated
`__ops::equals` compares fields for `@(value)` cases whatever their
representation); and the Rust build collapses the writer's stacked
`.clone().clone()` pairs in `build.sh`.

**The interpreter stopped allocating results nobody reads.** The engine's
slot analysis (a per-body escape scan) already proved which bindings never
leak their value object; on top of it:

- Loop tests (`i < 50000`, `j < a.length`) compare two doubles and mint
  nothing — `evaluateCondBool` drives the relational through the transient
  evaluator, whose admitted shapes may be re-evaluated on a fallback
  without observable effect.
- The transient evaluator now answers `a.length`, `s.length` and dense
  in-bounds `a[j]` number reads without a value object OR a property-key
  string. A monotone `everHadAccessor` flag on the property bag rules out
  observable getters without minting the key; any miss (hole, non-number,
  accessor history) falls back to the ordinary path.
- `i++;` in statement position bumps the slot in place; the completion
  value (observable only through `eval`, whose mention disables slots
  altogether) comes from the interned small-int pool.
- `s += "…"` on a proven-unshared string binding APPENDS IN PLACE through
  the new `str_append` operator — amortized O(len) on C++/Rust's mutable
  strings, `a = a + b` elsewhere, and the es6 build keeps V8's rope. That
  is what took `strcat` from the worst row to parity: the escape scan
  (extended to see that `.length` and index reads retain nothing) proves
  the accumulator has no aliases, so the append cannot be observed.

The Rust build (`TARGET=rust bash build.sh`) compiles and answers every
workload identically as well — strcat 12 ms, array 47, loop 19 on this
machine. See `RUST.md` for the writer bugs that stood in the way, including
the one that made recursion exponential.

(Numbers move with the machine; the ratios are the stable part. `-O3` was
measured and is worth 0–4% — the cost is not instruction scheduling.)

**The value model suits a tracing GC, not `malloc`.** Every reference
`EvalValue` carries collection payloads, and a fresh value is allocated for
every arithmetic result the slot machinery cannot prove private. On V8 those
are nursery allocations a generational collector sweeps in bulk. In C++ each
is a separate allocation freed by `shared_ptr` refcounting. The engine
allocates the way a JavaScript program does because it *is* a JavaScript
program; the C++ target pays list price for it — which is why the remaining
work is about not allocating at all rather than allocating faster.

**The array path used to be superlinear, and the scaling check watches it.**
`EvHandle`'s storage writers (`arrPush`, `setIndexAt`, `mapSet`, `setAdd`,
Array#pop) used to copy the whole backing vector out of the `EvalValue.Array`
case and rebuild the case per element — invisible on the es6 target, where the
"copy" binds the live array, but O(n) per write on the value-vector C++ target,
which made a push loop O(n²). They now mutate the case payload in place through
the narrowing (the payload is shared on every target: `shared_ptr` in the C++
variant, `Rc<RefCell>` in the Rust enum, a pointer on Go), and both builds are
linear:

```
array scaling (20000 vs 10000 elements; 2x = linear)
  js engine   48.4 / 24.4 = 1.99x
  cpp engine  35.0 / 18.9 = 1.85x
```

(The Rust build measures 1.95x on the same check.)

## Conformance canaries

`run.cjs` ends with a key-order canary, and it passes on both builds:

```
keyorder   node: 1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}
           js:   1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}   OK
           cpp:  1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}   OK
```

JavaScript enumerates string keys in **insertion** order. A Ranger string map
becomes a JavaScript object on the es6 target, which is insertion-ordered and
therefore correct by construction; the C++ target used to back it with
`std::map`, which is sorted and made `Object.keys`, `for-in` and
`JSON.stringify` come out in the wrong order. It is now `rg_ordered_map` —
vector storage in insertion order plus an open-addressed hash index — so the
native build agrees, and is faster than the red-black tree was. The canary
stays, because the property only holds while the container keeps it.

The conformance score in `../../CONFORMANCE.md` — 6838/6839 — is still measured
on the JavaScript build only; the native binary's guarantee is the seven
answer-equality checks plus the canaries here, not that suite.

## Against QuickJS

`vs_quickjs.cjs` runs the same seven bodies through `qjs` (2021.03.27 here)
and divides. The interesting column is the last one — the whole E4 review
started from a C++/QJS `array` ratio of 3451x:

```
case      raw Node raw QuickJS   eng/ES6   eng/C++ | ES6/QJS   C++/QJS
loop         0.490       0.506      20.1      14.2  |   39.7x     28.0x
fib          0.348       0.532      27.5      26.8  |   51.7x     50.4x
strcat       0.465       7.859       7.8       7.6  |    1.0x      1.0x
array        1.114       1.172      31.5      18.3  |   26.9x     15.6x
object       1.444       2.574      38.1      43.7  |   14.8x     17.0x
method       1.467       2.965      62.8      52.1  |   21.2x     17.6x
regex        1.380       4.484      41.4      63.2  |    9.2x     14.1x
geomean      0.824       1.886      28.0      25.8  |   14.8x     13.7x
```

The C++ geomean against QuickJS went 63x → 13.7x over this work (the es6
build: 20x → 14.8x). `strcat` is the row to stare at: the INTERPRETER now
concatenates as fast as QuickJS runs the same loop natively, because qjs
copies the accumulator per `+=` while the slot machinery appends in place.
The `array` row's last big cut came from a CALL-SITE INLINE CACHE: a method
call that resolved to a registry built-in memoises an opcode on its AST node,
valid while a dispatch EPOCH stands still. The epoch bumps whenever a
built-in prototype is minted, written or suppressed, and the per-call guards
(receiver kind, zero own properties via a maintained slot count, no
per-instance prototype) prove the full resolution would land in the same
place — so `a.push(x)` skips the registry probes, the deleted/overridden
checks and the name-compare chain, and goes straight to the store.

## What this folder is for

Not to claim a native speedup — there isn't one yet. It exists so that the
claim can be checked: the workloads are shared with the JavaScript benchmark,
every case asserts all three targets agree before its timing is reported, and
the two ways the native build used to diverge (key order, array scaling) are
measured on every run rather than remembered.
