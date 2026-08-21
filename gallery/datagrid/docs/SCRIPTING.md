# Scripting the workbook

A script in this editor is JavaScript/TSX. It **reads the workbook** through a
handful of functions, and it **returns a document** — not cells, not a string,
but an EVG page tree. The editor draws that tree on the sheet's own canvas as a
preview, and the exporter writes the same tree as a PDF.

```text
ranger/summary.tsx  ─┐
                     ├─►  ComponentEngine  ──►  EVG element tree
workbook / database ─┘    (the JS/TSX             │
                           interpreter)     ┌─────┴─────┐
                                            ▼           ▼
                                       EVGLayout    EVGPDFRenderer
                                       EVGDisplayList     │
                                            │             ▼
                                       preview on     report.pdf
                                       the canvas
```

Nothing in that picture is new: `ComponentEngine` is the TypeScript interpreter
from [`gallery/pdf_writer/src/jsx`](../../pdf_writer/src/jsx), EVG is the same
layout engine the grid itself paints through, and `EVGPDFRenderer` is the same
PDF writer the `evg-pdf` tool uses. The scripting layer is the four files in
[`src/script/`](../src/script) that join them to a spreadsheet.

## The script lives in the .xlsx

An `.xlsx` is a ZIP/OPC package, and OPC allows parts that only the authoring
application understands. So a script is not a sidecar file that goes missing
when the workbook is mailed on — it is **inside the workbook**:

```text
report.xlsx
  [Content_Types].xml      <Default Extension="tsx" ContentType="text/plain"/>
  xl/…                     the spreadsheet, unchanged
  ranger/summary.tsx       the script
```

`XlsxLoader` reads every `ranger/*.tsx` and `ranger/*.js` part into
`WorkbookModel.scripts`; `XlsxWriter` writes them back. Save, mail, reopen: the
report is still there. Two things are worth knowing:

- **Excel opens the file normally** and ignores the part. It is not a macro,
  nothing runs, and no security prompt appears — this is not `.xlsm`.
- **If Excel saves the file, the part is gone.** Excel rewrites the package and
  keeps only what it knows. A round trip through this editor keeps it; a round
  trip through Excel does not.

## Running one

| Command | Key | What it does |
| --- | --- | --- |
| `script.run` | Ctrl+R | Run the current script and open the preview |
| `script.open` (arg: name) | | Run a named script |
| `script.next` | | Cycle to the next script in the workbook |
| `script.new` (arg: name) | | Write a starter report for this sheet, and run it |
| `script.close` | Esc | Close the preview |
| `script.page.next` / `.prev` | PgDn / PgUp | Page through the report |
| `script.zoom.in` / `.out` / `.fit` | + / - / 0 | Zoom |
| `script.export.pdf` | Ctrl+P | Re-run and write the PDF |

The toolbar's last button runs the current script. While the preview is open it
owns the keyboard — arrow keys page the report rather than scrolling a sheet
nobody can see — but the toolbar and the sheet tabs still work.

The export always **re-runs the script**. A report is a picture of the numbers
as they are, and exporting the preview's cached pages would quietly print the
numbers as they were.

## What a script can call

Every function below is a plain global inside the script.

| Call | Returns |
| --- | --- |
| `sheetNames()` | every sheet name, in workbook order |
| `sheetCount()` | how many sheets |
| `sheetRows(name)` | the used rectangle of a sheet as `any[][]` — numbers as numbers |
| `sheetRows(name, limit)` | …at most `limit` rows |
| `sheetText(name)` | the same, as the strings the grid **displays** (number formats applied) |
| `usedRows(name)` / `usedCols(name)` | the extent of the data |
| `cell(ref)` / `cell(sheet, ref)` | one cell: `cell("Sales!B5")`, `cell("Sales", "B5")` |
| `text(ref)` | one cell as displayed |
| `range(ref)` / `range(sheet, ref)` | a rectangle: `range("Sales!B2:D13")` |
| `rangeText(ref)` | the same, as displayed strings |
| `query(sql)` | rows from the bound database, first row = column names |
| `hasDatabase()` | whether a database is bound at all |
| `formatNumber(value, code)` | the workbook's own formatter: `formatNumber(x, "#,##0.00")` |
| `param(key)` | host facts: `sheet`, `workbook`, `script` |
| `log(message)` | a line back to the run's messages |

A cell that holds a formula gives its **computed** value: the script sees what
the grid shows, because it reads the same model after the same recalculation.

`sheetRows` returns numbers where the sheet holds numbers, which is what you
want for arithmetic; `sheetText` returns `$1,430.00` where the cell is
formatted that way, which is what you want for printing. Reports normally use
`sheetText` for tables and `sheetRows` for sums.

Both are capped — 20 000 rows and 256 columns per call — so a script over a
100 000-row sheet fails to print everything rather than hanging the editor.

## Databases

A database-backed sheet is a **sheet**: the database layer loads query results
into a `SpreadsheetModel`, so `sheetRows("Orders")` reads it exactly like an
`.xlsx` one and the same report prints either.

`query()` is for the other case — a report that runs its own SQL. It is a seam,
not an engine:

```ranger
class MyQuery {
    Extends(GridScriptQuery)
    fn available:boolean () { return true }
    fn run:[[string]] (sql:string) { …driver… }   ; first row = column names
}
app.scriptEngine.setQuery((new MyQuery))
```

With nothing bound, `query()` returns no rows and puts *"no database is bound to
this workbook"* into the run's messages — the report still prints.

## Writing the document

The tags are EVG's, the same ones the PDF gallery uses:

```tsx
<Print>                     the document
  <Section>                 sheet size and margin
    <Page>                  one printed page
      <View>                a box: flexDirection, padding, backgroundColor…
        <Label>             text
```

Pagination is **explicit**: a `<Page>` is a page, and a script that wants 200
rows over seven pages emits seven `<Page>` elements (the starter script shows
the loop). Content that overflows its page is clipped in the preview, because
that is what the PDF does with it.

Two layout rules save most of the trouble:

- **A `View` is a row unless told otherwise.** Text blocks belong in
  `flexDirection='column'`; an auto-width `Label` in a row gets a narrow box
  and wraps.
- **Percentage columns should not add up to exactly 100.** The row's own
  padding is added to them, and the last column wraps to a second line. The
  starter script divides 96 rather than 100.

## Preview and PDF are the same run

The preview is not a drawing of the report. `ScriptPreview` takes the page's
own `EVGDisplayList` — built by the same code that feeds the WebGL and SDL
backends — and copies it into the grid's list with a scale and an offset. So
gradients, rounded boxes and vector paths appear on screen without anyone
teaching the preview about them, and the page you see is the page that prints.

Both paths measure with the **same fonts**: `GridApp.init(fontDir)` hands its
own font directory to the script engine, so the widths that laid out the
preview are the widths the PDF embeds. Without any font files both fall back to
estimated widths — together, still agreeing with each other.

## Cost

The editor now carries a JavaScript interpreter and a TypeScript parser:
`grid_app_module.cjs` grew from ~1.9 MB to ~2.7 MB. Nothing is *constructed*
until a script runs, so a workbook without one pays only the download.

## Tests

```bash
npm run datagrid:script:test       # engine, data API, database seam, .xlsx round trip
npm run datagrid:script:smoke      # the same path through the app's own commands
npm run datagrid:script:artifacts  # artifacts/script_report.png + the PDF
```
