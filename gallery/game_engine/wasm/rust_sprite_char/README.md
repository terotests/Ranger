# rust_sprite_char — RGSP1 sprite-character guest (Rust)

A tiny WASM guest that drives the **ready character set** over the sprite ABI. It
ships **no art and no animation code**: it picks characters from the host's
catalog by numeric id — the same way a guest plays a sound by writing
`RG_WASM_SOUND_*` — sets each one's animation + direction + position, and lets
the host resolve id → spritesheet → animation frame and draw it.

This is the sprite counterpart of the fixed sound set: the guest references a
*ready set*, it does not carry the assets.

## Contract

Shared linear-memory block, layout in [`../wasm_sprite_abi.h`](../wasm_sprite_abi.h)
(`RGSP1`). Same shape as the other Ranger WASM ABIs (RGW1 game, RGX1 streaming,
RGLD loader).

| Export | Role |
|--------|------|
| `sprite_ptr()`  | pointer to the RGSP1 block in linear memory |
| `sprite_size()` | `RG_SPR_ABI_SIZE` (2560) |
| `sprite_init()` | stamp header, seed the four catalog characters |
| `sprite_tick()` | advance clocks; steer slot 0 from host input |
| `rg_abi_version()` | so an older host can reject a newer guest |

Each tick the host writes `dt_ms` / `input` into the header, calls `sprite_tick()`,
then reads the slot array and draws each active slot. The guest seeds four
characters (hero / knight / mage / rogue); slot 0 is player-controlled — arrow
keys turn it, ACTION triggers a jump that reverts to walking when the hop ends.

## Build

```bash
./gallery/game_engine/wasm/rust_sprite_char/build.sh   # or: npm run engine:chars:guest
```

Requires the `wasm32-unknown-unknown` target (the script installs it on demand).
Output: `games/sprite_char/sprite_char.wasm`.

## Host side & catalog

- Host bridge: [`../../scripting/wasm_sprite_runner.rgr`](../../scripting/wasm_sprite_runner.rgr)
- Ready catalog: [`../../lpc/pack/characters/`](../../lpc/pack/characters/) (`catalog.json` + `<slug>/walk.png` + `<slug>/credits.json`)
- End-to-end demo without a WASM toolchain: `npm run engine:chars:demo`
  (hand-writes the exact RGSP1 bytes this guest emits, asserts the resolved
  frames, and renders `lpc/output/characters_demo.png`).

Adding a new character never changes this guest — it just references a new id.
See the "Generating new characters" section in
[`../../README.md`](../../README.md).
