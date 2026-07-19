# games — selected titles on the v2 API

Re-implemented (or lightly copied) games that run **only** against the v2
engine (`ranger:core` / `ranger:three` / `ranger:cannon` or `ranger_wasm`).

**Plan phase:** 12 (smoke ports may start once modules exist) — see
[`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES
- D-SYNC (live objects — no reconciler)

## Policy (read this first)

1. **New folder, old tree kept.** Ports live here under `v2/games/<name>/`.
   The top-level [`../../games/`](../../games/) tree is **not deleted**.
2. **Select, don’t bulk-move.** Games are still small — pick titles that
   exercise the API; do not dump every v1 game in at once.
3. **Copy or rewrite by maturity.**
   - **Copy + adapt** when the old game is already close to the target API.
   - **Rewrite** a thin version when the old code depends on the reconciler,
     `three/tsx` private trees, or other v1 bridges.
4. **No v1 engine imports.** v1 sources are a gameplay reference only.

## To implement

- Maintain a short selection list below as titles are chosen
- One subdirectory per game: `v2/games/<name>/` with its own README
- Prefer `runtime.start(Game)` / `ranger_wasm::export_game!` shapes from
  CODE_CLEANUP worked examples

## Candidate selection (fill in as ports start)

| v1 source | v2 path | Strategy | Status |
|-----------|---------|----------|--------|
| *(none yet)* | | copy / rewrite | pending |

Suggested early picks (small, high signal):

- **3D:** rotating cube, teapot, one Cannon stack / sandbox
- **2D (`ranger:2d`):** Pac-Man or Breakout class title; one LPC / character
  sample via `SpriteAtlas` + `AnimationPlayer2D` (not RGSP1 slots)
- **Audio/input:** one sample exercising `ranger:core`

Exact order follows module readiness — do not skip 2D because Three landed
first. Target imports: `ranger:2d` / `ranger_wasm::two_d` (D-2D).

## Unit / contract tests that gate this folder

- Each game: headless smoke runner under `v2/tests/` or `games/<name>/tests/`
- No import of `ThreeTsxBridge.reconcile` or v1 `three/tsx` wrappers
- Shared geometry / shutdown paths obey D-LIFE (from CODE_CLEANUP examples)

## Notes

- Engine gates (create/free, adapter, WASM) come **before** game ports need
  pixels
- Assets may be copied from v1 game folders when useful; document the source
  path in the game’s README

---

*Scaffold only (Phase 0). Game subfolders are added when a title is selected.*
