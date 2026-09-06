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

An `INSTANCE` carries no children. It names a component by guid in
`symbolID`, and Figma draws that component's subtree in its place. A
reader that stops at the node draws an empty box wherever a file uses
components — which is most files — so `FigToScene` looks the component up
and converts its children under the instance's transform. Overrides
(`derivedSymbolData`) are not applied: an overridden instance shows the
component's own text and colours, which is a wrong string rather than a
missing subtree. Expansion stops at fifteen levels.

## When something does not draw

The footer counts what the reader could not draw, and the count is a link
that lists the layers by id and name. Nothing is printed per node — a file
whose components are everywhere produces one warning per instance, and a
console line each would bury the file being read. What the categories mean:

| warning | what you see |
| --- | --- |
| `instance names a component that is not in the file` | an empty box — the component is in a library this file does not carry |
| `instance names no component` | an empty box — the node has neither children nor a `symbolID` |
| `instances nested more than 15 deep` | the outer instances draw, the innermost do not |
| `boolean operation without geometry` | the shape is missing; Figma did not export a flattened path for it |
| `strokeAlign OUTSIDE` / `per-side stroke weights` | the stroke is drawn, in the wrong place or at one weight |
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
