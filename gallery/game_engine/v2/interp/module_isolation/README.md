# interp/module_isolation — import namespaces

Per-import module scopes — prerequisite before ranger:* injection.

**Plan phase:** 8 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES
- D-IDENTITY

## To implement

- Fix shared-scope import behavior (TSX_ENGINE_ISSUES #5/#9)
- Repeated import returns same namespace object

## Unit / contract tests that gate this folder

- colliding_helpers_do_not_clobber
- repeated_import_same_namespace
- two_realms_distinct_runtime

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
