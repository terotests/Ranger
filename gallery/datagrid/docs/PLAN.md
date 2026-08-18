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
; Milestone 2 (this): .xlsx viewer —
;   ZipReader → workbook/sharedStrings/sheet XML → SpreadsheetModel
;   cached formula values, merges, col/row sizes, sheet tabs.
; Next: styles.xml / numFmt, freeze panes, fill handle, formula engine, writer.
; ==============================================================================
