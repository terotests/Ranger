# PLAN — 2D mode embedding 3D objects (v2)

**Status:** architecture approved; **H0 not frozen** — spec revision after review  
**Scope:** `gallery/game_engine/v2/` only  
**Related:** [`QUESTIONS.md`](./QUESTIONS.md) Q1–Q3, [`BRIDGES.md`](./BRIDGES.md) §6,
[`CODE_CLEANUP.md`](../CODE_CLEANUP.md) D-2D / D-MODULES / frame pipeline,
[`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) Phase 11–12+

---

## 1. Intent

Enable a single v2 game to:

1. Stay authored against simple **2D** concepts (`Sprite2D`, `Layer2D`,
   `Camera2D`, `Renderer2D`).
2. Optionally draw **3D** into the same surface (background / overlays).
3. Optionally treat a live **3D scene as a 2D sprite** (portrait, inventory
   item, portal, pixel-crunchy model).

**Principle:** 2D and 3D share **GPU / present infrastructure**, not scene
semantics. The 2D API must **not** be “the 3D API with `z = 0`”.

Central decisions that stand:

* `ranger:2d` and `ranger:three` remain separate scene APIs.
* Both share `Texture2D`, `RenderTarget`, the device, and presentation.
* Whole-layer composition and render-to-texture are separate first-class
  mechanisms.
* Pass order is controlled by the game (one global ordered stream).
* Shared 2D/3D depth is deferred.
* `attachRenderer` is deprecated in favour of recorded render commands.

This plan answers [`QUESTIONS.md`](./QUESTIONS.md) Q2 / Q3 and sequences work
after Phase 11 (software 2D present) and Phase 12 (selected games).

---

## 2. What v2 already has

| Piece | Status today | Where |
|-------|--------------|--------|
| `ranger:2d` façades | Live | [`modules/ranger_2d/ranger_2d.tsx`](./modules/ranger_2d/ranger_2d.tsx) |
| Retained 2D arenas | Live | [`modules/ranger_2d/RgRanger2D.rgr`](./modules/ranger_2d/RgRanger2D.rgr) |
| `Sprite2D(atlas, regionIndex)` | Live | façade + `RgSprite2D` retains **atlas**, not a bare texture |
| `Layer2D.add(sprite)` | Live | sprite handles only |
| `Renderer2D.render(layer, cam, pane)` | Live bind | `rg2d_render` → surface pane view |
| Software present | Live, 2D-only | [`Rg2DPresenter`](./runtime/game_host/Rg2DPresenter.rgr) → [`RgSoftwareRenderer2D`](./render/backends/software/RgSoftwareRenderer2D.rgr) — **plots marker colours from region index; does not sample texels** |
| Frame pipeline steps 6–7 | Live | guest `render*` in `update`; host present after |
| Split panes | Live | `runtime.surface` + pane indices (ylos2) |
| `ranger:three` guest module | Scaffold only | [`modules/ranger_three/`](./modules/ranger_three/) |
| Staged Three + GL FBO helpers | Staged / separate hosts | [`three/port/`](./three/port/), [`web/`](./web/) |
| `attachRenderer` | Guest stub | no host registration |
| `RgTexture2D` pixels | Metadata only | width/height; no RGBA store (Q1) |
| Common graphics package | **Absent** | backends under `render/` |

**Bottom line:** the sibling-package model and multi-`render` frame pipeline are
the right shape. Missing pieces: shared texture/view/RT types, one global
`FramePass` stream, texture-backed sprites, ownership + hazard rules, and a
backend-coherent path into the generic game host.

---

## 3. Recommended layering (mapped onto v2)

```text
Guest game APIs (virtual modules — D-MODULES)
├── ranger:2d
│   ├── Sprite2D · Layer2D · Camera2D · Renderer2D
│   ├── TextureView2D / SpriteSource   ← atlas region OR full texture view
│   └── (later) TileMap2D · masks · batching helpers
│
├── ranger:three
│   ├── Mesh · Scene · Camera · Renderer3D
│   └── SceneSprite3D                  ← owns RT + Sprite2D (composition)
│
└── ranger:core
    ├── runtime.surface
    │   ├── .target                    ← explicit full-surface destination
    │   └── .pane(i)                   ← PaneTarget (+ input binding)
    └── runtime.graphics               ← Texture2D · RenderTarget · Sampler
         (or import * as GFX from "ranger:graphics" if we split the package)

Host / internal (not game scene graphs)
├── host arenas
│   ├── RgRanger2D …
│   ├── RgThree …
│   └── RgGraphics             (Texture2D backing · TextureView · RenderTarget)
│
└── render/
    ├── backends/software/
    ├── backends/gpu/          (shared device; GL/ES)
    └── present/
        ├── Rg2DPresenter      (today)
        └── RgComposePresenter ← replays frame.passes[] in guest order
```

Notes:

- Prefer **`runtime.graphics`** first; promote to `ranger:graphics` if the
  surface grows.
- `Renderer2D` / `Renderer3D` are façades that **append** to the frame pass
  list; the presenter executes that list at step 7 (D-SYNC).
- Staged `three_gl.rgr` FBO helpers are GPU-backend provenance, not the guest
  API.

---

## 4. Design decisions

### D1 — Two composition mechanisms (both first-class)

| Mechanism | When | Guest shape |
|-----------|------|-------------|
| **Shared-destination passes** | Whole layers behind or in front of each other | Ordered `render3D` / `render2D` into the same `SurfaceTarget` or `PaneTarget` |
| **Render-to-texture** | 3D must behave like a sprite | `Renderer3D.render(scene, cam, { target: rt })` then 2D samples a `TextureView2D` of `rt.colorTexture` |

### D2 — One global ordered `FramePass` list

**Fundamental representation** (not per-pane lists + a separate offscreen job
queue):

```ts
type FramePass =
  | Render2DPass
  | Render3DPass
  | ClearPass
  | ResolvePass;

interface Render2DPass {
  target: RenderDestination;
  layer: Layer2DHandle;
  camera: Camera2DHandle;
  color: AttachmentOps;   // see D9
  // depth N/A for pure 2D
}

interface Render3DPass {
  target: RenderDestination;
  scene: Scene3DHandle;
  camera: Camera3DHandle;
  color: AttachmentOps;
  depth?: AttachmentOps;
}

// Host-owned for the current update → present cycle:
frame.passes: FramePass[];
```

Every `renderer*.render(...)` **appends** to this one list. Per-pane grouping
may be derived later as an optimisation; it is **not** the source of truth.

That preserves order across mixed destinations:

```ts
renderer3d.render(portraitScene, portraitCamera, { target: portraitTarget });
renderer2d.render(world, worldCamera, { target: leftPane });
renderer3d.render(mapScene, mapCamera, { target: mapTarget });
renderer2d.render(hud, hudCamera, { target: leftPane });
```

Separate pane/offscreen lists would require sorting or dependency
reconstruction — rejected for the first cut.

Zero passes in an update → re-present the previous frame (existing rule).

Shared depth between 2D and 3D in one pass remains **out of scope**.

### D3 — Three explicit destination kinds

```ts
type RenderDestination =
  | SurfaceTarget   // runtime.surface.target — full bleed
  | PaneTarget      // runtime.surface.pane(i) — viewport + input binding
  | RenderTarget;   // offscreen; exposes colorTexture
```

| Kind | Role |
|------|------|
| **`SurfaceTarget`** | Entire display surface; use for full-bleed 3D under/over split UI |
| **`PaneTarget`** | One surface viewport (split-screen); scissor/viewport = pane rect |
| **`RenderTarget`** | Offscreen color (+ optional depth); sampled via `TextureView2D` |

**Omitted target is never layout-dependent.**

```ts
render(scene, camera); // always means runtime.surface.target
```

Once a non-default layout is active, authors who mean a pane **must** pass that
pane. Do not invent “omission means left pane” or “omission means all panes”.

Bare integer pane indices remain an interpreter/wasm **lowering** (ylos2 today),
not the long-term authorship vocabulary.

### D4 — `attachRenderer`

**Deprecate the stub.** Backends are inferred from which `render*` commands ran
(and which packages the realm loaded). Optional later: a “2D-only” capability
profile rejects `Renderer3D` at construct with a typed error.

### D5 — Presenter ownership

```text
RgGameHost           — lifecycle only
RgComposePresenter   — reads frame.passes[]; picks SW/GPU backends
Rg2DPresenter        — 2D-only adapter until compose lands, then 2D backend entry
```

Host stays backend-agnostic and game-agnostic.

### D6 — Split-screen + full-bleed

Express both with destinations, not special host modes:

```ts
renderer3d.render(background, cam3d, { target: runtime.surface.target, ... });
renderer2d.render(p1World, cam1, { target: leftPane, ... });
renderer2d.render(p2World, cam2, { target: rightPane, ... });
```

Order in `frame.passes` decides stacking. No “broadcast this 3D pass to every
pane” sugar in the first cut.

### D7 — Color space and alpha (pipeline wording)

Direction: linear 3D lighting, sRGB display textures, premultiplied alpha for
RTT → sprite compositing.

**Actual pipeline:**

```text
3D shading in linear space
→ tone mapping (still linear display-referred)
→ hardware sRGB encoding when writing rgba8-srgb
→ hardware sRGB decoding when Renderer2D samples it
→ 2D compositing in linear space
→ final sRGB encoding at presentation
```

Do **not** manually gamma-encode before writing an sRGB attachment (that would
double-encode).

**Premultiplied targets:**

```text
rgb output must already be multiplied by alpha
blend = ONE, ONE_MINUS_SRC_ALPHA
```

Transparent 3D materials and MSAA edge resolution are **follow-on gates**.
First proof: opaque models over a transparent clear (`clearColor` alpha 0).

Guest knobs (`alphaMode`, format) exist on `RenderTarget` create; packages
rarely need them.

### D8 — 2D stays first-class (not z=0)

`Renderer2D` keeps sprite-oriented behaviour (batching, atlases, flip, tint,
layer/transparency order, later tile maps / masks / anchoring) even when
implemented with shared GPU primitives.

### D9 — Attachment load / store (clear is sugar)

Façade sugar such as `clear: "color-depth"` / `clear: "none"` lowers to:

```ts
interface AttachmentOps {
  load: "clear" | "load";
  clearValue?: /* color: vec4 | depth: number */;
  store: "store" | "discard";
}
```

| Case | Rule |
|------|------|
| Newly created or resized `RenderTarget` | Initialized (implicit clear) **or** `load: "load"` rejected until first store |
| First pass of a frame to a pane/surface | Default `color.load = "clear"` unless author opts into `load` |
| Pane/surface between frames | Persist last presented contents; zero passes → re-present |
| Offscreen RT between frames | Persist until release/resize (unless `store: "discard"`) |
| After resize | Attachments recreated; previous contents gone; same init/`load` rules |
| Consecutive 3D passes, depth | Depth persists only if prior pass used `depth.store = "store"` and next uses `depth.load = "load"` |
| Uninitialized GPU attachment + `load` | Must not yield unspecified pixels — reject or force clear |

### D10 — Texture-backed sprites (`TextureView2D`)

**Problem:** today’s API is atlas-centric:

```ts
new TWO.Sprite2D(atlas, regionIndex);  // live
// RgSprite2D retains atlasH — not a bare Texture2D
```

The hybrid plan needs `Sprite2D` to display RTT (and later video / procedural /
canvas) **without** minting a synthetic one-region atlas per target.

**Common source abstraction:**

```ts
interface TextureView2D {
  texture: Texture2D;
  uv: Rect;           // default full texture [0,0,1,1]
  sampler?: Sampler;  // filter / wrap; default linear or nearest per context
}

type SpriteSource = AtlasRegion | TextureView2D;

new TWO.Sprite2D({ source: atlas.region("idle") });
new TWO.Sprite2D({ source: target.colorTexture.view() });
```

Atlas regions **are** texture views (named UV rects over the atlas texture).
Legacy `(atlas, regionIndex)` remains a supported constructor sugar that lowers
to `{ source: atlas.regionByIndex(i) }` so ylos2-class games keep compiling.

`Layer2D.add` continues to take sprite handles; `SceneSprite3D` is composition,
not a second child kind:

```ts
class SceneSprite3D {
  readonly target: RenderTarget;
  readonly sprite: Sprite2D;   // texture-backed via target.colorTexture.view()
  // optional Sprite2D-compatible forwards (setPos, …)
}
```

Internally it still lowers to an ordinary texture-backed sprite. It **schedules
its own producer `Render3DPass`** automatically before the first 2D pass that
would sample its texture (see D12), so authors need not manually order that
pair when using the ergonomic type.

### D11 — Frame-pass lifetime and ownership

Recording happens in `update` (step 6); execution happens in present (step 7).
A recorded pass must not hold a borrowed handle the guest already released.

> **Rule:** recording a pass **retains** every referenced resource until the
> frame is presented or discarded.

Retained at least:

* Scene or layer
* Camera
* `RenderDestination` (surface / pane state / render target)
* Textures and attachments sampled or written
* Materials / pipelines if the pass references them directly

After presentation (or discard on update error / teardown), the pass list
**releases** those temporary frame references.

**`RenderTarget` ↔ `colorTexture` ownership:**

* The render target **owns** its color (and depth) attachments.
* External users may **retain a `TextureView2D`** (or the texture handle) —
  retain bumps the texture’s refcount.
* Destroying / releasing the RT **invalidates rendering into it**
  (subsequent passes targeting it fail typed).
* An externally retained view **keeps the resolved color texture alive** for
  sampling until that retain is released (attachment storage outlives the RT
  object, or the texture identity is transferred — implementation detail; the
  observable rule is: retained views remain sampleable; writing through a
  released RT fails deterministically).

### D12 — Render-target hazard rules

Strict guest order is the first implementation. The recorder **validates**:

| Situation | Rule |
|-----------|------|
| Read-after-write (producer earlier in `frame.passes`) | Allowed |
| Write-after-read (later pass) | Allowed |
| Multiple writes to same target | Allowed; ordered by list |
| Self-sample (pass samples texture it is writing) | **Rejected** (no framebuffer-fetch feature yet) |
| Circular `SceneSprite3D` / embedded views | **Rejected** |
| Resize of a target while referenced by a recorded pass | **Rejected** or deferred until after present |
| Sample unresolved MSAA attachment | Auto-resolve via `ResolvePass`, or reject |

Raw RTT API: author must place producer before consumer in the global list.
`SceneSprite3D`: inserts its producer pass automatically before the consuming
2D pass.

### D13 — Backend residency coherence

One public `Texture2D` type does **not** imply zero-copy between every backend
pair. Explicit matrix:

```text
SW 3D  → CPU Texture2D → SW 2D     supported (default headless proof)
GPU 3D → GPU Texture2D → GPU 2D    supported (shared device)
GPU 3D → CPU / SW 2D               explicit readback only (discouraged)
SW 3D  → GPU 2D                    upload required
```

Today’s SW 2D present does not sample texels at all (region-index markers).
Any RTT→sprite proof must either:

1. Use a **software 3D** path into a CPU-backed `Texture2D` sampled by SW 2D, or
2. Move **shared-device GPU 2D** alongside the first GL 3D path (preferred if GL
   is the intended live 3D backend).

Option “GPU 3D + readback into SW 2D” is allowed only as an explicit, tested
transfer — not the default.

### D14 — `SceneSprite3D` update modes (revision-based)

Detecting “dirty” across transforms, materials, lights, skins, time-dependent
shaders, and external procedural state is non-trivial.

**First version:**

```ts
update: "everyFrame" | "manual"
modelSprite.invalidate();   // manual path
```

**Later**, once scene / camera / material / texture **revision counters**
propagate reliably:

```ts
update: "whenDirty" | { fps: number }
```

`whenDirty` compares recorded revisions; anything not covered must still be
invalidated manually. Do not claim automatic dirty tracking before the revision
system exists.

---

## 5. Public API sketches (v2-shaped)

### 5.1 Shared graphics types

```ts
import { runtime } from "ranger:core";

const rt = runtime.graphics.createRenderTarget({
  width: 256,
  height: 256,
  colorFormat: "rgba8-srgb",
  depth: true,
  alphaMode: "premultiplied",
  clearColor: [0, 0, 0, 0],
});

const view = rt.colorTexture.view(); // TextureView2D, full UV by default
```

**Decision lean:** `runtime.graphics` on `ranger:core` first.

`Texture2D` grows backing variants (CPU pixels and/or GPU residency) so image
decode, RTT attachments, and later uploads share one guest type (Q1).

### 5.2 Ordinary 2D (atlas sugar preserved)

```ts
import * as TWO from "ranger:2d";

const sprite = new TWO.Sprite2D(atlas, regionIndex); // sugar → SpriteSource
// or: new TWO.Sprite2D({ source: atlas.region("idle") });
layer.add(sprite);
renderer2d.render(layer, camera2d, { target: runtime.surface.pane(0) });
```

### 5.3 3D as a texture for a sprite (RTT)

```ts
import * as THREE from "ranger:three";

const target = runtime.graphics.createRenderTarget({
  width: 256, height: 256, colorFormat: "rgba8-srgb", depth: true,
});
const portrait = new TWO.Sprite2D({ source: target.colorTexture.view() });
layer.add(portrait);

update(frame) {
  renderer3d.render(scene, camera3d, {
    target,
    clear: "color-depth", // sugar → AttachmentOps
  });
  renderer2d.render(layer, camera2d, {
    target: runtime.surface.pane(0),
    clear: "none",
  });
}
```

### 5.4 Ergonomic embedded view

```ts
const modelSprite = new THREE.SceneSprite3D({
  scene,
  camera,
  resolution: { mode: "fixed", width: 256, height: 256 },
  update: "manual",       // first cut; whenDirty after revisions
  alpha: true,
  depth: true,
  sampling: "nearest",    // pixel-art crunch
});
layer.add(modelSprite.sprite); // or layer.add(modelSprite) if it forwards

update(frame) {
  modelSprite.invalidate(); // if update: "manual" and content changed
  renderer2d.render(layer, camera2d, { target: runtime.surface.target });
  // SceneSprite3D ensures its Render3DPass is in frame.passes before the
  // consuming 2D pass.
}
```

Resolution modes (adaptive sizing is a later slice — H7):

```ts
type TargetResolution =
  | { mode: "fixed"; width: number; height: number }
  | {
      mode: "matchDisplaySize";
      scale?: number;
      min?: [number, number];
      max?: [number, number];
    };
```

### 5.5 Interaction / picking (later slice)

```ts
modelView.onPointerDown((event) => {
  const ray = modelView.cameraRay(event.localPosition);
  const hit = modelScene.raycast(ray);
});
```

---

## 6. Internal rendering notes

### 6.1 Sprite batching (GPU path)

```text
one shared static unit quad
+ dynamic instance buffer (transform, uvRect, tint, depth, flip)
+ texture / atlas bind (from TextureView2D)
→ instanced draw
```

Do not allocate a vertex buffer per sprite. SW may keep marker plots until a
sampling path exists; camera math and membership stay identical (D-2D-4).

### 6.2 Present pipeline

Today:

```text
rg2d_render → pane.bind(layerH, camH)
present     → RgSoftwareRenderer2D.present2D(fb, layerH, camH)
```

Target:

```text
rg2d_render / rg3d_render / …
  → retain refs; append FramePass to frame.passes (global order)
  → validate hazards (D12)

present (RgComposePresenter):
  for each pass in frame.passes:
    execute (SW or GPU per residency rules D13)
  compose surface
  release frame retains (D11)
```

---

## 7. Work phases (revised)

Phases are **v2 follow-ons** after CODE_CLEANUP Phase 11; parallel with Phase 12
game ports is fine. No v1 path deletion.

### H0 — Spec (this document) — **not frozen until review items land**

- [x] Architecture principle + D1–D14
- [x] Links from [`QUESTIONS.md`](./QUESTIONS.md) / [`README.md`](./README.md)
- [ ] Review sign-off that H0 is complete (this revision addresses the four
      required fixes: global pass stream, surface target, texture-backed
      sprite/source, ownership / residency / clear / hazard rules)

### H1 — `Texture2D` backing variants, `TextureView2D`, `RenderTarget`, ownership

| Deliverable | Notes |
|-------------|--------|
| `RgTexture2D` CPU and/or GPU backing | Q1; residency tagged on the texture |
| `TextureView2D` (uv + optional sampler) | Atlas regions produce views |
| `RgRenderTarget` owns attachments | D11 `colorTexture` / retain rules |
| Façade `runtime.graphics.createRenderTarget` | |
| Gate | create/resize/release; retained view outlives RT object for sampling; write-after-RT-release fails typed |

### H2 — One global `FramePass` list; 2D passes; load/store semantics

| Deliverable | Notes |
|-------------|--------|
| Host `frame.passes: FramePass[]` | Cleared each update boundary |
| `rg2d_render` appends `Render2DPass` | Not “last view wins” |
| Destinations: surface / pane / (later RT) | D3; omit = surface.target |
| `AttachmentOps` + sugar | D9 |
| `RgComposePresenter` executes list | |
| Gate | two 2D passes, second `load: load` / `clear: none`; `pass_retains_resources`; `new_target_load_rejected_or_initialized` |

Deprecate behavioural reliance on `attachRenderer`.

### H3 — RTT proof on a **backend-coherent** path

Pick **one** coherent pair for the first green gate (state which in the PR):

* **A (headless-default):** SW 3D → CPU `Texture2D` → SW 2D sampling, **or**
* **B (if GL is the live 3D intent):** GPU 3D → GPU `Texture2D` with GPU 2D
  pulled forward (overlaps H5)

| Deliverable | Notes |
|-------------|--------|
| Minimal `ranger:three` registration in `RgGameHost` | Opt-in import |
| `Renderer3D.render(..., { target: rt })` | Appends `Render3DPass`; D-SYNC |
| Hazard validation | Self-sample rejected |
| Gate | `rtt_sprite`, `rtt_self_sample_rejected`, `backend_residency_transfer` if any transfer is used |

Until this lands, 3D demos stay on separate hosts.

### H4 — Texture-backed `Sprite2D` + minimal `SceneSprite3D`

| Deliverable | Notes |
|-------------|--------|
| `Sprite2D({ source })` + atlas sugar | D10; ylos2 keeps compiling |
| SW or GPU 2D **samples** `TextureView2D` | End of marker-only present for this path |
| `SceneSprite3D` = RT + `Sprite2D` | `update: "everyFrame" \| "manual"` + `invalidate()` |
| Auto-insert producer pass | D12 |
| Gate | `rtt_multiple_consumers`, `scene_sprite_manual_invalidate` |

### H5 — Shared-device GPU 2D/3D (if GL is the 3D backend)

| Deliverable | Notes |
|-------------|--------|
| Shared device / buffers | Internal only |
| Instanced quad `Renderer2D` | §6.1 |
| Camera2D parity SW == GPU | D-2D-4 |
| Prefer this **alongside H3/H4** when choosing path B | Avoids readback |

If H3 chose software-only (path A), H5 can follow; if path B, treat H5 as part
of the H3/H4 delivery train.

### H6 — Pane + full-surface mixed composition

| Deliverable | Notes |
|-------------|--------|
| `Render3DPass` / `Render2DPass` to `SurfaceTarget` and `PaneTarget` | D3 / D6 |
| Split independence via destinations in one global list | |
| Gate | `surface_pass_before_split_panes`, `hybrid_panes`, `compose_pass_order` |

### H7 — Dirty tracking, adaptive resolution, picking, hybrid demo

| Deliverable | Notes |
|-------------|--------|
| Revision counters → `whenDirty` / `{ fps }` | D14 |
| `matchDisplaySize` resolution mode | |
| `cameraRay` picking | |
| Must-pass hybrid demo under `games/` | |
| Color gates | `premultiplied_alpha_edges`, `srgb_no_double_encode` |
| Docs | BRIDGES path E; README progress |

---

## 8. Non-goals (first cut)

- Unifying 2D and 3D into one scene graph or one public `Node` type
- Shared depth testing between sprites and meshes in a single draw
- Full Three.js postprocessing / MRT as a guest requirement
- Framebuffer-fetch / intentional self-sample
- Automatic `whenDirty` before revision propagation exists
- Default GPU↔SW readback bridges
- Replacing EVG/UI soft-canvas paths
- Breaking ylos2 atlas `(atlas, regionIndex)` sugar
- Any v1 `scripting/` deletion (runnable-legacy freeze)

---

## 9. Test gates (contract-level)

| Gate | Asserts |
|------|---------|
| `d_graphics_rt` | RT create/resize/release; attachment ownership; D-OWN |
| `pass_retains_resources` | Release after `render` still presents; post-present refs dropped |
| `new_target_load_rejected_or_initialized` | D9 on fresh/resized targets |
| `compose_pass_order` | Global guest order; mixed RT + pane destinations |
| `rtt_sprite` | 3D → RT → texture-backed Sprite2D → present |
| `rtt_self_sample_rejected` | Typed error |
| `rtt_multiple_consumers` | One RT sampled by multiple sprites / passes |
| `rtt_resize_between_frames` | Allowed when not in a live pass list; contents reset |
| `surface_pass_before_split_panes` | Full-surface 3D then per-pane 2D |
| `hybrid_panes` | Pane 0 ≠ pane 1 |
| `backend_residency_transfer` | Only if a transfer path is exposed; cost/sync documented |
| `premultiplied_alpha_edges` | No dark fringe on opaque-over-clear RT → sprite |
| `srgb_no_double_encode` | Linear → sRGB write → sample → present |
| `scene_sprite_manual_invalidate` | Manual update skips fill until `invalidate` |
| `scene_sprite_dirty` | Later: `whenDirty` + revisions |
| `camera2d_parity` | D-2D camera tests; GPU when H5 lands |

Headless CI keeps a coherent SW (or declared GPU) path green; transfers are
additive and explicit.

---

## 10. Migration impact on live guests

| Guest | Impact |
|-------|--------|
| `games/ylos2` | Atlas constructor sugar kept; pane-index lowering OK until façade pass; optional later hybrid celebration art |
| `menu/launcher` | Unaffected |
| Future hybrid title | New `games/` folder; imports `ranger:2d` + `ranger:three` |

`RgGameHost` stays free of game names.

---

## 11. Preferred end-state (authorship)

```ts
// Ordinary 2D
new TWO.Sprite2D({ source: atlas.region("idle") });

// Live 3D scene as a sprite
const portrait = new THREE.SceneSprite3D({
  scene, camera,
  resolution: { mode: "fixed", width: 128, height: 128 },
  update: "manual",
});

// Full-bleed 3D under split 2D
renderer3d.render(background3D, cam3d, { target: runtime.surface.target, clear: "color-depth" });
renderer2d.render(game2D, cam2d, { target: leftPane, clear: "none" });
renderer2d.render(game2D, cam2dB, { target: rightPane, clear: "none" });

// 2D HUD over a 3D game
renderer3d.render(world3D, cam3d, { target: runtime.surface.target, clear: "color-depth" });
renderer2d.render(hud2D, hudCam, { target: runtime.surface.target, clear: "none" });
```

**Main principle:** shared graphics resources and presentation infrastructure;
separate 2D and 3D scene semantics.

---

## 12. H0 completion checklist (review)

Four specification fixes required before implementation starts:

1. [x] One global ordered frame-pass stream (D2)
2. [x] Explicit full-surface target (D3)
3. [x] Real texture-backed 2D sprite/source model (D10)
4. [x] Ownership, backend residency, clear/load/store, and hazard rules
      (D9, D11, D12, D13)

Remaining before calling H0 frozen: human sign-off on this revision.
