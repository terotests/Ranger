# The engine against QuickJS — where the remaining gap actually is

Measured on this machine, August 2026, against `qjs` **2021-03-27** (Debian
`quickjs` 2021.03.27-1) with the source of a later Bellard/quickjs-ng tree read
alongside for the design comparison. Everything below is either a measurement
that is reproducible with the commands given, or a quotation from
`quickjs.c` / the generated `engine_bench.cpp`.

```bash
apt-get install -y quickjs
bash scripts/build-engine-module.sh
TARGET=cpp bash gallery/game_engine/v2/interp/bench/native/build.sh
node gallery/game_engine/v2/interp/bench/native/vs_quickjs.cjs 60
```

---

## 1. Two harness bugs had to be fixed before the number meant anything

`vs_quickjs.cjs` subtracted an empty-script floor from the **ES6** column and
not from the **C++** column. The C++ bench builds a fresh `ComponentEngine` and
re-parses the source on every rep, so `(reps=N − reps=0) / N` is
`construct + parse + run`, not `run`. That floor is **0.77 ms**, which is a
third of the `strcat` reading. Left in on one side only, it made the C++ engine
look *slower* than the ES6 engine — the opposite of what `run.cjs` reports for
the same binary.

It also took `timeBest(…, 3)` on the ES6 engine. Best-of-3 on a cold V8 reads
about **1.7x** its warm cost (5.50 ms against 3.26 ms on `loop`), which is
larger than most of the differences the table is trying to show.

Both are fixed: the native column now subtracts a `__empty__` case measured the
same way, and the ES6 column warms before the floor and takes best-of-15.

## 2. How much slower we are

Two consecutive runs, `REPS=60`. `ES6/QJS` and `C++/QJS` are ratios of ms/run,
so **lower is better and 1.0x would be parity**.

| case | raw Node | raw QuickJS | eng/ES6 | eng/C++ | ES6/QJS | C++/QJS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| loop | 0.52 | 0.59 | 3.56 | 1.72 | 6.1x | **2.9x** |
| fib | 0.34 | 0.71 | 7.61 | 7.24 | 8.5x | **8.1x** |
| strcat | 0.63 | 8.63 | 1.88 | 1.04 | 0.2x | **0.1x** |
| array | 1.58 | 1.79 | 7.50 | 5.46 | 4.2x | **3.1x** |
| object | 1.45 | 3.65 | 19.6 | 10.2 | 5.4x | **2.8x** |
| method | 1.27 | 4.03 | 24.8 | 19.6 | 6.2x | **4.9x** |
| regex | 1.26 | 6.02 | 50.1 | 44.2 | 8.3x | **7.3x** |
| **geomean** | 0.70 | 2.56 | 9.90 | 6.72 | **3.9x** | **2.6x** |

Second run agrees: geomean ES6 4.2x, C++ 2.9x. Per-row spread between the two
runs is under 20% everywhere except `object`, where raw Node moved 2x (that
column is the noisiest; it is not part of the ratios that matter).

**The headline is 2.6–2.9x — but the honest headline is worse than that**,
because `strcat` is carrying the geomean. QuickJS 2021-03-27 has no string
ropes; `JS_STRING_ROPE_SHORT_LEN` appears only in the later tree. Its `s += "ab"`
20 000 times is quadratic, which is why it takes 8.6 ms to do what Node does in
0.6 ms. We are not 5–10x faster at string building than QuickJS; we are faster
than one old QuickJS's known weak spot. **Drop that row and the C++ engine is
≈4.4x QuickJS and the ES6 engine ≈6.3x.** Treat 4.4x as the number.

The best row (`object`, 2.8x) and the worst (`fib`, 8.1x) are 3x apart, and the
reason is structural — see below.

---

## 3. What we still do differently

Profiles are `valgrind --tool=callgrind` on a `-O2 -g` build (the shipped
binary is `-march=native`, which valgrind cannot run). Percentages are shares
of total instructions retired.

### 3.1 Every JS value is a heap object with a refcount. QuickJS's is 16 bytes in a register.

```
EvHandle           40 bytes   and always reached through rg_ptr<EvHandle>
  r_union_EvalValue body;     (24 bytes, 12 alternatives)
  double numberValue;
  bool slotOwned; bool isProtoObject; int identityId;

QuickJS JSValue    16 bytes   POD, trivially copyable, passed in registers
  #define JS_MKVAL(tag, val) (((uint64_t)(tag) << 32) | (uint32_t)(val))
```

