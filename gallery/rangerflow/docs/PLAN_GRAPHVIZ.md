# Graphviz DOT in RangerFlow — can the PlantUML shape be done twice?

Status: **phases 0-5 and 7 are built** · `?scenario=graphviz` in the web
editor · `npm run rangerflow:graphviz` ·
`npm run rangerflow:graphviz:parity` → **132/132 checks over 20 files**,
computed by Graphviz itself · `npm run rangerflow:graphviz:bench` →
[`GRAPHVIZ_BENCH.md`](GRAPHVIZ_BENCH.md). The grammar, the scoped attribute
defaults, `strict`, subgraphs and clusters are in; so are the 666-name colour
table read off Graphviz, both label languages — `shape=record` and HTML tables —
and the ports and compass points an edge aims at. 94 assertions in the test
suite beside the parity harness; phase 6, the layout attribute, is still
design. Every number below was measured on 2026-09-11 against
Graphviz 2.43.0 (native) and the same program compiled to WebAssembly, and is
quoted as it came back.

**The answer is yes, and DOT is a smaller job than PlantUML was.** The reason
is not that DOT is a lesser language — it is that the two things that made
PlantUML expensive, twenty diagram types and a macro preprocessor, do not exist
here. DOT is *one* grammar of thirteen productions, and everything hard about
it is in the attributes, not in the sentences.

The library question in the request has a precise answer, and it is not the
obvious one: **an open-source library is what makes this affordable, but as the
oracle, not as the reader.** §4 and §5 are why.

```text
  .gv text
      ↓
  DotReader             one grammar: graph · stmt · attr · edge · subgraph
      ↓
  DotModel              nodes · edges · subgraphs · resolved attributes
      ↓
  DotFlow               → FlowGraph
      ↓
  the pipeline that already exists: LayeredLayout · ReadableRouter · EVG
      ↓
  WebGL 2 · SVG · PDF · HTML
```

Nothing below `DotFlow` learns that Graphviz exists — the rule the Mermaid and
PlantUML readers already follow.

---

## 1. What DOT is that PlantUML is not

**There is one diagram type.** PlantUML needed twenty readers and a header
sniff that must commit to a type before it parses a line. DOT has `graph` and
`digraph`, and the only thing that changes between them is which edge operator
is legal — measured: `digraph { a -- b }` is a syntax error, `graph { a -- b }`
is not.

**There is no preprocessor.** §5 of `PLAN_PLANTUML.md` budgeted a whole phase
for `!include`, `!define`, `!if` and `!procedure`, and called it "the single
biggest piece of work in the plan". DOT has none of it. The one thing that
looks like it — a line starting with `#` — is a C-preprocessor *line marker*
that Graphviz discards, and discarding it is the whole implementation.

**The grammar is thirteen productions.** `graph`, `stmt_list`, `stmt`,
`attr_stmt`, `attr_list`, `a_list`, `edge_stmt`, `edgeRHS`, `node_stmt`,
`node_id`, `port`, `subgraph`, `compass_pt`, with six reserved words (`strict`,
`graph`, `digraph`, `node`, `edge`, `subgraph`). That is the entire language.
It is published at <https://graphviz.org/doc/info/lang.html>.

**The difficulty moved into the attributes.** A DOT file says almost nothing
about how it should look except through key/value pairs, and three of their
behaviours are where a reader quietly goes wrong:

- **Defaults are scoped and ordered.** `node [shape=box]` applies to nodes
  declared *after* it, in that subgraph and the ones inside it, and not to a
  sibling subgraph. Measured, on one file:

  ```text
  digraph{ node[shape=box,style=filled]; a; node[shape=circle]; b;
           subgraph s{ node[color=red]; c } d }

  a {"shape":"box",   "style":"filled"}
  b {"shape":"circle","style":"filled"}
  c {"shape":"circle","style":"filled","color":"red"}
  d {"shape":"circle","style":"filled"}          ← not red
  ```

- **Some attributes are not decoration — they are the graph.** `rank=same`,
  `constraint=false`, `weight`, `lhead`/`ltail`, `pos="x,y!"`. A reader that
  drops them draws a different graph and does not know it.

