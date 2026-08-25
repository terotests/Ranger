# gallery/office — infrastructure the office editors share

There are three OOXML editors in this gallery — [`docx_viewer`](../docx_viewer/README.md),
[`datagrid`](../datagrid/README.md) and [`pptx`](../pptx/README.md) — and they
are three different applications. Word pagination, Excel formulas and
PowerPoint's master/layout inheritance have nothing to say to each other, and a
single `OfficeDocument` that tried to hold all three would be worse at all three.

A fourth editor uses this machinery and is not an OOXML application at all:
[`book`](../book/README.md) keeps its undo here. That is the test of whether
something in this directory is infrastructure or a PowerPoint detail wearing a
general name.

What they share is the machinery underneath. It goes here.

> **The line this directory draws.** Don't merge Word, Excel and PowerPoint into
> one document model. Merge the infrastructure underneath them.

The container half of that lives next door in [`gallery/ooxml`](../ooxml/README.md):
one OPC package reader, and the XML text rules.

## What is here now

```text
gallery/office/
    assets/
        OfficeAsset.rgr        a picture is its bytes, not its file name
    editor/
        OfficeHistory.rgr      what "one undo" means
    drawing/
        OfficeColor.rgr        the theme palette, and what is done to a colour
    geom/
        OfficeGeomFormula.rgr  the guide language DrawingML geometry is written in
        OfficePresetShapes.rgr the 187 preset geometries, evaluated
        OfficeEmojiShapes.rgr  GENERATED - 262 emoji glyph outlines as shapes
        OfficeShapeCatalog.rgr the same 187, named and grouped, so a picker can
                               offer them — the slide editor could draw every
                               one and insert two
    text/
        OfficeFont.rgr         which face draws this run
        OfficeTextRun.rgr      a stretch of text drawn in one face
        OfficeTextMetrics.rgr  offset → x, and x → offset
        OfficeStyle.rgr        a property that knows it was not stated
        tests/ tools/
```

```bash
npm run office:font:test       # JavaScript and C++
npm run office:metrics:test    # likewise
npm run office:style:test      # likewise
npm run office:color:test      # likewise
npm run office:geom:test       # the guide evaluator and the presets
npm run office:shapes:test     # the catalogue, and that both editors call it
npm run office:history:test    # likewise
npm run office:asset:test      # likewise
```

There is also one thing that is not a test:

```bash
npm run office:shapes:sheet    # all 449 onto gallery/office/geom/out/shapes.svg
npm run office:emoji:build     # re-extract the emoji outlines from the font
```

It asserts nothing. It draws every shape in the catalogue, grouped by
category, each under its label, as one SVG a browser opens — so somebody can
answer the question no assertion can: *does `swooshArrow` look like a swoosh
arrow.* Shapes with both a fill and a stroke are drawn pale-body-dark-line, the
way PowerPoint draws them, because that is the only way the line shows.

The first time it ran it turned up three solid black squares where the chart
markers belong, twelve more where the action buttons belong, and nothing at all
where the eleven lines belong — a real defect that eleven passing assertions
had not noticed. `gallery/book/ISSUES.md` §17 is the account of it.

### The shape picker

`ui/OfficeShapePicker.rgr` is the window both editors put up to choose from the
catalogue, and it exists as much to test the shared layer as to be useful: if a
picker has to know which editor it is in, the seam was never a seam.

```
    BookApp ─┐                            ┌─► BookApp.insertShape(id)
             ├─► OfficeShapePicker ──id──►┤     (path frame, own outline)
    PptxApp ─┘        ▲                   └─► PptxEdit.addShapeAt(id …)
                      │                         (preset NAME on the slide)
             OfficeShapeCatalog
```

It knows a catalogue and a window. It hands back an id and stops — and the two
editors then do **completely different things** with that id, which is what
makes it shareable rather than merely shared. Each host wires it in five
places (a field, `attach`, a toolbar button, a line in `pointer`, a line in the
paint loop) and the only line that differs is the one that acts on the id.

