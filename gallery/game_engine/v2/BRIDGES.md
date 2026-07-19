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

**Also in this doc:** §6 walks the *live* TSX call stack — how a guest call
in [`games/ylos2`](./games/ylos2/index.tsx) crosses façades → interpreter
bridge → host arenas → presenter → framebuffer, and how genericity is layered
(game-specific only at the top; host/bridge/presenter stay game-blind).

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

---

## 6. Live call stack — how a TSX call reaches the display

Rev 2 above is the *contract*. This section is the *path*: what happens when
[`games/ylos2/index.tsx`](./games/ylos2/index.tsx) runs under the interpreter
profile today. Genericity is not one abstraction — it is a stack of layers,
each generic for a different reason.

### 6.1 The layer stack

```text
┌─────────────────────────────────────────────────────────────────────┐
│  GAME  games/ylos2/index.tsx                                        │
│  level tables · jump physics · who climbs · when to cheer           │
│  knows: ranger:core + ranger:2d APIs only                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │ import { runtime } from "ranger:core"
                             │ import * as TWO from "ranger:2d"
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  VIRTUAL MODULES  (guest façades — interim, hand-written)           │
│  modules/ranger_core/ranger_core.tsx   → runtime.* capabilities     │
│  modules/ranger_2d/ranger_2d.tsx       → TWO.Sprite2D / Layer2D /…  │
│  thin classes: hold a guest id, call flat rg2d_* / rgcore_* names   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ ComponentEngine evaluates TSX
                             │ unknown name → EvalNativeBridge
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  INTERPRETER TRANSPORT  interp/engine/RgRegistryBridge.rgr          │
│  table lookup → argSpec decode → guest-id → RgHandle → dispatchRow  │
│  interpreter-profile prototype (§2.8) — not a published ABI         │
└────────────────────────────┬────────────────────────────────────────┘
                             │ same semantic ops the wasm profile will
                             │ call as generated imports
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  HOST ARENAS  (authoritative state)                                 │
│  RgRanger2D · RgInput · RgSurface · RgAudio · RgClock · RgRegistry  │
│  typed, realm/generation-checked handles (D-HANDLE / D-TYPE / D-OWN)│
└────────────────────────────┬────────────────────────────────────────┘
                             │ guest: renderer.render(layer, cam, pane)
                             │   → binds pane view (no pixels yet)
                             │ host:  Rg2DPresenter.present(pane, fb)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENT / DISPLAY                                                  │
│  Rg2DPresenter → RgSoftwareRenderer2D.present2D → RgFramebuffer     │
│  reads host state only (D-SYNC); backend choice lives here          │
└─────────────────────────────────────────────────────────────────────┘
```

Cross-cutting host that owns the tick (not the game):
[`runtime/game_host/RgGameHost.rgr`](./runtime/game_host/RgGameHost.rgr) —
load a folder of `.tsx`, register virtual packages, call `__rgGameInit` /
`__rgGameUpdate`, honour generic `launch(path)`. A v2 game is **only** TSX;
no per-game `.rgr` runner.

### 6.2 Genericity at each layer

| Layer | What is generic | What must stay game-specific | How genericity is enforced |
|-------|-----------------|------------------------------|----------------------------|
| **Game TSX** | Uses only `runtime` + `TWO` | Level data, physics constants, win conditions, attract policy | Imports virtual packages; no host/arena types |
| **`ranger:core` / `ranger:2d` façades** | Capability + domain wrappers over command names | Nothing about ylos2 | Shared module sources; D-MODULES — un-imported packages are absent |
| **`ComponentEngine`** | Parse / eval / imports / `new` / method call / native bridge seam | Nothing about games | One interpreter for every guest |
| **`RgRegistryBridge`** | Table lookup, `argSpec` decode, surrogate guest ids, typed errors | Nothing about games; interim `dispatchRow` is schema-shaped | Schema rows (`core` ∪ `two_d`); coverage gate runs every row |
| **Host arenas** | Sprite/layer/camera/input/audio/surface mechanics | Nothing about games | Typed arenas; wrong-type / stale handle rejected |
| **`RgGameHost`** | Lifecycle protocol: load → init → frame → launch handoff | Only the path the *caller* passes | Forbidden: game names, world constants, sprite maps |
| **`Rg2DPresenter` + backend** | Pane index → layerH/camH → pixels | Nothing about games | Presenter chooses software/GPU; host stays backend-agnostic |

