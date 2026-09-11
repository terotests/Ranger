# D2 in RangerFlow — is it worth it, and what would it take

Status: **read, drawn, and in the editor.** `D2Parser` and `D2Model` read the language —
objects, connections, styles, vars, classes, globs and filters, suspensions,
table rows and class members, sequence-diagram scoping, boards and imports —
and `npm run rangerflow:d2:parity` scores that against D2 itself: **256/256
checks over the 41 files in `fixtures/d2/`** ([`D2_PARITY.md`](D2_PARITY.md)).
`D2Flow` then draws it: `npm run rangerflow:d2` writes the SVG, the PDF, the
HTML and the GPU scene, with containers as nested layouts and D2's nine
missing outlines added to the shape library. `?scenario=d2` in the web editor
is the same reader with a textarea in front of it — seven examples, live
redraw, and the page's own self test walking it like every other scenario.

The parser came first on purpose — it is the part that can be wrong in ways a
picture hides — and the drawing came last, which is the order this plan was
written in.

Every number below was produced by **d2 v0.7.1** on this machine, not read off
a website — `d2lang.com` is blocked by the egress proxy here, which forced the
denominator to come from D2's own source and binary instead.

```text
  .d2 text
      ↓
  D2Parser          keys · maps · edges · block strings · globs · imports    ✅
      ↓
  D2Model           objects · connections · styles · boards                  ✅
      ↓                                            ← scored against D2: 256/256
  D2Flow            → FlowGraph · containers as nested layouts               ✅
      ↓
  the pipeline that already exists: LayeredLayout · ReadableRouter · EVG
      ↓
  WebGL 2 · SVG · PDF · HTML
```

Nothing below `D2Flow` learns that D2 exists — the rule the Mermaid and
PlantUML readers already follow.

---

## 1. The question that was asked

*Is there an open-source reference library?* Yes, and it is the best of the
three.

| | Licence | Language | Oracle | Installs with |
| --- | --- | --- | --- | --- |
| Mermaid | MIT | JS | its parse database | `npm install mermaid` |
| PlantUML | GPL-2.0-or-later | Java | its annotated SVG | a 22 MB jar from Maven |
| **D2** | **MPL-2.0** | **Go** | **`d2target.Diagram`, as JSON** | `go install oss.terrastruct.com/d2@v0.7.1` |

MPL-2.0 is file-level copyleft. It is a weaker obligation than PlantUML's GPL
and it is not triggered here at all: D2 is fetched by the Go toolchain, built
into a separate binary, and run as a subprocess. No D2 source is copied into
this repository — not a grammar, not a keyword table. What the reader will know
about D2 it learns from D2's observable behaviour and from the tables the
oracle prints.

## 2. Why D2's oracle is better than the two we have

PlantUML has to be read off an annotated SVG and Mermaid off a parse database
that says nothing about geometry. D2 hands back the whole answer:

```bash
$ npm run rangerflow:d2:oracle
  d2 v0.7.1: 20/20 fixtures accepted, 139 shapes and 58 connections laid out by
  dagre and elk, 46 keywords, 25 shapes, 11 arrowheads
```

`harness/out/d2.json`, for `fixtures/d2/02_containers.d2`:

```json
{ "id": "network.tower.satellites", "type": "stored_data",
  "pos": { "x": 60, "y": 287 }, "width": 130, "height": 66,
  "label": "satellites", "level": 3, "multiple": true }
{ "src": "network.tower.satellites", "dst": "network.tower.transmitter",
  "label": "send", "srcArrow": "none", "dstArrow": "triangle",
  "route": [ {"x":125,"y":353}, {"x":125,"y":401.4}, {"x":125,"y":425.7}, {"x":125,"y":474.5} ] }
```

and, without any extra work, `sql_table` columns with their constraints,
`class` fields and methods with their visibility, and the boards that `layers`,
`scenarios` and `steps` created, nested as diagrams of their own. That is
structure **and** geometry from one call, for two layout engines.

Both engines are bundled and both are open source: `d2 layout` reports *dagre
(bundled)* and *elk (bundled)*. TALA, the engine Terrastruct sells the product
around, ships as a separate plugin binary and is not in `d2 v0.7.1`; D2's blog
announces it as MPL-2.0 now, which is worth re-checking if orthogonal layout
ever becomes interesting here.

## 3. What we would score, and what we would not

Geometry is available, and scoring it would be the wrong thing. RangerFlow has
its own layered layout, measured against React Flow's and d3-force's own
functions to two thousandths of a pixel ([`PARITY.md`](PARITY.md)). Comparing
its output to dagre's would measure two layouts, not one reader — the same
reason `mermaid-parity.mjs` scores no geometry.

So three tiers, and only the first two are the score:

