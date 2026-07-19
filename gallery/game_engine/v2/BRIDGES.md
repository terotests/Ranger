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

All paths start in [`games/ylos2/index.tsx`](./games/ylos2/index.tsx). Each
subsection shows: **guest TSX** → **façade** → **Ranger call sites** (with
file paths) → **data structures touched**.

| Role | Where in the tree |
|------|-------------------|
| Guest game | [`games/ylos2/index.tsx`](./games/ylos2/index.tsx) |
| Guest façades | [`modules/ranger_2d/ranger_2d.tsx`](./modules/ranger_2d/ranger_2d.tsx), [`modules/ranger_core/ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx) |
| Schema rows | [`registry/schema/two_d/two_d_schema.rgr`](./registry/schema/two_d/two_d_schema.rgr), [`registry/schema/core/core_schema.rgr`](./registry/schema/core/core_schema.rgr) |
| Interpreter seam | [`interp/migrate/src/ComponentEngine.rgr`](./interp/migrate/src/ComponentEngine.rgr) (`EvalNativeBridge`) |
| Transport | [`interp/engine/RgRegistryBridge.rgr`](./interp/engine/RgRegistryBridge.rgr) |
| 2D arenas | [`modules/ranger_2d/RgRanger2D.rgr`](./modules/ranger_2d/RgRanger2D.rgr) |
| Input / surface | [`modules/ranger_core/RgInputSurface.rgr`](./modules/ranger_core/RgInputSurface.rgr) |
| Handles | [`host/handles/RgHandle.rgr`](./host/handles/RgHandle.rgr), [`host/ownership/OwnedHandle.rgr`](./host/ownership/OwnedHandle.rgr), [`host/RgRegistry.rgr`](./host/RgRegistry.rgr) |
| Present | [`runtime/game_host/Rg2DPresenter.rgr`](./runtime/game_host/Rg2DPresenter.rgr), [`render/backends/software/RgSoftwareRenderer2D.rgr`](./render/backends/software/RgSoftwareRenderer2D.rgr) |
| Lifecycle host | [`runtime/game_host/RgGameHost.rgr`](./runtime/game_host/RgGameHost.rgr) |

#### Path A — create a platform sprite and put it on a layer

Guest (init) — [`games/ylos2/index.tsx`](./games/ylos2/index.tsx):

```ts
const s = new TWO.Sprite2D(this.atlas, rPlat);
s.setPos(p.x + p.w / 2, p.y);
this.layer.add(s);
```

Façade — [`modules/ranger_2d/ranger_2d.tsx`](./modules/ranger_2d/ranger_2d.tsx):

```ts
class Sprite2D {
  id = 0;
  constructor(atlas, regionIndex) { this.id = rg2d_sprite_create(atlas.id, regionIndex); }
  setPos(x, y) { rg2d_sprite_set_pos(this.id, x, y); }
}
class Layer2D {
  add(sprite) { rg2d_layer_add(sprite.id, this.id); }
}
```

Schema seed (command names + `argSpec`) —
[`registry/schema/two_d/two_d_schema.rgr`](./registry/schema/two_d/two_d_schema.rgr):

```rgr
sprite.addMethod((RgMethodDef.cmd(2020 "rg2d_sprite_create" "rg2d_sprite_create" "h:i" "h" "create")))
sprite.addMethod((RgMethodDef.cmd(2021 "rg2d_sprite_set_pos" "rg2d_sprite_set_pos" "h:d:d" "v" "none")))
layer.addMethod((RgMethodDef.cmd(2031 "rg2d_layer_add" "rg2d_layer_add" "h:h" "v" "none")))
```

Interpreter → bridge — [`ComponentEngine.rgr`](./interp/migrate/src/ComponentEngine.rgr)
sees an unknown name and forwards to the native bridge:

```rgr
if (nativeBridge) {
    def bridge:EvalNativeBridge (unwrap nativeBridge)
    if (bridge.has(fnName)) {
        def nativeArgs:[EvalValue] (this.collectCallArgs(node))
        return (bridge.invoke(fnName nativeArgs))
    }
}
```

Transport — [`RgRegistryBridge.rgr`](./interp/engine/RgRegistryBridge.rgr).
`invoke` is table-driven; `h` args resolve guest surrogate ids → fat handles:

```rgr
fn invoke:EvalValue (name:string args:[EvalValue]) {
    def row:RgCommand (RgCodegen.findByName(this.table name))
    def dec:RgDecodedArgs (this.decode(row args))
    return (this.dispatchRow(row dec))
}
; decode of argSpec token "h":
def gid:int (to_int v.numberValue)
def h:RgHandle (this.resolveGuestId(gid))   ; owned[] surrogate → RgHandle
```

Dispatch call sites (same file):

```rgr
if (row.name == "rg2d_sprite_create") {
    def o:OwnedHandle (this.d2.spriteCreate((a.handleAt(0)) (a.intAt(1))))
    def gid:int (this.mintId(o))            ; push OwnedHandle → guest id
    return (RgRegistryBridge.retI(gid))
}
if (row.name == "rg2d_sprite_set_pos") {
    this.d2.spriteSetPos((a.handleAt(0)) (a.dblAt(1)) (a.dblAt(2)))
    return (EvalValue.null())
}
if (row.name == "rg2d_layer_add") {
    this.d2.layerAdd((a.handleAt(0)) (a.handleAt(1)))
    return (EvalValue.null())
}
```

Host arena — [`RgRanger2D.rgr`](./modules/ranger_2d/RgRanger2D.rgr).
**Structures accessed:**

| Structure | Fields touched | Role |
|-----------|----------------|------|
| `RgRanger2D.sprites:[RgSprite2D]` | `atlasH`, `regionIndex`, `x`, `y`, `layerSlot` | authoritative sprite payload |
| `RgRanger2D.layers:[RgLayer2D]` | `childCount` | membership counter (not ownership) |
| `RgRanger2D.registry:RgRegistry` | slot / gen / type / payload | typed handle table |
| `OwnedHandle` | `handle`, `released` | ownership wrapper; mint → `bridge.owned[]` |
| `RgHandle` | `slot`, `generation`, `realmId`, `typeId` | fat handle (`typeId` = `Rg2DType.sprite()` = 32) |

```rgr
class RgSprite2D {
    def atlasH:RgHandle (new RgHandle)
    def regionIndex:int 0
    def x:double 0.0
    def y:double 0.0
    def layerSlot:int 0    ; membership (0 = none)
}

fn spriteCreate:OwnedHandle (atlasH:RgHandle regionIndex:int) {
    def idx:int (this.allocSprite())
    def sp:RgSprite2D (itemAt this.sprites idx)
    sp.atlasH = atlasH
    sp.regionIndex = regionIndex
    this.registry.retain(atlasH)                          ; D-OWN shared retain
    def h:RgHandle (this.registry.alloc(this.realmId (Rg2DType.sprite()) idx))
    return (OwnedHandle.own(h))
}

fn spriteSetPos:void (spriteH:RgHandle x:double y:double) {
    def sp:RgSprite2D (this.spriteResolve(spriteH))       ; resolveTyped(sprite)
    sp.x = x
    sp.y = y
}

fn layerAdd:RgResolve (spriteH:RgHandle layerH:RgHandle) {
    ; … resolveTyped sprite + layer …
    sp.layerSlot = layerH.slot
    ly.childCount = (ly.childCount + 1)
}
```

The guest `Sprite2D` is a thin id holder. Authoritative pose/membership live in
`RgSprite2D`. Reordering never changes the guest id (D-IDENTITY / D-2D).

#### Path B — read input each frame

Guest — [`games/ylos2/index.tsx`](./games/ylos2/index.tsx):

```ts
const pad = runtime.input.player(pl.slot);
const left = pad.isDown("left");
```

Façade — [`modules/ranger_core/ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx)
(`__RgPlayerInput` is guest-only — no host handle):

