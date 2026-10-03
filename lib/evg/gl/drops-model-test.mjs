/**
 * The rain model behind the `drops` surface effect, without a GPU.
 *
 *   node lib/evg/gl/drops-model-test.mjs        (npm run evg:drops:test)
 *
 * What is held here is what the shader takes on trust: that the pane at a
 * time is the same whichever way the clock got there, that drops which touch
 * become one, that a heavy drop runs and leaves droplets behind it, that what
 * it runs through is cleared, and that the texels the shader reads say what
 * the model holds. And a benchmark, because a model that cannot keep up with
 * the frame is a model the effect cannot use.
 */

import {
  rainNew, rainStep, rainAt, rainForget, rainDrops, rainPut, rainPack, rainSegments, rainLand,
  rainStepAt, RAIN_STEP, RAIN_CELL, RAIN_K, RAIN_TEX_W,
} from "./evg-webgl.js";

let failed = 0;
let passed = 0;
const say = (ok, what) => {
  if (ok) passed += 1; else failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"}  ${what}`);
};
const W = 960, H = 540;
const same = (a, b) => JSON.stringify(rainDrops(a)) === JSON.stringify(rainDrops(b));
const stepTo = (s, t) => { const n = rainStepAt(t); while (s.step < n) rainStep(s); return s; };
const area = (s) => rainDrops(s).reduce((a, d) => a + d.r * d.r, 0);

// --- A PURE FUNCTION OF THE TIME -------------------------------------------
{
  rainForget();
  const direct = stepTo(rainNew({}, W, H), 23.4);
  rainForget();
  // Forward in frames, past it, then back: the cache restores a checkpoint
  // and steps again, and must land on the same pane.
  for (let t = 0; t <= 30; t += 0.5) rainAt({}, W, H, t);
  const back = rainAt({}, W, H, 23.4);
  say(same(direct, back), "the pane at 23.4 s is the same reached forward, from a checkpoint, or stepped from empty");
  rainForget();
  const cold = rainAt({}, W, H, 23.4);
  say(same(direct, cold), "and the same from a cold cache");
  const again = rainAt({}, W, H, 23.4);
  say(again === cold, "asking twice for the same time steps nothing");
  say(rainStepAt(1) === 60 && rainStepAt(1 / 60) === 1, "a step is 1/60 s");
  say(rainStepAt(1e6) <= rainStepAt(600) && rainStepAt(-5) === 0,
    "a clock past ten minutes folds back; a clock before zero is the empty pane");
  const other = rainAt({ seed: 2 }, W, H, 23.4);
  say(!same(other, cold), "another seed is another shower");
}

// --- DROPS APPEAR ----------------------------------------------------------
{
  rainForget();
  const n0 = rainDrops(rainAt({}, W, H, 0)).length;
  const n1 = rainDrops(rainAt({}, W, H, 1)).length;
  const n5 = rainDrops(rainAt({}, W, H, 5)).length;
  say(n0 === 0 && n1 > 0 && n5 > n1, `the pane starts dry and fills: 0 s ${n0}, 1 s ${n1}, 5 s ${n5}`);
  const none = rainDrops(rainAt({ rain: 0, mist: 0 }, W, H, 5)).length;
  say(none === 0, "rain 0 and mist 0 is a dry pane");
  const s = rainAt({}, W, H, 20);
  const ds = rainDrops(s);
  const shapes = new Set(ds.map((d) => d.phase.toFixed(4) + "/" + d.irregular.toFixed(4)));
  say(ds.every((d) => d.irregular > 0) && shapes.size > ds.length * 0.5,
    "no drop is a circle, and no two are bent the same");
}

