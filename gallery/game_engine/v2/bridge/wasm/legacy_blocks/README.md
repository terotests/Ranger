# bridge/wasm/legacy_blocks — staged v1 linear-memory ABI headers

**Copied from:** `gallery/game_engine/wasm/` (`*.h`, README, small workers).

These are the **block ABI** contracts (RGW1, RGSP1, RGU1, …). v2’s registry
`rg_*` command imports (D-WASM) are a different surface; keep these headers as:

1. Reference for games still on block ABIs during migration
2. Source of truth for **sprite** (RGSP1) and UI (RGU1) until registry covers them

**Plan phase:** 5 (command ABI) in parallel; sprite block → `v2/sprites/abi`.

## Unit / contract tests that gate this folder

- Host validators already used by v1 runners (re-home later)
- Do not treat block ABIs as replacements for D-HANDLE fat handles
