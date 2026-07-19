# interp/engine — ComponentEngine core

Evaluate expressions/statements needed for bridge tests (new, props, calls).

**Plan phase:** 1,4 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-IDENTITY

## To implement

- Minimal slice of ComponentEngine.rgr — not the full JSX/PDF stack
- Defer hot-reload and JSX-to-EVG until modules phase if unused

## Unit / contract tests that gate this folder

- engine can evaluate fixture scripts that only construct natives

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
