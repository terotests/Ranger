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
npm run datagrid:chart:test
npm run datagrid:export:test
npm run datagrid:workbook:test
npm run datagrid:formula:test
npm run datagrid:formula:array:test
npm run datagrid:date:test
npm run datagrid:formula:workbook:test
npm run datagrid:formula:bench
npm run datagrid:artifacts
npm run datagrid:xlsx:fixtures
npm run datagrid:bench -- 100000
npm run datagrid:oracle:dump
npm run datagrid:parity
npm run datagrid:oracles
npm run datagrid:window
# older tiny fixture:
# npm run datagrid:module && node gallery/datagrid/web/serve.mjs --open --xlsx gallery/datagrid/fixtures/sales.xlsx
```

`datagrid:window` rebuilds the module and opens the WebGL host. **Default workbook is
`business-workbook.xlsx`** (not the old `sales.xlsx`).

- Multi-sheet workbook + tabs (hidden sheet metadata)
- styles.xml → fill / font / align / **XlsxNumberFormat** engine
- **Cell borders**: all OOXML line styles per edge (solid, dashed, dotted,
  double, hair→thick) with colours; empty-but-formatted cells keep their fill
- **Fonts**: bold / italic / underline / strikethrough / size / colour, painted
  with the real Open Sans faces
- **Text layout**: `wrapText` → multi-line paint with row auto-fit, vertical
  alignment, and Excel's overflow rule — text spills into empty neighbours and
  is clipped once one is occupied
- **Format painter**: `Ctrl+Shift+C` arms a brush, the next selection takes the
  formatting only
- Freeze panes, merges (hit-test → origin), hidden rows/cols
- Formula bar; FormulaEngine (coerce, abs/rel/cross-sheet refs, fill-translate,
  incremental recalc) + FormulaFunctions; cached `<v>` fallback
- SheetView drives paint order; header popup for sort/filter
- Conditional formatting: colorScale + cellIs paint overlay
- **Charts from a selection**: eight Vega-Lite chart types through
  [Vela](../vela/README.md), floating in draggable, resizable windows
- **Find and replace** across values or formulas, one sheet or all
- **Disjoint selection** (Ctrl+click) and **drag-to-move** a range
- **Conditional formatting** read from the file *and* authored in a rule editor
- **Hyperlinks, notes and data validation**: read from the package, painted,
  enforced, and editable
- **.xlsx export**: `Ctrl+S`, round-tripped by our own loader and by openpyxl
- **~80 formula functions**, lookups over real rectangles, spilling array
  results, and dates as Excel stores them
- **Rich text**: several styles inside one cell, on one baseline
- **Images**: drawing anchors and media, painted on both backends
- **Text rotation**: OOXML `textRotation`, turned in the display list
- Tracked screenshots in `artifacts/` (PNG + JPEG)
- Sort / filter via SheetView (programmatic + header popup)
- Fixtures: `sales`, `formats`, `merged`, `formulas`, `business-workbook`,
  `sparse100k`, `styles-showcase` (FortuneSheet-shaped border/font/format matrix)
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
| Ctrl+click | Adds another rectangle to the selection; Delete and the format painter cover them all |
| Drag the selection's edge | Moves the block — a cut and a paste, so formulas move as written |
| Ctrl+Z / Ctrl+Y | One step per action — a 3×3 paste, a fill, or a range delete is a single undo |
| Row / column resize | Drag the header edge (9px grab zone), double-click it to auto-fit |

After any edit the app re-registers just the touched cells
(`FormulaEngine.syncCell`) and calls `recalcDirty()` **once**; it never
re-`attach`es the engine, which would drop the whole dependency graph.

### Column structure

| Action | Does |
| --- | --- |
| Header menu 8 / 9 | Insert a column left / right |
| Header menu 10 | Delete the column |
| Header menu 11 / 12 | Move the column left / right |
| `insertColumnLeftOfSelection` etc. | The same, driven from the selection |

Cells, formulas, style ids, widths, hidden flags and merges all move together —
anything left behind would surface as a value wearing someone else's
formatting. Formulas across the **whole workbook** are repaired, including
cross-sheet references naming the edited sheet: a reference at or past the
insert point shifts, and a reference *into* a deleted column becomes `#REF!`,
as Excel does.

