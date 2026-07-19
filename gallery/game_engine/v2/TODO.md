# v2 — debt & readiness

Working truth for agents: `tests/run.sh`, this file, [`BRIDGES.md`](./BRIDGES.md),
and [`QUESTIONS.md`](./QUESTIONS.md). The phase checkboxes in
[`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) are **stale** (only Phase 0
marked `[x]` while suites already cover identity → present → e2e). Prefer the
driver and the roadmap below over that checklist.

| Track | What is green today | What is not |
|-------|---------------------|-------------|
| Headless gate | `npm run engine:v2:test` → 46 suites + boundary gate | — |
| TSX guests | `games/ylos2`, `games/ylos3d` via `RgGameHost` | must-pass **chess** missing |
| SW / textured 2D | e2e + `engine:v2:shot:ylos2` | many atlases still colour markers / incomplete art |
| Hybrid 2D+3D (path A) | thin slice: SW 3D @2× → CPU `Texture2D` → SW 2D (`ylos3d`) | six-plane clip, top-left rule, samplers/mips, real RT, ordered pass replay — **before GPU** |
| Native SDL | `RgSdlGameHost` + `scripts/build-sdl-v2.sh` + `engine:game-sdl:launcher:v2` | CI `SDL_VIDEODRIVER=dummy` smoke; vocals/SFX sinks |
| WASM32 published ABI | create/free/parity fixtures | IDL extract + freeze (BRIDGES steps 4–7) |
| v1 | still **runnable legacy** | archival only at an explicit milestone (not Phase 12) |

Mark checklist items `[x]` when they land and stay green.

---

## Road to v1 parity (ordered)

Phase 12 in the plan = **must-pass ports on v2** (chess + ylos2), not “delete v1”.
Highest leverage is productization + must-pass games — not more staged
Three/Cannon copies.

1. **[ ] Native SDL smoke that stays green** — prove
   `npm run engine:game-sdl:launcher:v2` (or a short
   `SDL_VIDEODRIVER=dummy` run of the built binary) for launcher → ylos2.
   Align stale README lines that still say “no SDL window”. Optional: add
   `engine:v2:sdl:*` aliases that call `build-sdl-v2.sh`.
2. **[ ] Honest launcher catalog** — `menu/RgLauncherUi.rgr` hardcodes Chess /
   Breakout paths that are **not** under `v2/games/`. Ship only existing
   packages (`ylos2`, `ylos3d`) or data-drive the list (see abstraction debt).
3. **[ ] Close ylos2 “must-pass” bar** — decide [`QUESTIONS.md`](./QUESTIONS.md)
   Q4–Q7 (finish timeline / celebrate SFX / music restart / attract jump), then
   implement that slice and extend e2e past climb + cheer + score-text.
4. **[ ] Real atlas pixels** — `image <uri>` / PNG upload into `RgTexture2D`
   (Q1); wire LPC decoder unit suite into `tests/run.sh` (P0 below).
5. **[ ] Vocals / one-shots → SDL** — music already pumps via `musicScore` +
   `pumpAudio`; wire `vocalCues` / one-shots to a real sink and shrink
   test-only bridge counters.
6. **[ ] Port chess** — the other named must-pass (`games/README.md`); pure TS
   rules/AI can copy; shell on `ranger:2d` + EVG/HUD.
7. **[ ] BRIDGES step 4+** — IDL extract; regenerate interpreter table; replace
   hand `dispatchRow` (do not grow it); then wasm32 profile + Rust conformance
   guest before any ABI freeze.
8. **[ ] Shrink import allowlist** — retarget staged `lpc/` / `ui/` / `model3d/`
   / `web/` / `sprites/` / `three/port/` escapes; decide `ts_parser` policy
   (gallery dep vs vendor under `v2/interp/`).
9. **[ ] Software reference + frame-pass architecture** — finish the SW path as
   the trustworthy reference (clipping, top-left rule, samplers/mips, real
   `RenderTarget`, ordered pass replay) **before** any GPU backend. Details in
   § “Software reference + pass architecture” below. H1–H4 path A is only a
   thin green slice today.
10. **[ ] Hybrid GPU follow-ons (H5–H7)** — shared-device / surface compose
    ([`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md)) only after the software
    reference is stable and must-pass 2D is credible. **Do not start GPU next.**

### Open decisions that block a crisp “done”