```ts
class __RgPlayerInput {
  isDown(action) { return rgcore_input_is_down(this.index, action) > 0; }
}
```

Schema — [`core_schema.rgr`](./registry/schema/core/core_schema.rgr):
`rgcore_input_is_down` · `argSpec "i:s"` · ret `"i"`.

Ranger call sites — bridge dispatch →
[`RgInputSurface.rgr`](./modules/ranger_core/RgInputSurface.rgr):

```rgr
; RgRegistryBridge.dispatchRow
if (row.name == "rgcore_input_is_down") {
    if (this.input.isDown((a.intAt(0)) (a.strAt(1)))) {
        return (RgRegistryBridge.retI(1))
    }
    return (RgRegistryBridge.retI(0))
}

; RgInput — modules/ranger_core/RgInputSurface.rgr
fn isDown:boolean (playerIndex:int action:string) {
    def p:RgPlayerInput (itemAt this.players playerIndex)
    def idx:int (p.findAction(action))
    if (idx < 0) { return false }
    return (itemAt p.isDown idx)
}
```

**Structures accessed:**

| Structure | Fields | File |
|-----------|--------|------|
| `RgRegistryBridge.input:RgInput` | `players:[RgPlayerInput]` | `RgRegistryBridge.rgr` owns the instance |
| `RgPlayerInput` | `actions:[string]`, `isDown:[boolean]`, `wasPressed:[boolean]` | `RgInputSurface.rgr` |