The window body is one content region the picker paints itself rather than a
grid of `EVGControl`s: a picker is a lot of little pictures, `EVGControl` has
no picture kind, and adding one would push shape drawing down into
`gallery/evg`, which has no business knowing what a preset is.

`OfficeShapeCatalogTest.testSharedPicker` is the proof — the same command id
opens it in both, the same press at the same place in the grid picks the same
entry, and the book ends up with an outline while the deck ends up with a
preset name.

### The emoji shapes

The 187 DrawingML presets are a 1990s clip-art set drawn from formulae — a
cloud is eleven arcs, a smiley is two dots and a curve. An emoji font is real
vector artwork in a format this repository already parses for text, so
`geom/tools/emoji_shapes.rgr` reads `NotoEmoji-Regular.ttf`, pulls the glyph
outline for each codepoint named in `geom/assets/emoji.txt`, and writes them
out as `ShapeEntry` rows that carry their own `pathData`. **262 shapes** in
eight groups: Nature, Animals, Food, Travel, Objects, Activities, Symbols,
Faces.

Two things the extractor has to get right, both of which look like details and
are not:

* TrueType is **quadratic**, and two consecutive control points imply an
  on-curve point exactly between them. Drop it and every smooth corner in the
  font becomes a spike.
* Font space has **y going up** from the baseline; a shape's box has y going
  down from the top.

Adding one is a line in `emoji.txt` and a rebuild. The generated file imports
the catalogue rather than the other way round, so an editor that only wants
the presets does not carry the megabyte of path data.

**Licence.** Noto Emoji is SIL OFL-1.1, not the AGPL the rest of `gallery/` is
under. The generated file carries its own notice, the licence text travels with
the font at `gallery/pdf_writer/assets/fonts/Noto_Emoji/LICENSE.txt`, and
nothing here is called Noto. Apple's shapes are **not** copied and must not be.

**Both editors take them.** The slide editor could not, for a while: a preset
goes onto a slide as a NAME — PowerPoint draws it from its own geometry at
whatever size it is dragged to — and there is no preset called "panda", so an
emoji has to go in as the outline itself. `PptxShape.pathUnit` held **one**
contour, and a mushroom's spots and a panda's eye patches are contours of their
own: the outer one alone is a blank blob, and one shape per contour fills the
holes in.

`PptxShape.pathEnds` is where each contour stops. Empty means one contour, so
every shape that existed before it behaves exactly as it did, and five places
learned about it at once:

| | what changed |
| --- | --- |
| the writer | one `<a:path>` per contour instead of one for the lot |
| the parser | reads **every** `<a:path>`; it read only the first |
| `PptxToEvg` | fills the contours together, even-odd, so holes stay holes |
| `PptxEdit` | carries the boundaries when a shape is duplicated |
| `PptxApp` | `shape.insert` puts an outline in as custom geometry |

The parser half is not optional housekeeping: without it the deck this writer
produces would come back as its outer contours and nothing else.

### `OfficeFont`

"The document says Calibri, bold and italic — what do I draw with?" was
answered three times, differently, and each answer was wrong in its own way:

| | what it did | what that cost |
| --- | --- | --- |
| `.docx` | `applyFace(bold)` — one argument | every italic run drew upright; Ctrl+I did nothing visible; the italic faces were never even loaded |
| `.xlsx` | built `"Family-BoldItalic"`, no space | the loader records `"Bold Italic"`; the misspelt name resolves to the family's **regular** face with a real `unitsPerEm`, so the "did I get a face?" check passed and every bold italic cell drew upright and light |
| `.pptx` | built the right name, never checked it existed | a deck naming a family with no italic measured against a fallback it never named |

One answer now. It knows what a face is called, whether that *exact* face is
loaded — which `FontManager.hasFont` cannot tell you, because it matches the
**family** and says yes to a bold italic as soon as any face of the family is
there — and what to do when it is not:

