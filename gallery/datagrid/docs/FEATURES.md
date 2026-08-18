; ==============================================================================
; FEATURES — FortuneSheet / x-spreadsheet parity map for Ranger DataGrid
; ==============================================================================
;
; Feature benchmark:  FortuneSheet (MIT) — https://github.com/ruilisi/fortune-sheet
; Render benchmark:   x-spreadsheet (MIT) — https://github.com/myliang/x-spreadsheet
;
; Goal: grow Ranger toward FortuneSheet's OSS spreadsheet checklist, while
; keeping DataGrid a specialized virtualized engine (x-spreadsheet-like Canvas
; path) over EVG — not CSS Grid / one View per cell.
;
; Status legend:  done | partial | todo
;
; ------------------------------------------------------------------------------
; FortuneSheet checklist          | Ranger DataGrid                         | st
; ------------------------------------------------------------------------------
; Multiple selection              | GridSelection range + shift/drag          | done
; Keyboard navigation             | arrows / tab / enter / home / end         | done
; Inline edit + formula bar       | address + formula/value bar               | done
; Row / column headers            | painted chrome                            | done
; Resize columns                  | header edge drag                          | done
; Resize rows                     | (row ht from xlsx; interactive todo)      | partial
; Copy / paste / cut              | Ctrl+C / Ctrl+V TSV clipboard             | done
; Fill handle                     | drag active-cell handle (copy fill)       | done
; Merge cells                     | paint origin + hit-test → origin          | done
; Multiple sheets                 | tabs + hidden metadata + scroll save      | done
; Freeze panes                    | freezeRows/Cols + fixed bands             | done
; Cell formatting (fill/font/…)   | styles.xml → CellStyle → EVG              | done
; Number formats                  | XlsxNumberFormat engine (practical set)   | done
; Text wrap / rotation            |                                           | todo
; Sort / filter                   | SheetView + programmatic apply            | done
; Formulas (engine)               | AST + deps + FormulaFunctions library     | partial
; Conditional formatting          | fixture present; resolver stretch         | partial
; Hidden rows / columns           | geometry height/width 0                   | done
; Comments / images / charts      |                                           | todo
; Collaboration                   |                                           | todo
;
; Formula stack: FormulaValue + FormulaFunctions (unit-tested) + FormulaEngine
; (parse/deps/recalc). Ops: + - * / ^ & comparisons, A1/$A$1, ranges, Sheet!A1.
; Library: SUM AVERAGE MIN MAX COUNT COUNTA PRODUCT IF AND OR NOT TRUE FALSE
; IFERROR IFNA ABS ROUND INT MOD POWER SQRT SIGN PI EXP LN LOG10 FLOOR CEILING
; LEN LEFT RIGHT MID UPPER LOWER TRIM CONCAT VALUE ISBLANK ISNUMBER ISTEXT
; ISERROR ISERR N T. Unsupported XLSX formulas keep cached <v>.
;
; Number formats: General, 0, 0.00, #,##0(.00), %, currency, scientific,
; dates/times, @, pos;neg;zero sections.
;
; Oracles: openpyxl semantic + LibreOffice visual (SKIP if LO absent).
; Perf: grid_bench + sparse100k fixture (sheet size ≠ painted cells).
;
; ==============================================================================
