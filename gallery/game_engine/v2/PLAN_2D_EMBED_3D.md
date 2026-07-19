# PLAN — 2D mode embedding 3D objects (v2)

**Status:** design plan (not implemented)  
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

This plan answers the open choices in [`QUESTIONS.md`](./QUESTIONS.md) Q2 / Q3
and sequences work that fits the live v2 stack after Phase 11 (software 2D
present) and Phase 12 (selected games).

---

## 2. What v2 already has

| Piece | Status today | Where |
|-------|--------------|--------|
| `ranger:2d` façades | Live | [`modules/ranger_2d/ranger_2d.tsx`](./modules/ranger_2d/ranger_2d.tsx) |
| Retained 2D arenas | Live | [`modules/ranger_2d/RgRanger2D.rgr`](./modules/ranger_2d/RgRanger2D.rgr) (`Texture2D` / atlas / sprite / layer / camera) |
| `Renderer2D.render(layer, cam, pane)` | Live bind | `rg2d_render` → surface pane view |
| Software present | Live, 2D-only | [`Rg2DPresenter`](./runtime/game_host/Rg2DPresenter.rgr) → [`RgSoftwareRenderer2D`](./render/backends/software/RgSoftwareRenderer2D.rgr) |
| Frame pipeline steps 6–7 | Live | guest `render*` in `update`; host present after |
| Split panes | Live | `runtime.surface` + pane indices (ylos2) |
| `ranger:three` guest module | Scaffold only | [`modules/ranger_three/`](./modules/ranger_three/) |
| Staged Three + GL FBO helpers | Staged / separate hosts | [`three/port/`](./three/port/), [`web/`](./web/) — not wired into `RgGameHost` |
| `attachRenderer` | Guest stub | no host registration |
| `RgTexture2D` pixels | Metadata only | width/height; no RGBA store (Q1) |
| Common `ranger:graphics` package | **Absent** | backends live under `render/` |

**Bottom line:** the sibling-package model and multi-`render` frame pipeline are
already the right shape. What is missing is (a) a shared texture / render-target
abstraction, (b) a compose presenter that can run ordered 2D/3D passes, and
(c) a live `ranger:three` path inside the generic game host.

---

## 3. Recommended layering (mapped onto v2)

```text
Guest game APIs (virtual modules — D-MODULES)
├── ranger:2d
│   ├── Sprite2D · Layer2D · Camera2D · Renderer2D
│   └── (later) TileMap2D · masks · batching helpers
│
├── ranger:three
│   ├── Mesh · Scene · Camera · Renderer3D
│   └── SceneSprite3D          ← ergonomic 3D-as-sprite (optional)
│
└── ranger:core
    ├── runtime.surface / panes
    └── runtime.graphics       ← thin capability root over host GFX
         (or import * as GFX from "ranger:graphics" if we split the package)

Host / internal (not game scene graphs)
├── host arenas
│   ├── RgRanger2D …           (retained 2D — already)
│   ├── RgThree …              (live three arenas — to wire)
│   └── RgGraphics             (Texture2D · RenderTarget · Sampler)
│
└── render/
    ├── backends/software/     (SW 2D + SW compose; CI)
    ├── backends/gpu/          (shared device; GL/ES)
    └── present/
        ├── Rg2DPresenter      (today)
        └── RgComposePresenter ← ordered pass list → surface
```

Notes:

- Prefer **`runtime.graphics`** (or a small `ranger:graphics`) for
  `Texture2D` / `RenderTarget` / formats — not burying targets inside
  `ranger:2d` or `ranger:three`. Both domain packages consume the same types.
- Keep **`Renderer2D` / `Renderer3D` as façades** that submit work; the
  presenter owns when pixels hit the surface (D-SYNC: render is not a sync
  boundary; present reads host state).
- Staged `three/port/src/three_gl.rgr` FBO helpers (`gpu_make_depth_target`,
  bind/read) are **implementation provenance** for the GPU backend, not the
  public guest API.

---

## 4. Design decisions (answers to QUESTIONS.md)

### D1 — Two composition mechanisms (both first-class)

| Mechanism | When | Guest shape |
|-----------|------|-------------|
| **Shared-target / pass list** | Whole layers behind or in front of each other | Ordered `render3D` / `render2D` into the same pane (or surface) |
| **Render-to-texture** | 3D must behave like a sprite (rotate, fade, mask, UI slot, atlas-like sampling) | `Renderer3D.render(scene, cam, target)` → `Sprite2D` samples `target.colorTexture` |

Pass-list composition is cheaper when content only needs order. RTT is
required when the result is an object inside the 2D scene graph.

### D2 — Overlay policy

**Guest-declared pass order**, not a fixed “3D always on top”.

