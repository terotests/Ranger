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
