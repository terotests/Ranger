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

> **Beyond OOXML.** The plan for ODF, PDF, HTML/CSS, EPUB and the data formats
> is [`PLAN_FORMATS.md`](../../PLAN_FORMATS.md) in the repository root. It
> extends this roadmap; the items below are what it starts from. Its first
> phase is `.odp` **beside** `.pptx` — one XML reader, one scene, one painter,
> one accessibility tree, two models that never meet — because that pair is the
> sharpest available test of the line this directory draws.

The order below is by leverage, not by size. Each entry names what exists in
the repo today, so the work starts from the real code rather than from a
diagram.

### 1. Source-preserving OOXML — done for `.pptx` and `.xlsx`

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

- **An edit no longer bakes the slide.** A rewritten slide regenerates each
  shape from the RESOLVED model, and resolution is lossy in one direction: it
  turns *follows the theme* into a concrete gradient, *follows the master* into
  a concrete background, and *is the title placeholder* into a text box at
  fixed coordinates. Written back, all of that looks identical and is a
  different file — the deck has stopped being a themed deck. Moving one shape
  did that to the whole slide.

  Measured on the fixtures, editing one shape used to delete `<p:style>` from
  every shape on the slide (3 → 0), add a baked `<a:gradFill>`, add a `<p:bg>`
  the slide never had, state `<a:latin>` eight times, turn every inherited
  bullet into `<a:buNone/>`, and drop `<p:ph>` so the title placeholder came
  back an ordinary text box — which also broke this repository's own
  accessibility tree, since it finds a slide's title by `p:ph type="title"`.

  Four of five fixtures now round-trip an edit with **identical element
  counts**; the fifth differs by exactly the `<a:xfrm>` of the shape that was
  moved.

  **The mechanism is a signature, not a flag,** and that distinction is the
  whole design. A flag saying "this fill was inherited" stays true after the
  user changes the fill, so the save discards the edit — worse than the bug it
  fixes, and the existing suite caught exactly that on the first attempt
  ("the move that was made is in the file" went red). The resolver records
  what it worked out *as a value*; the writer asks "does this still look
  exactly like what was inherited?" Any change answers no, and there is no
  mutation site anyone has to remember to update.

- **Still open: what is inside a `<p:sp>` that the model has no field for** —
  a shape's own `extLst`, an effect nobody reads. That needs the source span
  per shape rather than per slide, and a way to know the shape is untouched
  that is as safe as the signatures above.

### 1b. `.xlsx` save-over — **both saves exist now**

**`.xlsx` has both saves now.** `XlsxWriter.write` builds a fresh package and
`writeOver` preserves the one the workbook came from; `GridApp.preserveOnSave`
picks, and defaults to preserving, because the surprising outcome is the one
where saving quietly deletes half the file. Cleaning stays a deliberate option
rather than the only behaviour.

What a plain save was dropping, measured on this repository's own fixtures:

| | |
| --- | --- |
| `images.xlsx` | the drawing, its relationships and **both media parts** — a spreadsheet with pictures came back with none |
| `annotations.xlsx` | `xl/comments1.xml` |
| every workbook that had them | `docProps/core.xml`, `docProps/app.xml`, `xl/theme/theme1.xml` |

Keeping the bytes is the easy half. The hard half is the four places that NAME
parts, because keeping the media and losing the reference is the same as losing
the media: the content types, the package relationships, the workbook
relationships, and the worksheet's own `<drawing>` / `<legacyDrawing>`
elements. That last one is `SheetOpaque`, the spreadsheet's version of
`PptxOpaque` — an allowlist of the worksheet children this writer does not
generate, kept verbatim and put back at the right point in SpreadsheetML's
fixed child order.

Two things it gets for free. `<conditionalFormatting>` is read into `cfRules`
and never written, so preserving the source keeps it in the file until the
writer learns to state it. And the sheet goes back to **its own part path**, so
the relationship part beside it still matches.

The test asserts zero parts dropped across eight fixtures, that the pictures
come back **on the sheet** rather than merely in the zip, that an edit made
before saving is what was saved, and that no relationship in the written file
names a part the file does not contain. `tools/check_preserve.py` then opens
the same files with openpyxl — a reader that has never seen this model — since
a subtly invalid content-types merge produces a file our own loader is happy
with and Excel refuses.

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

### 4. DrawingML core — colour done; the rest has no second user yet

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
`PptxModel`. This entry used to claim that `.xlsx` drawings and `.docx`
floating drawings use them too, and **that is not true today**: `XlsxDrawing`
and `WordMlParser.parseDrawing` read a `a:blip` and an extent and nothing else
— neither reader has shapes at all, so neither has a gradient to lose.