```ts
// Conceptual — exact façade names land with schema
frame / update:
  renderer3d.render(background3D, cam3d, { target: pane, clear: "color-depth" })
  renderer2d.render(world2D, cam2d, { target: pane, clear: "none" })
  renderer2d.render(hud2D, hudCam, { target: pane, clear: "none" })
```

Host present replays the **pass list recorded during the update** (step 6),
then submits to the surface (step 7). Zero passes → re-present previous frame
(existing rule).

Shared depth between 2D and 3D in one pass is **out of scope** for the first
cut. Depth is per 3D pass / per RTT; 2D uses layer order + stable transparency
rules inside `Renderer2D`.

### D3 — Targets: panes vs `RenderTarget`

| Target kind | Role |
|-------------|------|
| **Surface pane** | Viewport on the display surface (split-screen, input binding) |
| **`RenderTarget`** | Offscreen color (+ optional depth); exposes `colorTexture: Texture2D` |

Guest signature intent (Q3):

```ts
renderer2d.render(layer, cam)                      // full surface default
renderer2d.render(layer, cam, pane)                // or { target: pane }
renderer3d.render(scene, cam, { target: rt })      // offscreen
renderer3d.render(scene, cam, { target: pane })    // compose into pane
```

Bare integer pane indices remain a **lowering** for the interpreter/wasm
profile (ylos2 today). They are not the long-term authorship vocabulary.

**Answer to Q3 #3:** offscreen uses a distinct `RenderTarget` type in the same
`target:` slot — not a second parallel API, and not “another pane index”.

### D4 — `attachRenderer`

**Deprecate the stub.** Backends are inferred from which `render*` commands
ran (and which packages the realm loaded). Optional later: capability profile
(“2D-only host”) rejects `Renderer3D` at construct time with a typed error.

Do **not** grow `attachRenderer(twoD)` / `attachRenderer(three)` as the primary
model — it fights the existing “game calls render in update; host presents”
pipeline.

### D5 — Presenter ownership

Evolve presentation without teaching `RgGameHost` about games:

```text
RgGameHost          — lifecycle only (unchanged rule)
RgComposePresenter  — reads pane pass lists + host arenas; picks SW/GPU backends
Rg2DPresenter       — remains the 2D-only adapter until compose lands, then
                      becomes the 2D backend entry used by the compose presenter
```

**Answer to Q2 #5:** sibling compose presenter (or rename to
`RgSurfacePresenter`); host stays backend-agnostic.

### D6 — Split-screen + 3D

**Per-pane pass lists.** Each pane may bind its own 2D and/or 3D cameras.
Full-bleed 3D under a split is just “same 3D pass recorded for every pane” or
a single full-surface pass before pane 2D — game policy, not host special case.

### D7 — Alpha and color space (engine conventions)

| Topic | First-cut convention |
|-------|----------------------|
| Compositing alpha | **Premultiplied** for RTT → sprite paths (avoids dark fringes) |
| Display textures | `rgba8-srgb` default for 2D sampling |
| 3D lighting | Linear in the 3D pass; tone-map into the target format before 2D samples |
| Guest knob | `alphaMode` / format on `RenderTarget` create; packages rarely need it |

Document “do not double-apply gamma” when `Renderer2D` samples an sRGB target
texture.

### D8 — 2D stays first-class (not z=0)

`Renderer2D` keeps sprite-oriented behaviour even when implemented with shared
GPU primitives:

- Sprite batching / instancing (shared static quad + dynamic instance buffer)
- Atlas regions, flip, tint, opacity
- Pixel snapping (optional)
- Layer / stable transparency ordering
- Later: tile maps, 2D clips/masks, UI anchoring, camera dead zones

Internally a sprite may be “textured quad × ortho camera × model matrix”;
externally it remains `Sprite2D` / `Layer2D`.

---

## 5. Public API sketches (v2-shaped)

### 5.1 Shared graphics types

```ts
import { runtime } from "ranger:core";
// Option A — capability root:
const rt = runtime.graphics.createRenderTarget({
  width: 256,
  height: 256,
  colorFormat: "rgba8-srgb",
  depth: true,
  alphaMode: "premultiplied",
  clearColor: [0, 0, 0, 0],
});
// rt.colorTexture : Texture2D   — accepted by Sprite2D / atlases / sampling

// Option B — package:
import * as GFX from "ranger:graphics";
```

**Decision lean:** start with **`runtime.graphics`** on `ranger:core` (fewer
modules to register in `RgGameHost`); promote to `ranger:graphics` if the
surface grows (pipelines, compute, multi-sample knobs).

`Texture2D` must grow a real pixel / GPU residency path (closes Q1 follow-up):
image decode, RTT color attachment, and (later) video/canvas uploads all mint
or update the same host type.

### 5.2 Ordinary 2D (unchanged authorship)

```ts
import * as TWO from "ranger:2d";

const sprite = new TWO.Sprite2D(atlas, regionIndex);
layer.add(sprite);
renderer2d.render(layer, camera2d, pane);
```

