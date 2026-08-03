# interp — TSX / JS evaluator (guest path A)

Interpreter realm: EvalValue, evaluation engine, semantics, native adapter.

**Plan phase:** 1,4 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-IDENTITY
- D-ADAPTER
- D-PROP
- D-REGISTRY — built-ins keyed by (receiverKind, name); that pair is also the
  first-class value, so `Array.prototype.slice.call(...)` resolves
- D-PROTO — prototype chain, cycle-bounded
- D-ACCESSORS — getters/setters held apart from data properties
- D-ATTRS — writable/enumerable/configurable; absent means all-true
- D-ERRORS — error constructors are seeded singletons, compared by identity
- D-GLOBALOBJ — built-in namespaces are real objects, not structural names
- D-IEEE — division by zero, negative zero, Infinity/NaN as values

See [`CONFORMANCE.md`](./CONFORMANCE.md) for how runtime conformance is measured
and which gaps are **deliberate** — including the ones that are known-wrong and
pinned rather than hidden.

## To implement

- Selective port from gallery/pdf_writer/src/jsx/ (see migrate/)
- No Three wrappers here — adapter talks to host commands only

## Unit / contract tests that gate this folder

- semantics + adapter unit tests before any render demo

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 1 slice green

`values/` (RgValue + RgRealm) and `semantics/` (RgMap/RgSet/RgArrayOps) form a
dependency-light interpreter value slice that proves D-IDENTITY without Three,
rendering, or the EVG/JSX stack. See each subfolder README. Adapter/engine work
(Phase 4) builds on this identity guarantee.
