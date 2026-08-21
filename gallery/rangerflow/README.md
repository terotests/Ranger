# RangerFlow — an interactive graph editor, and a schema designer on top of it

A React Flow-shaped node-graph core written entirely in Ranger, drawn through
**EVG** rather than the DOM, and rendered on the **GPU**. Its first real domain
is a database ER diagram / UML class editor, because that is the use case that
exercises every hard part of a graph editor at once — field-level ports, edge
routing, auto-layout, large graphs — and produces something worth having.

```text
                     RangerFlow core
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
  ERD editor           UML editor          (workflow, call graphs, …)
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            ↓
                        FlowScene
                            ↓
                           EVG
              ┌─────────────┼──────────────┐
          WebGL 2         PDF            SVG / HTML
```

![the schema editor, drawn by WebGL 2 in headless Chrome](artifacts/01_schema_editor_webgl.png)

## Run it

```bash
npm run rangerflow:test        # 137 assertions: model, forces, router, editor, SQL, export
npm run rangerflow:demo        # the e-commerce schema → SVG, PDF, HTML, JSON, scene
npm run rangerflow:uml         # the same pipeline for a UML class diagram
npm run rangerflow:force       # React Flow's force-layout example, in Ranger
npm run rangerflow:bench       # layout / scene / drag timings at 500 nodes
npm run rangerflow:web         # build the serverless WebGL page
npm run rangerflow:web:serve   # …and serve it on :8080
npm run rangerflow:web:test    # …or open it in headless Chrome and make it work
```

## Why a graph core and a schema editor are the same program

The core knows about nodes, ports and edges, and nothing else. It has never
heard of a table. What makes an ER diagram out of it is one file —
`domains/erd/SchemaToGraph.rgr` — that maps a `DatabaseSchema` onto that
vocabulary, and one primitive the core does carry: the **compartment node**.

```text
┌─────────────────────────────┐        ┌─────────────────────────┐
│ customers                   │ header │ Customer                │
├─────────────────────────────┤        ├─────────────────────────┤
│ PK id          INTEGER      │ rows   │ -  id      : int        │
│    email       VARCHAR   ●  │        │ -  email   : string     │
│ FK country_id  INTEGER   ●  │        ├─────────────────────────┤
├─────────────────────────────┤        │ +  save()  : void       │
│ UNIQUE(email)               │        └─────────────────────────┘
└─────────────────────────────┘
```

A header, then sections of rows, with a **port opposite any row that asks for
one**. That last part is the difference between an ER diagram and a flowchart
with table-shaped boxes: a foreign key does not join two boxes, it joins two
*columns*.

```text
orders.customer_id ●────────────● customers.id
```

The UML class diagram is the same primitive with different words in it, which
is the argument for keeping the core free of tables: `domains/uml/UMLModel.rgr`
is 250 lines, and most of them are the model rather than the drawing.

## The layers

| Layer | Files | What it is |
| --- | --- | --- |
| Model | `core/GraphModel.rgr` | nodes, ports, edges, compartments, viewport, selection, hit tests |
| Routing | `core/EdgeRouter.rgr` | bezier / step / smoothstep paths, arrow and crow's-foot decoration |
| Interaction | `core/FlowEditor.rgr` | pan, zoom, drag, box select, connect, resize, snap, undo/redo |
| Scene | `core/FlowView.rgr`, `core/FlowScene.rgr` | the picture, once, for four backends |
| Layout | `layout/ForceLayout.rgr`, `layout/LayeredLayout.rgr` | d3-force and a Sugiyama-style layered layout |
| Domains | `domains/erd/*`, `domains/uml/*` | schema and class models, and the two mappings |
| Export | `export/FlowExport.rgr` | PDF, HTML, SVG, scene JSON, graph JSON |

Everything above the scene is pure: no browser, no timers, no file system. That
is what lets `tests/RangerFlowTest.rgr` drive the editor exactly the way the
browser page does — `pointerDown`, `pointerMove`, `pointerUp` — and assert on
what came out.

## One scene, four backends

The EVG display-list note in [`../evg/gl/README.md`](../evg/gl/README.md) makes
the case: when five painters each walk the tree and decide again what a box
means, border-radius comes to work in PDF and silently not in PNG. A graph
editor is exactly the shape that goes wrong that way — the interactive renderer
wants flat quads sixty times a second, the exporter wants a laid-out document,
and nobody notices for a month that the printed diagram puts the crow's foot on
the other end.

So `FlowView` builds a `FlowScene` once, and the scene emits:

```text
FlowScene ──► EVGDisplayList ──► evg-webgl.js   (WebGL 2, SoftCanvas, SDL2)
          ──► EVGElement     ──► EVGPDFRenderer (PDF, with the fonts embedded)
                             ──► EVGHTMLRenderer(HTML)
          ──► toSvg()                           (SVG)
```

Every edge is built once as a path and consumed three ways — as an SVG `d`
string for the document backends, as a flattened polyline for the GPU and for
hit testing, and as a length and mid-point for placing a label. The PDF and the
editor cannot draw different lines because there is only one line.

**PDF is not a screenshot.** `export/FlowExport.rgr` hands the EVG tree to
`EVGPDFRenderer` with a `FontManager` loaded, so the text is real text in an
embedded TrueType face, measured by the same engine EVG lays out with:

```bash
npm run rangerflow:demo
# out/rangerflow-erd.pdf   — 1 page, A3 landscape, NotoSans embedded, selectable text
```

## The force layout is d3-force, on purpose

