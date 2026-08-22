# gallery/ooxml — what the three OOXML editors share

There are three OOXML editors in this gallery:

| Editor | Format | Lives in |
| --- | --- | --- |
| [`docx_viewer`](../docx_viewer/README.md) | `.docx` | WordprocessingML → `RichDocument` → paginated layout → EVG |
| [`datagrid`](../datagrid/README.md) | `.xlsx` | SpreadsheetML → `WorkbookModel` → virtualized grid → EVG |
| [`pptx`](../pptx/README.md) | `.pptx` | PresentationML → `PptxModel` → theme resolve → EVG |

They are three different applications and they should stay that way. Word
pagination, Excel formulas and PowerPoint's master/layout inheritance have
nothing to say to each other, and a single `OfficeDocument` that tried to hold
all three would be worse at all three.

What they **do** share is infrastructure. This directory is where it goes.

> **The line this directory draws.** Don't merge Word, Excel and PowerPoint into
> one document model. Merge the infrastructure underneath them.

## What is here now

```text
gallery/ooxml/
    OpcPackage.rgr     the container: ZIP, parts, content types, relationships
    OoxmlText.rgr      XML entity decoding
    tests/
        OpcPackageTest.rgr    one package reader, three formats
        OoxmlPackageTest.rgr  one sentence, read identically out of all three
        OoxmlTextTest.rgr     the entity decoder, on both string models
    tools/             the runners the npm scripts call
```

```bash
npm run ooxml:opc:test      # the container
npm run ooxml:package:test  # the three format readers agree about text
npm run ooxml:text:test     # the entity decoder
```

Each test compiles **twice**, to JavaScript and to C++, because the two targets
disagree about what a string is — code units on one, bytes on the other — and
a text bug can be invisible on one of them. That is not hypothetical: it is how
`OoxmlText` came to exist.

### `OpcPackage`

A `.docx`, a `.xlsx` and a `.pptx` are the same container: a ZIP whose members
are parts named by package path, plus `_rels` parts saying which part points at
which. That layer had been written three times, and the three copies did not
agree:

| | relationships | `../media/x.png` | a part's own rels | external targets |
| --- | --- | --- | --- | --- |
| `pptx/src/OpcPackage.rgr` | per part, cached | correct | yes | joined as if a part |
| `docx_viewer/.../DocxPackage.rgr` | one flat table | `word/../media/x.png` | no | `word/https://…` |
| `datagrid/.../XlsxPackage.rgr` | none — four callers scanned the XML | two forms of three | — | — |

Now there is one, and the format packages sit on it:

```text
.docx / .xlsx / .pptx bytes
          ↓
     OpcPackage                ← ZIP, parts, content types, relationships
          ↓
DocxPackage / XlsxPackage / PptxParser   ← what each format calls its parts
```

`DocxPackage` and `XlsxPackage` keep their own API; what changed is what is
underneath them. Both gained per-part relationships, correct `../` resolution,
external-target handling and content types — the spreadsheet gained a
relationship layer it never had.

The test that holds this together walks **every part of a package, resolves
every internal relationship, and requires the answer to name a part the ZIP
actually contains.** That single invariant is what none of the three
hand-written readers could hold.

**Deliberately not in the core:**

- **Encryption.** A password-protected workbook is an OLE compound file, not a
  ZIP. `XlsxPackage` decrypts first and hands plain ZIP bytes in, so the core
  never learns what a password is.
- **Writing.** `PptxWriter` and `XlsxWriter` build packages by appending to a
  `ZipWriter` and preserve parts they do not understand by copying them across
  from an open `OpcPackage`. Reading and writing are not symmetric yet, and an
  API that pretended otherwise would hide that.

## What goes here next

The order below is by leverage, not by size. Each entry names what exists in
the repo today, so the work starts from the real code rather than from a
diagram.

### 1. Source-preserving OOXML — opaque parts and node provenance

Today writing is parse → regenerate, and `PptxWriter` already says out loud
that this can rewrite content the model does not fully describe. The fix is to
let a parsed object carry where it came from:

```text
SourceRef { part, nodeId }        on model objects
PreservedXmlNode / OpaquePart     in the package layer
```

Then moving a shape rewrites `<a:off x="…"/>` instead of regenerating the whole
`<p:sp>` subtree, and SmartArt, animations, embedded objects, vendor extensions
and tags from Office versions that do not exist yet survive a round trip.

**Ranger does not have to understand everything in order to preserve
everything** — and this is the single decision that most determines how
compatible these editors can ever be.

### 2. Typography core — `gallery/office/text/`

`DocxTextMetrics` measures through `UITextRenderer` and carries comments about
keeping the measure and paint paths identical; `PptxTextMeasure` and
`PptxTextLayout` solve the same problem separately; the spreadsheet measures
cells its own way. Font selection is still DOCX-flavoured (`Open Sans`,
`Open Sans-Bold`).

Share the pipeline, not the layout:

```text
unicode text → font resolution → shaping → glyph runs → measurement → line breaking
```

`DocxParagraphLayout`, `PptxTextFrameLayout` and `SpreadsheetCellLayout` stay
separate and call into it. Word's line-breaking rules are not PowerPoint's and
should not be merged; how wide a glyph is, is not a per-format question.

### 3. Shared text runs and styles

Three models already solve the same problem — `TextSpan` (docx), `PptxTextRun`,
`CellRun` (xlsx). One `TextRun { text, style, source? }` over one `TextStyle`.

