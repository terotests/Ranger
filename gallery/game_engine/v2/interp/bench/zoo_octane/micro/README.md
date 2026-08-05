# Single-shape microbenchmarks

The measurements in `../PROFILE.md` come from these. Each isolates one
operation shape so an allocation count can be attributed to it; they are
deliberately three lines long.

| File | Shape |
| --- | --- |
| `arith.js` | `s = s + i` — integer arithmetic, 20k iterations |
| `arith_big.js` | the same at 300k, for wall-clock comparisons |
| `prop.js` | `o.a = o.a + 1` — property read + write |
| `call.js` | `s = f(s)` — user function call |
| `pool_hit.js` | 300k iterations whose results land in the 4096-entry small-integer pool |
| `pool_miss.js` | the identical loop with results above the pool range |

Run on the native engine and on QuickJS (which needs `print`, not
`console.log`):

```bash
gallery/game_engine/v2/interp/bin/llvm/octane_runner \
  gallery/game_engine/v2/interp/bench/zoo_octane/micro arith.js

sed 's/console\.log/print/' arith.js > /tmp/arith_q.js && qjs /tmp/arith_q.js
```

Allocation counts come from `valgrind --tool=memcheck` ("total heap usage"),
run at two iteration counts so the per-iteration figure is a difference and the
fixed script-load cost cancels out.
