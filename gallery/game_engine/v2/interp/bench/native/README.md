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
loop          0.56        47.8         46.7  |      85x       83x       1.02x
fib           0.45        47.2         57.1  |     104x      126x       0.83x
strcat        0.54        29.2        147.7  |      54x      275x       0.20x
array         1.58       119.9        238.6  |      76x      151x       0.50x
object        2.59        69.6        102.2  |      27x       40x       0.68x
method        2.27       103.9        155.4  |      46x       69x       0.67x
regex         1.87        88.7        139.0  |      47x       74x       0.64x
geometric mean vs Node:  js engine 58x,  cpp engine 98x
```

The Rust build (`TARGET=rust bash build.sh`) now compiles and answers every
workload identically as well — same league as C++, ahead of it on `array`,
behind on the string-heavy rows. See `RUST.md` for the writer bugs that stood
in the way, including the one that made recursion exponential.

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
  js engine   119.9 / 59.7 = 2.01x
  cpp engine  238.6 / 110.1 = 2.17x
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

## What this folder is for

Not to claim a native speedup — there isn't one yet. It exists so that the
claim can be checked: the workloads are shared with the JavaScript benchmark,
every case asserts all three targets agree before its timing is reported, and
the two ways the native build used to diverge (key order, array scaling) are
measured on every run rather than remembered.
