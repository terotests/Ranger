// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The case list, written once and run twice: once through EVG's own layout and
// once through Chromium. `layout-conformance.mjs` does the running.
//
// Every case is a tree of `{ s, kids, text }` — `s` is a CSS declaration block
// that goes verbatim into the browser's `style=` attribute AND, split on `;`
// and `:`, into `EVGElement.setAttribute`. That is the whole trick: the two
// engines are handed the same characters, so a difference in the boxes is a
// difference in the engines and not in the harness.
//
// Nodes are numbered in pre-order (`n0`, `n1`, …) by both sides, so a diff can
// name the box that moved.
//
// WHERE THE HARNESS DOES INTERVENE, and why:
//
//   box-sizing: border-box   EVG's box model puts padding and border inside
//                            the declared width. That is CSS's border-box, so
//                            the browser is told to use it. Without this every
//                            padded case differs for a reason that is a
//                            documented choice rather than a defect.
//   margin/padding reset     `body` has 8px of margin in every browser.
//   font: 16px monospace     Text cases do not compare px (see the note in the
//                            conformance runner); this only stops the browser
//                            from picking a font whose metrics change between
//                            machines.
//
// The three defaults cases at the end intervene in nothing on purpose: they
// exist to measure the initial values EVG chose differently from CSS.

const box = (s, kids) => ({ s, kids: kids || [] });
const leaf = (s) => ({ s, kids: [] });

