# v2 — debt & readiness

Gaps found while reviewing coverage and **native/SDL run readiness** under
`gallery/game_engine/v2/`.

| Track | What is green today | What is not |
|-------|---------------------|-------------|
| Headless gate | `npm run engine:v2:test` → `bash gallery/game_engine/v2/tests/run.sh` (46 suites) | — |
| SDL / native window | `RgSdlGameHost` + headless seam tests | full native CI smoke (see § SDL below) |

Mark checklist items `[x]` when they land and stay green.

---

## P0 — SDL / native run readiness (not ready)

### How headless works today (for contrast)

v2 games **do** run through the TSX interpreter already — just not in an SDL
process:

1. Compile a Ranger host/driver with `-es6` (e.g. `tests/e2e/ylos2_e2e_test.rgr`,
   `tests/tools/ylos2_screenshot.rgr`).
2. **Node.js** executes that ES6 host.
3. Host constructs `RgGameHost` → `ComponentEngine.loadScript(…)` **parses and
   evaluates** the guest `index.tsx` (interpreter, not tsc/esbuild).
4. Frames + software/textured present write an in-memory `RgFramebuffer`;
   shots dump RGB → PNG. No window, no `gfx_sdl`.

See [`README.md`](./README.md) “How v2 runs today”.

### What v1 SDL does (target shape)

```bash
npm run engine:game-sdl:run -- gallery/game_engine/games/pong/index.tsx
# → scripting/game_sdl_runner.rgr → C++ binary → gfx_sdl.rgr (window + input)
```

v2 has **no equivalent**. Same guest protocol (`RgGameHost` + interpreter)
must move from “ES6 under Node” to “C++ binary + SDL bindings”.

### What already exists (usable building blocks)

| Piece | Status | Notes |
|-------|--------|-------|
| `RgGameHost` + `Rg2DPresenter` | live | load TSX via interpreter → frame; SW/textured present |
| Software / textured 2D present | live | Phase 11; e2e + `tests/tools/*_screenshot.rgr` |
| `bridge.input.setAction(slot, action, down)` | live | e2e / `RgAttractDriver`; guest sees logical actions only |
| v1 `gallery/game_engine/gfx_sdl.rgr` | live (v1) | `gfx_open` / `gfx_present` / input poll — **not wired to v2** |
| `render/backends/gl/` | scaffold only | README: “after software path works” |

### Missing for SDL (checklist)

**Process / build**

- [ ] **`npm run engine:v2:sdl` / `engine:v2:sdl:run`** — root scripts mirroring
      `engine:game-sdl` / `:run` (default game e.g. `v2/games/ylos2/index.tsx`)
- [ ] **`scripts/build-v2-sdl.sh`** — Ranger→C++→link SDL2 (like
      `build-game-sdl.sh`, output under e.g. `tmp/v2-sdl/`)
- [ ] **Prove `-l=cpp` on the v2 interpreter stack** — today every suite is
      `-es6` only. SDL needs `ComponentEngine` + `RgRegistryBridge` + modules
      to compile and link as a native binary (unproven)

**Bindings (the actual SDL glue)**

- [ ] **v2 SDL shell `.rgr`** (host-side, **not** inside a game folder) — generic
      loop over `RgGameHost`:
      1. `gfx_open` / `gfx_open_gpu`
      2. poll SDL keys/pads → `bridge.input.setAction(…)` (`left` / `right` /
         `jump` / … — same names guests already use)
      3. `host.frame(dtMs)` — still the **TSX interpreter** inside the binary
      4. `Rg2DPresenter.presentTextured` (or SW) → blit to SDL
      5. honour `launch()` via `host.loadLaunched()`
- [ ] **Framebuffer → `gfx_present`** — v2 `RgFramebuffer` is `[int]`
      `0xRRGGBB`; `gfx_present` wants RGBA8888 `buffer` (`SoftCanvas.raw()`).
      Need a pack/blit helper
- [ ] **Smoke** — `engine:v2:sdl:run:ylos2` + short
      `SDL_VIDEODRIVER=dummy` run (parity with `engine:game-sdl:smoke:*`)

**Do not**

- [ ] Reuse v1 `game_sdl_runner.rgr` as the v2 host — wrong protocol
      (`GameRunner` vs `RgGameHost`). Staged `v2/web/` / `v2/sprites/` imports of
      `../gfx_sdl.rgr` still point at **v1** layout.

### Follow-ons (after the first window opens)

- [x] Pane-aware present on `RgSdlGameHost` — follows guest `surface.paneCount()`
      (1 → `gfx_present`, 2+ → `gfx_present_split`); neutral `clearRgb` (no
      title-baked sky). Still wants a live native smoke of both layouts.
- [ ] Audio: bridge `vocalCues` / one-shots → SDL audio (music path via
      `musicScore` + `pumpAudio` already exists; vocals/SFX still record-only)
- [ ] Real `render/backends/gl` path (GPU present) — optional once SW→SDL works

### Intentionally out of scope for “first SDL window”

- Full launcher/catalog parity with v1 menu
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
| `tests/e2e/` | 2 | yes | ylos2 + launcher — in order for current atlas/sim probes |
| `lpc/` | 0 | no | **decoder + compose ungated** (this file, P0) |
| `sprites/` | 0 | no | staged; runners/demos only |
| `menu/` | 0 local | via e2e | launcher covered by `tests/e2e/launcher_e2e_test`; no folder-local unit suite |
| `games/` | 0 | via e2e | ylos2 e2e only; chess/other ports still pending |
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
# Live v2 headless gate (must stay green)
npm run engine:v2:test
# same as: bash gallery/game_engine/v2/tests/run.sh

# Optional: offline PNG of ylos2 via textured software present (no SDL window)
npm run engine:v2:shot:ylos2

# SDL window (target — not implemented yet)
# npm run engine:v2:sdl:run -- gallery/game_engine/v2/games/ylos2/index.tsx

# Inventory: local tests vs central driver
# (suites listed in tests/run.sh vs find v2 -name '*_test.rgr')
```
