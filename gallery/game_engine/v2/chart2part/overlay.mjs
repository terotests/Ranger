// ============================================================================
// overlay.mjs — validate part placement against the chart (PROCESS.md §6).
// ============================================================================
// Solves the EXACT world→pixel map from green fiducials the guest renders at the
// known table-plane corners (no assumptions about the camera), then:
//  • draws the chart under the render through that map (eyeball check), and
//  • per keyed part computes silhouette IoU (rendered filled red mask vs the
//    outline the measurements imply) + centroid error in world units.
//
//   node overlay.mjs [renderPng] [chartImg] [out.png]
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { computeParts } from "./transform.mjs";

const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const HERE = path.dirname(fileURLToPath(import.meta.url));

const RENDER = process.argv[2] || "/home/user/Ranger/tmp/pinball3d/pinball_gpu.png";
const CHART = process.argv[3] || "/root/.claude/uploads/546c983d-e553-56ad-a79e-76745f826063/0f79461d-63022d617906affb6602992e142b3e43c5092236.jpeg";
const OUT = process.argv[4] || "/home/user/Ranger/tmp/measure/overlay.png";

const chartJson = JSON.parse(fs.readFileSync(path.join(HERE, "playfield_chart.json"), "utf8"));
const D = computeParts(chartJson);
const cal = D.calibration;
const PW = cal.width, PL = cal.length;

// world outline of a flipper bat (convex hull of base+tip circles), local→world
function flipperWorldOutline(p, n) {
  const L = p.length, rB = p.baseR, rT = p.tipR;
  const beta = Math.asin((rB - rT) / L);
  const aUp = Math.PI / 2 + beta, aLo = -(Math.PI / 2 + beta);
  const loc = [];
  for (let k = 0; k <= n; k++) { const a = aUp + (k / n) * ((aLo + 2 * Math.PI) - aUp); loc.push([rB * Math.cos(a), rB * Math.sin(a)]); }
  for (let k = 0; k <= n; k++) { const a = aLo + (k / n) * (aUp - aLo); loc.push([L + rT * Math.cos(a), rT * Math.sin(a)]); }
  const c = Math.cos(p.angle), s = Math.sin(p.angle);
  return loc.map(([lx, lz]) => [p.pivot.x + lx * c + lz * s, p.pivot.z - lx * s + lz * c]);
}

// disc footprint outline (bumper skirt etc.)
function discWorldOutline(p, n) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI; out.push([p.center.x + p.r * Math.cos(a), p.center.z + p.r * Math.sin(a)]); }
  return out;
}
function partOutline(p, n) {
  if (p.type === "flipper") return flipperWorldOutline(p, n);
  if (p.type === "disc") return discWorldOutline(p, n);
  return null;
}
const worldPolys = Object.fromEntries(Object.entries(D.parts)
  .map(([n, p]) => [n, partOutline(p, 28)]).filter(([, o]) => o));

const b64 = (f) => fs.readFileSync(f).toString("base64");
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent(`<canvas id="c"></canvas>`);