// --- TWO DROPS THAT TOUCH BECOME ONE ---------------------------------------
{
  const s = rainNew({ rain: 0, mist: 0, speed: 0 }, W, H);
  rainPut(s, 300, 200, 6);
  rainPut(s, 309, 202, 5);
  rainPut(s, 600, 200, 6);
  const before = area(s);
  // rainPut is a test's hand: it places, and merges nothing.
  rainPut(s, 305, 196, 3);
  const after = rainDrops(s);
  // A runner through the first pair is what merges them.
  const t = rainNew({ rain: 0, mist: 0 }, W, H);
  rainPut(t, 300, 200, 6);
  rainPut(t, 600, 200, 6);
  rainPut(t, 309, 202, 5);
  rainPut(t, 304, 170, 9, true);
  const a0 = area(t);
  for (let i = 0; i < 90; i++) rainStep(t);
  const ds = rainDrops(t);
  const near = ds.filter((d) => Math.abs(d.x - 304) < 40 && d.y > 185 && d.y < 260 && d.r > 6);
  say(after.length === 4 && Math.abs(before + 9 - area(s)) < 1e-9, "putting drops by hand merges nothing");
  say(near.length === 1 && near[0].r > 10, `a runner meets two drops and is one drop after (r ${near.length ? near[0].r.toFixed(1) : "-"})`);
  say(Math.abs(area(t) - a0) < 1e-6 * a0, "and no water is made or lost: what the runner lost is in its trail");
  say(ds.some((d) => Math.abs(d.x - 600) < 1e-9 && d.r === 6), "a drop it did not touch is where it was");
}

// --- A HEAVY DROP RUNS, A LIGHT ONE STAYS ----------------------------------
{
  const s = rainNew({ rain: 0, mist: 0 }, W, H);
  rainPut(s, 200, 100, 3);
  rainPut(s, 500, 60, 15, true);
  for (let i = 0; i < 60; i++) rainStep(s);
  const ds = rainDrops(s);
  const small = ds.find((d) => d.x === 200);
  const head = ds.filter((d) => d.r > 6).sort((a, b) => b.y - a.y)[0];
  const trail = ds.filter((d) => d !== head && d.r < 6 && Math.abs(d.x - 500) < 40 && d.y < head.y);
  say(small && small.y === 100 && !small.running, "a small drop stays where it landed");
  say(head && head.y > 120, `a heavy drop runs down (from 60 to ${head ? head.y.toFixed(0) : "-"} in 1 s)`);
  say(head && head.stretch > 1.2, "and is drawn out into a tail as it goes");
  say(trail.length >= 3, `and leaves droplets behind it (${trail.length})`);
  say(trail.every((d) => !d.running), "which stay where they were left");
  // Off the bottom, gone.
  for (let i = 0; i < 60 * 20; i++) rainStep(s);
  say(!rainDrops(s).some((d) => d.running), "a drop that runs off the bottom of the pane is gone");
}

// --- IT CLEARS ITS PATH ----------------------------------------------------
{
  const s = rainNew({ rain: 0, mist: 3 }, W, H);
  // Mist, then no more of it, and one heavy drop through the middle.
  for (let i = 0; i < 600; i++) rainStep(s);
  s.mist = 0;
  const key = (d) => d.x + "," + d.y;
  const inPath = (d) => Math.abs(d.x - 480) < 8 && d.y > 150 && d.y < 450 && d.r < 2.5;
  const before = new Set(rainDrops(s).filter(inPath).map(key));
  rainPut(s, 480, 100, 14, true);
  for (let i = 0; i < 300; i++) rainStep(s);
  // The droplets it leaves are new; what was there before is what it cleared.
  const left = rainDrops(s).filter((d) => before.has(key(d))).length;
  say(before.size > 5 && left < before.size * 0.5, `a running drop clears the mist in its path (${before.size} → ${left})`);
}

