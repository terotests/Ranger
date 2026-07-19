# interp/values — EvalValue & NativeRef

Script values including NativeRef { identityId, handle, realmId }.

**Plan phase:** 1 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-IDENTITY
- D-HANDLE

## To implement

- Port/adapt EvalValue.rgr
- identityId assigned at construction; immutable for object lifetime

## Unit / contract tests that gate this folder

- NativeRef equality by identityId
- One identityId maps to at most one live host handle in a realm

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 1 (D-IDENTITY / D-HANDLE) ✅ green

Implemented a self-contained v2 value slice (no EVG / ts_parser dependency yet):

- `RgValue.rgr` — tagged runtime value. Kinds `0 undefined · 1 null · 2 number ·
  3 string · 4 bool` (primitives, no identity) and `5 object · 6 array ·
  7 function · 8 nativeRef` (references). References carry an **immutable**
  `identityId` + `realmId`; a nativeRef also carries a host `handle`
  (0 = `HANDLE_INVALID`). `tripleEquals` (=== by identity for refs, by value for
  primitives) and `sameKey` (Map/Set key equality) live here.
- `RgRealm.rgr` — mints monotonic per-realm identities and enforces the
  D-IDENTITY invariant *one identity ↔ at most one live host handle*
  (`bindHandle` rejects a second live handle; `unbindHandle` frees it for rebind).

**Gate:** `tests/rg_value_test.rgr` (19 checks) — immutable identity, handle
round-trip, rebind rejection, identity-stable-under-mutation. `bash
../../tests/run.sh` → ALL PASS.

> The full `migrate/src/EvalValue.rgr` port (with EVG/JSX) is deferred; this
> slice exists to pin the identity contract that Phase 4 adapter work depends on.