export const CASES = [
  // --- the baseline: does a row even agree ---------------------------------
  {
    id: "flex-row-fixed",
    group: "flex basics",
    why: "three fixed items in a row, with a gap",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px;gap:10px", [
      leaf("width:100px;height:40px"),
      leaf("width:150px;height:40px"),
      leaf("width:80px;height:40px"),
    ]),
  },
  {
    id: "flex-grow-3way",
    group: "flex basics",
    why: "grow distributes free space in proportion",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px;gap:20px", [
      leaf("flex-grow:1;height:40px"),
      leaf("flex-grow:2;height:40px"),
      leaf("flex-grow:1;height:40px"),
    ]),
  },
  {
    id: "flex-basis-grow",
    group: "flex basics",
    why: "flex-basis is the starting size grow adds to",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px", [
      leaf("flex-basis:100px;flex-grow:1;height:40px"),
      leaf("flex-basis:200px;flex-grow:1;height:40px"),
    ]),
  },
  {
    id: "flex-shrink-weighted",
    group: "flex basics",
    why: "overflow is removed in proportion to shrink x basis",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:400px;height:100px", [
      leaf("width:300px;flex-shrink:1;height:40px"),
      leaf("width:300px;flex-shrink:2;height:40px"),
    ]),
  },
  {
    id: "flex-shrink-zero",
    group: "flex basics",
    why: "flex-shrink:0 keeps its size and lets the line overflow",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:400px;height:100px", [
      leaf("width:300px;flex-shrink:0;height:40px"),
      leaf("width:300px;flex-shrink:1;height:40px"),
    ]),
  },
  {
    id: "flex-shorthand",
    group: "flex basics",
    why: "the `flex` shorthand, all three forms",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px", [
      leaf("flex:1;height:40px"),
      leaf("flex:2 1 0px;height:40px"),
      leaf("flex:0 0 120px;height:40px"),
    ]),
  },

  // --- min / max, and their order against grow and shrink ------------------
  {
    id: "max-width-caps-grow",
    group: "min/max",
    why: "a grown item stops at max-width and the rest goes to its siblings",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px", [
      leaf("flex-grow:1;max-width:120px;height:40px"),
      leaf("flex-grow:1;height:40px"),
    ]),
  },
  {
    id: "min-width-floors-shrink",
    group: "min/max",
    why: "a shrunk item stops at min-width and the overflow moves to its sibling",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:300px;height:100px", [
      leaf("width:300px;min-width:200px;height:40px"),
      leaf("width:300px;height:40px"),
    ]),
  },
  {
    id: "min-over-max",
    group: "min/max",
    why: "when they conflict CSS says min wins",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px", [
      leaf("width:50px;min-width:200px;max-width:100px;height:40px"),
    ]),
  },
  {
    id: "max-height-cross",
    group: "min/max",
    why: "the same clamp on the cross axis under align-items:stretch",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;width:600px;height:200px", [
      leaf("width:100px;max-height:60px"),
      leaf("width:100px;min-height:150px"),
    ]),
  },

  // --- percentages ---------------------------------------------------------
  {
    id: "percent-width",
    group: "percentages",
    why: "a percentage resolves against the parent's content box",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px;padding:20px", [
      leaf("width:50%;height:40px"),
      leaf("width:25%;height:40px"),
    ]),
  },
  {
    id: "percent-nested",
    group: "percentages",
    why: "two levels of percentage, so a resolved parent is not resolved twice",
    root: box("width:600px;height:300px;padding:10px", [
      box("width:50%;height:50%;padding:10px", [
        leaf("width:50%;height:50%"),
      ]),
    ]),
  },
  {
    id: "percent-padding",
    group: "percentages",
    why: "percentage padding resolves against the WIDTH on all four sides",
    root: box("width:400px;height:400px", [
      box("width:200px;height:200px;padding:10%", [leaf("width:100%;height:20px")]),
    ]),
  },

  // --- wrap ----------------------------------------------------------------
  {
    id: "wrap-three-lines",
    group: "wrap",
    why: "a row that runs out goes onto the next line",
    root: box("display:flex;flex-direction:row;flex-wrap:wrap;width:300px;height:300px;gap:10px;align-content:flex-start", [
      leaf("width:120px;height:40px"), leaf("width:120px;height:40px"),
      leaf("width:120px;height:40px"), leaf("width:120px;height:40px"),
      leaf("width:120px;height:40px"),
    ]),
  },
  {
    id: "wrap-align-content-between",
    group: "wrap",
    why: "align-content spreads the lines, not the items",
    root: box("display:flex;flex-direction:row;flex-wrap:wrap;width:300px;height:400px;align-content:space-between", [
      leaf("width:200px;height:40px"), leaf("width:200px;height:40px"),
      leaf("width:200px;height:40px"),
    ]),
  },
  {
    id: "wrap-align-content-stretch",
    group: "wrap",
    why: "stretch is the initial value and it grows the LINES",
    root: box("display:flex;flex-direction:row;flex-wrap:wrap;width:300px;height:400px;align-content:stretch;align-items:stretch", [
      leaf("width:200px"), leaf("width:200px"),
    ]),
  },
  {
    id: "wrap-row-column-gap",
    group: "wrap",
    why: "row-gap and column-gap set separately",
    root: box("display:flex;flex-direction:row;flex-wrap:wrap;width:300px;height:300px;row-gap:30px;column-gap:5px;align-content:flex-start", [
      leaf("width:140px;height:30px"), leaf("width:140px;height:30px"),
      leaf("width:140px;height:30px"), leaf("width:140px;height:30px"),
    ]),
  },

  // --- justify / align -----------------------------------------------------
  {
    id: "justify-space-between",
    group: "alignment",
    why: "space-between with three items",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;width:600px;height:100px", [
      leaf("width:80px;height:40px"), leaf("width:80px;height:40px"), leaf("width:80px;height:40px"),
    ]),
  },
  {
    id: "justify-space-around",
    group: "alignment",
    why: "space-around's half-gaps at the ends",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-around;width:600px;height:100px", [
      leaf("width:80px;height:40px"), leaf("width:80px;height:40px"),
    ]),
  },
  {
    id: "justify-space-evenly",
    group: "alignment",
    why: "space-evenly's equal gaps",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-evenly;width:600px;height:100px", [
      leaf("width:80px;height:40px"), leaf("width:80px;height:40px"),
    ]),
  },
  {
    id: "align-items-center",
    group: "alignment",
    why: "cross-axis centring of differently tall items",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;width:600px;height:200px", [
      leaf("width:80px;height:40px"), leaf("width:80px;height:120px"),
    ]),
  },
  {
    id: "align-items-stretch",
    group: "alignment",
    why: "an auto cross size fills the line",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;width:600px;height:200px", [
      leaf("width:80px"), leaf("width:80px;height:50px"),
    ]),
  },
  {
    id: "align-self",
    group: "alignment",
    why: "one item opting out of the container's align-items",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start;width:600px;height:200px", [
      leaf("width:80px;height:40px"),
      leaf("width:80px;height:40px;align-self:flex-end"),
      leaf("width:80px;height:40px;align-self:center"),
    ]),
  },

  // --- column direction ----------------------------------------------------
  {
    id: "column-grow",
    group: "column",
    why: "the same distribution with main and cross swapped",
    root: box("display:flex;flex-direction:column;flex-wrap:nowrap;width:200px;height:600px;gap:10px", [
      leaf("flex-grow:1;width:100px"), leaf("flex-grow:3;width:100px"),
    ]),
  },
  {
    id: "row-reverse",
    group: "column",
    why: "reversed main axis",
    root: box("display:flex;flex-direction:row-reverse;flex-wrap:nowrap;width:600px;height:100px;gap:10px", [
      leaf("width:100px;height:40px"), leaf("width:100px;height:40px"),
    ]),
  },

  // --- nesting -------------------------------------------------------------
  {
    id: "nested-flex-in-flex",
    group: "nesting",
    why: "a flex item that is itself a flex container, three deep",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:200px;gap:10px", [
      box("display:flex;flex-direction:column;flex-wrap:nowrap;flex-grow:1;gap:5px;align-items:stretch", [
        leaf("height:30px"),
        box("display:flex;flex-direction:row;flex-wrap:nowrap;height:60px;gap:5px", [
          leaf("flex-grow:1"), leaf("flex-grow:2"),
        ]),
      ]),
      leaf("width:150px;height:100px"),
    ]),
  },
  {
    id: "nested-flex-in-grid",
    group: "nesting",
    why: "a grid cell holding a flex row",
    root: box("display:grid;grid-template-columns:1fr 2fr;gap:16px;width:600px;height:200px", [
      box("display:flex;flex-direction:row;flex-wrap:nowrap;gap:8px;align-items:stretch", [
        leaf("flex-grow:1;height:50px"), leaf("flex-grow:1;height:50px"),
      ]),
      leaf("height:80px"),
    ]),
  },
  {
    id: "nested-grid-in-flex",
    group: "nesting",
    why: "a flex item that is a grid container",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:200px;align-items:stretch", [
      box("display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;flex-grow:1", [
        leaf("height:40px"), leaf("height:40px"), leaf("height:40px"),
      ]),
    ]),
  },

  // --- grid ----------------------------------------------------------------
  {
    id: "grid-fr-gap",
    group: "grid",
    why: "the interface the question asked about, verbatim",
    root: box("display:grid;grid-template-columns:1fr 2fr;gap:16px;padding:24px;width:800px;height:200px", [
      leaf("height:80px"), leaf("height:80px"),
    ]),
  },
  {
    id: "grid-mixed-tracks",
    group: "grid",
    why: "px, %, fr and auto in one template",
    root: box("display:grid;grid-template-columns:100px 25% 1fr;gap:10px;width:600px;height:150px", [
      leaf("height:50px"), leaf("height:50px"), leaf("height:50px"),
    ]),
  },
  {
    id: "grid-repeat-minmax",
    group: "grid",
    why: "repeat() and minmax() together",
    root: box("display:grid;grid-template-columns:repeat(3, minmax(80px, 1fr));gap:12px;width:500px;height:150px", [
      leaf("height:50px"), leaf("height:50px"), leaf("height:50px"),
    ]),
  },
  {
    id: "grid-auto-placement",
    group: "grid",
    why: "seven items into three columns: implicit rows, in order",
    root: box("display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:60px 60px 60px;gap:8px;width:600px;height:300px", [
      leaf(""), leaf(""), leaf(""), leaf(""), leaf(""), leaf(""), leaf(""),
    ]),
  },
  {
    id: "grid-span",
    group: "grid",
    why: "an item spanning two columns pushes the rest along",
    root: box("display:grid;grid-template-columns:repeat(4, 1fr);grid-template-rows:50px 50px;gap:10px;width:600px;height:200px", [
      leaf("grid-column:span 2"), leaf(""), leaf(""), leaf(""),
    ]),
  },
  {
    id: "grid-explicit-lines",
    group: "grid",
    why: "grid-column / grid-row by line number",
    root: box("display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:50px 50px;gap:10px;width:600px;height:200px", [
      leaf("grid-column:2 / 4;grid-row:1 / 3"),
      leaf("grid-column:1 / 2;grid-row:2 / 3"),
    ]),
  },
  {
    id: "grid-areas",
    group: "grid",
    why: "grid-template-areas and grid-area by name",
    root: box(
      "display:grid;grid-template-columns:120px 1fr;grid-template-rows:60px 1fr;gap:8px;width:600px;height:300px;" +
        'grid-template-areas:"head head" "side main"',
      [leaf("grid-area:head"), leaf("grid-area:side"), leaf("grid-area:main")]
    ),
  },
  {
    id: "grid-auto-flow-dense",
    group: "grid",
    why: "dense backfills the hole a span leaves",
    root: box("display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:40px 40px;gap:6px;grid-auto-flow:row dense;width:600px;height:200px", [
      leaf("grid-column:span 2"), leaf(""), leaf(""), leaf(""),
    ]),
  },
  {
    id: "grid-fit-content",
    group: "grid",
    why: "fit-content() as a track function",
    root: box("display:grid;grid-template-columns:fit-content(200px) 1fr;gap:10px;width:600px;height:120px", [
      leaf("width:300px;height:40px"), leaf("height:40px"),
    ]),
  },

  // --- absolute, overflow --------------------------------------------------
  {
    id: "absolute-child",
    group: "absolute",
    why: "an absolute child is positioned against its container and taken out of flow",
    root: box("position:relative;display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:200px;padding:20px", [
      leaf("width:100px;height:40px"),
      leaf("position:absolute;left:30px;top:50px;width:80px;height:80px"),
      leaf("width:100px;height:40px"),
    ]),
  },
  {
    id: "absolute-right-bottom",
    group: "absolute",
    why: "right/bottom anchoring, and left+right together as a width",
    root: box("position:relative;width:600px;height:200px", [
      leaf("position:absolute;right:20px;bottom:30px;width:100px;height:50px"),
      leaf("position:absolute;left:10px;right:10px;top:0px;height:20px"),
    ]),
  },
  {
    id: "overflow-hidden-box",
    group: "overflow",
    why: "a child larger than an overflow:hidden parent: the BOX, not the clip",
    root: box("width:400px;height:200px;overflow:hidden", [
      leaf("width:600px;height:300px"),
    ]),
  },

  // --- the initial values EVG chose differently ----------------------------
  {
    id: "defaults-flex-direction",
    group: "defaults",
    why: "CSS's initial flex-direction is row; nothing is stated here",
    root: box("display:flex;width:600px;height:200px", [
      leaf("width:100px;height:40px"), leaf("width:100px;height:40px"),
    ]),
  },
  {
    id: "defaults-flex-wrap",
    group: "defaults",
    why: "CSS's initial flex-wrap is nowrap; nothing is stated here",
    root: box("display:flex;flex-direction:row;width:300px;height:200px", [
      leaf("width:200px;height:40px"), leaf("width:200px;height:40px"),
    ]),
  },
  {
    id: "defaults-align-items",
    group: "defaults",
    why: "CSS's initial align-items is stretch; nothing is stated here",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:200px", [
      leaf("width:100px"), leaf("width:100px"),
    ]),
  },

  // --- the ones expected to be absent, asked anyway ------------------------
  {
    id: "intrinsic-keyword-width",
    group: "intrinsic keywords",
    why: "width:min-content / max-content as a stated value",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px", [
      leaf("width:max-content;height:40px"),
      leaf("width:min-content;height:40px"),
      leaf("width:fit-content;height:40px"),
    ]),
  },
  {
    id: "aspect-ratio",
    group: "aspect-ratio",
    why: "aspect-ratio deriving the height from the width",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:300px;align-items:flex-start", [
      leaf("width:200px;aspect-ratio:2 / 1"),
    ]),
  },
  {
    id: "calc-width",
    group: "calc",
    why: "calc() as a length",
    root: box("width:600px;height:200px", [leaf("width:calc(100% - 40px);height:40px")]),
  },
  {
    id: "auto-fit-repeat",
    group: "auto-fit",
    why: "repeat(auto-fit, …), the responsive card deck idiom",
    root: box("display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:10px;width:600px;height:200px", [
      leaf("height:50px"), leaf("height:50px"), leaf("height:50px"), leaf("height:50px"),
    ]),
  },
];

