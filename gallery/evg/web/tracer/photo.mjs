/**
 * tracer/photo.mjs — the wand against photographs, not drawings.
 *
 *   npm run evg:trace:web && node gallery/evg/web/tracer/photo.mjs
 *   node gallery/evg/web/tracer/photo.mjs portrait --write /tmp/out
 *
 * The synthetic bench says what the tool does to shapes someone drew for it.
 * These say what it does to photographs, and twice now a change has measured
 * as nothing on eleven drawings and as everything on one of these.
 *
 *   pose      a man on a beach. Thin limbs, a gap between the legs, a sky that
 *             is six blues, sand that blows out, and a dark mat lying against
 *             his feet in his own colour. He is 6.8% of the frame — far harder
 *             than the bench, where the figures are a third of it.
 *   portrait  an official portrait. A navy suit against a dark room, red
 *             drapes, a blown-out window, and a navy flag beside him in the
 *             suit's own colour. He is half the frame and touches three edges.
 *
 * Both truths are built here, from the pictures and without the tracer, and
 * both were checked by looking at them; `--write` saves them so the next person
 * can look too. Their limits are stated rather than hidden: the beach mask
 * rounds off the loose hair and cuts the feet where they meet the mat, and the
 * portrait mask takes in about a thousand pixels of a warm window pane beside
 * the hair, which is 0.6% of it.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";
import { writePng } from "./png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(HERE, "../../../game_engine/pose/mediapipe_poc/assets/images");

// The fence around the portrait's silhouette. A fence and not the edge: the
// edge is measured from the picture, and the polygon only has to contain the
// man and stay out of the flags. Drawn as the edge the first time, and drawn
// wrong — it cut the corner of both shoulders, where the suit is widest just
// below the collar rather than sloping, and left a wedge of jacket outside the
// truth on each side. Capping the outward search at a few pixels then made it
// unrecoverable. The numbers below are read off the picture row by row, from
// where the colour test flips, not off the shape of a jacket as imagined.
const PORTRAIT_POLY = [[255, 27], [282, 28], [306, 34], [330, 46], [346, 64], [355, 92], [356, 124], [349, 150], [337, 176], [321, 197], [332, 210], [330, 224], [374, 248], [424, 272], [421, 296], [423, 320], [420, 360], [424, 400], [421, 440], [414, 480], [409, 520], [405, 560], [395, 600], [392, 639], [91, 639], [96, 600], [78, 560], [70, 520], [62, 480], [58, 440], [60, 400], [65, 360], [75, 320], [83, 296], [104, 272], [156, 248], [199, 224], [201, 210], [196, 197], [184, 176], [176, 150], [173, 124], [176, 92], [188, 62], [210, 40], [232, 30]];

const CASES = {
  pose: {
    file: "pose.jpg", W: 640, H: 427,
    what: "mies rannalla · ohuet raajat, reikä jalkojen välissä, matto jaloissa",
    // The background is either blue (sky, sea) or bright and colourless (sand,
    // foam); the man is what is left.
    truth(px, W, H) {
      const fg = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const lum = 0.299*r + 0.587*g + 0.114*b;
        fg[i] = ((b - r) > 24 || (lum > 150 && (mx - mn) < 46)) ? 0 : 1;
      }
      return { fg, smooth: 2, blob: true };
    },
    // Along the mat, which is the decoy this picture came with.
    negRow: (y1, H) => Math.min(H - 6, y1 + 8),
  },
  portrait: {
    file: "portrait.jpg", W: 512, H: 640,
    what: "virallinen muotokuva · tummansininen puku tummaa taustaa vasten",
    truth(px, W, H) {
      // Two kinds of background and only two: the drapes and the desk, whose
      // green is under 62% of their red, and the window and the flag's white
      // stripes, which are light and carry blue. Skin is neither — its green is
      // 71% of its red and its blue 56% — and nor is navy cloth or hair.
      const isBg = (i) => {
        const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
        const lum = 0.299*r + 0.587*g + 0.114*b;
        if (r > 45 && g < 0.62 * r) return true;
        if (lum > 60 && b > 0.72 * r) return true;
        // A drape in deep shadow is too dark for the first test — its red falls
        // under 45 — and too warm for the second. Without this the flag and the
        // suit are one unbroken run from x=33 to x=409 on row 520 and no scan
        // separates them. Navy cloth is dark too, but its blue exceeds its red,
        // so it is not caught; the cut at 45 keeps hair, which sits at 49.
        if (lum < 45 && b < r) return true;
        return false;
      };
      const fg = new Uint8Array(W * H);
      const IN = 10, OUTW = 6;
      for (let y = 0; y < H; y++) {
        const xs = [];
        for (let i = 0, j = PORTRAIT_POLY.length - 1; i < PORTRAIT_POLY.length; j = i++) {
          const [xi, yi] = PORTRAIT_POLY[i], [xj, yj] = PORTRAIT_POLY[j];
          if ((yi > y) !== (yj > y)) xs.push((xj - xi) * (y - yi) / (yj - yi) + xi);
        }
        if (xs.length < 2) continue;
        xs.sort((a, b) => a - b);
        const fix = (start, dir) => {
          if (start >= 0 && start < W && isBg(y*W + start)) {
            for (let s = 0; s <= IN; s++) {
              const t = start + dir*s;
              if (t < 0 || t >= W) break;
              if (!isBg(y*W + t)) return t;
            }
            return start;
          }
          for (let s = 1; s <= OUTW; s++) {
            const t = start - dir*s;
            if (t < 0 || t >= W) return start - dir*(s-1);
            if (isBg(y*W + t)) return t + dir;
          }
          return start - dir*OUTW;
        };
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const L = fix(Math.round(xs[k]), 1), R = fix(Math.round(xs[k+1]), -1);
          for (let x = Math.max(0, L); x <= Math.min(W-1, R); x++) fg[y*W + x] = 1;
        }
      }
      return { fg, smooth: 0, blob: false };
    },
    // Across the drapes above his shoulder: background for its whole length.
    negRow: () => 8,
  },
};

const only = process.argv.find((a) => CASES[a]);
const names = only ? [only] : Object.keys(CASES);
const writeTo = process.argv.includes("--write")
  ? process.argv[process.argv.indexOf("--write") + 1] : null;

const pad = (s, n) => String(s).padEnd(n);
const out = [];
const { page, errors, close } = await openPage();

for (const name of names) {
  const C = CASES[name];
  const { W, H } = C;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracer-photo-"));

  // --- the picture, at a size the tracer can work at ---
  const b64 = fs.readFileSync(path.join(ASSETS, C.file)).toString("base64");
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
  let { fg, smooth, blob } = C.truth(px, W, H);
  for (let pass = 0; pass < smooth; pass++) {
    const o = fg.slice();
    for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += o[(y+dy)*W + x+dx];
      fg[y*W+x] = n >= 5 ? 1 : 0;
    }
  }
  if (blob) {
    const lab = new Int32Array(W*H).fill(-1);
    let best = -1, bestN = 0, id = 0;
    for (let s = 0; s < W*H; s++) {
      if (!fg[s] || lab[s] >= 0) continue;
      const st = [s]; lab[s] = id; let n = 0;
      while (st.length) {
        const q = st.pop(); n++;
        const x = q % W, y = (q / W) | 0;
        for (const t of [x>0?q-1:-1, x<W-1?q+1:-1, y>0?q-W:-1, y<H-1?q+W:-1])
          if (t >= 0 && fg[t] && lab[t] < 0) { lab[t] = id; st.push(t); }
      }
      if (n > bestN) { bestN = n; best = id; }
      id++;
    }
    const keep = new Uint8Array(W*H);
    for (let i = 0; i < W*H; i++) keep[i] = lab[i] === best ? 1 : 0;
    fg = keep;
  }
  const truth = fg;

  if (writeTo) {
    const m = Buffer.alloc(W*H*4), ov = Buffer.from(px);
    for (let i = 0; i < W*H; i++) {
      m[i*4] = m[i*4+1] = m[i*4+2] = truth[i] ? 255 : 0; m[i*4+3] = 255;
      if (truth[i]) { ov[i*4] = Math.min(255, ov[i*4] + 90); ov[i*4+2] >>= 1; }
    }
    fs.writeFileSync(path.join(writeTo, name + ".png"), writePng(zlib, W, H, px));
    fs.writeFileSync(path.join(writeTo, name + "-truth.png"), writePng(zlib, W, H, m));
    fs.writeFileSync(path.join(writeTo, name + "-truth-overlay.png"), writePng(zlib, W, H, ov));
  }

  // Packed one bit per pixel: a third of a million booleans through
  // page.evaluate as an array is a needless megabyte.
  const packed = Buffer.alloc(Math.ceil(W*H/8));
  for (let i = 0; i < W*H; i++) if (truth[i]) packed[i >> 3] |= 1 << (i & 7);

  // --- the gestures, from the truth ---
  const runAt = (y) => {
    let bestLen = 0, a = 0, b = 0, run = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && truth[y*W + x];
      if (on && run < 0) run = x;
      if (!on && run >= 0) { if (x - run > bestLen) { bestLen = x - run; a = run; b = x; } run = -1; }
    }
    return bestLen ? [a, b] : null;
  };
  let y0 = H, y1 = 0, cx = 0, cy = 0, area = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (truth[y*W+x]) {
    if (y < y0) y0 = y; if (y > y1) y1 = y; cx += x; cy += y; area++;
  }
  cx /= area; cy /= area;
  // Down the middle: dense, then smoothed, the same model of a hand the bench
  // uses — the exact centre of every row zigzags into whatever gap it finds.
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
  // The same line, stopped where it leaves the man. On the beach picture the
  // figure splits into two legs and the middle of a row below the hips is the
  // gap between them, so the medial line walks off the object and paints the
  // ground — 15% of its length there. Worth measuring both ways rather than
  // tidying away: the messy stroke is what a careless hand does, the truncated
  // one is what "keep the brush on the thing" means, and the gap between the
  // two numbers is how much the tool asks of the user.
  let stop = stroke.length;
  for (let i = 0; i < stroke.length; i++) {
    const x = Math.round(stroke[i][0] * W), y = Math.round(stroke[i][1] * H);
    if (x < 0 || y < 0 || x >= W || y >= H || !truth[y*W + x]) { stop = i; break; }
  }
  const strokeClean = stroke.slice(0, Math.max(2, stop));
  const offFigure = (pts) => {
    let off = 0, tot = 0;
    for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 100; k++) {
      const x = Math.round((pts[i][0] + (pts[i+1][0]-pts[i][0])*k/100) * W);
      const y = Math.round((pts[i][1] + (pts[i+1][1]-pts[i][1])*k/100) * H);
      tot++;
      if (x < 0 || y < 0 || x >= W || y >= H || !truth[y*W + x]) off++;
    }
    return tot ? 100 * off / tot : 0;
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
    for (let t = 4; t < 700; t += 2) {
      const x = Math.round(cx + dx*t), y = Math.round(cy + dy*t);
      if (x < 0 || y < 0 || x >= W || y >= H) break;
      if (truth[y*W + x]) hit = t;
    }
    const t = (hit || 40) + 9 + 5 * Math.sin(i * 2.3);
    lasso.push([(cx + dx*t) / W, (cy + dy*t) / H]);
  }
  const nrow = C.negRow(y1, H);
  const neg = [[0.18, nrow/H], [0.5, nrow/H], [0.82, nrow/H]];

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
    window.__inFig = (x, y) => { const i = y * W + x; return (buf[i >> 3] >> (i & 7)) & 1; };
  }, { b64: packed.toString("base64"), W });
  if (!(await page.evaluate(() => !!document.querySelector(".wand-off, #outStage svg .sel")))) { /* noop */ }
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
      const on = d[i*4+3] > 128 && d[i*4] < 128, want = window.__inFig(x, y);
      got8[i] = on ? 1 : 0;
      if (on && want) tp++; else if (on) fp++; else if (want) fn++;
    }
    return { iou: +(tp/(tp+fp+fn)).toFixed(3), precision: +(tp/(tp+fp)).toFixed(3),
             recall: +(tp/(tp+fn)).toFixed(3), got: mode.dump ? Array.from(got8) : null };
  }, { W, H, mode });

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
    ["napsautus", await score({ kind: "click", at: [clickAt[0]/W, clickAt[1]/H], brush: BRUSH })],
    ["lasso", await score({ kind: "lasso", pts: lasso, brush: BRUSH })],
    ["äly, koko keskiviiva", await score({ kind: "smart", pts: stroke, brush: BRUSH, dump: !!writeTo })],
    ["äly, veto kohteessa", await score({ kind: "smart", pts: strokeClean, brush: BRUSH })],
    ["äly kohteessa + ⌥", await score({ kind: "smart", pts: strokeClean, neg, brush: BRUSH })],
  ];
  const hands = [];
  for (let k = 0; k < 20; k++)
    hands.push((await score({ kind: "smart", pts: jitter(strokeClean, 7000 + k*53), brush: BRUSH })).iou);
  hands.sort((a, b) => a - b);

  if (writeTo && rows[2][1].got) {
    const sel = rows[2][1].got, ov = Buffer.from(px);
    for (let i = 0; i < W*H; i++) if (sel[i]) { ov[i*4] = Math.min(255, ov[i*4] + 110); ov[i*4+2] >>= 1; }
    fs.writeFileSync(path.join(writeTo, name + "-selected.png"), writePng(zlib, W, H, ov));
  }

  out.push({ name, C, W, H, area, ceiling, rows, hands, BRUSH,
             offFull: offFigure(stroke), offClean: offFigure(strokeClean) });
  fs.rmSync(dir, { recursive: true, force: true });
}