| ID | Blocks |
|----|--------|
| Q1 | Atlas `image` line + pixel upload (real art / GPU) |
| Q4–Q7 | What “must-pass ylos2” means (façades vs play-feel) |
| BRIDGES | When to freeze wasm32 / stop growing hand dispatch |
| Import policy | `ts_parser` outside v2 vs vendored |
| Plan Intent | Archival legacy only at an explicit end-of-v1 milestone |

### Plan phase status (evidence vs checklist)

Treat [`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) checkboxes as historical.
From `tests/run.sh` + live code:

| Phase | Evidence status |
|-------|-----------------|
| 0–7 | **Done** (suites green) |
| 8–10b | **Largely done** (modules, frame, devices, D-2D core); assets/art incomplete |
| 9 | **Slice done** (step + pose); Cannon port still staged |
| 11 | **SW + textured done**; GL scaffold |
| 12 | **In progress** — ylos2 e2e; chess absent; no archival |
| BRIDGES 1–3 | Schema + guests in progress; IDL/wasm freeze **not started** |

---

## Software reference + pass architecture (before GPU)

**Best next graphics move is not the GPU backend.** First turn the current
software path into a reliable reference implementation, then complete the
resource / pass architecture around it. See [`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md)
(render-target lifecycle, texture views, pass retention, hazards, destinations,
automatic producer scheduling still incomplete).

**Already landed (thin vertical slice):** SW 3D renders at 2× resolution →
resolves into a CPU `Texture2D` → SW 2D samples that texture (`ylos3d` diamonds;
gates `rtt_sprite` / `ylos3d_e2e`). Key files:
`three/port/src/three_software_backend.rgr`,
`modules/ranger_three/RgRangerThree.rgr`,
`render/backends/software/RgTexturedRenderer2D.rgr`,
`interp/engine/RgRegistryBridge.rgr` (pass record vs immediate RTT).

### Suggested PR sequence (independently reviewable)

1. Rasterizer correctness (six-plane clip + top-left + contract images)
2. Texture sampling (sampler type, bilinear RGBA, texture alpha)
3. Texture minification (mip chain + nearest-mip LOD)
4. Configurable SSAA (`samples`, resolve + edge-fringe tests)
5. Real render targets (separate identity, attachments, resize/release)
6. Ordered frame execution (retention, exactly-once replay, multi-pass 2D)
7. Destinations + load/store (`surface.target`, pane, offscreen)
8. Automatic `SceneSprite3D` producer scheduling
9. GPU 2D/3D backend parity (**last**)

Highest-value immediate work: **PR 1**, then **samplers + mipmaps**.

### 1. Finish software rasterizer correctness

Make this the next small graphics PR.
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

### 3. Mipmaps (after bilinear)

Bilinear helps magnification; diamond top facets are a **minification** problem.

- [ ] Generate mip chain on image load (`W×H`, `W/2×H/2`, …)
- [ ] LOD from perspective-correct UV derivatives (finite differences OK for SW):
      ```
      rho = max(texW * |dUV/dx|, texH * |dUV/dy|)
      lod = log2(rho)
      ```
- [ ] Start with **nearest mip** selection; trilinear later
- [ ] Expect mipmapping to beat 2×→4× geometry SSAA for patterned diamond tops

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

### 9. GPU parity (explicitly last)

- [ ] GPU 2D/3D backend parity tests against the SW reference images / contracts
      above — only after PRs 1–8 make the software path trustworthy

---

## P0 — SDL / native: productize what already exists

### How headless works today (for contrast)

v2 games **do** run through the TSX interpreter under Node (`-es6`):

1. Compile a Ranger host/driver (e.g. `tests/e2e/ylos2_e2e_test.rgr`).
2. **Node.js** executes that ES6 host.
3. `RgGameHost` → `ComponentEngine` evaluates guest `index.tsx`.
4. Software/textured present → in-memory `RgFramebuffer` (shots → PNG).

See [`README.md`](./README.md) “How v2 runs today”.

### What already exists (do not rebuild from scratch)

| Piece | Status | Notes |
|-------|--------|-------|
| `RgGameHost` + `Rg2DPresenter` | live | TSX → frame; SW/textured present |
| `runtime/sdl/RgSdlGameHost.rgr` + `RgSdlMain.rgr` | live | launcher + game loop; pane-aware present; `clearRgb` |
| `scripts/build-sdl-v2.sh` | live | Ranger→C++→link SDL2 |
| `npm run engine:game-sdl:launcher:v2` | live | build + launch (needs SDL2 on the machine) |
| `tests/sdl/sdl_host_test` | live | headless seams (RGBA pack, `mapMask`, music pump) |
| Music → SDL PCM | live | `pumpAudio` + `audio/tests/audio_score_test` |
| `render/backends/gl/` | scaffold | after SW→SDL is smoke-green |

