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
- **Editing is the default, and the slide is a canvas.** This was the other
  way round to begin with — a deck opened read-only and clicking the left or
  right third of the slide turned the page — and it made the editor unusable
  in the way only a real user notices: the first click anyone made on a shape
  moved the deck out from under them. Clicking the slide now selects, always;
  turning the page is the panel, the strip, Page Up / Page Down, and the arrow
  keys when nothing is selected (with a shape selected the arrows nudge it,
  which is why the page keys had to start meaning what they say). `edit.toggle`
  (Ctrl+E) still exists, and now turns editing OFF — for reading, and for the
  present mode of phase E6, which is where clicking to advance belongs.

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
- And a fidelity debt this uncovered, in two layers. The CPU backend **ignored
  `rotate` entirely**, so a shape you turned drew straight in a PNG and turned
  in the browser; a turned rectangle is four rotated corners through the
  polygon filler it already had, a turned outline is four quads, a turned
  picture goes through the rotated blit and turned text through
  `UIContext.textRotated`. Underneath that was the larger one: **only text
  ever carried the angle into the display list at all** — the fill, the
  outline and the picture never set `rotate`, so they drew straight in *both*
  backends. And the angle they now carry has to be applied about the right
  point: both backends turn an element about the element's **own** centre,
  which is right for the shape's box and wrong for everything drawn inside it,
  so a line of text is placed by turning its own centre about the SHAPE's
  centre first. A filled path carries no angle at all in the display list, so
  its points are turned when they are emitted.
- The selection chrome turns with the shape: one shape at an angle draws a
  turned outline, its handles sit on the turned corners, the rotation handle
  leans out of the turned top edge, and a resize drag is turned back into the
  shape's own axes before the box hears about it — dragging the right-hand
  handle of a shape lying on its side has to make it longer, not taller.

Still open, and deliberately named rather than quietly dropped: **crop and
picture filters**, **multi-stop gradients**, **shadow and outline dialogs**, a
**colour picker** (the fill command takes a hex string today, so a host can
already set any colour — what is missing is a way to *choose* one), and
**rulers**. **Right-click menus** cannot be built at all yet: `UIInput` carries
no button identity, so the UI layer cannot tell a right press from a left one
— that is a change in the shared input contract, not in this gallery.

## Phase E4b — the slide panel (done)

The most visible thing a slide editor has, and it was in this file only as a
performance note in E7. It is a strip of the deck down the left now, and each
thumbnail is **the slide's own display list** at a small scale — not a cached
picture of it. That decision removed the whole problem the phase was written
around: there is no second renderer, no PNG to encode, nothing to invalidate,
and a thumbnail cannot drift from the slide because it *is* the slide's scene.
Both backends draw it without being told what a thumbnail is.

- The panel takes width out of the frame the way the toolbar takes height:
  `PptxView.chromeW` beside `chromeH`, so the fit-to-window scale and the
  slide's origin account for it, and `view.panel` folds it away.
- Only the thumbnails on screen are built. That is also what E7 means by
  virtualizing it — the rule is already here, the decks are just never long
  enough yet to notice.
- Click to go, drag to reorder with a drop line between thumbnails (the editor
  grew `moveSlideTo`, since a drag is not a sequence of one-step moves), the
  wheel scrolls, and the current slide is kept in view when the deck moves
  under it.
- `PptxSlide.revision` came out of this and stayed: a number bumped by every
  edit on a slide and never reused, so anything that does cache a picture of a
  slide can tell whether it is looking at the same one. Nothing needs it yet;
  the panel is vector.

15 checks in the host suite — the panel takes width from the slide, folding it
away draws less, clicking the third thumbnail goes to the third slide, dragging
one to the top reorders the deck and undo puts the order back, and a press on
the toolbar ABOVE the panel still belongs to the toolbar (the first version
swallowed it) — and 3 in the browser. `artifacts/09_slide_panel.png` is a slide
being dragged, with the drop line where it would land.

