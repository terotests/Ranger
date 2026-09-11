// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A stroke's corners and ends, measured rather than looked at.
//
//   node gallery/evg/gl/stroke-check.mjs
//
// The painter turns a polyline into triangles, and until the joins existed
// it turned it into a chain of SEPARATE BARS: two rectangles meeting at an
// angle cover the inside of the turn twice and the outside not at all, so a
// thick line came apart at every corner. That is invisible in a unit test
// that counts commands and obvious on a page, which is the combination that
// keeps a bug.
//
// So this measures area. An L of two 100-long segments at width 20 is two
// 2,000 quads and a corner; what goes in the corner is exactly what the
// join is, and each of them has a number that can be worked out on paper:
//
//   miter, 90°   the 10 x 10 square the quads left empty          100
//   bevel        the triangle across it                            50
//   round        a disc of radius 10 at each of the three vertices
//   square cap   half a width added to each open end            2 x 200
//
// Areas are summed with the shoelace formula over every triangle, so an
// overlap counts twice — which is why the round numbers below are ranges
// and the flat ones are exact.

import { strokeTriangles } from "./evg-webgl.js";

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) {
    passed += 1;
    console.log("  PASS  " + name + (detail ? " (" + detail + ")" : ""));
  } else {
    failed += 1;
    console.log("  FAIL  " + name + (detail ? " (" + detail + ")" : ""));
  }
};
const near = (a, b, eps) => Math.abs(a - b) <= eps;

/** The area of a triangle soup, overlaps counted twice. */
function area(tris) {
  let a = 0;
  for (let i = 0; i + 5 < tris.length; i += 6) {
    a += Math.abs(
      (tris[i + 2] - tris[i]) * (tris[i + 5] - tris[i + 1]) -
        (tris[i + 4] - tris[i]) * (tris[i + 3] - tris[i + 1]),
    ) / 2;
  }
  return a;
}

/** Is any triangle covering this point? */
function covers(tris, px, py) {
  const side = (ax, ay, bx, by) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  for (let i = 0; i + 5 < tris.length; i += 6) {
    const d1 = side(tris[i], tris[i + 1], tris[i + 2], tris[i + 3]);
    const d2 = side(tris[i + 2], tris[i + 3], tris[i + 4], tris[i + 5]);
    const d3 = side(tris[i + 4], tris[i + 5], tris[i], tris[i + 1]);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    if (!(neg && pos)) return true;
  }
  return false;
}

const L = [0, 0, 100, 0, 100, 100];
const LINE = [0, 0, 100, 0];
const BOX = [0, 0, 100, 0, 100, 100, 0, 100, 0, 0];
const W = 20;

console.log("=== stroke caps and joins ===");

// --- the corner is filled, and by the right amount ------------------------
{
  const miter = strokeTriangles([L], W, 0, 0);
  ok("a miter corner is the square the quads left empty", near(area(miter), 4100, 0.01), area(miter).toFixed(1));
  const bevel = strokeTriangles([L], W, 0, 2);
  ok("a bevel is the triangle across it", near(area(bevel), 4050, 0.01), area(bevel).toFixed(1));
  const round = strokeTriangles([L], W, 0, 1);
  ok("a round join is a disc at the vertex", area(round) > 4200 && area(round) < 5000, area(round).toFixed(1));
}

// --- the outside of the turn is actually covered --------------------------
{
  const butt = strokeTriangles([L], W, 0, 99); // an unknown join: bevel only
  // The far corner of the turn, a whisker inside the outer edge.
  ok("the outer corner is covered", covers(strokeTriangles([L], W, 0, 0), 109, -9));
  ok("and was not before a join existed", !covers(
    // What the painter drew before: the two quads alone.
    strokeTriangles([[0, 0, 100, 0]], W, 0, 0).concat(strokeTriangles([[100, 0, 100, 100]], W, 0, 0)),
    109, -9,
  ));
  ok("an unknown join still bevels rather than gapping", covers(butt, 105, -5));
}

// --- caps ------------------------------------------------------------------
{
  const butt = strokeTriangles([LINE], W, 0, 0);
  ok("a butt cap stops where the line stops", near(area(butt), 2000, 0.01), area(butt).toFixed(1));
  ok("and draws nothing past it", !covers(butt, 105, 0));
  const square = strokeTriangles([LINE], W, 2, 0);
  ok("a square cap runs on by half a width", near(area(square), 2400, 0.01), area(square).toFixed(1));
  ok("which covers the point past the end", covers(square, 105, 0));
  ok("but not two widths past it", !covers(square, 115, 0));
  const round = strokeTriangles([LINE], W, 1, 0);
  ok("a round cap is a disc at each end", area(round) > 2400 && area(round) < 2700, area(round).toFixed(1));
  ok("round covers just past the end", covers(round, 105, 0));
  ok("and not the corner a square cap would fill", !covers(round, 109, 9));
}

// --- a closed ring has joins, not caps ------------------------------------
{
  const closed = strokeTriangles([BOX], W, 1, 0);
  ok("a closed ring gets no cap blob on its seam", near(area(closed), 4 * 2000 + 4 * 100, 0.01), area(closed).toFixed(1));
  ok("and its seam corner is filled", covers(closed, -9, -9));
}

// --- a near-reversal does not grow a spike --------------------------------
{
  const hairpin = [0, 0, 100, 0, 0, 1];
  const t = strokeTriangles([hairpin], W, 0, 0);
  let far = 0;
  for (let i = 0; i < t.length; i += 2) far = Math.max(far, t[i]);
  ok("the miter is cut back at the limit", far < 100 + 4 * (W / 2) + 1, "furthest x " + far.toFixed(1));
}

// --- a degenerate ring is not a crash -------------------------------------
{
  ok("a ring with one point draws nothing", strokeTriangles([[5, 5]], W, 1, 1).length === 0);
  ok("a zero-length segment draws nothing", strokeTriangles([[5, 5, 5, 5]], W, 1, 1).length === 0);
  ok("and no rings at all is no triangles", strokeTriangles([], W, 1, 1).length === 0);
}

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
