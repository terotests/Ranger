# The interpreter as a native binary

The interpreter compiles to C++ and runs JavaScript from a `g++ -O2` binary.
This folder builds it and measures it against the two other ways the same engine
runs: as JavaScript under Node, and against Node executing the script directly.

```bash
bash build.sh                 # Ranger -> C++ -> engine_bench
node run.cjs                  # the three-way comparison
TARGET=rust bash build.sh     # generates Rust, then fails in rustc; see RUST.md
```

`bench_main.rgr` holds the same seven workloads as `../bench.cjs`, at the same
sizes. The language has no clock operator, so the binary times nothing itself: a
`reps=0` run does the startup work and no iterations, a `reps=N` run does N, and
`run.cjs` subtracts. That is the same subtraction the in-process columns make
against their own empty case, so all three columns are measured alike.

## The result

It works — every workload returns the same answer from the C++ binary as from
Node — and it is **slower than the JavaScript build, by about 4x**:

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

`-O3` was measured and is worth 0–4% — the cost is not instruction scheduling.

Two things explain it, and neither is C++ being slow.

**The value model suits a tracing GC, not `malloc`.** Every `EvalValue` carries
three `std::vector`s and four `std::map`s, and one is allocated for every
arithmetic result. On V8 those are nursery allocations a generational collector
sweeps in bulk. In C++ each is a separate allocation freed by `shared_ptr`
refcounting, and each `std::map` is a red-black tree with a node allocation per
key. The engine allocates the way a JavaScript program does because it *is* a
JavaScript program; the C++ target pays list price for it.

**The array path is superlinear.** `run.cjs` reports the scaling directly:

```
array scaling (20000 vs 10000 elements; 2x = linear)
  js engine   96.2 / 54.6 = 1.76x
  cpp engine  2186.6 / 377.1 = 5.80x
```

Doubling the element count costs the C++ build nearly six times the work. That
is a bug in the generated code, not a property of the language — the same source
is linear on the JavaScript target. Until it is found, the `array` row is
measuring that bug and nothing else, and the 190x geometric mean is pulled by it.

## The binary is not conformant

`run.cjs` ends with a canary, and it fails:

```
keyorder   node: 1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}
           js:   1,2,zebra,apple,mango|{"1":5,"2":4,"zebra":1,"apple":2,"mango":3}   OK
           cpp:  1,2,apple,mango,zebra|{"1":5,"2":4,"apple":2,"mango":3,"zebra":1}   DIVERGES
```

JavaScript enumerates string keys in **insertion** order. A Ranger string map
becomes a JavaScript object on the es6 target, which is insertion-ordered and
therefore correct by construction; on the C++ target it becomes `std::map`, which
is **sorted**. So `Object.keys`, `for-in` and `JSON.stringify` all come out in
the wrong order in the native build.

The conformance score in `../../CONFORMANCE.md` — 6838/6839 — is measured on the
JavaScript build only. It does not transfer to this binary, and no one should
quote it for the native target until the map ordering is fixed. Switching the
C++ map template to `std::unordered_map` would be faster but *not* a fix: it is
unordered, which is a third answer rather than the right one. Insertion order
needs an insertion-ordered container.

## What this folder is for

Not to claim a native speedup — there isn't one. It exists so that the claim can
be checked: the workloads are shared with the JavaScript benchmark, every case
asserts all three targets agree before its timing is reported, and the two ways
the native build currently differs (key order, array scaling) are measured on
every run rather than remembered.
