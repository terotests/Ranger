# interp/migrate — port notes from pdf_writer

**Staged sources:** [`src/`](./src/) — `EvHandle.rgr` (thin class),
`EvalValue.rgr` (shape), `ComponentEngine.rgr`, `JSXToEVG.rgr` (from
`gallery/pdf_writer/src/jsx/`).

**Plan phase:** 1 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## To implement

- Split staged files into `interp/values/`, `interp/engine/`, `interp/semantics/`
- Keep `gallery/ts_parser/` shared until a later extract
- [x] Land `component_engine_js_semantics_test` under `semantics/tests/` —
  done; `EvalValue` now carries an immutable `identityId` and `equals()`
  compares it for references (D-IDENTITY on the real engine)

## Notes

- v1 originals remain; edit the v2 copies (or their split descendants) for v2 work
- JSX→EVG pairs with `v2/evg/` for UI paths

## Unit / contract tests that gate this folder

- D-IDENTITY suite (`tests/contract/d_identity`)
- Adapter construct path once Phase 4 opens

---

*Staged copy present; live wiring is Phase 1+.*