```text
Family + bold + italic     what the document asked for
Family + bold              lose the slant before the weight: a bold word drawn
Family + italic            upright still reads as emphasis, an italic one that
Family                     loses its weight does not
fallback + the same walk
```

It answers `""` when there is nothing at all, so a caller can tell *"I drew
something else"* from *"there was nothing to draw with"*.

The **family alias map** is here too — `Calibri → Open Sans`,
`Times New Roman → Droid Serif`, and unknown names to distinct families rather
than all to one, because sending every unknown name to the same face makes
choosing a font in a toolbar look like a no-op. It began in the spreadsheet,
the only one of the three that had one.

This section used to claim that one map means a document opened in two of these
editors looks the same in both. **It did not, and a review caught it.** The
document reader kept its own three-case map — Cinzel, Josefin, everything else
is Open Sans — so a Times New Roman paragraph was sans-serif here and serif in
the grid, and it was not loading Droid Serif or Noto Sans at all. Both halves
are fixed: `WordStyleResolver.mapFont` is now one line calling `aliasFamily`,
and `DocxView` loads the families the map sends documents to. Nothing in the
fixtures changed, because every one of them names Calibri and both maps
answered Open Sans for it — which is exactly why nobody noticed.

**The face NAME is one layer down, in `UITextRenderer.faceName`.** Five callers
had their own copy of it and three spelled the bold italic cut
`"Family-BoldItalic"` — the spreadsheet's software painter, its GL painter, and
the shared toolbar. FontManager splits on the first dash and matches the TTF's
own subfamily, which is `"Bold Italic"` **with a space**; the misspelt name
misses, falls through to the family's regular cut, and hands back a font with a
real `unitsPerEm` — so every "did I get a face?" check passes and bold italic
text draws upright and light. Silently. That is the bug `OfficeFont` was
written to end, still live in the painters underneath it.

It lives in `UITextRenderer` rather than here because it is a fact about how
this repository's FontManager names a face, not about OOXML — and because
`gallery/evg` cannot reach into `gallery/office`. `OfficeFont.faceName`
delegates to it.

## What goes here next

> **Beyond OOXML.** [`PLAN_FORMATS.md`](../../PLAN_FORMATS.md) is the phased
> plan for the formats after DOCX/XLSX/PPTX, and for `OfficeScene` — the
> resolved layer several of them converge on.

The order below is by leverage. See [`gallery/ooxml/README.md`](../ooxml/README.md)
for the full roadmap and what each item is worth.

### `OfficeTextMetrics`

The other half: offset → x and x → offset, over an `OfficeTextRun` — start,
end, family, size, bold, italic and nothing else. A **view**, not a model: a
format turns its own runs into a list of them for one measurement and throws it
away. The two questions must be each other's inverse, and two copies of one
walk is exactly how they stop being.

Two differences between the copies it replaced were not accidents:

- **Per-run rounding.** Word's ink advances x by an *integer* per run, so its
  measurement truncates the same way — summing in full precision and rounding
  once gives a different answer, and the difference is where the caret ends up.
  PowerPoint's painter carries doubles throughout, so rounding per run there
  would be the error instead. The caller says which.
- **Per-run size.** A slide's runs each state a point size; a Word line is laid
  out at one, because `tr.wrap` broke it at one. A run with no size of its own
  takes the caller's.

### `OfficeStyle`

In OOXML **"not specified" is not "specified as false"**, and a `boolean`
cannot hold both. That is the difference between these two runs under a style
that says bold:

```xml
<w:r><w:rPr/>…                        says nothing  → bold
<w:r><w:rPr><w:b w:val="0"/></w:rPr>  says NOT bold → not bold
```

All three readers stored a plain boolean and asked `if (bold == false)`, which
is true of both. So a word explicitly taken out of bold came back bold — in a
document, in a deck and in a cell:

