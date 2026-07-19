# bridge/wasm — compiled-guest ABI

rg_* imports and ranger_game_* host linkage for WASM guests.

**Plan phase:** 5 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ASYNC (begin/poll — no callbacks)
- D-WASM
- D-HANDLE
- D-WASM-MEM

## To implement

- i32/byte spans only; map status codes to errors
- Async request/result transfer via poll (no ABI callbacks)

## Unit / contract tests that gate this folder

| Test | Asserts |
|------|---------|
| [`tests/create_free/`](./tests/create_free/) | create + free over `rg_*` |
| [`tests/retain_release/`](./tests/retain_release/) | fat-handle refcounts |
| [`tests/span_bounds/`](./tests/span_bounds/) | OOB ptr/len rejected |
| [`tests/async_poll/`](./tests/async_poll/) | exactly-once result transfer; teardown releases |

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
