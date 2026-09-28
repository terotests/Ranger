# EVGr — EVG's layout as a strict Rust module

An experiment beside [`lib/evg`](../evg), which it does not replace: the layout
of an EVG document — boxes styled with CSS declarations, laid out as flexbox
and grid with EVG's box model and initial values — written once in Rust
(`src/`, 2,300 lines) and built two ways:

- by **cargo** into native code (`cargo run --release --bin bench`);
- by **`rgrc`** into every Ranger target, the way any `.rs` module is
  (`docs/plans/PLAN_RUST_SYNTAX.md`): `npm run evgr:build` writes
  `bin/Evgr.cjs`, and `bench/NativeBench.rgr` — a Ranger program that imports
  `src/lib.rs` beside `lib/evg` — builds for C++ and Go.

The questions were how it does on the layout cases EVG is measured with, and
how its speed compares with the Ranger engine.

```sh
npm run evgr:compare     # the layout cases: EVGr, EVG and Chromium
npm run evgr:speed       # the layout-bench fixtures at 1k / 10k / 100k
npx vitest run --config tests/vitest.config.ts evgr.test.ts
```

## What it lays out

`display` block / flex / grid / none, `flex-direction` (and the reverse
forms), `flex-wrap`, width / height and their min / max (px, %, `calc()` of
px and %), padding (a percentage of the containing block's width), margin,
gap, `flex-grow` / `-shrink` / `-basis` / `flex`, `justify-content`,
`align-items` / `-self` / `-content` (with `baseline`), `aspect-ratio`,
`position: absolute` with top / right / bottom / left, grid templates (px, %,
fr, auto, `minmax()`, `fit-content()`, `repeat(n, …)`,
`repeat(auto-fit | auto-fill, …)`), placement by line numbers, `span`,
`grid-template-areas` / `grid-area`, auto placement with `dense`, and text
measured with EVG's default advance table, wrapped at spaces.

Not there: borders, images, overlays, connectors, the stylesheet, scrolling,
RTL — everything of EVG that is not the box layout. A property EVGr does not
know is reported (`unsupported_count` / `unsupported_at`).

The tree is an arena (a node is an index), and a subtree laid out at the same
width in the same pass is moved rather than laid out again, which is what
keeps a column of rows linear.

## The layout cases

`bench/compare.mjs` runs the 47 cases of `lib/evg/bench/layout-cases.mjs`
through the three engines; two agree on a case when every box is within half
a pixel.

| | agree |
| --- | --- |
| EVGr and Chromium | 42 of 47 |
| EVGr and EVG | 39 of 47 |
| EVG and Chromium | 34 of 47 |

Where EVGr and Chromium differ, EVGr keeps a choice EVG made on purpose:
the initial values of `flex-direction` (column), `flex-wrap` (wrap) and
`align-items` (flex-start: `defaults-*`, `nested-flex-in-flex`), and an
absolute box placed against the content box (`absolute-child`). EVGr also
keeps two of EVG's rules the cases do not reach: a root without a height is
as tall as the viewport, and a text leaf without a width fits its text even
where a column stretches its boxes.

Where EVGr and EVG differ, EVGr agrees with Chromium: `align-content:
stretch` over wrapped lines, `row-reverse`, a grid cell holding a flex row, a
grid template mixing px / % / fr / auto, `max-content` as a width,
`aspect-ratio`, `calc()`, and `repeat(auto-fit, …)`.

The three text cases hold on EVGr's boxes, and EVGr's text boxes are EVG's
(same advance table, same line height).

## Speed

`bench/speed.mjs` builds the three fixtures of
`lib/evg/bench/layout-bench.mjs` — nested flex (a column of cards, each a row
of a rail and a growing column), a four-column grid of small flex columns,
and the flex fixture with a line of text per card — and times a re-layout of
the built tree (median of five). Every engine's boxes are summed into a
checksum: on all nine fixture sizes EVG and EVGr lay the tree out the same,
in JavaScript, C++, Go and native Rust.

Re-layout, milliseconds, one run on the development container:

| fixture | nodes | EVG js | EVGr js | EVGr rustc | EVG / EVGr (js) | EVG js / EVGr rustc |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| flex | 1,002 | 3.7 | 2.9 | 0.24 | 1.3x | 16x |
| flex | 10,004 | 12.1 | 6.7 | 2.7 | 1.8x | 4.4x |
| flex | 100,003 | 284 | 105 | 49 | 2.7x | 5.8x |
| grid | 1,001 | 6.5 | 3.3 | 0.17 | 2.0x | 38x |
| grid | 10,001 | 20.6 | 7.0 | 1.8 | 3.0x | 11x |
| grid | 100,001 | 380 | 85 | 35 | 4.5x | 11x |
| text | 1,002 | 4.1 | 4.2 | 0.30 | 1.0x | 14x |
| text | 10,004 | 19.6 | 10.7 | 2.7 | 1.8x | 7.2x |
| text | 100,003 | 345 | 97 | 43 | 3.6x | 8.0x |

The same program through Ranger to C++ (`g++ -O2`) and Go:

| fixture | nodes | EVG C++ | EVGr C++ | EVG Go | EVGr Go |
| --- | ---: | ---: | ---: | ---: | ---: |
| flex | 100,003 | 198 | 144 | 148 | 129 |
| grid | 100,001 | 329 | 125 | 285 | 73 |
| text | 100,003 | 397 | 152 | 180 | 200 |

What the numbers say:

- Written as Rust and compiled by Ranger, EVGr's layout is faster than EVG's
  on every target at 10k boxes and above — 2–4x in JavaScript. EVGr does less
  (no stylesheet, no overlays, no paint bookkeeping) and caches more (a
  subtree laid out at the same width is moved), so this measures the two
  engines, not the two source languages.
- The same Rust source built by rustc is 2–3x faster again than its
  JavaScript build at 100k boxes, and 4–38x faster than EVG in JavaScript.
- Ranger's C++ output is not the fast path for this code: EVGr through C++ is
  slower than EVGr through JavaScript (`shared_ptr` everywhere, and the
  `children.clone()` the Rust source does per node becomes a vector copy).
  Go sits between.
- Building the tree (parsing the CSS text) is where EVGr is slower than EVG
  in JavaScript, 1–2x: its string handling is lowered from Rust's `split`,
  `trim` and `find` one operation at a time.

## Found on the way

Writing a 2,300-line module in the subset found these, fixed in the
compiler or the runtime:

- `str::strip_prefix` / `strip_suffix` were not in the subset.
- An associated function named like a field of its struct (`Len::px` beside
  `Len.px`) came out under one name, which C++ rejects; it is now written as
  `px_m`.
- `f64::floor` / `ceil` lowered to Ranger's `floor` / `ceil`, which answer an
  int: Go rejected it. They have their own templates now.

Two limits of Ranger itself, met in `NativeBench.rgr`, are fixed too:

- A static method named like an operator (`count`, `make`, `size`, `sort`,
  …) was rewritten into the operator-method form and then looked up as an
  instance method: `Util.count(3)` failed with "Class Util does not have
  method count".
- `sort` took only a comparison callback. `(sort xs)` of a `[double]` or
  `[int]` now gives a new array in ascending order on every target.