const result = await page.evaluate(async (A) => {
  function load(uri) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = uri; }); }
  const rimg = await load("data:image/png;base64," + A.render);
  const cimg = await load("data:image/jpeg;base64," + A.chart);
  const N = rimg.naturalWidth;
  const tmp = document.createElement("canvas"); tmp.width = N; tmp.height = N;
  const tx = tmp.getContext("2d"); tx.drawImage(rimg, 0, 0);
  const px = tx.getImageData(0, 0, N, N).data;

  // --- detect green fiducials → centroid per render quadrant ---
  const q = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // [n, sx, sy] for TL,TR,BL,BR
  const red = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2];
    if (g > 150 && r < 110 && b < 170) { const k = (y < N / 2 ? 0 : 2) + (x < N / 2 ? 0 : 1); q[k][0]++; q[k][1] += x; q[k][2] += y; }
    if (r > 140 && g < 90 && b < 90) red[y * N + x] = 1;
  }
  const cen = q.map((v) => v[0] ? [v[1] / v[0], v[2] / v[0]] : null);
  // known world corners per quadrant: TL(-PW/2,-PL/2) TR(+,-) BL(-,+) BR(+,+)
  const rxL = (cen[0][0] + cen[2][0]) / 2, rxR = (cen[1][0] + cen[3][0]) / 2;
  const ryT = (cen[0][1] + cen[1][1]) / 2, ryB = (cen[2][1] + cen[3][1]) / 2;
  const a = (rxR - rxL) / A.PW, b = (rxL + rxR) / 2;      // rx = a*wx + b
  const c = (ryB - ryT) / A.PL, d = (ryT + ryB) / 2;      // ry = c*wz + d
  const w2r = (wx, wz) => [a * wx + b, c * wz + d];

  // --- overlay: chart under render, through the fitted map ---
  const cc = document.getElementById("c"); cc.width = N; cc.height = N;
  const g2 = cc.getContext("2d");
  g2.fillStyle = "#fff"; g2.fillRect(0, 0, N, N);
  // chart px→render: rx = a*s*(px-cx)+b, ry = c*s*(py-cz)+d
  g2.save();
  g2.setTransform(a * A.s, 0, 0, c * A.s, b - a * A.s * A.cx, d - c * A.s * A.cz);
  g2.globalAlpha = 0.9; g2.drawImage(cimg, 0, 0); g2.restore();
  g2.globalAlpha = 0.8; g2.drawImage(rimg, 0, 0); g2.globalAlpha = 1;

  function stats(mask) { let n = 0, sx = 0, sy = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (mask[i]) { n++; sx += x; sy += y; } } return { n, cx: n ? sx / n : 0, cy: n ? sy / n : 0 }; }
  function fillPoly(poly) {
    const m2 = document.createElement("canvas"); m2.width = N; m2.height = N;
    const c2 = m2.getContext("2d"); c2.fillStyle = "#000"; c2.fillRect(0, 0, N, N);
    c2.fillStyle = "#fff"; c2.beginPath();
    poly.forEach((p, j) => { const [X, Y] = p; j ? c2.lineTo(X, Y) : c2.moveTo(X, Y); }); c2.closePath(); c2.fill();
    const dd = c2.getImageData(0, 0, N, N).data; const m = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) m[i] = dd[i * 4] > 128 ? 1 : 0; return m;
  }
  function iou(u, v) { let inter = 0, uni = 0; for (let i = 0; i < N * N; i++) { const o = u[i] | v[i]; uni += o; inter += u[i] & v[i]; } return uni ? inter / uni : 0; }
  // erode 1px to shed the render's anti-aliased edge fringe (thresholded red runs
  // ~0.5px proud of the geometric edge; the reference fill sits on it)
  function erode(m) { const o = new Uint8Array(N * N); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x; if (m[i] && m[i - 1] && m[i + 1] && m[i - N] && m[i + N]) o[i] = 1; } return o; }

  const out = { N, a, b, c, d, parts: {} };
  const names = Object.keys(A.polys);
  const refs = {};
  for (const name of names) { const m = fillPoly(A.polys[name].map(([x, z]) => w2r(x, z))); refs[name] = { mask: m, s: stats(m) }; }
  // assign each rendered-red pixel to its NEAREST reference centroid (separates
  // the two flippers cleanly regardless of how close they are)
  const locals = {}; names.forEach((n) => locals[n] = new Uint8Array(N * N));
  const maxR = N * 0.14;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (!red[i]) continue;
    let best = null, bd = maxR;
    for (const n of names) { const dd = Math.hypot(x - refs[n].s.cx, y - refs[n].s.cy); if (dd < bd) { bd = dd; best = n; } }
    if (best) locals[best][i] = 1;
  }
  for (const name of names) {
    const ls = stats(locals[name]);
    g2.strokeStyle = "#00e5ff"; g2.lineWidth = 1.5; g2.beginPath();
    A.polys[name].map(([x, z]) => w2r(x, z)).forEach((p, j) => { j ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1]); }); g2.closePath(); g2.stroke();
    out.parts[name] = { iou: iou(refs[name].mask, locals[name]), refN: refs[name].s.n, renN: ls.n, refC: [refs[name].s.cx, refs[name].s.cy], renC: [ls.cx, ls.cy] };
  }
  return { dataUrl: cc.toDataURL("image/png"), out, fid: cen };
}, { render: b64(RENDER), chart: b64(CHART), polys: worldPolys, PW, PL, s: cal.s, cx: cal.cx, cz: cal.cz });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(result.dataUrl.split(",")[1], "base64"));
await browser.close();

const { a, b, c, d } = result.out;
console.log("overlay:", OUT);
console.log("fiducials px:", result.fid.map((p) => p ? `[${p[0].toFixed(0)},${p[1].toFixed(0)}]` : "null").join(" "));
console.log(`fit: rx=${a.toFixed(2)}*x+${b.toFixed(1)}  ry=${c.toFixed(2)}*z+${d.toFixed(1)}`);
let pass = true;
for (const [name, r] of Object.entries(result.out.parts)) {
  const wcx = (r.renC[0] - b) / a, wcz = (r.renC[1] - d) / c;
  const wrx = (r.refC[0] - b) / a, wrz = (r.refC[1] - d) / c;
  const errPos = Math.hypot(wcx - wrx, wcz - wrz);
  const ok = r.iou >= 0.85 && errPos < 0.15;
  pass = pass && ok;
  console.log(`  ${name}: IoU=${r.iou.toFixed(3)}  err_pos=${errPos.toFixed(3)}wu  refN=${r.refN} renN=${r.renN}  ${ok ? "PASS" : "FAIL"}`);
}
console.log(pass ? "ALL PASS" : "NEEDS WORK");
