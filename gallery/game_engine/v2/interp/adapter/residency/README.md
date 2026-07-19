# adapter/residency — guest | host | hybrid

Per-property residency rules and hybrid sync boundaries.

**Plan phase:** 4 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ADAPTER hybrid binding invariants (cached wrapper, dual revisions, turn-start refresh)
- D-ADAPTER

## To implement

- Metadata from registry; document commit boundary for position-like hybrids

## Unit / contract tests that gate this folder

- hybrid_position_commit_boundary_explicit
- host_prop_roundtrip

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