| | how it decided | what that cost |
| --- | --- | --- |
| `.docx` | `if (hasFlag "w:b") { bold = true }` | a word un-bolded inside a bold heading drew bold; its underline was right, having been written with the distinction in mind |
| `.pptx` | `if (run.bold == false) { if lvl.boldSet … }` | the list-level parser beside it had always read `b` as three answers; the run parser read it as two — and the writer had no way to say "not bold", so it could not be fixed by hand either |
| `.xlsx` | `if bold { st.bold = true }` | the size on the same class already had the idea, spelled as a sentinel — `0` means "whatever the cell says". A boolean has no spare value to spend that way |

`StyleFlag`, `StyleNum` and `StyleText` are the carriers — Ranger has no
generics, so `StyleValue<T>` is spelled three times — and `OfficeTextStyle`
composes them. The whole reason any of it exists is one method:

```text
applyOver(base)   every property this style STATES replaces base's;
                  every property it does not, leaves base's alone.
```

That is inheritance: docDefaults, then the style chain, then the direct
formatting, each applied over the last. A property that cannot say *"I was not
stated"* cannot take part in it, which is how a chain silently becomes
*"whoever set it to true last wins"*.

Each format carries the distinction now where it reads, resolves, edits and
**writes** — a run that says it is not bold has to say so on the way out too.
And an editor states a flag only when it differs from what the run would
inherit anyway, which is what Word does with its own `w:b`: un-bolding inside a
bold placeholder is recorded, un-bolding inside plain text leaves no scar.

### The rest of the typography core

- **The `.pptx` layout still keeps its own walk.** Its measurer answers with an
  estimate (0.52em) when no renderer is attached at all — a headless export, a
  test — and giving the shared walk that concept is a design question rather
  than a move. The face decision underneath it is already shared.
- **Per-span size and family in the document reader.** Neither is honoured, for
  one reason: `tr.wrap` breaks a paragraph in a single face at a single size,
  so measuring the pieces in another would put the line ends somewhere the
  breaks are not. Wrapping has to learn about runs before measuring can.
- **Shaping and line breaking.** One pipeline — unicode text → font resolution
  → shaping → glyph runs → measurement → line breaking — with Word's,
  PowerPoint's and Excel's own layout rules on top of it, not merged into it.

### `OfficeColor`

DrawingML is not PowerPoint's: the same `<a:clrScheme>` names the same twelve
colours in a .pptx, a .xlsx and a .docx. The deck reader had the palette, the
modifier chain and the scheme names. The spreadsheet had none of it and dropped
every colour that was not a literal hex string:

```xml
rgb="FFCC0000"           read
theme="4" tint="0.4"     "" — dropped
indexed="10"             "" — dropped
```

The second line is what Excel writes for **every** cell styled from the
palette — *"Blue, Accent 1, Lighter 40%"* IS a theme index and a tint — and
`xl/theme/theme1.xml` was in the package unread.

**The trap, and the reason this is one file rather than one function.**
DrawingML and SpreadsheetML both have a `tint` and they are not the same one:

| | what it does |
| --- | --- |
| `<a:tint val="60000"/>` | keeps 60% of each linear RGB channel, adds the rest as white |
| `tint="-0.25"` | scales the HLS **luminance**, leaving hue and saturation alone |

Same word, different space, different formula. They are `applyDrawingMods` and
`applyExcelTint`, and the test asserts that the same `0.4` gives two different
colours through them.

The other thing easy to get backwards: Excel's theme **indices** are not the
theme file's order. `theme="0"` is the light background and `theme="1"` the
dark text — the first two pairs are swapped — so a reader that maps them in
file order paints white on white.

### The rest of `drawing/`

Gradients, line styles, shadows, transforms and shape geometry are still in
`PptxModel`. They are used by `.xlsx` charts and drawings and by `.docx`
floating drawings too, and lifting them is the same move colour just made —
but colour was the one with a reader missing it entirely.

### The rest of the shared run model