- **`strict` deduplicates.** Measured: `strict digraph{ a->b; a->b; b->a }`
  comes back with **2** edges, not 3.

**Labels are a layout language, twice.** `shape=record` labels
(`"<id> id | <cust> customer"`) are a nested box language with named ports, and
`label=<...>` is an HTML-like table language. This is DOT's Creole, and it is
the one piece of work here comparable to the hard parts of PlantUML.

---

## 2. The oracle, and it is better than PlantUML's on everything but one thing

PlantUML had to be persuaded to describe itself by rendering an annotated SVG.
Graphviz simply prints its model.

### 2.1 `-Tjson0` is the parse result, resolved

```bash
$ dot -Tjson0 component.gv
```

```json
{ "name": "G", "directed": true, "strict": false, "_subgraph_cnt": 1,
  "objects": [
    { "name": "cluster_core", "_gvid": 0, "nodes": [1,2], "edges": [0] },
    { "_gvid": 1, "name": "Web", "shape": "box",  "label": "\\N" },
    { "_gvid": 2, "name": "API" },
    { "_gvid": 3, "name": "DB",  "shape": "cylinder", "label": "Postgres" } ],
  "edges": [ { "_gvid": 0, "tail": 1, "head": 2, "label": "http" } ] }
```

Every node, every edge by endpoint, every subgraph **with its membership**, and
every attribute *after default resolution* — which is exactly the part §1 says
a reader gets wrong. Anonymous subgraphs are in there too: `{ rank=same; b; c }`
comes back as an object named `%5` with `nodes: [2,3]`.

### 2.2 Acceptance, with a line number

`dot` exits non-zero and says where:

```text
Error: bad_01_dangling.gv: syntax error in line 1 near '}'
```

That is the `-checkonly` equivalent, and it is the check that catches the
failure that matters most: **a file RangerFlow reads happily and Graphviz
rejects means we invented syntax.** `fixtures/graphviz/bad/` exists for it.

### 2.3 The registries, read off the tool

PlantUML had `-language`. Graphviz has no vocabulary dump, but it will answer a
yes/no about any name you propose:

```text
$ echo 'digraph{a[shape=notashape]}' | dot -Tcanon
Warning: using box for unknown shape notashape
$ echo 'digraph{a[color=notacolor]}' | dot -Tcanon
Warning: notacolor is not a known color.
```

Sixty-one candidate shape names were proposed and Graphviz confirmed **61 of
61**, with one invented name thrown in as the control and duly refused. So the
shape and colour tables can be *read*, never typed — the rule the Mermaid
detector registry and PlantUML's `-language` dump set.

And the shapes' geometry can be read too, which removes the temptation to copy
it: `-Tjson` prints the polygon Graphviz drew, so `trapezium` comes back as 4
points, `house` as 5, `star` as 10, `doublecircle` as two ellipses. A shape
table derived by measuring the output is licence-clean in a way a table
transcribed from `shapes.c` would not be (§6).

### 2.4 The one thing it does not give

**No source lines.** PlantUML's SVG carried `data-source-line` on every entity;
`-Tjson0` carries none, and grepping for one finds nothing. Errors have line
numbers, models do not. So the *source lines* check that
`PLANTUML_PARITY.md` scores has no equivalent here and must not be faked.

---

## 3. What the references cost — the benchmark

Full table, regenerated and never hand-edited:
[`GRAPHVIZ_BENCH.md`](GRAPHVIZ_BENCH.md) · `npm run rangerflow:graphviz:bench`.
500 diagrams cycled from the small fixtures, 143 B average, median of 5 runs,
Intel Xeon @ 2.80 GHz, node v22.

| reference | per diagram |
| --- | --- |
| `dot -Tcanon` native, parse only | **0.230 ms** |
| `dot -Tsvg` native, parse + layout + render | **0.267 ms** |
| graphviz wasm `canon`, in process, parse only | **0.245 ms** |
| graphviz wasm `json0`, in process, parse → structure | **0.339 ms** |
| graphviz wasm `svg`, in process | **0.340 ms** |
| `dotparser` (pure JS) → AST | 0.094 ms |
| `@ts-graphviz/ast` (pure JS) → AST | 0.119 ms\* |

