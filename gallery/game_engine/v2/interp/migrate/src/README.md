# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values / NativeRef / identity (tagged class, live storage) |
| `EvValue.rgr` | Target `shape EvValue` (E1–E3; Hole wired into the engine) |
| `EvValueBridge.rgr` | Tagged ↔ shape bridge; Hole engine API (`taggedHole` / `isHole`) |
| `ComponentEngine.rgr` | Evaluator (Hole creation/checks go through the bridge) |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan phase:** 1 (values/identity first), then 4 (adapter). See `PLAN_SHAPES.md` §7.5.

## Status

- **Staged copy** that is now the authoritative v2 TSX engine.
- **E1/E2 done** — shape + primitive bridge beside the class.
- **E3 in progress** — Hole and primitive kinds are shape-owned at the
  ComponentEngine boundary (`EvValueBridge.taggedHole` / `taggedNumber` / …).
  Array slots still store `class EvalValue`. Next: Element, then property carriers.
- Split into `interp/values/`, `interp/engine/`, `interp/semantics/` as Phase 1
  progresses — do not edit only the v1 originals for v2 work.

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvValue E1/E2/E3 fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts` (holes / elision)
- `npm run test:tsengine` — native bench / multi-target engine gate
