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
| Style (fill, font) | done | styles.xml → CellStyle and set from the toolbar: bold/italic/underline/strike/size/colour, real faces |
| Text alignment | done | horizontal and vertical, read from the file and set from the toolbar |
| Text rotation | done | OOXML textRotation, turned in the display list; 255 stacks |
| Text truncation | done | clipped at the cell once a neighbour is occupied |
| Overflow | done | spills into empty neighbours only, as Excel does |
| Automatic line wrapping | done | wrapText → multi-line paint + row auto-fit; toggled from the toolbar |
| Multiple data types | done | number / string / bool / formula / date — typed, stored as a serial, formatted back |
| Cell segmentation style | done | rich-text runs read, painted on one baseline, and written back |
| Hyperlink | done | rel-resolved external + internal targets, painted as links, Ctrl+click follows |

## Cells

| Feature | Status | Notes |
| --- | --- | --- |
| Multiple selection | done | Ctrl+click adds rectangles; delete and format painter cover them all |
| Borders | done | all OOXML line styles per edge, with colours; all/outline/none from the toolbar |
| Fill | done | including empty-but-formatted cells; set from the toolbar |
| Merge cells | done | paint origin + hit-test → origin; one toolbar button merges and unmerges |

## Row and column

| Feature | Status | Notes |
| --- | --- | --- |
| Insert rows / columns | done | both axes: insert with workbook-wide ref repair, one-step undo |
| Delete rows / columns | done | both axes: #REF! semantics, the deleted line restored by undo |
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
| Find and replace | done | values or formulas, whole cell / case, all sheets, replace all in one undo |
| Drag and drop | done | drag the selection's edge to move the block; columns and rows reorder too |

## Formulas

| Feature | Status | Notes |
| --- | --- | --- |
| Built-in formulas | done | ~80 functions incl. lookups and dates; ranges keep their shape; array results spill |
| Conditional formatting | done | colorScale + cellIs, read from the file and authored in a rule editor |
| Data verification | done | list / whole / decimal / length rules, enforced on entry, with a picker and an editor |

## Import / export

| Feature | Status | Notes |
| --- | --- | --- |
| .xlsx import | done | package, styles, formulas, merges, freeze, CF |
| .xlsx export | done | package, styles, formulas, merges, freeze, links, validations — read back by openpyxl |

## Extras

| Feature | Status | Notes |
| --- | --- | --- |
| Images | done | drawing anchors + media, decoded once, painted on SoftCanvas and textured in WebGL |
| Comments | done | comments part → per-cell notes, marked in the corner and shown for the active cell |
| Freeze panes | done | freezeRows/Cols + fixed bands; set and cleared from the toolbar |
| Screenshots | done | tracked artifacts under `artifacts/` |
| Custom tools / API | done | a named-command table a host enumerates, drives and extends — over HTTP too |
| Cooperative editing | todo | single document, no transport — an I/O shape, deliberately not claimed |
| Mobile adaptation | todo | pointer only — needs a touch event source, deliberately not claimed |
| Testing | done | 700+ checks across seven suites plus oracles |

## What is left, and why

The two remaining rows are both **I/O shapes** rather than spreadsheet
behaviour: cooperative editing needs a transport and a conflict policy, mobile
adaptation needs a touch event source. Both are writable as abstractions; what
cannot be written is the proof, because neither can be tested the way
everything above is — by driving the model and reading the answer back. They
are therefore left at `todo` rather than claimed on the strength of an
interface nobody exercised.

## A note on what "done" means here

A row is `done` when the capability is **reachable by a person using the app**,
not merely present in the model. That distinction cost a correction: every
formatting row above was marked done while the grid could read and paint a
style and had no way to set one — the whole point of a spreadsheet. The
formatting commands and the toolbar closed that, and the notes now say which
half of each row is which.

## Beyond the benchmark

Not scored, because the score measures FortuneSheet and these are not things
FortuneSheet has:

- **Charts.** A selection becomes a Vega-Lite chart through Vela — twenty types,
  six styles, previewed live in the picker as the parameters change, and floating
  in draggable windows that can be reopened for editing.
  Charts are on FortuneSheet's roadmap under "more advanced features"; they are
  not among its completed items, so adding a row here would raise our score by
  measuring ourselves instead of the benchmark.
