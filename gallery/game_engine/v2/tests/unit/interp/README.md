# tests/unit/interp

Runner entry for interp unit suites (may exec into package folders).

**Plan phase:** 1+ — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Suites

- `adapter_churn_test` — D-SYNC/D-ADAPTER: same script object → same host
  handle after property churn across turns.
- `module_scope_isolation_test` — D-MODULES scope isolation enforced by the
  REAL `ComponentEngine` (not the RgModuleSystem model): each virtual
  `ranger:*` module evaluates in its own scope; the import clause is the only
  door (named imports + `import * as NS`); same-name exports across modules
  don't clobber (member-new resolves per module); bare un-imported names fail
  in the entry script; module state is private, evaluated once per engine;
  cross-boundary calls root lexically in the callee's module; live objects
  cross by reference; the fixture door still shares the entry scope.

## Unit / contract tests that gate this folder

- all_interp_unit_pass
