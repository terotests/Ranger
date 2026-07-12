Vendored [wasm3](https://github.com/wasm3/wasm3) interpreter sources (MIT license).
Used by `runtime/rg_wasm_bridge.c` and linked into `game_sdl` via `build-game-sdl.sh`.

Core files compiled (no WASI):
m3_bind.c, m3_code.c, m3_compile.c, m3_core.c, m3_env.c, m3_exec.c,
m3_function.c, m3_info.c, m3_module.c, m3_parse.c
