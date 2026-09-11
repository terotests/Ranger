# Fig reader (Ranger + EVG)

Read a Figma `.fig` / `.deck` / `.jam` in Ranger, walk the kiwi node tree,
normalize it to a format-agnostic **scene graph**, and paint that with EVG.
The same code runs in Node and in the browser — the page at
[`/figma/`](https://terotests.github.io/Ranger/figma/) opens a file you pick.
Nothing is uploaded.

```text
.fig / Figma JSON
       ↓
Figma parser / loader
       ↓
Normalized Scene Graph     gallery/figma/src/scene
       ↓
Figma → EVG adapter        gallery/figma/src/evg/SceneToEVG.rgr
       ↓
EVG tree + styles + assets
       ↓
Ranger EVG renderer
```

Figma-specific logic stops at `FigToScene`. The EVG renderer is not taught
Figma types. A later SVG / Sketch / custom UI importer can emit the same
`SceneNode` tree.

This is the OpenFig pipeline written in Ranger, so the two can be timed on
the same bytes. OpenFig is
[`openfig-cli`](https://github.com/OpenFig-org/openfig-cli) /
[`openfig-core`](https://github.com/OpenFig-org/openfig-core).

Ranger throughout: the ZIP around a `.fig` and the DEFLATE inside it are
`gallery/zip`, and the zstd the message chunk of a Figma export uses is
`gallery/zstd`. There is no host hook and no vendored decoder, so the
reader works on every target the compiler emits rather than only on
JavaScript.

## EVG support (used, not extended)

| Feature | EVG support |
| --- | --- |
| container | yes — `EVGElement.createDiv()` |
| absolute position | yes — `position:absolute` + `left` / `top` |
| width / height | yes |
| background | yes — `background-color` |
| opacity | yes |
| border | yes — `border-width` / `border-color` |
| corner radius | yes — uniform and 4-value TL TR BR BL |
| overflow hidden | yes |
| transform | yes — `rotate` / `scale` / `translate` on the viewport root |
| text | yes — `createSpan()` + `textContent` |
| font | yes — family / size / weight; `text-align`; `line-height` |
| image | yes — `createImg()` + `src` + `object-fit` |
| SVG path | yes — `createPath()` + `d`; `fill` / `stroke-width` |
| gradient | yes — 2-stop linear `gradient-from` / `gradient-to` / `gradient-dir` |
| shadow | yes — `shadow-radius` / `shadow-color` / `shadow-offset-x/y` |
| flex row/column | yes — Auto Layout only |
| gap | yes |
| padding | yes |
| align-items | yes |
| justify-content | yes |
| backdrop blur | yes — `backdrop-filter: blur()` |
| letter-spacing | baked into the glyph outlines; a warning only when text falls back to a span |
| dedicated ellipse tag | **no** — emit an SVG path |

Every node is placed at the x/y its file stores, Auto Layout children
included: a Figma export carries the positions its own layout engine
settled on, and re-running the layout with other fonts would only drift
from them. The Auto Layout itself (mode, gap, padding, alignment, hug,
grow, absolute) is read into the scene graph for anything that wants to
re-flow. Viewport pan/zoom is one `translate * scale` on a world element
under the clipping root, not a rewrite of node geometry.

Text paints as the glyph outlines the editor shaped (`derivedTextData`),
so a file set in Space Grotesk or Inter looks right on a machine without
either font. Strokes paint from `strokeGeometry`, which already carries
alignment, per-side weights, caps and dashes; a CSS border is the fallback
for a file without it. A translucent paint goes into its colour, not into
the element's opacity, so a bar inside a 15% track stays solid.

## Try it

```bash
npm run figma:test          # kiwi + sample .fig + scene IR + viewer
npm run figma:web           # static page → gallery/figma/web/standalone/dist
npm run figma:web:serve     # http://localhost:8010
npm run figma:inspect       # dump the bundled sample
npm run figma:bench         # Ranger vs openfig-core (if installed)
```

The page opens on `fixtures/health.fig`, the Figma export shipped beside
it. Drop your own `.fig` on it, open one the page can fetch —
`?file=fixtures/health.fig&page=0&frame=1` — ask for the generated deck
with `?file=sample`, copy layers in Figma and paste them onto the page
(⌘V), or:

```bash
node gallery/figma/bin/fig_cli.js inspect path/to/file.fig
node gallery/figma/bin/fig_cli.js fields path/to/file.fig 13709:3272
```

`inspect` prints the node tree; `fields` prints one node's raw kiwi
fields, which is how a layer that draws wrong is read against what the
file actually says about it.

## Paste from Figma

A copy in Figma lands on the clipboard as `text/html` carrying two
base64 spans: `(figmeta)`, a little JSON (`fileKey`, `pasteID`), and
`(figma)`, the same fig-kiwi bytes a `.fig` keeps in `canvas.fig` — no
ZIP, and only the copied nodes. `web/standalone/clipboard.mjs` unwraps
the HTML; the parser reads the bytes as they are. The pasted nodes still
name the page they came from, which is not in the payload, so the tree
builder gives them a page called **Pasted**. Images referenced by hash
are not in the payload and paint as grey boxes.

Every paste writes a report — to the Selected pane, to the console, and
to `window.__lastPaste` — with what the clipboard carried (types, HTML
size, base64 size, decoded bytes, the eight-byte prelude, the figmeta)
and what the engine made of it (nodes, pages, `orphans` / `adopted`,
draw commands, per-stage milliseconds, warnings). `adopted` below
`orphans` means layers were read and never drawn; a prelude that is not
`fig-kiwi` means the base64 decoded to something else. A payload whose
base64 is not a whole number of four-character groups is rejected as
truncated rather than decoded short in silence.

The HTML a browser hands over is not the HTML Figma wrote: quotes may
change and the `<!--` `-->` around each span may arrive as named,
decimal or hex entities. All of those shapes are parsed, and the smoke
test pastes each one.

## Instances

An `INSTANCE` carries no children. It names a component by guid and Figma
draws that component's subtree in its place, so a reader that stops at the
node draws an empty box wherever a file uses components — which is most
files. `FigToScene` looks the component up and converts its children under
the instance's transform.

Where the guid is depends on who wrote the file, and only one of the
spellings being read is what made a real export come out empty:

| | |
| --- | --- |
| `overriddenSymbolID` | an instance swapped for a different component |
| `symbolData.symbolID` | what a Figma export writes — nested, not on the node |
| `symbolID` on the node | the REST API, and this repository's sample |

All three are read, in that order, and the order matters: a swap is an
override of the symbol the instance names, not another spelling of it.
Read last it never won, and a card that swaps its thumbnail for the "you
are here" variant of a set drew the placeholder artwork the set lists
first. Expansion stops at fifteen levels, so a cycle is a warning and not
a hang.

### Overrides

Everything the designer changed inside an instance — the text above all —
is stored on the instance as `derivedSymbolData`: one `NodeChange` per
overridden node, carrying only the fields that differ and a `guidPath`
naming its node in the component. Reading the component but not these
leaves every instance showing the component's own placeholder, which is
what makes a real file read as a blank template: "Title text" wherever
there should be content.

An override is applied by merging its fields over the component node's own
and running the ordinary reader on the result, so an overridden node goes
through the same conversion as any other and nothing is reimplemented per
field. The node keeps its identity and its place in the tree; a derived
entry's `guid` and `parentIndex` describe the copy, not the original. The
component itself is untouched — two instances of it can say different
things.

The key is the whole path, not the last guid on it. A file made of
components nests them several deep, and most overrides name a node inside
a nested instance rather than one of the component's own children, so the
key has to say which instance it went through: `J/Y` for node `Y` inside
nested instance `J`. Entries go into one table for the document, keyed by
where the node sits inside the outermost instance, and a nested expansion
adds to that table rather than replacing it — an earlier version replaced
it and placed 115 overrides out of 25,672.

A path is spelled in `overrideKey`, not in guids. A component that came
from a library is copied into the file and re-guided on the way in, so the
guids an override path names are the library's and not the ones the copy
carries — every node keeps its old identity in `overrideKey`, and that is
what the path means. Matching on the node's own guid placed 55 of a real
board's 1,323 overrides; matching on `overrideKey` places 894. A file
whose components are its own — the bundled sample, a REST import — has no
`overrideKey`, so the guid is the fallback and nothing changes for it.

Two lists, not one. `derivedSymbolData` is what Figma computed — the
shaped glyphs, and the size and transform the instance laid the node out
at — and `symbolData.symbolOverrides` is what the designer typed. The text
itself is only in the second, the glyphs only in the first, so both are
merged over the component node, authored first and derived over it. With
only the derived half read, a card drew the component's own layout: a
template card 2,030 pixels tall spilled 4,600 pixels of placeholder down
the board.

An instance also clips the way its component does. The flag is on the
component; the instance carries only `frameMaskDisabled`. Without it the
screenshot inside a tip card ran out of the side of the card.

The diagnostics count them: overrides seen, applied, and the difference.
Seen above applied means placeholders are still showing because a path
did not match, which needs a different fix from having no overrides.

## FigJam

A sticky, a shape with text, a connector, a stamp, a table: none of them
has children. Figma builds the layers itself and a `.jam` ships only what
it built, in two lists that pair by `guidPath`:

| | |
| --- | --- |
| `derivedImmutableFrameData.overrides` | the geometry — per layer, its size, transform, flattened fill and stroke paths, and the shaped glyphs of its text |
| `nodeGenerationData.overrides` | the style for the same layers — paints, the text itself, font, alignment, `visible` |

Read neither and a board opens as a page of empty boxes, which is what a
`.jam` did here: every one of its 26 stickies, 56 shapes, 5 connectors and
5 tables drew nothing at all.

Each layer is merged the way an instance override is — style, then
geometry over it — and run through the ordinary reader, so a sticky's body
is a vector, its text is text with glyph outlines, and nothing is
reimplemented per field. The layer's kind is read off the fields it has:
text data makes it text, a flattened path makes it a vector, and neither
makes it the box the others sit in — whose own paints belong to them, not
to it. A sticky's author name is a layer like any other, and it is hidden
because the file says `visible: false` on it.

The first guid on a path names the layer, and the rest name the node
inside the frame. A table cell's background and its text therefore share a
path *tail* and not a prefix — `40000000:0/601:5/601:7` and
`40000000:1/601:5/601:7` — so a layer is placed against the first entry
with the same tail. That is what puts the third cell's text in the third
cell rather than 20 pixels from the table's corner.

A connector keeps one style block for the line, its caps and its label,
and its arrow head is a filled path in the line's colour — the only colour
the file gives it.

## Moving around

Drag with any button to pan, scroll to zoom, pinch with two fingers, or use
the `−` / `+` buttons; the readout between them shows the zoom and is the
button that returns to 100%. Zoom is anchored on the pointer — or on the
midpoint of the two fingers — so the point under it stays where it is
instead of the page sliding toward the origin. A trackpad pinch arrives as
a wheel with `ctrl` held and gets a rate of its own, or it would crawl where
the wheel flies; a finger lifted out of a pinch leaves the other one
panning. The gestures are `gallery/evg/gl/evg-gestures.js`, which any EVG
canvas can attach — it reads the view this page keeps and hands back
another, and the page still decides when to paint one.

Input is applied once per animation frame, not once per event. Both
`setView` and `draw` are expensive — the first rebuilds the display list
in Ranger, the second serialises the whole scene to JSON and back — and a
wheel flick arrives far faster than a frame, so applying each event as it
landed made the queue grow while the same work was redone. Forty wheel
events in one task now cost one rebuild and one paint.

Wheel deltas are normalised before use: Firefox reports lines and Chrome
pixels, one notch arriving as 3 or as 100, and a line is counted as 33
pixels so that a notch is 1.16x in both.

The pan is a transform, and EVG skips a subtree that cannot reach the clip
it is inside — a check that was made against the boxes the layout placed,
while the transform moves the pixels afterwards. A Figma page is laid out
around the origin and never noticed; a FigJam board is laid out where the
designer left it, x = -13,264 here, so every frame on it measured as ten
thousand pixels off-screen and was skipped whole: 193 draw commands for
3,565 nodes. The clip now travels into the space the subtree is laid out
in (`EVGDisplayList.cullThroughTransform`), so the same board draws 1,704
of them and still skips what is really off-screen.

## Layers

The pane on the left is a tree rooted at ONE layer at a time, not a list of
every layer in the file: a board is thousands of them, and all of them at
once is a wall rather than a tree. Picking something on the canvas roots the
pane where you picked — at the layer, or at its parent when the layer has
nothing under it, since the siblings of a leaf are the useful thing to see
and a pane holding one row is not. The crumbs above say where that is and
climb back out, and `⤵` on a row roots the pane there.

Rows are open by default; a fold you have to click through to see anything
is a list with extra steps. What folds itself is what does not fit: the pane
draws about six hundred rows, and a subtree bigger than the room left
arrives folded with its size in the tooltip. The room left counts the rows
still owed to everything queued behind it, so every section of a board gets
a row even when the first one could have filled the pane on its own. A layer
you open by hand stays open.

## Selecting and editing

Click a layer on the canvas or in the tree and it is ringed on the page and
opened in the right-hand pane. The ring is drawn around the layer's box on
the page, which has to be walked to: `x`/`y` on a node is an offset from
its parent, so a title twenty pixels into a card three thousand pixels
across the board is not at 20,16 — where the ring used to be drawn, in the
corner of the page and nowhere near what it was pointing at.

The pane is not a list of facts about the layer. The numbers on it ARE the
layer: type one and the page is painted again. Figma answers this with a
grid of boxes; here only what you can change looks like a field and
everything else is text, and a field's label is a scrub handle — drag it
sideways and the number follows. Position and size, opacity, corner radius,
fill and stroke colour, and the text itself are editable; Auto Layout, the
effects and what the reader could not draw are shown and not.

Retyping a text layer drops the glyph outlines the editor shaped with it —
those outlines are the old string, drawn — and what replaces them is the
text laid out here, in whatever font this machine has. That is the honest
result, and it says plainly which half of the pipeline drew what you are
looking at.

Nothing is written back to the file. **Revert edits** re-reads the document
the scene was converted from.

The **Frame** control picks a frame by its index, which is what the viewer
takes and reads back. It used to list the frames' ids: no option ever
matched the index put into it, so the control showed blank on every file,
and picking one asked for frame 13,709 — out of range, which quietly showed
the whole page again.

## What a frame costs

A board of 3,565 nodes, panned. Measured on this file, per frame:

| | before | after |
| --- | --- | --- |
| build the display list | 1,702 ms | 37 ms |
| decode it in the page | — | 9 ms |
| paint it | 71 ms | 41 ms |
| hand the frame over (JSON) | 5,630 ms | gone |

A frame of that board carried 2.5 million points; it carries 767,000 now,
and `fixtures/health.fig` — three phone screens, the size of file anyone
actually opens — went from 27 ms a frame to 12.

**The frame crosses as typed arrays.** `EVGDisplayList.toBinary()` — three
`Int32Array`s and a small string pool — instead of JSON. The picture is the
same to the hundredth, which is what `gallery/evg/gl/list-binary-check.mjs`
holds the two bridges to, and `scene()` still answers in JSON for anything
that wants to read a frame. Writing it as text was 42% of a profile in
`toJson` and the number formatting under it, and another 33% in the garbage
they made.

**The EVG tree is dumped when someone asks for it.** The debug pane's text
is twelve megabytes on this board, and it was built on every rebuild — so
on every frame of a pan — and thrown away unread.

**Pan and zoom move the pixels, not the boxes.** The transform is one
attribute on the world element; the tree under it and its layout do not
change, so a view change writes that attribute and walks the tree again
rather than building a second tree and laying it out.

**A flattened outline is kept.** `d` is a string and the painter wants
points, so the walk parses and flattens every path — and a page of text
drawn as glyph outlines is thousands of them. The result depends on the
path and on the box it is drawn in, neither of which a pan changes, so
`EVGElement` keeps it (`ringsCache`) and re-flattens when either changes:
966 → 581 ms.

**And a curve is flattened for the size it is DRAWN at.** The subdivision
was chosen from the layout box, and a transform is exactly the difference
between that box and the pixels: this board at 10% was cutting every glyph
into the 48 segments a curve 640 layout pixels wide deserves, to draw it
five pixels long. The scale of the transforms a subtree is under is
carried down the walk (`drawScale`), so the count follows the pixels:
581 → 125 ms.

**A curve is also cut by its own length, not by the box it lives in.**
Inside a path the element's size says nothing: a heading 2,855 pixels wide
cut every curve of every glyph in it 47 ways in order to draw those glyphs
two pixels tall. Each curve is measured through the transform and cut at
about a point every two device pixels, never finer than the ceiling above
— so nothing is heavier than it was, and a big curve keeps every segment
it had. 125 → 37 ms. All three of these are the engine's own gain: any EVG
page with vectors on it redraws for less.

What is left is the frame itself: 37 ms to build the list, 9 to decode it,
18 to build the GPU buffers and 18 to draw. The first three of those are
work a pan does not need — the scene has not changed, only the camera has —
and taking the camera out of the coordinates is designed in
[`../evg/PLAN_VIEW_TRANSFORM.md`](../evg/PLAN_VIEW_TRANSFORM.md), which
would put a pan of this board at the draw alone.

## When the page looks wrong and nothing is reported

A warning can only name a case someone thought of, so when a page comes
out unlike Figma and the unsupported count is zero, what is missing is by
definition what nobody wrote a warning for. The **draw nothing** link in
the footer asks it the other way round and shows two things.

**The scene by node type**, and how many nodes of each type put nothing on
the canvas — no fill, stroke, path, image or text, and no children either.
A type whose nodes mostly draw nothing is where the content is being lost,
and it names a type rather than a layer, which is what makes it worth
counting. Image fills whose bytes are not in the file are counted too;
those paint as grey boxes.

**Fields this file carries that the reader never looks at.** Every field
the decoder found, minus the ones the converter reads, counted across the
file with an example layer. The ones known to change what you see are
named in plain language and sorted first — masks, blend modes, per-
character text styling, arcs, dash patterns — and the rest are listed by
name, because the useful one is often the one nobody has thought about
yet. `gallery/figma/src/FigFieldReport.rgr` holds both the list of fields
the converter reads and the notes.

## When something does not draw

The footer counts what the reader could not draw, and the count is a link
that lists the layers by id and name. Nothing is printed per node — a file
whose components are everywhere produces one warning per instance, and a
console line each would bury the file being read. What the categories mean:

| warning | what you see |
| --- | --- |
| `instance names a component that is not in the file` | an empty box — the component is in a library this file does not carry |
| `instance names a component with no children, and has nothing of its own to draw` | an empty box — and only reported when the instance really draws nothing; an instance of a single-shape component is normal and silent |
| `instance whose symbolData names no component` | an empty box — the block is there and holds no guid |
| `instance with only derived data (overrides), which is not read yet` | an empty box — the content is in `derivedSymbolData` and nothing else |
| `instance with no symbol fields at all` | an empty box — the node names nothing |
| `instances nested more than 15 deep` | the outer instances draw, the innermost do not |
| `boolean operation without geometry` | the shape is missing; Figma did not export a flattened path for it |
| `strokeAlign OUTSIDE` / `per-side stroke weights` | the stroke is drawn, in the wrong place or at one weight — reported only when the file did not bring `strokeGeometry`, since with it the stroke is exact |
| `letterSpacing` | the text draws, tracking ignored |

## What it draws

| Figma | SceneNode | EVG |
| --- | --- | --- |
| `CANVAS` / `PAGE` | container (page), `backgroundColor` | viewport background + children |
| `FRAME` / `GROUP` / `SECTION` | container | `div` |
| `COMPONENT` / `INSTANCE` | container (resolved children) | `div` |
| `RECTANGLE` | rect | `div` + background |
| `ELLIPSE` | ellipse | `path` |
| `LINE` | line | `path` |
| `VECTOR` / `STAR` / `POLYGON` | path | `path` `d="…"` |
| `TEXT` | text (+ glyph outlines) | `path`, or `span` without outlines |
| image fill | image | `img` |
| stroke with `strokeGeometry` | child path in the stroke colour | `path` |
| `STICKY` / `SHAPE_WITH_TEXT` | container + the layers the file built | `path` + `path` |
| `CONNECTOR` | container + line, cap and label layers | `path` + `path` |
| `TABLE` | container + a layer per cell background and cell text | `path` + `path` |

Also: local coordinates, opacity, visibility, solid / linear-gradient /
image fills, strokes, corner radius, clipping, drop shadow, basic text
styles, Auto Layout (row/column, gap, padding, align), nested hierarchy.

Out of scope for this version: prototype interactions, component properties,
variables, advanced effects, masks (logged, not fatal).

Unsupported features print:

```text
[figma-viewer] Unsupported letterSpacing (EVG has no letter-spacing) node: 1:3 "Title"
```

and the rest of the document still paints.

## Sample fixtures

The bundled sample has three pages: **Welcome**, **Palette**, and
**Fixtures**. Fixtures are one named frame per feature:

`01-basic-rect` … `15-gradient`, plus a line, a component and an instance.

`fixtures/health.fig` is a real Figma export: three phone screens built
with Auto Layout, text in Space Grotesk and Inter, an image, stroke-only
chart vectors and a background blur on the tab bars. `figma:test` and
`figma:web:test` both open it.

Same Figma bytes → same Scene JSON → same EVG dump.

## Benchmark

`npm run figma:bench` writes `gallery/figma/bench/out/last.json`.

Install `openfig-core` in the repo (or globally) to fill the OpenFig column.
The sample is stored-deflate so both sides skip zstd; a Figma export hits
zstd + a ~550-type schema on both.

## Layout

```text
gallery/figma/
  src/FigParser.rgr          ZIP → canvas → kiwi → FigDoc
  src/FigModel.rgr           typed Figma nodes
  src/convert/FigToScene.rgr Figma → SceneNode
  src/scene/                 format-agnostic IR + matrices + assets
  src/evg/SceneToEVG.rgr     SceneNode → EVGElement
  src/FigApp.rgr             viewer: pages, frames, pan/zoom, debug
  src/FigToEvg.rgr           leftover direct painter (unused by the viewer)
  tests/                     FigTest
  web/                       FigWeb + github.io page (+ clipboard.mjs)
  bench/                     Ranger vs openfig-core
  fixtures/                  sample.fig (generated), health.fig (Figma export)
```

**License: AGPL-3.0-or-later** (this directory is under `gallery/`), with
no third-party code left in it.