Because a `#REF!` cannot be re-derived by shifting back, a structural op
snapshots every formula in the sheet, and undo restores that text wholesale. A
delete also keeps the removed column's values, formulas, style ids and width,
so one Ctrl+Z brings the column back intact.

### Row structure

The same machinery, transposed, and reached from the **row header**: click one
and its own menu opens.

| Row menu | Does |
| --- | --- |
| 1 | Select the row |
| 2 / 3 / 4 | Auto-fit height, taller (+10), shorter (−10) |
| 5 / 6 | Insert a row above / below |
| 7 | Delete the row |
| 8 / 9 | Move it up / down |

Everything the column ops guarantee holds for rows: heights and hidden flags
travel with the line, merges follow, formulas across the whole workbook are
repaired, a reference into a deleted row becomes `#REF!`, and one Ctrl+Z puts
the row back with its values, formulas, styles and height.

### Column and row sizing

| Gesture | Does |
| --- | --- |
| Drag a header edge | Resizes that column / row (grab zone is 9px wide) |
| Drag an edge inside a multi-column selection | Sizes **every** selected column to the same width, as Excel does |
| Double-click a column header or its edge | Auto-fits the width to the widest painted value |
| Header menu → 5 / 6 / 7 | Auto-fit, wider (+20), narrower (−20) — no pixel-precise dragging needed |

Auto-fit measures through `GridView.measureText`, the same renderer that paints
the cells, and scans the used range capped at 5000 rows so a 100k-row sheet
stays instant. Widths are clamped to 24–600px. A guide line follows the edge
while you drag.

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
| Ctrl+F / Ctrl+H | Find and replace | — |
| Ctrl+L | Conditional-formatting rule editor | — |
| Ctrl+K | Hyperlink on the active cell | — |
| Ctrl+E | Data-validation rule for the selection | — |
| Ctrl+S | Save the workbook as .xlsx | — |
| Ctrl+click a link | Follows it — the host is told the target | — |
| Ctrl+M | Chart the selection | — |
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
| `clipValues` + `clipFormulas` + `clipStyles` | the structured block | this grid, so paste can translate refs and keep formatting |

**Formatting travels by default.** Copy carries a resolved `CellStyle` per cell —
fill, borders, bold/italic/underline/strike, size, colour and number format — and
paste applies it, the way every spreadsheet behaves. Value, formula and format
land in one undo op (`SpreadsheetModel.applyEditStyled`), so a single Ctrl+Z puts
the previous formatting back. Styles are matched into the target sheet's style
table by value (`styleIdFor`), so a paste survives a hop between sheets.

`Ctrl+Shift+V` opens **Paste Special** to choose something other than the
default:

| Mode | Lands |
| --- | --- |
| All | values, formulas and formatting (the default) |
| Values only | values, no formulas, target formatting kept |
| Formats only | formatting only, the target's value stays |
| Values and formulas, no formats | both, target formatting kept |

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

## Dialogs

Paste Special is built on **[`EVGWindow`](../evg/EVGWindow.rgr)**, a small
window layer that paints into an `EVGDisplayList` rather than onto a canvas —
so the same dialogs work on SoftCanvas, WebGL and anything added later, and the
DOCX and PPTX hosts can use them as they are. It provides a draggable titled
panel, labels, buttons, radio groups, checkboxes and separators, with modal
input capture: while a modal window is up it swallows clicks meant for the
document behind it. Geometry is all integers, so behaviour is unit-testable
without rendering.

The same class is also the **sticky panel** the charts float in — a non-modal
window with a close box, a resize grip and one *content region* the owner
paints itself. Non-modal is the whole difference: a floating chart owns only
the pixels it covers, so clicking the sheet beside it still selects a cell.

The host stays in charge: it passes the `UITextRenderer` it already has,
forwards the pointer and keys it already receives, and appends the window's
commands to its own display list.

