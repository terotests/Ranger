# bridge — guest ↔ host crossings

WASM imports, module injection, and TSX↔WASM parity — not game logic.

**Plan phase:** 5+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-WASM
- D-WASM-MEM
- D-MODULES

## To implement

- imports lower to host/commands; parity compares traces

## Unit / contract tests that gate this folder

- wasm/tests/create_free is the Phase 5 headline gate

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 5 (D-WASM / D-WASM-MEM / D-ASYNC) ✅ green

- `wasm/imports/RgWasmImports.rgr` — the `rg_*` import surface over the SAME
  `RgHost` the interpreter uses. Handles cross as two i32 words; creates return
  through an out-register (`retLo`/`retHi`) + status. Ownership is Clone/Drop =
  refcount (`rg_retain`/`rg_release`), no wrapper double-release guard.
- `wasm/async/RgAsync.rgr` — poll-based async (`begin`/`poll`/`cancel`/`release`),
  exactly-once result transfer, release-frees-unconsumed, teardown backstop.
- `wasm/memory/RgSpan.rgr` — one span convention `(offset_bytes, element_count,
  element_type)` with checked arithmetic; OOB/overflow/negative/align → typed
  error; status codes separate from byte counts.

**Gates (all green):** `wasm/tests/create_free` (19), `wasm/tests/retain_release`
(12), `wasm/tests/async_poll` (17), `wasm/tests/span_bounds` (14), and
`parity/tests/parity_test` (12 — adapter and WASM paths land on identical arena
traces). Run via `bash ../tests/run.sh`.
