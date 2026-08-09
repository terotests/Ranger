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

On `object`, `EvPropertyBag::hasData` is **1.8%** and `putData` **1.4%** of
instructions, with `rg_ordered_map`, `__memcmp_avx2_movbe` (0.9%) and the
`std::string` copies behind them adding several more. Interning would turn all
of it into integer compares.

**How much is actually recoverable — measured, and it is less than it looks.**
Every property question in `EvPropertyBag` is written as two probes:

```
if (false == (has slots key)) { return false }
def slot:EvPropertySlot (unwrap (get slots key))
```

Two hashes, two index walks, two string compares to answer one question. That
reads like free money, so I collapsed `hasData` and `dataOrHole` to a single
optional get and counted instructions with callgrind on `object`:

| | total Ir | `hasData` |
| --- | ---: | ---: |
| two probes | 2,136,935,072 | 39,073,380 |
| one probe | 2,176,517,965 | 12,645,580 |

`hasData` fell by two thirds — and the total went **up 1.85%**. The work did not
disappear, it moved into `r_map_get_val` (40.4M), out of line. Two readings
follow, and the second is the important one:

1. GCC had already CSE'd the pair. Both probes were inlined into `hasData` with
   the same key, same map and no intervening write, so the second was already
   nearly free. The source looked redundant; the object code was not.
2. Therefore the *single* remaining hash-and-compare is what interning would
   remove, and the redundant one it would also remove was worth nothing. That
   bounds the payoff of atom interning to roughly the `memcmp` line plus part
   of the map's self time — low single digits on the property-heavy row, not
   the ten per cent this section first implied.

The experiment was reverted.

**Second attempt: cache the key's hash in the map.** The bound above says the
remaining cost is one hash and one `memcmp` per probe, so I attacked those
directly in `rg_ordered_map` — the compiler's own polyfill, which every C++
Ranger program uses. A `std::vector<size_t> hashes_` parallel to `entries`,
written once at insert, lets a probe reject an occupied slot with a `size_t`
compare instead of a `memcmp`, and lets `rehash_` stop re-hashing every key on
every growth (which was O(total key bytes) per resize).

It is slower. Every row:

| object | method | array | regex | fib | loop | geomean |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.981x | 0.982x | 0.999x | 0.940x | 0.983x | 0.969x | **0.975x** |

Also reverted. The reason is size: a property bag holds tens of keys, not
thousands, and the keys are short — `"k37"`, `"length"`, `"value"`. The index
and the entries are already in L1, a `memcmp` on eight bytes is a couple of
inlined instructions, and the extra vector costs a cache line per bag plus an
allocation. `rehash_` not re-hashing is a real algorithmic win that would show
on a large map and shows nothing here. Even `loop` and `fib`, which barely
touch a map, regressed — that is the per-map footprint, not the probe.

**What the two experiments together say.** The redundant probe was free
(already CSE'd) and the remaining probe is not worth skipping (too small and
too hot in cache to beat). The `std::string` keys are a real representational
difference from QuickJS's atoms, and at the sizes this engine works at they are
not where the time goes. Both results are recorded because two negative results
that bound a large refactor are worth more than the refactor's estimate.

> **Correction.** An earlier version of this document claimed the call-site
> inline cache re-probes its `__fnprotocall__` marker by string on every hit,
> at 7.4% of `fib`. **That was wrong, and it was wrong because the profile was
> taken at `reps=1`, where engine construction dominates.** Callgrind's caller
> tree at `reps=20` attributes 12.89% of `hasOwnData` to
> `ComponentEngine::seedGlobalConstants` — engine *startup* — while
> `bcTryDirectCall` reaches it 19 times per rep, which is 0.00%. The inline
> cache is not paying a per-call string probe. And because the harness now
> subtracts a `__empty__` floor that includes `seedGlobalConstants` (§1), that
> startup cost is already excluded from every ratio in §2.


