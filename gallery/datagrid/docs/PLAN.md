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
; Milestone 6 (editor semantics): SpreadsheetModel.applyEdit as the single
;   tracked mutation (value + formula per undo op), beginTx/endTx transactions
;   so paste / fill / range delete are one Ctrl+Z, formula-aware copy/cut/paste
;   with AST ref translation, caret editing in the cell buffer, interactive row
;   resize, precedence-aware formula serialization, and per-cell engine
;   resync (never re-attach, which drops the dependency graph).
; Milestone 7 (keyboard + clipboard): Excel key semantics — Ctrl/Shift arrow
;   edge jumps, PageUp/PageDown, Ctrl+Home/End over an O(1) used range,
;   Enter/Tab stepping, F2, Ctrl+Space / Shift+Space band selection — and a
;   real OS clipboard round-trip through the WebGL host.
; Stretch: conditional formatting resolver.
; ==============================================================================
