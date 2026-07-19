# tests — cross-cutting v2 gates

Unit and contract runners that may span interp/host/bridge.

**Plan phase:** 1+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## To implement

- run.sh / package scripts added as suites appear

## Unit / contract tests that gate this folder

- unit/* and contract/* must pass before Phase 11

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — harness + runner live

- `harness/RgTest.rgr` — shared assertion harness (`ok/no/eqInt/eqStr/eqBool/
  near/summary`). Prints `  PASS/FAIL <name>` and a grep-able `ALL PASS` /
  `SOME FAILED` summary, matching the physics/ and three/ port harnesses.
- `run.sh` — compiles every registered suite to ES6 and runs it under Node,
  printing an aggregate `v2 ALL GREEN — N/N suites passed` banner (non-zero exit
  on any failure). Add new suites to the `run_suite` list as folders go green.

**Status:** Phase 1 (D-IDENTITY) + Phase 2 (D-HANDLE / D-TYPE / D-OWN) suites
green — 8 suites / 156 checks: `interp/values`, `interp/semantics`,
`tests/contract/d_identity`, `host/handles`, `host/tests/create_release`,
`host/tests/ownership`, `host/tests/stale_cross_realm`, `tests/contract/d_own`.
