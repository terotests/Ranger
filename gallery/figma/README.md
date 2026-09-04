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
[`openfig-core`](https://github.com/OpenFig-org/openfig-core). Zstd on the
JavaScript target is [fzstd](https://github.com/101arrowz/fzstd) (MIT).

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
| letter-spacing | **no** — warning, dominant style still paints |
| dedicated ellipse tag | **no** — emit an SVG path |

Normal frames emit absolute boxes. Auto Layout frames emit flex. Viewport
pan/zoom is one root `translate * scale`, not a rewrite of node geometry.

## Try it

```bash
npm run figma:test          # kiwi + sample .fig + scene IR + viewer
npm run figma:web           # static page → gallery/figma/web/standalone/dist
npm run figma:web:serve     # http://localhost:8010
npm run figma:inspect       # dump the bundled sample
npm run figma:bench         # Ranger vs openfig-core (if installed)
```

Paste a Figma selection (`Ctrl/Cmd+V` or **Paste**). Figma writes `text/html`
with `<!--(figma)…(/figma)-->` — that payload is a `fig-kiwi` canvas, the
same bytes as `canvas.fig` inside a `.fig` ZIP. **Copy** writes that format
back (Ranger's own schema, so Figma may not accept every paste; the viewer
round-trips it).

Drop a real `.fig` on the page, or:

```bash
node gallery/figma/bin/fig_cli.js inspect path/to/file.fig
```

## What it draws

| Figma | SceneNode | EVG |
| --- | --- | --- |
| `CANVAS` / `PAGE` | container (page) | viewport children |
| `FRAME` / `GROUP` / `SECTION` | container | `div` |
| `COMPONENT` / `INSTANCE` | container (resolved children) | `div` |
| `RECTANGLE` | rect | `div` + background |
| `ELLIPSE` | ellipse | `path` |
| `LINE` | line | `path` |
| `VECTOR` / `STAR` / `POLYGON` | path | `path` `d="…"` |
| `TEXT` | text | `span` |
| image fill | image | `img` |

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

Same Figma bytes → same Scene JSON → same EVG dump.

## Benchmark

`npm run figma:bench` writes `gallery/figma/bench/out/last.json`.

Install `openfig-core` in the repo (or globally) to fill the OpenFig column.
The sample is stored-deflate so both sides skip zstd; a Figma export hits
zstd + a ~550-type schema on both.

## Layout

```text
gallery/figma/
  src/FigClipboard.rgr       Figma text/html paste (figmeta + fig-kiwi)
  src/FigParser.rgr          ZIP / canvas.fig / clipboard HTML → FigDoc
  src/FigModel.rgr           typed Figma nodes
  src/convert/FigToScene.rgr Figma → SceneNode
  src/scene/                 format-agnostic IR + matrices + assets
  src/evg/SceneToEVG.rgr     SceneNode → EVGElement
  src/FigApp.rgr             viewer: pages, frames, pan/zoom, debug
  src/FigToEvg.rgr           leftover direct painter (unused by the viewer)
  tests/                     FigTest
  web/                       FigWeb + github.io page
  bench/                     Ranger vs openfig-core
  fixtures/                  sample.fig (generated)
```

**License: AGPL-3.0-or-later** (this directory is under `gallery/`).
`web/vendor/fzstd.mjs` stays MIT (`LICENSE-fzstd`).
