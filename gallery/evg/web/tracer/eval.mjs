/**
 * tracer/eval.mjs — how good is the wand, against a picture whose answer is known?
 *
 *   npm run evg:trace:web && node gallery/evg/web/tracer/eval.mjs
 *
 * Builds nothing itself: it expects the three composites and the truth mask
 * beside it (see the changelog entry for how they are made) and reports, per
 * composite, three things that have to be read together —
 *
 *   the ceiling   what any method that picks whole regions could score, by
 *                 labelling every traced region by majority vote against the
 *                 truth. It is not 1.0: the tracing does not follow the
 *                 silhouette, so 0.79 can be a perfect answer.
 *   the spread    six plausible strokes over the same figure. One stroke is
 *                 not a measurement; these land 0.18 to 0.36 IoU apart.
 *   the share     the median against the ceiling, which is the only one of the
 *                 three that means "how well did it do".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// The composites and the truth mask live wherever you built them; point this
// at that directory.
const SP = process.env.TRACER_EVAL_DIR || path.join(HERE, "eval");
const MASK = "data:image/png;base64," + fs.readFileSync(SP + "/comp_mask.png").toString("base64");
const CASES = (process.env.TRACER_EVAL_CASES || "comp_easy,comp_hard,comp_same").split(",");

// Nothing here can be committed: the composites are made from photographs. What
// is committed is how to make them — background photo, figure photo, composited
// through a silhouette, plus that silhouette as a black-and-white mask:
//
//   <dir>/comp_*.png    480×600, the figure pasted onto the background
//   <dir>/comp_mask.png 480×600, white where the figure is
//
// Point TRACER_EVAL_DIR at them. The smoke test builds a smaller synthetic one
// of its own and guards the same properties on every run.
if (!fs.existsSync(path.join(SP, "comp_mask.png"))) {
  console.log("no composites in " + SP + " — see the comment at the top of this file");
  process.exit(0);
}

// Six plausible strokes over the figure — a person does not draw the same line
// twice, and one number from one line is not a measurement.
const STROKES = [
  [[0.50,0.20],[0.50,0.50],[0.50,0.85]],
  [[0.40,0.30],[0.55,0.45],[0.45,0.80]],
  [[0.50,0.15],[0.50,0.30]],
  [[0.30,0.60],[0.70,0.62]],
  [[0.45,0.25],[0.60,0.40],[0.40,0.60],[0.55,0.82]],
  [[0.35,0.45],[0.35,0.75]],
];

for (const name of CASES) {
  const { page, errors, close } = await openPage();
  await page.evaluate(async (m) => {
    const im = new Image(); im.src = m; await im.decode();
    const c = document.createElement("canvas"); c.width = 480; c.height = 600;
    c.getContext("2d").drawImage(im, 0, 0);
    window.__truth = c.getContext("2d").getImageData(0, 0, 480, 600).data;
  }, MASK);
  await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
  await page.setInputFiles("#file", SP + "/" + name + ".png");
  await waitOk(page);
  await page.evaluate(() => { document.getElementById("status").textContent = "…";
    const c = document.getElementById("colorCount"); c.value = "14";
    c.dispatchEvent(new Event("input", { bubbles: true })); });
  await waitOk(page);
  await page.click("#editToggle");
  await page.click("#toolWand");

  // The ceiling: label every traced region by majority vote against the truth.
  // No method that picks whole regions can beat this, so it says what the
  // numbers below are being compared to.
  const oracle = await page.evaluate(() => {
    const svg = document.querySelector("#outStage svg");
    const els = [...svg.querySelectorAll("path")].filter(p => !p.closest("mask") && !p.closest("clipPath"));
    const T = window.__truth;
    const c = document.createElement("canvas"); c.width = 480; c.height = 600;
    const g = c.getContext("2d");
    const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    g.setTransform(480/vb[2], 0, 0, 600/vb[3], -vb[0]*480/vb[2], -vb[1]*600/vb[3]);
    // z-buffer by index colour, one pass, exact enough at this size
    els.forEach((p, i) => { const v = i + 1;
      g.fillStyle = `rgb(${v&255},${(v>>8)&255},${(v>>16)&255})`;
      g.fill(new Path2D(p.getAttribute("d")), "evenodd"); });
    const d = g.getImageData(0,0,480,600).data;
    const inTruth = new Int32Array(els.length + 1), total = new Int32Array(els.length + 1);
    for (let i = 0; i < 480*600; i++) {
      const id = d[i*4] | (d[i*4+1]<<8) | (d[i*4+2]<<16);
      if (id <= 0 || id > els.length) continue;
      total[id]++;
      if (T[i*4] > 128) inTruth[id]++;
    }
    let tp=0,fp=0,fn=0;
    for (let i = 0; i < 480*600; i++) {
      const id = d[i*4] | (d[i*4+1]<<8) | (d[i*4+2]<<16);
      const got = id > 0 && id <= els.length && total[id] && inTruth[id] >= total[id]*0.5;
      const want = T[i*4] > 128;
      if (got&&want)tp++; else if(got)fp++; else if(want)fn++;
    }
    return { shapes: els.length, iou:+(tp/(tp+fp+fn)).toFixed(3),
             precision:+(tp/(tp+fp)).toFixed(3), recall:+(tp/(tp+fn)).toFixed(3) };
  });

  const runs = [];
  for (const s of STROKES) {
    const r = await page.evaluate(({ s }) => {
      // start each run from no hints at all
      document.getElementById("toolMerge").click();
      document.getElementById("toolWand").click();
      const svg = document.querySelector("#outStage svg");
      const rect = svg.getBoundingClientRect();
      const stage = document.getElementById("outStage");
      const at = (fx,fy) => ({ x: rect.left + fx*rect.width, y: rect.top + fy*rect.height });
      const send = (t,p) => stage.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:p.x,clientY:p.y}));
      const q = [];
      for (let i=0;i+1<s.length;i++) for (let k=0;k<10;k++)
        q.push(at(s[i][0]+(s[i+1][0]-s[i][0])*k/10, s[i][1]+(s[i+1][1]-s[i][1])*k/10));
      q.push(at(s[s.length-1][0], s[s.length-1][1]));
      send("pointerdown", q[0]); q.slice(1).forEach(p=>send("pointermove",p));
      send("pointerup", q[q.length-1]);
      // score the visible selection in z-order
      const T = window.__truth;
      const c = document.createElement("canvas"); c.width=480; c.height=600;
      const g = c.getContext("2d");
      const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
      g.setTransform(480/vb[2],0,0,600/vb[3],-vb[0]*480/vb[2],-vb[1]*600/vb[3]);
      [...svg.querySelectorAll("path")].forEach(p => {
        if (p.closest("mask") || p.closest("clipPath")) return;
        g.fillStyle = p.classList.contains("wand-off") ? "#fff" : "#000";
        g.fill(new Path2D(p.getAttribute("d")), "evenodd"); });
      const d = g.getImageData(0,0,480,600).data;
      let tp=0,fp=0,fn=0;
      for (let i=0;i<480*600;i++){
        const got = d[i*4+3]>128 && d[i*4]<128, want = T[i*4]>128;
        if(got&&want)tp++; else if(got)fp++; else if(want)fn++; }
      return { iou:+(tp/(tp+fp+fn)).toFixed(3), precision:+(tp/(tp+fp)).toFixed(3),
               recall:+(tp/(tp+fn)).toFixed(3) };
    }, { s });
    runs.push(r);
  }
  const ious = runs.map(r => r.iou).sort((a,b)=>a-b);
  const med = ious[Math.floor(ious.length/2)];
  console.log("=== " + name);
  console.log("   katto (paras mahdollinen paloilla):", JSON.stringify(oracle));
  console.log("   kuusi vetoa, IoU:", JSON.stringify(ious),
              "mediaani", med, "vaihteluväli", (ious[ious.length-1]-ious[0]).toFixed(3));
  console.log("   osuus katosta:", (med / oracle.iou).toFixed(2));
  if (errors.length) console.log("   errors", errors);
  await close();
}