- **Tier A — structure.** Object ids and their nesting, labels, shape values,
  connections with their ends and their arrowheads. The oracle's
  `shapes[].id/type/label/level` and
  `connections[].src/dst/srcArrow/dstArrow/label`.
- **Tier B — semantics.** The styles a file actually set, on objects and on
  connections; a shape's tooltip, link, icon and insisted-on size;
  `sql_table` columns and constraints, `class` fields and visibility; and the
  board tree a file declares, compared by the ids on each board rather than by
  a count.
- **Tier C — layout agreement, reported not required.** Same relative order:
  for each connection, does RangerFlow put the target on the far side of the
  source that dagre does; for each container, are the same children inside.
  A number to watch, not a gate.

## 4. What the matrix found

[`D2_FEATURES.md`](D2_FEATURES.md), 100 rows against D2's own tables: **57 the
pipeline already draws, 15 it has something narrower for, 28 it does not have**.
Five gaps, two of them large:

| Gap | Size | Also wanted by |
| --- | --- | --- |
| Boards — `layers`, `scenarios`, `steps` | large, model-level | nothing else yet |
| Grid diagrams — `grid-rows` / `grid-columns` | medium, a new layout | Mermaid's kanban and treemap readers |
| Nine shape outlines, `fill-pattern`, `double-border`, `3d`, `text-transform` | small | — |
| An image primitive, for `icon` and `shape: image` | medium | `RIVALS.md`'s one missing JointJS row; Mermaid's icon packs |
| Rich labels — markdown, code, LaTeX | medium | PlantUML's Creole ([`PLAN_PLANTUML.md`](PLAN_PLANTUML.md) §1) — the same styled-run machinery in `FlowText` |

The finding worth stating plainly: **a D2 reader is mostly a parser.** D2's
model is objects, connections, containers and styles, which is the model
RangerFlow already has. Mermaid needed 31 readers because Mermaid is thirty
grammars in a trench coat; PlantUML needs a preprocessor. D2 is one grammar,
and the work is in it rather than around it.

## 5. Where the work actually is: the grammar

D2's syntax is small to describe and not small to implement. In rough order of
cost:

1. **Globs and filters.** `*.style.fill: red`, `**.style.opacity: 0.9`,
   `*: { &shape: circle; ... }`. A selector language over the object tree,
   applied in declaration order, and it can create objects as well as style
   them. No other format read here has anything like it.
2. **Imports.** `@file`, `...@file` (spread). One resolver, confined to the
   diagram root like PlantUML's `!include` — and refused over the network, for
   the same reason.
3. **`vars` and substitution.** `${name}`, including inside labels and inside
   other vars.
4. **`classes`.** Declared once, applied by `class:`, and overridable per
   object — resolution order matters and is testable.
5. **Boards.** `layers` / `scenarios` / `steps`, where scenarios inherit the
   root board and steps accumulate. This is where a reader most easily goes
   quietly wrong: dropping a board reads as a smaller diagram, not as an error.
6. **Block strings** with custom delimiters, and the `md` / `latex` / language
   tags on them.
7. **Suspensions.** `x: suspend` / `unsuspend`.

Everything else — keys, maps, dot paths, edges, chains, connection indexes,
quoting, comments — is an afternoon each.

## 6. Phases

Each phase names the fixtures it must read and the matrix rows it retires.

| # | What | Fixtures | Status |
| --- | --- | --- | --- |
| 1 | Lexer, AST, keys/maps/paths, edges, chains, containers, labels, comments | `00`, `02`, `03`, `19` | ✅ `D2Parser.rgr` |
| 2 | Shapes and styles: the 25 values, the 20 style keywords, arrowheads | `01`, `04`, `05` | ✅ read into the model |
| 3 | `vars`, `classes`, globs, filters, imports, suspensions | `06`, `07`, `16`, `18` | ✅ including the import boundary |
| 4 | `sql_table` rows and `class` members, `text`, block strings | `10`, `11`, `12` | ✅ read · ⬜ drawn |
| 5 | `shape: sequence_diagram` → `core/SeqDiagram.rgr` | `09` | ✅ read · ⬜ wired |
| 6 | Grid diagrams — the new layout | `08` | ✅ read · ⬜ laid out |
| 7 | Boards: `layers`, `scenarios`, `steps` | `13` | ✅ read · ⬜ shown |
| 8 | `near`, absolute position, icons, links, tooltips | `14`, `15` | ✅ read · ⬜ placed |
| 9 | Parity harness: dump, score, generate `D2_PARITY.md` | all | ✅ 256/256 |
| 10 | `D2Flow` — the model into a `FlowGraph`, containers as nested layouts | all | ✅ `npm run rangerflow:d2` |
| 11 | The nine outlines D2 has and this library did not | `01` | ✅ `core/FlowShapes.rgr` |
| 12 | `?scenario=d2` in the web editor, driven by `rangerflow:web:test` | — | ✅ seven examples |
| 13 | Grid containers, `sequence_diagram` through `SeqDiagram`, boards shown | `08`, `09`, `13` | ⬜ |

