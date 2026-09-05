/**
 * VirtualCtl against the numbers TanStack Virtual actually produced.
 *
 *   node gallery/ui/conformance/oracle/virtual_check.mjs
 *
 * Sixty observations out of `virtual.json`, replayed against the Ranger
 * controller. No browser: the oracle is pure computation and so is this.
 *
 * The two things it is really asking, because they are the two a hand-written
 * virtualiser gets wrong and neither is visible in a screenshot of a table
 * that is not being scrolled:
 *
 *   a PARTIALLY scrolled row is still in the range, at both ends;
 *   OVERSCAN is a plain widening that clamps, and does not push the rows it
 *   could not add at one end onto the other.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "virtual.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const mk = (overscan) => {
  const v = new H.VirtualCtl();
  v.tid = "virt";
  v.count = oracle.fixture.count;
  v.rowHeight = oracle.fixture.rowHeight;
  v.viewport = oracle.fixture.viewport;
  v.overscan = overscan;
  return v;
};

console.log("--- the range, at every offset TanStack was asked about ---");
for (const group of [oracle.exact, oracle.overscanned]) {
  for (const r of group) {
    const v = mk(r.overscan);
    // Set the offset DIRECTLY rather than through `scrollTo`, because the
    // oracle was driven past the end of the content on purpose and clamping
    // it here would be answering a different question. `scrollTo`'s own
    // clamping is checked separately below.
    v.scrollOffset = r.offset;
    const label = `offset ${r.offset} overscan ${r.overscan}`;
    ok(label + " first", v.firstVisible() === r.first, `${v.firstVisible()} vs ${r.first}`);
    ok(label + " last", v.lastVisible() === r.last, `${v.lastVisible()} vs ${r.last}`);
    ok(label + " count", v.shownCount() === r.shown, `${v.shownCount()} vs ${r.shown}`);
    ok(label + " start", Math.abs(v.startOf(v.firstVisible()) - r.firstStart) < 0.001,
      `${v.startOf(v.firstVisible())} vs ${r.firstStart}`);
  }
}

console.log("--- the total, which is what sizes a scrollbar ---");
{
  const v = mk(0);
  ok("total size", Math.abs(v.totalSize() - oracle.totalSize) < 0.001,
    `${v.totalSize()} vs ${oracle.totalSize}`);
  // The point of the exercise: the height comes from the COUNT, not from the
  // rows that happen to exist.
  ok("and it does not depend on the range", (() => {
    v.scrollOffset = 200000;
    return Math.abs(v.totalSize() - oracle.totalSize) < 0.001;
  })());
}

console.log("--- the padding puts the built rows where their records would be ---");
{
  const v = mk(0);
  for (const offset of [0, 45, 46, 100, 4600, 229999]) {
    v.scrollOffset = offset;
    const top = v.paddingTop();
    const bottom = v.paddingBottom();
    const drawn = v.shownCount() * v.rowHeight;
    // Top padding, the rows that exist, and bottom padding have to add up to
    // the whole content — otherwise the scrollbar and the rows disagree about
    // how far down the page you are.
    ok(`padding adds up at ${offset}`, Math.abs((top + drawn + bottom) - v.totalSize()) < 0.001,
      `${top} + ${drawn} + ${bottom} vs ${v.totalSize()}`);
    ok(`top padding is the first row's start at ${offset}`,
      Math.abs(top - v.startOf(v.firstVisible())) < 0.001);
  }
}

console.log("--- scrolling is clamped at both ends ---");
{
  const v = mk(0);
  ok("cannot go above the top", v.scrollTo(-500) === false || v.scrollOffset === 0, `${v.scrollOffset}`);
  v.scrollTo(0);
  ok("at the top already is not a move", v.scrollTo(0) === false);
  ok("can be scrolled", v.scrollTo(1000) === true && v.scrollOffset === 1000);
  const max = oracle.totalSize - oracle.fixture.viewport;
  v.scrollTo(1e9);
  ok("and stops at the bottom", Math.abs(v.scrollOffset - max) < 0.001, `${v.scrollOffset} vs ${max}`);
  ok("which still shows the last row", v.lastVisible() === oracle.fixture.count - 1,
    `${v.lastVisible()}`);
  ok("pressing on at the bottom is not a move", v.scrollTo(1e9) === false);
}

console.log("--- scrollToIndex moves the minimum ---");
{
  const v = mk(0);
  ok("a row already in view does not move it", v.scrollToIndex(3) === false, `${v.scrollOffset}`);
  ok("a row below scrolls just enough", v.scrollToIndex(10) === true);
  // Just enough means the row's BOTTOM is at the viewport's bottom, not that
  // the row is at the top — the minimum move keeps everything else where the
  // eye left it.
  const bottom = v.startOf(10) + v.rowHeight;
  ok("with the row at the bottom edge", Math.abs(v.scrollOffset - (bottom - v.viewport)) < 0.001,
    `${v.scrollOffset} vs ${bottom - v.viewport}`);
  ok("and it is now visible", v.firstVisible() <= 10 && v.lastVisible() >= 10);
  v.scrollTo(5000);
  ok("a row above scrolls to its top", v.scrollToIndex(20) === true &&
    Math.abs(v.scrollOffset - v.startOf(20)) < 0.001, `${v.scrollOffset} vs ${v.startOf(20)}`);
}

console.log("--- what a reader is owed ---");
{
  const v = mk(0);
  v.scrollTo(200000);
  // THE FINDING. Twelve rows in the tree, ten thousand in the data. Without
  // these two a reader is told the table has twelve rows and that the third
  // one is row 3.
  ok("rowcount is the whole table", v.rowCount() === oracle.fixture.count, `${v.rowCount()}`);
  ok("and not what is built", v.rowCount() !== v.shownCount());
  const first = v.firstVisible();
  // 1-based and counting the header, which is what an HTML table's own row
  // indices are.
  ok("the first built row knows where it really is", v.rowIndexOf(first) === first + 2,
    `${v.rowIndexOf(first)} vs ${first + 2}`);
  ok("which is nowhere near 1", v.rowIndexOf(first) > 4000, `${v.rowIndexOf(first)}`);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
