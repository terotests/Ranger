# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values / NativeRef / identity (**storage** — tagged class) |
| `EvValue.rgr` | Target `shape EvValue` (all kinds defined) |
| `EvValueBridge.rgr` | Tagged ↔ shape bridge; **all** kind create/check APIs |
| `ComponentEngine.rgr` | Evaluator (creates/checks every kind through the bridge) |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan:** `PLAN_SHAPES.md` §7.5.

## Status

- **Staged copy** that is now the authoritative v2 TSX engine.
- **✅ E1/E2** — shape + primitive bridge beside the class.
- **✅ E3 (by-kind boundary)** — Hole, primitives, Element, Array/Object/Map/Set,
  and Function family create/check go through `EvValueBridge`. Array slots still
  store `class EvalValue` (needed for shared mutation / `===`). Bridge Array
  check is `isArrayValue` (a global `isArray` operator blocks `Class.isArray`).
  `EvalValue.fromInt` / `rawNumber` stay on the tagged class (int pool / mutate).
- **Step 4 ahead** — migrate storage to the shape, delete `valueType` wrappers,
  rename `EvValue` → `EvalValue` (~170 in-place mutators; separate cutover).

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvValue E1/E2/E3 fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts`
- `npm run test:tsengine` — native bench / multi-target engine gate
