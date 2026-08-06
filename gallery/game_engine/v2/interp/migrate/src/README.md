# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values — class shell + **kind/`Array`/`Object` data SoT in `body:EvValue`** |
| `EvValue.rgr` | Target `shape EvValue` (+ `EvPropertyBag` data helpers) |
| `EvValueBridge.rgr` | Create/check APIs; `fromTagged` → live `body`; `toTagged` → `fromBody` |
| `ComponentEngine.rgr` | Evaluator — no direct storage-field access |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan:** `PLAN_SHAPES.md` §7.5.

## Status

- **✅ E1/E2** — shape + primitive bridge beside the class.
- **✅ E3 (by-kind boundary)** — every kind's create/check through `EvValueBridge`.
- **✅ E4a (kind discriminant)** — `valueType` deleted; `EvalValue.body:EvValue`.
- **✅ E4b (storage accessors)** — CE uses EvalValue accessors for arrays,
  property bags, proto, flags, functionNode, boundThis.
- **E4c in progress** — Array dense store on `body.Array.items`; Object
  own-data on `EvPropertyBag` Data slots; `EvValueHandles` preserves ref
  identity. Ahead: Map.entries / Set.items, accessors+attrs+proto, delete
  class shell, rename `EvValue` → `EvalValue`.

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvValue E1–E4c fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts`
- `npm run test:tsengine` — native bench / multi-target engine gate