These are the numbers in the generated doc, which is the authority; a re-run
moves them by a few percent and the shape not at all.

\* it throws on 2 of the 15 fixtures, so 67 of its 500 answers are an exception
rather than an AST — a flattering row, not a comparable one. The generated doc
says so on the line.

For scale, from `PLAN_PLANTUML.md` §8: PlantUML parses at **≈33 ms/diagram**
and renders at **≈70 ms/diagram**, after a 0.19 s JVM start and a 22 MB jar
fetched on demand. **Asking Graphviz costs about 1/150th of asking PlantUML**,
needs no JVM, and the WebAssembly build answers in process after an 80 ms load —
no fork, no exec, no subprocess at all. A 2.1 MB install replaces a 22 MB one.

What that buys is not bragging rights, it is corpus size: the PlantUML oracle is
expensive enough that sixteen fixtures is a considered number. At 0.3 ms an
answer, a thousand-file DOT corpus is oracled in under a second, and the oracle
can run on every test rather than on demand.

For the other side of the comparison: RangerFlow's compiled PlantUML reader
does parse-to-model over 512 diagrams in 463 ms including node startup and a
574 KB bundle load — **≈0.8 ms/diagram**, on a corpus averaging 246 B a file
against this one's 143 B. A Ranger DOT reader in the same shape
would land within a factor of a few of Graphviz's own parser, which is the
honest framing to publish: Graphviz is a mature C program doing rather more
than we would.

---

## 4. Which library, for which job

Four open-source implementations were given the same corpus — 16 files Graphviz
accepts, 4 it rejects — and asked only *is this DOT*:

| reference | licence | agrees with Graphviz |
| --- | --- | --- |
| native `dot` 2.43.0 | EPL-1.0 | 20 / 20 |
| `@hpcc-js/wasm-graphviz` 1.29.0 (graphviz 16.1.0 in wasm) | Apache-2.0 wrapper, EPL-1.0 inside | **20 / 20** |
| `dotparser` 1.1.1 | MIT | 18 / 20 |
| `@ts-graphviz/ast` 3.0.6 | MIT | 17 / 20 |

The disagreements are not exotic:

- `dotparser` **accepts** `digraph { a -- b }` (the wrong edge operator) and
  `subgraph s -> b` (a bare subgraph reference as an edge endpoint, which the
  published grammar does not have and Graphviz rejects).
- `@ts-graphviz/ast` **rejects two valid files**: a comment inside an edge
  statement (`a /* x */ -> b`) and a repeated attribute list
  (`a [color=red] [shape=box]`, which is `attr_list : '[' [a_list] ']'
  [attr_list]` in the grammar). It also accepts the bare subgraph reference.

So: **the WebAssembly Graphviz is the oracle.** It is the same program as the
native one, it agrees with it on every file, it needs nothing installed on the
machine, and it is fast enough to be free. Native `dot` stays as the
cross-check when the machine has it — if the two ever disagree, that is worth
knowing, and the bench prints both columns.

The two pure-JS parsers are not oracles; they are what `plantuml-parser` was in
`PLAN_PLANTUML.md` §3.6 — a degraded path worth naming and not using. Neither
resolves default attributes, which is half of what §2.1 makes scoreable.

---

## 5. Why the reader is still ours

The obvious shortcut is to skip the reader: ship `@hpcc-js/wasm-graphviz` in
the app, hand it the text, read the positions out of its `-Tjson`, and draw
them. It would work, tomorrow. It is the wrong trade here, for three reasons
and one of them is fatal:

1. **It is JavaScript only.** RangerFlow's readers are Ranger, compiled to JS,
   C++, Rust and WebAssembly — `platform/sdl/` is a native binary that reads
   diagrams with no JS runtime anywhere. A npm dependency in the reader means
   the format exists on one target out of four.
2. **The licence forbids the shipping, not the asking** (§6).
3. **It would not be a RangerFlow diagram.** Graphviz's output is a finished
   picture: positions and splines, computed by its layout, not ours. Nothing
   downstream applies — no dragging, no `ReadableRouter`, no incremental edit,
   no `EVG`. The point of reading DOT is to get a `FlowGraph`; a rendered SVG
   is a different product.

