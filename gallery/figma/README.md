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
```

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
| `symbolData.symbolID` | what a Figma export writes — nested, not on the node |
| `symbolID` on the node | the REST API, and this repository's sample |
| `overriddenSymbolID` | an instance swapped for a different component |

All three are read, in that order. Expansion stops at fifteen levels, so
a cycle is a warning and not a hang.

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

The diagnostics count them: overrides seen, applied, and how many named a
node their component does not have. Seen above applied means the
placeholders are still showing and the reason is a path that did not
match, which is a different fault from having no overrides at all.

## Moving around

Drag with any button to pan, scroll to zoom, or use the `−` / `+` buttons;
the readout between them shows the zoom and is the button that returns to
100%. Zoom is anchored on the pointer, so the point under the cursor stays
where it is instead of the page sliding toward the origin.

Input is applied once per animation frame, not once per event. Both
`setView` and `draw` are expensive — the first rebuilds the display list
in Ranger, the second serialises the whole scene to JSON and back — and a
wheel flick arrives far faster than a frame, so applying each event as it
landed made the queue grow while the same work was redone. Forty wheel
events in one task now cost one rebuild and one paint.

Wheel deltas are normalised before use: Firefox reports lines and Chrome
pixels, one notch arriving as 3 or as 100, and a line is counted as 33
pixels so that a notch is 1.16x in both.

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
