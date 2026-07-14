# Sprite Test (WASM, category: Tests)

A real WASM game for the launcher's **Tests** group that lets you try the ready
character set (`lpc/pack/characters/`): a character-select menu, then a play
screen where the pad walks / turns / jumps the chosen character.

The guest (`sprite_char.wasm`, built from
[`wasm/rust_sprite_char/`](../../wasm/rust_sprite_char/)) owns the whole game and
ships no art: it picks characters from the host catalog by numeric id — the same
way a guest plays a sound by `RG_WASM_SOUND_*` — and writes the RGSP1 block. The
host (`scripting/sprite_wasm_runner.rgr`, wired into `game_sdl_runner.rgr` as
`abi=sprite`) writes input + view size, ticks the guest, and draws each slot as a
spritesheet frame from `assets/<slug>.png`.

## Controls

| | Menu | Play |
|-|------|------|
| Left / Right | pick character | turn + walk |
| Up / Down | — | turn + walk |
| A / Space | choose | jump |
| Q / Esc | quit to launcher | quit to launcher |

Keyboard (WASD/arrows + Space) or any gamepad.

## Files

| File | Role |
|------|------|
| `game.info` | `engine=wasm module=sprite_char.wasm abi=sprite category=Tests` |
| `sprite_char.wasm` | the guest (rebuild: `npm run engine:chars:guest`) |
| `assets/<slug>.png` | baked character walk sheets (self-contained for deploy) |

## Build & run

```bash
npm run engine:chars:guest    # rebuild sprite_char.wasm (needs wasm32 target)
npm run engine:chars:verify   # run the guest in Node's WebAssembly, assert the block
npm run engine:game-sdl:run   # build + launch the SDL launcher -> Tests -> Sprite Test
```

The host side (`scripting/sprite_wasm_runner.rgr`) and the RGSP1 contract
(`wasm/wasm_sprite_abi.h`) are shared with the catalog; adding a new character is
a catalog + `assets/` change, never a guest change.
