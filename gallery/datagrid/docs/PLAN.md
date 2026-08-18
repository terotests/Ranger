; ==============================================================================
; EVG DataGrid / spreadsheet prototype — design notes
; ==============================================================================
;
; Architecture (EVG renders; DataGrid owns geometry — not CSS layout):
;
;   SpreadsheetModel
;     cells / formulas(later) / row heights / column widths / styles / merges
;          ↓
;       DataGrid          ← specialized layout engine (virtualization)
;          ↓
;    visible rows+cols only
;          ↓
;         EVG display list (batched fills / text / lines)
;          ↓
;     SoftCanvas / WebGL / (future) SDL2 / PDF
;
; EditView is separate from the grid: one active inline editor (+ formula bar)
; shares the edit buffer — same idea as the text_editor TextEditCore stack.
;
; Benchmarks:
;   FortuneSheet  = feature checklist / parity target (MIT)
;   x-spreadsheet = Canvas render performance peer (MIT)
;   Luckysheet    = Excel feature ceiling (archived → Univer)
;
; Milestone 1: DataGrid virtualization + SoftCanvas/WebGL.
; Milestone 2: .xlsx viewer —
;   ZipReader → workbook/sharedStrings/sheet XML → SpreadsheetModel
;   cached formula values, merges, col/row sizes, sheet tabs.
; Milestone 3: styles, freeze, copy/paste, fill handle.
; Milestone 4 (this): workbook viewer —
;   XlsxNumberFormat engine, FormulaValue + FormulaFunctions (unit-tested) +
;   FormulaEngine (AST/deps/recalc + cached fallback),
;   SheetView sort/filter/hidden, merges hit-test, multi-sheet fidelity,
;   business-workbook fixture, openpyxl + LibreOffice oracles, 100k perf fixture.
; Milestone 5 (formula correctness): Excel coerce/error semantics, absolute
;   refs + AST translate for fill/copy, quoted sheets, cross-sheet incremental
;   recalc stats, formula bar edit, numFmt on raw formula results.
; Stretch: conditional formatting resolver.
; ==============================================================================