### 5.3 3D as a texture for a sprite (RTT)

```ts
import * as THREE from "ranger:three";

const target = runtime.graphics.createRenderTarget({
  width: 256, height: 256, colorFormat: "rgba8-srgb", depth: true,
});
const portrait = new TWO.Sprite2D(target.colorTexture); // or atlas region wrapper
layer.add(portrait);

update(frame) {
  renderer3d.render(scene, camera3d, { target });
  renderer2d.render(layer, camera2d, pane);
}
```

### 5.4 Ergonomic embedded view

```ts
const modelSprite = new THREE.SceneSprite3D({
  scene,
  camera,
  resolution: { mode: "fixed", width: 256, height: 256 },
  update: "whenDirty",   // everyFrame | whenDirty | { fps: n } | "manual"
  alpha: true,
  depth: true,
  sampling: "linear",    // or "nearest" for pixel-art crunch
});
layer.add(modelSprite);  // Layer2D accepts a textured 2D node
```

Internally: owns a `RenderTarget`, marks dirty on scene/camera changes, exposes
itself as a `Sprite2D`-compatible layer child (same host texture handle).

Resolution modes:

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

Coordinate chain: screen → sprite-local UV → render-target pixel → camera ray.
Lives on `SceneSprite3D` / `EmbeddedView2D`, not on raw `Sprite2D`.

---

## 6. Internal rendering notes

### 6.1 Sprite batching (GPU path)

```text
one shared static unit quad
+ dynamic instance buffer (transform, uvRect, tint, depth, flip)
+ texture atlas bind
→ instanced draw (few draw calls)
```

Do **not** allocate a vertex buffer per sprite. Software present may keep
per-sprite plots until the GPU path lands; behaviour (camera math, layer
membership) must stay identical (D-2D-4).

### 6.2 Present pipeline extension

Today:

```text
rg2d_render → pane.bind(layerH, camH)
present     → RgSoftwareRenderer2D.present2D(fb, layerH, camH)
```

Target:

```text
rg2d_render / rg3d_render / rg_graphics_target_*
  → append PassRecord to pane (or to an offscreen target job list)

present (RgComposePresenter):
  for each PassRecord in order:
    if 3D && target is RenderTarget → Renderer3D → RT
    if 3D && target is pane         → Renderer3D → pane color/depth
    if 2D && target is pane         → Renderer2D → pane (honor clear mode)
  compose panes → surface
```

RTT jobs that feed sprites must run **before** the 2D pass that samples them
in the same frame (presenter sorts: all `RenderTarget` producers, then pane
consumers — or preserve strict guest call order, which is simpler and enough
for v1 of this plan).

**Recommendation:** preserve **guest call order** strictly. Authors place
`renderer3d.render(..., target)` before `renderer2d.render(...)`.

---

## 7. Work phases (implementation order)

Phases below are **v2 follow-ons** after CODE_CLEANUP Phase 11 (SW 2D) and
can run in parallel with Phase 12 game ports. None require deleting v1 paths.

### H0 — Spec freeze (this document)

- [x] Record layering + D1–D8 decisions
- [ ] Link from [`QUESTIONS.md`](./QUESTIONS.md) Q2 / Q3
- [ ] Optional: one-line pointer in [`README.md`](./README.md) progress log

### H1 — `Texture2D` + `RenderTarget` host types

**Goal:** one texture type every sampler accepts; RTT exposes `colorTexture`.

| Deliverable | Notes |
|-------------|--------|
| Extend `RgTexture2D` with pixel/GPU residency | Closes Q1 follow-up for SW at least (RGBA store or lazy upload) |
| `RgRenderTarget` arena | size, color format, optional depth, clear, `colorTexture` handle |
| Schema + bridge rows | `rg_graphics_*` or `rgcore_graphics_*` |
| Façade | `runtime.graphics.createRenderTarget(...)` |
| Gate | create RT → sprite from `colorTexture` → SW present samples/plots non-zero; resize; release (D-OWN) |

**Depends on:** Phase 10b arenas, Phase 11 present (for sampling proof).

### H2 — Pass list + compose presenter (2D + clear modes first)

**Goal:** multiple ordered 2D passes / clear modes without 3D yet; prove the
recorder.

| Deliverable | Notes |
|-------------|--------|
| Pane stores `PassRecord[]` for the frame | cleared each update boundary |
| `rg2d_render` appends a 2D pass (not only “last view wins”) | migrate ylos2: two pane binds remain two passes |
| `RgComposePresenter` | replaces single-view assumption in present |
| Clear modes | `color` / `none` (depth N/A for pure 2D) |
| Gate | two layers, second with `clear: none`, pixels from both visible |

Deprecate behavioural reliance on `attachRenderer`.

