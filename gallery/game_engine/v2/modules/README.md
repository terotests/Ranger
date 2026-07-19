# modules — public guest packages

| Package | Folder | Role |
|---------|--------|------|
| `ranger:core` | [`ranger_core/`](./ranger_core/) | Runtime, surface, input, audio, assets, time |
| **`ranger:2d`** | [`ranger_2d/`](./ranger_2d/) | **P1** — sprites, atlases, Camera2D, DrawList2D, … (D-2D) |
| `ranger:three` | [`ranger_three/`](./ranger_three/) | 3D scene graph domain |
| `ranger:cannon` | [`ranger_cannon/`](./ranger_cannon/) | Physics domain |
| `ranger_wasm::*` | [`ranger_wasm/`](./ranger_wasm/) | Same surfaces for compiled guests |

**Plan phase:** 8–10b — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES
- D-2D (`ranger:2d` / `ranger_wasm::two_d`)

## To implement

- Thin façades over adapter or abi; no private scene trees
- Same registry commands for TS and Rust paths

## Unit / contract tests that gate this folder

- Covered via bridge/modules and contract/d_modules / d_2d

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 8a (D-MODULES) ✅ green

`ranger_core/RgRuntime.rgr` is the per-realm capability root: `runtime.time`
(`RgClock` fixed-step accumulator), `runtime.assets` (`RgAssets` D-ASYNC load
stubs over the poll table), and `runtime.log`. Two realms get distinct roots; a
cross-realm call is rejected; teardown makes the root fail like a stale handle.
Gate: `../tests/contract/d_modules/d_modules_contract_test.rgr` (19), also proving
a guest-only class never occupies a host arena.
