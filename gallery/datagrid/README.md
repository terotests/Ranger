# EVG DataGrid / spreadsheet (Ranger prototype)

A **100% Ranger** Excel-style grid that owns geometry and virtualization in a
specialized `DataGrid` layout engine, then paints **only visible cells** through
the existing **EVG display-list → SoftCanvas / WebGL** stack — the same editor
architecture as [`gallery/text_editor`](../text_editor/README.md).

Feature checklist is grounded in **FortuneSheet** (OSS spreadsheet ops);
render path peers with **x-spreadsheet** (Canvas virtualization). See
[`docs/FEATURES.md`](docs/FEATURES.md).

Also an **`.xlsx` viewer**: ZIP (`gallery/zip`) → SpreadsheetML parse →
`WorkbookModel` / `SpreadsheetModel` → DataGrid. Formula engine is not required
for viewing — cached `<v>` results are shown; the formula bar shows `=<f>`.

```text
book.xlsx
   ↓
XlsxPackage (ZipReader)
   ↓
XlsxLoader → WorkbookModel
   ↓
DataGrid (virtualized + freeze bands)
   ↓
EVGDisplayList → SoftCanvas / WebGL
```

## Layout

```text
gallery/datagrid/
  src/           SpreadsheetModel, WorkbookModel, DataGrid, GridView, GridApp
  src/xlsx/      Package, Workbook, SharedStrings, Worksheet, Styles, Loader
  fixtures/      sales.xlsx (styles + freeze), sparse500.xlsx
  tests/         GridTest.rgr, XlsxTest.rgr
  bench/         grid_bench.rgr
  docs/          PLAN.md, FEATURES.md
  web/           Chrome host (loads fixtures/sales.xlsx)
```

## Run (JavaScript target)

```bash
npm run datagrid:test
npm run datagrid:xlsx:test
npm run datagrid:xlsx:demo      # PNG snapshots of loaded .xlsx
npm run datagrid:bench -- 10000
npm run datagrid:window         # WebGL viewer of sales.xlsx
npm run datagrid:xlsx:fixtures  # regenerate fixtures/*.xlsx
```

## XLSX viewer (through Milestone 3)

- workbook + multiple sheets (tabs)
- shared strings, inline strings, numbers, booleans
- formulas: display cached value; formula bar shows `=…`
- column widths / row heights
- merged cells
- sparse sheets (empty cells not allocated)
- **styles.xml** → fill / font color / bold / align / basic numFmt
- **freeze panes** (`sheetViews` pane xSplit/ySplit) + fixed bands while scrolling
- **copy / paste** (Ctrl+C / Ctrl+V TSV) and **fill handle** (drag copy-fill)

Not yet: full formula engine, charts, `.xls`, write-back, sort/filter, wrap.

## What else works

Cell selection, keyboard nav, inline edit, column resize, scroll virtualization,
SoftCanvas tests, WebGL present host.
