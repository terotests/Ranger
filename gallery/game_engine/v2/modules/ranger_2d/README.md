# modules/ranger_2d — `import * as TWO from "ranger:2d"`

Guest façades for the first-class 2D package (D-2D). Not `THREE.Sprite`.

**Plan phase:** 10b — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-2D, D-SYNC, D-LIFE, D-OWN, D-MODULES

## To implement

- Retained: Scene2D, Sprite2D, Shape2D, Camera2D, Renderer2D, atlas/animation
  → `host/arenas/two_d/`
- Immediate: DrawList2D / drawSprite / drawRect (no persistent handles)
  → `host/frame_commands/two_d/draw_list/` (not arenas)
- Wire via registry commands to those host homes

## Unit / contract tests that gate this folder

- tests/contract/d_2d parity list in CODE_CLEANUP / PLAN

---

## Progress — Phase 10b (D-2D, P1) ✅ green

`RgRanger2D.rgr` is the first-class retained 2D system (sibling of ranger:three,
NOT THREE.Sprite): Texture2D / SpriteAtlas / Sprite2D / Layer2D / Camera2D /
AnimationPlayer2D arenas over the shared registry, plus a frame-local
`DrawList2D` (no persistent identity) and a weak `PoseBinding2D`.

**Gate (green):** `../../tests/contract/d_2d/d_2d_contract_test.rgr` (44 checks)
covering all ten required D-2D parity cases — sprite handle stable across
reorder/reparent; two sprites share one atlas+texture; releasing one sprite
keeps the shared atlas; layer remove ≠ release; SW==GPU camera transforms +
screen↔world round-trip; TS==WASM atlas region; deterministic animation frame at
a runtime time; draw-list leaks no persistent handles; pose binding rejects
stale body/sprite; atlas/resource counts stable across hot reload. Run via `bash
../../tests/run.sh`.
