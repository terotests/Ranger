# BRIDGES.md — semantic interface + generated target bindings (rev 2)

**Rev 2, after design review.** Rev 1 proposed "one generated bridge and one
command table." The review identified that as the same conflation that killed
v1, one layer up: it fused *what an operation means*, *which host component
implements it*, and *how one transport encodes it* into a single
transport-shaped table — a WASM32-flavoured universal RPC system. The
corrected statement:

> **One semantic interface definition (a true IDL), with independently
> generated and versioned target bindings.**

Transport details move one layer down. Rev 1's rule "no second command table
anywhere" is replaced by: **no second *semantic* definition anywhere; every
profile's table is a generated, separately versioned artifact.**

---

## 1. Why v1 died at the bridges (unchanged from rev 1)

| v1 artifact | Disease |
|---|---|
| `three_native_bridge.rgr` | hand if-chain of commands; adding one = editing bridge code |
| RGSP1 sprite ABI | fixed slots, host-only clocks, runner-specific ABIs |
| per-runner sheet registries | each runner grew its own asset table |
| Sponza `sunLight()` accessors | scene-specific getters on a generic host |
| `three_tsx_bridge.rgr` | per-frontend reconciler mirror |

Root cause: command knowledge lived in hand-written per-surface code. The fix
is still generation from one authored source — but the source must be
*semantic*, not transport-shaped.

## 2. The corrected architecture

```
registry/
  interfaces/            ← authored SEMANTIC IDL (the only hand-written part)
    ranger_core_v1
    ranger_2d_v1
    ranger_three_v1
    ranger_cannon_v1
  abi_profiles/          ← authored, small: per-target lowering rules
    interpreter
    wasm32_v1
    (later: wasm64/component, native C, RPC)
  generated/             ← all derived, regenerable, separately goldened
    semantic_ids/        interface compatibility golden
    interpreter/         dispatch table + EvalNativeBridge binding
    wasm32/              import surface + wire-format vectors
    docs/
```

### 2.1 The semantic IDL (authored)

Declares, per `package:interface@major`:

- **resources** (Sprite2D, SpriteAtlas, AudioSource, **Request** — see §2.6)
- **methods** with full types, ownership effects, error sets, async behaviour
- **records / enums / variants** with frozen representations
- **capabilities** (§2.5) and thread affinity
- version lifecycle (added-in, deprecated-in, tombstoned)

**Type system = the CODE_CLEANUP D-REGISTRY list, not rev 1's shrunken one:**
`i32 u32 f32 f64 bool` · `string_view` (UTF-8 bytes, byte length, no embedded
NUL) · `handle<T>` · `option<T>` · `result<T, ErrorCode>` · `span<T>` with
declared direction (in / out / inout) · `owned_buffer<T>` / `borrowed_buffer<T>`
· structs (vec2/rect/color/transform) · enums with frozen repr · variants.
Rev 1's `i32/f64/string/handle/array` alphabet is demoted to what it really
is: the *interpreter profile's* current lowering subset, to be regenerated
from the IDL as the IDL lands.

### 2.2 Identity is hierarchical, not a global integer range

Rev 1 allocated fixed integer ranges per module (core 1000s, 2d 2000s, …).
That is a central-coordination bottleneck and breaks independent packages.
The **public identity** of an operation is:

```
package : interface @ major / operation # ordinal
e.g.  ranger:2d / sprite@1 / set-position#2
```

Compact integers still exist — assigned **at generation/link time per
process**, as an artifact, never as the published identity. The current
1000/2000-range table is hereby re-labelled an *interpreter-profile link
artifact*; its golden file guards that profile's stability, not the semantic
interface.

### 2.3 ABI profiles (authored, per target)

Each profile states: scalar representation, pointer width, string lowering,
span lowering, handle lowering, result convention, alignment, export/import
naming. Signature evolution happens per profile (a new wasm export name), so
a semantic operation can stay put while one transport re-encodes it.

**Golden files split accordingly:** semantic-interface compatibility ·
per-profile ABI compatibility · (where generated) source-wrapper
compatibility. A `wasmExport` change is a *wasm32-profile* event, not a
semantic event — rev 1's single golden conflated these.

### 2.4 Handle lowering (fixed now, in code)

The review found two real defects, both now fixed and regression-tested:

- **Signedness:** field widths are now slot:20 / type:11 / gen:20 / realm:11
  so each packed word stays `< 2^31` — the i32 sign bit can never be set, and
  arithmetic decode is portable. An out-of-range field refuses to pack
  (word 0 → invalid sentinel → typed `INVALID_HANDLE`), never truncates into a
  colliding handle. (`host/handles/RgHandle.rgr`)
- **Wrap protection is enforced, not documented:** `RgRegistry` now retires a
  slot permanently when its generation reaches the 20-bit cap
  (`maxGeneration`, test-settable; `retiredCount` observable) — a transported
  stale handle can never wrap back to validity. A registry **epoch** for
  teardown/hot-reload of *transported* tokens is specified for the wasm32
  profile (epoch participates in the token there).

Unsigned-mask encodings, four-scalar layouts, or opaque cookies remain open
per profile — the profile owns the choice.

### 2.5 Capability negotiation (new)

