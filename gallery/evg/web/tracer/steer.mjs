/**
 * tracer/steer.mjs — can a person steer the wand, and does the same intent
 * give the same answer twice?
 *
 *   npm run evg:trace:web && node gallery/evg/web/tracer/steer.mjs
 *
 * Two things bench.mjs cannot say. It scores one stroke per picture, and a
 * person does not draw the same stroke twice — so the first half here draws
 * twenty variants of one intent (shifted, shortened, tilted) and reports the
 * spread, because for a tool robustness matters more than a best case.
 *
 * The second half is steerability, and it is the metric a semi-automatic tool
 * lives or dies by: a first stroke is allowed to be wrong if one correction
 * reliably moves it the right way. The harness plays the user — after each
 * answer it finds the largest remaining error and aims the next stroke at it,
 * positive where the selection is missing something, ⌥ where it took something
 * it should not have. What is reported is the gain per correction.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { openPage, waitOk } from "./eval-harness.mjs";
import { writePng } from "./png.mjs";
import { CASES, SIZE, TRUTH_SRC } from "./bench-cases.mjs";

const { W, H } = SIZE;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracer-steer-"));
for (const c of CASES) {
  const px = Buffer.alloc(W * H * 4);
  c.draw(px);
  fs.writeFileSync(path.join(dir, c.name + ".png"), writePng(zlib, W, H, px));
}

function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff;
}

// The intended stroke: down the middle of the figure, in image coordinates.
function medial(c) {
  const inside = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (c.inFigure(x, y)) inside.push([x, y]);
  const ys = inside.map((p) => p[1]);
  const y0 = Math.min(...ys) + 24, y1 = Math.max(...ys) - 24;
  const pts = [];
  for (let t = 0; t <= 4; t++) {
    const y = y0 + (y1 - y0) * t / 4;
    const row = inside.filter((p) => Math.abs(p[1] - y) < 3);
    if (!row.length) continue;
    pts.push([row.reduce((a, p) => a + p[0], 0) / row.length, y]);
  }
  return pts;
}

// Twenty hands drawing the same intent.
function jitter(pts, seed) {
  const rnd = lcg(seed);
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const dx = (rnd() - 0.5) * 14, dy = (rnd() - 0.5) * 14;      // ±7 px off
  const keep = 0.55 + rnd() * 0.45;                            // 55–100% as long
  const ang = (rnd() - 0.5) * 0.42;                            // ±12°
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const n = Math.max(2, Math.round(pts.length * keep));
  const start = Math.floor((pts.length - n) * rnd());
  return pts.slice(start, start + n).map(([x, y]) => {
    const ox = x - cx, oy = y - cy;
    return [(cx + ox * ca - oy * sa + dx) / W, (cy + ox * sa + oy * ca + dy) / H];
  });
}

const rows = [];
for (const c of CASES) {
  const { page, errors, close } = await openPage();
  await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
  await page.setInputFiles("#file", path.join(dir, c.name + ".png"));
  await waitOk(page);
  await page.evaluate(() => {
    document.getElementById("status").textContent = "…";
    const bg = document.getElementById("bgMode");
    bg.value = "none"; bg.dispatchEvent(new Event("change", { bubbles: true }));
    const cc = document.getElementById("colorCount");
    cc.value = "14"; cc.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await waitOk(page);
  await page.evaluate(({ src, name, W, H }) => {
    window.__inFig = new Function("x", "y", src + "\nreturn " + name + "(x, y);");
    window.__W = W; window.__H = H;
    // Everything the runs below need, defined once in the page.
    window.__k = {
      reset() {
        document.getElementById("toolMerge").click();
        document.getElementById("toolWand").click();
        const m = document.getElementById("wandMode");
        m.value = "smart"; m.dispatchEvent(new Event("change", { bubbles: true }));
      },
      drag(pts, alt) {
        const svg = document.querySelector("#outStage svg");
        const r = svg.getBoundingClientRect();
        const stage = document.getElementById("outStage");
        const at = (fx, fy) => ({ x: r.left + fx * r.width, y: r.top + fy * r.height });
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
      },
      // The current answer, as a mask and a score.
      look() {
        const svg = document.querySelector("#outStage svg");
        const c2 = document.createElement("canvas");
        c2.width = window.__W; c2.height = window.__H;
        const g = c2.getContext("2d");
        const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
        g.setTransform(window.__W / vb[2], 0, 0, window.__H / vb[3],
                       -vb[0] * window.__W / vb[2], -vb[1] * window.__H / vb[3]);
        [...svg.querySelectorAll("path")].forEach((p) => {
          if (p.closest("mask") || p.closest("clipPath")) return;
          g.fillStyle = p.classList.contains("wand-off") ? "#fff" : "#000";
          g.fill(new Path2D(p.getAttribute("d")), "evenodd");
        });
        const d = g.getImageData(0, 0, window.__W, window.__H).data;
        let tp = 0, fp = 0, fn = 0;
        const got = new Uint8Array(window.__W * window.__H);
        for (let y = 0; y < window.__H; y++) {
          for (let x = 0; x < window.__W; x++) {
            const i = y * window.__W + x;
            got[i] = d[i * 4 + 3] > 128 && d[i * 4] < 128 ? 1 : 0;
            const want = window.__inFig(x, y);
            if (got[i] && want) tp++; else if (got[i]) fp++; else if (want) fn++;
          }
        }
        return { iou: tp / (tp + fp + fn), got };
      },
      // Where the answer is most wrong, as a short stroke through it. This is
      // the harness playing the user: a person aims a correction at the
      // biggest thing that is wrong, not at a fixed spot.
      aim(got, wantFalseNegative) {
        const CW = 16, CH = 20, cell = new Float64Array(CW * CH);
        const ceil = window.__ceil;
        for (let y = 0; y < window.__H; y++) {
          for (let x = 0; x < window.__W; x++) {
            const i = y * window.__W + x, want = window.__inFig(x, y);
            // Only errors the ceiling does not also make. An error the best
            // possible region labelling shares is not the selector's to fix,
            // and aiming a correction at it can only take away something
            // right: measured, ⌥ at one of those cost 28 points on the decoy.
            if (ceil && ceil[i] !== (want ? 1 : 0)) continue;
            const bad = wantFalseNegative ? (want && !got[i]) : (!want && got[i]);
            if (bad) cell[((y * CH / window.__H) | 0) * CW + ((x * CW / window.__W) | 0)]++;
          }
        }
        let best = -1, bi = -1;
        for (let i = 0; i < cell.length; i++) if (cell[i] > best) { best = cell[i]; bi = i; }
        // Worth correcting, and worth aiming at: a stroke has to cover enough
        // of a region to count as pointing at it, so a two-pixel dab changes
        // nothing and reads as "the correction did not help".
        if (best < 200) return null;
        const cx = ((bi % CW) + 0.5) / CW;
        const cy = Math.min(0.93, Math.max(0.07, (((bi / CW) | 0) + 0.5) / CH));
        return [[cx, cy - 0.055], [cx, cy + 0.055]];
      },
    };
  }, { src: TRUTH_SRC, name: c.truth, W, H });
  await page.click("#editToggle");

  const ceiling = rowsCeiling(await page.evaluate(({ W, H }) => {
    const svg = document.querySelector("#outStage svg");
    const els = [...svg.querySelectorAll("path")]
      .filter((p) => !p.closest("mask") && !p.closest("clipPath"));
    const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
    const g = c2.getContext("2d");
    const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    g.setTransform(W / vb[2], 0, 0, H / vb[3], -vb[0] * W / vb[2], -vb[1] * H / vb[3]);
    els.forEach((p, i) => { const v = i + 1;
      g.fillStyle = `rgb(${v & 255},${(v >> 8) & 255},${(v >> 16) & 255})`;
      g.fill(new Path2D(p.getAttribute("d")), "evenodd"); });
    const d = g.getImageData(0, 0, W, H).data;
    const inT = new Int32Array(els.length + 1), tot = new Int32Array(els.length + 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const id = d[(y * W + x) * 4] | (d[(y * W + x) * 4 + 1] << 8) | (d[(y * W + x) * 4 + 2] << 16);
      if (id <= 0 || id > els.length) continue;
      tot[id]++; if (window.__inFig(x, y)) inT[id]++;
    }
    let tp = 0, fp = 0, fn = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const id = d[(y * W + x) * 4] | (d[(y * W + x) * 4 + 1] << 8) | (d[(y * W + x) * 4 + 2] << 16);
      const got = id > 0 && id <= els.length && tot[id] && inT[id] >= tot[id] * 0.5;
      const want = window.__inFig(x, y);
      if (got && want) tp++; else if (got) fp++; else if (want) fn++;
    }
    // The ceiling's own answer, kept: it says which errors are worth aiming a
    // correction at and which belong to the tracing.
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const id = d[i * 4] | (d[i * 4 + 1] << 8) | (d[i * 4 + 2] << 16);
      mask[i] = (id > 0 && id <= els.length && tot[id] && inT[id] >= tot[id] * 0.5) ? 1 : 0;
    }
    window.__ceil = mask;
    return tp / (tp + fp + fn);
  }, { W, H }));

  const base = medial(c);

  // --- twenty hands, one intent ---
  const shares = [];
  for (let k = 0; k < 20; k++) {
    const pts = jitter(base, 1000 + k * 37);
    shares.push(await page.evaluate(({ pts }) => {
      window.__k.reset();
      window.__k.drag(pts, false);
      return window.__k.look().iou;
    }, { pts }) / ceiling);
  }
  shares.sort((a, b) => a - b);
  const q = (p) => Math.min(1, shares[Math.min(shares.length - 1, Math.floor(p * shares.length))]);

  // --- one small stroke, then two corrections aimed at the worst error ---
  // In fractions of the frame, which is what drag() speaks. medial() answers
  // in pixels, and passing those through unconverted put every corrective
  // stroke off the edge of the picture — the harness measuring its own
  // mistake as "corrections do nothing".
  const baseFrac = base.map(([x, y]) => [x / W, y / H]);
  const steer = await page.evaluate(({ pts }) => {
    window.__k.reset();
    // Deliberately meagre: a quarter of the intended stroke, so there is
    // something for the corrections to do.
    const short = pts.slice(0, 2).map(function (p, k) {
      return [p[0], pts[0][1] + (p[1] - pts[0][1]) * 0.35];
    });
    window.__k.drag(short, false);
    const a = window.__k.look();
    const aimFn = window.__k.aim(a.got, true);
    if (aimFn) window.__k.drag(aimFn, false);
    const b = window.__k.look();
    const aimFp = window.__k.aim(b.got, false);
    if (aimFp) window.__k.drag(aimFp, true);
    const c3 = window.__k.look();
    return { first: a.iou, afterAdd: b.iou, afterAlt: c3.iou,
             hadFn: !!aimFn, hadFp: !!aimFp,
             note: document.getElementById("editNote").textContent.slice(0, 60),
             aimFn: aimFn, aimFp: aimFp };
  }, { pts: baseFrac });

  // --- the three scenarios from the list ---
  //
  // 5: one small stroke and nothing else. 6: a stroke on the wrong thing, then
  // ⌥ to take it back, then a right one — recovery, which is what a person
  // does when the first attempt misses. 7: a positive and a ⌥ stroke over the
  // same place in different amounts, which is the coverage invariant asked
  // directly: the one that covered more wins, and the answer should be the
  // same as if the smaller one had never been drawn.
  const mid = baseFrac[Math.floor(baseFrac.length / 2)];
  const wrongAt = c.wrongAt || [0.06, 0.5];
  const scen = await page.evaluate(({ pts, mid, wrongAt }) => {
    const K = window.__k;
    const dab = (p, len) => [[p[0], p[1] - len], [p[0], p[1] + len]];

    K.reset();
    K.drag(dab(mid, 0.03), false);
    const small = K.look().iou;

    // A stroke on the wrong thing, then ⌥ over it, then a right one.
    K.reset();
    K.drag(dab(wrongAt, 0.06), false);
    const wrong = K.look().iou;
    K.drag(dab(wrongAt, 0.06), true);
    const undone = K.look().iou;
    K.drag(pts, false);
    const recovered = K.look().iou;

    // The same place, two strokes, different amounts.
    K.reset();
    K.drag(pts, false);
    const plain = K.look().iou;
    K.drag(dab(mid, 0.02), true);          // a quarter of the positive's reach
    const contested = K.look().iou;
    K.reset();
    K.drag(dab(mid, 0.02), false);         // and the other way round
    K.drag(pts, true);
    const flipped = K.look().iou;
    return { small, wrong, undone, recovered, plain, contested, flipped };
  }, { pts: baseFrac, mid, wrongAt });

  rows.push({
    name: c.name, ceiling, scen,
    p10: q(0.1), median: q(0.5), p90: q(0.9), worst: q(0),
    s0: Math.min(1, steer.first / ceiling),
    s1: Math.min(1, steer.afterAdd / ceiling),
    s2: Math.min(1, steer.afterAlt / ceiling),
    hadFn: steer.hadFn, hadFp: steer.hadFp,
  });
  if (process.env.STEER_DEBUG) console.log("  dbg", c.name, JSON.stringify(steer));
  if (errors.length) console.error(c.name, errors);
  await close();
}

function rowsCeiling(v) { return v; }

const pad = (s, n) => String(s).padEnd(n);
const pct = (v) => (v * 100).toFixed(0) + " %";
console.log("");
console.log("SAMA AIKOMUS, 20 ERI VETOA — osuus katosta");
console.log(pad("kuva", 12) + pad("huonoin", 10) + pad("p10", 10) + pad("mediaani", 11) + pad("p90", 10));
console.log("-".repeat(53));
for (const r of rows) {
  console.log(pad(r.name, 12) + pad(pct(r.worst), 10) + pad(pct(r.p10), 10)
    + pad(pct(r.median), 11) + pad(pct(r.p90), 10));
}
console.log("");
console.log("OHJATTAVUUS — pieni veto, sitten korjaus suurimpaan virheeseen");
console.log(pad("kuva", 12) + pad("1. veto", 10) + pad("+ lisäys", 11) + pad("+ ⌥", 10) + "hyöty");
console.log("-".repeat(56));
for (const r of rows) {
  const g1 = r.s1 - r.s0, g2 = r.s2 - r.s1;
  console.log(pad(r.name, 12) + pad(pct(r.s0), 10) + pad(pct(r.s1), 11) + pad(pct(r.s2), 10)
    + (g1 >= 0 ? "+" : "") + (g1 * 100).toFixed(0) + " / "
    + (g2 >= 0 ? "+" : "") + (g2 * 100).toFixed(0));
}
console.log("");
console.log("YKSI PIENI VETO / VÄÄRÄ VETO JA TOIPUMINEN / SAMA ALUE ERI MÄÄRIN");
console.log(pad("kuva", 12) + pad("pieni", 9) + pad("väärin", 9) + pad("⌥ pois", 9)
  + pad("+ oikea", 10) + pad("veto", 8) + pad("+pieni⌥", 10) + "käänteinen");
console.log("-".repeat(76));
for (const r of rows) {
  const q = (v) => pct(Math.min(1, v / r.ceiling));
  console.log(pad(r.name, 12) + pad(q(r.scen.small), 9) + pad(q(r.scen.wrong), 9)
    + pad(q(r.scen.undone), 9) + pad(q(r.scen.recovered), 10)
    + pad(q(r.scen.plain), 8) + pad(q(r.scen.contested), 10) + q(r.scen.flipped));
}

const mean = (f) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
console.log("");
console.log("keskimäärin: pieni veto " + pct(mean((r) => Math.min(1, r.scen.small / r.ceiling)))
  + " · väärä veto " + pct(mean((r) => Math.min(1, r.scen.wrong / r.ceiling)))
  + " → ⌥ " + pct(mean((r) => Math.min(1, r.scen.undone / r.ceiling)))
  + " → oikea " + pct(mean((r) => Math.min(1, r.scen.recovered / r.ceiling))));
console.log("             sama alue: veto " + pct(mean((r) => Math.min(1, r.scen.plain / r.ceiling)))
  + " · + pieni ⌥ " + pct(mean((r) => Math.min(1, r.scen.contested / r.ceiling)))
  + " · käänteinen " + pct(mean((r) => Math.min(1, r.scen.flipped / r.ceiling))));
console.log("keskimäärin: huonoin " + pct(mean((r) => r.worst))
  + ", mediaani " + pct(mean((r) => r.median))
  + " · ohjaus " + pct(mean((r) => r.s0)) + " → " + pct(mean((r) => r.s1))
  + " → " + pct(mean((r) => r.s2)));
fs.rmSync(dir, { recursive: true, force: true });
