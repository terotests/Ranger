# Pose Arena (WASM, category: Tests)

The first launcher game driven by **pose detection over the ABI**. A camera + AI
model (MediaPipe on the web, TFLite natively) streams a skeleton; the host copies
the latest sample into the guest's **RGP1** block each frame, and the guest
reacts — exactly the way every other WASM/`.as` game reads its input over the
ABI, not through bespoke C++.

> This replaces the earlier `pose/native_game/pose_game.cc` (an SDL game written
> in C++). The game logic now lives in a real `.wasm` guest behind the WASM
> bridge, like `autopeli_wasm`, `rust_pong`, and `sprite_char`.

## What it shows

- **The latest pose event as text** (the minimum requirement): an **RGU1** HUD
  with the gesture name, whether a body is present, the landmark count, and the
  tracked nose position.
- **A ready character from the host catalog** — the sprite-demo's new **mage**
  and **knight** — drawn through **RGSP1**, following the tracked head. (An
  arms-up gesture toggles the character and shows the jump pose.) Moving the
  sprite is a bonus; the real pose→gameplay rules are intentionally left open.
- **Optionally, a small skeleton overlay** drawn by the host from the same RGP1
  block it streamed.

## How it fits together

```
camera + AI model → RGP1 pose  ─┐
                                ├─► pose_arena.wasm ──► RGSP1 sprite slot ──► host draws catalog character
host input / dt / view  ───────┘                 └──► RGU1 HUD document  ──► host draws the pose text
```

The guest owns the *meaning* (which gesture, which landmark, which character);
the ABI is pure transport. The host (`scripting/sprite_wasm_runner.rgr`, wired
via `abi=sprite`) streams RGP1, ticks the guest, draws the sprite + the HUD text,
and may overlay the skeleton. Swap the pose *source* (fake sweep → a real
MediaPipe/TFLite worker) and nothing else in the chain changes.

## Exports (the ABI surface the host calls)

| Export | Block | Role |
|--------|-------|------|
| `sprite_ptr` / `sprite_size` / `sprite_init` / `sprite_tick` | RGSP1 | ready-character sprites |
| `rg_pose_ptr` / `rg_pose_size` | RGP1 | where the host streams pose |
| `rg_ui_ptr` / `rg_ui_size` / `rg_ui_revision` | RGU1 | the HUD document |
| `rg_required_caps` | — | `RG_WASM_HOST_CAP_POSE_INPUT` (0x10): a host with no camera rejects at load |
| `rg_abi_version` | — | ABI version |

## Build & run

```bash
npm run engine:pose:guest    # rebuild pose_arena.wasm (needs wasm32 target)
npm run engine:pose:verify   # run the guest in Node's WebAssembly, assert HUD text + sprite
npm run engine:game-sdl:run  # build + launch the SDL launcher -> Tests -> Pose Arena
```

The character catalog (`assets/<slug>.png` + `catalog.json`) is shared with
`sprite_char`; adding a character is a catalog + assets change, never a guest
change. The RGP1 contract is `wasm/wasm_pose_abi.h`; the pose reader is
`lib/ranger_game/src/pose.rs`.