**Rule of thumb:** if a hypothetical second 2D climber could reuse a file
unchanged, that file is generic. If it names Pomppija platforms, jump heights,
or `cheer`, it belongs under `games/ylos2/`.

CODE_CLEANUP decisions that pin this stack:

- **D-MODULES** — `ranger:core` (capabilities) vs `ranger:2d` (domain objects);
  virtual imports, not ambient globals.
- **D-ADAPTER / D-SYNC** — live host-backed objects; each `new` / method hits
  the host now; render is **not** a sync/reconcile boundary.
- **D-2D** — retained sprites with stable identity; layer membership ≠ release;
  shared `Camera2D` math for SW and GPU.
- **D-REGISTRY** — one schema seeds interpreter table *and* (later) wasm
  imports; integers are link artifacts (§2.2), not public identity.
- **Frame pipeline** — host owns the tick; guest may call `render` in
  `update` (step 6); host presents afterward (step 7).

### 6.3 Worked paths (ylos2 → display)

All paths start in [`games/ylos2/index.tsx`](./games/ylos2/index.tsx). Guest
wrappers live in `modules/ranger_{core,2d}/*.tsx`; transport in
`RgRegistryBridge`; arenas in `RgRanger2D` / `RgInput` / `RgSurface`; pixels in
`RgSoftwareRenderer2D`.

#### Path A — create a platform sprite and put it on a layer

Guest (init):

```ts
const s = new TWO.Sprite2D(this.atlas, rPlat);
s.setPos(p.x + p.w / 2, p.y);
this.layer.add(s);
```

| Step | Actor | What happens |
|------|-------|--------------|
| 1 | guest | `new TWO.Sprite2D(atlas, rPlat)` |
| 2 | façade `ranger_2d.tsx` | `this.id = rg2d_sprite_create(atlas.id, regionIndex)` |
| 3 | interp | `ComponentEngine` → `EvalNativeBridge.invoke("rg2d_sprite_create", …)` |
| 4 | bridge | table row → decode `h:i` → resolve guest atlas id → `RgHandle` |
| 5 | host | `RgRanger2D.spriteCreate` — alloc typed slot, **retain** atlas (D-OWN), mint guest id |
| 6 | guest | `s.setPos(…)` → `rg2d_sprite_set_pos` → `spriteSetPos` writes arena `x`/`y` |
| 7 | guest | `layer.add(s)` → `rg2d_layer_add` → `layerAdd` sets `sprite.layerSlot`, bumps child count |

The guest `Sprite2D` is a thin id holder. Authoritative pixels/pose live in the
host arena. Reordering/reparenting never changes the guest id (D-IDENTITY /
D-2D).

#### Path B — read input each frame

Guest (`updatePlayer`):

```ts
const pad = runtime.input.player(pl.slot);
const left = pad.isDown("left");
```

| Step | Actor | What happens |
|------|-------|--------------|
| 1 | façade | `player(index)` returns a **guest-only** helper (no host handle) |
| 2 | façade | `isDown("left")` → `rgcore_input_is_down(index, "left")` |
| 3 | bridge | decode `i:s` → `RgInput.isDown` → logical action state → `1`/`0` |

Who *feeds* the pad is outside the game: e2e uses `RgAttractDriver` + guest
`autopilotBits`; a real device writes the same `RgInput` actions. The game
never sees the source — only logical actions. That is genericity of **input
policy** at the host edge, not inside the guest.

#### Path C — load the atlas from package data

Guest (init):

```ts
this.atlas = runtime.assets.loadSpriteAtlas("pkg://player.atlas");
this.rIdle = this.atlas.regionIndex("idle");
```

| Step | Actor | What happens |
|------|-------|--------------|
| 1 | façade | `rgcore_assets_load_atlas("pkg://player.atlas")` |
| 2 | bridge | strip `pkg://`, read `{packageDir}/player.atlas` |
| 3 | host | `textureCreate` → `atlasCreate` → `atlasAddRegion` / `atlasAddClip` |
| 4 | bridge | mint atlas guest id; façade wraps `__RgLoadedAtlas` |
| 5 | guest | `regionIndex("idle")` → `rg2d_atlas_region_index` (same atlas handle sprites use) |

