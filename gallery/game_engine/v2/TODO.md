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
| SW / textured 2D | e2e + `engine:v2:shot:ylos2` | real LPC/PNG atlas pixels; vocals/SFX sinks |
| Hybrid 2D+3D (path A) | thin slice: SW 3D @2× → CPU `Texture2D` → SW 2D (`ylos3d`) | clip/fill/alpha essentials; RT lifetime; ordered passes; **GPU later** |
| Native SDL | `RgSdlGameHost` + `build-sdl-v2.sh` + `engine:game-sdl:launcher:v2` (macOS-oriented today) | **Pi 5 arm64** build/smoke; cross-platform `pkg-config`; live CI |
| WASM32 published ABI | create/free/parity fixtures | IDL extract + freeze (BRIDGES steps 4–7) |
| v1 | still **runnable legacy** (~many titles under `games/`) | archival only at an explicit milestone (not Phase 12) |

**Docs inconsistency:** README / older notes still say “no SDL window”;
`runtime/sdl/` already has a native host (launcher, input map, split present,
rumble, music pump). Prefer this file + `runtime/sdl/README.md` over stale
claims. Align README when touching native work.

Mark checklist items `[x]` when they land and stay green.

---

## Three milestones (prove in this order)

“v1 parity” does **not** yet mean every v1 title. With only `ylos2` / `ylos3d`
on disk and Chess named but missing, the first bar is:

> The selected parity games behave correctly through the v2 API and run through
> the **same** native host on both **macOS** and **Raspberry Pi 5**.

| # | Milestone | Goal |
|---|-----------|------|
| **A** | **v1 gameplay / API parity** | Chess + ylos2 through v2 APIs (headless + native) |
| **B** | **Native platform parity** | Same packages on macOS arm64 **and** Pi 5 arm64 SDL |
| **C** | **Hybrid 2D/3D performance** | Embedded 3D without blowing the Pi frame budget; GPU without CPU readback |

Software-rasterizer polish remains useful for CI / screenshots / ownership
debugging, but it **stops being the main line** once the current image is
visually correct. Do not deepen SW 3D (mips, fancy materials, anisotropic,
advanced lighting) ahead of A/B.

### Revised implementation sequence

1. **[ ] Parity definition** — freeze executable matrices for ylos2 + Chess
   (below).
2. **[ ] Native smoke** — macOS **and** Pi 5: build, launch, input, split-screen,
   audio (see § Native SDL / platform gates).
3. **[ ] Cross-platform software screenshots** — same deterministic frame on
   Node SW / macOS SW→SDL / Pi SW→SDL; pixel hash or tiny tolerance.
4. **[ ] Performance instrumentation** — per-stage timings + allocation
   counters; set Pi budgets before expanding hybrid work.
5. **[ ] Software renderer correctness essentials only** — clipping, fill
   rules, alpha, simple nearest/linear, configurable 1×/2× SSAA; no crashes /
   giant triangles (see § Software reference — demoted).
6. **[ ] Real render-target lifetime + ordered frame passes.**
7. **[ ] 3D sprite update modes + resolution limits** — so embedded 3D cannot
   steal the 2D frame budget.
8. **[ ] Pi GLES backend** — GPU 3D RTT + GPU 2D composition **without**
   readback every frame.
9. **[ ] macOS GPU backend** — compatibility GL OK for parity; **Metal** as the
   durable path; public API stays `Texture2D` / `RenderTarget` / `Sampler` /
   `RenderPass` (not `GLuint`).
10. **[ ] Broader v1 game ports** — after A+B are proven.

### Practical definition of success (first platform milestone)

```text
The same v2 ylos2 package:
- launches from the v2 launcher,
- runs at stable speed (~60 Hz),
- accepts two local players,
- presents split-screen correctly,
- plays music and effects,
- supports controller rumble,
- can show one animated 3D sprite (optional enhancement),
- and works without game-specific host code
on both macOS and Raspberry Pi 5.
```

That proves something more important than advanced AA: **the v2 API is portable
and can replace the selected v1 runtime paths.**

---

## Milestone A — freeze a concrete parity matrix

Before more renderer work, define exactly what must match. Must-pass titles
(`games/README.md`): **ylos2** + **chess**.

**ylos2 target capabilities** (from game policy / QUESTIONS): sprite + atlas,
camera scroll, split-screen, 2P input, particles, rumble, vocal FX, music
score, LPC/bitmap assets.

**Chess target capabilities:** atlas pieces, text/UI, cursor actions; rules/AI
unchanged (pure TS copy).

### Executable matrix (fill as gates land)

| Capability | Node/headless | macOS SDL | Pi 5 SDL |
|------------|:-------------:|:---------:|:--------:|
| Game loads | ✓ e2e | [ ] | [ ] |
| Assets resolve | partial | [ ] | [ ] |
| 1-player input | ✓ / attract | [ ] | [ ] |
| 2-player input | ✓ e2e | [ ] | [ ] |
| Split panes | ✓ e2e | [ ] | [ ] |
| Music | score text / pump | [ ] | [ ] |
| SFX / vocals | record-only | [ ] | [ ] |
| Rumble | simulated | [ ] | [ ] |
| Stable ~60 Hz gameplay | N/A | [ ] | [ ] |
| Clean shutdown / relaunch | ✓ launch handoff | [ ] | [ ] |

- [ ] Turn the matrix into runnable smoke scripts (headless already partly
      covered; native = fixed-duration auto-run that exits).
- [ ] Honest launcher catalog — only list games that exist (`ylos2`, `ylos3d`
      today; add Chess when ported). Strip dead Chess/Breakout entries.
- [ ] Close ylos2 bar ([`QUESTIONS.md`](./QUESTIONS.md) Q4–Q7) and extend e2e.
- [ ] Real atlas pixels (`image` / PNG → `RgTexture2D`) + LPC decoder suite.
- [ ] Port **chess** onto `ranger:2d` + EVG/HUD.
- [ ] Vocals / one-shots → real audio sink (not only bridge counters).

### Open decisions (still block a crisp “done”)

| ID | Blocks |
|----|--------|
| Q1 | Atlas `image` line + pixel upload |
| Q4–Q7 | ylos2 façades vs play-feel bar |
| BRIDGES | wasm32 freeze / hand `dispatchRow` |
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
| 12 | **In progress** — ylos2 e2e; chess absent |
| BRIDGES 1–3 | Guests in progress; IDL/wasm freeze **not started** |

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
| Music → SDL PCM | live | `pumpAudio` |
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
- [ ] Audio: `vocalCues` / one-shots → SDL
- [ ] Cross-platform SW screenshot hashes (Node / macOS / Pi)

### Intentionally out of scope until A+B are credible

- Full v1 catalog port
- WASM guests on the SDL binary
- Replacing v1 `engine:game-sdl:*` (v1 stays runnable)
- Deep SW 3D / GPU backends as the mainline

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
