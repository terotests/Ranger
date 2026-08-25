---
title: Excel
description: The DataGrid spreadsheet viewer and editor. An .xlsx workbook becomes a virtualized grid, then an EVG display list. There is no published API yet.
---

The Excel gallery reads a `.xlsx` package, loads a workbook and a formula
engine, and paints a virtualized grid through
[EVG](/Ranger/office/reference/evg/). The grid owns geometry. EVG does not lay the
cells out with CSS.

There is **no published API** yet. There is no `gallery/datagrid/api/` facade
and no `@ranger/xlsx` package. This page names the demo, the source and how
the editor is reached.

```text
book.xlsx
     │
     ▼
 XlsxPackage / XlsxLoader
     │
     ▼
 WorkbookModel + FormulaEngine
     │
     ▼
 SheetView                 hidden, filter, sort
     │
     ▼
 DataGrid                  virtualized + freeze
     │
     ▼
 EVGDisplayList  →  WebGL / SoftCanvas / SDL2
```

A sheet of 100 000 rows cannot become one `EVGElement` per cell. The grid
emits draw commands for the viewport only.

## Demo

The spreadsheet is **not** on the GitHub Pages site yet. Build it locally:

```bash
npm run datagrid:web            # build gallery/datagrid/web/standalone/dist
npm run datagrid:web:serve      # serve it on :8000
npm run datagrid:web:test       # open it in headless Chrome
npm run datagrid:window         # rebuild and open the WebGL host
```

`datagrid:window` opens the default workbook
`gallery/datagrid/fixtures/business-workbook.xlsx`.

Native desktop (SDL2 + OpenGL):

```bash
npm run datagrid:sdl
./tmp/datagrid-sdl/datagrid_sdl gallery/datagrid/fixtures/business-workbook.xlsx
```

A database instead of a workbook:

```bash
npm run datagrid:db:window      # Ctrl+D the connection, Ctrl+Q the SQL box
```

## What it does

- Open and save `.xlsx`
- Formulas, including array formulas and dates
- Freeze, hide, filter, sort
- Charts on the sheet, drawn by Vela into the same display list
- Scripting: an EVG page tree on the sheet (see
  [`gallery/datagrid/docs/SCRIPTING.md`](https://github.com/terotests/Ranger/blob/master/gallery/datagrid/docs/SCRIPTING.md))
- A code editor painted through the display list
- Copy a chart or a selection into the Word viewer

Feature notes live in
[`gallery/datagrid/docs/FEATURES.md`](https://github.com/terotests/Ranger/blob/master/gallery/datagrid/docs/FEATURES.md).
The render peer is x-spreadsheet. The feature roadmap is grounded in
FortuneSheet.

## Tests

```bash
npm run datagrid:test
npm run datagrid:xlsx:test
npm run datagrid:formula:test
npm run datagrid:chart:test
npm run datagrid:parity
```

## Source

| Path | Role |
| --- | --- |
| [`gallery/datagrid/`](https://github.com/terotests/Ranger/tree/master/gallery/datagrid) | Grid, workbook, formulas, xlsx, web host |
| [`gallery/datagrid/docs/PLAN.md`](https://github.com/terotests/Ranger/blob/master/gallery/datagrid/docs/PLAN.md) | Design notes |
| [`gallery/office/`](https://github.com/terotests/Ranger/tree/master/gallery/office) | Shared fonts, theme colour, history |

A published facade, when it exists, will follow the PowerPoint pattern: a
headless workbook reader and writer, documented on this site from the
comments above the declarations.
