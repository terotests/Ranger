# Rust Pong (WASM) — Path C PoC

Minimal Pong game logic compiled from Rust to WebAssembly and loaded at runtime
by `WasmGameRunner` (wasm3 interpreter embedded in the SDL host).

## Layout

```
games/rust_pong/
  game.info       # engine=wasm, module=logic.wasm
  logic.wasm      # built artifact (committed for convenience)

wasm/rust_pong/
  src/lib.rs      # Rust source
  build.sh        # cargo wasm32-unknown-unknown → logic.wasm
```

## WASM export ABI

| Export | Signature | Role |
|--------|-----------|------|
| `init` | `()` | Reset state |
| `update` | `(dt_ms, up, down, left, right)` | Frame logic |
| `ball_x`, `ball_y` | `() -> i32` | Ball position |
| `paddle1_y`, `paddle2_y` | `() -> i32` | Paddle centers |
| `score1`, `score2` | `() -> i32` | Scores |

## Commands

```bash
# Rebuild WASM module from Rust
npm run engine:wasm:build:rust-pong

# Headless integration test (no SDL window)
npm run engine:wasm:demo:pong

# SDL smoke test (dummy video driver in CI)
npm run engine:game-sdl:smoke:rust-pong

# Run directly (window or SDL_VIDEODRIVER=dummy)
npm run engine:game-sdl:run:rust-pong
```

The game also appears in the launcher menu as **Rust Pong (WASM)** when `games/rust_pong/`
is under `--games-dir`.