## Phase E5 — the document, not the slide (done)

Everything above this phase edits one slide. This one edits the things a slide
inherits from, which is where a deck stops being a pile of pages.

- **Themes.** `applyPalette` swaps the six accent colours and the two darks and
  lights; `setThemeColor` sets one slot. Both then *re-theme* what is already
  on the slides, which needed a change in the resolver: a colour that came out
  of `schemeClr` now keeps the slot it named after being resolved, so it can be
  looked up again. Before, resolving threw the name away and a re-theme could
  only guess by matching hex values.
- **Layouts.** `layoutParts` lists what the deck has and `applyLayout` moves a
  slide onto one, re-inheriting its chrome and re-matching its placeholders.
- **The master, edited in place.** `editSheet` stands a master (or a layout) up
  as a slide and hands it to the same painter, the same pointer and the same
  tools — nothing in the editing stack knows it is not a slide. `exitSheet`
  writes it back and gives every slide that follows it its chrome again. The
  status line says `master` so you can tell where you are standing. The one
  fix this needed downstream: a sheet's own background was never resolved, so
  a master with a `schemeClr` background drew black the moment you could see
  it — the resolver now resolves master and layout backgrounds too.
- **Sections.** Parsed out of `p14:sectionLst` in the presentation part and
  written back into it, which meant slides had to keep the id `p:sldIdLst` gave
  them (`PptxSlide.slideId`) — sections name their members by id, so a save
  that renumbered the slides would have scrambled them. A section starts at the
  slide in front of you and runs to the slide before the next section begins;
  the panel writes each name once, above the run it names.
- **Notes.** Speaker's notes are a `PptxShape` rather than a string, so the
  caret, the wrap and the styling that already exist work on them; the strip
  under the slide is just the box that shape is laid out in. They round-trip
  through their own `notesSlide` part.
- **Slide numbers and footers.** Both live on the master, which is where
  PowerPoint keeps them, so one of each serves the whole deck. The number is a
  **field** (`a:fld` with `type="slidenum"`), not the text that was in it when
  it was written, so it still counts up when slides move — which meant teaching
  the parser and the writer about fields, and the converter which slide it is
  drawing.
- **Backgrounds per slide.** `setSlideBackground` (hex), `setSlideBackgroundScheme`
  (a theme slot, so it follows a re-theme) and `clearSlideBackground` (back to
  what the layout says).

Commands: `theme.palette`, `theme.color`, `slide.layout`, `slide.background`,
`master.edit`, `master.exit`, `footer.set`, `slide.numbers`, `section.add`,
`section.rename`, `section.remove`, `notes.edit`, `notes.set`, `view.notes`.

Verified where it matters — in the file. The writer suite grew a section round
trip (make two, save, reopen, read them back, then remove them all and check
the deck still opens), an edited-master round trip, and a footer/slide-number
round trip that checks the number came back as a *field* and not as a number.
`artifacts/11_sections_and_footer.png` and `12_master_edit.png`.

## Phase E6 — presenting (done)

Everything before this phase paints the FINAL state of a slide. A show is a
picture that changes over time, and the thing that made this phase work is
admitting that the app has no clock: a host calls `tick(seconds)` and
everything that moves moves from there. A headless host that never calls it
sees a still — which is the right answer for a test and for a PNG — and a
browser that calls it every animation frame sees the show.

- **Transitions.** `p:transition` is parsed (the effect is the element name
  inside it, the speed is a word, the length is milliseconds in the extension
  list), written back, and animated. A `fade` goes through black, because a
  display list has no way to draw one scene at half strength; a `push` takes
  the outgoing page with it and a `wipe` or `cover` slides the new one over,
  both by drawing the two scenes at an offset inside one clip — much less
  arithmetic than compositing, and the same picture for a viewer.