The benchmark this started from is React Flow's force-layout example, which is
`@xyflow/react` wired to `d3-force`. Matching it means matching the *model*, so
`layout/ForceLayout.rgr` reproduces d3's parameter names, defaults, alpha
schedule and velocity integration:

```text
alpha += (alphaTarget - alpha) * alphaDecay
forces apply, writing into node.vx / node.vy
x += (vx *= velocityDecay)          — unless the node is pinned
```

with `forceManyBody` on a Barnes–Hut quadtree (`w²/θ² < l²`), `forceLink` with
d3's degree-derived strength and bias, `forceX`/`forceY`, `forceCollide` and
`forceCenter`. Even d3's LCG is reproduced value for value, so the jiggle that
separates coincident nodes is reproducible across runs, machines and target
languages — a layout that moves when nothing changed cannot be regression
tested. `npm run rangerflow:force` settles in **300 ticks**, which is what d3's
default `alphaDecay` gives you.

What is *not* d3: the quadtree's extent is the squared bounding box of all the
points rather than d3's doubling cover. The Barnes–Hut criterion is the same,
so approximations happen at very nearly the same places, but this is not
bit-for-bit d3 and does not claim to be.

Dragging pins the node through `fx`/`fy` exactly as the example does — the
simulation may not move what your hand is holding.

## Feature parity

The comparison worth making is **behaviour**, not DOM-versus-EVG pixels. See
[`docs/FEATURES.md`](docs/FEATURES.md) for the full matrix against React Flow
and against `db-schema-viewer` (MIT), including what is not done yet.

Short version — implemented: pan, zoom at cursor, node drag, multi-node drag,
rectangle selection, `Ctrl+A`, `Delete`, port-level connections with validity
and connection limits, node resizing, snap to grid, minimap, fit to screen,
undo/redo, viewport culling, background variants, four edge types, crow's foot
/ UML / plain notation switching, light and dark themes.

Not done: dummy-node routing for long edges, edge reconnection by dragging an
end, sub-flows (`parentId` is carried but not enforced), and a live database
inspector — the schema comes from SQL DDL or JSON today.

## Performance

`npm run rangerflow:bench -- 500`, Node 22 in this container:

| Step | 500 nodes / 570 edges |
| --- | --- |
| force layout, 300 ticks | 265 ms |
| layered layout | 7 ms |
| scene build, fit to screen | 13 ms (303 of 500 nodes drawn, 197 culled) |
| scene build, 1:1 zoom | 15 ms (25 drawn, 475 culled) |
| display-list JSON | 55 ms / 568 KB |
| node drag, 60 frames | 184 ms — **3.1 ms/frame** |

Culling is the number to watch: React Flow renders only what the viewport
contains, and with no DOM to do it for us `FlowView` drops off-screen nodes
while building and reports how many, so a benchmark can see the difference
rather than take it on faith.

## The browser page

`npm run rangerflow:web` produces a static directory: an HTML file, one
compiled script, the shared `evg-webgl.js`, three font files and a `.sql`.
There is no host process — Ranger compiles to JavaScript, so the editor simply
*is* in the page:

```text
hosted                                  standalone
browser event → POST → app              browser event → FlowEditor    (this tab)
GET /scene.json → list → GL             app.frame() → list → GL       (this tab)
```

A `.sql` you open with the file picker is read in the tab and never uploaded.

**Is it really WebGL?** "webgl2" is a label the page writes about itself, so
`npm run rangerflow:web:test` checks the facts under it: that the context is a
`WebGL2RenderingContext`, that it has the stencil buffer a filled path needs,
that the scene left GL draw calls behind, and that no fill was skipped. It also
drives a scripted session inside the page — select a table, drag it, undo,
select all — and writes the verdict where headless Chrome's `--dump-dom` reads
it back. There is no browser-driver library here, so the page tests itself.

## Importing a schema

```bash
# any CREATE TABLE dump; the reader takes the DDL subset that carries shape
node gallery/rangerflow/bin/rangerflow_demo.js
```

`domains/erd/SqlSchemaReader.rgr` reads tables, column types and nullability,
primary keys, unique constraints, checks, indexes, and foreign keys — inline
`REFERENCES`, table-level `FOREIGN KEY`, and the `ALTER TABLE … ADD CONSTRAINT`
form most dumps actually use. It tolerates backtick / bracket / double-quote
quoting, `IF NOT EXISTS` and schema-qualified names, and skips what it does not
understand rather than failing on it.

Cardinality is inferred rather than declared: a foreign key is many-to-one
unless the columns it starts from are unique, and optional when they are
nullable. That single rule is what turns

```sql
CREATE TABLE payments (order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id));
```

into a one-to-one, and it is drawn as crow's foot, UML or a plain arrow without
the model changing a byte — the notation is a rendering choice, made in
`EdgeDecoration`.

The repository already has a full SQL parser in [`../rangersql`](../rangersql);
when the two meet, this reader becomes a thin adapter over that AST.

## Where it goes next

1. **Dummy-node edge routing** so an edge spanning four layers is routed around
   what is in the way rather than through it.
2. **A live schema inspector** behind one interface, so DuckDB, SQLite and
   RangerDB can all answer "what tables do you have" and the editor cannot tell
   which one did.
3. **ERD → SQL**: the model is already the right shape for a `CREATE TABLE`
   generator, which turns the viewer into a designer.
4. **SDL2 + OpenGL**, which the display-list seam already makes possible — the
   scene compiles to C++ with everything else.
