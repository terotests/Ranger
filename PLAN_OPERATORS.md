# Operator coverage plan

Status: §3, §4 and the mechanism-B half of §5 P0 are **implemented in 3.3.0**. The rest stands as a proposal. Written against `3.2.1`, all claims below measured on this tree.

Target policy used throughout:

| Tier | Targets | Meaning |
|---|---|---|
| Primary | `es6` / `ts`, `cpp`, `kotlin`, `swift6` | A gap here is a bug. Every new operator ships with these. |
| Secondary | `go`, `rust` | Ship together with primary unless the target genuinely lacks the concept. |
| Experimental | `llvm` / WASM | Best effort; see §6. |
| Legacy | `java7`, `swift3`, `php`, `csharp`, `scala`, `es5`, `python` | Keep working, do not block a release. |

---

## 1. Corrections to the review

The review reads `Lang.rgr` only. Ranger has a second, larger operator mechanism, and that changes the conclusion substantially.

**The headline claim is wrong.** The review calls functional collection operations "selvästi suurin aukko" and lists `map`, `filter`, `reduce`, `find`, `count`, `groupBy` as missing. They exist — in `lib/stdlib.rgr` as method-style operators (`operator type:[T] all`), not as free functions in `Lang.rgr`. Measured, compiling one program per cell:

| | es6 | cpp | kotlin | swift6 | go | rust |
|---|---|---|---|---|---|---|
| `.map()` | ok | ok | ok | ok | ok | ok |
| `.filter()` | ok | ok | ok | ok | ok | ok |
| `.reduce()` | ok | ok | ok | ok | ok | ok |
| `.find()` | ok | ok | ok | ok | ok | ok |
| `.count(cb)` | ok | ok | ok | ok | ok | ok |
| `.groupBy()` | ok | ok | ok | ok | ok | ok |

Six for six on every target including Rust and C++. The call syntax is `items.map({ return (item * 2) })`, not `(map items fn)`. This is not a gap; at most it is a discoverability problem, which §5 addresses.

**Confirmed missing** (compiled, es6): `any`, `all`, `range`, `slice`, unary minus, `min`, `abs(int)`, `round`, `pow`, `log`, and the map helpers `values` / `map_length` / `remove_key`. `max` and `atan2` already exist, contrary to the review.

**Implementation notes, verified:**

- *"`random` is ES6-only"* — half right, and it understates the problem. `random:double ()` covers cpp, es6, go, kotlin, rust; `random:int (min max)` covers only es6 and kotlin. **Neither has any Swift template at all**, which matters directly for the Apple Watch / iOS port.
- *"`rust` is not in the `targets` list"* — the list is indeed missing `rust` (`Lang.rgr` `targets {}`: es5, es6, java7, kotlin, scala, cpp, csharp, swift3, swift6, ts, flow, go, php, python, nim, llvm). But Rust compiles fine, so the block is metadata, not a gate. Cosmetic; fix while nearby.
- *"`ceil` declares `:int` but templates return floating point"* — confirmed. `ceil _:int (value:double)` with `go` emitting `math.Ceil` and `cpp` emitting `ceil`. Real type-correctness bug.
- *"Go's SHA-256 helper is named `_r_md5`"* — confirmed at `Lang.rgr:380`.
- *"silent no-op fallbacks"* — confirmed and worth escalating. `create_dir` for `swift3` is literally `( nl )`; `dir_exists` for `csharp` and `scala` is `"false /* not implemented */"`. Code compiles and silently does the wrong thing.

---

## 2. The systemic finding

Two operator mechanisms, with very different portability:

**A. Template operators** (`Lang.rgr`, `JSON.rgr`) — one hand-written emission string per target. Portability is manual, and the failure mode is the one that produced issue §D: operator matching is target-aware, so an operator with no template for the active target and no `*` fallback does not fail with "no template for swift6", it fails with

```
[FAIL] Could not match argument types for getValue
```

pointing into `JSON.rgr` — the compiler's own source, not the user's. Four of the five errors in §D were of this kind. The diagnostic names the wrong thing, which is why the gap survived to a release.

**B. Ranger-implemented type operators** (`lib/stdlib.rgr`) — ordinary Ranger code in an `operator type:[T] all` block, compiled per target like any other Ranger source. Portable to every target for free, including WASM, as the table in §1 shows.

**This is the core of the plan: implement in B wherever possible, and drop to A only for genuine primitives.** Almost everything the review asks for is expressible in B.

---

## 3. Guardrails first (P0) — partly done in 3.3.0

These stop the §D class of bug recurring and cost little. Do these before adding surface area.