**Profile split:** interpreter profile resolves synchronously; wasm profile
lowers the *same* semantic op to D-ASYNC begin/poll. URI form is
package-relative (`pkg://…`) — host filesystem paths never enter the game API
(§2.7).

#### Path D — render call → pane bind → pixels on the “display card”

This is the full path to the framebuffer (the software stand-in for a display
card / window surface).

Guest (`update`):

```ts
this.renderer.render(this.layer, this.cam1, 0);
this.renderer.render(this.layer, this.cam2, 1);
```

| Step | Actor | What happens |
|------|-------|--------------|
| 1 | façade | `rg2d_render(scene.id, cam.id, pane)` |
| 2 | bridge | decode `h:h:i` → **`surface.paneSetView(pane, layerH, camH)`** |
| 3 | — | **no pixels yet** — only host pane state is updated |
| 4 | host (after update) | test/runtime: `Rg2DPresenter.present(bridge, pane, fb)` |
| 5 | presenter | `paneLayer` / `paneCam` → real `RgHandle`s |
| 6 | backend | `RgSoftwareRenderer2D.present2D(d2, fb, layerH, camH)` |
| 7 | backend | for each live sprite on that layer: `worldToScreenSw*` → `fb.plot` |

Split-screen is two pane binds of the **same** layer with two cameras — not
two scene graphs. A GPU presenter is a sibling adapter over the same pane
state; games and `RgGameHost` do not change.

e2e checks the end of this path: left/right framebuffers get non-zero centre
pixels for P1/P2 (`tests/e2e/ylos2_e2e_test`).

#### Path E — lifecycle: `runtime.start` → init → update → present

```text
RgGameHost.load(dir, "index.tsx")
  ├─ registerVirtualModule("ranger:core", …)
  ├─ registerVirtualModule("ranger:2d", …)
  ├─ loadScript(index.tsx)
  │    ├─ materialize imports
  │    └─ run top-level:  const __game = new Ylos2Game();
  │                       runtime.start(__game);   // stores __rgGame
  └─ callFunction("__rgGameInit")
       └─ ranger_core: __rgGame.init()             // Path A + C + layout

each tick — RgGameHost.frame(dtMs)
  ├─ callFunction("__rgGameUpdate", { dtMs })
  │    └─ __rgGame.update(props)                   // Path B + D binds
  ├─ bridge.frameBoundary(dt)                      // clock / audio / input edges
  └─ (outside host) Rg2DPresenter.present(…)       // Path D pixels
```

Wasm guests export the same two entry points (`init` / `update`); only the
transport of the host-owned tick differs. Attract-mode input
(`RgAttractDriver` + optional `autopilotBits`) is out-of-band — the generic
host stays input-agnostic.

### 6.4 One semantic op, two lowerings (preview)

```text
                    semantic:  sprite.set-position(sprite, x, y)
                              /                              \
           interpreter profile                                 wasm32 profile
  TWO.Sprite2D.setPos → rg2d_sprite_set_pos          generated import / ranger_wasm
  EvalValue args · guest surrogate id                i32 handle words · spans
  RgRegistryBridge.decode(argSpec)                   profile wire format
                              \                              /
                               ▼                            ▼
                         RgRanger2D.spriteSetPos(spriteH, x, y)   ← one host
```

Today only the left column runs end-to-end for ylos2. The right column is why
the table must stay a *generated profile artifact* (§2), not the semantic
source of truth.

### 6.5 What is still interim on this path

| Piece | Status |
|-------|--------|
| `ranger_*.tsx` façades | hand wrappers → generated (§2.8) |
| `dispatchRow` in `RgRegistryBridge` | interim hand glue; coverage-gated → codegen emitter |
| Command ids 1000/2000 ranges | interpreter link artifact, not public identity (§2.2) |
| Soft-2D `fb.plot` colours | headless present proof; GPU presenter is a sibling |
| Module binding namespaces | packages resolve; per-namespace isolation still tracked |

The example is otherwise complete: real `ranger:*` imports, package assets,
game-owned render calls, host-owned pane presentation, generic load/launch.
