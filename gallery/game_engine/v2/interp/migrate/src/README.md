# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values — class shell holds collection SoT; **kind in `body:EvValue`**; storage via accessors |
| `EvValue.rgr` | Target `shape EvValue` (kind + future storage) |
| `EvValueBridge.rgr` | Create/check APIs; `fromTagged` → live `body` |
| `ComponentEngine.rgr` | Evaluator — no direct storage-field access |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan:** `PLAN_SHAPES.md` §7.5.

## Status

- **✅ E1/E2** — shape + primitive bridge beside the class.
- **✅ E3 (by-kind boundary)** — every kind's create/check through `EvValueBridge`.
- **✅ E4a (kind discriminant)** — `valueType` deleted; `EvalValue.body:EvValue`.
- **✅ E4b (storage accessors)** — CE uses EvalValue accessors for arrays,
  property bags, proto, flags, functionNode, boundThis. Class remains SoT.
- **E4c ahead** — move SoT onto the shape (`EvPropertyBag` / `Array.items` /
  `Map.entries`), delete the class shell, rename `EvValue` → `EvalValue`.

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvValue E1–E4b fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts`
- `npm run test:tsengine` — native bench / multi-target engine gate
