# bridge/wasm — compiled-guest ABI

rg_* imports and ranger_game_* host linkage for WASM guests.

**Plan phase:** 5 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ASYNC (begin/poll — no callbacks)
- D-WASM
- D-HANDLE

## To implement

- i32/byte spans only; map status codes to errors

## Unit / contract tests that gate this folder

- create_free
- retain_release
- span_bounds

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