Who *feeds* the pad is outside the game: e2e uses
[`RgAttractDriver.rgr`](./runtime/game_host/RgAttractDriver.rgr) →
`bridge.input.setAction(…)`; a real device writes the same arrays. The guest
sees only logical action names.

#### Path C — load the atlas from package data

Guest — [`games/ylos2/index.tsx`](./games/ylos2/index.tsx):

```ts
this.atlas = runtime.assets.loadSpriteAtlas("pkg://player.atlas");
this.rIdle = this.atlas.regionIndex("idle");
```

Façade — [`ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx):

```ts
loadSpriteAtlas(uri) { return new __RgLoadedAtlas(rgcore_assets_load_atlas(uri)); }
```

Package file — [`games/ylos2/player.atlas`](./games/ylos2/player.atlas)
(`texture` / `region` / `clip` lines).

Ranger — bridge loads into the **same** 2D arenas sprites use
([`RgRegistryBridge.loadAtlasAsset`](./interp/engine/RgRegistryBridge.rgr)):

```rgr
fn loadAtlasAsset:int (uri:string) {
    ; strip pkg:// → read packageDir/rel
    def raw:buffer (buffer_read_file pdir rel)
    ; for each line:
    ;   texture → d2.textureCreate + d2.atlasCreate + mintId
    ;   region  → d2.atlasAddRegion(atlasH, name, x, y, w, h)
    ;   clip    → d2.atlasAddClip(…)
    return atlasGuestId
}

; dispatchRow:
if (row.name == "rgcore_assets_load_atlas") {
    def atlasId:int (this.loadAtlasAsset((a.strAt(0))))
    return (RgRegistryBridge.retI(atlasId))
}
```

**Structures accessed:**

| Structure | Fields | File |
|-----------|--------|------|
| `RgRegistryBridge.packageDir` | game folder path | set by `RgGameHost.load` |
| `RgRanger2D.textures:[RgTexture2D]` | `width`, `height` | `RgRanger2D.rgr` |
| `RgRanger2D.atlases:[RgSpriteAtlas]` | `textureH`, `regions:[RgSpriteRegion]`, `clips:[RgAnimClip2D]` | same |
| `RgSpriteRegion` | `name`, `x`, `y`, `w`, `h` | same |
| `bridge.owned:[OwnedHandle]` | atlas (+ texture) guest ids | `RgRegistryBridge.rgr` |

`regionIndex("idle")` then hits `rg2d_atlas_region_index` →
`RgRanger2D.atlasRegionIndex` scanning `at.regions` by name — the same
`RgSpriteAtlas` Path A’s sprites retain.

**Profile split:** interpreter resolves synchronously here; wasm profile lowers
the same semantic op to D-ASYNC begin/poll. URIs stay `pkg://…` (§2.7).

#### Path D — render call → pane bind → pixels on the “display card”

Guest — [`games/ylos2/index.tsx`](./games/ylos2/index.tsx):

```ts
this.renderer.render(this.layer, this.cam1, 0);
this.renderer.render(this.layer, this.cam2, 1);
```

Façade — [`ranger_2d.tsx`](./modules/ranger_2d/ranger_2d.tsx):

```ts
class Renderer2D {
  render(scene, cam, pane) { rg2d_render(scene.id, cam.id, pane); }
}
```

Schema: `rg2d_render` · `argSpec "h:h:i"` (layer, camera, pane index).

**Step 6 — bind only (no pixels).** Bridge dispatch →
[`RgSurface.paneSetView`](./modules/ranger_core/RgInputSurface.rgr):

```rgr
; RgRegistryBridge.dispatchRow
if (row.name == "rg2d_render") {
    this.surface.paneSetView((a.intAt(2)) (a.handleAt(0)) (a.handleAt(1)))
    return (EvalValue.null())
}

; RgSurface — modules/ranger_core/RgInputSurface.rgr
class RgPane {
    def layerH:RgHandle (new RgHandle)   ; REAL handles, host-owned
    def camH:RgHandle (new RgHandle)
}
fn paneSetView:void (i:int layerH:RgHandle camH:RgHandle) {
    def p:RgPane (itemAt this.panes i)
    p.layerH = layerH
    p.camH = camH
}
```

**Step 7 — present to the framebuffer** (“display card” stand-in).
Caller (e2e / runtime) —
[`Rg2DPresenter.rgr`](./runtime/game_host/Rg2DPresenter.rgr) +
[`RgSoftwareRenderer2D.rgr`](./render/backends/software/RgSoftwareRenderer2D.rgr):

```rgr
; Rg2DPresenter.present
sfn present:int (bridge:RgRegistryBridge paneIndex:int fb:RgFramebuffer) {
    def layerH:RgHandle (bridge.surface.paneLayer(paneIndex))
    def camH:RgHandle (bridge.surface.paneCam(paneIndex))
    return (RgSoftwareRenderer2D.present2D(bridge.d2 fb layerH camH))
}

; RgSoftwareRenderer2D.present2D — READS host state only (D-SYNC)
sfn present2D:int (d:RgRanger2D fb:RgFramebuffer layerH:RgHandle camH:RgHandle) {
    def handles:[RgHandle] (d.liveSpriteHandles())
    ; for each live sprite whose layerSlot == layerH.slot:
    def sx:double (d.worldToScreenSwX(camH (d.spriteX(sh)) (d.spriteY(sh))))
    def sy:double (d.worldToScreenSwY(camH (d.spriteX(sh)) (d.spriteY(sh))))
    fb.plot(px py color)   ; RgFramebuffer.pixels:[int]
}
```

**Structures accessed end-to-end:**

| Structure | Access | File |
|-----------|--------|------|
| `RgSurface.panes:[RgPane]` | write `layerH`/`camH` at render; read at present | `RgInputSurface.rgr` |
| `RgRanger2D.sprites` + `cameras` | read pose + camera math | `RgRanger2D.rgr` |
| `RgRegistry` (via `liveSpriteHandles`) | enumerate live `typeId == sprite` slots | `RgRanger2D.rgr` / `host/RgRegistry.rgr` |
| `RgFramebuffer.pixels:[int]` | `plot` / `at` | `RgSoftwareRenderer2D.rgr` |

Split-screen = two pane binds of the **same** layer, two cameras — not two
scene graphs. e2e asserts centre pixels on left/right fbs
([`tests/e2e/ylos2_e2e_test.rgr`](./tests/e2e/ylos2_e2e_test.rgr)).

#### Path E — lifecycle: `runtime.start` → init → update → present

Guest top-level — [`games/ylos2/index.tsx`](./games/ylos2/index.tsx):

```ts
const __game = new Ylos2Game();
runtime.start(__game);
```

Façade lifecycle shims — [`ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx):

```ts
start(game) { __rgGame = game; }
function __rgGameInit() { return __rgGame.init(); }
function __rgGameUpdate(props) { return __rgGame.update(props); }
```

Ranger host — [`RgGameHost.rgr`](./runtime/game_host/RgGameHost.rgr):

```rgr
fn load:boolean (dir:string file:string) {
    this.bridge = (RgRegistryBridge.create())
    this.engine.setNativeBridge(this.bridge)
    this.engine.registerVirtualModule("ranger:core" (buffer_to_string coreSrc))
    this.engine.registerVirtualModule("ranger:2d" (buffer_to_string twoSrc))
    this.bridge.packageDir = dir
    this.engine.loadScript((buffer_to_string game))   ; top-level runtime.start
    def initR:EvalValue (this.engine.callFunction("__rgGameInit" (EvalValue.null())))
    …
}

fn frame:void (dtMs:double) {
    this.engine.callFunction("__rgGameUpdate" (EvalValue.object(keys vals)))
    this.bridge.frameBoundary((dtMs / 1000.0))
    ; present is NOT here — caller/presenter reads pane state (Path D step 7)
}
```

```text
RgGameHost.load
  ├─ registerVirtualModule ranger:core / ranger:2d
  ├─ loadScript → runtime.start(__game)          ; stores __rgGame in guest
  └─ callFunction("__rgGameInit")                ; Paths A + C + surface layout

RgGameHost.frame(dtMs)
  ├─ callFunction("__rgGameUpdate", { dtMs })    ; Paths B + D binds
  ├─ bridge.frameBoundary                        ; clock / audio / input edges
  └─ (outside) Rg2DPresenter.present             ; Path D pixels
```

**Structures accessed at the host edge:**
`RgGameHost.engine:ComponentEngine`, `RgGameHost.bridge:RgRegistryBridge`
(owns `d2`, `input`, `surface`, `audio`, `clock`, `owned[]`). No ylos2 types
appear in this file — only the lifecycle protocol.

Wasm guests export the same two entry points; only the transport differs.
Attract input (`RgAttractDriver` + optional `autopilotBits`) stays out-of-band.

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
