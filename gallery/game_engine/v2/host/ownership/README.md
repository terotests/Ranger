# host/ownership — D-OWN bookkeeping

Owned vs borrowed vs weak-attachment rules shared by arenas and commands.

**Plan phase:** 2,6 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-OWN
- D-LIFE
- D-HANDLE

## To implement

- Track refcounts for owned refs
- Getters return borrowed wrappers (no refcount change)
- Weak attachments auto-detach on target destroy

## Unit / contract tests that gate this folder

- getter_borrowed_no_refcount_bump
- second_release_typed_error
- weak_attach_autodetach

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 ✅

`OwnedHandle.rgr` implements the D-OWN "release exactly once per wrapper" rule.
Refcount ownership itself lives in `../RgRegistry.rgr` (retain/releaseOnce) and
the retain-on-create / release-children behaviour in `../arenas/RgHost.rgr`.
Second release through the same wrapper → typed `DOUBLE_RELEASE` (see
`../../tests/contract/d_own/`).