- **Builds.** `p:timing` is a deep tree — a sequence of click groups, each a
  tree of parallel and sequential nodes — and what is wanted from it is flat:
  which shape, which paragraph, what effect, and whether it waits for a click.
  The walk looks for the INNERMOST `p:par` that names a shape, which is one
  effect, and reads the answer off it. A step names its shape by the number the
  FILE uses and everything above names shapes by `editId`, so the two are
  linked once on attach and re-linked at save — the writer renumbers every
  shape, and a build written with stale numbers animates the wrong things.
- **The show itself.** No strip, no panel, no notes strip, no status line: the
  slide is fitted to the window (or to what the presenter's own screen leaves
  beside the notes), and a click goes on — the next build step if there is one,
  the next slide otherwise. Going back lands on the slide before, fully built,
  which is what a presenter means by "back". Space, Enter, the arrows, Page
  Up/Down, Home and End all work, because a presenter is not looking at the
  screen they are pressing.
- **The presenter's own screen.** N: the slide, the one after it, the notes for
  the slide that is up, and a clock — all drawn into the same display list as
  everything else.
- **Ink and a laser.** P draws on the slide and E rubs it off; L is a dot that
  follows the pointer and leaves nothing behind. Ink is kept in SLIDE POINTS,
  not window pixels, so it stays where it was drawn when the window is resized
  or the presenter's screen is a different shape from the audience's.
- **B blanks the screen**, which is what a presenter presses when the slide is
  not the thing to look at any more.

Commands: `show.start` (F5), `show.stop`, `show.next`, `show.prev`,
`show.presenter`, `show.blank`, `show.pen`, `show.laser`, `show.ink.clear`,
`slide.transition`, `slide.advance`, `shape.animate`, `shape.animate.clear`,
`build.earlier`, `build.later`.

Checked in three places, because the three hosts differ in exactly the way that
matters: 55 in the host suite (a click builds rather than turning the page, the
transition draws both pages and finishes on time, going back lands fully built,
the pen leaves a stroke and the laser does not, Escape gives up the pen before
it gives up the show), a round trip through the writer (`28-transitions.pptx`:
a transition and a build come back, and the build still names a shape on the
slide after every shape has been renumbered), and **10 in the browser**, which
is the only host here with a real clock. `artifacts/13_present_transition.png`
is a push caught a third of the way through; `14_presenter_view.png` is the
presenter's screen with a line drawn on the slide by hand.

## Phase E7 — scale (done)

The one phase written entirely about cost, and the only one where the answer
could not be argued about: `bench/pptx_bench.rgr` builds a deck big enough for
the difference to show and times the six things an editor does between one
frame and the next. `docs/EDITOR_BENCH.md` has the numbers.

What it found was not what the phase was written expecting. **Frames were
already flat** in the size of the deck — the slide panel has only ever built
the thumbnails that are on screen, which is what E4b meant by virtualizing it,
and the rule was there before the decks were long enough to notice. What was
linear was **every edit**: `pushSnapshot` copied all five hundred slides to
record a change to one, so a keystroke cost 30 ms and a drag frame 25 ms.

- **The history shares the slides that did not change.** The phase was written
  asking for an operation log with inverses, and the argument against writing
  one is still the one recorded in E1: a shape is a tree, one operation touches
  several levels of it, and an op log is a rewrite of every operation. There is
  a cheaper way to the same number. A step copies only the slides whose
  **revision** moved on and shares the rest — in both directions, since a
  restore keeps the live slide where it stands when it already holds the state
  the snapshot does. The invariant it rests on is that **a slide's revision
  changes whenever its content does**, so the bump happens *before* the capture
  rather than after it, and the two operations that rewrite every slide rather
  than the one in front of you (`remergeChrome`, `retheme`) say so explicitly.
  A slide gets a `key` of its own for this, the same idea as a shape's
  `editId`: an index stops naming the same slide the moment the deck is
  reordered.
- **The panel keeps its thumbnails**, tagged with the revision, the place and
  the width they were built at. It was seven eighths of every frame; an idle
  frame now builds none of them, editing a slide builds one, and scrolling
  builds the ones that moved.

