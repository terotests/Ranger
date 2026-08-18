# EVG DataGrid / spreadsheet (Ranger prototype)

A **100% Ranger** Excel-style grid that owns geometry and virtualization in a
specialized `DataGrid` layout engine, then paints **only visible cells** through
the existing **EVG display-list → SoftCanvas / WebGL** stack — the same editor
architecture as [`gallery/text_editor`](../text_editor/README.md).

```text
FortuneSheet / x-spreadsheet          this prototype
JS spreadsheet model           →      SpreadsheetModel (sparse cells)
Canvas / DOM grid              →      DataGrid (scroll + hit-test + prefixes)
browser                        →      Node tests / WebGL host (SDL later)
```

**Not** CSS `display:grid` and **not** one EVG/View node per cell. A 100k-row
sheet still only emits ~viewport cells to EVG.

## Layout

```text
gallery/datagrid/
  src/           SpreadsheetModel, GridSelection, DataGrid, GridView, GridApp, demo
  tests/         GridTest.rgr
  bench/         grid_bench.rgr
  docs/PLAN.md   architecture + FortuneSheet / x-spreadsheet roadmap
  web/           interactive Chrome host (EVGDisplayList → WebGL)
```

## Run (JavaScript target)

From the repo root:

```bash
npm run datagrid:test
npm run datagrid:demo
npm run datagrid:bench
npm run datagrid:bench -- 100000
npm run datagrid:window
npm run datagrid:window:smoke
```

### Interactive window (WebGL)

```text
INPUT   browser events → POST /input → UIInput → GridApp (Node)
RENDER  GridApp.sceneJson() → EVGDisplayList → evg-webgl.js (WebGL 2)
```

## What works now (MVP)

- Sparse `SpreadsheetModel` (cells / row heights / column widths / undo)
- Prefix-sum geometry + binary-search `yToRow` / `xToCol`
- Viewport virtualization (`firstVisible*` … `lastVisible*`)
- Batched EVG paint: fills, text, 1px grid lines, selection overlay, active border
- Single inline editor + formula bar (shared edit buffer)
- Keyboard navigation, shift-range select, Ctrl+A / Z / Y
- Column resize via header edge drag
- SoftCanvas tests + WebGL present host

## Deliberately not in this PR

Formulas, merge cells, freeze panes, fill handle, text wrapping, conditional
formatting, clipboard, charts, collaboration. Feature ceiling target is
[FortuneSheet](https://github.com/ruilisi/fortune-sheet); canvas render peer is
[x-spreadsheet](https://github.com/myliang/x-spreadsheet). See `docs/PLAN.md`.
