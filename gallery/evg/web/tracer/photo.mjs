/**
 * tracer/photo.mjs — the wand against a photograph, not a drawing.
 *
 *   npm run evg:trace:web && node gallery/evg/web/tracer/photo.mjs
 *   node gallery/evg/web/tracer/photo.mjs --write /tmp/out   (also save the PNGs)
 *
 * The synthetic bench says what the tool does to shapes someone drew for it.
 * This says what it does to a real photograph: JPEG noise, a sky that is six
 * different blues, sand that blows out, hair, and a dark yoga mat lying
 * against the man's feet in his own colour.
 *
 * The truth is built here, from the picture and without the tracer: the
 * background is either blue (sky, sea) or bright and colourless (sand, foam),
 * the man is what is left, then a majority filter and the largest blob. Its
 * limits are known and are stated rather than hidden — it rounds off the loose
 * hair, and it cuts the feet where they meet the mat. Everything else it gets
 * right, which was checked by looking at it. `--write` saves it so the next
 * person can look too.
 *
 * The figure is 6.8% of the frame. That is much harder than the bench, where
 * the figures are a third of it, and the numbers should be read knowing it.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";
import { writePng } from "./png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "../../../game_engine/pose/mediapipe_poc/assets/images/pose.jpg");
const W = 640, H = 427;
const writeTo = process.argv.includes("--write")
  ? process.argv[process.argv.indexOf("--write") + 1] : null;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracer-photo-"));
const { page, errors, close } = await openPage();

// --- the picture, at a size the tracer can work at ---
const b64 = fs.readFileSync(SRC).toString("base64");
const px = Buffer.from(await page.evaluate(async ({ b64, W, H }) => {
  const img = new Image();
  img.src = "data:image/jpeg;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, W, H);
  return Array.from(g.getImageData(0, 0, W, H).data);
}, { b64, W, H }));
fs.writeFileSync(path.join(dir, "photo.png"), writePng(zlib, W, H, px));

// --- the truth ---
const fg = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const lum = 0.299*r + 0.587*g + 0.114*b;
  fg[i] = ((b - r) > 24 || (lum > 150 && (mx - mn) < 46)) ? 0 : 1;
}
for (let pass = 0; pass < 2; pass++) {
  const o = fg.slice();
  for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += o[(y+dy)*W + x+dx];
    fg[y*W+x] = n >= 5 ? 1 : 0;
  }
}
const lab = new Int32Array(W*H).fill(-1);
let best = -1, bestN = 0, id = 0;
for (let s = 0; s < W*H; s++) {
  if (!fg[s] || lab[s] >= 0) continue;
  const st = [s]; lab[s] = id; let n = 0;
  while (st.length) {
    const p = st.pop(); n++;
    const x = p % W, y = (p / W) | 0;
    for (const q of [x>0?p-1:-1, x<W-1?p+1:-1, y>0?p-W:-1, y<H-1?p+W:-1])
      if (q >= 0 && fg[q] && lab[q] < 0) { lab[q] = id; st.push(q); }
  }
  if (n > bestN) { bestN = n; best = id; }
  id++;
}
const truth = new Uint8Array(W*H);
for (let i = 0; i < W*H; i++) truth[i] = lab[i] === best ? 1 : 0;

if (writeTo) {
  const m = Buffer.alloc(W*H*4), ov = Buffer.from(px);
  for (let i = 0; i < W*H; i++) {
    m[i*4] = m[i*4+1] = m[i*4+2] = truth[i] ? 255 : 0; m[i*4+3] = 255;
    if (truth[i]) { ov[i*4] = Math.min(255, ov[i*4] + 90); ov[i*4+2] >>= 1; }
  }
  fs.writeFileSync(path.join(writeTo, "photo.png"), writePng(zlib, W, H, px));
  fs.writeFileSync(path.join(writeTo, "photo-truth.png"), writePng(zlib, W, H, m));
  fs.writeFileSync(path.join(writeTo, "photo-truth-overlay.png"), writePng(zlib, W, H, ov));
}

// Packed one bit per pixel: 273k booleans through page.evaluate as an array is
// a needless megabyte.
const packed = Buffer.alloc(Math.ceil(W*H/8));
for (let i = 0; i < W*H; i++) if (truth[i]) packed[i >> 3] |= 1 << (i & 7);

// --- the gestures, from the truth ---
function runAt(y) {
  let bestLen = 0, a = 0, b = 0, run = -1;
  for (let x = 0; x <= W; x++) {
    const on = x < W && truth[y*W + x];
    if (on && run < 0) run = x;
    if (!on && run >= 0) { if (x - run > bestLen) { bestLen = x - run; a = run; b = x; } run = -1; }
  }
  return bestLen ? [a, b] : null;
}
let y0 = H, y1 = 0, cx = 0, cy = 0, area = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (truth[y*W+x]) {
  if (y < y0) y0 = y; if (y > y1) y1 = y; cx += x; cy += y; area++;
}
cx /= area; cy /= area;
// Down the middle: dense, then smoothed, the same model of a hand the bench
// uses — the exact centre of every row zigzags into the gap between the legs.
const N = 24, ys = [], xs = [];
for (let t = 0; t <= N; t++) {
  const y = Math.round(y0 + 20 + (y1 - 20 - (y0 + 20)) * t / N);
  const r = runAt(y);
  ys.push(y); xs.push(r ? (r[0] + r[1]) / 2 : cx);
}
for (let s = 0; s < 8; s++) {
  const o = xs.slice();
  for (let i = 0; i < xs.length; i++)
    xs[i] = (o[Math.max(0, i-1)] + 2*o[i] + o[Math.min(o.length-1, i+1)]) / 4;
}
const stroke = xs.map((x, i) => [x / W, ys[i] / H]);
if (writeTo) fs.writeFileSync(path.join(writeTo, "stroke.json"), JSON.stringify(stroke));
// The same line, stopped where it leaves the man. A standing figure splits
// into two legs and the middle of a row below the hips is the gap between
// them, so the medial line walks off the object and paints the ground — 15% of
// its length here. That is worth measuring both ways rather than tidying away:
// the messy stroke is what a careless hand does, the truncated one is what
// "keep the brush on the thing" means, and the gap between the two numbers is
// how much the tool asks of the user.
let cut = stroke.length;
for (let i = 0; i < stroke.length; i++) {
  const x = Math.round(stroke[i][0] * W), y = Math.round(stroke[i][1] * H);
  if (x < 0 || y < 0 || x >= W || y >= H || !truth[y*W + x]) { cut = i; break; }
}
const strokeClean = stroke.slice(0, Math.max(2, cut));
const offFigure = (pts) => {
  let out = 0, tot = 0;
  for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 100; k++) {
    const x = Math.round((pts[i][0] + (pts[i+1][0]-pts[i][0])*k/100) * W);
    const y = Math.round((pts[i][1] + (pts[i+1][1]-pts[i][1])*k/100) * H);
    tot++;
    if (x < 0 || y < 0 || x >= W || y >= H || !truth[y*W + x]) out++;
  }
  return tot ? 100 * out / tot : 0;
};
// The click: the inside point furthest from any edge.
let clickAt = [cx, cy], bd = -1;
for (let y = y0; y <= y1; y += 2) for (let x = 0; x < W; x += 2) {
  if (!truth[y*W+x]) continue;
  let d = 1e9;
  for (let r = 2; r < 60; r += 2) {
    if (x+r >= W || x-r < 0 || y+r >= H || y-r < 0
      || !truth[y*W+x+r] || !truth[y*W+x-r] || !truth[(y+r)*W+x] || !truth[(y-r)*W+x]) { d = r; break; }
  }
  if (d > bd) { bd = d; clickAt = [x, y]; }
}
// A rough hand-drawn outline round the silhouette.
const lasso = [];
for (let i = 0; i < 96; i++) {
  const th = i / 96 * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
  let hit = 0;
  for (let t = 4; t < 420; t += 2) {
    const x = Math.round(cx + dx*t), y = Math.round(cy + dy*t);
    if (x < 0 || y < 0 || x >= W || y >= H) break;
    if (truth[y*W + x]) hit = t;
  }
  const t = (hit || 40) + 9 + 5 * Math.sin(i * 2.3);
  lasso.push([(cx + dx*t) / W, (cy + dy*t) / H]);
}
// The ⌥ stroke: along the mat, which is the decoy this picture came with.
const matY = Math.min(H - 6, y1 + 8);
const neg = [[0.18, matY/H], [0.5, matY/H], [0.82, matY/H]];

// --- run it ---
await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
await page.setInputFiles("#file", path.join(dir, "photo.png"));
await waitOk(page);
await page.evaluate(({ colors }) => {
  document.getElementById("status").textContent = "…";
  const b = document.getElementById("bgMode"); b.value = "none"; b.dispatchEvent(new Event("change", { bubbles: true }));
  const c = document.getElementById("colorCount"); c.value = String(colors); c.dispatchEvent(new Event("input", { bubbles: true }));
}, { colors: +(process.env.PHOTO_COLORS || 20) });
await waitOk(page);
await page.evaluate(({ b64, W }) => {
  const bin = atob(b64), n = bin.length, buf = new Uint8Array(n);
  for (let i = 0; i < n; i++) buf[i] = bin.charCodeAt(i);
  window.__truth = buf;
  window.__inFig = (x, y) => { const i = y * W + x; return (buf[i >> 3] >> (i & 7)) & 1; };
}, { b64: packed.toString("base64"), W });
await page.click("#editToggle");

const ceiling = await page.evaluate(({ W, H }) => {
  const svg = document.querySelector("#outStage svg");
  const els = [...svg.querySelectorAll("path")].filter((p) => !p.closest("mask") && !p.closest("clipPath"));
  const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
  const g = c2.getContext("2d");
  const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
  g.setTransform(W/vb[2], 0, 0, H/vb[3], -vb[0]*W/vb[2], -vb[1]*H/vb[3]);
  els.forEach((p, i) => { const v = i + 1;
    g.fillStyle = `rgb(${v&255},${(v>>8)&255},${(v>>16)&255})`;
    g.fill(new Path2D(p.getAttribute("d")), "evenodd"); });
  const d = g.getImageData(0, 0, W, H).data;
  const tot = new Int32Array(els.length+1), inT = new Int32Array(els.length+1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W+x, id = d[i*4] | (d[i*4+1]<<8) | (d[i*4+2]<<16);
    if (id <= 0 || id > els.length) continue;
    tot[id]++; if (window.__inFig(x, y)) inT[id]++;
  }
  let tp=0, fp=0, fn=0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W+x, id = d[i*4] | (d[i*4+1]<<8) | (d[i*4+2]<<16);
    const got = id>0 && id<=els.length && tot[id] && inT[id] >= tot[id]*0.5;
    const want = window.__inFig(x, y);
    if (got && want) tp++; else if (got) fp++; else if (want) fn++;
  }
  let straddle = 0, worst = 0;
  for (let k = 1; k <= els.length; k++) {
    if (!tot[k]) continue;
    const f = inT[k]/tot[k];
    if (f <= 0.12 || f >= 0.88) continue;
    straddle += Math.min(inT[k], tot[k]-inT[k]);
    if (tot[k] > worst) worst = tot[k];
  }
  return { shapes: els.length, iou: +(tp/(tp+fp+fn)).toFixed(3), straddle, worst };
}, { W, H });

const score = (mode) => page.evaluate(async ({ W, H, mode }) => {
  const svg = document.querySelector("#outStage svg");
  const rect = svg.getBoundingClientRect();
  const stage = document.getElementById("outStage");
  const at = (fx, fy) => ({ x: rect.left + fx*rect.width, y: rect.top + fy*rect.height });
  const drag = (pts, alt) => {
    const send = (t, p) => stage.dispatchEvent(new PointerEvent(t, {
      bubbles: true, clientX: p.x, clientY: p.y, altKey: !!alt }));
    const q = [];
    for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 10; k++)
      q.push(at(pts[i][0] + (pts[i+1][0]-pts[i][0])*k/10, pts[i][1] + (pts[i+1][1]-pts[i][1])*k/10));
    q.push(at(pts[pts.length-1][0], pts[pts.length-1][1]));
    send("pointerdown", q[0]); q.slice(1).forEach((p) => send("pointermove", p)); send("pointerup", q[q.length-1]);
  };
  document.getElementById("toolMerge").click();
  document.getElementById("toolWand").click();
  if (mode.brush) { const br = document.getElementById("wandBrush");
    br.value = String(mode.brush); br.dispatchEvent(new Event("input", { bubbles: true })); }
  const setMode = (m) => { const e = document.getElementById("wandMode"); e.value = m; e.dispatchEvent(new Event("change", { bubbles: true })); };
  if (mode.kind === "click") {
    setMode("smart");
    const t = document.getElementById("wandTol"); t.value = "60"; t.dispatchEvent(new Event("input", { bubbles: true }));
    const p = at(mode.at[0], mode.at[1]);
    const el = document.elementFromPoint(p.x, p.y);
    if (!el || el.tagName !== "path") return { miss: true };
    stage.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: p.x, clientY: p.y }));
    stage.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: p.x, clientY: p.y }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  } else if (mode.kind === "lasso") {
    setMode("lasso"); drag(mode.pts, false);
  } else {
    setMode("smart"); drag(mode.pts, false);
    if (mode.neg) drag(mode.neg, true);
  }
  const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
  const g = c2.getContext("2d");
  const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
  g.setTransform(W/vb[2], 0, 0, H/vb[3], -vb[0]*W/vb[2], -vb[1]*H/vb[3]);
  [...svg.querySelectorAll("path")].forEach((p) => {
    if (p.closest("mask") || p.closest("clipPath")) return;
    g.fillStyle = p.classList.contains("wand-off") ? "#fff" : "#000";
    g.fill(new Path2D(p.getAttribute("d")), "evenodd");
  });
  const d = g.getImageData(0, 0, W, H).data;
  let tp=0, fp=0, fn=0;
  const got8 = new Uint8Array(W*H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W+x;
    const got = d[i*4+3] > 128 && d[i*4] < 128, want = window.__inFig(x, y);
    got8[i] = got ? 1 : 0;
    if (got && want) tp++; else if (got) fp++; else if (want) fn++;
  }
  return { iou: +(tp/(tp+fp+fn)).toFixed(3), precision: +(tp/(tp+fp)).toFixed(3), recall: +(tp/(tp+fn)).toFixed(3),
           got: mode.dump ? Array.from(got8) : null };
}, { W, H, mode });

// Twenty hands, the same intent — one stroke is not a measurement.
function lcg(seed) { let s = seed >>> 0; return () => ((s = (s*1664525 + 1013904223) >>> 0) / 4294967296); }
function jitter(pts, seed) {
  const rnd = lcg(seed);
  const mx = pts.reduce((a,p) => a+p[0], 0)/pts.length, my = pts.reduce((a,p) => a+p[1], 0)/pts.length;
  const dx = (rnd()-0.5)*14/W, dy = (rnd()-0.5)*14/H;
  const keep = 0.55 + rnd()*0.45, th = (rnd()-0.5)*24*Math.PI/180;
  const n = Math.max(2, Math.round(pts.length*keep));
  return pts.slice(0, n).map(([x,y]) => {
    const ax = (x-mx)*W, ay = (y-my)*H;
    return [(mx + (ax*Math.cos(th) - ay*Math.sin(th))/W) + dx, (my + (ax*Math.sin(th) + ay*Math.cos(th))/H) + dy];
  });
}

const BRUSH = +(process.env.PHOTO_BRUSH || 26);
const rows = [
  ["napsautus", await score({ kind: "click", at: [clickAt[0]/W, clickAt[1]/H] })],
  ["lasso", await score({ kind: "lasso", pts: lasso })],
  ["äly, veto maahan asti", await score({ kind: "smart", pts: stroke, brush: BRUSH, dump: !!writeTo })],
  ["äly, veto miehessä", await score({ kind: "smart", pts: strokeClean, brush: BRUSH })],
  ["äly miehessä + ⌥ matto", await score({ kind: "smart", pts: strokeClean, neg, brush: BRUSH })],
];
const hands = [];
for (let k = 0; k < 20; k++) hands.push((await score({ kind: "smart", pts: jitter(strokeClean, 7000 + k*53), brush: BRUSH })).iou);
hands.sort((a, b) => a - b);

const pad = (s, n) => String(s).padEnd(n);
const share = (v) => Math.min(100, Math.round(v / ceiling.iou * 100)) + "%";
console.log("");
console.log("pose.jpg " + W + "×" + H + " · sivellin " + BRUSH + " · hahmo " + (100*area/(W*H)).toFixed(1) + " % ruudusta");
console.log("jäljitys: " + ceiling.shapes + " muotoa · katto " + ceiling.iou
  + " · halki " + ceiling.straddle + " px · isoin rajan ylittävä " + ceiling.worst + " px");
console.log("veto: keskiviiva on " + offFigure(stroke).toFixed(0) + " % ajasta miehen ulkopuolella,"
  + " miehessä pysyvä " + offFigure(strokeClean).toFixed(0) + " %");
console.log("");
for (const [name, r] of rows) {
  console.log(pad(name, 24) + (r.miss ? "—"
    : pad(r.iou.toFixed(3) + " (" + share(r.iou) + ")", 16)
      + "tarkkuus " + r.precision.toFixed(3) + "  saanti " + r.recall.toFixed(3)));
}
console.log("");
if (writeTo && rows[2][1].got) {
  const sel = rows[2][1].got, ov = Buffer.from(px);
  for (let i = 0; i < W*H; i++) if (sel[i]) { ov[i*4] = Math.min(255, ov[i*4] + 110); ov[i*4+2] >>= 1; }
  fs.writeFileSync(path.join(writeTo, "photo-selected.png"), writePng(zlib, W, H, ov));
}
console.log("20 kättä, sama aikomus:  huonoin " + share(hands[0])
  + " · p10 " + share(hands[2]) + " · mediaani " + share(hands[10]) + " · p90 " + share(hands[18]));
if (errors.length) console.error(errors);
fs.rmSync(dir, { recursive: true, force: true });
await close();
