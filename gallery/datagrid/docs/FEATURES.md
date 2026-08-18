; ==============================================================================
; FEATURES — FortuneSheet / x-spreadsheet parity map for Ranger DataGrid
; ==============================================================================
;
; Feature benchmark:  FortuneSheet (MIT) — https://github.com/ruilisi/fortune-sheet
; Render benchmark:   x-spreadsheet (MIT) — https://github.com/myliang/x-spreadsheet
; Excel feature ceiling (reference only): Luckysheet (archived → Univer)
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
; Inline edit + formula bar       | single EditView buffer                    | done
; Row / column headers            | painted chrome                            | done
; Resize columns                  | header edge drag                          | done
; Resize rows                     | (row ht from xlsx; interactive todo)      | partial
; Copy / paste / cut              | Ctrl+C / Ctrl+V TSV clipboard             | done
; Fill handle                     | drag active-cell handle (copy fill)       | done
; Merge cells                     | xlsx merge + paint origin rect            | done
; Multiple sheets                 | WorkbookModel + tabs                      | done
; Freeze panes                    | freezeRows/Cols + fixed bands             | done
; Cell formatting (fill/font/…)   | styles.xml → CellStyle → EVG              | done
; Number formats                  | basic numFmt (0.00, %, integer)           | partial
; Text wrap / rotation            |                                           | todo
; Sort / filter                   |                                           | todo
; Formulas (engine)               | cached <v> + formula bar only             | partial
; Conditional formatting          |                                           | todo
; Comments / images / charts      |                                           | todo
; Collaboration                   |                                           | todo
;
; Milestone 3 (this PR): styles, freeze, copy/paste, fill handle.
;
; x-spreadsheet render peer ops we already exercise in grid_bench:
;   open, first paint, scroll, edit, range select, resize, Ctrl+A
; Also covered in tests: freeze scroll bands, styled display, paste, fill.
;
; ==============================================================================
