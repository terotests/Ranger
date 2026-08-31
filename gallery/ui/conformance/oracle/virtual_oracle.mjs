/**
 * TanStack Virtual, asked what it actually does.
 *
 *   node gallery/ui/conformance/oracle/virtual_oracle.mjs
 *
 * Writes `virtual.json` beside this file. `VirtualCtl.rgr` is built against
 * these numbers; nothing reads the file at run time.
 *
 * WHY TANSTACK VIRTUAL. `TableCtl` is already measured against
 * `@tanstack/react-table`, and `@tanstack/virtual-core` is its sibling — the
 * same library family, and the one every shadcn-adjacent virtual table reaches
 * for. It is also PURE COMPUTATION: count in, a range out, no DOM. So unlike
 * the sortable's oracle this one needs no browser at all, which is the whole
 * reason it can be driven over hundreds of offsets in a second.
 *
 * WHAT IS ACTUALLY IN QUESTION. "Show the rows that fit" is easy and is not
 * what a virtualiser decides. The decisions are at the edges:
 *
 *   1. Is a row that is HALF scrolled past still in the range? (Both ends.)
 *   2. What does `overscan` add — rows beyond the viewport in each direction,
 *      and what happens when there is no room for them at the top or bottom?
 *   3. Where does each row START, and does the total height come from the
 *      count times the estimate or from something else?
 *   4. What happens at offset 0, at the very bottom, and past the bottom?
 *
 * Every one of those is a place a hand-written virtualiser gets it wrong by
 * one row, which is a blank strip at the edge of the viewport.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(HERE, "..", "dom", "package.json"));

const { Virtualizer, elementScroll, observeElementRect, observeElementOffset } =
  require("@tanstack/virtual-core");

// A viewport that is not a whole number of rows, on purpose: 320 / 46 is
// 6.95, so the bottom row is always partly cut and the "is a half row in the
// range" question has an answer at every offset rather than only at some.
const COUNT = 10000;
const ROW = 46;
const VIEWPORT = 320;

/**
 * Drive the real virtualiser at one scroll offset and read the range back.
 *
 * `virtual-core` is written against a live element — it measures the viewport
 * and subscribes to its scroll. There is no element here, so the observers are
 * replaced by ones that report the numbers this file is asking about. That is
 * not a stand-in for the library: every line that DECIDES anything is still
 * TanStack's, and only the two lines that would have read a DOM rectangle are
 * ours.
 */
function rangeAt(offset, overscan) {
  const v = new Virtualizer({
    count: COUNT,
    estimateSize: () => ROW,
    overscan,
    getScrollElement: () => ({}),
    scrollToFn: elementScroll,
    observeElementRect: (instance, cb) => { cb({ width: 600, height: VIEWPORT }); },
    observeElementOffset: (instance, cb) => { cb(offset, false); },
    getItemKey: (i) => i,
  });
  v._willUpdate();
  const items = v.getVirtualItems();
  return {
    offset,
    overscan,
    first: items.length ? items[0].index : -1,
    last: items.length ? items[items.length - 1].index : -1,
    shown: items.length,
    firstStart: items.length ? items[0].start : -1,
    total: v.getTotalSize(),
  };
}

const out = {
  $comment:
    "Captured from @tanstack/virtual-core. Regenerate with `npm run ui:virtual:oracle`.",
  library: "@tanstack/virtual-core@" +
    JSON.parse(fs.readFileSync(
      path.join(HERE, "..", "dom", "node_modules", "@tanstack", "virtual-core", "package.json"),
      "utf8",
    )).version,
  fixture: { count: COUNT, rowHeight: ROW, viewport: VIEWPORT },
  // The whole span, so the total height is not a guess either.
  totalSize: rangeAt(0, 0).total,
  // No overscan first: this is the bare "what fits" answer, and everything
  // else is measured as a delta from it.
  exact: [],
  // Then the same offsets with overscan, which is where the edges bite.
  overscanned: [],
};

// Offsets chosen to land ON a row boundary, just past one, just before one,
// at zero, at the very bottom and past it — the six places an off-by-one
// lives.
const OFFSETS = [
  0, 1, 45, 46, 47, 92, 100, 500, 1000, 4600, 45.5, 229999, 459954, 459955, 500000,
];

for (const o of OFFSETS) out.exact.push(rangeAt(o, 0));
for (const o of OFFSETS) {
  for (const n of [1, 3, 5]) out.overscanned.push(rangeAt(o, n));
}

fs.writeFileSync(path.join(HERE, "virtual.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote virtual.json —", out.exact.length + out.overscanned.length, "observations");
console.log("total size:", out.totalSize);
for (const r of out.exact.slice(0, 8)) {
  console.log(`  offset ${String(r.offset).padStart(7)}  rows ${r.first}..${r.last} (${r.shown})  first starts ${r.firstStart}`);
}
