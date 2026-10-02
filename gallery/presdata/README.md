# gallery/presdata — chart data for a presentation

A chart in a deck can take its rows as JSON, CSV or XLSX. `PresData` turns a
workbook into CSV, so the chart reads one format.

```ranger
Import "../presdata/PresData.rgr"

def pd:PresData (new PresData)
def csv:string (pd.xlsxFileToCsv("data/sales.xlsx" 0 false))
if ((strlen pd.lastError) > 0) { print pd.lastError }
```

| Call | What it does |
| --- | --- |
| `xlsxFileToCsv(path index display)` | open a file, sheet `index` as CSV |
| `xlsxBytesToCsv(bytes index display)` | the same from bytes (the browser build) |
| `workbookToCsv(book index display)` | a `WorkbookModel` already loaded |
| `workbookSheetToCsv(book name display)` | the same, sheet by tab name |
| `PresData.sheetToCsv(sheet display)` | one `SpreadsheetModel` |

The workbook is read by the datagrid's `XlsxLoader`. The output covers rows
`0..usedRow()` and columns `0..usedCol()`, every line the same width. Fields
holding a comma, quote or line break are quoted (RFC 4180); lines end in `\n`.

`display = false` writes stored values (`0.25`), which is what a chart wants.
Numbers longer than 15 significant digits are rounded to 15, as Excel shows
them: the loader recalculates formulas, and `3 * 19.9` would otherwise come out
as `59.699999999999996`. `display = true` writes each cell through its number
format (`25%`, `59.70`).

On failure the result is `""` and `lastError` says why. An empty sheet is also
`""`, so check `lastError`.

```bash
npm run presdata:test   # sales.xlsx to CSV, compiled to JavaScript and C++
```
