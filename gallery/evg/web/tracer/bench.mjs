/**
 * tracer/bench.mjs — the same six pictures through every way of selecting.
 *
 *   npm run evg:trace:web && node gallery/evg/web/tracer/bench.mjs
 *   node gallery/evg/web/tracer/bench.mjs --write /tmp/out   (also save the PNGs)
 *
 * Reports, per picture: the ceiling — what any method that picks whole regions
 * could score, by labelling every traced region by majority vote against the
 * truth — and then each selector against it. The ceiling is the number that
 * makes the rest readable: it is not 1.0, because the tracing does not follow
 * the silhouette, so 0.79 can be a perfect answer.
 *
 * Repeating a run moves a number by a couple of points. Nothing inside that is
 * a difference.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";
import { writePng } from "./png.mjs";
import { CASES, SIZE, TRUTH_SRC, medialStroke } from "./bench-cases.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { W, H } = SIZE;
const writeTo = process.argv.includes("--write")
  ? process.argv[process.argv.indexOf("--write") + 1] : null;

function render(c) {
  const px = Buffer.alloc(W * H * 4);
  c.draw(px);
  return writePng(zlib, W, H, px);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracer-bench-"));
for (const c of CASES) {
  const png = render(c);
  fs.writeFileSync(path.join(dir, c.name + ".png"), png);
  if (writeTo) fs.writeFileSync(path.join(writeTo, c.name + ".png"), png);
}

// The gestures are derived from each picture's own truth rather than fixed in
// fractions of the frame. Fixed points put the click straight down the hole in
// the last case and scored the tool zero for the test's mistake.
function gesturesFor(c) {
  const inside = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (c.inFigure(x, y)) inside.push([x, y]);
  const cx = inside.reduce((a, p) => a + p[0], 0) / inside.length;
  const cy = inside.reduce((a, p) => a + p[1], 0) / inside.length;
  // The click: the inside point furthest from any edge of the figure, so it
  // lands in the middle of something rather than on a boundary.
  let best = inside[0], bd = -1;
  for (const p of inside) {
    let d = 1e9;
    for (let r = 2; r < 90; r += 2) {
      if (!c.inFigure(p[0] + r, p[1]) || !c.inFigure(p[0] - r, p[1])
        || !c.inFigure(p[0], p[1] + r) || !c.inFigure(p[0], p[1] - r)) { d = r; break; }
    }
    if (d > bd) { bd = d; best = p; }
  }
  // The stroke: down the middle, in fractions of the frame, which is what
  // drag() speaks.
  const stroke = medialStroke(c).map((p) => [p[0] / W, p[1] / H]);
  // The ⌥ stroke: a horizontal line across a row that is background for its
  // whole length, so it says only "this is background" and nothing else.
  let negY = 0;
  for (let y = 4; y < H - 4; y += 2) {
    let clear = true;
    for (let x = 12; x < W - 12; x += 4) if (c.inFigure(x, y)) { clear = false; break; }
    if (clear) { negY = y; break; }
  }
  return {
    click: { x: best[0] / W, y: best[1] / H },
    stroke,
    // Either a stroke over pure background — which must change nothing — or,
    // where the picture has one, a stroke over the thing that has to go.
    neg: c.negOverride || [[0.06, negY / H], [0.5, negY / H], [0.94, negY / H]],
    centroid: [cx / W, cy / H],
  };
}

const rows = [];
for (const c of CASES) {
  const { page, errors, close } = await openPage();
  await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
  await page.setInputFiles("#file", path.join(dir, c.name + ".png"));
  await waitOk(page);
  await page.evaluate(() => {
    document.getElementById("status").textContent = "…";
    // Background removal off: it would pre-solve the easy pictures — on the
    // flat one it left a single shape and every selector scored 0.998 for
    // work the tracer had already done — and this bench is about selecting.
    const bg = document.getElementById("bgMode");
    bg.value = "none"; bg.dispatchEvent(new Event("change", { bubbles: true }));
    const cc = document.getElementById("colorCount");
    cc.value = "14"; cc.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await waitOk(page);
  await page.evaluate(({ src, name }) => {
    // The truth, as a function rather than a bitmap.
    window.__inFig = new Function("x", "y", src + "\nreturn " + name + "(x, y);");
  }, { src: TRUTH_SRC, name: c.truth });
  await page.click("#editToggle");

  const score = async (fn) => page.evaluate(async ({ W, H, mode }) => {
    const svg = document.querySelector("#outStage svg");
    const rect = svg.getBoundingClientRect();
    const stage = document.getElementById("outStage");
    const at = (fx, fy) => ({ x: rect.left + fx * rect.width, y: rect.top + fy * rect.height });
    const drag = (pts, alt) => {
      const send = (t, p) => stage.dispatchEvent(new PointerEvent(t, {
        bubbles: true, clientX: p.x, clientY: p.y, altKey: !!alt }));
      const q = [];
      for (let i = 0; i + 1 < pts.length; i++) {
        for (let k = 0; k < 10; k++) {
          q.push(at(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k / 10,
                    pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k / 10));
        }
      }
      q.push(at(pts[pts.length - 1][0], pts[pts.length - 1][1]));
      send("pointerdown", q[0]);
      q.slice(1).forEach((p) => send("pointermove", p));
      send("pointerup", q[q.length - 1]);
    };
    const setMode = (m) => {
      const el = document.getElementById("wandMode");
      el.value = m; el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const wand = () => { document.getElementById("toolWand").click(); };
    const reset = () => { document.getElementById("toolMerge").click(); wand(); };

    reset();
    if (mode.kind === "click") {
      setMode("smart");
      const t = document.getElementById("wandTol");
      t.value = String(mode.tol); t.dispatchEvent(new Event("input", { bubbles: true }));
      const p = at(mode.at.x, mode.at.y);
      const el = document.elementFromPoint(p.x, p.y);
      if (!el || el.tagName !== "path") return { miss: true };
      stage.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: p.x, clientY: p.y }));
      stage.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: p.x, clientY: p.y }));
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    } else if (mode.kind === "lasso") {
      setMode("lasso");
      drag(mode.pts, false);
    } else {
      setMode("smart");
      drag(mode.pts, false);
      if (mode.neg) drag(mode.neg, true);
    }

    // Score the visible selection in z-order: painting only the selected
    // shapes would score the stacked union instead of the picture.
    const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
    const g = c2.getContext("2d");
    const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    g.setTransform(W / vb[2], 0, 0, H / vb[3], -vb[0] * W / vb[2], -vb[1] * H / vb[3]);
    // Through the SVG itself, not path by path. Filling each `d` with Path2D
    // ignores `clip-path`, and the wand now clips a region it keeps only part
    // of — so a background shape kept for ninety-five of its seventy-one
    // thousand cells scored as if all seventy-one thousand were selected, and
    // the bench read a 20-point collapse that was not in the picture.
    const clone = svg.cloneNode(true);
    [...clone.querySelectorAll("path")].forEach((p) => {
      if (p.closest("mask") || p.closest("clipPath")) return;
      p.setAttribute("fill", p.classList.contains("wand-off") ? "#ffffff" : "#000000");
      p.setAttribute("fill-rule", "evenodd");
    });
    const url = "data:image/svg+xml;base64,"
      + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
    const im = new Image(); im.src = url; await im.decode();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(im, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H).data;
    let tp = 0, fp = 0, fn = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const got = d[i * 4 + 3] > 128 && d[i * 4] < 128, want = window.__inFig(x, y);
        if (got && want) tp++; else if (got) fp++; else if (want) fn++;
      }
    }
    return { iou: +(tp / (tp + fp + fn)).toFixed(3),
             precision: +(tp / (tp + fp)).toFixed(3),
             recall: +(tp / (tp + fn)).toFixed(3) };
  }, { W, H, mode: fn });

  // The ceiling.
  const ceiling = await page.evaluate(({ W, H }) => {
    const svg = document.querySelector("#outStage svg");
    const els = [...svg.querySelectorAll("path")]
      .filter((p) => !p.closest("mask") && !p.closest("clipPath"));
    const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
    const g = c2.getContext("2d");
    const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    g.setTransform(W / vb[2], 0, 0, H / vb[3], -vb[0] * W / vb[2], -vb[1] * H / vb[3]);
    els.forEach((p, i) => {
      const v = i + 1;
      g.fillStyle = `rgb(${v & 255},${(v >> 8) & 255},${(v >> 16) & 255})`;
      g.fill(new Path2D(p.getAttribute("d")), "evenodd");
    });
    const d = g.getImageData(0, 0, W, H).data;
    const inT = new Int32Array(els.length + 1), tot = new Int32Array(els.length + 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, id = d[i * 4] | (d[i * 4 + 1] << 8) | (d[i * 4 + 2] << 16);
      if (id <= 0 || id > els.length) continue;
      tot[id]++;
      if (window.__inFig(x, y)) inT[id]++;
    }
    let tp = 0, fp = 0, fn = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, id = d[i * 4] | (d[i * 4 + 1] << 8) | (d[i * 4 + 2] << 16);
      const got = id > 0 && id <= els.length && tot[id] && inT[id] >= tot[id] * 0.5;
      const want = window.__inFig(x, y);
      if (got && want) tp++; else if (got) fp++; else if (want) fn++;
    }
    // Why the ceiling is where it is. A region that straddles the boundary
    // costs its minority side no matter which way it is labelled, and no
    // method that picks whole regions can recover those pixels — so the sum of
    // the minority sides is the tracing's own error, and the largest single
    // straddling region says whether it is spread over many small mistakes or
    // concentrated in one big one. Without this a low ceiling is a number to
    // shrug at; with it, 9-weakedge reads as one merged shape and not as a
    // hard picture.
    let straddle = 0, worst = 0;
    for (let k = 1; k <= els.length; k++) {
      if (!tot[k]) continue;
      const f = inT[k] / tot[k];
      if (f <= 0.12 || f >= 0.88) continue;
      straddle += Math.min(inT[k], tot[k] - inT[k]);
      if (tot[k] > worst) worst = tot[k];
    }
    return { shapes: els.length, iou: +(tp / (tp + fp + fn)).toFixed(3), straddle, worst };
  }, { W, H });

  // A rough hand-drawn outline: the silhouette, sampled and wobbled.
  const lassoPts = [];
  for (let i = 0; i < 72; i++) {
    const th = i / 72 * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
    let hit = 0;
    for (let t = 4; t < 320; t += 2) if (c.inFigure(160 + dx * t, 230 + dy * t)) hit = t;
    if (!hit) continue;
    const wob = 16 * Math.sin(i * 0.8) + 7;
    lassoPts.push([(160 + dx * (hit + wob)) / W, (230 + dy * (hit + wob)) / H]);
  }

  const g = gesturesFor(c);
  const r = {
    name: c.name, what: c.what, shapes: ceiling.shapes, ceiling: ceiling.iou,
    straddle: ceiling.straddle, worst: ceiling.worst,
    click: await score({ kind: "click", tol: 60, at: g.click }),
    lasso: await score({ kind: "lasso", pts: lassoPts }),
    smart1: await score({ kind: "smart", pts: g.stroke }),
    smart2: await score({ kind: "smart", pts: g.stroke, neg: g.neg }),
  };
  rows.push(r);
  if (errors.length) console.error(c.name, errors);
  await close();
}

const cols = [["click", "napsautus"], ["lasso", "lasso"], ["smart1", "äly 1 veto"],
              ["smart2", "äly + ⌥"]];
const pad = (s, n) => String(s).padEnd(n);
console.log("");
console.log(pad("kuva", 12) + pad("paloja", 7) + pad("katto", 7) + pad("halki", 7) + pad("isoin", 7)
  + cols.map(([, l]) => pad(l, 14)).join(""));
console.log("-".repeat(12 + 7 * 4 + cols.length * 14));
for (const r of rows) {
  const cells = cols.map(([k]) => {
    const v = r[k];
    if (v.miss) return pad("—", 14);
    return pad(v.iou.toFixed(3) + " (" + Math.min(100, Math.round(v.iou / r.ceiling * 100)) + "%)", 14);
  });
  console.log(pad(r.name, 12) + pad(r.shapes, 7) + pad(r.ceiling.toFixed(3), 7)
    + pad(r.straddle, 7) + pad(r.worst, 7) + cells.join(""));
}
console.log("");
for (const [k, label] of cols) {
  const share = rows.map((r) => r[k].miss ? 0 : Math.min(1, r[k].iou / r.ceiling));
  const mean = share.reduce((a, b) => a + b, 0) / share.length;
  console.log(pad(label, 14) + "keskimäärin " + (mean * 100).toFixed(0) + " % katosta");
}
console.log("");
console.log("");
console.log("halki = pikselit jotka menetetään koska jokin muoto ylittää rajan; ne ovat");
console.log("        jäljityksen virhettä eikä mikään valitsin voi saada niitä takaisin.");
console.log("isoin = suurin rajan ylittävä muoto, joka kertoo onko virhe hajallaan vai");
console.log("        yhdessä kohdassa.");
console.log("");
rows.forEach((r) => console.log("  " + pad(r.name, 12) + r.what));
fs.rmSync(dir, { recursive: true, force: true });
