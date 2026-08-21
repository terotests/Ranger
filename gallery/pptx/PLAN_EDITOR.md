# From viewer to editor — plan

The deck viewer reads `.pptx`, resolves theme → master → layout → slide, and
paints the result through EVG. Everything it does is one-way. This is the plan
for the other direction: a slide **editor** with the feature set people expect
from a web editor like [PPTist](https://github.com/pipipi-pikachu/PPTist), built
on the model that is already here.

## The licence, and what it means for this code

PPTist is **AGPL-3.0**. That does not forbid derivative works — it requires them
to carry the same licence, including over a network, which for a permissively
licensed gallery is the same thing as forbidding them. (An Apache-2.0 release of
PPTist exists but was last updated in May 2022; it is not a base worth building
on either, and mixing the two histories is exactly the mistake that makes a
licence audit expensive.)

So the rule for this directory is simple and it is not a formality:

- **No PPTist source is read, copied, ported, translated, or paraphrased** —
  not its Vue components, not its `types/slides.ts`, not its command
  implementations, not its pptx writer.
- What is legitimate to take from it is **what any user of the product can
  see**: that an editor has eight resize handles, that dragging near another
  shape snaps to its edge, that Ctrl+Z undoes. Features are not copyrightable;
  code is. This file lists the features; the code beside it is ours.
- The formats are specs, not products: **ECMA-376 / OOXML** (PresentationML,
  DrawingML) is a published standard and the parser and writer are written
  against it, the same way `PptxParser.rgr` already is.
- Where behaviour needs a reference, the reference is **PowerPoint or
  LibreOffice output** — which is what the visual oracle in `harness/` already
  measures against — not another editor's source tree.

If you are working here with an AI assistant, the same rule applies to it: do
not paste PPTist source into a prompt and do not ask for "the PPTist way" of
writing a function.

## The stack this lands on

```text
pointer / keys ─► PptxEditor ─► PptxModel ─► PptxToEvg ─► EVGDisplayList ─► WebGL / SoftCanvas
                      │                                        ▲
                      └────────── selection chrome ────────────┘
```

`PptxEditor` (in `src/PptxEdit.rgr`) is host-agnostic: it knows slide points,
shapes and history, and nothing about pixels, windows or events. `PptxApp` is
the only place where a window pixel becomes a slide point. The selection
outline and its handles are pushed into the **same display list** as the slide,
after it — so every host draws them for free, and an exported deck has none of
them in it.

## Phase E1 — the editing core (done)

| Piece | Where |
| --- | --- |
| Stable shape ids (`editId`), handed out on attach | `PptxEdit.rgr`, `PptxModel.rgr` |
| Selection: click, shift-click, select-all, bounds | `PptxEditor` |
| Hit testing in slide points, rotation-aware, top-most first | `PptxEditor.hitTest` |
| Master / layout chrome is drawn but not selectable | `editableShapes` |
| Move, resize from 8 handles, rotate (multi-selection scales in its box) | `applyMove` / `applyResize` |
| Alignment guides + snapping to shape edges, centres and the slide | `snapDelta` |
| Z-order: front / back / forward / backward, chrome stays behind | `reorder` |
| Group / ungroup, with the viewer's `chOff` / `chExt` mapping preserved | `groupSelection` |
| Align 6 ways, distribute across / down | `alignSelection` / `distributeSelection` |
| Insert box, ellipse, text box, picture; delete; duplicate | `addShapeAt` … |
| Fill, outline, opacity, preset, text bold / italic / size / colour / align | `setFillHex` … |
| Slides: add, duplicate, delete, reorder | `addSlide` … |
| Undo / redo over whole-deck snapshots, with a cap and a redo tail | `pushSnapshot` / `undo` |
| Typing into the selected shape, coalesced into one history step | `appendText` |
| Host seam: pointer drag, keys, Ctrl chords, overlay, command ids | `PptxApp` |
| Browser: press / drag / release, keys, `selectionBox` for the page | `web/` |

Decisions worth keeping (and their reasons):

- **An index is not a name.** Z-order changes reorder `slide.shapes`, so a
  selection held as an index selects a different shape after every reorder.
  `editId` is handed out on attach and copied by clone.
- **History is snapshots, not an operation log.** A shape is a tree and one
  operation can touch several of them; copying the deck is the cheap correct
  thing while the operation set is still moving. An op log is phase E7, and it
  wants the operations settled first.
- **A drag is one edit.** The host applies `applyMove` / `applyResize` per
  frame and pushes a single snapshot on release. Thirty frames of dragging are
  one Ctrl+Z.
- **Undo hands back new objects.** Restoring replaces the deck's slides with
  the snapshot's copies, so a held `PptxShape` reference is stale by design —
  a host looks shapes up by id again.
- **Editing is a mode.** A deck opened to read cannot be changed by a stray
  click; `edit.toggle` (Ctrl+E) is what arms it.

## Phase E2 — text that has a caret (done)

`src/PptxTextEdit.rgr` puts a caret inside a shape. A position is a paragraph
and a column in UTF-16 units of that paragraph's plain text — the unit `strlen`
and `substring` already count in, so nothing is converted before an edit, and
`EVGCodepoint` is what steps over a surrogate pair so the caret never lands
inside one.

The runs are the point of it. Typing inside a bold word stays bold (the style
comes from the run to the left of the caret, the way every editor does it),
styling a selection **splits** the runs it covers and leaves the rest alone,
and runs that end up saying the same thing merge back into one — without that
last part a paragraph grows a run per keystroke. What is in it: insert
(including multi-line text), delete over a range and across paragraphs, Enter
splitting a paragraph and passing on its alignment, bullet and level, character
and word movement, Home/End, shift-selection, select-all, and bold / italic /
size / colour over a selection with a "is all of it already bold?" question
behind the toggle.

It is **not** `EditorBuffer` from the text editor, and that is a decision
rather than an oversight: that buffer's runs carry a weight and a font name
over a line of plain text, and OOXML's runs carry the text itself along with a
size and a colour. One of the two would have to be converted on every
keystroke. What is shared is `EVGCodepoint`, and the measuring that the host
does.

The host side is the seam that had to be got right: the model says "paragraph
2, column 7" and the window needs a rectangle. `PptxToEvg.paragraphBoxes` walks
the same stacking arithmetic `emitTextBody` does — so a caret cannot drift from
the glyphs by disagreeing about where a paragraph starts — and `PptxApp`
measures the text before the caret run by run through the same text renderer
that will draw it, alignment included. Clicking maps back the other way. F2 (or
Enter) puts the caret in the selected shape, Escape gives it up, a click inside
moves it, a click outside ends it, and the caret and its selection are drawn
into the same display list as the slide.

75 checks in `npm run pptx:text:test` and 12 more in the host suite, including
the round trip that matters: click on a caret's own rectangle and the caret
comes back to the column it was measured from.

### Phase E2b — the line, not the paragraph (done)

The wrap is shared now. `src/PptxTextLayout.rgr` breaks a shape's text into
**lines** — which paragraph, which columns, where on screen, how wide — and
three things ask it: the painter, the caret, and the click that puts the caret
somewhere. Before this the painter handed the renderer a `maxWidth` and let it
decide where a line broke, and the caret assumed a paragraph was one line: both
were true separately and could not be true together, because nothing in the
program knew where the second line of a wrapped paragraph started.

Measuring is the other half, and it is one object: `PptxTextMeasure` answers
with the real font when a host has attached its text renderer and with the old
average-width guess when nothing has (a headless test or an export path has no
fonts loaded, and a layout that cannot be computed at all is worse than one
computed approximately). It switches face by weight the way the painter does,
because a bold string is wider than the regular one and a caret that measured
the wrong face lands short of its text.

Two things fell out of it that were not the point:

- A paragraph of **mixed runs** is now positioned by measurement. The painter
  advanced the pen by `0.52em` per character between runs, so a line with a
  size change or a bold word in it drifted — visibly, over a few words.
- **Anchoring is exact.** Centring a text box vertically used to divide by an
  estimated block height that guessed the line count from an average character
  width; the line count is now known before anything is drawn.

The bullet is part of the layout rather than a prefix the painter prepends: it
is measured, the text is indented past it, and a wrapped line hangs under the
text rather than under the bullet.

25 checks in `npm run pptx:text:test` (the lines tile the paragraph with no gap
or overlap, each fits its width, anchoring and alignment move lines without
changing the break, a bulleted line breaks earlier and hangs correctly) and 7
in the host suite, including the one that could not exist before: a caret in
the middle of the SECOND line, measured out to a rectangle, clicked back in,
comes home to the same column. `artifacts/07_wrapped_selection.png` is a
selection running across two of four wrapped lines.

Still here: bullets and numbering as real paragraph properties rather than a
painted prefix, indent levels beyond the simple step, and hyperlinks.

## Phase E3 — writing `.pptx` back out (done, flat)

An editor that cannot save is a demo. `src/PptxWriter.rgr` turns the model back
into an OPC package over `gallery/zip`'s `ZipWriter`: `[Content_Types].xml`,
the relationship parts, `ppt/presentation.xml`, a theme carrying the deck's own
colour scheme and fonts, a blank master and layout, one part per slide, and the
picture bytes in `ppt/media`. The EMU conversions run backwards (points ×
12700, degrees × 60000, font sizes × 100), text is escaped and written as
**UTF-8** — `ZipWriter.addString` writes one byte per UTF-16 unit, which is
wrong for every deck not written in English — and `xml:space="preserve"` keeps
the spaces between words that a run boundary would otherwise eat.

Tables become `a:tbl` grids and charts become **ChartML with the numbers
cached** — a chart part normally points at an embedded workbook for its data,
and a deck written here has none, so the cache is the data (which is what every
reader looks at first anyway).

It is checked three ways:

- **Round trip** (`npm run pptx:writer:test`, 96 checks): a deck built in
  memory and fourteen fixtures are written, reopened with `PptxParser` and
  compared — geometry, rotation, fills, outlines, presets, groups and their
  child boxes, run styles, paragraph alignment, picture bytes, and an edit made
  through `PptxEditor` being in the file afterwards.
- **Structure, from outside** (`npm run pptx:writer:verify`): a Python script
  that uses nothing but `zipfile` and `ElementTree` and asks a consumer's
  questions — does the ZIP open, does every part parse, is every part covered
  by a content type, does every relationship target exist, does every
  `r:embed` resolve in that slide's rels, does the presentation name a master
  and a slide size. 624 checks over the decks the round-trip test leaves
  behind.
- **The picture** (`npm run pptx:writer:visual`): every fixture is rendered at
  96dpi, written, reopened and rendered again, and the two framebuffers are
  subtracted. 21 slides — text, groups, presets, pictures, gradients, shadows,
  bullets, custom geometry, tables, a chart and accented text — come back
  **byte for byte identical**. It is not a fidelity oracle (both pictures come
  from the same painter, so it says nothing about PowerPoint); it says the file
  carries what was drawn.

LibreOffice would be the fidelity oracle, and it is the one this environment
cannot run — the install here fails to convert even a `.txt`, so a refusal from
it is not evidence about the file. `harness/run_oracles.mjs` is where that
check belongs when a machine has a working one.

What comes out is a **flat** deck: the model handed to the writer is the
resolved one, in which master and layout chrome has already been merged into
each slide, so the written master and layout are blank and every slide carries
its own picture. It looks like what was on screen — which is the contract a
"save" has — and it is not the file that came in.

### Phase E3b — saving the file you opened (done)

`PptxWriter.saveOver` keeps the package the deck was read from. Every part is
copied through byte for byte and only the slides that were **touched** are
written again, along with the three parts that have to agree with the slide
list: `ppt/presentation.xml` (its `sldIdLst` replaced, everything else — slide
size, master list, default text style — left exactly as the authoring tool
wrote it), its relationships, and `[Content_Types].xml` (the original entries,
minus parts that left, plus the ones the edit brought in). A deck of forty
slides with one edited word changes one part.

`PptxSlide.dirty` is what makes that possible: `pushSnapshot` marks the slide
the step was on, cloning carries the mark through undo, and a save clears them.
Because the master and the layouts survive, a slide writes only what the slide
itself declares — the resolved chrome would otherwise be baked in on top of the
master that still draws it — and a picture already in the package is
referenced where it lies rather than copied under a new name.

`npm run pptx:writer:test` grew 20 checks for it, and the ones that matter are
the negative ones: after editing one slide of a five-slide deck, **four slide
parts are byte-identical to the original** and one is not; every part of the
original package is still present; the chrome comes back `inherited` rather
than as shapes on the slide; no picture was duplicated; a new slide gets a part
of its own and a deleted slide's part leaves with it. The `--visual` oracle
renders the kept-package save as well as the flat one: 42 slides, all identical
to the original render.

Still dropped when a slide is rewritten: what is on THAT slide and not in the
model (SmartArt, embedded objects, animations on that slide). Untouched slides
keep all of it. Narrowing that further means keeping the original XML for the
shapes an edit did not touch, which is a shape-level provenance the parser does
not record yet.

## Phase E4 — the rest of the direct manipulation (mostly done)

Landed:

- **Marquee select.** A drag from empty canvas is a rubber band, and it takes
  what it *touches* rather than only what it encloses — the enclosing rule is
  PowerPoint's and it makes a band across a row of shapes select nothing.
- **Clipboard.** Copy, cut and paste, the editor's own rather than the system
  one (a browser tab cannot read that without asking, and a deck's shapes are
  not text). Pasting on the slide it came from offsets; pasting on another
  slide puts it back where it was, which is what makes copying a header from
  one slide to the next useful.
- **Lock** (`a:spLocks noMove/noResize`, so it survives a save and comes back
  from a deck PowerPoint locked). A locked shape can still be selected — a
  lock you cannot select is a lock you cannot undo — but move, resize, rotate,
  flip and delete pass it over, and its selection draws no handles, because
  drawing handles that do nothing is a lie.
- **Grid**, as another set of lines to snap to, drawn as dots at the step.
- **A rotation handle**, the ninth handle, on its stalk above the box; shift
  snaps the angle to 15°.
- **Flip horizontal / vertical** — a flag rather than a transform, the way
  OOXML states it, honoured by the path geometry, by a new mirrored blit in
  the CPU backend (`blitImageRectScaledFlipped`) and by a swapped UV range in
  the GPU one.
- **The format painter**: fill, gradient, outline, shadow and the text's
  weight, size, colour and alignment picked up from one shape and painted onto
  others, without touching their geometry or their words.
- And a fidelity debt this uncovered: **the CPU backend ignored `rotate`
  entirely**, so a shape you turned in the editor drew straight in a PNG and
  turned in the browser. A turned rectangle is four rotated corners through
  the polygon filler it already had, and turned text goes through
  `UIContext.textRotated`.

Still open, and deliberately named rather than quietly dropped: **crop and
picture filters**, **multi-stop gradients**, **shadow and outline dialogs**, a
**colour picker** (the fill command takes a hex string today, so a host can
already set any colour — what is missing is a way to *choose* one), and
**rulers**. **Right-click menus** cannot be built at all yet: `UIInput` carries
no button identity, so the UI layer cannot tell a right press from a left one
— that is a change in the shared input contract, not in this gallery.

## Phase E4b — the slide panel

The most visible thing a slide editor has, and it was in this file only as a
performance note in E7 ("virtualized slide thumbnails") — which is the answer
to a question nobody had asked yet, because the panel itself was never planned.
What exists today is `slide.pick`: a dialog of numbered radio buttons. It works
and it is not what anyone means by a deck.

The panel is a strip of **rendered slides** down one side: each thumbnail is
the same scene the viewer paints, at a small scale, so there is no second
renderer and no second idea of what a slide looks like. `PptxView` already
renders a slide alone at a given scale (`renderOracleSlide` does exactly this
for the oracles), so a thumbnail is that at ~120px wide, cached per slide and
invalidated by the same `PptxSlide.dirty` flag the save path already keeps.

What it needs, in order:

1. A layout: the strip takes width out of the frame the way the toolbar takes
   height, so the fit-to-window scale and `slideOriginX` account for it.
2. Thumbnails painted into the same display list, with the current slide marked
   and its number beside it.
3. Click to go to a slide; the panel is the navigation, and the left/right
   thirds of the slide stop being it in edit mode.
4. Drag to reorder — the editor already has `moveSlide`, so this is a drop
   indicator and an index.
5. The slide commands where they belong: new / duplicate / delete on the panel
   rather than only on the toolbar.
6. Scrolling, once a deck is longer than the window.

Cache invalidation is the whole risk: a thumbnail that does not notice an edit
is worse than no thumbnail. The flag exists, the render is cheap at that size,
and the honest first version re-renders the current slide's thumbnail every
time its scene changes and the others only when their `dirty` flips.

## Phase E5 — the document, not the slide

Themes (recolour a deck from one palette, the way `GridTheme` does for the
spreadsheet) · layouts and placeholders as things you can pick rather than
inherit · editing the master · sections · speaker notes · slide numbers and
footers · background fills per slide.

## Phase E6 — presenting

Transitions · entrance / emphasis / exit animations with a timeline · presenter
view with notes and a next-slide preview · pen and laser annotations during a
show. The viewer already paints the final state of a slide; animation is a
time-varying scene, which is the interesting part.

## Phase E7 — scale

Operation-log history with inverses instead of deck snapshots · dirty-rectangle
painting rather than rebuilding the display list per frame · **virtualizing**
the slide panel of E4b, so a hundred-slide deck renders the dozen thumbnails
that are on screen · a document big enough to make the difference measurable,
in `bench/`, the way the text editor and the grid are benched.

## Non-goals

Pixel-perfect PowerPoint parity, SmartArt authoring, equations, media playback,
real-time collaboration, and anything requiring a server: this gallery's whole
argument is that the same Ranger code runs in a browser tab with nothing behind
it.

## Running it

```bash
npm run pptx:editor:test        # the editing core, on a deck built in memory
npm run pptx:editor:host:test   # pointer, keys, overlay, commands
npm run pptx:web:test           # the browser build, including a real drag
npm run pptx:window             # the hosted window
```
