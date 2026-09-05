/**
 * No shape may be separated from its own ink by the page behind it.
 *
 *   npm run pptx:seam:scan
 *
 * WHY A PIXEL SCAN AND NOT A UNIT TEST. `PptxSeamTest` pins the arithmetic and
 * one constructed case; this looks at every rendered editor snapshot and asks
 * the question a person asks when they zoom in — is there a hairline of paper
 * between a filled shape and the border drawn around it? That is how the bug
 * was reported in the first place, from a screenshot, and no assertion about
 * rounding would have caught the second half of it.
 *
 * There were two causes and they needed different fixes:
 *
 *   THE STRAIGHT EDGES. `PptxView.paintSoftCanvas` snapped a rectangle to the
 *   grid by truncating its position and its size independently, which loses up
 *   to two pixels off the right and the bottom. Fixed by rounding the two
 *   EDGES instead.
 *
 *   THE CORNERS. Even then a rounded box kept one pixel at the top of its arc,
 *   because the fill went out as a rectangle command and was snapped, while
 *   the outline went out as a polygon and was not — two approximations of two
 *   slightly different rectangles. Fixed by filling such a box from the SAME
 *   ring its outline is stroked from.
 *
 * A one-pixel gap is the signature. Two or more is spacing somebody meant, so
 * this looks for exactly one, between a saturated fill and darker ink.
 *
 * WHAT THIS DOES AND DOES NOT PROTECT. Reverting the corner fix brings the
 * seam back here and this fails. Reverting the EDGE fix does not, and that is
 * not a hole in the scan so much as a fact about the snapshots: the only
 * shapes in them that show a long seam are rounded boxes, and those now fill
 * from their outline's ring, so they never reach the rectangle snapping at
 * all. `PptxSeamTest` is what holds that half — revert the edge fix and three
 * of its assertions fail. Two gates, one for each cause; neither covers both,
 * and it is worth knowing which is which before trusting a green run.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DIR = "gallery/pptx/artifacts";

function decode(file) {
  const buf = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8);
    const d = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; }
    if (type === "IDAT") idat.push(d);
    p += len + 12;
  }
  const ch = ct === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch, px = Buffer.alloc(h * stride);
  for (let y = 0, o = 0; y < h; y++) {
    const f = raw[o++], line = raw.subarray(o, o + stride); o += stride;
    const cur = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const q = a + b - c, da = Math.abs(q - a), db = Math.abs(q - b), dc = Math.abs(q - c);
        v += (da <= db && da <= dc) ? a : (db <= dc ? b : c);
      }
      cur[i] = v & 255;
    }
  }
  return { w, h, ch, stride, px };
}

const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
let total = 0, worst = null;
const files = fs.readdirSync(DIR).filter((n) => n.endsWith(".png")).sort();
if (files.length === 0) { console.error("no snapshots in " + DIR); process.exit(2); }

for (const name of files) {
  const { w, h, ch, stride, px } = decode(path.join(DIR, name));
  const at = (x, y) => { const s = y * stride + x * ch; return [px[s], px[s + 1], px[s + 2]]; };
  let hits = 0, first = null;
  for (let y = 0; y < h; y++) {
    for (let x = 1; x < w - 3; x++) {
      const [r0, g0, b0] = at(x, y);
      if (sat(r0, g0, b0) < 40) continue;             // a coloured fill
      const [r1, g1, b1] = at(x + 1, y);
      if (!(r1 > 235 && g1 > 235 && b1 > 235)) continue; // exactly one of paper
      const [r2, g2, b2] = at(x + 2, y);
      if (r2 > 235 && g2 > 235 && b2 > 235) continue;    // two is spacing
      if (Math.max(r2, g2, b2) < 150 && sat(r2, g2, b2) < 60) {
        hits++; if (!first) first = `${x + 1},${y}`;
      }
    }
  }
  total += hits;
  if (hits > 0) {
    console.log(`  ${name}: ${hits} pixel(s) of paper between a shape and its ink, first at ${first}`);
    if (!worst) worst = name;
  }
}

if (total === 0) {
  console.log(`  ${files.length} snapshots, no shape separated from its own ink`);
  console.log("ALL PASS");
} else {
  console.log(`\n${total} seam pixel(s) across the snapshots — see ${worst}`);
  console.log("FAILURES");
  process.exit(1);
}
