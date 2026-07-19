# v2 — debt & readiness

Gaps found while reviewing coverage and **native/SDL run readiness** under
`gallery/game_engine/v2/`.

| Track | What is green today | What is not |
|-------|---------------------|-------------|
| Headless gate | `npm run engine:v2:test` → `bash gallery/game_engine/v2/tests/run.sh` (40 suites) | — |
| SDL / native window | — | **not runnable** (see § SDL below) |

Mark checklist items `[x]` when they land and stay green.

---

## P0 — SDL / native run readiness (not ready)

v1 runs scripted games with SDL via:

```bash
npm run engine:game-sdl:run -- gallery/game_engine/games/pong/index.tsx
# → scripting/game_sdl_runner.rgr → C++ → tmp/game-sdl/game_sdl + gfx_sdl.rgr
```

v2 has **no equivalent path**. Headless ES6 e2e (`RgGameHost` + software present)
works; there is no windowed host that binds SDL I/O into the v2 stack.

### What already exists (usable building blocks)

| Piece | Status | Notes |
|-------|--------|-------|
| `RgGameHost` + `Rg2DPresenter` | live | load TSX → frame; software/textured present into `RgFramebuffer` |
| Software / textured 2D present | live | Phase 11 SW path; used by e2e + `tests/tools/*_screenshot.rgr` |
| `bridge.input.setAction(slot, action, down)` | live | e2e / `RgAttractDriver` feed this; guest sees logical actions only |
| v1 `gallery/game_engine/gfx_sdl.rgr` | live (v1) | `gfx_open` / `gfx_present` / input poll — **not wired to v2** |
| `render/backends/gl/` | scaffold only | README: “after software path works” |

### Missing for “run like v1” (minimum bar)

- [ ] **`npm run engine:v2:sdl` / `engine:v2:sdl:run`** — root `package.json` scripts
      mirroring `engine:game-sdl` / `engine:game-sdl:run` (build + optional `--run`
      with a default game path, e.g. `v2/games/ylos2/index.tsx`)
- [ ] **`gallery/game_engine/scripts/build-v2-sdl.sh`** — Ranger→C++→link SDL2
      (same shape as `scripts/build-game-sdl.sh`, output under e.g. `tmp/v2-sdl/`)
- [ ] **v2 SDL shell `.rgr`** (host-side, **not** inside a game folder) — generic
      loop over `RgGameHost`:
      1. `gfx_open` / `gfx_open_gpu`
      2. poll SDL keys/pads → `bridge.input.setAction(…)` (same action names
         guests already use: `left` / `right` / `jump` / …)
      3. `host.frame(dtMs)`
      4. `Rg2DPresenter.presentTextured` (or SW) → blit to SDL
      5. honour `launch()` via `host.loadLaunched()` like the e2e launcher path
- [ ] **Framebuffer → `gfx_present` binding** — v2 `RgFramebuffer` is `[int]`
      `0xRRGGBB`; v1 `gfx_present` expects an RGBA8888 `buffer` (`SoftCanvas.raw()`).
      Need a pack/blit helper (or present into a SoftCanvas-compatible buffer)
- [ ] **Prove C++ compile of the v2 interpreter stack** — today every v2 suite
      is `-es6` only (`tests/run.sh`). The SDL binary needs
      `ComponentEngine` + `RgRegistryBridge` + modules to compile with `-l=cpp`
      and link; that path is **unproven**
- [ ] **Wire default game + smoke** — at least
      `engine:v2:sdl:run:ylos2` and a short-frame
      `SDL_VIDEODRIVER=dummy` smoke (parity with `engine:game-sdl:smoke:*`)

### Follow-ons (after the first window opens)

- [ ] Split-screen present (`gfx_present_split` or compose panes) for ylos2
- [ ] Audio: bridge `vocalCues` / `musicScore` / one-shots → SDL audio
      (v1: `game_audio_sdl.rgr`; v2 only records cues in the bridge today)
- [ ] Real `render/backends/gl` path (GPU present) — optional once SW→SDL works
- [ ] Do **not** reuse v1 `game_sdl_runner.rgr` as the v2 host — wrong protocol
      (`GameRunner` vs `RgGameHost`); staged copies under `v2/web/`, `v2/sprites/`
      that `Import "../gfx_sdl.rgr"` still point at **v1** layout

### Intentionally out of scope for “first SDL window”

- Full launcher/catalog parity with v1 menu
- WASM guest profiles on the SDL binary
- Replacing v1 `engine:game-sdl:*` (v1 stays runnable)

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