for (const r of out) {
  const share = (v) => Math.min(100, Math.round(v / r.ceiling.iou * 100)) + "%";
  console.log("");
  console.log(r.C.file + " " + r.W + "×" + r.H + " · sivellin " + r.BRUSH
    + " · kohde " + (100*r.area/(r.W*r.H)).toFixed(1) + " % ruudusta");
  console.log("  " + r.C.what);
  console.log("jäljitys: " + r.ceiling.shapes + " muotoa · katto " + r.ceiling.iou
    + " · halki " + r.ceiling.straddle + " px · isoin rajan ylittävä " + r.ceiling.worst + " px");
  console.log("veto: keskiviiva " + r.offFull.toFixed(0) + " % kohteen ulkopuolella, katkaistu "
    + r.offClean.toFixed(0) + " %");
  console.log("");
  for (const [label, v] of r.rows) {
    console.log("  " + pad(label, 22) + (v.miss ? "—"
      : pad(v.iou.toFixed(3) + " (" + share(v.iou) + ")", 16)
        + "tarkkuus " + v.precision.toFixed(3) + "  saanti " + v.recall.toFixed(3)));
  }
  console.log("  " + pad("20 kättä", 22) + "huonoin " + share(r.hands[0])
    + " · p10 " + share(r.hands[2]) + " · mediaani " + share(r.hands[10]) + " · p90 " + share(r.hands[18]));
}
if (errors.length) console.error(errors);
await close();