// --- THE PANE SETTLES ------------------------------------------------------
{
  rainForget();
  const at = (t) => rainDrops(rainAt({}, W, H, t));
  const n120 = at(120).length, n480 = at(480).length;
  const run = at(300).filter((d) => d.running).length + at(301).filter((d) => d.running).length;
  const cover = at(480).reduce((a, d) => a + Math.PI * d.r * d.r, 0) / (W * H);
  say(n480 < 2400 && Math.abs(n480 - n120) < n120 * 0.4, `the number of drops levels off (${n120} at 2 min, ${n480} at 8 min)`);
  say(run > 0, `drops still run once it has (${run} in two frames at 5 min)`);
  say(cover > 0.04 && cover < 0.3, `and the water covers ${(cover * 100).toFixed(0)} % of the pane`);
}

// --- THE TEXELS ------------------------------------------------------------
{
  rainForget();
  const s = rainAt({}, W, H, 30);
  const ds = rainDrops(s);
  const { data, width, height } = rainPack(s);
  const tex = (i, c) => data[i * 4 + c];
  const cols = Math.ceil(W / RAIN_CELL), rows = Math.ceil(H / RAIN_CELL);
  say(width === RAIN_TEX_W && data.length === width * height * 4, "the texture is RAIN_TEX_W wide and whole rows");
  say(tex(0, 0) === W && tex(0, 1) === H && tex(0, 2) === RAIN_CELL && tex(0, 3) === cols &&
    tex(1, 0) === rows && tex(1, 1) === RAIN_K && tex(1, 2) === ds.length, "the header says the box, the grid and the count");
  let okDrops = true;
  ds.forEach((d, k) => {
    if (Math.abs(tex(2 + 2 * k, 0) - d.x) > 1e-3 || Math.abs(tex(2 + 2 * k, 2) - d.r) > 1e-3) okDrops = false;
  });
  say(okDrops, "drop k is at texel 2 + 2k");
  // Every drop whose middle is in a cell is listed in that cell, unless the
  // cell is full of bigger ones.
  const base = tex(1, 3);
  let missing = 0, overfull = 0;
  ds.forEach((d, k) => {
    // A middle off the pane (a drop landing over the top edge, or running off
    // the bottom) has no cell of its own.
    if (d.x < 0 || d.y < 0 || d.x >= W || d.y >= H) return;
    const cx = Math.floor(d.x / RAIN_CELL);
    const cy = Math.floor(d.y / RAIN_CELL);
    const c = cy * cols + cx;
    const list = [];
    for (let j = 0; j < RAIN_K; j++) list.push(data[base * 4 + c * RAIN_K + j]);
    if (list.includes(k)) return;
    if (list.every((x) => x >= 0) && list.every((x) => ds[x].r >= d.r)) overfull += 1;
    else missing += 1;
  });
  say(missing === 0, `every drop is in its own cell's list (${overfull} left out of full cells, all smaller than the ones kept)`);
}