At a thousand slides a keystroke is 0.04 ms, an undo 0.22 ms and a frame 1.0 ms
— nothing between frames follows the deck any more. The checks that keep it
honest are in `pptx:editor:test` (`testSharedHistory`, `testDeckWideUndo`: a
shared copy that goes stale is a silent bug) and in the host suite (a
sixty-slide deck builds under twenty thumbnails, an idle frame builds none, an
edited slide builds exactly one).

## Phase E8 — decks nobody here wrote (done)

Every fixture in this gallery was written by the same hand as the reader, so
every fixture is understood by construction. Two decks from outside turned up
six defects in an afternoon, and all six had the same shape: an element the
reader walked straight past, drawing nothing and saying nothing. This phase is
about that class of hole rather than about any one of its instances.

**`npm run pptx:audit -- deck.pptx`** walks every part of a package through the
reader's own parser and reports the elements it does not look at, most-used
first, in two lists: **known and deliberately not drawn** (3-D, embedded fonts,
hyperlinks, per-script font fallbacks, animation beyond the build) and
**UNREAD — nobody decided about these**. The difference between those two lists
is the difference between a decision and an oversight, and it turns "the slide
looks wrong" into a work order. `npm run pptx:audit:check` runs it over every
fixture and fails when one says something nobody has decided about, so a new
fixture cannot quietly introduce a new hole.

Pointed at the two decks, the list was 24 and 39 kinds of element long. What it
was mostly saying was one thing: **text is inherited, not stated**.

- **Nine levels of list style, down a chain.** DrawingML states `a:lvl1pPr` …
  `a:lvl9pPr`, and this reader read the first — and only from the shape itself.
  So every sub-bullet in every real deck came out in the top level's size,
  colour and indent. A list style is nine `PptxLevelStyle`s now, every field
  paired with a "was this stated" flag because they are MERGED: master
  `p:txStyles` → the master's own placeholder → the layout's placeholder → the
  shape → the paragraph. The order matters and cost a defect to get right: a
  deck built by anything but PowerPoint leaves `p:txStyles` as a generic black
  nobody meant and puts the real typography on the master's placeholder, which
  is *above* it in the chain.
- **A paragraph that states its own bullet keeps it**, including `<a:buNone/>`,
  and a stated `marL="0"` is a decision rather than a silence — which needed
  "was this stated" flags on the paragraph too.
- **`a:normAutofit`.** PowerPoint already worked out how far the text had to
  shrink to fit its box and wrote the answer down. Drawing it at full size in a
  box sized for the shrunken version is an overflow with a known cause.
- **Bullets have their own colour, size and face** (`buClr`, `buSzPct`,
  `buSzPts`, `buFont`), and the layout uses the deck's own `marL`/`indent`
  instead of a level's worth of invented indent.
- **`a:highlight`** — the colour drawn behind a run, which a deck uses as a
  marker pen.
- And the same fallback gap the emoji had, one block down the codepoint chart:
  **a bullet is a geometric shape** (● ○ ■ ▪) and the text face has none of
  them, so every list drew a column of empty boxes. Noto Sans joins the
  fallback pool.

After it, the two decks report **9 and 22 kinds, all of them deliberate, and
nothing unread**. `31-inherited-text.pptx` is the fixture that pins it down —
a master whose typography lives on its placeholders with `p:txStyles` saying
something else entirely, nine levels each with its own size, colour, indent and
bullet, a paragraph that turns its bullet off, a shrunken body and a
highlighted run — and it round-trips through the writer byte for byte, which
needed the writer to state what the levels resolved to (there is no master left
to inherit from) and one more instance of a defect this repository keeps
meeting: `to_int` floors, so `emu(-18pt)` rounded outwards twice and wrote
-228601 where the file said -228600.

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
npm run pptx:bench              # what a deck costs to edit, by size
npm run pptx:audit -- deck.pptx # what this reader does not understand about it
npm run pptx:audit:check        # …over every fixture, as a test
```
