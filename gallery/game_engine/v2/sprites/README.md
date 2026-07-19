# sprites — staged v1 sources (migrate → `ranger:2d`)

**Not the target API.** Target package: `ranger:2d` / `ranger_wasm::two_d`
(CODE_CLEANUP **D-2D**).

| Subfolder | Legacy source | Migrates to |
|-----------|---------------|-------------|
| `host/game_sprite.rgr` | retained entities | Sprite2D / Shape2D (D-2D-7) |
| `abi/wasm_sprite_abi.h` | RGSP1 fixed slots | SpriteAtlas + handles (D-2D-8); retire D-2D-10 |
| `rust/ranger_game` | SpriteGame helpers | `ranger_wasm::two_d` |
| `runners/` | reference | rewrite against registry |
| `deps/` | framebuffer helpers | `render/` present path |

See [`../modules/ranger_2d/`](../modules/ranger_2d/) and
[`../host/arenas/two_d/`](../host/arenas/two_d/).
