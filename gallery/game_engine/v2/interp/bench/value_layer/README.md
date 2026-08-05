# The value layer: what a shape would buy the interpreter

`EvalValue` is one class with 33 members and eight collections, and the engine
allocates one of them per arithmetic result. `PLAN_SHAPES.md` proposes replacing
it with a closed variant family. These four programs measure what that trades,
before migrating a single line of the engine.

All four compute the same answer over 2,000,000 iterations of the interpreter's
hot pattern — construct a value, ask its type, read it back, compare two:

| file | representation |
|---|---|
| `fat.rgr` | today's model: one wide class, an int tag, a small-int pool |
| `shape.rgr` | the shape lowering as it stands: one small class per case, `match` |
| `tagged.rgr` | one small class per case, dispatched on an int `kind` field |
| `handle.rgr` | a compact handle: one class, tag + scalar slot + payload reference |

```bash
R=../../../../..                    # repo root
for v in fat shape tagged handle; do
  node $R/bin/output.js -es6 $v.rgr -d=out -o=$v.js -nodecli
  node $R/bin/output.js -l=cpp  $v.rgr -d=out -o=$v.cpp
  node $R/bin/output.js -l=rust $v.rgr -d=out -o=$v.rs
done
(cd out && for v in fat shape tagged handle; do node $v.js; done)
```

## Measured (this machine, best of three, work only)

| variant | Node | C++ `-O2` | Rust `-O` |
|---|---|---|---|
| fat | 490 ms | 0.240 s | 0.37 s |
| shape | **78 ms** (6.3×) | **0.123 s** (2.0×) | **0.105 s** (3.5×) |
| tagged | **12.5 ms** (39×) | 0.118 s (2.0×) | 0.008 s (46×) |
| handle | 12.3 ms (40×) | 0.130 s (1.8×) | 0.008 s (46×) |

Read the last two rows carefully. On Node they say the remaining cost after the
shape lowering is the **`instanceof` chain, not the object** — a `kind` field and
an integer test buys another 6×, and the single-object handle buys nothing on top
of that. On C++ all four still allocate through `shared_ptr`, so the tag changes
little and the real gain waits for a handle that is a *value type*. On Rust the
last two rows have no union at all, so they are plain structs with no heap
traffic — that is the ceiling a native `enum` aims at, not a like-for-like row.

## But how much of the engine is this?

`count_allocations.cjs` counts `EvalValue` constructions per benchmark case
against an instrumented copy of the built engine module:

| case | case time | EvalValues | at the measured ~82 ns each |
|---|---|---|---|
| loop | 113 ms | 150 477 | ~12 ms — 11% |
| fib | 60 ms | 569 | ~0 ms — 0% (the small-int pool absorbs it) |
| array | 152 ms | 126 174 | ~10 ms — 7% |
| object | 59 ms | 76 573 | ~6 ms — 11% |
| method | 93 ms | 96 433 | ~8 ms — 9% |

So on **Node**, migrating `EvalValue` to a shape is worth roughly **5–10% end to
end**, not a multiple: V8's nursery makes the fat object cheaper than it looks,
and the small-integer pool already removes the hottest allocations. The value
layer itself gets 6× faster; it is simply not where the engine spends its time.

The native targets are the open question. There an `EvalValue` is a 680-byte
object with eight collections and no nursery to hide it, and the same allocation
counts apply — so the share should be much larger than 10%. Measuring that needs
the engine built to C++/Rust with the same counter, which has not been done.
