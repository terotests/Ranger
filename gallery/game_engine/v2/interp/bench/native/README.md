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
loop          0.31        49.0         44.9  |     158x      145x       1.09x
fib           0.24        48.9         57.6  |     207x      244x       0.85x
strcat        0.24        28.4        147.9  |     117x      607x       0.19x
array         1.22       123.8        229.0  |     102x      188x       0.54x
object        2.37        74.0         93.9  |      31x       40x       0.79x
method        2.32       114.8        154.4  |      50x       67x       0.74x
regex         1.61        81.9        143.3  |      51x       89x       0.57x
geometric mean vs Node:  js engine 84x,  cpp engine 138x
```

(Numbers move with the machine; the ratios are the stable part. `-O3` was
measured and is worth 0–4% — the cost is not instruction scheduling.)

**The value model suits a tracing GC, not `malloc`.** Every `EvalValue` carries
collection payloads, and one is allocated for every arithmetic result. On V8
those are nursery allocations a generational collector sweeps in bulk. In C++
each is a separate allocation freed by `shared_ptr` refcounting. The engine
allocates the way a JavaScript program does because it *is* a JavaScript
program; the C++ target pays list price for it. That is what the remaining
~1.4x against the JavaScript build is.

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
  js engine   123.8 / 62.9 = 1.97x
  cpp engine  229.0 / 107.7 = 2.13x
```

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

## What this folder is for

Not to claim a native speedup — there isn't one yet. It exists so that the
claim can be checked: the workloads are shared with the JavaScript benchmark,
every case asserts all three targets agree before its timing is reported, and
the two ways the native build used to diverge (key order, array scaling) are
measured on every run rather than remembered.
