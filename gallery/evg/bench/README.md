# `bench/` — the same CSS, two engines

Two harnesses. Both drive the compiled engine from JavaScript, which is worth
saying on its own: `-nodemodule` publishes `EVGElement`, `EVGLayout` and the
rest, so a tree is `new EVGElement()`, `setAttribute` with CSS property names,
`addChild`, `layout()` — no Ranger, no JSX, no stylesheet in the way.

```sh
npm run evg:layout:conformance     # box for box against Chromium
npm run evg:layout:bench           # 1k / 10k / 100k, three fixtures
```

## `layout-conformance.mjs` — where an EVG document and its CSS disagree

The cases in `layout-cases.mjs` are written ONCE, as CSS text. The runner
splits that text into `setAttribute` calls for EVG and drops it verbatim into a
`style=` attribute for Chromium, so a differing box is a difference between the
engines and not between two transcriptions of the same intent.

This is a measurement, not a test suite: Chromium is the definition of what the
CSS says, and a case that differs names a place where a document written as CSS
does not lay out as CSS. The report separates the deliberate divergences —
EVG's initial values for `flex-direction`, `flex-wrap` and `align-items`, which
are documented choices — from the rest, and says for each whether **the engine
said anything about it**. That last column is the one that mattered: of the
nineteen divergences the first run found, eighteen were silent.

The three text cases are not compared pixel for pixel. EVG's default measurer
is a heuristic and the browser's is a real face, so a diff there would measure
the fixture; what is asserted instead is that text participates in layout at
all. Font parity has its own suite (`evg:measure:web`, the textbox oracle).

## `layout-bench.mjs` — what it costs at size

Three fixtures, because "layout" is not one cost: nested flex (an application
UI's shape, four levels), a wide flat grid (track sizing at size), and the flex
fixture with text in it. Sizes 1k / 10k / 100k. `layout` is a RE-layout of a
tree that already exists — what a resize costs, not what a first paint does.

Chromium is timed on the same tree with a forced reflow. Read it as an
order-of-magnitude reference for a production C++ layout engine on the same
boxes, not a like-for-like race: the browser is doing line layout and paint
invalidation that this pass is not, and it is not paying for a heuristic text
measurer either.

`--ab` builds a second copy of the engine from the pre-change sources
(`EvgLayoutBenchBase.cjs`, compiled from a `git archive` of the tree you are
comparing against) and alternates the two inside one process, best-of-runs with
`--min`. A laptop's noise floor on these fixtures is a few per cent and two runs
taken minutes apart cannot see through it; alternating can.

```sh
git archive HEAD gallery/evg | tar -x -C /tmp/base
cp gallery/evg/bench/EvgLayoutBench.rgr /tmp/base/gallery/evg/bench/
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule \
  /tmp/base/gallery/evg/bench/EvgLayoutBench.rgr -d=./gallery/evg/bin -o=EvgLayoutBenchBase.cjs
node --expose-gc gallery/evg/bench/layout-bench.mjs --ab --min --no-browser
```

## What it needs

`playwright-core` and a Chromium on disk. The harness takes whatever revision is
actually installed rather than the one `playwright-core` was built against,
because those drift; `--no-browser` skips the browser half entirely.