What is left is in [`D2_FEATURES.md`](D2_FEATURES.md): 66 rows of 100 are
drawn, 15 are narrower than D2's, and 19 are not there — the boards, the grid
layout, an image primitive for `icon`, rich labels, and four cosmetic styles.

## 7. What lands where

```text
domains/d2/D2Parser.rgr           ✅ AST: keys, maps, edges, block strings, imports
           D2Model.rgr            ✅ objects · connections · styles · boards
           D2Flow.rgr             ✅ → FlowGraph, containers as nested layouts
           D2Sequence.rgr         ⬜ shape: sequence_diagram → SeqDiagram
core/FlowShapes.rgr               ✅ the nine outlines D2 has and this did not
layout/LayerPacking.rgr           ✅ a group's members kept together in a layer
layout/GridLayout.rgr             ⬜ grid-rows / grid-columns / gaps
fixtures/d2/                      ✅ 20 files, all 20 accepted by D2
harness/oracles/d2_oracle.go      ✅ D2 → JSON, built into gitignored vendor/
harness/oracles/d2_oracle.mjs     ✅ → harness/out/d2.json
tests/D2ParityDump.rgr            ✅ RangerFlow → out/rangerflow_d2.json
tools/d2-parity.mjs               ✅ → docs/D2_PARITY.md
docs/D2_PARITY.md                 ✅ generated, never hand-edited
```

The lexer is not a file of its own. D2's strings are context-sensitive — the
same run of letters is a key in one position and a label in the other — so the
parser scans characters directly, the way D2's own does, and a separate token
stream would have had to be told which it was looking at.

Scripts, named after the Mermaid and PlantUML ones so they read the same:

```
rangerflow:d2:oracle      build harness/out/d2.json                    ✅
rangerflow:d2:dump        build harness/out/rangerflow_d2.json         ✅
rangerflow:d2:parity      score, and rewrite docs/D2_PARITY.md         ✅
rangerflow:d2             render a fixture to SVG · PDF · HTML · scene  ✅
```

`harness/vendor/` already holds the built oracle and is already gitignored.

## 8. Risks, named

- **The oracle needs a Go toolchain and one network fetch.** It degrades the
  way the PlantUML one does: `available: false` with a reason, and the parity
  tool scores what is measurable. Checked by deleting `harness/vendor/`.
- **Boards are easy to lose quietly.** A file with three layers read as one
  diagram is not an error anywhere — which is why the oracle records the board
  tree and Tier B scores it.
- **Icons are URLs.** Fetching them at read time is a network dependency inside
  a diagram reader. The first version should draw a placeholder and say so.
- **LaTeX.** There is no formula renderer here and there will not be one for
  this. Draw the source in mono, and put the row in the *Read anyway* list.
- **D2 moves.** v0.7.1 is pinned in the oracle. A version bump that adds a
  keyword shows up as a keyword the reader does not know, because the keyword
  table comes from D2 rather than from us.

## 8b. What the reader learned from the oracle

Five rules that are not in any tutorial, and that a reader written from the
documentation would have got wrong. Each was found by disagreeing with D2 and
then asking it directly:

- **An arrowhead keyword only counts where the arrow draws a head.**
  `a -> b: { source-arrowhead.shape: diamond }` draws no diamond, and `a -- b`
  draws nothing however it is decorated. D2 answers `none` for all three.
- **A block string is a shape as well as a label.** `|md …|` and `|latex …|`
  make the object a `text` shape; a language tag — `|go …|` — makes it `code`.
- **A span inside a sequence diagram has no label.** `api.t1` draws as a
  lifetime, not as a box called `t1`.
- **A group inside a sequence diagram is not a namespace.** `a -> b` written
  inside `loop` is still a message between the participants, not two new ones.
- **A `sql_table` row and a `class` member are not objects.** A table with
  three columns is one shape with three columns, and a connection written
  between two rows is drawn between the two tables.

All five are asserted in `tests/RangerFlowTest.rgr`, so the next reader cannot
lose them quietly.

## 8b2. What a bigger corpus found

Twenty files agreeing is twenty files' worth of evidence, so the corpus was
grown to 41 and the meter from seven dimensions to nine — styles, and the
extras a shape carries (tooltip, link, icon, an insisted-on size). Four
disagreements came out of it, and each one is now a test:

- **`x: null` deletes an object**, with its subtree and the connections that
  touched it — and it is *not* `suspend`: a later mention makes a NEW object,
  which D2 confirms by handing back a plain rectangle where a hexagon used to
  be.
