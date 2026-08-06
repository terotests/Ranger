# interp/migrate/src — staged TSX evaluator sources

**Copied from:** `gallery/pdf_writer/src/jsx/`:

| File | Role |
|------|------|
| `EvalValue.rgr` | Script values / NativeRef / identity (tagged class, live) |
| `EvValue.rgr` | E1/E2 target `shape EvValue` (beside the class; not wired yet) |
| `EvValueBridge.rgr` | E2 tagged → shape conversion for primitives / Hole |
| `ComponentEngine.rgr` | Evaluator |
| `JSXToEVG.rgr` | JSX → EVG (UI / EVG path) |

**Plan phase:** 1 (values/identity first), then 4 (adapter).

## Status

- **Staged copy.** Still coupled to `gallery/ts_parser/` and pdf_writer paths.
- Split into `interp/values/`, `interp/engine/`, `interp/semantics/` as Phase 1
  progresses — do not edit only the v1 originals for v2 work.

## Unit / contract tests that gate this folder

- `interp/semantics/tests` + `tests/contract/d_identity` (to be written against
  these sources or their split descendants)
