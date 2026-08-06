# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values — class shell + collection payloads; **kind in `body:EvValue`** |
| `EvValue.rgr` | Target `shape EvValue` (kind discriminant; full storage next) |
| `EvValueBridge.rgr` | Create/check APIs; `fromTagged` → live `body` |
| `ComponentEngine.rgr` | Evaluator (creates/checks through the bridge; kind via `is*`) |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan:** `PLAN_SHAPES.md` §7.5.

## Status

- **Staged copy** that is now the authoritative v2 TSX engine.
- **✅ E1/E2** — shape + primitive bridge beside the class.
- **✅ E3 (by-kind boundary)** — every kind's create/check through `EvValueBridge`.
- **✅ E4a (kind discriminant)** — `valueType` deleted; `EvalValue.body:EvValue`
  owns the kind. Hole is no longer conflated with Undefined via a shared int tag.
- **E4b ahead** — move `arrayValue` / `objectMap` / … onto the shape, migrate
  mutators, delete the class shell, rename `EvValue` → `EvalValue`.

## Unit / contract tests that gate this folder

- `tests/shapes.test.ts` — EvValue E1–E4 fixtures
- `npm run test:runtime` — `tests/runtime-conformance.test.ts`
- `npm run test:tsengine` — native bench / multi-target engine gate