- **Connections have globs too.** `(* -> *)[*]`, `(a -> *)[*]` and
  `(a -> b)[1]` all select connections that already exist; the parser was
  stopping inside the brackets on the `*`.
- **`class` on a connection** is the same keyword doing a different job —
  stroke, dash and label instead of a shape.
- **An id is spelled the way D2 spells it, not the way the file did.**
  `'single quoted'` comes back bare, `escaped\.key` comes back as
  `"escaped.key"`, and a dot inside quotes is not a level: `"a.b"` is one
  object at level 1. Getting that wrong made every path operation — parent,
  level, glob, container — wrong for those objects.

The last one is the one worth remembering: it was invisible while the corpus
only had keys that needed no quoting.

## 8c. What the drawing needed that the reading did not

**A container is not a node.** A layered layout ranks and orders to cut
crossings and has no idea that six of these boxes belong inside one frame, so
it interleaves them with the next container's members — and the two frames
drawn afterwards overlap, which is a picture that lies about what contains
what. It is not a tuning problem: no ordering of one flat layout keeps two
containers apart in the general case.

So `D2Flow` does what D2 does: each container is laid out as a diagram of its
own, and then placed in its parent as one box the size of what came out. That
also gives `direction` its proper meaning — a `direction: right` inside a
container turns that container and nothing else — and it makes the frame
exact rather than a bounding box drawn round whatever landed nearby.

The nine outlines were the other half. `page`, `queue`, `package`, `step`,
`callout`, `stored_data`, `person`, `c4-person` and `cloud` are D2's
architecture vocabulary, and drawing a cloud as an ellipse is the same mistake
as drawing a magnetic tape as a rectangle: it throws away the one thing the
reader was going to read first. The cloud is the interesting one, and the
first two tries were wrong in instructive ways: bumps that only touch read as
a crown, and bumps that overlap without solving the crossing read as petals
with chords drawn across the shape. What a cloud is, is the *outer boundary of
overlapping circles* — so `FlowShapes.blobInto` computes it, with the crossing
of two circles in closed form and the outer of the two solutions picked by
distance from the middle of the blob. The lobes are given in unit space and
the points scaled into the box afterwards, which is why a wide short cloud is
the same cloud as a tall one rather than a different shape with the same name.
The person is the same lesson in miniature: D2 draws it as one head-and-
shoulders silhouette, and a circle floating over a box does not read as a
person at the size a node is.

## 8d. What the editor needed

Three things, and two of them were bugs this wiring found rather than made.

**`read_file` is asynchronous on the web target, and Ranger infers that up the
call graph.** One call to it under `D2Model.read` made every method that can
reach it async — including the editor's own `selfTest`, which then handed the
page a promise where it expected a verdict, and *every* scenario's smoke test
failed with `[object Promise]`. So the import resolver moved out into
`D2Imports`, which the editor does not import: node reads the files, the
browser reports them unresolved, and the model itself never touches a disk.

**The self test clicked node 0's centre.** On a small canvas the minimap is
drawn over part of the diagram, and a press there is a press on the map — so
whether the test passed depended on where the layout happened to put the first
node. It now picks the first node whose middle is on the canvas, clear of the
minimap, the controls and the tools, and hit-tests to something selectable.

**A stylesheet paints over what the file said.** The `look` dropdown's
`FlowStyle` knows nothing about D2's fills, so `D2Flow.restyle` puts the
diagram's own colours back on afterwards — the same order Mermaid uses for its
`classDef`.

## 9. Done means

- ~~Tier A and Tier B at **100%** on `fixtures/d2/`~~ — done: 256/256 over 41
  files, and the meter runs on every change
- every file D2 accepts, RangerFlow reads; every file D2 refuses, RangerFlow
  refuses, with a message that names the line
- ~~imports outside the diagram root and over the network **refused**,
  tested~~ — done: absolute paths, `..` segments and anything with a scheme are
  refused with an error on the board, and a cyclic or 16-deep import chain ends
  rather than hanging
- ~~`?scenario=d2` in the web demo, driven by `rangerflow:web:test` like every
  other scenario, so it cannot rot behind the default~~ — done, with seven
  examples in the gallery
- `D2_PARITY.md` regenerated, with no number in it that a human typed

---

### Reproducing everything in this document

```bash
go install oss.terrastruct.com/d2@v0.7.1      # MPL-2.0, ~47 MB binary
d2 --version ; d2 layout ; d2 themes          # v0.7.1, dagre+elk, 18 light + 2 dark
d2 validate gallery/rangerflow/fixtures/d2/*.d2
npm run rangerflow:d2:oracle                  # → harness/out/d2.json
```
