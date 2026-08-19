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
npm run datagrid:edit:test
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
- Fixtures: `sales`, `formats`, `merged`, `formulas`, `business-workbook`, `sparse100k`
- Oracles: openpyxl semantic; LibreOffice visual + formula CSV when available
- Bench: `datagrid:bench`, `datagrid:formula:bench`

## Editing

The grid is an editor, not just a viewer. Every mutation goes through
`SpreadsheetModel.applyEdit(row col value formula)`, which records **value and
formula together** in one undo op, and every batch runs inside
`beginTx` / `endTx` so it undoes as one Excel-style action.

| Action | Behaviour |
| --- | --- |
| Type / Enter / Esc | Inline edit + formula bar share one buffer |
| Caret | ← → Home End, Backspace and Delete edit at the caret, not just the tail |
| Ctrl+C / Ctrl+V | Copy carries formulas; paste re-bases relative refs (`=A1+B1` → `=A2+B2`), absolute refs stay |
| Ctrl+X | Cut + paste moves formulas **as written** (no ref translation) |
| Delete | Clears value *and* formula over the range, then recalculates dependents |
| Fill handle | Tiles the source rect, translating relative refs |
| Ctrl+Z / Ctrl+Y | One step per action — a 3×3 paste, a fill, or a range delete is a single undo |
| Row / column resize | Drag the header edge (`hitRowResize` / `hitColResize`) |

After any edit the app re-registers just the touched cells
(`FormulaEngine.syncCell`) and calls `recalcDirty()` **once**; it never
re-`attach`es the engine, which would drop the whole dependency graph.

## Keyboard

Excel key semantics, resolved in `GridApp.handleKey` from a portable `UIInput`
snapshot — no DOM or SDL below the app.

| Key | Not editing | Editing |
| --- | --- | --- |
| ← ↑ → ↓ | Move one cell | Move the caret (← →) |
| Ctrl + arrow | Jump to the edge of the data block | — |
| Shift + arrow | Extend the selection | — |
| Ctrl+Shift + arrow | Extend to the data-block edge | — |
| Enter / Shift+Enter | Step down / up | Commit, then step down / up |
| Tab / Shift+Tab | Step right / left | Commit, then step right / left |
| F2 | Open the cell for edit, caret at end | — |
| PageUp / PageDown | Move one viewport (Shift extends) | — |
| Home / Ctrl+Home | First column of the row / A1 | Caret to start |
| End / Ctrl+End | Last used column of the row / bottom-right of the used range | Caret to end |
| Ctrl+Space / Shift+Space | Select the column / the row | — |
| Ctrl+Shift+Space, Ctrl+A | Select the whole sheet | — |
| ↓ / → past the last row / column | Grows the sheet, as Excel's unbounded grid does | — |
| Delete | Clear the selection | Delete at the caret |
| Backspace | Clear the cell and start typing | Backspace at the caret |
| Esc | Collapse the selection | Cancel the edit |

A loaded sheet is only as big as its used range, so the caret grows it on
demand (`GridApp.ensureExtent` → `SpreadsheetModel.growTo`, bounded by Excel's
1048576×16384). `growTo` only ever grows and preserves row heights and column
widths — `resize` clears them, so it must never be used to extend a loaded
workbook. Paste grows the sheet the same way.

`Ctrl+End` is O(1): `SpreadsheetModel` tracks the used-range corner as cells are
written rather than rescanning a sheet that may declare 100k rows (see
`Ctrl+End + paint` in `npm run datagrid:bench -- 100000`).

### Clipboard

`Ctrl+C` / `Ctrl+X` build three views of the selection:

| | What it is | Who reads it |
| --- | --- | --- |
| `clipboardTsv` | tab/newline text | any app, and the TSV paste path |
| `clipboardHtml` | an HTML `<table>` with fill / bold / align per cell | Word, and the Ranger DOCX editor |
| `clipValues` + `clipFormulas` | the structured block | this grid, so paste can translate refs |

In the WebGL host the first two reach the **OS clipboard** as `text/plain` and
`text/html` — the same two flavours Excel offers. `/input` answers a copy or cut
with `{"clipboard": …, "clipboardHtml": …}` and `web/client.mjs` writes both via
`ClipboardItem`, degrading to `writeText` and then to a hidden textarea +
`execCommand` on non-secure origins. Pasting goes the other way through the
browser's native `paste` event, so no clipboard-read permission is needed. The
host remembers the text it exported: paste it back and the formula-aware block
paste still runs; paste anything else and it lands as plain TSV values.

Because the HTML flavour is a real table, a range copied here pastes into Word —
or into this gallery's own [DOCX editor](../docx_viewer/README.md#paste) — as a
table, not as tab-separated text.

Known gaps: cut does not rewrite formulas elsewhere that referenced the moved
cells; paste does not tile into a larger target range; no cell-style clipboard.

## Architecture invariant

`sheet size ≠ rendered cell count` — only the viewport (+ overscan) becomes EVG cmds.
