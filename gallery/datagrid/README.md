# EVG DataGrid / spreadsheet (Ranger workbook viewer)

A **100% Ranger** Excel-like workbook viewer: specialized `DataGrid` virtualization
→ batched **EVG** display list → SoftCanvas / WebGL. Feature roadmap is grounded in
**FortuneSheet**; render peer is **x-spreadsheet**. See [`docs/FEATURES.md`](docs/FEATURES.md).

```text
book.xlsx
   ↓
XlsxPackage (ZipReader)
   ↓
XlsxLoader → WorkbookModel + FormulaEngine
   ↓
SheetView (hidden / filter / sort)
   ↓
DataGrid (virtualized + freeze)
   ↓
EVGDisplayList → SoftCanvas / WebGL
```

## Run

```bash
npm run datagrid:test
npm run datagrid:xlsx:test
npm run datagrid:workbook:test
npm run datagrid:formula:test
npm run datagrid:formula:workbook:test
npm run datagrid:formula:bench
npm run datagrid:artifacts
npm run datagrid:xlsx:fixtures
npm run datagrid:bench -- 100000
npm run datagrid:oracle:dump
npm run datagrid:oracles
npm run datagrid:window
# older tiny fixture:
# npm run datagrid:module && node gallery/datagrid/web/serve.mjs --open --xlsx gallery/datagrid/fixtures/sales.xlsx
```

`datagrid:window` rebuilds the module and opens the WebGL host. **Default workbook is
`business-workbook.xlsx`** (not the old `sales.xlsx`).

- Multi-sheet workbook + tabs (hidden sheet metadata)
- styles.xml → fill / font / align / **XlsxNumberFormat** engine
- Freeze panes, merges (hit-test → origin), hidden rows/cols
- Formula bar; FormulaEngine (coerce, abs/rel/cross-sheet refs, fill-translate,
  incremental recalc) + FormulaFunctions; cached `<v>` fallback
- SheetView drives paint order; header popup for sort/filter
- Conditional formatting: colorScale + cellIs paint overlay
- Tracked screenshots in `artifacts/` (PNG + JPEG)
- Sort / filter via SheetView (programmatic + header popup)
- Ctrl+C/V TSV, fill-handle copy-fill (formula-aware translate)
- Fixtures: `sales`, `formats`, `merged`, `formulas`, `business-workbook`, `sparse100k`
- Oracles: openpyxl semantic; LibreOffice visual + formula CSV when available
- Bench: `datagrid:bench`, `datagrid:formula:bench`

## Architecture invariant

`sheet size ≠ rendered cell count` — only the viewport (+ overscan) becomes EVG cmds.
