# interp/adapter — native object adapter

Sole interpreter route to host: construct / getProperty / setProperty / invokeMethod.

**Plan phase:** 4 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ADAPTER
- D-PROP
- D-SYNC

## To implement

- Translate registry ids → host commands
- Enforce residency; never reconcile on render

## Unit / contract tests that gate this folder

- construct_mesh_once
- same_script_object_same_handle
- unknown_read_undefined_no_host_call

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 4 (D-ADAPTER / D-PROP / hybrid invariants) ✅ green

`RgAdapter.rgr` is the single native-object interface
(`construct`/`getProperty`/`setProperty`) over the Phase-2 arenas + Phase-1
identity:

- **construct** — `new Mesh(g,m)` → one `meshH` (retains geo+mat); a second
  construct yields a different handle + NativeRef identity.
- **host prop `geometry`** — borrowed getter returns the ONE cached wrapper for
  that handle; repeated reads keep wrapper identity.
- **hybrid prop `position`** — a cached vec3 mirror per (NativeRef, prop):
  `mesh.position === mesh.position`; two revisions (guest dirty vs host rev);
  turn-start refresh (a retained mirror is a within-turn snapshot, invisible to
  mid-turn host writes, refreshed next turn); guest-commit-wins at the frame
  boundary.
- **D-PROP overlay** — unknown read → `undefined`; unknown write → guest-side
  overlay; the host never sees expandos.

**Gates (all green):** `tests/adapter_construct_test` (8),
`tests/adapter_overlay_test` (9), `tests/adapter_hybrid_test` (8), and
`../../tests/unit/interp/adapter_churn_test` (15 — same object → same handle
after churn). Run via `bash ../../tests/run.sh`.
