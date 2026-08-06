# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvHandle.rgr` | Script values — class shell + **kind/`Array`/`Object` data SoT in `body:EvalValue`** |
| `EvalValue.rgr` | Target `shape EvalValue` (+ `EvPropertyBag` data helpers) |
| `EvValueBridge.rgr` | Create/check APIs; `fromTagged` → live `body`; `toTagged` → `fromBody` |
| `ComponentEngine.rgr` | Evaluator — no direct storage-field access |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan:** `PLAN_SHAPES.md` §7.5.

## Status

- **✅ E1/E2** — shape + primitive bridge beside the class.
- **✅ E3 (by-kind boundary)** — every kind's create/check through `EvValueBridge`.
- **✅ E4a (kind discriminant)** — `valueType` deleted; `EvHandle.body:EvalValue`.
- **✅ E4b (storage accessors)** — CE uses EvHandle accessors for arrays,
  property bags, proto, flags, functionNode, boundThis.
- **✅ E4c (storage SoT + rename)** — Array/Map/Set + Object own-data,
  accessors, attrs, proto and integrity live on `shape EvalValue`.
  Class renamed to `EvHandle`; shape renamed to `EvalValue`.
- **✅ E4d (Function/Element shell)** — `EvalPayload` deleted. Element and
  Function core/binding (incl. `functionNode`, `boundThis`) live on
  `body:EvalValue`. Thin shell left: scalar caches, `slotOwned`,
  `identityId` (Number `@(value)` blocks slotOwned / in-place number SoT).

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvalValue E1–E4c fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts`
- `npm run test:tsengine` — native bench / multi-target engine gate
