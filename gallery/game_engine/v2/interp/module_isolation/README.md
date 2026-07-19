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

---

## Progress — Phase 8a (D-MODULES prerequisite) ✅ green

`RgModuleSystem.rgr` gives every imported module its OWN namespace object:
colliding export names across modules never clobber; the same module imported
twice in one realm returns the cached namespace (body evaluated once); two realms
get separate instances; a failed init is cached as failed (no silent re-run); a
circular import is a deterministic hard error. Gate:
`tests/module_isolation_test.rgr` (18). Run via `bash ../../tests/run.sh`.

## Progress — enforced by the real engine ✅ green

The rules this model pins are now implemented in the staged evaluator
(`interp/migrate/src/ComponentEngine.rgr`): every virtual `ranger:*` module
evaluates in its own `EvalContext` (parented on the host scope only), classes
live in per-module tables, functions are closures over their module scope, and
the import clause is the only door into a module (named imports + `import * as
NS` namespaces, member-new through the namespace). The shared-scope import
behavior (TSX_ENGINE_ISSUES #5/#9) is fixed. Engine-level gate:
`../../tests/unit/interp/module_scope_isolation_test.rgr` (12).
