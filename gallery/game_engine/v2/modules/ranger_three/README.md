# modules/ranger_three — ranger:three

Guest Three API backed by live host handles (`ThreeSceneHost` + SW rasteriser).

**Plan:** [`PLAN_2D_EMBED_3D.md`](../../PLAN_2D_EMBED_3D.md) H3/H4 (path A).

## Live surface (first cut)

| Guest | Host |
|-------|------|
| `Scene` / `PerspectiveCamera` / `Mesh` | `RgRangerThree` → `ThreeSceneHost` |
| `BoxGeometry` / `OctahedronGeometry` | SW triangle mesh |
| `MeshBasicMaterial` | unlit colour |
| `Renderer3D.render(scene, cam, target)` | SW 3D → CPU `Texture2D` |
| `SceneSprite3D` | RT + texture-backed `Sprite2D` (ergonomic) |

Registered by `RgGameHost` as the `ranger:three` virtual module (opt-in import).

## Gates

- `tests/contract/d_graphics/rtt_sprite_test`
- `tests/e2e/ylos3d_e2e_test`