Reading it ourselves is affordable precisely because of §1: thirteen
productions, no preprocessor, one diagram type. `PlantUmlEntityReader.rgr` is
2 313 lines and covers eight PlantUML diagram types. A `DotReader` doing the
whole grammar should be smaller than that, and most of the remaining work is
attribute tables that Graphviz itself will hand over (§2.3).

---

## 6. Licence hygiene, and it is stricter than PlantUML's

**Graphviz is EPL-1.0** (`/usr/share/doc/graphviz/copyright`, and the wasm
package is an Apache-2.0 wrapper around the same EPL code). RangerFlow's
gallery is AGPL-3.0-or-later, and unlike PlantUML's GPL — where compatibility
was never the issue — **EPL-1.0 and AGPL-3.0 are not compatible for
distribution as one work**. That makes the arm's-length rule load-bearing:

- Graphviz is a **harness dependency only**: installed by npm into the
  gitignored `harness/node_modules/`, or found on the machine as `dot`. It is
  never bundled into the web page, never imported by the gallery, never
  vendored.
- It is **run as a subprocess or as a sandboxed WebAssembly module**, never
  linked.
- **No Graphviz source is read or copied** — not a grammar, not a keyword
  table, not the shape table. The grammar comes from the published language
  page; everything else comes from Graphviz's observable answers (§2.3), which
  is why the shape geometry is *measured* rather than transcribed.

An oracle you cannot regenerate is a number you have to trust; one you had to
copy code to build is a licence you have to explain.

---

## 7. What gets scored

`docs/GRAPHVIZ_PARITY.md`, regenerated by `npm run rangerflow:graphviz:parity`,
never hand-edited. Per fixture:

| check | fails when |
| --- | --- |
| accepted | Graphviz rejects a file we read, or accepts one we refuse |
| header | `strict` / `graph` vs `digraph` / the graph's name differs |
| nodes | an id missing or invented |
| edges | an endpoint pair missing, invented, or out of order |
| subgraphs | membership differs — clusters *and* anonymous `{ }` groups |
| attributes | a resolved attribute differs from Graphviz's resolution (§1) |
| dedup | `strict` collapsed a different set of parallel edges |
| ports | `node:port:compass` read as a different anchor |
| text | a label Graphviz drew that we did not read, or vice versa |

There is **no source-line check**: §2.4. Writing one anyway would mean scoring
against ourselves.

Plus the two lists the other parity docs carry:

- **Read anyway** — files Graphviz rejects and RangerFlow reads. Not scored,
  and not a licence to invent syntax.
- **Refused on purpose** — `.gv` files carrying things this reader will not
  pretend to draw, each of which must come back as *nothing* rather than as a
  misread graph.

The vocabularies meet in `tools/graphviz-parity.mjs` and nowhere else.

---

## 8. Scope inside a diagram

