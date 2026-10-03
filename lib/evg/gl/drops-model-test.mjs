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
  const m0 = area(s);
  let stopped = -1;
  for (let i = 0; i < 60 * 8 && stopped < 0; i++) {
    rainStep(s);
    if (!rainDrops(s).some((d) => d.running)) stopped = i;
  }
  const segs = rainSegments(s);
  const head = rainDrops(s).sort((a, b) => b.r - a.r)[0];
  say(stopped > 0 && head && head.y > 120 && head.y < H, `a running drop spends itself and stops (at y ${head ? head.y.toFixed(0) : "-"})`);
  // One line: every piece starts where the last one ended.
  segs.sort((a, b) => a.y0 - b.y0);
  let joined = segs.length > 5;
  for (let k = 1; k < segs.length; k++) {
    if (Math.hypot(segs[k].x0 - segs[k - 1].x1, segs[k].y0 - segs[k - 1].y1) > 1e-6) joined = false;
  }
  say(joined, `it leaves an unbroken line of ${segs.length} pieces behind it`);
  const bottom = segs[segs.length - 1];
  say(bottom && Math.abs(bottom.y1 - head.y) < head.r * 1.2 && Math.abs(bottom.x1 - head.x) < head.r,
    "and sits at the line's lower end");
  const lineMass = segs.reduce((a, g) => a + g.w * Math.hypot(g.x1 - g.x0, g.y1 - g.y0) * 0.32, 0);
  say(Math.abs(area(s) + lineMass - m0) < 1e-6 * m0, "the line's water came out of the drop");
  say(rainDrops(s).length === 1, "and no droplets: in this mode the line is the trail");
  // It waits: nothing more lands, nothing moves.
  const still = JSON.stringify(rainDrops(s));
  for (let i = 0; i < 120; i++) rainStep(s);
  say(JSON.stringify(rainDrops(s)) === still, "with nothing more coming it stays where it stopped");
  // A drop lands on the line well above the end, runs down it, joins the end,
  // and the end goes on.
  const mid = segs[Math.floor(segs.length / 3)];
  const k = rainLand(s, mid.x1, mid.y1, 4);
  const onRail = rainDrops(s).some((d) => d.running && d.r < 5);
  let merged = false, ranOn = false;
  for (let i = 0; i < 60 * 4; i++) {
    rainStep(s);
    const ds = rainDrops(s);
    if (ds.length === 1) merged = true;
    if (merged && ds.some((d) => d.y > head.y + 10)) ranOn = true;
  }
  say(k >= 0 && onRail, "a small drop that lands on the line runs down it");
  say(merged, "and joins the drop at its end");
  say(ranOn, "which then has enough to run on");
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