// --- RAINDROPS2: A LINE, AN END, AND MORE WATER ---------------------------
{
  const S = { rain: 0, mist: 0, streak: 1 };
  const s = rainNew(S, W, H);
  rainPut(s, 400, 60, 12, true);
  const water = (x) => area(x) + rainSegments(x).reduce((a, g) => a + g.w * Math.hypot(g.x1 - g.x0, g.y1 - g.y0) * 0.32, 0);
  const m0 = water(s);
  let kept = true, joined = true, stopped = -1, ranAgain = -1, top3 = null, top6 = null;
  for (let i = 0; i < 60 * 20; i++) {
    rainStep(s);
    const ds = rainDrops(s);
    if (ds.length > 0 && Math.abs(water(s) - m0) > 1e-6 * m0) kept = false;
    const segs = rainSegments(s).sort((a, b) => a.y0 - b.y0);
    for (let k = 1; k < segs.length; k++) {
      if (Math.hypot(segs[k].x0 - segs[k - 1].x1, segs[k].y0 - segs[k - 1].y1) > 1e-6) joined = false;
    }
    if (i === 60 * 3 && segs.length) top3 = segs[0].y0;
    if (i === 60 * 6 && segs.length) top6 = segs[0].y0;
    const running = ds.some((d) => d.running);
    if (stopped < 0 && !running && ds.length) stopped = i;
    if (stopped >= 0 && ranAgain < 0 && running) ranAgain = i;
    if (ds.length === 0) break;
  }
  say(kept, "raindrops2: the water in the drop and its line is kept, all the way down");
  say(joined, "the line it leaves is unbroken");
  say(top3 !== null && top6 !== null && top6 > top3 + 20, `the line empties from the top (its top at 3 s ${top3 && top3.toFixed(0)}, at 6 s ${top6 && top6.toFixed(0)})`);
  say(stopped > 0 && ranAgain > stopped, `the drop stops when spent (${(stopped / 60).toFixed(1)} s) and the line's water sends it on (${(ranAgain / 60).toFixed(1)} s)`);
}
{
  // A drop that lands on a line runs down it and joins the drop at its foot.
  const s = rainNew({ rain: 0, mist: 0, streak: 1 }, W, H);
  rainPut(s, 400, 60, 12, true);
  while (rainDrops(s).some((d) => d.running)) rainStep(s);
  const segs = rainSegments(s).sort((a, b) => a.y0 - b.y0);
  const mid = segs[Math.floor(segs.length / 2)];
  const k = rainLand(s, mid.x1, mid.y1, 4);
  const onRail = rainDrops(s).some((d) => d.running && d.r < 5);
  let merged = false;
  for (let i = 0; i < 60 * 3 && !merged; i++) {
    rainStep(s);
    if (rainDrops(s).length === 1) merged = true;
  }
  say(k >= 0 && onRail, "a small drop that lands on the line runs down it");
  say(merged, "and joins the drop at its end");
}
{
  // The same pane, three ways to reach it.
  const P = { streak: 1 };
  rainForget();
  const direct = stepTo(rainNew(P, W, H), 37.2);
  rainForget();
  for (let t = 0; t <= 45; t += 0.7) rainAt(P, W, H, t);
  const back = rainAt(P, W, H, 37.2);
  const key = (s) => JSON.stringify([rainDrops(s), rainSegments(s)]);
  say(key(direct) === key(back), "raindrops2: the pane at 37.2 s is the same stepped or from a checkpoint");
  say(rainSegments(direct).length > 20, `and has lines on it (${rainSegments(direct).length} pieces)`);
  say(rainSegments(rainAt({}, W, H, 37.2)).length === 0, "drops (no streak) draws none");
  // Lines bead up: no piece outlives its time.
  const later = rainAt(P, W, H, 120);
  say(rainSegments(later).length < 4000, `and the lines go again: ${rainSegments(later).length} pieces at 2 min`);
  const { data } = rainPack(direct);
  const n = data[6], base = data[7];
  let segTexels = 0;
  for (let i = 0; i < n; i++) if (data[(3 + 2 * i) * 4 + 3] === 1) segTexels += 1;
  say(segTexels === rainSegments(direct).length && base === 2 + 2 * n, "every piece is packed after the drops, marked as a line");
}