**Honoured**: `label`, `xlabel`, `shape` (the polygon family, geometry measured
per §2.3), `style`, `color`/`fillcolor`/`fontcolor`/`bgcolor`, `penwidth`,
`fontsize`/`fontname`, `arrowhead`/`arrowtail`/`dir`, `rankdir` (→
`LayeredLayout`'s `TB`/`LR`, which it already has), `rank`, `constraint`,
`weight`, `peripheries`, `nodesep`/`ranksep`, `layout` (→ the layout RangerFlow
already has for it, §9 phase 6), `pos="x,y!"` pinning.

**Read and dropped, on purpose**: `image`/`imagepath` (a diagram that fetches
files is a different security question), `URL`/`href`/`target` (the `click`
category — recorded in the model, not drawn), `tooltip`, the raster-only
attributes, and anything Graphviz accepted silently that this reader does not
know. Dropped is not an error: a graph that renders in Graphviz renders here,
minus what a printed page cannot do.

**Refused**: nothing needs to be, and that is a real difference from PlantUML.
DOT reads no files and reaches no network, so §6 of `PLAN_PLANTUML.md` — the
`!include` sandbox, its own security boundary and its own tests — has no
counterpart. `image=` is the only attribute that would open one, and it is
dropped.

**The honest gap**: unlike shapes and colours, **the attribute vocabulary
cannot be read off the tool** — measured: `digraph{a[bogusattr=1]}` is accepted
in silence, with no warning. So the coverage matrix has to be built from a
corpus rather than from a dump, and "an attribute nobody in the corpus used"
can hide in a way an unhandled PlantUML keyword could not. Say it in the doc;
grow the corpus rather than the claim.

---

## 9. Build order

Each phase ends green — tests passing, parity regenerated, a number that went
up.

**Phase 0 — the corpus and the benchmark.** ✅ Done, and it is what this
document reports. `fixtures/graphviz/` (16 accepted, 4 rejected) and
`tools/graphviz-bench.mjs` → `docs/GRAPHVIZ_BENCH.md`.

**Phase 1 — the oracle.** ✅ **Done.** `harness/oracles/graphviz_oracle.mjs`
puts every fixture through wasm Graphviz for `json0` (the model) and its verdict
(acceptance), with native `dot` as a cross-check when the machine has one, into
`harness/out/graphviz.json`. `tests/DotParityDump.rgr` writes ours;
`tools/graphviz-parity.mjs` scores them into
[`GRAPHVIZ_PARITY.md`](GRAPHVIZ_PARITY.md) — **132/132**, and the four files
Graphviz rejects are refused here too.

Two things the plan did not foresee. First, **Graphviz names an anonymous graph
`%1` and an anonymous subgraph `%5`**, from a counter that is not our counter,
so the meter compares subgraph *membership* and never those names. Second,
`-Tjson0` prints `tailport`/`headport` as edge attributes while this reader
keeps the port and the compass point apart — two different questions about
where an edge lands. The translation lives in the meter, which is where a
foreign tool's spelling belongs.

**Phase 2 — the grammar.** ✅ **Done.** `domains/graphviz/DotReader.rgr`: all thirteen productions, both edge
operators and the `digraph`/`graph` rule that separates them, `strict` with its
deduplication, quoting (escapes, `\` line continuation, the `+` concatenation),
numerals, HTML strings as an opaque token, `#` line markers and both comment
spellings, `node_id:port:compass` with the one ambiguity the grammar has,
subgraphs named, anonymous and as edge endpoints, and attribute lists including
the repeated `[..][..]` form that `@ts-graphviz/ast` gets wrong. Acceptance
parity is 20/20 on the corpus of §4 — the same test that broke two of the four
references.

**Phase 3 — the model.** ✅ **Done.** Default-attribute scoping (§1) resolves to
the same answer `-Tjson0` prints, subgraph membership includes the anonymous
groups, and `domains/graphviz/DotFlow.rgr` builds the `FlowGraph` with clusters
drawn as the bands built for PlantUML's packages — a package is a band, not a
bounding box, and a Graphviz cluster is the same promise.

**The routing is chosen by measuring, not by guessing.** `ReadableRouter` — the
router that can see every other edge and charges a route for crossings, shared
corridors and turning inside somebody else's clearance — is asked first, and
on a diagram of ordinary size it is visibly better: `fixtures/order_flow.gv`
came out with its parallel lines **65 px apart instead of 16**, and without the
detours that make a reader follow a line with a finger. It can also fail: on
`fixtures/graphviz/14_big_flat.gv` (200 nodes, 199 edges) its grid runs out of
corridors and it abandons **80** edges, which are then drawn straight through
whatever is in the way — worse than any detour. So it is asked first and
checked afterwards, and the older pass stack (lanes, long-edge chains,
orthogonal repair) takes the whole diagram when anything was left unrouted:

| | bends | crossings | through a node | nearest parallel |
| --- | --- | --- | --- | --- |
| `order_flow.gv`, readable router | 26 | 0 | 0 | **65 px** |
| `order_flow.gv`, pass stack | 24 | 0 | 0 | 16 px |
| `14_big_flat.gv`, readable router | 372 | 268 | **80** | 0 px |
| `14_big_flat.gv`, pass stack | 502 | 555 | **7** | 0 px |

`npm run rangerflow:graphviz` prints that line for whatever it drew, so a
change to either router shows up as a number rather than as a picture somebody
has to look at.

One bug the web page's own self-test found and no amount of parity would have:
`FlowGraph` names an edge nobody named `e<n>`, and this reader was naming its
edges the same way. An edge added in the editor then collided with one of the
file's, and the undo took back the wrong one. They are `dot<n>` now.

**Phase 4 — the attributes that draw.** ✅ **Done for shapes and colour.**
Shapes map onto the 41 `FlowShapes` already draws by name, with Graphviz's own
default — an ellipse, not a box — where the file says nothing.

The colours are the part worth reading twice. There are 666 of them, and a
table of 666 transcribed by hand is a table with mistakes in it nobody will
ever find, so `tools/graphviz-colors.mjs` **measures** it: every candidate name
is handed to Graphviz as a node's `fillcolor` and the RGB is read back out of
its own xdot output, where a colour is always hex whatever the name was. It
writes `domains/graphviz/DotColors.rgr`, which is generated and says so on its
first line. A name Graphviz does not know is left to the theme rather than
guessed at — and how "does not know" was established is written down too:
native `dot` warns on stderr, and without one the silent fallback to black has
to stand in for a verdict.

Around the table, `DotPalette` answers what a name cannot: `#rrggbb` and `#rgb`,
the alpha in `#rrggbbaa` that nothing downstream can paint, an `h s v` triplet
(computed, the way Graphviz computes it), `/x11/name`, and a gradient or colour
list, which is drawn in its first colour.

Still open here: `style=rounded|bold|diagonals`, `penwidth`, `fontname`, and the
Brewer schemes.

**Phase 5 — records and HTML-like labels.** ✅ **Done.**
`domains/graphviz/DotRecordLabel.rgr` reads both box languages into one tree of
cells — `<id> id | <cust> customer` and `<TABLE><TR><TD PORT="l">` mean the same
thing here — measures it bottom-up, and places it top-down into whatever box the
layout gave the node. The direction alternates the way DOT says: the top level
runs across the page under `rankdir=TB` and down it under `LR`, and every `{ }`
flips the axis again.

The cells are drawn as **children of the record node**, which is what makes a
record that is dragged take its own cells with it — the mechanism the PlantUML
packages got a few days earlier. A named field becomes a `FlowPort`, so
`order:cust:e -> customer:id:w` leaves the cell it names, on the side the
compass names, and arrives at the cell it names. Where the file gives no
compass the side is chosen from where the other end of the edge actually is,
which is what Graphviz does, and is why it happens after the layout rather than
in the reader.

Two things this needed from outside the domain, and both were bugs rather than
features. `OrientedPorts.spread` staggered **every** end on a side, including
ends attached to a named port — which moved the line off the very row or field
the port existed to name. It leaves port-anchored ends alone now. And
`ReadableRouter.staggerSide` ranked its departure lanes by how far an end had
been nudged, which is zero for all of them once the nudging stops; it asks the
graph where the end actually is instead. Nothing but this reader had used
either path, and the ERD's row ports would have met the same thing the day they
did.

Still not read, and listed rather than hidden: `COLSPAN`/`ROWSPAN` (a cell that
spans two is drawn as a cell that spans one), nested tables inside a cell,
`<IMG>`, and an HTML table's per-cell colours.

**Phase 6 — the layout attribute.** `layout=dot` → `LayeredLayout`,
`neato`/`fdp` → `ForceLayout`, `twopi`/`circo` → the radial tree layouts,
`pos="x,y!"` → pinned nodes. Mostly wiring: these layouts exist, and this is
the phase where the §3 framing gets tested — does our layered layout produce a
drawing a Graphviz user recognises.

**Phase 7 — the way in.** ✅ **Done.** `?scenario=graphviz` in the web demo,
sharing the source panel with Mermaid and PlantUML — the dropdown decides which
reader gets the text — with a gallery of four examples chosen for what a DOT
reader can be wrong about: clusters, the shape vocabulary, the undirected
grammar, and the scoped defaults. `npm run rangerflow:graphviz` renders
`fixtures/order_flow.gv` to SVG, PDF, HTML and a scene, beside the Mermaid and
PlantUML files of the same name. Driven by `rangerflow:web:test` like every
other scenario, so it cannot rot behind the default.

---

## 10. What will hurt

| | |
| --- | --- |
| **Records and HTML labels** | A layout language inside a label, with ports the edges then aim at. The same shape of problem as Creole, and the same place a reasonable scope line gets drawn. |
| **Attributes that are semantics** | `rank=same`, `constraint=false`, `weight`, `lhead`/`ltail`. Ignore them and the drawing is a different graph, silently. These have to reach `LayeredLayout`, not just the style layer. |
| **The attribute surface is not enumerable** | No `-language` dump, and unknown attributes are accepted in silence (§8). Unknown coverage can hide; only the corpus finds it. |
| **Default scoping** | Ordered and lexically scoped (§1). Easy to implement approximately and be wrong on one file in twenty. `-Tjson0` prints the resolved answer, which is the only reason this is scoreable at all. |
| **61 shapes** | Most are one polygon primitive with sides/skew/distortion/peripheries, and `FlowShapes` already has a `polygon`. The tail is the biology shapes nobody diagrams with. |
| **No source lines** | The line-level check PlantUML's oracle gave us for free is not available (§2.4). |
| **The temptation to read the source** | It is EPL and it is one `apt-get` away. §6 exists because the cheap shortcut here is the expensive one, and it is a *harder* line than PlantUML's, not a softer one. |

---

## 11. What lands where

```text
domains/graphviz/DotReader.rgr            ✅ the grammar, the model, scoping
                 DotFlow.rgr              ✅ → FlowGraph, shapes, clusters, ports
                 DotRecordLabel.rgr       ✅ records + HTML-like labels
                 DotColors.rgr            ✅ GENERATED: 666 names, measured
fixtures/graphviz/                        ✅ 16 accepted, 4 rejected
fixtures/order_flow.gv                    ✅ the demo's diagram
harness/oracles/graphviz_oracle.mjs       ✅ Graphviz → out/graphviz.json
tests/DotParityDump.rgr                   ✅ RangerFlow → out/rangerflow_dot.json
tools/graphviz-colors.mjs                 ✅ Graphviz → domains/graphviz/DotColors.rgr
tools/graphviz-bench.mjs                  ✅ → docs/GRAPHVIZ_BENCH.md
tools/graphviz-parity.mjs                 ✅ → docs/GRAPHVIZ_PARITY.md
```

New scripts, named after the PlantUML ones so they read the same:

```
rangerflow:graphviz            ✅ render fixtures/order_flow.gv
rangerflow:graphviz:bench      ✅ the references, measured
rangerflow:graphviz:oracle     ✅ build harness/out/graphviz.json
rangerflow:graphviz:dump       ✅ build harness/out/rangerflow_dot.json
rangerflow:graphviz:parity     ✅ score, and rewrite docs/GRAPHVIZ_PARITY.md
rangerflow:graphviz:colors     ✅ re-measure the colour table
```

---

## 12. Done means

- the whole DOT grammar **drawn**, and every file Graphviz rejects rejected
- acceptance parity at **100%** on `fixtures/graphviz/` including `bad/`
- nodes, edges, subgraph membership and **resolved attributes** at 100%, or
  every gap named in the doc with the reason
- the shape and colour tables **read off Graphviz**, not typed ✅ for colour
- no Graphviz code linked, bundled or copied — the harness installs it, the app
  never sees it (§6)
- `?scenario=graphviz` in the web demo, driven by `rangerflow:web:test`
- `GRAPHVIZ_BENCH.md` and `GRAPHVIZ_PARITY.md` regenerated, with no number in
  them that a human typed

---

### Reproducing §1, §2 and §3

```bash
npm run rangerflow:graphviz:bench                  # §3 and §4, end to end
dot -Tjson0 gallery/rangerflow/fixtures/graphviz/04_clusters.gv   # §2.1
dot -Tcanon gallery/rangerflow/fixtures/graphviz/bad/*.gv; echo $?  # §2.2
echo 'digraph{a[shape=notashape]}' | dot -Tcanon                  # §2.3
echo 'digraph{a[bogusattr=1]}'     | dot -Tcanon                  # §8, silent
```