### Still missing (checklist)

- [ ] **CI / dummy smoke** — short `SDL_VIDEODRIVER=dummy` run of the v2 binary
      (parity with `engine:game-sdl:smoke:*`); prove launcher → ylos2 without a
      display
- [ ] **npm naming clarity** — either document `engine:game-sdl:launcher:v2` as
      the v2 entry, or add `engine:v2:sdl` / `:run` aliases → `build-sdl-v2.sh`
- [ ] **Direct game run script** — `build-sdl-v2.sh` path that skips the
      launcher and loads a given `v2/games/<name>/index.tsx` (v1 has
      `engine:game-sdl:run -- <path>`)
- [ ] **Refresh docs** — README still claims “no SDL window” in places; keep
      them aligned with `build-sdl-v2.sh`
- [ ] **Do not** reuse v1 `game_sdl_runner.rgr` as the v2 host (`GameRunner` ≠
      `RgGameHost`)

### Follow-ons (after smoke is green)

- [x] Pane-aware present (`paneCount` → single or split; neutral `clearRgb`)
- [ ] Audio: `vocalCues` / one-shots → SDL (music path already exists)
- [ ] Real `render/backends/gl` path (optional once SW→SDL smokes)

### Intentionally out of scope until must-pass 2D is credible

- Full v1 menu/catalog parity
- WASM guest profiles on the SDL binary
- Replacing v1 `engine:game-sdl:*` (v1 stays runnable)

---

## Abstraction boundary debt (core must stay game/test-neutral)

From the master audit of `v2/` core `.rgr` (tests/e2e may stay game-aware;
`games/` must not grow host shells). Fixed already: ylos2 sky clear + forced
2P split baked into `RgSdlGameHost` → pane-aware present + neutral `clearRgb`
(see PR history / `runtime/sdl/RgSdlGameHost.rgr`).

Still to clean up later:

- [ ] **Launcher catalog is hardcoded in Ranger** — `menu/RgLauncherUi.rgr`
      `init()` embeds Pomppija / Chess / Breakout / Sprites paths. Boundary map
      wants menus as **TSX guests**; at minimum drive the catalog from data
      (JSON / guest list) so adding a game does not edit core `.rgr`. Update
      `menu/tests/launcher_ui_test` + `tests/e2e/launcher_e2e_test` with it.
- [ ] **Default action-map conventions live in the SDL host** —
      `mapMask` hardwires `jump = up | action` and fixed bit→action names;
      `RgAttractDriver` hardwires left/right/jump bit packing. Document as the
      default host profile, or make the map data-driven so a second title with
      different verbs does not fork the host.
- [ ] **Bridge observability vs real device sinks** — `RgRegistryBridge`
      accumulates `vocalCues` / `oneShotCount` / `logLines` mainly for e2e.
      Wire vocals/one-shots to SDL (or a real sink) and shrink test-only
      counters to something tests can still assert without looking like a
      parallel game API.
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
  modules/runtime/host/render/bridge — docs/TODO/e2e excepted).
- No `.rgr` runners inside `games/<name>/` (see `games/AGENTS.md`).
- Scene clear / sky colours stay in guest paint or test tools — never baked
  into `RgSdlGameHost` / presenters as a title palette.

---

## Import isolation — `.rgr` files still escape `v2/`

Verified by resolving every `Import "…"` under `v2/**/*.rgr` against the
filesystem (1040 import lines). **35 still resolve outside `v2/`.**

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

### Staged / demo trees — 29 out-of-v2 imports (mostly broken)

Paths still point at pre-v2 locations; many targets are **missing** on disk
(pdf_writer / top-level evg / zip were folded into `v2/imaging`, `v2/evg`,
`v2/imaging/zip`).

| Area | Escapes to | Fix |
|------|------------|-----|
| `lpc/src/` | `../../../pdf_writer/…`, `../../../zip/…` | Retarget to `v2/imaging/…` (and `v2/imaging/zip/…`) |
| `ui/` demos + `WasmUiSelect` / `EvgLauncherMenu` | `../../pdf_writer/…`, `../../evg/…`, `../scripting/…` | Use `../evg/…`, `../imaging/…`; drop or replace v1 `scripting/` deps (no `v2/scripting/`) |
| `model3d/` (+ tests) | `../../pdf_writer/src/jsx/…`, JPEG decoder | Use `v2/interp/migrate/src/` + `v2/imaging/` |
| `web/web_tsx3d_host.rgr` | `../../pdf_writer/src/jsx/…` | Same as model3d |
| `web/web_game_host.rgr` | `../scripting/…` | Staged v1 host; rewrite onto `RgGameHost` or delete |

