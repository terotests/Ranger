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
; Keyboard navigation             | Excel arrows/Ctrl/Shift, page, home/end   | done
; Inline edit + formula bar       | address + formula/value bar               | done
; Row / column headers            | painted chrome                            | done
; Resize columns                  | edge drag / dbl-click auto-fit / menu     | done
; Resize rows                     | row header edge drag (hitRowResize)       | done
; Copy / paste / cut              | Ctrl+C/X/V, formula-aware block clipboard | done
; Fill handle                     | drag active-cell handle (copy fill)       | done
; Merge cells                     | paint origin + hit-test → origin          | done
; Multiple sheets                 | tabs + hidden metadata + scroll save      | done
; Freeze panes                    | freezeRows/Cols + fixed bands             | done
; Undo / redo                     | transactional, value + formula per op     | done
; Cell formatting (fill/font/…)   | styles.xml → CellStyle → EVG              | done
; Number formats                  | XlsxNumberFormat engine (practical set)   | done
; Text wrap / rotation            |                                           | todo
; Sort / filter                   | SheetView paint + header popup UI         | done
; Formulas (engine)               | AST + deps + FormulaFunctions + coerce    | partial
; Conditional formatting          | colorScale + cellIs paint resolver        | partial
; Hidden rows / columns           | geometry height/width 0                   | done
; Comments / images / charts      |                                           | todo
; Collaboration                   |                                           | todo
;
; Keyboard (GridApp.handleKey, fed by a portable UIInput): arrows move;
; Ctrl+arrow jumps to the data-block edge (edgeJump); Shift extends; Ctrl+Shift
; does both. Enter/Shift+Enter step down/up, Tab/Shift+Tab right/left, F2 opens
; the cell for edit. PageUp/PageDown move one viewport (pageRows). Ctrl+Home →
; A1, Ctrl+End → used-range corner, End → last used column in the row.
; Ctrl+Space selects the column, Shift+Space the row, Ctrl+Shift+Space / Ctrl+A
; the sheet. Ctrl+End is O(1): SpreadsheetModel tracks usedMaxRow/usedMaxCol on
; write (Excel-like: it grows, it does not shrink) instead of rescanning.
; UIKey gained pageUp/pageDown/f2 (12/13/14).
;
; Clipboard: Ctrl+C/X fill clipboardTsv + the structured block. The WebGL host
; answers a copy/cut POST with {"clipboard": tsv} so the browser can put it on
; the OS clipboard; the native paste event carries text back. Text the host
; exported itself still takes the formula-aware block paste.
;
; Editing stack: SpreadsheetModel.applyEdit(row col value formula) is the only
; tracked mutation — it records value AND formula in one undo op. beginTx/endTx
; group a paste / fill / range delete into a single Ctrl+Z step (history is
; trimmed whole transactions at a time). After a batch the app calls
; FormulaEngine.syncCell per touched cell, then recalcDirty() once. GridApp must
; never call engine.attach() per edit: attach clears depsOf/usedBy, which used to
; silently stop propagation after the first edit. Inline editing is caret-based
; (insertAtCaret / backspaceAtCaret / deleteAtCaret + ← → Home End).
; Clipboard: copy keeps formulas and the source anchor, so paste re-bases
; relative refs via the AST; cut pastes without translation.
;
; Formula stack: FormulaValue (coerce/error) + FormulaFunctions + FormulaEngine
; (parse/deps/incremental recalc/fill-translate). Ops: + - * / ^ & comparisons.
; Refs: A1 $A$1 A$1 $A1, Sheet!A1, 'My Sheet'!A1, ranges. Fill/copy translates
; relative refs via AST; serialization is precedence-aware, so a filled
; "=A2+B2" stays "=A3+B3" instead of growing "( )" around every operator.
; Library: SUM AVERAGE MIN MAX COUNT COUNTA PRODUCT IF
; AND OR NOT TRUE FALSE IFERROR IFNA ABS ROUND INT MOD POWER SQRT SIGN PI EXP
; LN LOG10 FLOOR CEILING LEN LEFT RIGHT MID UPPER LOWER TRIM CONCAT VALUE
; ISBLANK ISNUMBER ISTEXT ISERROR ISERR N T. Unsupported keep cached <v>.
; Display: FormulaValue.asRaw → XlsxNumberFormat → DataGrid.
; SheetView drives DataGrid virtualization (sort/filter order). Header popup:
; sort asc/desc, filter unique, clear. CF: colorScale + cellIs on paint.
; Oracles: openpyxl semantic + LibreOffice visual/formula (SKIP if LO absent).
; Screenshots: gallery/datagrid/artifacts/*.png|jpg (tracked).
;
; Number formats: General, 0, 0.00, #,##0(.00), %, currency, scientific,
; dates/times, @, pos;neg;zero sections.
;
; Oracles: openpyxl semantic + LibreOffice visual (SKIP if LO absent).
; Perf: grid_bench + sparse100k fixture (sheet size ≠ painted cells).
;
; ==============================================================================
