# v2 — debt & readiness

Working truth for agents: `tests/run.sh`, this file, [`BRIDGES.md`](./BRIDGES.md),
and [`QUESTIONS.md`](./QUESTIONS.md). The phase checkboxes in
[`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) are **stale** (only Phase 0
marked `[x]` while suites already cover identity → present → e2e). Prefer the
driver and the roadmap below over that checklist.

| Track | What is green today | What is not |
|-------|---------------------|-------------|
| Headless gate | `npm run engine:v2:test` → 91 suites + boundary gate | — |
| Live 3D web demos | `ranger:three` cube / teapot / courtyard / real glTF model, **browser-verified** in headless Chromium (`web/tests/browser_smoke.mjs`) | sky/GI/first-person/textures polish |
| Identity / live-object model (D-IDENTITY / D-SYNC) | reference `===` identity on the **real** interpreter; live 3D path splits object lifetime from scene membership (detached create + `scene.add`/`remove`, O(1) detach); **reconciler RETIRED** — live-path demos (cube, teapot, a procedural courtyard, and a real glTF model — NOT the Sponza atrium) re-implemented on the live path + browser-verified | live-path polish (sky, GI, first-person, textures) |
| TSX guests | `games/ylos2`, `games/ylos3d` via `RgGameHost` | Chess / broader catalog **deprioritized** vs E2E path validation |
| SW / textured 2D | e2e + `engine:v2:shot:ylos2` | real LPC/PNG atlas pixels; vocals/SFX sinks |
| Hybrid 2D+3D (path A) | thin TSX slice: SW 3D @2× → CPU `Texture2D` → SW 2D (`ylos3d`) | same slice as **Rust→wasm32** guest; RT/pass architecture |
| Native SDL | `RgSdlGameHost` + `build-sdl-v2.sh` + `engine:game-sdl:launcher:v2` (macOS-oriented today) | **Pi 5 arm64** build/smoke; cross-platform `pkg-config`; live CI |
| WASM32 / Rust | create/free/parity **fixtures** only | IDL + wasm32 profile + **Rust ylos3d** conformance guest + wire vectors |
| v1 | still **runnable legacy** (~many titles under `games/`) | archival only at an explicit milestone (not Phase 12) |

**Docs inconsistency:** README / older notes still say “no SDL window”;
`runtime/sdl/` already has a native host (launcher, input map, split present,
rumble, music pump). Prefer this file + `runtime/sdl/README.md` over stale
claims. Align README when touching native work.

Mark checklist items `[x]` when they land and stay green.

### Identity mapping → live-object model (D-IDENTITY / D-SYNC) — in progress

The most important CODE_CLEANUP target (stable reference identity → one host
handle → separate object / membership / GPU lifetimes) is now advancing on the
**real** interpreter, not just the `RgValue`/`RgAdapter` model slice:

- [x] **D-IDENTITY on the real engine** — `EvalValue` carries an immutable
      `identityId` (minted once per reference); `equals()` compares it, so
      `obj === obj`, object Map/Set keys, `indexOf` by reference, and
      `obj.missing === undefined` hold in `ComponentEngine`. `==`/`!=` split from
      `===`/`!==` (loose models `null == undefined`). Gated by
      `interp/semantics/tests/component_engine_js_semantics_test`.
- [x] **D-SYNC membership decoupled from creation** — `rg3d_entity_set_parent`
      (reparent, no create/release) + `rg3d_entity_remove` (detach, object
      survives) on the live registry. Gated by
      `tests/unit/bridge/registry_entity_parent_test`.
- [x] **Unfused live `Mesh`** — `new THREE.Mesh(geometry, material)` is a
      DETACHED create; `scene.add(mesh)` / `scene.remove(mesh)` establish/detach
      membership as separate ops (`modules/ranger_three/ranger_three.tsx`).
      `rg3d_mesh_create` lowered to `(geo, mat)`.
- [x] **Unfused live lights + GLTFModel** — `AmbientLight(color,intensity)`,
      `DirectionalLight(color,intensity,dx,dy,dz)`, `GLTFModel(uri)` now create
      DETACHED; membership is `scene.add(x)`. Lights are plain scene children, so
      `entitySetParent` registers them for rendering. `games/ylos3d/index.tsx`
      migrated faithfully; `ylos3d_e2e` green.
- [x] **O(1) membership detach** — `ThreeObject3D` gained a parent
      back-reference; `detachEntity` drops via the parent instead of scanning all
      scenes+entities. Handle resolution was already O(1)/generation-safe
      (`RgRegistry` slot table) — no index-based guest IDs.
- [x] **`RETIRE-RECONCILE`** — **done.** Ported the THREE demo surface onto the
      live registry (Group, TeapotGeometry, PlaneGeometry, OrbitControls),
      re-implemented the live-path demos on the LIVE path — the cube, the
      teapot, a procedural courtyard (`courtyard_live.tsx`, PlaneGeometry + boxes,
      NOT the Sponza atrium) and a real glTF model (`model_live.tsx`, loads
      `games/ylos3d/models/diamond.glb` via `rg3d_model_load`)
      (`web/web_live3d_host.rgr` + `web/guests/three/*.tsx`), and
      **browser-verified** each renders in headless Chromium via
      `web/tests/browser_smoke.mjs`. Then deleted `three_tsx_bridge` +
      `three_gui_overlay`, the 5 reconcile web hosts, the 5 unwired reconcile
      tests, and the Sponza typed accessors. Full gate stays 89/89.
      Follow-ups (live-path polish, not blockers): sky/background, light-probe GI,
      first-person controls, material textures/PBR — all documented; the SW
      rasteriser's `w*8` span guard still drops huge flat quads (subdivide meshes;
      see the "remove the 8x span guard" item). A true **Sponza-atrium** live demo
      is also a follow-up — it needs a Sponza `.gltf`/`.glb` asset that is not
      in-tree (the current `courtyard_live` is procedural primitives, not Sponza).

See [`CODE_CLEANUP.md`](../CODE_CLEANUP.md) D-IDENTITY / D-SYNC for the contract.

---

## Validate the approach — WASM as a first-class parity target **now**

**Yes — treat WASM as a first-class parity target now**, not after the TSX API
is “finished.” Otherwise the 2D/3D API may accumulate conveniences that cannot
be lowered cleanly to a stable binary boundary.

Architectural intent is already right
([`CODE_CLEANUP.md`](../CODE_CLEANUP.md), [`BRIDGES.md`](./BRIDGES.md)):
TSX and WASM guests issue the **same registry commands** against the same
host-owned resources. One schema should generate host dispatch, interpreter
bindings, WASM imports, TypeScript declarations, Rust wrappers, and parity
tests.

**Implementation is uneven today:**

| Piece | Status |
|-------|--------|
| Low-level WASM bridge (handle, retain/release, span, async poll, TSX↔WASM command-trace fixtures) | green under `bridge/wasm/tests/` |
| Ergonomic `ranger_wasm` Rust package | still a **scaffold** |
| WASM guest through the generic host | **done** — `RgWasmGameHost` runs a wasm32 game the same way `RgGameHost` runs a `.tsx` game (drain RGC1 → generic bridge → presenter). Covered headless by `tests/e2e/ylos3d_wasm_e2e_test`. |
| A wasm game in `games/` | **done** — `games/ylos3d_wasm/` (schema-generated `rg_abi.rs`) builds a scene, renders it to a render target, and draws it into a single pane. The e2e asserts real rasterised pixels reach the framebuffer. |
| Launcher routes wasm vs tsx | **done** — the launcher tags each tile's `engine`; `RgSdlGameHost.runLauncher` dispatches `engine=wasm` to `runWasm()` (wasm3-backed on native) and `tsx` to `run()`. |
| WASM guest through macOS/Pi SDL host | **wired, awaiting on-device run** — `runWasm()` + `presentBridge()` are in `RgSdlGameHost` and the C++ codegen is clean; the macOS/Pi build links wasm3 already. Left to verify: launch `Ylos3D (WASM)` from the menu on the physical SDL window. |

### Desired layering

```text
TSX game                           Rust game
   │                                  │
ranger:core / ranger:2d          ranger_wasm::core / ::two_d
   │                                  │
interpreter adapter              generated safe Rust wrappers
   │                                  │
   └──────── same registry commands ──┘
                       │
                 RgGameHost
                       │
       software / GLES / Metal renderer
```

Public programming experience should be **similar**; the binary ABI stays
deliberately **primitive**.

### Similar source APIs, not identical syntax

TSX:

```ts
import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";

class JumperGame {
  layer = new TWO.Layer2D();
  camera = new TWO.Camera2D();
  renderer = new TWO.Renderer2D();
  update(frame) {
    this.renderer.render(this.layer, this.camera, 0);
  }
}
runtime.start(new JumperGame());
```

Rust should preserve the same concepts and lifecycle, with Rust conventions
(`snake_case`, `Result`, RAII, borrowing, typed options, `Clone`/`Drop`) —
not JS property proxies:

```rust
use ranger_wasm::{
    core::{FrameInfo, Game, GameContext, InitContext, Result},
    two_d,
};

struct JumperGame {
    layer: two_d::Layer2D,
    camera: two_d::Camera2D,
    renderer: two_d::Renderer2D,
}

impl Game for JumperGame {
    async fn init(_ctx: &mut InitContext) -> Result<Self> {
        Ok(Self {
            layer: two_d::Layer2D::new()?,
            camera: two_d::Camera2D::new()?,
            renderer: two_d::Renderer2D::new()?,
        })
    }
    fn update(
        &mut self,
        _ctx: &mut GameContext,
        _frame: FrameInfo,
    ) -> Result<()> {
        self.renderer.render(&self.layer, &self.camera, 0)?;
        Ok(())
    }
}

ranger_wasm::export_game!(JumperGame);
```

`Game` trait + `export_game!` → lifecycle exports (create, async-init poll,
update, resize, shutdown) per CODE_CLEANUP / BRIDGES.

### ABI smaller than either source API

Raw ABI must **not** expose classes, Rust references, TS objects, or renderer
impl details. Reasonable core lowering (already the documented direction):

```text
handles        two u32 words: low, high
bool/enums     i32/u32
numbers        i32/u32/f32/f64
strings        UTF-8 offset + byte length
arrays         memory offset + element count + element type
results        status code + out parameters
async          begin / poll / cancel / release
```

Friendly call → ugly raw import (by design; only generated bindings call it):

```text
Sprite2D::from_texture(&view)
  → rg_sprite2d_create_from_texture_view(view_lo, view_hi, out_lo, out_hi) -> status
```

### Generate two Rust layers in `ranger_wasm`

**1. Generated raw `sys` layer** — no policy; regenerated entirely from the
registry:

```rust
mod sys {
    extern "C" {
        pub fn rg_sprite2d_set_position(lo: u32, hi: u32, x: f32, y: f32) -> i32;
    }
}
```

**2. Safe ergonomic layer** — `OwnedHandle<T>` with `Clone → rg_retain`,
`Drop → rg_release`; host still validates realm/generation/slot/type (hostile
modules can bypass wrappers). Also: `BorrowedHandle`, `Error`/`Result`, UTF-8
+ checked span lowering, async `Future` wrappers, `Game` contexts,
`export_game!`, typed descriptors.

### Put 2D/3D composition into the schema **now**

Do not leave these TSX-only — they must lower to both guests:

```text
Texture2D · TextureView2D · RenderTarget
SceneSprite3D (or helper)
render-to-target · pane/surface destination
sampler/filter · pass clear/load
```

If an API cannot be expressed naturally in **both** TSX and Rust, the public
abstraction is probably over-fit to TS object behaviour. That is a design test
for the hybrid slice (`ylos3d`).

### Versioned descriptors for complex options

- Hot ops: direct versioned imports (`rg_sprite2d_set_position_v1`)
- Option-rich constructors: versioned **memory descriptors**
  (`rg_render_target_create_v1(desc_off, desc_size, out_lo, out_hi)`) with
  `struct_size` first field
- **Never** silently add args to an existing import (Wasm validates types at
  instantiate — “defaulted” params still break old guests)
- Prefer direct versioned imports for common ops; descriptors for rich create;
  generic dispatcher only for experiments / rare extensions

### Native macOS and Pi — WASM is a guest format, not a browser mode

```text
Raspberry Pi SDL host          macOS SDL host
  + embedded WASM runtime        + embedded WASM runtime
  + Ranger imports               + identical Ranger imports
  + game.wasm                    + same game.wasm
```

Renderer stays native. WASM only sends commands + handles. Same `.wasm` must
drive software / Pi GLES / macOS Metal (or compat GL). **No** GPU pointers,
SDL handles, native paths, or GL IDs cross the ABI.

Host common guest interface (so `RgGameHost` does not care which it ticks):

```text
GuestInstance
├── TsxGuestInstance
└── WasmGuestInstance
    create() · pollInit() · update(frame) · resize() · shutdown()
```

### WASM-specific Pi constraints

(see also [`docs/WASM_MEMORY_ABI.md`](../docs/WASM_MEMORY_ABI.md))

- Prefer **host-side** asset decoding (large models must not occupy linear
  memory first)
- Chunk large guest geometry uploads
- Do not cache host views across `memory.grow`
- Avoid per-vertex ABI calls
- Realm teardown must release handles after a trap
- Limits: memory, handles, pending requests, commands/frame

### First end-to-end parity gate (before full ylos3d Rust port)

Do **not** start with the full 3D game. One small dual-source package:

```text
games/wasm_parity/          (or tests/fixtures/wasm_parity/)
├── index.tsx
└── rust/
    ├── Cargo.toml
    └── src/lib.rs
```

Both versions must:

1. Create layer, camera, renderer, atlas, sprite  
2. Read a typed input action  
3. Move the sprite  
4. Render one pane  
5. Play one sound  
6. Create a small 3D render target  
7. Show its texture through a 2D sprite  
8. Shut down cleanly  

Compare: registry command IDs + order · handle types · retain/release ·
render-pass · framebuffer · input edges · audio events · cleanup after normal
shutdown **and** after a WASM trap.

Then scale that package up to a full **Rust `ylos3d`** reference (Milestone W).

### Approach-validation priority (tight sequence)

1. Stabilize registry defs for the current 2D + render-target slice  
2. Generate raw Rust `sys` imports from that schema  
3. Implement `OwnedHandle<T>`, errors, strings, spans, lifecycle exports  
4. Run one minimal Rust/WASM game in the **headless** host  
5. TSX-versus-Rust **command-trace** parity  
6. Add WASM guest profile to the **SDL** host  
7. Run the same `.wasm` on macOS and Pi 5  
8. Add 3D-RT→2D-sprite parity case  
9. **Only then** publish the first stable ABI version  
10. Continue GPU backends behind that **unchanged** ABI  

**Most important point:**

> TSX and Rust share the same conceptual API and exactly the same host command
> semantics; the WASM ABI remains a small, stable, generated implementation
> detail.

That gives Rust a native-feeling API without a second engine architecture.
**Adding more games is lower priority than proving this path.**

---

## PoC priority — full path over more games

See **Validate the approach** above. Summary: WASM is first-class for the v2
PoC; the interpreter profile alone is not enough. Wait on Chess / catalog
growth until TSX + Rust share one host command stream.

```text
TSX ylos2 / ylos3d  (interpreter profile)     ✓ partly green
        +
minimal wasm_parity  →  Rust ylos3d           ← elevate (Milestone W)
        ↓
same host arenas / present / (later) native SDL on macOS + Pi 5
```

---

## Four milestones (prove in this order)

“v1 parity” does **not** yet mean every v1 title. The PoC bar is:

> Selected packages (`ylos2`, `ylos3d`) behave correctly through the v2 API
> from **both** the TSX interpreter profile **and** a Rust wasm32 guest, and
> the TSX packages also run through the same native host on **macOS** and
> **Raspberry Pi 5**.

| # | Milestone | Goal |
|---|-----------|------|
| **W** | **WASM / Rust path (PoC)** | IDL + wasm32 profile + **Rust `ylos3d`** conformance guest + wire vectors; same host as TSX |
| **A** | **Selected gameplay / API parity** | Deepen `ylos2` / `ylos3d` (not new titles); matrices below |
| **B** | **Native platform parity** | Same packages on macOS arm64 **and** Pi 5 arm64 SDL |
| **C** | **Hybrid 2D/3D performance** | Embedded 3D within Pi budgets; GPU without CPU readback |

Software-rasterizer polish remains useful for CI / screenshots / ownership
debugging, but it **stops being the main line** once the current image is
visually correct. Do not deepen SW 3D (mips, fancy materials, anisotropic,
advanced lighting) ahead of W/A/B. **Do not** expand the game catalog ahead of W.

### Revised implementation sequence

1. **[ ] BRIDGES IDL extract** — semantic IDL; regenerate interpreter table
   (coverage gate stays green). See § Milestone W.
2. **[ ] wasm32 profile + wire vectors** — unsigned/token lowering, golden
   vectors (handles, strings, spans, errors).
3. **[ ] Rust `ylos3d` reference guest** — real game (not a toy fixture) on
   wasm32 against the **same** host arenas/present path as TSX `ylos3d`.
4. **[ ] Freeze gate** — TSX interpreter + Rust wasm32 both green on one host
   before any published ABI freeze.
5. **[ ] Parity matrices** — executable Node / macOS / Pi checks for ylos2 +
   ylos3d (Chess later).
6. **[ ] Native smoke** — macOS **and** Pi 5: build, launch, input, split,
   audio.
7. **[ ] Cross-platform software screenshots** — Node / macOS / Pi hashes.
8. **[ ] Performance instrumentation** — Pi budgets before hybrid expansion.
9. **[ ] SW correctness essentials** — clip, fill rule, alpha, nearest/linear,
   1×/2× SSAA (demoted detail section below).
10. **[ ] RT lifetime + ordered frame passes** · 3D sprite update modes.
11. **[ ] Pi GLES / macOS Metal** — Milestone C; public API stays
    `Texture2D` / `RenderTarget` / `Sampler` / `RenderPass`.
12. **[ ] Broader v1 ports (Chess, …)** — **only after** W + A + B prove the
    full path.

### Practical definition of success (PoC + first platform milestone)

```text
PoC (WASM):
- TSX ylos3d and Rust→wasm32 ylos3d drive the same host commands
- wire vectors pinned; no published ABI until both guests pass
- hybrid 2D+3D slice works from both guest languages

Platform:
- the same v2 ylos2 (and ylos3d) packages:
  - launch from the v2 launcher,
  - run at stable speed (~60 Hz),
  - accept two local players / split-screen,
  - play music and effects, rumble where available,
  - show the embedded 3D sprite path,
  - with no game-specific host code
  on both macOS and Raspberry Pi 5.
```

That proves: **one API, two guest languages (TSX + Rust/WASM), two native
machines** — more important than shipping additional titles.

---

## Milestone W — WASM / Rust / BRIDGES (elevate for PoC)

Contract: [`BRIDGES.md`](./BRIDGES.md) rev 2. Today steps 1–2 are done
(interpreter table + coverage); step 3 (real TSX guests) is in progress;
**steps 4–7 are the PoC spine**.

| Step | Work | Status |
|------|------|--------|
| 1–2 | Interpreter profile table + generic bridge + coverage | done (not a published ABI) |
| 3 | Real TSX guests (ylos2 / ylos3d / launcher) | in progress |
| **5b** | **Rust→wasm32 conformance guest** — a real Rust guest drives the GENERIC bridge | **fail-fast slice PROVEN** ✓ |
| **4** | **IDL extraction** — full types, identities, capabilities; regen interpreter table from IDL × profile | **started**: table-driven wasm32 dispatch off argSpec (below) |
| **5** | **wasm32 profile** — token/epoch lowering; golden **wire vectors** | in progress: `RgWasm3dProfile` opcode map + RGC1 record format |
| 6 | Extend IDL to three + cannon; dispatcher emitter; generated façades | after 5 |
| 7 | **Golden freeze** only when TSX + Rust guests both pass on one host | gated |

**Fail-fast proof landed (July 19, 2026).** A real Rust module compiled to
`wasm32-unknown-unknown` (`bridge/wasm/conformance/ylos3d_slice`) builds a 3D
scene — scene, camera, box geometry, lambert material, mesh, `scene.add`,
transform — by writing an RGC1 command buffer into its own linear memory; the
host drains it and replays each record through **`RgRegistryBridge.invoke →
dispatchRow` (the ONE generic bridge, not a hand-linked C ABI)**, mapping
guest-local ids → host handles. `bridge/wasm/conformance/tests/
ylos3d_wasm_conformance_test` (13 asserts) confirms zero dispatch errors, the
arena actually created the geometry/material/mesh, the mesh is parented to the
scene (**D-SYNC across wasm32**), and distinct guest ids resolve to distinct
valid host handles (**D-IDENTITY**). Runs headlessly in the node gate via a new
`WebAssembly` loader (the `wasm_*` es6 templates were stubs before). This
retires the biggest architecture risk: the generic bridge *can* host a
second-language guest. The command-buffer model deliberately mirrors the
existing RGU1/RGX1 shared-block guests (no host-call imports).

**Follow-ups landed (July 19, 2026):**
- **Generic table-driven dispatch (step 4 start).** The hand-written per-command
  if-chain is replaced by `bridge/wasm/RgWasmCmdDispatch` — it decodes each RGC1
  record's args straight from the command row's SEMANTIC `argSpec` (`i`/`d`/`h`,
  doubles as ×1000 fixed-point) and dispatches through `RgRegistryBridge.invoke`.
  No per-command host code: adding a command is a schema edit + one opcode
  binding in the wasm32 profile (`RgWasm3dProfile`, opcode → command name).
- **Return-value round-trip.** The dispatcher writes each minted host id back into
  the guest's result region (`result_ptr[dst]`); the guest's `frame2()` reads its
  mesh handle back and only then emits a follow-up transform — the guest observed
  a host-written handle and acted on it across a frame boundary.
- Conformance test now 18 asserts (was 13), all through the generic dispatcher.

**ABI versioning & forward compatibility (guest/host).** A guest encodes each
command by its **schema id** — the ONE stable, per-module-ranged (core 1000s /
2d 2000s / three 3000s), golden-frozen, tombstoned id space — NOT a private
opcode table. RGC1 carries `[MAGIC, MAJOR, COUNT, RESERVED]`;
`RgWasmCmdDispatch.drainDoc` validates MAGIC + the profile `major`, then
pre-checks every record's id against the host table (fail-closed) before
dispatching. Consequences (all gated by the 27-assert conformance test):
- **Adding interfaces does NOT outdate compiled guests.** New commands are new
  ids in a module's free range; existing ids are immutable (golden), so an old
  guest — which only emits old ids the host still has — keeps working, no
  recompile. Proven: the same guest fully dispatches against a host table far
  larger than the 7 commands it uses.
- **A newer guest on an older host** (references an id the host lacks) or a
  **tombstoned/retired id** → whole buffer refused (`abiError` + `unknownId`),
  never half-applied.
- **Only a breaking change to an EXISTING command bumps `major`** and rejects old
  guests — and policy prefers retire(tombstone)+new-id so even "changing" a
  command stays additive. Bumped major → 0 dispatched.
- **Residual (per BRIDGES step 7, before any freeze):** `major` is still a
  hand-set coarse gate; the finer guard is the existing golden-id immutability +
  a per-profile ABI-compatibility golden and wire vectors. The profile is
  deliberately NOT frozen (BRIDGES: no published ABI until TSX + Rust both pass).

**Guest binding generated from the schema (step 4/6, landed).** The guest no
longer hand-copies ids: `bridge/wasm/RgWasmRustGen` emits a Rust module
(`rg_abi.rs`: RGC1 wire constants + a `pub const` per live command id) straight
from the command table; `bridge/wasm/tools/gen_rust_abi` regenerates it and the
guest `use`s it, so its ids ARE the schema's ids. `wasm_abi_binding_test` (7
asserts) checks the generator is schema-faithful AND that the committed
`rg_abi.rs` matches a fresh generation — a schema id change without regeneration
fails the gate (no silent guest drift). The schema is now the *enforced* source
of truth, not agreement-by-hand.

**Remaining toward a full Rust ylos3d:** strings/assets (`rg3d_model_load` — the
`s` argSpec needs a ptr+len decode from guest memory), the 2D + RTT + input +
audio surface (more command ids, all already generated into the binding), and
emitting typed Rust wrappers (not just id consts) from the schema so guests get
a checked API, plus a per-profile ABI-compatibility golden before any freeze.

### Why Rust `ylos3d` (not a toy, not Chess first)

- Covers **ranger:2d + ranger:three RTT + surface panes + input + audio** in one
  package — the interesting v2 surface.
- Forces the wasm32 lowering to be real (handles, strings/assets, errors), not
  just `create`/`free` fixtures under `bridge/wasm/tests/`.
- Proves D-IDENTITY / D-OWN / D-SYNC across a second guest language.
- Keeps content scope fixed while the **transport** is the variable under test.

### Checklist (aligns with “Validate the approach” sequence)

- [ ] Stabilize registry / IDL for current 2D + render-target / hybrid slice
      (Texture2D, TextureView2D, RenderTarget, destinations, samplers — not
      TSX-only)
- [ ] Stop growing the hand `dispatchRow` if-chain; emitter replaces it
      (`RgRegistryBridge` — BRIDGES §2.4)
- [ ] Generate raw Rust `sys` imports from schema (no policy in that layer)
- [ ] Safe `ranger_wasm`: `OwnedHandle<T>` (retain/release), errors, strings,
      spans, `Game` + `export_game!`, typed descriptors
- [ ] Golden wire vectors: handles, strings, spans, enums/results, typed errors
- [ ] **First E2E gate:** dual-source `wasm_parity` (TSX + Rust) — sprite move,
      input, sound, small 3D RT→2D sprite, clean shutdown + trap cleanup;
      compare command traces (see approach section)
- [ ] TSX↔Rust command-trace parity gate in `tests/run.sh`
- [ ] `GuestInstance` / `WasmGuestInstance` on host; WASM profile on SDL host
- [ ] Same `.wasm` on macOS + Pi 5 (software present first)
- [ ] Scale to **Rust `ylos3d`** reference (full hybrid slice)
- [ ] old-guest / new-host compatibility runs
- [ ] **Do not freeze** a published wasm32 ABI until TSX + Rust both pass on
      one host (BRIDGES step 7)

### Explicit non-goals until W is green

- [ ] Porting Chess or other v1 titles “to show progress”
- [ ] Growing the launcher catalog with missing folders
- [ ] Treating bridge fixture suites as sufficient WASM validation
- [ ] Publishing ABI before the dual-source parity gate is green

---

## Milestone A — selected gameplay matrix (ylos2 / ylos3d first)

Deepen the **existing** packages before new ones. Long-term must-pass names
remain ylos2 + Chess (`games/README.md`), but **Chess is queued after
Milestone W**.

**ylos2:** sprite + atlas, camera scroll, split-screen, 2P input, particles,
rumble, vocal FX, music score, LPC/bitmap assets.

**ylos3d:** above + embedded 3D RTT sprites (the WASM reference target).

**Chess (later):** atlas pieces, text/UI, cursor; rules/AI unchanged.

### Executable matrix (fill as gates land)

| Capability | Node/headless | macOS SDL | Pi 5 SDL | Rust wasm32 |
|------------|:-------------:|:---------:|:--------:|:-----------:|
| ylos2 loads | ✓ e2e | [ ] | [ ] | N/A (2D-only TSX first) |
| ylos3d loads | ✓ e2e | [ ] | [ ] | [ ] **PoC** |
| Assets resolve | ✓ gated (real LPC PNG) | [ ] | [ ] | [ ] |
| 1-player input | ✓ / attract | [ ] | [ ] | [ ] |
| 2-player input | ✓ e2e | [ ] | [ ] | [ ] |
| Split panes | ✓ e2e | [ ] | [ ] | [ ] |
| Embedded 3D RTT | ✓ ylos3d | [ ] | [ ] | [ ] |
| Music | score / pump | [ ] | [ ] | [ ] |
| SFX / vocals | record-only | [ ] | [ ] | [ ] |
| Rumble | simulated | [ ] | [ ] | [ ] |
| Stable ~60 Hz | N/A | [ ] | [ ] | N/A |
| Clean shutdown / relaunch | ✓ launch | [ ] | [ ] | [ ] |

- [ ] Runnable smoke scripts for the matrix (native = fixed-duration exit).
- [ ] Honest launcher catalog — only existing packages; no fake Chess/Breakout
      entries.
- [ ] Close ylos2 bar ([`QUESTIONS.md`](./QUESTIONS.md) Q4–Q7); extend e2e.
- [x] Real atlas pixels + LPC decoder suite — `lpc/tests/png_decoder_test` (decode)
      + `tests/render/ylos2_textured_test` (ylos2's real LPC sheets decode →
      texture store → sampled sprite render, gated). Also **`web/web_live2d_host.rgr`**
      runs ylos2 in the browser with real LPC sprites (browser-verified via
      `web/tests/browser_smoke.mjs`).
- [x] **One-shots → real audio sink** (`tests/unit/audio/one_shot_pcm_test`, 6
      asserts). `AudioClip` now carries a synth spec (`freqHz/durationMs/volume/
      wave`); `rgcore_audio_one_shot` synthesises the source's clip tone into
      REAL, non-silent PCM through the `GameAudio` additive synth and pushes it
      to a capturing sink (the SDL sink queues the same PCM). ylos2's celebrate
      SFX is a real 660Hz/220ms ding. No-arg `createClip()` callers keep a
      neutral default tone. Gate 91/91.
- [ ] **Vocals → real audio sink** (follow-up). `rgcore_vocal` is still a
      cue/counter recorder (`push vocalCues`); route it through the same synth
      spec → `GameAudio` → capturing sink path the one-shots now use, and gate
      non-silent output.
- [x] **EVG render/layout parity — DONE** (see [`evg/ISSUES.md`](./evg/ISSUES.md),
      all issues #1–#8 resolved July 19, 2026; verified-correct up front: text
      centering H+V, glow, border rounding, row flex grow, justifyContent math).
      - **#6** clipping: `UIContext` clip stack (rect/rounded via `pushClip` +
        arbitrary polygon via `pushClipPoly`/`pointInPoly`) honored by
        `blendPixel`; `drawElement` clips descendants on `overflow!="visible"`
        and clips the whole element on `clipPath` (SVG-path silhouette). Gated by
        `ui/tests/clip_overflow_test`, `ui/tests/clip_path_test`.
      - **#4** box + text shadow: `UIContext.shadowRoundRect` +
        `drawElement`/RGU1 keys 57-60 — `ui/tests/box_shadow_test`.
      - **#5** corner anti-aliasing: `roundedCoverage`/`covAlpha` —
        `ui/tests/rounded_aa_test`.
      - **#7** `gap` applied on the main axis (row+col) + RGU1 key 25.
      - **#8** flex: column grow, shrink (nowrap), `alignItems:stretch`,
        `flexWrap` + RGU1 (`alignName` extended for space-around/evenly/stretch,
        key 26). Deliberately kept for parity: `flexDirection` default "column"
        and the dead `direction` field (both documented).
      - **#3** filled `<Path>` (SVGPathParser.flatten + `UIContext.fillPolygon`)
        — `ui/tests/svg_path_test`; **#1** text intrinsic width confirmed +
        `testTextIntrinsicWidth`. `evg_test.rgr` grew 73→102 asserts.
      Remaining micro-note: glyph clipping is rectangular only (cached text
      bitmaps aren't rounded/polygon-clipped — negligible).
- [ ] **Chess port** — after W is green (not the current critical path).

### Open decisions (still block a crisp “done”)

| ID | Blocks |
|----|--------|
| Q1 | Atlas `image` line + pixel upload |
| Q4–Q7 | ylos2 façades vs play-feel bar |
| BRIDGES | IDL / wasm32 freeze / hand `dispatchRow` |
| Import policy | `ts_parser` outside v2 vs vendored |
| Plan Intent | archival legacy only at explicit end-of-v1 milestone |

### Plan phase status (evidence vs checklist)

Treat [`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) checkboxes as historical.

| Phase | Evidence status |
|-------|-----------------|
| 0–7 | **Done** (suites green) |
| 8–10b | **Largely done**; assets/art incomplete |
| 9 | **Slice done**; Cannon still staged |
| 11 | **SW + textured done**; GL scaffold |
| 12 | **PoC in progress** — ylos2/ylos3d e2e; Chess deferred; WASM path open |
| BRIDGES 1–3 | TSX guests in progress; **IDL/wasm/Rust not started** |

---

## Milestone B — native SDL as a first-class gate (macOS + Pi 5)

Architecture is already right: guest sees only logical actions + `runtime.*`;
SDL stays behind the host; same `RgGameHost` / interpreter / bridge / presenter
in headless and native (`runtime/sdl/`).

### Platform work

- [ ] **macOS arm64** build + smoke (Homebrew SDL2 path already in
      `build-sdl-v2.sh`)
- [ ] **Raspberry Pi OS arm64** build + smoke
- [ ] **One build command** with platform-specific linker config
- [ ] **`pkg-config` SDL discovery** on Linux/Pi (do not assume macOS/Homebrew
      only)
- [ ] **Fixed-duration automatic run** — launch ylos2, advance frames, exit 0
- [ ] **Split-screen smoke** on both platforms
- [ ] **Audio-device failure fallback** — headless / audio-less Pi still launches
- [ ] **Controller connect / disconnect** testing
- [ ] Align README (“no SDL”) with reality; optional `engine:v2:sdl:*` aliases

Headless suites compile-check native seams (`tests/sdl/sdl_host_test`) but do
**not** provide a live SDL CI run (no SDL headers in current CI). Native smoke
may stay machine-local until CI gains SDL — still required on **both** target
machines before calling platform parity done.

### Cross-platform SW screenshot gate

- [ ] Render the same deterministic frame via:
      ```text
      Node software
      macOS software → SDL
      Pi software → SDL
      ```
- [ ] Compare pixel hashes (or tiny tolerance) so host/platform work cannot
      silently change gameplay rendering

### Pi performance budgets (before expanding hybrid)

Pi 5 = quad Cortex-A76 + VideoCore VII (GLES 3.1 / Vulkan 1.3) — capable, but
CPU render cost scales as:

```text
3D target pixels × SSAA × triangles × embedded views × update frequency
```

- [ ] Instrument per stage: guest update · 3D SW raster · SSAA resolve · 2D
      compose · RGBA pack · SDL upload/present · audio pump
- [ ] Provisional **60 Hz** budgets (~16.7 ms/frame) — adjust after measurement:
      ```text
      Game / interpreter update     ≤ 3 ms
      2D render + composition       ≤ 4 ms
      Small embedded 3D work        ≤ 4 ms
      SDL packing / presentation    ≤ 3 ms
      Remaining margin              ≥ 2 ms
      ```
- [ ] Soak test several minutes (thermals / sustained), not only first frames

---

## Milestone C — hybrid performance + GPU strategy

### 3D sprite update modes (use aggressively on Pi)

Embedded 3D must not rerender every game frame by default
([`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md)):

```ts
update: "manual" | "whenDirty" | { fps: 15 } | "everyFrame"
```

| Use | Mode |
|-----|------|
| Inventory item | `manual` / `whenDirty` |
| Character portrait | 10–15 fps |
| Celebration diamond | `everyFrame` briefly |
| Static decorative mesh | render once |
| Full 3D world / background | `everyFrame`, **GPU required** |

For v1 parity, a 3D sprite is an **enhancement** — it must not make the 2D game
miss its frame budget.

### Do not require one identical GPU API on macOS and Pi

Shared layer = Ranger renderer contract, not one native GPU API:

```text
Renderer2D / Renderer3D
        ↓
RgGraphicsDevice
        ├── Software   (CI, screenshots, fallback)
        ├── GL / GLES  (Pi production; macOS parity OK)
        └── Metal      (durable macOS)
```

Public guest API stays `Texture2D` / `RenderTarget` / `Sampler` / `RenderPass`
— never `GLuint` / FBO types.

| Platform | Parity milestone | Production direction |
|----------|------------------|----------------------|
| **Pi 5** | SW→SDL first | **OpenGL ES 3.1** (smaller step) or Vulkan; FBO RTT stays **GPU-resident** when sampled by 2D — **no** GPU→CPU readback→SW 2D every frame |
| **macOS** | SDL + OpenGL OK to prove parity | Apple deprecated OpenGL (10.14+); durable path = **Metal** (direct or via abstraction) |

- [ ] Pi GLES: textures, FBO RT + depth, sprite batching, basic mesh shaders,
      RT→sprite with **no readback**
- [ ] macOS: keep GL only as compatibility; design APIs for Metal later
- [ ] Shader-source variants for desktop GL vs GLES where they share code

---

## Software reference — correctness essentials (demoted main line)

SW path stays valuable for: deterministic screenshots, CI, ownership/pass
debugging, macOS↔Pi visual compare, GPU-init fallback. It does **not** need to
become a fully optimized production 3D renderer.

**Already landed (thin slice):** SW 3D @2× → CPU `Texture2D` → SW 2D
(`ylos3d`; `rtt_sprite` / `ylos3d_e2e`).

**Finish only these essentials**, then stop deepening SW 3D ahead of milestones
A/B:

- [ ] Complete frustum clipping (six homogeneous planes)
- [ ] Consistent triangle fill (top-left rule)
- [ ] Correct alpha (texture α + material; no dark fringes)
- [ ] Configurable 1× / 2× SSAA (`samples` API)
- [ ] Nearest + linear sampling (shared `sampleLinear` at texture store)
- [ ] No crashes / giant triangles (remove 8× span guard once clip works)

**Defer** (after A/B, or never as SW mainline): mip chains / anisotropic /
sophisticated transparent materials / advanced lighting / trilinear.

### Suggested PR sequence (graphics — after native smoke is moving)

1. Rasterizer correctness essentials (clip + top-left + contract images)
2. Nearest/linear sampling + texture alpha
3. Configurable SSAA (`samples`) + edge-fringe tests
4. Real render targets (identity, resize/release)
5. Ordered frame execution (retention, exactly-once replay, multi-pass 2D)
6. Destinations + load/store
7. `SceneSprite3D` update modes / producer scheduling
8. Pi GLES → macOS Metal/GL parity (**Milestone C**)

Detail checklists below remain the implementation notes for items 1–7.

### 1. Finish software rasterizer correctness

Do after Milestone B smoke is moving — not ahead of native macOS/Pi gates.
(`three/port/src/three_software_backend.rgr`)

- [ ] **Six homogeneous clipping planes** — today only near-plane clip; large
      rectangles / frustum edge artifacts remain possible. Introduce a reusable
      `ThreeClipVertex` (`x,y,z,w` + `u,v`) and Sutherland–Hodgman via one
      generic `clipPolygon(input, plane)` against:
      ```
      x + w >= 0   left      |  -w + x <= 0   right
      y + w >= 0   bottom    |  -w + y <= 0   top
      z + w >= 0   near      |  -w + z <= 0   far
      ```
- [ ] **Remove the “triangle spans more than 8× framebuffer” guard** once
      six-plane clip works — defensive only, not ordinary visibility logic.
- [ ] **Top-left rasterization rule** — current inside test
      `bw0 >= 0 && bw1 >= 0 && bw2 >= 0` lets adjacent triangles both (or
      neither) own a shared edge; with transparency/SSAA that shows as shimmer /
      seams. Classify edges with `isTopLeft(ax,ay,bx,by)`; accept
      `edge > 0 || (edge == 0 && edgeIsTopLeft)`. Keep pixel-centre samples at
      `x+0.5`, `y+0.5`.
- [ ] **Rasterizer contract images / deterministic tests**
  - [ ] Triangle crossing each frustum plane
  - [ ] Two triangles forming a quad — no crack, no double edge
  - [ ] Black object retains coverage
  - [ ] One-pixel diagonal at 1× and 2× SSAA
  - [ ] Rotating object: covered-pixel count does not jump dramatically between
        nearby angles

### 2. Real texture sampling

Nearest-neighbour in both SW 3D and SW 2D makes upper facets noisy
(`RgTexturedRenderer2D`, SW 3D texel pick).

- [ ] **Sampler enum / struct** — guest-facing:
      ```ts
      type TextureFilter = "nearest" | "linear";
      interface Sampler {
        minFilter: TextureFilter; magFilter: TextureFilter;
        wrapU: "clamp" | "repeat"; wrapV: "clamp" | "repeat";
      }
      ```
- [ ] **Real `TextureView2D`** — not just `{ texture }`:
      ```ts
      interface TextureView2D {
        texture: Texture2D;
        uv: { x: number; y: number; width: number; height: number };
        sampler: Sampler;
      }
      ```
      (PLAN already calls out UV + sampler as missing.)
- [ ] **One bilinear sampler at the texture store** —
      `sampleLinear(textureH, u, v) → RgSampleRGBA` interpolating **all four**
      channels. Texture alpha matters; SW 3D currently samples RGB separately
      from material opacity — unify.
- [ ] **Wire nearest/linear into both** SW 3D rasterizer and SW 2D compositor
      (no duplicated filter math).

### 3. Mipmaps — **deferred** (not SW mainline)

Useful later for patterned minification (e.g. diamond tops), but **do not**
prioritize ahead of milestones A/B or Pi GLES. When revisited:

- [ ] Generate mip chain on image load (`W×H`, `W/2×H/2`, …)
- [ ] LOD from UV derivatives; start with nearest-mip (trilinear later)

### 4. Configurable antialiasing (not hardcoded 2×)

`RgRangerThree.renderToTexture()` always renders `2w×2h` and resolves 2×2.
Premultiplied average is fine; sample count must not be buried in the method.

- [ ] Expose sample count on target / render config, e.g.
      `runtime.graphics.createRenderTarget({ width, height, samples: 4 })`
- [ ] SW mapping: `samples: 1 → 1×1`, `4 → 2×2`, `16 → 4×4` (name = **sample
      count**, not resolution multiplier — maps to GPU MSAA later)
- [ ] Transparent-edge tests: intermediate edge alpha; fully covered stays
      opaque; no dark fringe over white / black / saturated backgrounds

### 5. Real `RenderTarget` resource

Creating an RT today effectively returns its colour texture identity — blocks
depth, resize, release, attachment ownership, GPU residency.

- [ ] Host type with separate identities:
      ```rgr
      class RgRenderTarget {
          def colorH:RgHandle
          def depthH:RgHandle
          def width:int 0
          def height:int 0
          def samples:int 1
          def initialized:boolean false
      }
      ```
- [ ] Guest: `const target = createRenderTarget(...); const tex = target.colorTexture`
- [ ] Lifecycle first cut: `target.resize(w,h)`, `target.release()`,
      `target.colorTexture.view()`
- [ ] Gates: attachment survives while an external view retains it; released
      target cannot be rendered into; resize invalidates contents; cannot resize
      while referenced by a live frame operation

### 6. Complete frame-pass execution (architecture milestone)

Bridge records 2D + 3D passes, but path A **executes 3D RTT immediately**;
present uses the currently bound pane view rather than replaying the global
pass list (`RgRegistryBridge` / presenters — ordered replay is “future work”
in PLAN).

Target shape:

```text
guest update → record pass… → host present
  → execute pass 0 exactly once
  → execute pass 1 exactly once
  → …
  → release frame-owned references
```

- [ ] **5a. Frame-local ownership** — on append, retain layer/scene, camera,
      destination, sampled textures, RT attachments; release after execute or
      frame discard
- [ ] **5b. Execute 3D RTT during pass replay** — remove immediate execution
      from `rg3d_render_to` (stop “recorded but already done”)
- [ ] **5c. Execute every 2D pass**, not only the last pane binding — make
      multi-pass sequences valid:
      ```ts
      renderer2d.render(world, worldCamera, { target: pane });
      renderer2d.render(particles, worldCamera, { target: pane, clear: "none" });
      renderer2d.render(hud, hudCamera, { target: pane, clear: "none" });
      ```

### 7. Destinations and attachment load/store

After ordered execution:

- [ ] Destinations: `runtime.surface.target`, `runtime.surface.pane(i)`,
      `RenderTarget` (three types already named in PLAN)
- [ ] Minimal colour load/store:
      `{ color: { load: "clear"|"load", clearValue, store: "store" } }`
- [ ] Depth load/store later with 3D-to-surface
- [ ] Unlock composition: 3D → `surface.target`, then 2D → pane 0 / pane 1

### 8. `SceneSprite3D` only after pass replay exists

Convenience helper should schedule its producer automatically when a 2D pass
samples `gem.sprite`.

- [ ] Fixed resolution + `samples` + sampler + `update: "everyFrame" | "manual"`
      (+ `invalidate()`)
- [ ] **Do not** implement `whenDirty` until scene/camera/material/light/texture
      revision counters exist (PLAN defers this)

### 9. GPU parity (Milestone C — last)

- [ ] Parity tests vs SW reference images — only after A/B + essentials above
- [ ] Prefer Pi GLES / macOS Metal strategy in § Milestone C (no single forced
      low-level API; no GPU→CPU readback loops)

---

## P0 — SDL / native building blocks (see Milestone B)

Detail for Milestone B. Headless path (contrast): Ranger `-es6` → Node →
`RgGameHost` → `ComponentEngine` evaluates guest TSX → SW framebuffer. Native
path: same host protocol compiled with `-l=cpp` + `gfx_sdl`.

### What already exists (do not rebuild from scratch)

| Piece | Status | Notes |
|-------|--------|-------|
| `RgGameHost` + `Rg2DPresenter` | live | TSX → frame; SW/textured present |
| `runtime/sdl/RgSdlGameHost.rgr` + `RgSdlMain.rgr` | live | launcher + game loop; pane-aware present; `clearRgb` |
| `scripts/build-sdl-v2.sh` | live | Ranger→C++; **macOS/Homebrew-oriented today** |
| `npm run engine:game-sdl:launcher:v2` | live | needs SDL2 on the machine |
| `tests/sdl/sdl_host_test` | live | headless seams only (no live window in CI) |
| Music + vocal SFX → SDL PCM | live | `pumpAudio` / `pumpVocals` |
| `render/backends/gl/` | scaffold | after macOS+Pi SW→SDL smokes |

### Still missing (checklist)

- [ ] Pi 5 arm64 build (`pkg-config` SDL) — see Milestone B
- [ ] Fixed-duration auto-run smoke on macOS **and** Pi
- [ ] `SDL_VIDEODRIVER=dummy` / CI smoke when headers available
- [ ] Direct game run (skip launcher) like v1 `engine:game-sdl:run -- <path>`
- [ ] Audio-device failure fallback; controller hotplug
- [ ] README alignment; optional `engine:v2:sdl:*` aliases
- [ ] **Do not** reuse v1 `game_sdl_runner.rgr` (`GameRunner` ≠ `RgGameHost`)

### Follow-ons

- [x] Pane-aware present (`paneCount` → single or split; neutral `clearRgb`)
- [x] Audio: `vocalCues` → SDL (`pumpVocals` → `GameAudio` palette + `GameVocalFx`; one-shots still record-only)
- [ ] Cross-platform SW screenshot hashes (Node / macOS / Pi)

### Intentionally out of scope until W+A+B are credible

- Full v1 catalog port (Chess and friends — after WASM PoC)
- Replacing v1 `engine:game-sdl:*` (v1 stays runnable)
- Deep SW 3D / GPU backends as the mainline
- Native SDL hosting of the Rust wasm guest can follow headless
  TSX↔Rust parity; do not block Milestone W on Pi GLES

---

## Abstraction boundary debt (core must stay game/test-neutral)

From the master audit of `v2/` core `.rgr` (tests/e2e may stay game-aware;
`games/` must not grow host shells). Fixed already: ylos2 sky clear + forced
2P split baked into `RgSdlGameHost` → pane-aware present + neutral `clearRgb`
(see PR history / `runtime/sdl/RgSdlGameHost.rgr`).

**`scripting/` is now a gate-guarded live-core prefix.** The vendored scripting
layer (`game_catalog`, `game_image_loader`, `game_hud`, `wasm_ui_io`, …) is
shared engine infra imported by `ui/` and `web/`, so `check_boundaries.py`
`LIVE_PREFIXES` now includes `scripting/`: any game-title identifier leaking
into it fails the build. Verified free of game names and test-case identifiers
when vendored. No engine-core source (`interp/host/modules/render/registry/
bridge/runtime/audio`) was modified to accommodate the new tests — tests live
under module `tests/` dirs only.

**Audit (post parity wave / #435):** live-core is clean — boundary gate green,
allowlist at 6 (`ts_parser` only), no game-title identifiers in gated prefixes
(`runtime/`, `host/`, `modules/`, `render/`, `registry/`, `bridge/`, `interp/`,
`imaging/`, `audio/`, `evg/`, `scripting/`). Recent vendoring/retarget commits
did **not** put title knowledge back into live core. Residual debt below is
docs/fork drift and older host conveniences — not new gate failures.

Done since the first debt write-up:

- [x] **Launcher catalog discovered, not hardcoded in Ranger** —
      `menu/RgLauncherUi.rgr` builds cards from `GameCatalog.scan()` over
      `v2/games/*/game.info` (filesystem discovery, v1 model). Tests assert the
      discovered catalog (today: Pomppija / ylos2). Adding a game folder +
      `game.info` surfaces it without editing the launcher `.rgr`.

Still to clean up later:

- [ ] **Dual `game_catalog.rgr` fork** — `menu/game_catalog.rgr` and
      `scripting/game_catalog.rgr` diverged. Scripting copy is gate-neutral;
      menu copy still names `autopeli` in comments (menu/ is excluded from the
      title-name check). Neutralize the menu comments (or delete the menu copy
      and import the scripting one), then consider adding `menu/` to
      `LIVE_PREFIXES`.
- [ ] **`menu/launcher.tsx` still hardcodes a guest catalog** — Pomppija /
      Chess / Breakout / Sprites paths in TSX (Chess/Breakout are not v2 games
      today). Guest-side is allowed by the boundary map, but it should mirror
      discovery (or a generated list) so the TSX menu and Ranger UI do not
      disagree.
- [ ] **Default action-map conventions live in the SDL host** —
      `mapMask` hardwires `jump = up | action` and fixed bit→action names;
      `RgAttractDriver` hardwires left/right/jump bit packing. Document as the
      default host profile, or make the map data-driven so a second title with
      different verbs does not fork the host.
- [ ] **Bridge observability vs real device sinks** — `RgRegistryBridge`
      accumulates `vocalCues` / `oneShotCount` / `logLines` mainly for e2e.
      Vocals now drain to SDL via `pumpVocals`; one-shots are still
      record-only. Shrink test-only counters to something tests can still
      assert without looking like a parallel game API.
- [ ] **Finish generated dispatch** — interim hand `dispatchRow` if-chain in
      `interp/engine/RgRegistryBridge.rgr` (BRIDGES.md §2.4 / step 5 →
      `registry/generated/RgDispatch.rgr`). Coverage gate already locks every
      row; replace the hand section, do not grow it.
- [ ] **Relocate `interp/engine/engine_probe.rgr`** — local smoke probe under
      the engine path; belongs under `tests/` (or delete once e2e covers the
      same thread).
- [ ] **`RgInput.create(2)` default capacity** — fine as a host default, but
      if a title ever needs >2 logical players, construct/install a larger
      `RgInput` (or raise the default) without a game-named branch.

**Keep green / do not regress**

- No game name (`ylos*`, `chess`, …) in generic core `.rgr` (comments in
  modules/runtime/host/render/bridge/scripting — docs/TODO/e2e excepted).
- No `.rgr` runners inside `games/<name>/` (see `games/AGENTS.md`).
- Scene clear / sky colours stay in guest paint or test tools — never baked
  into `RgSdlGameHost` / presenters as a title palette.
- Do not grow `tests/boundary_import_allowlist.txt` (shrink only).

---

## Import isolation — `.rgr` files still escape `v2/`

Originally **35** imports resolved outside `v2/`. The staged/demo trees have now
been retargeted (lpc, ui, model3d, three/port, sprites, web), leaving **only the
6 interpreter → `ts_parser` escapes** in the allowlist. Everything else resolves
inside `v2/`, and the boundary gate is green.

### Live stack (green gate) — 6 escapes, all to `gallery/ts_parser/`

These are real and currently required by the interpreter:

| File | Imports |
|------|---------|
| `interp/migrate/src/ComponentEngine.rgr` | `ts_parser_simple`, `ts_lexer`, `ts_ast_patch` |
| `interp/migrate/src/EvalValue.rgr` | `ts_parser_simple` |
| `interp/migrate/src/JSXToEVG.rgr` | `ts_parser_simple`, `ts_lexer` |

- [ ] **Decide policy for `ts_parser`** — either (a) accept it as a shared
      gallery dependency outside v2 and document the exception, or (b) vendor /
      re-home a v2-local parser under `v2/interp/` so the live stack imports
      only inside `v2/`.

`runtime/`, `host/`, `modules/`, `render/`, `registry/`, `bridge/`, `menu/`,
`audio/`, `imaging/`, `evg/`, `tests/` (aside from migrate→ts_parser) have
**no** out-of-v2 `Import`s.

### Staged / demo trees — retargeted ✅

All previously-escaping staged trees now resolve inside `v2/`:

| Area | Was | Now |
|------|-----|-----|
| `lpc/src/` | `../../../pdf_writer/…`, `../../../zip/…` | `v2/imaging/…` (+ `ZipReader`/`ZipWriter` copied into `v2/imaging/zip`) |
| `ui/` demos + `WasmUiSelect` / `EvgLauncherMenu` | `../../pdf_writer/…`, `../../evg/…`, `../scripting/…` | `../evg/…`, `../imaging/…`; `scripting/*` vendored into **`v2/scripting/`** |
| `model3d/` (+ tests) | `../../pdf_writer/src/jsx/…`, JPEG decoder | `v2/interp/migrate/src/` + `v2/imaging/` |
| `three/port/` | jpeg + jsx to `pdf_writer` | `v2/imaging/jpeg` + `v2/interp/migrate/src` |
| `sprites/` | malformed `../pdf_writer/…` | `v2/imaging/…` |
| `web/web_tsx3d_host.rgr` | `../../pdf_writer/src/jsx/…` | `v2/interp/migrate/src/` (+ vendored `three/port/tsx`, `model3d/demo`) |
| `web/web_game_host.rgr` | `../scripting/…` | still **blocked** — native runtime (`game_runtime`/`host_native`/`audio`/`input`) not yet vendored; resolves in-v2 to absent files (boundary-clean) |

### Wrong-depth / missing-inside-v2 (related) — fixed ✅

- [x] `sprites/deps/`, `sprites/host/`, `sprites/runners/` → `v2/imaging/…`
- [x] `three/port/src/three_gltf_textures.rgr` + `three/port/tests/**` →
      `v2/imaging` + `v2/interp/migrate/src`
- [x] `menu/RgLauncherUi.rgr` font dir → `gallery/game_engine/v2/menu/assets/fonts`
      (no longer points at `gallery/pdf_writer/…`)

- [x] **Boundary gate in `tests/run.sh`** — after all suites,
      `tests/check_boundaries.py` fails the run on (1) any `.rgr` under
      `games/`, (2) any out-of-v2 `Import` not listed in
      `tests/boundary_import_allowlist.txt`, (3) game-title identifiers in
      live-core `.rgr` — `LIVE_PREFIXES` now also covers **`scripting/`**.
      Allowlist shrunk 35 → **6** (only the `ts_parser` escapes remain)
      — **do not grow the allowlist**. `menu/` stays excluded from (3) until
      the dual-catalog / comment-name cleanup above lands.

---

## P0 — LPC PNG decoder unit test ✅ DONE

Landed as `lpc/tests/png_decoder_test` (wired into `tests/run.sh`). Decodes a
real type-6 RGBA character sheet **and** a type-3 indexed layer sheet (both
576×256), asserting dimensions, a non-trivial full-size RGBA buffer, and the
presence of opaque + transparent pixels. `lpc/` imports were also retargeted
off `pdf_writer`/`zip` onto `v2/imaging/*` (with `ZipReader`/`ZipWriter` copied
into `v2/imaging/zip`). Original checklist retained below for provenance.

`lpc/src/png_decoder.rgr` decodes indexed (type 3) and RGB/RGBA sheets, and
real sample sheets already ship in-tree:

| Sample | Path | Size |
|--------|------|------|
| Character walk sheets | `lpc/pack/characters/{hero,knight,mage,rogue}/walk.png` | 576×256 RGBA |
| Layer pack (indexed + RGBA mix) | `lpc/pack/demo-male-walk/spritesheets/**/walk.png` | 576×256 |

**Delivered**

- [x] A `*_test.rgr` that loads real sheets via `PNGDecoder`
- [x] Asserts: decode succeeds, `width==576`, `height==256`, non-trivial RGBA
  (not the 1×1 failure buffer), and known opaque / transparent samples
  (LPC cells have transparent padding — that is expected)
- [x] Cover both color-type paths used by the pack: type 3 (body/head
  layers) and type 6 (character `walk.png` sheets)
- [x] Wire the suite into `tests/run.sh`

**Not a substitute**

- Compose demos under `lpc/src/lpc_demo_*.rgr` / `lpc_compose_runner.rgr` exercise
  the decoder incidentally; they are not a regression gate.
- `model3d/tests/TextureDecodeTest.rgr` only decodes a tiny embedded 2×2 PNG
  inside a GLB fixture — different path, and not in the central driver.
- `v2/games/ylos2/` has no player PNGs (atlas-only); v1 sheets live under
  `gallery/game_engine/games/ylos2/assets/`.

Also correct the stale claim in [`lpc/TODO.md`](./lpc/TODO.md) §1b that marked
“Testi: LPC walk-layer PNG:t” done — that was compose smoke, not a unit suite.

---

## Module coverage audit (snapshot)

| Module | Local `*_test.rgr` | In `tests/run.sh` | Notes |
|--------|-------------------:|------------------:|-------|
| `interp/` | 6 | yes | values, semantics, adapter, module_isolation — in order |
| `host/` | 6 | yes | handles, create/release, ownership, stale, membership, dispose — in order |
| `registry/` | 4 | yes | schema + codegen + bridge schema — in order |
| `bridge/` | 5 | yes | wasm create/free/retain/async/span + parity — in order |
| `runtime/` | 2 | yes | frame pipeline + clock — in order |
| `modules/` | 1 (`devices_test`) | yes | ranger:core devices; ranger:2d gated via `tests/contract/d_2d` |
| `physics/` (step) | 2 | yes | `physics_step_test`, `pose_sync_test` — live slice in order |
| `render/` | 1 | yes | software 2D present — in order |
| `tests/contract/` | 6 real + 2 scaffold | yes (the 6) | **`d_handle/`** and **`d_async/`** are README-only; coverage lives in host/bridge suites instead |
| `tests/e2e/` | 3 | yes | ylos2 + ylos3d + launcher |
| `lpc/` | 1 (`png_decoder_test`) | yes | **P0 done** — decoder unit test (type-3 + type-6 real sheets); imports retargeted to `imaging/` |
| `sprites/` | 1 (`sprite_blit_test`) | yes | first unit test — SoftCanvas + RgbaFastBlit compositing (opaque / alpha / clip); imaging imports retargeted |
| `menu/` | 1 (`launcher_ui_test`) | yes | unit + `tests/e2e/launcher_e2e_test`; Ranger UI discovers via `game.info` — residual: dual `game_catalog` fork + hardcoded `launcher.tsx` (see abstraction debt) |
| `games/` | 0 | via e2e | ylos2 + ylos3d e2e; **chess** must-pass still pending |
| `physics/cannon/` | 23 | yes | wired via `tests/cannon_suite_test` (89 assertions); self-contained inside v2 |
| `three/port/` | 33 wired | yes | curated pure-logic / asset-free subset; jsx→`interp/migrate`, jpeg→`imaging`; `src/run.sh` repointed to v2. 5 tsx-bridge feature tests still excluded (bridge now vendored — revisit) |
| `model3d/` | 5 | yes | wired via `tests/model3d_suite_test` (165 checks); jsx/jpeg retargeted; `tests/run.sh` repointed to v2 |
| `ui/` | 1 (`UITest.rgr`) | yes | 29 asserts; evg/PNGEncoder retargeted; `scripting/*` vendored into v2 |
| `evg/` | 1 (`evg_test.rgr`) | yes | 73 asserts; self-contained inside v2 |
| `web/` | 1 (`web_smoke_test`) | yes | soft-render TSX3D smoke; 7/8 hosts compile (`web_game_host` blocked on unvendored native runtime) |

### Follow-ups (beyond P0)

- [x] Add LPC decoder suite (above) and keep pack PNGs as fixtures
- [ ] Decide whether `d_handle` / `d_async` need dedicated contract drivers or
  should drop the empty scaffold folders
- [x] Re-home staged runners: `three/port/src/run.sh` and
  `model3d/tests/run.sh` now compile the **v2** copies (were pointing at v1)
- [x] Staged ports registered in central `tests/run.sh` (cannon, three/port,
  model3d, ui, evg, sprites, web) — all green in `engine:v2:test`
- [ ] `sprites/` / sheet-grid atlas path: unit gate now covers headless blit;
  PNG-decode → atlas-upload as first-class ranger:2d still pending (see also
  `BRIDGES.md` / games atlas notes)
- [ ] Re-enable the 5 `three/port` tsx-bridge feature tests now that
  `three/port/tsx/three_tsx_bridge` is vendored into v2
- [ ] Vendor / re-home the native runtime (`game_runtime`, `game_host_native`,
  `game_audio`, `game_input`) so `web/web_game_host` can compile in v2

---

## How to re-check

```bash
# Live v2 headless gate (must stay green) — suites + boundary gate
npm run engine:v2:test
# same as: bash gallery/game_engine/v2/tests/run.sh

# Boundary gate only (imports / games/*.rgr / live-core title names)
python3 gallery/game_engine/v2/tests/check_boundaries.py

# Optional: offline PNG of ylos2 via textured software present
npm run engine:v2:shot:ylos2

# Native SDL launcher (macOS today; Pi 5 arm64 is Milestone B)
npm run engine:game-sdl:launcher:v2
# build only: bash gallery/game_engine/scripts/build-sdl-v2.sh
# Target: same binary path on Raspberry Pi OS arm64 via pkg-config SDL2

# Inventory: local tests vs central driver
# (suites listed in tests/run.sh vs find v2 -name '*_test.rgr')
```