The detail that matters more than the merge: a style property has to
distinguish **unset**, **inherited**, and **explicitly false**. `PptxModel`
already carries this as `sizeSet` / `alignSet` / `bulletSet` companions to the
values. Conceptually the field is `StyleValue<boolean>`, not `boolean` — in
OOXML "not specified" and "specified as false" are different answers.

### 4. DrawingML core — `gallery/office/drawing/`

`PptxColor`, gradients, line styles, shadows, transforms and shape geometry are
in `PptxModel`, but DrawingML is not PowerPoint's: `.xlsx` charts and drawings
(`XlsxDrawing.rgr`), `.docx` floating drawings and WordArt all use it. Lift
these to `OfficeColor` / `OfficePaint` / `OfficeGradient` / `OfficeStroke` /
`OfficeShadow` / `OfficeTransform` / `DrawingGeometry` and all three formats
draw the same shapes the same way.

### 5. `EditorSession` — one transaction and history framework

There are three: `SpreadsheetUndoOp` with its own stacks and `txDepth`,
`DocxEditController`'s undo stack and selection state, and `PptxEdit`'s
snapshot/revision history. Don't merge the operations — `SheetSetCell` is not
`SlideMoveShape`. Merge the machinery: `beginTransaction` / `apply` / `commit` /
`undo` / `redo` / `coalesce`, over a shared `Revision` and `DirtySet`.

Autosave, collaboration, scripting and AI-driven editing all need exactly this
and none of them want three of it.

### 6. `AssetStore` — one place for bytes

`PptxWriteMedia` handles media for decks; `RichDocument` imports the PDF
writer's JPEG `ImageBuffer` directly. An `Asset { id, mimeType, bytes, width,
height, hash }` store, with documents holding `ImageRef { assetId, crop,
transform }`, gives deduplication (one logo, forty slides, one asset) and makes
copy/paste between a deck and a document a matter of copying an id.

### 7. Stable identity — `EntityId` and `RevisionId`

`PptxModel` already has this right: `editId` is stable because an array index
stops meaning the same shape the moment z-order changes, and slides carry their
own key and revision. Selection, undo, scripting and collaboration all want to
say `move entity #456`, never `slides[3].shapes[7]`. Make it a shared
primitive — Ranger's own id, not OOXML's.

### 8. Document / view / editor / derived state

`SpreadsheetModel` currently holds `scrollXSaved`, `undoStack`, `rowGeomDirty`
and cell data in one object. Split into `SpreadsheetDocument`,
`SpreadsheetViewState`, `SpreadsheetEditorState` and a derived cache, and the
same document can serve a desktop editor, a thumbnail renderer, a print
renderer and a headless API. A thumbnail does not need a scroll position.

### 9. Incremental invalidation

All three track change already, differently: DOCX layout follows a document
revision, PPTX slides carry revisions, `SpreadsheetModel` has `version` and
`rowGeomDirty` / `colGeomDirty` plus formula dependencies. A shared
`Revisioned` / `DirtyRegion` / `DependencyGraph` would let one edit invalidate
exactly what it should — and is what a collaborative editor would run on.

### 10. `OfficeScene` — one resolved, paintable layer before EVG

`PptxResolver` produces a resolved scene and DOCX produces `LaidPage` /
`LaidLine`; both exist to strip format semantics before painting. A small
shared scene (`SceneText`, `SceneImage`, `ScenePath`, `SceneTable`,
`SceneGroup`) carrying `bounds`, `transform`, `style`, `entityId` and
`semanticRole` would give hit testing, thumbnails, print, PDF export, selection
overlays and debug layout once instead of three times.

**The hard rule:** `OfficeScene` must never grow back into a document model. It
is resolved, paintable, hit-testable output and nothing else.

### 11. Accessibility from the same resolved layout

```text
document model → resolved layout → EVG
                                 → a11y tree
                                 → PDF
```

Accessibility built from the renderer afterwards is always a step behind. Built
from the scene, it serves the document, the sheet, the deck and PDF export at
once. The DataGrid's a11y work is the starting point.

### 12. Format adapters and capabilities

`DocxApp`, `PptxApp` and `GridApp` are separate applications, which is right.
Above them, a `DocumentFormatAdapter { sniff, load, save, capabilities,
createEmpty }` lets the UI ask `doc.capabilities.canEditShapes` instead of
testing `fileExtension == ".pptx"` — and lets a new format be added without the
shell knowing it exists.

### 13. Retire the magic `kind:int`

`LaidLine.kind` (0 text, 1 image, 2 tableCellBg, …), `PptxShape.kind` (0 shape,
1 picture, 2 group, …) and `SpreadsheetUndoOp.structKind` all work, and all
drift towards `if kind == 7`. These cases carry genuinely different state, so
they want either named constants or separate node types — the value is in the
state they stop sharing, not in the object-orientation.

### 14. Conformance as an architecture component

`docx_oracle_dump`, `pptx_oracle_dump` and `xlsx_oracle_dump` already exist. A
standing corpus — `corpus/`, `oracle/`, `semantic/`, `visual/`, `roundtrip/` —
measured as **open fidelity / edit fidelity / save preservation / reopen
fidelity** would steer this architecture far better than a feature list does.

---

The two most strategic are the first two. Source preservation decides how
compatible these editors can be; the typography core decides how they look.
Nearly everything else is safer to build once those exist.
