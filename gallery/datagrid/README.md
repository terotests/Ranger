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
npm run datagrid:xlsx:fixtures
npm run datagrid:bench -- 100000
npm run datagrid:oracle:dump
npm run datagrid:oracles
npm run datagrid:window
```

## What works (workbook viewer level)

- Multi-sheet workbook + tabs (hidden sheet metadata)
- styles.xml → fill / font / align / **XlsxNumberFormat** engine
- Freeze panes, merges (hit-test → origin), hidden rows/cols
- Formula bar; FormulaEngine (parse/deps/recalc) + FormulaFunctions library; cached `<v>` fallback
- Sort / filter via SheetView (programmatic + header indicator path)
- Ctrl+C/V TSV, fill-handle copy-fill
- Fixtures: `sales`, `formats`, `merged`, `formulas`, `business-workbook`, `sparse100k`
- Oracles: openpyxl semantic; LibreOffice visual when available

## Architecture invariant

`sheet size ≠ rendered cell count` — only the viewport (+ overscan) becomes EVG cmds.