**A button row is fitted to the panel, not assumed to fit it.** Buttons prefer
92 pixels, shrink towards a legible minimum when there are more of them than
there is room for, and wrap onto another row rather than overflow — four
buttons in a 340-wide dialog used to lay the first one out at `x = -66`,
hanging off the panel and over the sheet behind it. `GridEditTest` now asserts
the invariant that broke: every control of every dialog is inside its own
panel.

## Find and replace

`Ctrl+F` (or `Ctrl+H`) opens it. The dialog has real text fields — the window
layer grew a one-line input control for this, with a caret, Tab between fields
and the keyboard captured while it is up.

| Option | Means |
| --- | --- |
| Match case | `Alpha` no longer matches `alpha` |
| Entire cell | The cell must be exactly the search text, not merely contain it |
| Search formulas | Look at `=A1+B1` rather than at the `5` it shows |
| All sheets | Carry on into the next sheet, and switch to it on a hit |

*Find next* walks row-major from the active cell and wraps. *Replace* changes
the cell it is on and moves to the next; *Replace all* runs the whole scan
inside one transaction, so the batch is a single Ctrl+Z. A hit inside a formula
is written back to the formula and recalculates.

## Conditional formatting

Rules read from a workbook are painted — colour scales and `cellIs` — and
`Ctrl+L` now writes them too: pick a test (greater than, less than, equal to,
between, or a colour scale over the range), a number, and a fill, and the rule
applies to the selection. *Clear* drops the rules that start inside it.

Rules are sheet metadata rather than cell contents, so they are deliberately
**not** on the undo stack: undoing a paste must not silently drop a rule the
paste never touched.

## Images

A picture in a spreadsheet is not *in* a cell; it floats over one, anchored by a
cell plus an offset, and either stretched to a second cell or pinned at its own
size. That is why the geometry is stored as `(cell, offset)` rather than as
pixels — widen a column the picture spans and the picture widens with it.

Finding one takes three hops, each of which can be missing: the sheet points at
a **drawing** part, the drawing names a **relationship**, the relationship names
the **media** file. The bytes are taken while the package is open, because it is
closed before the first paint.

| Backend | How it draws them |
| --- | --- |
| SoftCanvas | decoded once per part (PNG or JPEG) and blitted, scaled nearest-neighbour, alpha respected |
| WebGL | an `IMAGE` command names the part; the host serves it at `/media/<part>` and the renderer textures it |

Nearest neighbour is deliberate: a spreadsheet's pictures are logos and diagrams
shown near their own size, and a blur would be worse than a stairstep. A picture
that cannot be decoded is drawn as its own outline with the reason in it, rather
than as nothing at all.

## Rich text

A cell's style says how the cell is drawn; **rich text** says how parts of it
are — `Total:` in bold red, the number plain, the unit smaller and italic.
OOXML calls the pieces *runs*, and they are read, painted and written back.

The runs live beside the cell's value, not inside it, for the same reason notes
and links do: the value is what formulas read and what a paste carries, so it
stays a plain string that everything already understands. Runs of different
sizes sit on **one baseline**, which is what makes a smaller suffix look
attached to the word before it rather than floating above it.

Retyping a cell drops its runs — a spreadsheet does the same, because there is
no answer to which run the new text belongs to.

## Links, notes and validation

Three things a cell can carry that are not its value. All three come out of the
package — a hyperlink's target from the sheet's *relationships*, a note from the
*comments* part the relationships point at, a rule from `dataValidation` — and
all three are editable here.

| | Read from | Shown as | Edited with |
| --- | --- | --- | --- |
| Hyperlink | `<hyperlinks>` + `_rels` | link colour, underlined | `Ctrl+K` |
| Note | `xl/comments1.xml` | corner mark; opened for the active cell | — |
| Validation | `<dataValidation>` | list arrow on the active cell | `Ctrl+E` |

**A rule is asked before the value is written**, not after: a refusal has to
leave the cell as it was, and writing then rolling back would let a dependent
formula see the bad value first. List rules also know their choices, so the
cell offers a picker rather than making you remember them.