// --- TEXT IN THE WAY ---------------------------------------------------------
const inBox = (d, b) => d.x > b[0] && d.x < b[2] && d.y > b[1] && d.y < b[3];
{
  const box = [300, 200, 520, 230];
  const s = rainNew({ rain: 0, mist: 0, obstacles: [box] }, W, H);
  rainPut(s, 400, 120, 14, true);
  let seen = false, onTop = false, past = null;
  for (let i = 0; i < 60 * 10 && !past; i++) {
    rainStep(s);
    for (const d of rainDrops(s)) {
      if (d.r > 3 && inBox(d, box)) seen = true;
      if (d.r > 6 && Math.abs(d.y + d.r - box[1]) < 2.5) onTop = true;
      if (d.r > 6 && d.y > box[3]) past = d;
    }
  }
  say(!seen, "a drop is never seen on text");
  say(onTop, "it comes to rest on top of it");
  say(past !== null, `and gets past it, round or through (at x ${past ? past.x.toFixed(0) : "-"})`);
}
{
  // Text all the way across: there is no way round, so it goes through.
  const box = [0, 200, W, 240];
  const s = rainNew({ rain: 0, mist: 0, streak: 1, obstacles: [box] }, W, H);
  rainPut(s, 400, 120, 12, true);
  let held = 0, below = null;
  for (let i = 0; i < 60 * 12 && !below; i++) {
    rainStep(s);
    const ds = rainDrops(s);
    if (ds.some((d) => d.running && d.y < box[1])) held += 1;
    below = ds.find((d) => d.y > box[3]) || null;
  }
  for (let i = 0; i < 60; i++) rainStep(s);
  const segs = rainSegments(s);
  say(below && held > 20, `held on the letters for ${(held / 60).toFixed(1)} s, the water goes through them`);
  say(segs.some((g) => g.y0 >= box[3] - 1) && !segs.some((g) => g.y0 < box[3] - 1 && g.y1 > box[1] + 1),
    "and draws its line on below them, none across");
}
{
  // A letter's own shape: on a roof the drop slides down the slope.
  const cell = 2, cols = W / cell, rows = H / cell;
  const bits = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * cell, y = r * cell;
    if (y >= 200 + Math.abs(x - 400) * 0.6 && y < 260) bits[r * cols + c] = 1;
  }
  const s = rainNew({ rain: 0, mist: 0, obstacles: { cell, cols, rows, bits } }, W, H);
  rainPut(s, 408, 120, 10, true);
  let x0 = null, slid = 0;
  for (let i = 0; i < 60 * 6; i++) {
    rainStep(s);
    const d = rainDrops(s).sort((a, b) => b.r - a.r)[0];
    if (!d) break;
    if (x0 === null && d.y > 170) x0 = d.x;
    if (x0 !== null && d.y < 260) slid = Math.max(slid, d.x - x0);
  }
  say(slid > 15, `it follows a letter's shape: down the slope of a roof (${slid.toFixed(0)} px aside)`);
}
{
  // Two words with a gap between them a drop fits through.
  const a = [300, 200, 390, 230], b = [420, 200, 520, 230];
  const s = rainNew({ rain: 0, mist: 0, obstacles: [a, b] }, W, H);
  rainPut(s, 405, 120, 10, true);
  let below = null;
  for (let i = 0; i < 60 * 6 && !below; i++) {
    rainStep(s);
    below = rainDrops(s).find((d) => d.r > 5 && d.y > 240) || null;
  }
  say(below && below.x > 390 && below.x < 420, `and goes down a gap it fits through (at x ${below ? below.x.toFixed(0) : "-"})`);
}
{
  const P = { streak: 1, spread: 1, dry: 1, obstacles: [[100, 150, 700, 210], [80, 300, 600, 340]] };
  rainForget();
  const t = rainAt(P, W, H, 40);
  const still = rainDrops(t).filter((d) => !d.running);
  const onText = still.filter((d) => P.obstacles.some((b) => inBox(d, b)));
  say(onText.length === 0, `no rain stays on text (${still.length} drops, ${onText.length} on it)`);
  const direct = stepTo(rainNew(P, W, H), 31.7);
  rainForget();
  for (let u = 0; u <= 40; u += 0.9) rainAt(P, W, H, u);
  const key = (x) => JSON.stringify([rainDrops(x), rainSegments(x)]);
  say(key(direct) === key(rainAt(P, W, H, 31.7)), "with text: the same pane stepped or from a checkpoint");
  say(key(rainAt({ streak: 1, spread: 1, dry: 1 }, W, H, 31.7)) !== key(direct), "and text changes the pane");
}

