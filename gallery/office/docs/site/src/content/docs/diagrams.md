---
title: Diagrams
description: Ranger Flow is a graph editor on EVG and WebGL. Database ER diagrams, UML, flowcharts and more. There is no published API yet.
---

Ranger Flow is a React Flow-shaped node graph written in Ranger, drawn
through [EVG](/Ranger/office/reference/evg/) rather than the DOM, and rendered on
the GPU. Its first domain is a database ER diagram / UML class editor,
because that use exercises field-level ports, edge routing, auto-layout and
large graphs at once.

There is **no published API** yet. There is no `gallery/rangerflow/api/`
facade. This page names the demos and the source.

```text
                 RangerFlow core
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
  ERD editor       UML editor        flowchart, org,
                                      process, mind map
      │                 │                 │
      └─────────────────┼─────────────────┘
                        ▼
                    FlowScene
                        ▼
                       EVG
          ┌─────────────┼──────────────┐
      WebGL 2         PDF            SVG / HTML
```

## Demo

Ranger Flow is **not** on the GitHub Pages site yet. Build it locally:

```bash
npm run rangerflow:demo:web     # build the page, serve it, open a browser
npm run rangerflow:web:serve    # the same without opening a browser
npm run rangerflow:web:test     # all demos in headless Chrome
npm run rangerflow:sdl:run      # the same editor in an SDL2 + OpenGL window
```

The page is one editor with different graphs. The `demo` dropdown switches
between them. `?scenario=` picks one on load:

| Scenario | What it is |
| --- | --- |
| `erd` | A 9-table database schema from `fixtures/ecommerce.sql`, crow's foot, field-level ports |
| `uml` | A UML class diagram — the same compartment node with different words |
| `force` | React Flow's force-layout example, live |
| `flow` | A plain flowchart — the core with no domain on top |
| `atk` | An ATK chart in ISO 5807 shapes |
| `org` | An organisation chart |
| `process` | A swimlane process — drag a lane and its steps come with it |
| `mindmap` | Branches balanced either side of the root |
| `radial` | The same graph as a radial tree |
| `activity` | A UML activity diagram |

Drag to pan, wheel to zoom, two fingers to scroll, pinch to zoom, shift-drag
to box select, drag or click a handle to connect, right-click for a menu.
`Delete`, `Ctrl+Z`, `f` to fit. **Download SVG** exports the view. **Open
.sql** reads a schema in the tab. Nothing is uploaded.

## Other outputs

```bash
npm run rangerflow:demo         # e-commerce schema → SVG, PDF, HTML, JSON
npm run rangerflow:uml
npm run rangerflow:flowchart
npm run rangerflow:org
npm run rangerflow:process
npm run rangerflow:force
```

PDF export is the same EVG PDF path the rest of the gallery uses.

## Tests

```bash
npm run rangerflow:test         # model, forces, router, editor, SQL, export
npm run rangerflow:parity       # score against React Flow
npm run rangerflow:rivals       # JointJS and Syncfusion
```

Parity notes live in
[`gallery/rangerflow/docs/PARITY.md`](https://github.com/terotests/Ranger/blob/master/gallery/rangerflow/docs/PARITY.md).
Features live in
[`gallery/rangerflow/docs/FEATURES.md`](https://github.com/terotests/Ranger/blob/master/gallery/rangerflow/docs/FEATURES.md).

## Source

| Path | Role |
| --- | --- |
| [`gallery/rangerflow/`](https://github.com/terotests/Ranger/tree/master/gallery/rangerflow) | Core, editors, web host, fixtures |
| [`gallery/rangerflow/README.md`](https://github.com/terotests/Ranger/blob/master/gallery/rangerflow/README.md) | Runbook and architecture |

A published facade, when it exists, will follow the PowerPoint pattern: a
headless scene reader and writer, documented on this site from the comments
above the declarations.
