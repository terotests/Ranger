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
    SourceRef.rgr      where a parsed object came from, so it can be written
                       back unchanged
    tests/
        OpcPackageTest.rgr    one package reader, three formats
        OoxmlPackageTest.rgr  one sentence, read identically out of all three
        OoxmlTextTest.rgr     the entity decoder, on both string models
    tools/             the runners the npm scripts call
```

The other half of the shared machinery — fonts, and in time text shaping,
DrawingML and identity — is next door in
[`gallery/office`](../office/README.md).

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

### 1. Source-preserving OOXML — done for `.pptx`, open for `.xlsx`

`SourceRef` is where a parsed object came from: part, start, end. `PptxXmlNode`
carries the span of every element it reads, and a child of `p:spTree` or of
`p:sld` that nothing models becomes a `PptxOpaque` — the span it occupied and
its place in order. `PptxWriter.saveOver` splices those spans back in.

So SmartArt, embedded objects, ink, vendor extensions and a slide's own
extension list now survive an edit **to the slide they are on** — an untouched
slide was already copied through byte for byte. The colour map override
survives too, where the writer used to state a plain one whatever the slide
said. And the relationships that preserved markup NAMES survive with it, which
is what `pptx:writer:verify` checks by resolving every reference in the written
package.

**Ranger does not have to understand something in order to preserve it.**

What is still open:

- **Shape-level provenance.** A rewritten slide still regenerates each shape
  from the model, so anything inside a `<p:sp>` that the model does not
  describe — a shape's own `extLst`, an effect nobody reads — is lost. Doing
  this safely needs a per-shape "has this changed?" that cannot silently answer
  wrong, because answering wrong the other way discards the user's edit.
- **`.xlsx` has no save-over at all.** `XlsxWriter` always writes a fresh
  package, so preservation there means building the keep-the-package machinery
  first — which `.pptx` already had when this work started.

### 2. Typography core — started, in `gallery/office/text/`

[`OfficeFont`](../office/README.md) is the first piece: one answer to which
face draws a run, one family alias map, and one walk when a face is missing. It
ended three bugs, one per editor — the document reader never drew italic at
all, the spreadsheet drew every bold italic cell upright and light, and the
deck reader measured against fallbacks it never named.

`OfficeTextMetrics` is the second: offset → x and x → offset over a neutral run
description, which the document reader now uses. Its nine rendered pages are
byte-identical across that change, which is the point — it moved a walk rather
than changing what anyone sees.

Still per-format above them: the slide layout's own walk (its measurer
estimates when no renderer is attached, which the shared one has no concept
of), per-span size and family (which needs wrapping to learn about runs first),
shaping and line breaking. Share the pipeline, not the layout:

```text
unicode text → font resolution → shaping → glyph runs → measurement → line breaking
```

`DocxParagraphLayout`, `PptxTextFrameLayout` and `SpreadsheetCellLayout` stay
separate and call into it. Word's line-breaking rules are not PowerPoint's and
should not be merged; how wide a glyph is, is not a per-format question.

### 3. Shared text runs and styles — the part that was wrong is fixed

The detail that mattered more than the merge is done. A style property has to
distinguish **unset**, **inherited** and **explicitly false**, and all three
readers stored a plain `boolean` and asked `if (bold == false)` — which is true
of both "said nothing" and "said no". So a word explicitly taken out of bold
came back bold, in a document, a deck and a cell alike.

[`OfficeStyle`](../office/README.md) is the carrier —`StyleFlag`, `StyleNum`,
`StyleText`, and an `OfficeTextStyle` over them — and `applyOver` is the
inheritance rule that is the whole reason it exists. Each format reads,
resolves, edits and WRITES the distinction now.

What is left is the merge itself: one `TextRun { text, style, source? }` in
place of `TextSpan`, `PptxTextRun` and `CellRun`, each of which still holds the
shared style alongside its own ideas — a field type, a hyperlink, a number
format — and still spells the tri-state longhand as a companion per property.

### 4. DrawingML core — colour done, the rest still to lift

[`OfficeColor`](../office/README.md) is the first piece, and it was the one
with a reader missing it entirely: the spreadsheet dropped every colour named
by theme, tint or index — which is every cell Excel styles from its own
palette — while `xl/theme/theme1.xml` sat in the package unread. It reads them
now, and the deck reader shares the maths rather than keeping a second copy.

The trap that makes this worth one careful file: DrawingML's `tint` and
SpreadsheetML's `tint` are different functions on different colour spaces, and
using either where the other belongs gives a colour that is plausible and
wrong.

Gradients, line styles, shadows, transforms and shape geometry are still in
`PptxModel`, and `.xlsx` charts and drawings (`XlsxDrawing.rgr`) and `.docx`
floating drawings use all of them. Same move, still to make.

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

The two most strategic were the first two. Source preservation decides how
compatible these editors can be; the typography core decides how they look.
Both are now started rather than planned, and nearly everything else is safer
to build on top of them.