### Wrong-depth / missing-inside-v2 (related)

These resolve *under* `v2/` but to non-existent paths (copy-paste from v1
depths). Same cleanup:

- [ ] `sprites/deps/`, `sprites/host/`, `sprites/runners/` → `pdf_writer/…`
- [ ] `three/port/src/three_gltf_textures.rgr` + `three/port/tests/**` →
      `pdf_writer/src/jsx/…` / JPEG (should be migrate + imaging)
- [ ] `menu/RgLauncherUi.rgr` runtime font dir string
      `gallery/pdf_writer/assets/fonts` (not an `Import`, but a path escape)

- [x] **Boundary gate in `tests/run.sh`** — after all suites,
      `tests/check_boundaries.py` fails the run on (1) any `.rgr` under
      `games/`, (2) any out-of-v2 `Import` not listed in
      `tests/boundary_import_allowlist.txt`, (3) game-title identifiers in
      live-core `.rgr`. Known staged escapes stay allowlisted until retargeted
      — **do not grow the allowlist**.

---

## P0 — LPC PNG decoder has no unit test

`lpc/src/png_decoder.rgr` decodes indexed (type 3) and RGB/RGBA sheets, and
real sample sheets already ship in-tree:

| Sample | Path | Size |
|--------|------|------|
| Character walk sheets | `lpc/pack/characters/{hero,knight,mage,rogue}/walk.png` | 576×256 RGBA |
| Layer pack (indexed + RGBA mix) | `lpc/pack/demo-male-walk/spritesheets/**/walk.png` | 576×256 |

**Missing today**

- [ ] A `*_test.rgr` that loads at least one real sheet via `PNGDecoder` /
  `decode` / `decodeRelative` / `decodeBytes`
- [ ] Asserts: decode succeeds, `width==576`, `height==256`, non-trivial RGBA
  (not the 1×1 failure buffer), and a few known opaque / transparent samples
  (LPC cells have transparent padding — that is expected)
- [ ] Cover both color-type paths used by the pack: type 3 (e.g. body/head
  layers) and type 6 (character `walk.png` sheets)
- [ ] Wire the suite into `tests/run.sh` (or `lpc/tests/run.sh` invoked from it)

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
| `lpc/` | 0 | no | **decoder + compose ungated** (this file, P0) |
| `sprites/` | 0 | no | staged; runners/demos only |
| `menu/` | 1 (`launcher_ui_test`) | yes | unit + `tests/e2e/launcher_e2e_test`; catalog still hardcoded in `.rgr` (see abstraction debt) |
| `games/` | 0 | via e2e | ylos2 + ylos3d e2e; **chess** must-pass still pending |
| `physics/cannon/` | ~23 | no | staged Cannon class port; not wired into v2 driver |
| `three/port/` | ~37 | no | staged; local `src/run.sh` still points at **v1** `gallery/game_engine/three/…` paths |
| `model3d/` | 5 | no | has `tests/run.sh`, but it still targets **v1** `gallery/game_engine/model3d/tests/…` |
| `ui/` | 1 (`UITest.rgr`) | no | staged copy; npm `engine:ui:test` still hits v1 `ui/` |
| `evg/` | 1 (`evg_test.rgr`) | no | staged; not in central driver |
| `web/` | 0 | no | staged; README mentions VFS smoke later |

### Follow-ups (beyond P0)

- [ ] Add LPC decoder suite (above) and keep pack PNGs as fixtures
- [ ] Decide whether `d_handle` / `d_async` need dedicated contract drivers or
  should drop the empty scaffold folders
- [ ] Re-home or clearly mark staged runners: `three/port/src/run.sh` and
  `model3d/tests/run.sh` currently compile **v1** paths, so “run the v2 copy”
  is misleading
- [ ] When staged ports go live, either register their suites in `tests/run.sh`
  or document a separate green gate per folder README
- [ ] `sprites/` / sheet-grid atlas path: no unit gate until PNG decode + atlas
  upload are first-class in ranger:2d (see also `BRIDGES.md` / games atlas notes)

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

# Native SDL launcher (needs SDL2 headers/libs on the machine)
npm run engine:game-sdl:launcher:v2
# build only: bash gallery/game_engine/scripts/build-sdl-v2.sh

# Inventory: local tests vs central driver
# (suites listed in tests/run.sh vs find v2 -name '*_test.rgr')
```
