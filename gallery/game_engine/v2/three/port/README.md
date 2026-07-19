# three/port — staged Three class port + tests

**Copied from:** `gallery/game_engine/three/src/` and `three/tests/`.
**Not copied:** `three/tsx/` (wrapper tree + reconciler / `ThreeTsxBridge`).

**Plan phase:** math/object-model tests support Phases 2–7; GL/software
backends stay Phase 11.

## Binding decisions

- D-SYNC / D-GEO / D-LIFE (target wiring)
- Upstream README: [`README.upstream.md`](./README.upstream.md)

## Status

- **Staged copy.** Files still import each other as in v1 `three/src/`.
- Software/GL backends in this tree are **reference** until `v2/render/` opens.
- Prefer growing the live adapter over resurrecting `three_tsx_bridge`.

## Unit / contract tests that gate this folder

- Co-located `*_test.rgr` under `src/` (37 files)
- Spec suites under `tests/` (value_parity, geometry, object_hierarchy, …)
