# tests/contract/d_own

Contract tests enforcing D-OWN.

**Plan phase:** 2,6 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-OWN

## To implement

- Mirror CODE_CLEANUP ownership table rows

## Unit / contract tests that gate this folder

- getter_borrowed
- second_release_error
- weak_attachment
- realm_teardown_backstop

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 ✅ green

`d_own_contract_test.rgr` (17 checks) exercises the four ownership-table rows:
`getter_borrowed` (repeated getters never change refcount), `second_release_error`
(double release is `DOUBLE_RELEASE`, not a second decrement — the mesh's strong
ref survives), `weak_attachment` (attach never retains; target destruction
auto-detaches with no UB), and `realm_teardown_backstop` (teardown reclaims every
object a realm still holds, including mesh-retained children).