This is still the biggest *representational* difference, but with the
correction above it is no longer the biggest cost: on the rows that actually
use properties it is a few per cent, not ten. It does not explain the best row
either — `object` at 2.8x owes as much to QuickJS being slow there in absolute
terms (3.65 ms against Node's 1.45 ms on a `for…in` over a 50-key object) as to
anything we do well.

### 3.3 The variant is not trivially copyable, so assigning one is an indirect call

`std::variant` over alternatives that include `shared_ptr` is not trivially
copyable, so `operator=` dispatches through libstdc++'s generated visit table.
`__variant::__gen_vtable_impl<…>::__visit_invoke` is **1.0%** on `object` — an
indirect jump every time a value slot is written. QuickJS assigns 16 bytes.

### 3.4 VM slot reads are bounds-checked

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

### 3.5 The call prologue narrows the callee union more than once

This is where `fib` actually loses its 8x, and it is our own doing rather than
a representation difference. On the amortised profile:

```
7.75%   ComponentEngine::bcDirectCallKnown  ->  EvHandle::closureIdOf
```

`closureIdOf` narrows the value union and derefs the function core. The
compiled-call prologue called it **three times on the same handle**:

```
if ((fnv.closureIdOf()) >= 0) {
    if ((fnv.closureIdOf()) < (array_length closureScopes)) {
        def cellF:ClosureCell (itemAt closureScopes (fnv.closureIdOf()))
```

and reached the home module three more times (`hasHomeModule` plus two
`homeModuleOf`). Each is a `case` on a 12-alternative variant followed by an
`Rc`/`shared_ptr` deref. Reading each once is the fix — see §6.

QuickJS's own call sequence is cheaper for a structural reason too — the callee
frame is one `alloca` on the C stack:

```c
local_buf = alloca(alloca_size);
```

where ours calls `ComponentEngine::bcGrowTo` against a `std::vector` slab
(**1.8%** on `fib`).

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

1. **Read the callee's fields once in the call prologue** (§3.5). 7.75% of
   `fib` goes into `closureIdOf` alone, because the prologue narrowed the same
   handle three times. It is the smallest change on this list and the only one
   that is a plain bug rather than a design trade. **Done — see §6.**
2. **Stop bounds-checking VM slot reads** (§3.4). 6% geomean for a template
   change plus a static-analysis gate. Ranger already computes the ownership
   and escape facts that would justify an unchecked read; a
   `-cpp-unchecked-index` flag would prove the ceiling before the analysis is
   wired in.
3. **Shrink the boxing boundary** (§3.1). The tagged-slot representation is
   already right; the cost is in `bcSlotBox` at the edges, so the win is in
   widening opcode coverage so fewer values cross.
4. **Do not intern property names yet** (§3.2). Two experiments aimed at the
   string-key cost — removing the redundant probe, and caching the key hash in
   the map — both came back NEGATIVE (+1.85% instructions, and 0.975x wall
   time). The bags are small and the keys are short, so the probe is already
   cheap. Interning is still the right representation on paper and it is the
   one QuickJS uses, but nothing measured here supports paying for it, and the
   two cheaper approximations of it both lost. Revisit only with a workload
   that has large property bags.
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

---

## 6. Fixed: the call prologue now reads the callee once

`bcDirectCallKnown` hoists the closure id and the home module into locals:

```
def cidF:int  (fnv.closureIdOf())
def homeF:string (fnv.homeModuleOf())
```

`hasHomeModule()` is `(strlen homeModule) > 0` and the name was copied out
unconditionally two lines later anyway, so the presence probe folds into the
same read with no extra copy.

Measured `before` against `after`, both `g++ -O3 -march=native`, per-rep with
the launch and the engine floor subtracted, best-of-5 launches, two runs:

| case | run 1 | run 2 | |
| --- | ---: | ---: | --- |
| **fib** | **1.096x** | **1.106x** | the row the change targets — almost nothing but calls |
| loop | 1.082x | 0.979x | control: no calls in the body, so this is the noise floor |
| array | 1.026x | | |
| object | 0.955x | | |
| method | 1.009x | 1.048x | |
| regex | 1.012x | | |

**~10% on `fib`, reproducibly.** `loop` swinging ±8% between runs is the honest
error bar on any single row here, and it is why the claim rests on `fib`
agreeing with itself across two runs and on the profile that predicted it,
rather than on the 1.029x geomean — which is within that noise.

Correctness unchanged: all seven workloads and the key-order canary answer
identically to Node, and the native conformance suite scores **1297/1303 with
0 crashes both before and after** — the same six failures, which predate this.