So lifting them is a pure refactor with no second user, which is the opposite
of what `OfficeColor` was. It becomes worth doing when one of those readers
grows shapes; doing it first would be moving code to a shared place on the
strength of one caller.

### 5. `EditorSession` — the history rules are shared; the session is not yet

[`OfficeHistory`](../office/README.md) is the machinery: one action however
many primitives, whole-action trimming at the cap, and the discipline that undo
and redo are one function with a direction. The operations stayed where they
are, as they should.

It was worth doing for what it found. The document editor was missing every
rule the spreadsheet had, and each absence was a live bug: Enter could not be
undone **and blocked every undo below it**, redo corrupted the document,
undoing a chart paste left the chart, and one paste was five undos that never
got back to the start.

Still to come: the SESSION around it — selection state, a clipboard and a dirty
set that autosave, collaboration and scripting can all read, and `PptxEdit`'s
snapshot history brought under the same rules (it is whole-deck snapshots
rather than an op log, which is a different shape with the same questions).

### 6. `AssetStore` — **built, and it was a live bug**

`OfficeAssetStore` is in [`gallery/office/assets/`](../office/README.md). It was
not a tidiness exercise: all three editors identified a picture by its package
path, which is wrong in both directions at once, and in `.pptx` a user reached
it in one click — insert `logo.png` from one folder and a different `logo.png`
from another, and the second was silently shown and saved as the first. A file
called `image1.png`, the name every OOXML package gives its own media, was
worse: the writer decided it was "already in the package" and the inserted
bytes were never written at all.

Identity comes from the content now. The digest is CRC-32 plus the length and
every hit is confirmed with a full byte comparison, so the store cannot merge
two different images however weak the digest is. `OfficeImageRef` carries the
crop and transform, off the asset, so nothing about how a picture is displayed
can leak into whether two pictures are the same picture.

The spreadsheet's decode cache is on it too, for a bug of its own: `GridImages`
outlives the workbook, so a second `.xlsx` used to show the first one's
pictures.

**Still open:** `.xlsx` has no image *writer* and neither `.docx` nor `.xlsx`
has a host insert path, so the naming half is only used by `.pptx`. And
`RichDocument` still imports the PDF writer's `ImageBuffer` directly — that is
a *decode* dependency rather than an identity one, and lifting it needs a
shared decode surface that does not exist yet.

### 7. Stable identity — the design is kept; the primitive is not

`PptxModel` already had the idea right: `editId` is stable because an array
index stops meaning the same shape the moment z-order changes. Selection, undo,
scripting and collaboration all want to say `move entity #456`, never
`slides[3].shapes[7]`.

`OfficeId` — `(client, clock)` in Yjs's shape, with a state vector so a sync is
a delta rather than a document — was built and tested here, and **then removed
again**. It had no callers, and a review of this branch made the argument that
settled it: an unused API is not a foundation. This branch had just spent
considerable effort showing that a shared module without a second caller is
precisely how the old copy survives underneath it.

[`office/COLLABORATION.md`](../office/COLLABORATION.md) keeps the design, which
was the hard part. The requirement worth building against is named there:
**durable** identity. Ids are minted correctly for the single-session editing
these editors do today — every entry point re-mints, and there is no collision
to find — but `editId` does not survive a reopen, so "shape #5" means nothing
tomorrow. It can ride in the `p:extLst` the source-preserving work already
carries through a save.

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

The trees themselves exist now — see **14** below, all three apps publish one.
What is still open is this diagram: each app builds its tree from its own
model, not from a shared resolved scene, so the three walks have the same shape
without being the same code. That only becomes worth merging once **10**
(`OfficeScene`) exists; building the abstraction first would be guessing at
what the three have in common from two examples.

### 12. Format adapters and capabilities

`DocxApp`, `PptxApp` and `GridApp` are separate applications, which is right.
Above them, a `DocumentFormatAdapter { sniff, load, save, capabilities,
createEmpty }` lets the UI ask `doc.capabilities.canEditShapes` instead of
testing `fileExtension == ".pptx"` — and lets a new format be added without the
shell knowing it exists.

### 13. Retire the magic `kind:int` — **named**

`DocEditOp.kind` was the one that had already cost something: four separate
bugs, each a number the producer wrote and the consumer had never been taught
(see [`office/README.md`](../office/README.md)). The rest are named now too —
`DocBlockKind`, `LaidLineKind`, `PptxShapeKind`, `SheetStructKind`.

**No live defect was found in any of them.** All four tables were internally
consistent, every kind had a handler at every end, and the suites went green
first try. Two things came out of the search that are worth keeping:

