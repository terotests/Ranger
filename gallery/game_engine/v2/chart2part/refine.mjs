// ============================================================================
// refine.mjs — snap measured DISC centers/diameters to the chart pixels.
// ============================================================================
// Eyeballing a blurry scan is the error source. For each disc part, iteratively
// take the dark-pixel centroid in a local window (concentric rings are symmetric
// → the centroid IS the center), then read the outer-ring diameter from a radial
// histogram of dark pixels. Prints refined centerPx/diaPx to paste into
// playfield_chart.json. Reliable, not eyeballed.
//
//   node refine.mjs <chartImg> [win]
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const HERE = path.dirname(fileURLToPath(import.meta.url));

const CHART = process.argv[2] || "/root/.claude/uploads/546c983d-e553-56ad-a79e-76745f826063/0f79461d-63022d617906affb6602992e142b3e43c5092236.jpeg";
const WIN = parseInt(process.argv[3] || "55", 10);   // half-window (px) around the rough center
const chartJson = JSON.parse(fs.readFileSync(path.join(HERE, "playfield_chart.json"), "utf8"));
const discs = Object.entries(chartJson.parts).filter(([, p]) => p.type === "disc");

const b64 = fs.readFileSync(CHART).toString("base64");
const ext = path.extname(CHART).slice(1).toLowerCase();
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent(`<canvas id="c"></canvas>`);
const out = await page.evaluate(async (A) => {
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = A.uri; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.getElementById("c"); c.width = W; c.height = H;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  const gray = (px, py) => { const i = (py * W + px) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3; };
  const DARK = 150;
  const res = {};
  const RMIN = A.rmin, RMAX = A.rmax, SRCH = 26;   // radius range + center-search ±SRCH
  for (const [name, p] of A.discs) {
    const rcx = p.centerPx[0], rcy = p.centerPx[1];
    // Hough circle vote: every dark ring pixel votes for centers at each radius;
    // both concentric rings share the true center → a strong shared peak, robust
    // to nearby dark features (guide wires, neighbours) outside the radius band.
    const S = 2 * SRCH + 1;
    const acc = new Float64Array(S * S);
    for (let yy = rcy - RMAX - SRCH; yy <= rcy + RMAX + SRCH; yy++)
      for (let xx = rcx - RMAX - SRCH; xx <= rcx + RMAX + SRCH; xx++) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || gray(xx, yy) >= DARK) continue;
        for (let r = RMIN; r <= RMAX; r += 1)
          for (let t = 0; t < 48; t++) {
            const a = (t / 48) * 2 * Math.PI;
            const vx = Math.round(xx - r * Math.cos(a)) - (rcx - SRCH);
            const vy = Math.round(yy - r * Math.sin(a)) - (rcy - SRCH);
            if (vx >= 0 && vy >= 0 && vx < S && vy < S) acc[vy * S + vx] += 1 / r;
          }
      }
    let best = -1, bx = SRCH, by = SRCH;
    for (let i = 0; i < S * S; i++) if (acc[i] > best) { best = acc[i]; bx = i % S; by = (i / S) | 0; }
    const cx = rcx - SRCH + bx, cy = rcy - SRCH + by;
    // outer-ring radius from a radial histogram about the Hough center
    const bins = new Array(RMAX + 6).fill(0);
    for (let yy = cy - RMAX - 4; yy <= cy + RMAX + 4; yy++) for (let xx = cx - RMAX - 4; xx <= cx + RMAX + 4; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const r = Math.round(Math.hypot(xx - cx, yy - cy));
      if (r < bins.length && gray(xx, yy) < DARK) bins[r] += 1 / Math.max(1, r);
    }
    const peak = Math.max(...bins);
    let outer = RMAX;
    for (let r = RMAX + 5; r >= RMIN; r--) { if (bins[r] >= 0.4 * peak) { outer = r; break; } }
    res[name] = { cx: cx, cy: cy, dia: outer * 2 };
  }
  // draw the CURRENT JSON centers (blue) + auto-detected (red) on the chart for a
  // direct visual check — nudge the JSON blue circles until they sit on the parts.
  x.lineWidth = 2;
  for (const [name, p] of A.discs) {
    x.strokeStyle = "#0060ff"; x.fillStyle = "#0060ff";               // JSON (blue)
    x.beginPath(); x.arc(p.centerPx[0], p.centerPx[1], p.diaPx / 2, 0, 2 * Math.PI); x.stroke();
    x.beginPath(); x.arc(p.centerPx[0], p.centerPx[1], 3, 0, 2 * Math.PI); x.fill();
    const r = res[name];
    x.strokeStyle = "#ff0000"; x.fillStyle = "#ff0000";               // Hough (red)
    x.beginPath(); x.arc(r.cx, r.cy, r.dia / 2, 0, 2 * Math.PI); x.stroke();
    x.beginPath(); x.arc(r.cx, r.cy, 3, 0, 2 * Math.PI); x.fill();
  }
  // triangle parts (blue outline + corner dots) for the same visual check
  const allx = [], ally = [];
  for (const [name, p] of A.triangles) {
    x.strokeStyle = "#0060ff"; x.fillStyle = "#0060ff";
    x.beginPath();
    p.cornersPx.forEach((c, j) => { j ? x.lineTo(c[0], c[1]) : x.moveTo(c[0], c[1]); allx.push(c[0]); ally.push(c[1]); });
    x.closePath(); x.stroke();
    for (const c of p.cornersPx) { x.beginPath(); x.arc(c[0], c[1], 4, 0, 2 * Math.PI); x.fill(); }
  }
  // crop to cover all discs + triangles
  const xs = Object.values(res);
  for (const r of xs) { allx.push(r.cx); ally.push(r.cy); }
  const minx = Math.min(...allx) - 90, maxx = Math.max(...allx) + 90;
  const miny = Math.min(...ally) - 90, maxy = Math.max(...ally) + 90;
  const cw = maxx - minx, ch = maxy - miny;
  const oc = document.createElement("canvas"); oc.width = cw * 2; oc.height = ch * 2;
  const ox = oc.getContext("2d"); ox.imageSmoothingEnabled = false;
  ox.drawImage(c, minx, miny, cw, ch, 0, 0, cw * 2, ch * 2);
  return { res, mark: oc.toDataURL("image/png") };
}, { uri: `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${b64}`, discs, triangles: Object.entries(chartJson.parts).filter(([, p]) => p.type === "triangle"), win: WIN, rmin: 18, rmax: 50 });

fs.writeFileSync("/home/user/Ranger/tmp/measure/refine_mark.png", Buffer.from(out.mark.split(",")[1], "base64"));
const res = out.res || out;
await browser.close();
console.log("refined disc measurements (paste into playfield_chart.json):");
console.log("marked chart: /home/user/Ranger/tmp/measure/refine_mark.png");
for (const [name, r] of Object.entries(res)) {
  const old = chartJson.parts[name];
  const dx = r.cx - old.centerPx[0], dy = r.cy - old.centerPx[1];
  console.log(`  ${name}: centerPx [${r.cx}, ${r.cy}]  diaPx ${r.dia}   (was [${old.centerPx[0]}, ${old.centerPx[1]}] Δ[${dx},${dy}])`);
}