// Text cases are kept apart because they are NOT compared px-for-px: EVG's
// default measurer is a heuristic (`fontSize * 0.55`) and the browser's is a
// real face, so a pixel diff here would measure the fixture and not the
// engine. What is asserted instead is that text participates in layout at all
// — that a box shrink-wraps to its content, that a wrapped paragraph makes its
// parent taller, and that baseline alignment moves a box. The engine's own
// font parity is a separate, existing suite (`evg:measure:web`, the textbox
// oracle), which checks the same TTF through layout and through Chromium.
export const TEXT_CASES = [
  {
    id: "text-shrink-wrap",
    why: "a text leaf takes its measured width, not the parent's",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px;align-items:flex-start", [
      { s: "font-size:16px", kids: [], text: "Short" },
      { s: "font-size:16px", kids: [], text: "A considerably longer run of text" },
    ]),
    assert: (n) => n[1].w > 0 && n[2].w > n[1].w && n[2].w < 600,
    says: "both leaves are narrower than the parent and the longer string is wider",
  },
  {
    id: "text-wrap-grows-parent",
    why: "wrapping inside a narrow column makes the column taller",
    root: box("display:flex;flex-direction:column;width:200px;align-items:stretch", [
      { s: "font-size:16px;width:200px", kids: [], text: "One two three four five six seven eight nine ten eleven twelve" },
    ]),
    assert: (n) => n[1].h > 20,
    says: "the wrapped run is taller than one line",
  },
  {
    id: "text-baseline-align",
    why: "align-items:baseline lines the text up on its baseline, not its box top",
    root: box("display:flex;flex-direction:row;flex-wrap:nowrap;align-items:baseline;width:600px;height:100px", [
      { s: "font-size:12px", kids: [], text: "small" },
      { s: "font-size:32px", kids: [], text: "BIG" },
    ]),
    assert: (n) => n[1].y > n[2].y,
    says: "the smaller run is pushed down so the two baselines meet",
  },
];
