# D2 in RangerFlow — is it worth it, and what would it take

Status: **research, measured.** No reader is written. What exists after this
document is the thing a reader needs to be judged by — the corpus
(`fixtures/d2/`, 20 files), the oracle (`harness/oracles/d2_oracle.{go,mjs}`,
`npm run rangerflow:d2:oracle`) and the feature matrix
([`D2_FEATURES.md`](D2_FEATURES.md), 100 rows). Every number below was produced
by **d2 v0.7.1** on this machine on 2026-09-11, not read off a website —
`d2lang.com` is blocked by the egress proxy here, which forced the denominator
to come from D2's own source and binary instead.

```text
  .d2 text
      ↓
  D2Reader          keys · maps · edges · globs · vars · imports · boards
      ↓
  D2Model           objects · connections · styles      ← one model, one grammar
      ↓
  D2Flow            → FlowGraph
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
  connections with their ends and their arrowheads, styles that survive to the
  model. The oracle's `shapes[].id/type/label/level` and
  `connections[].src/dst/srcArrow/dstArrow/label`.
- **Tier B — semantics.** `sql_table` columns and constraints, `class` fields
  and visibility, sequence messages and spans, the boards a file declares.
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

| # | What | Fixtures | Retires |
| --- | --- | --- | --- |
| 1 | Lexer, AST, keys/maps/paths, edges, chains, containers, labels, comments | `00`, `02`, `03`, `19` | §1 most, §5 nesting |
| 2 | Shapes and styles: the 25 values, the 20 style keywords, arrowheads | `01`, `04`, `05` | §2, §3, §4 |
| 3 | `vars`, `classes`, globs, filters, imports, suspensions | `06`, `07`, `16`, `18` | §1 rest |
| 4 | `sql_table`, `class`, `text`, block strings | `10`, `11`, `12` | §6 partly |
| 5 | `shape: sequence_diagram` → `core/SeqDiagram.rgr` | `09` | §6 |
| 6 | Grid diagrams — the new layout | `08` | §5 |
| 7 | Boards: `layers`, `scenarios`, `steps` | `13` | §7 |
| 8 | `near`, absolute position, icons, links, tooltips | `14`, `15` | §5, §6 rest |
| 9 | Parity harness: dump, score, generate `D2_PARITY.md` | all | — |
| 10 | `?scenario=d2` in the web editor, driven by `rangerflow:web:test` | — | — |

Phases 1-3 are the reader. Phases 4-5 are wiring to things that already exist.
Phase 6-8 are the gaps in the table above. A stop after phase 3 would already
read the majority of D2 files people write.

## 7. What lands where

```text
domains/d2/D2Lexer.rgr            tokens, block strings, quoting
           D2Parser.rgr           AST: keys, maps, edges, imports, boards
           D2Model.rgr            objects · connections · styles, after merge
           D2Globs.rgr            globs, filters, classes, vars
           D2Flow.rgr             → FlowGraph
           D2Sequence.rgr         shape: sequence_diagram → SeqDiagram
layout/GridLayout.rgr             grid-rows / grid-columns / gaps
fixtures/d2/                      20 files today, all 20 accepted by D2
harness/oracles/d2_oracle.go      D2 → JSON, built into gitignored vendor/
harness/oracles/d2_oracle.mjs     → harness/out/d2.json
tests/D2ParityDump.rgr            RangerFlow → out/rangerflow_d2.json
tools/d2-parity.mjs               → docs/D2_PARITY.md
docs/D2_PARITY.md                 generated, never hand-edited
```

Scripts, named after the Mermaid and PlantUML ones so they read the same:

```
rangerflow:d2:oracle      build harness/out/d2.json          ← exists
rangerflow:d2             render a fixture
rangerflow:d2:dump        build harness/out/rangerflow_d2.json
rangerflow:d2:parity      score, and rewrite docs/D2_PARITY.md
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

## 9. Done means

- Tier A and Tier B at **100%** on `fixtures/d2/` — or every gap named in
  `D2_PARITY.md` with the reason
- every file D2 accepts, RangerFlow reads; every file D2 refuses, RangerFlow
  refuses, with a message that names the line
- imports outside the diagram root and over the network **refused**, tested
- `?scenario=d2` in the web demo, driven by `rangerflow:web:test` like every
  other scenario, so it cannot rot behind the default
- `D2_PARITY.md` regenerated, with no number in it that a human typed

---

### Reproducing everything in this document

```bash
go install oss.terrastruct.com/d2@v0.7.1      # MPL-2.0, ~47 MB binary
d2 --version ; d2 layout ; d2 themes          # v0.7.1, dagre+elk, 18 light + 2 dark
d2 validate gallery/rangerflow/fixtures/d2/*.d2
npm run rangerflow:d2:oracle                  # → harness/out/d2.json
```