One bridge instance serving every module in one realm is an *integration
test*, not the deployment model. The IDL carries per-interface metadata:
`required-capability`, `optional`, `supported-versions`, `target-availability`,
`permission`. At realm creation the host and guest negotiate a **profile**:
missing optional interfaces are discoverably absent (a guest can ask); missing
required ones fail instantiation with a typed error — never dummy
implementations or conditionals inside a dispatcher. Headless servers (no
render/audio), browsers (no fs), embedded (2D+input only) are first-class
host shapes.

### 2.6 One resource model — async requests included (bug fixed now)

Requests, streams, futures, and subscriptions are **resources in the same
registry** as sprites and clips: realm-, generation-, and type-checked fat
handles. Rev 1 left `RgAsync` on bare incrementing ints — a second resource
system that would leak into every wrapper. Migration of `RgAsync` onto a
`Request` arena is scheduled with the IDL extraction.

Fixed immediately (committed, tested): looking up a **nonexistent request id**
previously returned a default object that *looked live and pending*; it now
returns a dead sentinel → `INVALID` from poll, no-op from cancel/release.

### 2.7 Portable string / asset / buffer contracts

- **string:** UTF-8 bytes, byte length, no embedded NUL, copied at the
  boundary unless declared a borrowed view; declared in the IDL, lowered per
  profile.
- **assets:** guests address `AssetUri("pkg://sprites/hero.atlas")` /
  `(package, asset)` — host filesystem paths are never part of the game API.
  `runtime.assets` resolves URIs behind the capability.
- **buffers:** ownership + direction declared per parameter (D-WASM-MEM span
  rules already cover bounds/overflow/alignment).

### 2.8 What exists today, honestly re-labelled

- `RgCommandTable` + `RgRegistryBridge` (+ its 28-check coverage gate) =
  **the interpreter-profile prototype**. It stays, gated, as the thing that
  runs TSX guests *now* — explicitly **not** a published ABI and not the
  source of truth. Its table becomes a generated artifact of
  (IDL × interpreter profile) during the IDL extraction.
- `registry/schema/{core,two_d}` rows = the seed data that will be re-expressed
  in the IDL; ids 1000–2999 = interpreter link artifact (see §2.2).
- Guest façades (`ranger2d.tsx`) = interim hand wrappers → generated wrappers.

## 3. Review findings → resolutions

| # | Finding | Resolution | Status |
|---|---|---|---|
| 1 | table conflates semantics/host/transport | IDL + ABI profiles split (§2) | planned, governs all further bridge work |
| 2 | type system too narrow vs CODE_CLEANUP | full D-REGISTRY type list in IDL (§2.1) | planned; rev-1 alphabet demoted to interpreter subset |
| 3 | handle signedness + unimplemented wrap protection | 11-bit tags, loud pack failure, enforced slot retirement | **fixed now** + tests |
| 4 | global integer ranges | hierarchical `pkg:iface@major/op#n`; ints are link artifacts | planned (§2.2) |
| 5 | semantic vs binary versioning conflated | goldens split per layer (§2.3) | planned |
| 6 | no capability negotiation | IDL capability metadata + realm-creation profiles (§2.5) | planned |
| 7 | strings/assets/buffers unspecified | §2.7 contracts in IDL | planned |
| 8 | async outside the handle model + ghost-request bug | Request as registry resource; ghost-id bug | bug **fixed now**; migration planned |
| 9 | tests don't validate portability | conformance guests + wire vectors gate any freeze (§4) | gating rule adopted |

## 4. Revised implementation order

1. ~~Interpreter-profile prototype (table + generic bridge + coverage gate)~~ — done, retained, **not a published ABI**.
2. ~~Correctness fixes: async ghost-id, handle signedness, wrap retirement~~ — **done + tested**.
3. **Finish the real-guest validation on the interpreter profile**: ylos2 +
   launcher TSX end-to-end (in progress — this is the review's own
   precondition: real guests before any freeze).
4. **IDL extraction**: full type system, hierarchical identities, capability
   metadata; re-express core/two_d rows; regenerate the interpreter table from
   IDL × profile (coverage gate keeps passing throughout).
5. **wasm32 profile**: unsigned/token lowering incl. epoch, a real
   Rust→wasm32 conformance guest, golden **wire vectors** (handles, strings,
   spans, errors, enums, results), old-guest/new-host compatibility runs.
6. Extend interfaces to three + cannon; dispatcher emitter; generated façades.
7. **Golden freeze only after** both conformance guests (TSX interpreter,
   Rust wasm32) pass against the same host and the wire vectors are pinned.

## 5. Test gates (updated)

| Gate | Asserts |
|---|---|
| coverage (exists) | every interpreter-profile row executes; drift = red |
| semantic golden | interface compatibility (per §2.3) |
| per-profile golden | ABI stability per target, incl. wire vectors |
| typed errors (exists) | unknown/arity/type/stale → typed, observable |
| capability profiles | headless / no-audio / 2D-only hosts instantiate correctly; missing-required fails typed |
| conformance guests | TSX + Rust wasm32 against one host; old-guest/new-host |
| regen determinism | same IDL × profile ⇒ byte-identical artifacts |