// --- FINE RAIN, AND IT DRIES -------------------------------------------------
{
  const s = rainNew({ spread: 1, mist: 0, speed: 0 }, W, H);
  for (let i = 0; i < 60; i++) rainStep(s);
  const rs = rainDrops(s).map((d) => d.r).sort((a, b) => a - b);
  const median = rs[Math.floor(rs.length / 2)];
  const big = rs.filter((r) => r > 9).length / rs.length;
  say(rs.length > 60 && median < 1.6 && big < 0.02,
    `spread: mostly very fine (${rs.length} in 1 s, median ${median.toFixed(2)} px, ${(big * 100).toFixed(1)}% over 9 px)`);
}
{
  const s = rainNew({ rain: 0, mist: 0, speed: 0, dry: 1 }, W, H);
  rainPut(s, 100, 100, 1); rainPut(s, 300, 100, 3); rainPut(s, 500, 100, 8);
  const at = (t) => { while (s.step < t * 60) rainStep(s); return rainDrops(s).filter((d) => !d.dot).map((d) => +d.r.toFixed(2)); };
  const t6 = at(6), t40 = at(40);
  say(t6.length === 2 && t6[0] < 3 && t6[1] > 7.8, `dry: the smallest goes first (6 s: ${t6.join(", ")})`);
  say(t40.length === 1 && t40[0] > 7, `and the next one long before a big one (40 s: ${t40.join(", ")})`);
  const dots = rainDrops(s).filter((d) => d.dot);
  say(dots.length >= 3 && dots.every((d) => d.r < 1.3), `what dried left specks behind (${dots.length})`);
  const before = JSON.stringify(dots);
  at(70);
  say(JSON.stringify(rainDrops(s).filter((d) => d.dot).slice(0, dots.length)) === before, "and the specks do not dry");
}
{
  // A running drop wipes a path through the specks and takes them up.
  const s = rainNew({ rain: 0, mist: 0, dry: 1 }, W, H);
  const specks = [];
  for (let y = 150; y < 400; y += 6) for (let x = 380; x <= 420; x += 6) specks.push(rainPut(s, x, y, 0.8));
  const n0 = rainDrops(s).length;
  rainPut(s, 400, 80, 13, true);
  const r0 = 13;
  let left = n0;
  for (let i = 0; i < 60 * 8; i++) {
    rainStep(s);
    left = rainDrops(s).filter((d) => d.r < 1 && d.y > 150 && d.y < 400 && Math.abs(d.x - 400) < 10).length;
  }
  say(left < n0 * 0.3, `a runner wipes the specks out of its path (${left} of ${n0} left near it)`);
  const dry = rainDrops(rainAt({ spread: 1, dry: 1, streak: 1 }, W, H, 300)).filter((d) => !d.dot).length;
  const wet = rainDrops(rainAt({ spread: 1, dry: 0, streak: 1 }, W, H, 300)).filter((d) => !d.dot).length;
  say(dry < wet, `and a pane that dries holds fewer drops (${dry} against ${wet} at 5 min)`);
}
// --- BENCHMARK -------------------------------------------------------------
{
  const time = (f) => { const t0 = performance.now(); f(); return performance.now() - t0; };
  rainForget();
  const cold60 = time(() => rainAt({}, W, H, 60));
  rainForget();
  const cold600 = time(() => rainAt({}, W, H, 600));
  // A frame of a running presentation: one step on and the packing.
  rainForget();
  rainAt({}, W, H, 120);
  let t = 120;
  const frames = 120;
  const live = time(() => { for (let i = 0; i < frames; i++) { t += RAIN_STEP; rainPack(rainAt({}, W, H, t)); } }) / frames;
  const seek = time(() => rainAt({}, W, H, 100.3));
  console.log(`      cold start: 60 s ${cold60.toFixed(0)} ms, 600 s ${cold600.toFixed(0)} ms; ` +
    `a frame ${live.toFixed(2)} ms; a seek back 20 s ${seek.toFixed(1)} ms`);
  say(live < 4, "a frame of a running slide costs under 4 ms");
  say(cold600 < 3000, "ten minutes from cold in under 3 s");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
