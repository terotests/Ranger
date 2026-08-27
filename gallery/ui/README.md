# gallery/ui — React-shaped UI on EVG

Reusable UI kit for Ranger Gallery applications. Components are authored against
a **React-compatible API** (`createElement`, `Fragment`, `useState`, host tags
`View` / `Text` / `Button` / `Image`). The **render target is always EVG** —
WebGL, SDL+OpenGL, SoftCanvas, PDF and HTML painters stay unchanged.

**License: AGPL-3.0-or-later** (Gallery).

## Why

Ranger already has EVG layout, JSX→EVG for documents (`pdf_writer`), and an
interactive game `UILayer`. What was missing is a **reusable component library**
with a React-shaped surface so:

1. The same component idea can be tried under **real React** (DOM) or under
   **Ranger’s React API** (EVG).
2. Apps (editors, forms, tools) share primitives instead of hand-building
   `EVGElement` trees.
3. EVG’s XML authoring path (`SPEC.md`) and the React tree meet at one IR.

## Architecture

```
  TSX / createElement / EVG XML
           │
           ▼
     RgElement tree          ← React-shaped virtual DOM
           │
           ▼
     Renderer.expand()       ← function components + hooks
           │
           ▼
     EVGBridge.toEVG()       ← EVGElement tree
           │
           ▼
     EVGLayout → EVGDisplayList
           │
     ┌─────┼──────────────┐
     ▼     ▼              ▼
  WebGL   SDL+GL     SoftCanvas / PDF / HTML
```

| Module | Role |
| --- | --- |
| `src/RgElement.rgr` | Virtual element + props |
| `src/ReactAPI.rgr` | `createElement`, `Fragment`, component registry |
| `src/Hooks.rgr` | Minimal `useState` / dispatcher |
| `src/Renderer.rgr` | Expand components → `renderToEVG` |
| `src/EVGBridge.rgr` | `RgElement` → `EVGElement` |
| `src/XmlToRg.rgr` | EVG XML (`XmlCore`) → `RgElement` |
| `src/components/Primitives.rgr` | `View`, `Text`, `Button`, `Image` |
| `react/` | TypeScript types + DOM dual-host adapters |

## React API compatibility

| React | Ranger `gallery/ui` |
| --- | --- |
| `createElement(type, props, ...children)` | `ReactAPI.createElement(typeName, props, children)` |
| `Fragment` | `ReactAPI.Fragment(children)` / type `"Fragment"` |
| `useState(init)` | `HookDispatcher.useState(init)` (string MVP) |
| `<div>` / `<span>` | host tags `"div"` / `"span"` (also `View` / `Text`) |
| Function components | `RgComponent` subclasses registered by name |

Compiled JS keeps the same names (`createElement`, `View`, `Text`, …) so a
component module can swap:

```ts
// Try under real React (DOM):
import { createElement, useState } from "react";
import { View, Text } from "@ranger/ui/react";

// Try under Ranger → EVG (after compiling gallery/ui):
import { createElement, useState, View, Text } from "./ranger-ui-runtime.js";
```

See `react/README.md` for the dual-host convention.

## Quick start

```bash
# Compile + run unit tests
npm run ui:test

# Or manually:
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./gallery/ui/tests/ReactAPITest.rgr \
  -d=./gallery/ui/bin -o=ReactAPITest.js -nodecli \
  && node ./gallery/ui/bin/ReactAPITest.js
```

## Example (Ranger)

```ranger
def r (new Renderer())
Primitives.install(r.api)

def titleKids:[RgElement]
push titleKids (RgElement.textNode("Hello"))
def title (r.api.createElement("Text" (ReactAPI.emptyProps()) titleKids))

def kids:[RgElement]
push kids title
def names:[string]
push names "padding"
push names "backgroundColor"
def values:[string]
push values "20px"
push values "#3498db"
def root (r.api.createElement("View" (RgProps.fromPairs(names values)) kids))

def evg:EVGElement (r.renderToEVG(root))
; then EVGLayout + your painter (WebGL / SDL / SoftCanvas)
```

## XML path

```xml
<div width="400" height="300" background-color="#ffffff">
  <span font-size="24" color="#111111">Hello, EVG!</span>
</div>
```

```ranger
def tree:RgElement ((new XmlToRg()).parse(xml))
def evg:EVGElement ((new EVGBridge()).toEVG(tree))
```

## What this is not (yet)

- Full React Fiber / concurrent features / `useEffect` / context
- Event system wired to SDL/WebGL (use `UILayer` / host hit-testing; `onClick`
  is stored as a hint today)
- CSS-in-JS or a design-token theme package

Roadmap: [`PLAN.md`](PLAN.md).

## Related

- [`gallery/evg/`](../evg/) — layout + display list
- [`gallery/pdf_writer/src/jsx/`](../pdf_writer/src/jsx/) — TSX interpreter for documents
- [`gallery/game_engine/ui/`](../game_engine/ui/) — interactive HUD widgets
- [`gallery/rangerforms/`](../rangerforms/) — form engine (can consume this kit later)
