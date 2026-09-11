# D2 — the feature matrix, before a line of reader is written

D2 ([d2lang.com](https://d2lang.com), [terrastruct/d2](https://github.com/terrastruct/d2))
is **MPL-2.0**, written in Go, and installs in one command. That answers the
question this matrix exists to answer: *is there an open-source reference to
measure against?* There is, and it is a better one than either format already
read here — see [`PLAN_D2.md`](PLAN_D2.md) §2.

**Where the left column comes from.** Not from the website. `d2lang.com` is
unreachable from this machine (the egress proxy blocks it), which turned out to
be the right accident: every row below is D2's own table, printed by D2 —
`d2ast.ReservedKeywords`, `d2target.Shapes`, `d2target.Arrowheads`,
`d2ast.FillPatterns`, `d2ast.TextTransforms`, `d2ast.NearConstantsArray` — and
every construct was compiled by **d2 v0.7.1** before it was written down:

```
npm run rangerflow:d2:oracle
  d2 v0.7.1: 20/20 fixtures accepted, 139 shapes and 58 connections laid out
  by dagre and elk, 46 keywords, 25 shapes, 11 arrowheads
```

**Where the right column comes from.** `core/`, `layout/` and `export/` as they
stand today, with the probe or the file that says so. The question each row
answers is: *when the reader hands this to the pipeline, can the pipeline
already draw it?*

**The reader exists** — `domains/d2/D2Parser.rgr` and `domains/d2/D2Model.rgr`,
scored against D2 itself at **103/103 checks over the 20 files in
`fixtures/d2/`** ([`D2_PARITY.md`](D2_PARITY.md)) — and so does the drawing:
`domains/d2/D2Flow.rgr` turns a board into a `FlowGraph`, containers and all,
and `npm run rangerflow:d2` writes the SVG, the PDF, the HTML and the scene.
What is still missing is listed row by row below, and the five gaps are
summarised at the end.

Status keys: **✓** the pipeline has it · **~** it has something narrower, and
the row says what · **·** it does not have it.

---

## 1. Syntax — what the parser must accept

**All of it is read**, and every row is asserted in `tests/RangerFlowTest.rgr`.
The middle column is what the *pipeline* does with it once a `FlowGraph` is
being built.

| D2 | RangerFlow pipeline | Reader |
| --- | :---: | --- |
| Keys and nested maps: `a: { b: { c } }` | ✓ | the tree is `parentId`, which sub-flows already carry |
| Dot paths: `a.b.c: label` | ✓ | path → the same node the map form makes |
| Connections `->` `<-` `--` `<->` | ✓ | direction and `markerStart`/`markerEnd` |
| Chains: `a -> b -> c -> d` | ✓ | n-1 edges |
| Connection index: `(a -> b)[0].style.stroke` | ✓ | edges are ordered; index them on read |
| Labels: `a: text`, `a -> b: text` | ✓ | `FlowNode.label`, `FlowEdge.label` |
| Quoted strings, single and double | ✓ | lexer |
| Block strings: `&#124;md ... &#124;`, `&#124;go ... &#124;`, custom delimiters | ~ | the text is carried; §6 has what is drawn |
| Comments `#` and block comments `"""` | ✓ | lexer |
| `vars` and `${substitution}` | ✓ | resolved before the graph is built |
| `classes` and `class: name` | ✓ | `cssClass` plus the style fields |
| Globs `*`, `**` and filters `&shape: circle` | ✓ | a selector pass over the model |
| Imports `@file` and spreads `...@file` | ✓ | one file resolver, path-confined like PlantUML's `!include` |
| `suspend` / `unsuspend` | ✓ | the object is dropped from the board |

## 2. Shapes — every value of `shape`, as `d2target.Shapes` lists them

| D2 shape | RangerFlow | Note |
| --- | :---: | --- |
| `rectangle` | ✓ | `rect` |
| `square` | ~ | `rect` with the aspect forced |
| `page` | ✓ |  |
| `parallelogram` | ✓ | |
| `document` | ✓ | |
| `cylinder` | ✓ | |
| `queue` | ✓ |  |
| `package` | ✓ |  |
| `step` | ✓ | the chevron |
| `callout` | ✓ | bubble and tail |
| `stored_data` | ✓ |  |
| `person` | ✓ | head and shoulders, as one silhouette |
| `c4-person` | ✓ | an outlined head over a rounded body, the way C4 draws one |
| `diamond` | ✓ | |
| `oval` | ✓ | `ellipse` |
| `circle` | ✓ | |
| `hexagon` | ✓ | |
| `cloud` | ✓ | five overlapping lobes, joined at the crossings; `MermaidArchReader` still approximates its own with an ellipse |
| `text` | ✓ | label-only node |
| `code` | ~ | the text is drawn; no monospace block, no highlighting |
| `class` | ✓ | compartment node — `domains/uml/UMLModel.rgr` |
| `sql_table` | ✓ | compartment node — `domains/erd/`, with PK/FK badges and row ports |
| `image` | · | the scene has no image primitive (`RIVALS.md` says so too) |
| `sequence_diagram` | ✓ | `core/SeqDiagram.rgr` |
| `hierarchy` | · | a layout, not an outline |

**The nine are drawn.** They were added to `core/FlowShapes.rgr` as part of the
D2 work — one ring of points each, so they arrive in the SVG, the PDF, the HTML
and the GPU scene by the road the rectangles took, and they are held to the
same two rules as every other outline in `testShapes`: inside its own box, and
enclosing its own middle. What is left is an image primitive and a layout.

## 3. Connections

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| Arrowheads: `arrow` `triangle` `diamond` `circle` `box` `cross` `none` | ✓ | markers, both ends |
| Filled variants (`style.filled` on triangle, diamond, circle) | ✓ | open and closed markers exist |
| Crow's foot: `cf-one` `cf-many` `cf-one-required` `cf-many-required` | ✓ | the ERD notation, cardinality and optionality |
| Arrowhead labels (`source-arrowhead.label`) | ✓ | `sourceCardinality` / `targetCardinality` |
| Connection label | ✓ | boxed, at the mid-point |
| `stroke`, `stroke-width`, `stroke-dash` | ✓ | `strokeColor`, `strokeWidth`, `dash` |
| `animated` | ✓ | `FlowEdge.animated` |
| `border-radius` on a connection | ✓ | smoothstep / rounded corners |
| Self loops | ✓ | |
| Container-to-container connections | ✓ | edges between group nodes |
| Several connections between the same pair | ✓ | lane separation keeps them apart |

## 4. Styles — the twenty `style` keywords

Eighteen rows for twenty keywords: `bold`, `italic` and `underline` share one.

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| `fill` | ✓ | `bgColor` |
| `stroke` | ✓ | `borderColor` |
| `stroke-width` | ✓ | `borderWidth` |
| `stroke-dash` | ~ | edges have `dash`; a node outline does not |
| `border-radius` | ✓ | |
| `opacity` | ~ | the renderer has it; it is not a node or edge field |
| `fill-pattern` (`dots` `lines` `grain` `paper`) | · | four fills to add, or refuse |
| `font-size` | ✓ | `fontScale` |
| `font-color` | ✓ | `textColor` |
| `font` (`mono`) | ~ | the exporters know a font family; the node does not choose one |
| `bold` / `italic` / `underline` | ~ | edge and section text can; a node label cannot |
| `text-transform` | · | a text pass, cheap |
| `shadow` | ~ | the stylesheet has a shadow; not per node |
| `multiple` | ~ | `multidocument` stacks; a generic stacked outline is new |
| `double-border` | · | new |
| `3d` | · | new; only `square` and `rectangle` take it in D2 |
| `animated` (connections) | ✓ | |
| `filled` (arrowheads) | ✓ | |

## 5. Containers, position and layout

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| Containers and nesting | ✓ | sub-flows with real parenting; a dragged parent carries its children |
| Container labels | ✓ | group node header |
| `direction: up / down / left / right` | ✓ | the layered layout takes a direction |
| `near` constants (8, e.g. `top-center`) | ~ | a node can be placed; there is no "pin to the diagram corner" rule |
| `near: some.shape` | · | a relative-placement pass |
| `top` / `left` | ✓ | `x` / `y` |
| `width` / `height` | ✓ | |
| `constraint` | ✓ | ERD constraints (PK, FK, unique) |
| Grid diagrams (`grid-rows`, `grid-columns`, `grid-gap`, `vertical-gap`, `horizontal-gap`) | · | a row/column packing layout, new in `layout/` |
| Layout engines: dagre, ELK | ~ | our own layered (Sugiyama) layout, measured against React Flow and d3-force — not dagre's geometry |
| `hierarchy` shape | · | a tree layout exists (`layout/TreeLayouts.rgr`); the shape's own rules do not |

## 6. Content that is not a label

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| `sql_table` columns with `constraint` | ✓ | the ERD compartment node, PK/FK badges, per-row ports |
| `class` fields and methods with visibility | ✓ | `domains/uml/UMLModel.rgr` |
| `sequence_diagram`: messages, spans, groups, notes, self edges | ✓ | `core/SeqDiagram.rgr`, already driven by two dialects |
| Markdown labels (`&#124;md ... &#124;`) | ~ | multi-line text and wrapping, no headings, lists or inline bold |
| Code blocks (`&#124;go ... &#124;`) | ~ | drawn as text; no mono block, no highlighting |
| LaTeX (`&#124;latex ... &#124;`) | · | no formula renderer; the honest move is to draw the source |
| `icon` (a URL) | · | no image primitive; Mermaid's icons are mapped to outlines today |
| `tooltip` | ✓ | and silent when there is nothing to say |
| `link` | · | no href on a node |

## 7. Boards

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| `layers` | · | one graph at a time; boards are a model change |
| `scenarios` (inherit, then override) | · | as above, plus the inheritance rule |
| `steps` (cumulative) | · | as above |
| `--target`, `--animate-interval` | · | a viewer concern; the export layer would pick it up |

The board model is the one structural idea in D2 that the pipeline has no
answer to at all. It is also separable: a reader that drops every non-root
board still reads the root board correctly, which is what `--target=''` does.

## 8. Output

| D2 | RangerFlow | Note |
| --- | :---: | --- |
| SVG | ✓ | `export/FlowExport.rgr` |
| PNG | ✓ | through the web build's screenshots |
| PDF | ✓ | |
| ASCII / text render | · | D2 draws a real box-and-line ASCII diagram |
| PPTX, GIF | · | not this repository's business |
| Themes (18 light, 2 dark) | ~ | one theme object, light and dark, read by renderer and exporters |
| Sketch mode (hand-drawn look) | · | |
| Font control | ~ | the exporters take a family; there is no per-shape font |

---

## What the matrix says

| Section | ✓ | ~ | · | rows |
| --- | ---: | ---: | ---: | ---: |
| 1 Syntax | 13 | 1 | 0 | 14 |
| 2 Shapes | 21 | 2 | 2 | 25 |
| 3 Connections | 11 | 0 | 0 | 11 |
| 4 Styles | 8 | 6 | 4 | 18 |
| 5 Containers and layout | 6 | 2 | 3 | 11 |
| 6 Content | 4 | 2 | 3 | 9 |
| 7 Boards | 0 | 0 | 4 | 4 |
| 8 Output | 3 | 2 | 3 | 8 |
| **Total** | **66** | **15** | **19** | **100** |

The nine that moved are the shapes: `page`, `queue`, `package`, `step`,
`callout`, `stored_data`, `person`, `c4-person` and `cloud` are outlines now,
not stand-ins.

Five real gaps, and only two of them are large:

1. **Boards** (`layers` / `scenarios` / `steps`) — a model change, not a
   drawing change. Large.
2. **Grid diagrams** — a new layout in `layout/`. Medium.
3. ~~**Nine shape outlines**~~ — done, in `core/FlowShapes.rgr`. What is left
   of this row is small and cosmetic: `fill-pattern`, `double-border`, `3d`
   and `text-transform`.
4. **An image primitive**, which `icon`, `image` and `RIVALS.md`'s missing
   JointJS row all want. Medium, and it pays for three rows at once.
5. **Rich labels** — markdown, code and LaTeX. The Creole work planned for
   PlantUML ([`PLAN_PLANTUML.md`](PLAN_PLANTUML.md) §1) is the same machinery:
   styled runs measured by `FlowText`. Shared, not duplicated.

Everything else the pipeline already draws. That is the finding: **the D2
reader is mostly a parser**, because D2's model — objects, connections,
containers, styles — is the model RangerFlow already has.

## What this matrix is not

It is not the parity score. [`D2_PARITY.md`](D2_PARITY.md) is, and it measures
a different thing: what the **reader** understood, computed by D2 itself the
way [`MERMAID_PARITY.md`](MERMAID_PARITY.md) and
[`PLANTUML_PARITY.md`](PLANTUML_PARITY.md) are. This file is the wider,
hand-written picture of what the **pipeline** can draw, and the rows below §1
are still a forecast until `D2Flow` exists. Where the two disagree, the
measured one is right.
