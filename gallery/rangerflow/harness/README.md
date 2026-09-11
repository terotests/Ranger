# The parity harness

A scorecard we wrote from imagination would only measure our imagination. So
the reference answers here are not written down — they are **computed by React
Flow and by d3-force**, in this directory, from the same inputs RangerFlow is
given.

```text
harness/oracles/reactflow_oracle.mjs   @xyflow/system  →  out/reactflow.json
harness/oracles/d3_force_oracle.mjs    d3-force        →  out/d3_force.json
tests/ParityDump.rgr                   RangerFlow      →  out/rangerflow.json
                                              ↓
                              tools/parity.mjs  →  docs/PARITY.md

harness/oracles/mermaid_oracle.mjs     mermaid         →  out/mermaid.json
tests/MermaidParityDump.rgr            RangerFlow      →  out/rangerflow_mermaid.json
                                              ↓
                       tools/mermaid-parity.mjs  →  docs/MERMAID_PARITY.md

harness/oracles/plantuml_oracle.mjs    plantuml.jar    →  out/plantuml.json
tests/PlantUmlParityDump.rgr           RangerFlow      →  out/rangerflow_plantuml.json
                                              ↓
                      tools/plantuml-parity.mjs  →  docs/PLANTUML_PARITY.md

graphviz, dotparser, @ts-graphviz/ast  →  tools/graphviz-bench.mjs
                                              ↓
                                       docs/GRAPHVIZ_BENCH.md
```

**PlantUML** has no parse database to ask, the way Mermaid has. It has
something better: it annotates its own SVG. Rendered with `-Playout=smetana` —
the pure-Java layout engine, so no Graphviz has to be installed — every node,
edge and package comes back as a group carrying the ids PlantUML used, and the
`<svg>` element says which diagram it decided the file was. That is a
structural answer, and a line-level one.

The jar is **fetched on demand** into `harness/vendor/` (gitignored, 22 MB) and
the version is pinned. PlantUML is GPL-2.0-or-later: it is run as a subprocess,
never linked, never vendored, and no PlantUML source is copied into this
repository — not a grammar, not a keyword table. What the reader knows about
PlantUML it learned from PlantUML's observable behaviour and from its own
`-language` dump. Without a JVM the oracle reports what is missing and the
parity doc says it was not measured, rather than printing a number nobody
computed.

**Mermaid** is asked the same way. Every file in `fixtures/mermaid/` is handed
to Mermaid's own parser and the answer is its own database — the vertices with
their shapes, the edges with their strokes, the subgraphs with their members.
Mermaid is a browser library and sanitizes its labels through DOMPurify, so it
needs a DOM to load at all; `jsdom` is that DOM and nothing else. Nothing is
rendered and no geometry is read: Mermaid lays a diagram out its own way and has
no opinion about RangerFlow's, so what is compared is the *reading*.

**Graphviz** is here to be measured before anything is built against it, which
is what `docs/PLAN_GRAPHVIZ.md` reports. `@hpcc-js/wasm-graphviz` is the real
Graphviz compiled to WebAssembly — same program, same answers as the `dot` on
the machine, no JVM and no subprocess — and `-Tjson0` is its parse result with
subgraph membership and *resolved* attributes, which is a better structural
answer than either of the other two formats gives. `dotparser` and
`@ts-graphviz/ast` are the pure-JavaScript alternatives, installed so the claim
that they are weaker is a measurement rather than an opinion: on the twenty
files in `fixtures/graphviz/` they agree with Graphviz 18 and 17 times.
Graphviz is EPL-1.0 — run here, never linked, never vendored, never shipped.

`@xyflow/system` is the package React Flow itself builds on, and the functions
compared — `getBezierPath`, `getSmoothStepPath`, `getStraightPath`,
`getViewportForBounds`, `pointToRendererPoint`, `rendererPointToPoint` — are
the *same functions* a React Flow app calls. There is no reimplementation in
the middle to be wrong about.

## Install

```bash
npm run rangerflow:parity          # installs on first run, then measures
npm run rangerflow:mermaid:parity  # …and the same for the Mermaid reader
npm run rangerflow:plantuml:parity # …and for PlantUML (needs a JVM)
npm run rangerflow:graphviz:bench  # …and what the DOT references cost
cd gallery/rangerflow/harness && npm install    # or do it by hand
```

The dependencies are **not** vendored and the generated `out/` is **not**
committed: an oracle you cannot regenerate is a number you have to trust.

## Offline

Without a registry the oracle files cannot be produced. `npm run
rangerflow:parity` then reports what is missing and scores only the behavioural
half, rather than pretending the geometry was checked.