An int, a double, a bool, `null` and `undefined` are *immediates* in a
`JSValue`. `JS_DupValue` is:

```c
if (JS_VALUE_HAS_REF_COUNT(v)) { p->ref_count++; }
```

— so a number costs **nothing** to copy, and a reference costs one non-atomic
increment on a header inline in the object. Ours costs a `shared_ptr` copy with
a separate control block.

On the `object` case that shows up as `EvHandle::number` **4.7%**,
`_Sp_counted_base::_M_release` **2.7%**, `operator new` **1.8%**,
`malloc_usable_size` **1.5%**, `_int_malloc` **0.9%** — about **12%** of all
instructions spent making and unmaking values.

We already have three mitigations and they are working: a small-int pool for
0..4095 (`EvalConstPool::smallInt`), a non-atomic `rg_ptr`, and — the important
one — the tagged VM slots, where `bcTags[i] == 1` means the value lives
unboxed as a `double` in `bcNums[i]` and no `EvHandle` exists at all. That is
the same trick QuickJS plays, one level down.

What remains is the **boundary**: anything leaving the VM re-boxes.
`ComponentEngine::bcSlotBox` is **2.7%** on `object`.

### 3.2 Property keys are `std::string`. QuickJS's are 32-bit atoms.

Ours, per property access:

```cpp
size_t h = rg_hash_bytes(k.data(), k.size()) & mask;   // hash every key byte
while (true) {
    int32_t s = index_[h];
    if (s == -1) return -1;
    if (entries[s].first == k) return s;                // full string compare
    h = (h + 1) & mask;
}
```

QuickJS, per property access:

```c
h = (uintptr_t)atom & sh->prop_hash_mask;   // mask an int
h = sh->hash_table[h];                       // one indexed load
while (h) {
    pr = &prop[h - 1];
    if (likely(pr->atom == atom)) { … }      // int compare
    h = pr->hash_next;
}
```

`BcProgram` does have an `atoms` array — but it is `atoms:[string]`. They are
names, not interned integers. Nothing in the pipeline turns a property name
into a dense int that the map can compare in one instruction.

The cost is not confined to property-heavy code, and the clearest evidence is
on **`fib`** — a benchmark whose JavaScript contains no property access at all.
Callgrind's caller tree gives the exact path:

```
7.39%   ComponentEngine::bcDirectCallKnown  ->  EvHandle::hasOwnData(std::string)
8.73%   EvHandle::hasOwnData                ->  EvPropertyBag::hasData  ->  rg_ordered_map
```

That is the call-site inline cache doing exactly what its own comment says it
does:

> every laddered property except the `__fnprotocall__` own-data marker is
> immutable on a function value, and that one is re-probed on every hit

The ladder is skipped on a cache hit — the design is sound — but the one
surviving probe is a **string** probe. `hasOwnData("__fnprotocall__")` hashes
15 bytes and then does a full compare, on **every call**, and that alone is
**7.4% of every instruction `fib` executes**. Add the shared_ptr and variant
traffic those calls drag along and the string-keyed property machinery is
about 10% of the run.

QuickJS reaches a callee through a `JSObject*` and a class-id check. Even if it
did probe, the probe would be an `int` compare against an atom.

Two ways out, in increasing order of cost: make the marker a field on the
function value rather than a property (removes this probe entirely), or intern
property names to integers (removes the whole class of cost).

