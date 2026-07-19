# v2 — ground-up engine (live objects)

Greenfield implementation of the CODE_CLEANUP binding contract. **v2 is the
authoritative new stack**; v1 is a **migration reference** that stays
**runnable** until an explicit archival milestone (see plan Intent).

Headless interpreter + host arenas + WASM bridge first; rendering last.

**Plan phase:** 0+ — see [`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md).

## How v2 runs today (headless Node + TSX interpreter)

There is **no SDL window** yet. Everything green below is the same stack:

```text
.rgr host/driver  ──(-es6)──►  Node.js process
                                  │
                                  ├─ RgGameHost / bridge / arenas / SW present
                                  │     (Ranger compiled to ES6, executed by Node)
                                  │
                                  └─ ComponentEngine  ←── parses & evaluates guest .tsx
                                        (TSX interpreter written in Ranger;
                                         game source is NOT compiled to JS ahead of time)
```

| Layer | What runs it | Notes |
|-------|--------------|-------|
| Host (`RgGameHost`, e2e, screenshot tools) | **Node.js** after Ranger→ES6 | `tests/run.sh` and `engine:v2:shot:*` both use `-es6` |
| Guest game (`games/*/index.tsx`) | **TSX interpreter** (`interp/migrate/src/ComponentEngine.rgr`) | Loaded at runtime via `host.load(dir, file)`; registry commands hit real host arenas |
| Pixels | **Software / textured CPU present** → in-memory `RgFramebuffer` | No `gfx_sdl`, no GL window; shots dump RGB text → PNG |

So: yes, the process is fully a Node backend today; yes, the game still runs through the **TSX interpreter** (not as native Node/TS modules). Node only hosts the compiled Ranger engine.

### Unit / contract tests

```bash
npm run engine:v2:test
# same as: bash gallery/game_engine/v2/tests/run.sh
```

Compiles every registered suite to ES6, runs it under Node, and prints
`v2 ALL GREEN — N/N suites passed` (non-zero exit on any failure).

- `tests/unit/*` and `tests/contract/*` are the cross-cutting gates
- Folder-local `*_test.rgr` suites under interp/host/bridge/… are wired into
  the same driver as phases land
- A phase is done only when its folder README tests pass
- Staged ports (`three/port/`, `physics/cannon/`, …) may still carry upstream
  `*_test.rgr` files outside this driver — re-home runners as they go live

### Headless shots (diagnostic, not a gate)

Same Node + interpreter path; after a few `host.frame` ticks the software
presenter fills framebuffers and a tiny JS helper writes a PNG.

```bash
npm run engine:v2:shot:ylos2
# → compile tests/tools/ylos2_screenshot.rgr → ES6
# → Node: RgGameHost.load(v2/games/ylos2) → ComponentEngine evaluates index.tsx
# → Rg2DPresenter.presentTextured → RGBSHOT dump → dump_rgb_to_png.js
```

Details: [`tests/tools/README.md`](./tests/tools/README.md).

### SDL / native window

**Not ready.** v1 still uses `npm run engine:game-sdl:run` (Ranger→C++ +
`gfx_sdl`). v2 needs the same *host protocol* (`RgGameHost`) compiled to C++
and bound to SDL for input/present — checklist in [`TODO.md`](./TODO.md).

## Central model

```text
guest identity
    → generated registry command
    → typed host arena  (or frame_commands buffer)
    → renderer reads host state
```

TSX and WASM issue the **same** registry commands. Object lifetime is separate
from scene membership and from backend-resource lifetime (D-LIFE / D-OWN).

**Staged vs live:** copies under `sprites/`, `three/port/`, `physics/cannon/`,
etc. are **staged** (provenance + future rewire). They are not the live engine
until a phase wires them. Do not treat import paths as done at Phase 0.

## Binding decisions

- All D-* in [`CODE_CLEANUP.md`](../CODE_CLEANUP.md)
- Gate order matches plan phases: identity → registry/arenas → adapter →
  ownership/geo → WASM → modules (incl. assets/time) → D-2D → render → games

## Top-level map

| Folder | Role | First real work |
|--------|------|-----------------|
| [`registry/`](./registry/) | Schema + codegen for every surface | Phase 3 |
| [`interp/`](./interp/) | TSX evaluator, identity, adapter (staged sources under `migrate/src`) | Phase 1 → 4 |
| [`host/`](./host/) | Handles, typed **arenas**, **frame_commands** (DrawList2D), ownership | Phase 2 |
| [`bridge/`](./bridge/) | WASM imports, legacy block headers, module inject, parity | Phase 5 |
| [`modules/`](./modules/) | `ranger:core` / **`ranger:2d`** / `three` / `cannon` + `ranger_wasm` | Phase 8–10b |
| [`runtime/`](./runtime/) | Host-driven `Game` loop; assets/time in Phase 8 | Phase 8–10 |
| [`physics/`](./physics/) | Staged Cannon port + step wiring | Phase 9 |
| [`three/`](./three/) | Staged Three class port + tests (no `tsx` bridge) | Phase 2–7 |
| [`sprites/`](./sprites/) | Staged v1 sprite sources → migrate to **`ranger:2d`** (D-2D) | Phase 10b–12 |
| [`lpc/`](./lpc/) | LPC compositor → SpriteAtlas assets | Phase 10b |
| [`evg/`](./evg/) | EVG layout/vector primitives (staged) | UI / soft-2D |
| [`model3d/`](./model3d/) | glTF / model readers (staged) | Phase 8+ (assets) |
| [`ui/`](./ui/) | Retained UI widgets (staged) | with EVG |
| [`web/`](./web/) | Browser VFS + publish framework (staged) | after headless gates |
| [`render/`](./render/) | Backends only — **do not start early** | Phase 11 |
| [`games/`](./games/) | Selected **2D + 3D** titles on v2 API (must-pass: chess, ylos2) | Phase 12 |
| [`tests/`](./tests/) | Cross-cutting unit + D-* contract gates | Phase 1+ |

Each subdirectory has its own `README.md` listing what to implement and which
unit tests gate that folder.

## v1 policy (short)

| Mode | Guarantee |
|------|-----------|
| **Runnable legacy** (current → Phase 12) | Top-level `../games/` stay launchable; v1 `scripting/` / runners frozen |
| **Archival legacy** (later milestone only) | v1 sources kept for reference; only v2 guaranteed runnable |

Phase 12 does **not** delete v1 runtime infrastructure. See plan Intent.

## To implement

- Fill child folders per `CODE_CLEANUP_PLAN.md` phases
- Do not import the reconciler or `three/tsx` wrapper tree here
- Phase 5 headline: `bridge/wasm/tests/create_free` — create/free over `rg_*`
  before any renderer exists
- Rebuild **including games** under `games/` — select, copy-or-rewrite; **do not
  delete** top-level `../games/`
- **`ranger:2d` is P1** (CODE_CLEANUP D-2D) — sibling of `ranger:three`, not
  `THREE.Sprite`; staged `sprites/` / RGSP1 migrate via D-2D-1…10
- Retained 2D objects → `host/arenas/two_d/`; immediate `DrawList2D` →
  `host/frame_commands/two_d/`
- Staged copies are present; rewire imports before treating them as live

## Notes

- Plan: [`../CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) (rebuild policy +
  **Staged modular imports** + **2D sprites** + runnable→archival transition)
- Contract: [`../CODE_CLEANUP.md`](../CODE_CLEANUP.md)
- Testing debt / module coverage gaps: [`TODO.md`](./TODO.md)
- Hybrid 2D+3D composition (design): [`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md)
  — answers [`QUESTIONS.md`](./QUESTIONS.md) Q2/Q3; not implemented yet
  (H1–H7 after Phase 11).