### H3 — Live `Renderer3D` → `RenderTarget` (headless / SW or staged GL)

**Goal:** 3D can produce a `Texture2D` a 2D sprite can show.

| Deliverable | Notes |
|-------------|--------|
| Wire minimal `ranger:three` into `RgGameHost` module registration | opt-in import |
| `Renderer3D.render(scene, camera, { target })` | host command; D-SYNC |
| Soft or GL path that fills RT color | reuse staged `three/port` + FBO helpers where honest |
| Gate | cube/teapot into RT → `Sprite2D` on layer → present shows non-clear pixels |

Until this lands, 3D demos stay on separate hosts (current policy).

### H4 — Pane-shared composition (3D behind / in front of 2D)

**Goal:** Q2 “effects on the same surface” without RTT.

| Deliverable | Notes |
|-------------|--------|
| `Renderer3D.render(..., { target: pane, clear })` | pass record |
| Compose presenter runs 3D then 2D (guest order) | |
| Split-screen: per-pane lists | D6 |
| Gate | 3D clear color visible in gaps; 2D sprites on top; pane 0 ≠ pane 1 |

### H5 — `SceneSprite3D` ergonomics + update modes

| Deliverable | Notes |
|-------------|--------|
| `THREE.SceneSprite3D` | owns RT; layer-addable |
| `update`: `everyFrame` / `whenDirty` / `{ fps }` / `manual` | dirty flags on scene graph mutations |
| Resolution: `fixed` + `matchDisplaySize` | clamp min/max |
| `sampling: nearest` | pixel-art path |
| Gate | static portrait does not re-render every frame when `whenDirty` + untouched |

### H6 — GPU `Renderer2D` on shared device (batching)

| Deliverable | Notes |
|-------------|--------|
| Shared device/buffers with 3D backend | internal only |
| Instanced quad path | §6.1 |
| Camera2D parity SW == GPU | D-2D-4 completion for GPU |
| Gate | invaders/ylos2-class sprite counts; golden or checksum present |

### H7 — Picking + demo game

| Deliverable | Notes |
|-------------|--------|
| `cameraRay(localPos)` on `SceneSprite3D` | |
| Must-pass hybrid demo under `games/` | e.g. 2D stage + 3D portrait / portal |
| Docs | BRIDGES path E (hybrid compose); README progress |

---

## 8. Non-goals (first cut)

- Unifying 2D and 3D into one scene graph or one public `Node` type
- Shared depth testing between sprites and meshes in a single draw
- Full Three.js postprocessing stack / MRT as a guest requirement
- Replacing EVG/UI soft-canvas paths (they may later sample `Texture2D` too)
- Breaking ylos2’s current pane-index lowering before a pane-object façade lands
- Any v1 `scripting/` deletion (runnable-legacy freeze still applies)

---

## 9. Test gates (contract-level)

| Gate | Asserts |
|------|---------|
| `d_graphics_rt` | RT create/resize/release; `colorTexture` handle type is `Texture2D`; D-OWN |
| `compose_pass_order` | Guest order preserved; `clear: none` keeps prior pass pixels |
| `rtt_sprite` | 3D → RT → Sprite2D → present; deterministic for fixed scene |
| `scene_sprite_dirty` | `whenDirty` skips GPU/SW fill when clean; `manual` only on `redraw()` |
| `hybrid_panes` | Split panes independent pass lists |
| `camera2d_parity` | Existing D-2D camera tests still green on SW; GPU when H6 lands |

Headless CI keeps the software path green first; GPU gates are additive.

---

## 10. Migration impact on live guests

| Guest | Impact |
|-------|--------|
| `games/ylos2` | No change required for H0–H2 if pane bind remains; optional later portrait/celebration 3D |
| `menu/launcher` | Unaffected |
| Future hybrid title | New folder under `games/`; imports `ranger:2d` + `ranger:three` |

`RgGameHost` stays free of game names; hybrid demos register modules the same
way ylos2 registers `ranger:2d`.

---

## 11. Preferred end-state (authorship)

```ts
// Ordinary 2D
new TWO.Sprite2D(atlas, region);

// Live 3D scene as a sprite
new THREE.SceneSprite3D({ scene, camera, resolution: { mode: "fixed", width: 128, height: 128 } });

// 3D background + 2D gameplay (shared pane)
renderer3d.render(background3D, cam3d, { target: pane, clear: "color-depth" });
renderer2d.render(game2D, cam2d, { target: pane, clear: "none" });

// 2D HUD over a 3D game
renderer3d.render(world3D, cam3d, { target: pane, clear: "color-depth" });
renderer2d.render(hud2D, hudCam, { target: pane, clear: "none" });
```

Main principle, restated for v2: **`ranger:2d` and `ranger:three` share
`Texture2D` / `RenderTarget` / present infrastructure; they do not share scene
semantics.**
