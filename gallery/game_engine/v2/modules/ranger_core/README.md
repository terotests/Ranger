# modules/ranger_core — ranger:core

Capability root: runtime.surface/input/audio/assets/log/platform.

**Plan phase:** 8,10 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES

## To implement

- runtime.start(Game) API surface (host-driven)

## Unit / contract tests that gate this folder

- runtime_is_realm_scoped

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 10 (audio / input / surface devices) ✅ green

`RgAudio.rgr` — clip ≠ source ≠ voice with D-OWN: `sourceCreate` retains the
clip; `play()` returns a caller-owned voice; `playOneShot()` returns a
mixer-owned voice the mixer auto-releases at completion; weak `attach`
auto-detaches when the target dies; `disposeBackend` bumps `resourceRevision`
without releasing. `RgInputSurface.rgr` — device identity (generation-checked
gamepad handles), player assignment stable across reconnect, logical action edge
states + `axis1D`, and split-screen `RgSurface` panes with per-pane player
binding.

**Gate (green):** `tests/devices_test.rgr` (42) covering all three subsystems.
Run via `bash ../../tests/run.sh`.