`OfficeTextStyle` is the intersection the three formats state and inherit.
Their own run types still hold it alongside their own ideas — a slide run has a
field type, a document run a hyperlink, a cell run a number format — and each
still spells the tri-state longhand as a companion per property. Folding those
into one `TextRun { text, style, source? }` is the rest of the merge; the
distinction it exists to protect is already in place, which was the part that
was actually wrong.

### `OfficeHistory`

The document editor's history was missing every rule the spreadsheet's had,
and each absence was a bug — all four the same bug, an op kind written as a
bare **number** by the code that produces it and never taught to the code that
replays it:

| what happened | why |
| --- | --- |
| Enter could not be undone, **and blocked every undo below it** | a split recorded `kind = 1`, which neither direction knew; backspace-join (`2`) and bold (`3`) the same |
| Redo **corrupted** the document | `undo` knew five kinds, `redo` knew one — and moved the op to the undo stack anyway, so the next undo ran it twice and invented text |
| Undoing a chart paste left the chart | `pasteChart` recorded `5`, the multi-paragraph delete, because 5 was one more than the table paste's 4 |
| One paste was five undos, and never got back | no transactions at all |

`OfficeHistory` holds what that needs and nothing else: what counts as one
action (nested safely), which action an op belongs to, how many ops off the top
are one undo, and how many fall off the bottom at the cap — **always whole
actions**, because a surviving half is an undo that can only reach a state the
document was never in.

The **operations** used to stay where they were, and this file used to explain
that by saying Ranger had no generics to hold them with. It has them now, and
`OfficeHistory` is `@params(Op)`: `SheetSetCell` is still not `SlideMoveShape`
is still not `DocInsertText`, but `OfficeHistory@(SpreadsheetUndoOp)` and
`OfficeHistory@(DocEditOp)` are separate concrete classes after expansion,
neither of which can see the other's entries. Nothing is asked of `Op` — no
bound, no interface, no shared field — so a shape, a snapshot and a record all
fit. See `OfficeHistory.rgr`'s own header.

The structural fix is that undo and redo are one function with a **direction**.
Written as two switches over the same kind they drift, and the drift is silent
until someone presses redo. A kind is handled both ways or neither — and where
it genuinely cannot be redone, it refuses *without moving the op*, so the two
stacks cannot come apart.

The guard is a property test rather than a case list: every action goes through
do → undo → redo → undo, and the text has to match at each point it should.

### Collaboration — the design, without the code: [COLLABORATION.md](COLLABORATION.md)

Every editor here names things with a counter — `nextParaId`, `nextId`, a style
index. A counter is fine while one person edits one file and is exactly wrong
the moment two do, because both mint 7 and 7 stops meaning one paragraph.

`OfficeId` — `(client, clock)` in the shape Yjs uses, plus a state vector —
**was built, tested on both targets, and then removed from this branch.** It
had zero callers. A review put it plainly: an unused API is not a foundation,
it is surface nobody keeps alive, and this repository had just spent a lot of
effort proving that a shared module with no second caller is how the old copy
survives underneath it.

What is kept is the part that was actually hard: [COLLABORATION.md](COLLABORATION.md)
— which four ideas from Yjs are worth taking, what this codebase already has
that fits them, and where copying a text CRDT stops being enough for a slide.
The primitive is a couple of hundred lines and will be better written against a
real requirement than against a guessed one.

The requirement to write it against is named there and is real: **durable**
identity. `editId` is re-minted on every attach, so "shape #5" means nothing
after a reopen — and a merge needs it to mean the same shape tomorrow. It can
ride in the `p:extLst` the source-preserving work already carries through a
save. That is the point at which minting deserves a shared type.

### Still to come — revisions, and one history framework

Durable `EntityId` (PPTX's `editId` is already the right idea, minted too
often), `Revision`, and one transaction and history framework instead of the
three there are now — `OfficeHistory` is the rules, not yet the framework, and
PPTX's whole-deck snapshot undo is still outside it.
