# FortuneSheet parity scorecard

A measurable answer to "how far along is the Ranger DataGrid?".

Every row below is a capability **FortuneSheet documents for itself** — taken
from its README Features section and the completed items on its roadmap, not
from our own wish list. That matters: a scorecard we wrote from imagination
would only measure our imagination.

Run `npm run datagrid:parity` to score it. `done` counts 1, `partial` counts
0.5, `todo` counts 0.

Keep the table machine-readable: `| Feature | Status | Notes |`, status is one
of `done` / `partial` / `todo`, and sections are `## ` headings.

## Formatting

| Feature | Status | Notes |
| --- | --- | --- |
| Style (fill, font) | done | styles.xml → CellStyle; bold/italic/underline/strike/size/colour, real faces |
| Text alignment | done | horizontal left/center/right, vertical top/center/bottom |
| Text rotation | todo | no rotated text |
| Text truncation | done | clipped at the cell once a neighbour is occupied |
| Overflow | done | spills into empty neighbours only, as Excel does |
| Automatic line wrapping | done | wrapText → multi-line paint + row auto-fit |
| Multiple data types | partial | number / string / bool / formula; no rich date type |
| Cell segmentation style | todo | one style per cell, no rich-text runs inside a cell |
| Hyperlink | todo | not parsed or painted |

## Cells

| Feature | Status | Notes |
| --- | --- | --- |
| Multiple selection | partial | one rectangular range; no disjoint multi-select |
| Borders | done | all OOXML line styles per edge, with colours |
| Fill | done | including empty-but-formatted cells |
| Merge cells | done | paint origin + hit-test → origin |

## Row and column

| Feature | Status | Notes |
| --- | --- | --- |
| Insert rows / columns | partial | columns: insert left/right with ref repair; rows not yet |
| Delete rows / columns | partial | columns: delete with #REF! semantics; rows not yet |
| Hide rows / columns | done | geometry height/width 0 |
| Sort | done | SheetView order + header menu |
| Filter | done | unique-value filter + header menu |
| Resize rows / columns | done | edge drag, double-click auto-fit, menu actions |

## Operation

| Feature | Status | Notes |
| --- | --- | --- |
| Copy | done | values, formulas and formatting; TSV + HTML flavours |
| Paste | done | formats kept by default; Paste Special for the rest |
| Cut | done | moves formulas without translating refs |
| Hot keys | done | Excel navigation, selection, clipboard, undo/redo |
| Undo / redo | done | transactional: one step per action |
| Fill handle | done | tiles the source, translating relative refs |
| Format painter | done | Ctrl+Shift+C arms a brush, next selection takes the style |
| Find and replace | todo | no search |
| Drag and drop | partial | columns reorder via move left/right; no cell-range drag |

## Formulas

| Feature | Status | Notes |
| --- | --- | --- |
| Built-in formulas | partial | ~40 functions, AST + dependency recalc; no array formulas |
| Conditional formatting | partial | colorScale + cellIs on paint; no rule editor |
| Data verification | todo | no validation rules |

## Import / export

| Feature | Status | Notes |
| --- | --- | --- |
| .xlsx import | done | package, styles, formulas, merges, freeze, CF |
| .xlsx export | todo | read-only; no writer |

## Extras

| Feature | Status | Notes |
| --- | --- | --- |
| Images | todo | not read or painted |
| Comments | todo | not read or painted |
| Freeze panes | done | freezeRows/Cols + fixed bands |
| Screenshots | done | tracked artifacts under `artifacts/` |
| Custom tools / API | partial | GridApp is the API; no plugin surface |
| Cooperative editing | todo | single document, no transport |
| Mobile adaptation | todo | pointer only, no touch gestures |
| Testing | done | 600+ checks across six suites plus oracles |
