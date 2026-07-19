# host/arenas — typed object pools

One arena family per host type; no pretend downcast across types.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE

## To implement

- three/*, physics/*, audio/*, input/* as separate slot spaces

## Unit / contract tests that gate this folder

- wrong-arena handle rejected at command boundary

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
