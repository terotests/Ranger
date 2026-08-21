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

## Phase E2 — text that has a caret

Today typing appends to the end of a shape's text and backspace takes one off
the end. A real editor needs a caret, a selection inside the text, and runs
that can differ inside one paragraph.

The pieces already exist in `gallery/text_editor`: `EditorBuffer` (lines,
runs, undo), `EditorSelection` (caret, shift-arrows, word/line selection) and
`EditorLayout` (measured wrapping). E2 is binding a shape's `PptxTextBody` to
those and painting the caret into the same display list — not writing a second
text engine.

Also here: bullets and numbering as real paragraph properties rather than a
painted prefix, indent levels, line and paragraph spacing, hyperlinks.

## Phase E3 — writing `.pptx` back out

An editor that cannot save is a demo. `gallery/zip/ZipWriter.rgr` already
writes ZIP containers, so what is missing is the OPC part of it:
`[Content_Types].xml`, `_rels`, and a PresentationML serializer that turns
`PptxModel` back into `p:sp` / `a:xfrm` / `a:t` with the EMU conversions run
backwards. Two oracles decide whether it worked, and both already exist in
`harness/`: python-pptx reads the file we wrote and is asked what is in it, and
LibreOffice renders it so the visual diff can compare it against our own paint.

Round-tripping a deck we did not author is the hard half: parts we do not model
(SmartArt, embedded objects, animations) have to survive being re-written, which
means keeping the original XML for anything untouched rather than regenerating
it from the model.

## Phase E4 — the rest of the direct manipulation

Box (marquee) select · copy / cut / paste, including between decks · format
painter · flip horizontal / vertical · lock · rulers, grid and per-shape
rotation handle · crop and picture filters · multi-stop gradients, shadow and
outline dialogs · a colour picker · right-click menus · the shape library
beyond the presets `PptxGeom` already draws.

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
painting rather than rebuilding the display list per frame · virtualized slide
thumbnails · a document big enough to make the difference measurable, in
`bench/`, the way the text editor and the grid are benched.

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
