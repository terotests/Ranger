# modules/ranger_2d — `import * as TWO from "ranger:2d"`

Guest façades for the first-class 2D package (D-2D). Not `THREE.Sprite`.

**Plan phase:** 10b — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-2D, D-SYNC, D-LIFE, D-OWN, D-MODULES

## To implement

- Retained: Scene2D, Sprite2D, Shape2D, Camera2D, Renderer2D, atlas/animation
- Immediate: DrawList2D / drawSprite / drawRect (no persistent handles)
- Wire to `host/arenas/two_d` + registry commands

## Unit / contract tests that gate this folder

- tests/contract/d_2d parity list in CODE_CLEANUP / PLAN