- **`DocBlock.kind` and `LaidLine.kind` are different tables over the same
  small integers**, and both are read inside `DocxLayout.layoutDocument` a few
  lines apart. `b.kind == 4` is a chart; `cl.kind = 6` is the line drawn for
  it, because 4 there is a header. Getting those the wrong way round is one
  character and it compiles.
- **The spreadsheet's two ends already disagree on how many kinds there are.**
  The model handles seven, `reapplyStructFormulaAdjust` handles six. That is
  correct — a sort permutes rows without shifting any reference, so there is
  nothing to adjust — but nothing said so, and the next kind added would land
  in the same gap silently. It is written down now.

These cases carry genuinely different state, so the further move is separate
node types rather than one class with a tag; the value is in the state they
stop sharing.

### 14. Accessibility — **all three publish a tree now**

`EVGA11yTree` has been in `gallery/evg` for a while, and the spreadsheet has
published one beside every frame. The document viewer and the deck viewer
published nothing — and a screen reader cannot read a canvas, so that is not a
degraded experience, it is **a blank window**. Two of the three apps in this
gallery were unusable with one. Both publish one now.

`DocxA11y` builds the document's tree from the BLOCKS, not the laid-out lines: a
paragraph broken across four visual lines is one thing to read, and building
from `LaidLine` would make the reading order and a reader's position depend on
the window width.

What it says, and why each of those is the thing that matters:

| | |
| --- | --- |
| headings | from the style id, because that is the only place Word records one, and every navigate-by-heading command in every reader is built on it |
| lists | **nested**. A reader announces "3 of 5" from `posInSet`/`setSize`, so flattening an outline makes it announce positions that do not exist. `lists_demo.docx` has a three-level list and caught exactly that in the first draft of this |
| tables | as a grid with its real row and column counts, the widest row deciding — a merged table that claimed fewer would have a reader reading past the end |
| pictures | the author's alt text from `wp:docPr/@descr`, **which the reader was dropping entirely**, and an explicit "No alt text" where the document has none: that is a documented failure of the document, and hiding it makes it harder to find |
| header/footer | published, and deliberately outside the body — they repeat on every page, and met in the reading flow a reader would read them between every two paragraphs |
| the caret | wherever there is one, editable or not, with `readOnly` saying which |

Ids come from model identity — `doc/para:12`, `doc/table:3/row:2/cell:1` — never
from position. `EVGA11yNode` warns that an id which changes each frame is the
most common way a first implementation fails, and the test asserts the tree is
identical when built twice.

`PptxA11y` is the deck's, and what a deck is decides its shape:

| | |
| --- | --- |
| the deck | a **list** of slides. "Slide 7 of 30" is how anyone navigating a presentation knows where they are, and it comes from `posInSet`/`setSize` and nothing else |
| reading order | the **shape order**, which is the z-order the file states — not the order things appear on screen. That is what PowerPoint's own reading-order pane edits, so a deck fixed there is fixed here; sorting by position would look tidier and disagree with every other tool |
| slide titles | `p:ph type="title"` is the deck's heading style. A slide with none is announced by its number rather than by its first text box: that box is very often a label, and calling it a title sends a reader looking for a section that is not there |
| master chrome | left out. It is on every slide, and met in the reading flow it would be read between every two of them — the same reason the document leaves the page header out of the body |
| alt text | `p:cNvPr/@descr`, **which the reader was dropping and the writer was deleting** |
| speaker notes | published. They are the one part of a deck that is already prose |

The writer half is the one that matters more. `descr` was not emitted, so
editing a deck here **deleted the author's alt text** — worse than never having
read it, and silent. The test proves it: with the writer change reverted, the
round trip loses the alt text and the assertion fails.

Still to do: `tblHeader` so a repeating table header row is announced as
headers, hyperlinks as links, and durable shape identity — a deck's shape ids
are still "the nth shape of this slide", because `editId` is re-minted on every
attach (see [`office/COLLABORATION.md`](../office/COLLABORATION.md)).

### 15. Conformance as an architecture component

`docx_oracle_dump`, `pptx_oracle_dump` and `xlsx_oracle_dump` already exist. A
standing corpus — `corpus/`, `oracle/`, `semantic/`, `visual/`, `roundtrip/` —
measured as **open fidelity / edit fidelity / save preservation / reopen
fidelity** would steer this architecture far better than a feature list does.

---

The two most strategic were the first two. Source preservation decides how
compatible these editors can be; the typography core decides how they look.
Both are now started rather than planned, and nearly everything else is safer
to build on top of them.
