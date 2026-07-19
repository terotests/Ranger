# host — authoritative scene & subsystem state

Typed **arenas** (retained pools) + **frame_commands** (per-frame buffers) +
handles + registry command implementations. No pixels.

**Plan phase:** 2+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-HANDLE
- D-LIFE
- D-SYNC
- D-OWN
- D-2D (arenas/two_d vs frame_commands/two_d)

## To implement

- Arenas first for retained objects; frame_commands for immediate DrawList2D
- Registry commands call into arenas / frame buffers; render reads later


## Unit / contract tests that gate this folder

- host/tests/* create/release/membership/dispose/stale

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 (D-HANDLE / D-TYPE / D-OWN) ✅ green

- `handles/RgHandle.rgr` — fat handle `{slot, generation, realmId, typeId}` +
  `RgErr` typed codes + `RgResolve`. Two-word (`lo`/`hi`) WASM transport
  pack/unpack with a documented 20-bit slot / 20-bit generation wrap policy;
  invalid sentinel is slot 0 (never `< 0`).
- `RgRegistry.rgr` — entity/slot table: alloc (free-list recycle + generation
  bump), `resolveSlot`/`resolveTyped` (range → live → generation → realm →
  type), refcount `retain`/`releaseOnce`, and the `teardownRealm` backstop.
- `arenas/RgHost.rgr` — typed geometry/material/mesh arenas over one registry
  (D-TYPE, no pretend downcast). `meshCreate` retains geo+mat; getters borrow;
  `meshSetGeometry` retain-new/release-old; mesh release frees its children;
  weak attachments never retain and auto-detach on target destruction.
- `ownership/OwnedHandle.rgr` — single owned reference; second release through
  the same wrapper → typed `DOUBLE_RELEASE`.

**Gates (all green):** `host/handles/tests/rg_handle_test` (22),
`host/tests/create_release` (15), `host/tests/ownership` (29),
`host/tests/stale_cross_realm` (10), `tests/contract/d_own` (17). Run: `bash
../tests/run.sh`.
