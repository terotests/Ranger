# Sprite Test (category: Tests)

A PoC for trying the **ready character set** (`lpc/pack/characters/`): a
character-select menu, then a play screen where the pad walks / turns / jumps the
chosen character. It exercises the real WASM sprite path — the RGSP1 block + host
bridge (`scripting/wasm_sprite_runner.rgr`) that resolves a catalog id to a
spritesheet frame.

## Controls

| | Menu | Play |
|-|------|------|
| Left / Right | pick character | turn + walk |
| Up / Down | — | turn + walk |
| A / Space | choose | jump |
| Q / Esc | quit | back to menu |

Keyboard (WASD/arrows + Space) or any gamepad — both feed the same input mask.

## Run it

**Standalone SDL binary (real gamepad), today:**

```bash
npm run engine:chars:poc:sdl        # build + run (needs libsdl2-dev)
# or headless smoke: ./tmp/sprite-char/sprite_char_sdl 120
```

**Headless (no display) — asserts + dumps frames to `lpc/output/poc_*.png`:**

```bash
npm run engine:chars:poc
```

The core lives in [`scripting/sprite_char_poc.rgr`](../../scripting/sprite_char_poc.rgr)
(gfx-free, drives the RGSP1 host bridge); the SDL front-end is
[`sprite_char_sdl.rgr`](../../sprite_char_sdl.rgr).

## WASM guest & launcher tile

The input→slot logic in the core mirrors the real guest
[`wasm/rust_sprite_char/`](../../wasm/rust_sprite_char/) byte-for-byte, so the
behaviour is identical whether it is driven by this host-side core or by the
built module:

```bash
npm run engine:chars:guest          # -> games/sprite_char/sprite_char.wasm (needs wasm32 target)
```

The `game.info` here catalogs the test under **Tests**. Running the tile straight
from the launcher additionally needs the `abi=sprite` runner path wired into
`scripting/game_sdl_runner.rgr` (the standalone binary above is the runnable PoC
until then). See the README "ready character set" section for the whole picture.