1. **Coverage audit test.** *(done — `tests/operator-coverage.test.ts`)* A test that parses every `templates {}` block in the four operator files and fails when an operator covers a primary target's sibling but not the target itself — the exact shape that hid `getValue`. The audit script already exists in this session's working notes; it found `getValue`, `keys` and the union `case` before they were fixed, and it currently reports 7 remaining `swift6` gaps plus the Kotlin `keys` gap.
2. **Honest diagnostic.** *(not done — needs a compiler change in the matcher)* When operator matching fails and the operator name resolves but has no template for the active target, say so:
   ```
   [FAIL] operator `getValue` has no template for target `swift6`
          (declared for: es6, ranger, java7, swift3, kotlin, go, php)
   ```
   This turns every future gap into a one-line diagnosis instead of a three-hour bisect.
3. **Ban silent fallbacks.** *(not done — the audit pins the count at 30 as a ratchet; converting them to errors is a per-target behaviour change)* Replace `"false /* not implemented */"` and empty-template no-ops with an explicit compile error. A build that fails is strictly better than a directory that is silently never created.

## 4. Close the known gaps (P0) — done in 3.3.0

Carried over from `3.2.1`, all measured, **all now closed** — see the 3.3.0 CHANGELOG entry. The Kotlin `keys` polyfill still needs `kotlinc` verification, which this environment cannot provide.

- `keys` on `JSONDataObject` has no `kotlin` template → any hash field in a `@serialize(true)` class fails on Kotlin (15 errors). Needs an `org.json`-based helper mirroring the existing `java7` polyfill. **Requires `kotlinc` to verify — I cannot validate the emitted Kotlin here.**
- Seven operators lack `swift6`: `M_PI`, `fabs`, `tan`, `wait`, `file_exists`, `dir_exists`, `create_dir`. Six are verbatim `swift3` mirrors. `create_dir` needs a real implementation (`FileManager.default.createDirectory(atPath:withIntermediateDirectories:)`), not a copy of the swift3 no-op.
- `random` has no Swift template in either variant, and `random:int` is es6+kotlin only.

## 5. New surface, in dependency order

**P0 — expressible in Ranger (mechanism B), so all targets at once — DONE except `range`:**

| Operator | Mechanism | Note |
|---|---|---|
| `.any()` / `.all()` | B, `stdlib.rgr` | **done in 3.3.0** |
| `range` | B | **not done** — needs a free function, not a method on an existing type; the `for (range 0 n) i` form has to resolve before there is a receiver |
| `slice` | B | **done in 3.3.0** as `.slice(start end)` |
| map `values` / `map_length` / `get_or` | B | **done in 3.3.0**. `remove_key` skipped: removing a key while iterating needs a mutation-marked receiver, which the type-operator block does not express today |
| `clamp`, `sign`, `abs(int)` | B | **not done** — free functions on scalars, same shape problem as `range` |

**P0 — genuine primitives, needs mechanism A across the tier table:**

`min`, `round`, `pow`, `log`, `log10`, `exp`, unary minus. Each needs 4 primary + 2 secondary templates. Check whether unary minus is a parser special case before adding an operator — the review flags this uncertainty and it is worth resolving first.

**P1 — standard library:** `path_join` (the review is right that hand-built `path + "/" + name` is a real Windows hazard), `list_directory`, `remove_file`, `read_line`, `json_parse` / `json_stringify`, `time_now`, regex match/groups/replace. These are I/O-shaped, so mechanism A, and each needs care per target.

**P2 — ergonomics:** `+=` family, optional chaining, set collections, string `pad`/`repeat`/`format`. Larger parser-facing changes; not straightforward, do not bundle with the above.

**Also fix while nearby:** `ceil` return type; `_r_md5` → `_r_sha256`; add `rust` to `targets {}`; `fn has:boolen` typo at `stdlib.rgr:227`; the `has()` naming overload the review flags (`is_empty` / `contains` / `contains_key`) — the last one is a breaking rename, so it needs a deprecation path, not a drive-by edit.

## 6. WASM

`gallery/game_engine` has WASM targets, but they go through AssemblyScript / the LLVM-WAT backend rather than a `wasm` entry in `targets {}`, and `compiler-llvm.test.ts` is excluded from the default suite. Mechanism-B operators reach WASM for free, since they are Ranger code compiled through whatever backend is selected. Mechanism-A operators would each need a WAT template. **Recommendation: add nothing WASM-specific in this plan.** Let the P0 items land via mechanism B, then measure what actually fails on the LLVM backend before writing WAT templates.

---

## 7. Suggested execution order

1. §3 guardrails + §4 known gaps — small, verifiable, stops the bleeding.
2. §5 P0 mechanism-B items — one `stdlib.rgr` change each, all targets at once, cheap to test.
3. §5 P0 mechanism-A primitives — one template matrix each.
4. Reassess before P1/P2.

Steps 1–2 are straightforward and do not touch the compiler. Step 3 is mechanical but wide. P2 is not straightforward: it is parser work, and should be planned separately.
