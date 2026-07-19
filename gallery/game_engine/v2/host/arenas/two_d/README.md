# arenas/two_d — ranger:2d retained host arenas (D-2D)

Typed object pools with generation-checked handles. **Not** for frame-local
draw commands — those live in
[`../../frame_commands/two_d/`](../../frame_commands/two_d/).

## Ownership map (contract type → folder)

| Contract type | Home |
|---------------|------|
| `Scene2D` | [`scene/`](./scene/) |
| `Layer2D` | [`layer/`](./layer/) |
| `Camera2D` | [`camera/`](./camera/) |
| `Renderer2D` | [`renderer/`](./renderer/) — retained present/config state |
| `Sprite2D` | [`sprite/`](./sprite/) |
| `Shape2D` | [`shape/`](./shape/) |
| `TileMap2D` | [`tilemap/`](./tilemap/) |
| `ParticleEmitter2D` | [`particle/`](./particle/) |
| `Texture2D` | [`texture/`](./texture/) |
| `SpriteAtlas` | [`atlas/`](./atlas/) |
| `AnimationClip2D` / `AnimationPlayer2D` | [`animation/`](./animation/) |
| `DrawList2D` | **not here** — [`../../frame_commands/two_d/draw_list/`](../../frame_commands/two_d/draw_list/) |

Separate from `arenas/three` and `arenas/physics` (D-TYPE).

**Plan phase:** 10b. Legacy pointer: [`../../../sprites/`](../../../sprites/).
