# sprites — 2D sprite runtime (first-class in v2)

2D sprites were integral to the old games framework (Pac-Man, Breakout, Ylos,
character sheets, RGSP1 WASM). v2 must not become 3D-only.

| Subfolder | Contents | Source |
|-----------|----------|--------|
| [`host/`](./host/) | Retained sprite schema + draw dispatch | `scripting/game_sprite.rgr` |
| [`abi/`](./abi/) | RGSP1 block header | `wasm/wasm_sprite_abi.h` |
| [`rust/`](./rust/) | `ranger_game` sprite helpers | `lib/ranger_game/` |
| [`runners/`](./runners/) | Reference runners (not yet rewired) | `scripting/*sprite*` |
| [`deps/`](./deps/) | framebuffer / blit helpers used by host | top-level `.rgr` |

**Also related:** [`../lpc/`](../lpc/) for LPC sheet composition.

## Binding decisions

- Treat sprites as host arenas + registry commands long-term (same D-HANDLE /
  D-OWN / D-LIFE rules as meshes)
- RGSP1 block ABI remains valid for compiled sprite guests until a registry
  command surface supersedes it (parallel to D-WASM versioning)
- Guest games under `v2/games/` may use either TSX `sprites()` vocabulary or
  RGSP1 / `ranger_game::sprite`

## Plan phase

- Kernel + ABI staged now (Phase 0 import)
- Headless create/free / slot tests with host arenas: after Phase 2 patterns
- Draw path: with Phase 11 (software/GL) or soft-2D present path
- Selected 2D games (Phase 12) — Pac-Man / Breakout class titles

## Unit / contract tests that gate this folder

- Retained list: add/remove sprite entity ≠ releasing sheet texture (D-LIFE)
- RGSP1 magic/version/size validation (legacy block discipline)
- `ranger_game` sprite unit tests under `rust/ranger_game/tests` if present
- LPC compose → sheet → sprite slot smoke (with `../lpc`)

## Status

- **Staged copy.** `game_sprite.rgr` import paths still point at v1
  `framebuffer` / `gfx_sdl` / scripting loaders — rewire before live use.
