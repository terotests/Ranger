# registry/schema/two_d — ranger:2d class registry (D-2D)

**Plan phase:** 10b / D-2D-1 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-2D, D-REGISTRY, D-MODULES

## To implement

- Classes: Scene2D, Layer2D, Camera2D, Renderer2D, Sprite2D, Shape2D,
  SpriteAtlas, AnimationClip2D, AnimationPlayer2D, TileMap2D,
  ParticleEmitter2D, DrawList2D (frame-local — no handle identity)
- Asset command: assetsLoadSpriteAtlas (D-ASYNC)
- Optional: PoseBinding2D under ranger:core bindings

## Unit / contract tests that gate this folder

- Codegen emits identical command names for TS adapter + WASM + rust `two_d`
- Published ids immutable (D-REGISTRY tombstones)