All three are **metadata, not cell content**, so they are deliberately off the
undo stack — undoing a paste must not drop the note that was pinned to the cell
before it.

## Formulas

~80 functions, an AST with a dependency graph, and incremental recalculation.
Beyond the arithmetic, string and logic families, the notable ones are:

| Family | Functions |
| --- | --- |
| Lookup | `VLOOKUP` `HLOOKUP` `INDEX` `MATCH` `TRANSPOSE` `SUMPRODUCT` |
| Conditional | `COUNTIF` `SUMIF` `AVERAGEIF` `COUNTBLANK` |
| Dates | `DATE` `YEAR` `MONTH` `DAY` `WEEKDAY` `EDATE` `EOMONTH` `DAYS` `DATEVALUE` `TODAY` `NOW` |
| Statistics | `MEDIAN` `LARGE` `SMALL` `ROUNDUP` `ROUNDDOWN` `TRUNC` |
| Text | `SUBSTITUTE` `FIND` `SEARCH` `REPT` `PROPER` `EXACT` `CHAR` `CODE` `TEXT` |

### A range keeps its shape

A range used to be flattened into a list of arguments the moment it reached a
function, which is why the lookups could not exist: `VLOOKUP` reads *down* a
column and *across* a row, and a list has neither. A range now evaluates to a
**rectangle** — a `FormulaValue` that knows its own rows and columns — and three
things follow:

1. **Lookups work**, because they can ask where they are.
2. **Arithmetic spreads over it**: `=B1:B3*C1:C3` is three products, and a
   single operand broadcasts (`=B1:B3*2`).
3. **An array answer spills.** The top-left lands in the cell holding the
   formula and the rest fills the block below and to the right, as a modern
   spreadsheet does. The block is remembered, so a formula that shrinks takes
   its old tail back; a spill that would land on someone's data refuses with
   `#SPILL!` instead of eating it.

Functions that only ever wanted values keep working: the helpers that walk
arguments open a rectangle out on the way past.

### Dates

A spreadsheet has no date type — it has **numbers with a format**, and every
date feature is arithmetic on a day count. Type `2024-03-15`, `15.3.2024` or
`3/15/2024` and the cell stores `45366` wearing the format that draws it back
the way you typed it.

The epoch is Excel's, including the 29th of February 1900 — a date that never
happened, which Lotus 1-2-3 got wrong and Excel copied for compatibility.
`DateTest` checks day 1, day 59 and day 61 against Excel's own answers, because
getting that backwards shifts every date before March 1900 by one and nothing
else.

`TODAY()` and `NOW()` are not pure functions: they read a clock this layer does
not have. The **host sets one** (`GridApp.setToday`), which is also what makes
them testable — a test says what today is instead of hoping the suite does not
run over midnight. Unset, they answer `#N/A` rather than inventing a date.

## Saving

`Ctrl+S` writes the workbook back out as **.xlsx**, beside the file it came
from and under a name that cannot overwrite it (`sales.xlsx` →
`sales-export.xlsx`). `GridApp.saveXlsx(dir name)` puts it wherever you like.

The writer and the loader share one model, so a round trip is a test rather
than a hope — and `npm run datagrid:export:test` runs both halves of it:

1. **Ours**: build a workbook, write it, load it back with the ordinary loader,
   compare everything (48 checks).
2. **Theirs**: `tools/check_export.py` reads the same file with **openpyxl**,
   a library that has never seen our model (29 checks). Two halves of one
   codebase can share a misunderstanding; an outside reader cannot join in.

| Survives the trip | Not written yet |
| --- | --- |
| values, formulas (with cached results), styles — font, fill, borders, alignment, wrap, rotation, number formats | cell comments |
| column widths, row heights, hidden rows and columns | conditional-formatting rules |
| merges, freeze panes, sheet names and hidden sheets | charts and images |
| hyperlinks (external via relationships, internal by location), data validation rules | |

Two decisions worth knowing: strings go out **inline** rather than through a
shared-string table (a shared table is a size optimisation whose only failure
mode is an index pointing at the wrong string), and entries are **stored**
rather than deflated, which the OPC specification allows and every reader
accepts.