This is the single biggest structural difference left. It also explains the
worst row: `fib` (8.1x) is almost nothing but calls, so the per-call probe has
nothing to hide behind. It does *not* by itself explain the best row —
`object` at 2.8x owes as much to QuickJS being slow there in absolute terms
(3.65 ms against Node's 1.45 ms on a `for…in` over a 50-key object) as to
anything we do well.

### 3.3 The variant is not trivially copyable, so assigning one is an indirect call

`std::variant` over alternatives that include `shared_ptr` is not trivially
copyable, so `operator=` dispatches through libstdc++'s generated visit table.
`__variant::__gen_vtable_impl<…>::__visit_invoke` is **1.0%** on `object` — an
indirect jump every time a value slot is written. QuickJS assigns 16 bytes.

### 3.4 VM slot reads are bounds-checked, on C++ only

```cpp
int op = prog->ops.at(pc);          // std::vector::at — compare + throw path
int a  = prog->args.at(pc);
int t8 = bcTags.at(base + a);
double lv12 = bcNums.at(sp - 1);
```

`std::vector::_M_range_check` is **2.3%** of instructions on `object` and
**3.3%** on `fib`. QuickJS reads `*pc++` off a raw `uint8_t*`.

This one is a **compiler** issue, not an engine one. `Lang.rgr:4988`:

```
itemAt cmdItemAt@(weak):T ( array:[T] index:int ) {
    cpp   ( (e 1) ".at(" (e 2) ")" (imp "<vector>") )
    rust  ( (e 1) "[" (idx 2) "]" (cloneif 1) )
    *     ( (e 1) "[" (e 2) "]" )
}
```

Rust indexing is checked too (it panics rather than throws), but every other
target emits a raw subscript. I measured the ceiling by
rewriting the 226 hot-vector `.at()` calls in the generated engine to
`operator[]` and rebuilding at `-O3 -march=native`:

| case | `.at()` | `[]` | speedup |
| --- | ---: | ---: | ---: |
| loop | 1.692 | 1.511 | **1.12x** |
| fib | 7.390 | 6.687 | **1.11x** |
| array | 5.723 | 5.834 | 0.98x |
| object | 9.874 | 10.219 | 0.97x |
| method | 23.153 | 18.873 | **1.23x** |
| regex | 44.997 | 45.530 | 0.99x |
| **geomean** | | | **1.06x** |

So: **6% overall, up to 23% on the most VM-bound row**, and neutral within
noise on the rows dominated by allocation and string work. Real, cheap, and
nowhere near the whole gap — worth doing precisely because it costs a template
change, not an engine rewrite.

### 3.5 A call grows a heap stack; QuickJS allocas on the C stack

```c
local_buf = alloca(alloca_size);        /* QuickJS: callee frame on the C stack */
```

Ours calls `ComponentEngine::bcGrowTo` per call (**1.7%** on `fib`) against a
`std::vector` slab, and resolves the callee through `EvHandle::closureIdOf`
(**5.8%** on `fib`, counting its shared_ptr and variant costs). Between the
frame growth, the callee resolution and the string-keyed probe of §3.2, the
call sequence is where `fib` loses its 8x.

### 3.6 Dispatch is closer than it looks

The generated loop is 41 `if (op == N)` tests, ordered by measured frequency
(`8, 12, 16, 2, 3, 20, 9, …`). That reads worse than it is: GCC does build a
jump table (`notrack jmp *%rax` appears in `runBytecode`). QuickJS uses an
explicit computed-goto table of 256 entries and reads a byte stream; we read
two parallel `int` arrays. The remaining per-instruction overhead we have and
QuickJS does not is two guards in the loop body — a `bcSteps` runaway counter
and an `sp`-within-frame check — plus the bounds checks of §3.4.

---

## 4. What this says to do next

Ordered by measured payoff against cost, not by appeal:

1. **Kill the `__fnprotocall__` string probe on the IC hit path** (§3.2). It is
   7.4% of `fib` on its own and it is the smallest change on this list: the
   marker wants to be a field on the function value, not a property that has to
   be looked up by name. Do this one first.
2. **Intern property names to integers.** The general form of §3.2 — worth
   ~10% on a benchmark that does not even use properties. It is also the
   largest change here.
3. **Stop bounds-checking VM slot reads** (§3.4). 6% geomean for a template
   change plus a static-analysis gate. Ranger already computes the ownership
   and escape facts that would justify an unchecked read; a
   `-cpp-unchecked-index` flag would prove the ceiling before the analysis is
   wired in.
4. **Shrink the boxing boundary** (§3.1). The tagged-slot representation is
   already right; the cost is in `bcSlotBox` at the edges, so the win is in
   widening opcode coverage so fewer values cross.
5. Leave dispatch alone (§3.6). GCC already builds the jump table, and the two
   loop guards are cheap next to everything above.

## 5. Caveats worth keeping

- **`strcat` is not a win.** QuickJS 2021-03-27 concatenates quadratically; the
  0.1x is its bug, not our speed. Any headline number should exclude it.
- Our engine re-parses per rep in both engine columns; QuickJS and Node compile
  once. The floors are now subtracted on both sides (§1), but body-parse cost
  still sits in the engine columns and not in the QuickJS one, so the true
  ratios are slightly *better* than the table says.
- `raw Node fib` at 0.06–0.34 ms across the two runs is V8 folding a constant
  call; ignore that column for `fib`.