Fixing this turned up a bug in the shared zip writer: `CRC32` masked its
running value to 24 bits and let JavaScript's signed bitwise operators keep the
result negative, so **every archive the repository has ever written had wrong
CRCs**. Our own reader ignores CRCs and never noticed; Python's `zipfile`
refuses the file outright. The same bug lived in a second copy of `CRC32.rgr`
under `game_engine`, and both are fixed.

## Charts

Select cells, press **Ctrl+M** (or click **+ Chart** on the status bar), and the
picker opens on that range. Pick a type and a style, and the chart appears in a
window floating over the sheet that you can drag, resize, and reopen for
editing.

Nothing about the drawing is stored. A chart *is* its range: `GridChart` holds
the rectangle, the kind, the style, the two header flags and the window box, and
the picture is recomputed from the cells. Edit a number the chart reads and the
chart follows on the next frame.

| Step | Where |
| --- | --- |
| cells → Vega-Lite JSON | `GridChart.rgr` (`ChartData.specJson`) |
| Vega-Lite → Vega → scene → draw commands | [Vela](../vela/README.md), unchanged |
| draw commands → `EVGDrawCmd` | [`VlEvgList.rgr`](../vela/src/VlEvgList.rgr) |
| the window, the drag, the resize | [`EVGWindow`](../evg/EVGWindow.rgr) |

Only the first arrow is new. Everything below it is Vela's, which is checked
against the official Vega implementation by its own corpus, so a bar here is
the bar the reference draws.

### What the picker offers

Eight types — column, bar, stacked column, line, area, scatter, pie, donut — and
four styles (Vela light, Slate dark, Mono, Bold), which are `config` blocks: the
same marks, painted differently.

**A type that would not work is greyed out rather than hidden**, because
"a pie is possible, but not of two series" is worth more than a shorter list:

| Type | Needs |
| --- | --- |
| Stacked column | two or more series |
| Line, area | two or more categories |
| Scatter | a numeric first column |
| Pie, donut | exactly one series, two or more categories |

The picker opens on the type the data suggests, with the headers already
guessed: a top row of words over a column of numbers is a header row, not data.
A single selected cell charts the **block around it**, as Excel assumes too —
nobody charts one number.

Numbers are read strictly: `2024-01-01` and `14.00%` are *not* numbers, which
matters because the platform's own `to_double` reads them as `2024` and `14`.
A column of dates charted as six equal values of 2024 is how that was found.

### The window

| Gesture | Does |
| --- | --- |
| Drag the title bar | Moves the chart; the chart remembers where it was left |
| Drag the bottom-right grip | Resizes it, and the chart redraws to fit |
| **Edit…** | Reopens the picker on that chart — change type, style or headers |
| The box in the title bar | Removes the chart |

Charts belong to a sheet: switch sheets and the ones reading another sheet hide
rather than draw over the wrong numbers.

### Fitting

A Vega view is bigger than its plot — the axes and legend grow it by whatever
they turn out to need, which is not known until the labels exist. So the spec is
run once to measure that, run again with the plot shrunk by exactly that much,
and only scaled if it still does not fit. The usual result is 1:1, so the text
is crisp rather than resampled. Compiling is cached by specification text and
box size, which is why dragging a chart costs nothing and editing a cell it
reads costs one recompute.

## Parity score

`npm run datagrid:parity` scores [`docs/PARITY.md`](docs/PARITY.md) — one row per
capability **FortuneSheet documents for itself** (its README Features section
and the completed items on its roadmap), so the number measures the benchmark
rather than our own wish list. `done` counts 1, `partial` 0.5, `todo` 0.

```
TOTAL   38.5 / 41   93.9%     done 38   partial 1   todo 2
```

`-- --todo` lists what is missing; `-- --check 60` fails below a threshold, so
the score can gate CI once it is where you want it. What is left is rich text
inside a cell, images, and the collaborative features — cooperative editing and
mobile adaptation — plus array formulas and a plugin surface.

## Architecture invariant

`sheet size ≠ rendered cell count` — only the viewport (+ overscan) becomes EVG cmds.
