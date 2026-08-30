/**
 * tracer/ablate.mjs — does a change to the wand actually change anything?
 *
 *   node gallery/evg/web/tracer/ablate.mjs '[{"a":1},{"a":2}]'
 *
 * Runs the same six strokes under each setting and reports min / median / mean
 * IoU against the truth, and the mean against the region ceiling. Reads the
 * same composites as eval.mjs.
 *
 * Two things this exists to prevent, both of which happened while it did not:
 * shipping a change nobody measured, and reading a difference that is noise.
 * Repeating a run moves the mean by up to 0.04, so anything inside that is a
 * tie however confident the story around it sounds. It needs a page that
 * exposes the constants — window.__wandSet — which the tracer does not do by
 * default; add it temporarily while measuring.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SP = process.env.TRACER_EVAL_DIR || path.join(HERE, "eval");
const MASK = "data:image/png;base64," + fs.readFileSync(SP + "/comp_mask.png").toString("base64");
const STROKES = [
  [[0.50,0.20],[0.50,0.50],[0.50,0.85]], [[0.40,0.30],[0.55,0.45],[0.45,0.80]],
  [[0.50,0.15],[0.50,0.30]], [[0.30,0.60],[0.70,0.62]],
  [[0.45,0.25],[0.60,0.40],[0.40,0.60],[0.55,0.82]], [[0.35,0.45],[0.35,0.75]],
];
const CEIL = { comp_easy: 0.788, comp_hard: 0.959, comp_same: 0.845 };
const VARIANTS = JSON.parse(process.argv[2] || '[{}]');

for (const name of ["comp_easy","comp_hard","comp_same"]) {
  const { page, errors, close } = await openPage();
  await page.evaluate(async (m) => {
    const im = new Image(); im.src = m; await im.decode();
    const c = document.createElement("canvas"); c.width = 480; c.height = 600;
    c.getContext("2d").drawImage(im, 0, 0);
    window.__truth = c.getContext("2d").getImageData(0,0,480,600).data;
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
  const out = [];
  for (const v of VARIANTS) {
    const ious = [];
    for (const s of STROKES) {
      ious.push(await page.evaluate(({ s, v }) => {
        window.__wandSet(v);
        document.getElementById("toolMerge").click();
        document.getElementById("toolWand").click();
        const svg = document.querySelector("#outStage svg");
        const rect = svg.getBoundingClientRect();
        const stage = document.getElementById("outStage");
        const at = (fx,fy) => ({ x: rect.left+fx*rect.width, y: rect.top+fy*rect.height });
        const send = (t,p) => stage.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:p.x,clientY:p.y}));
        const q=[]; for(let i=0;i+1<s.length;i++) for(let k=0;k<10;k++)
          q.push(at(s[i][0]+(s[i+1][0]-s[i][0])*k/10, s[i][1]+(s[i+1][1]-s[i][1])*k/10));
        q.push(at(s[s.length-1][0], s[s.length-1][1]));
        send("pointerdown",q[0]); q.slice(1).forEach(p=>send("pointermove",p)); send("pointerup",q[q.length-1]);
        const T=window.__truth, c=document.createElement("canvas"); c.width=480;c.height=600;
        const g=c.getContext("2d");
        const vb=svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
        g.setTransform(480/vb[2],0,0,600/vb[3],-vb[0]*480/vb[2],-vb[1]*600/vb[3]);
        [...svg.querySelectorAll("path")].forEach(p=>{ if(p.closest("mask")||p.closest("clipPath"))return;
          g.fillStyle = p.classList.contains("wand-off")?"#fff":"#000";
          g.fill(new Path2D(p.getAttribute("d")),"evenodd"); });
        const d=g.getImageData(0,0,480,600).data;
        let tp=0,fp=0,fn=0;
        for(let i=0;i<480*600;i++){const got=d[i*4+3]>128&&d[i*4]<128, want=T[i*4]>128;
          if(got&&want)tp++; else if(got)fp++; else if(want)fn++;}
        return +(tp/(tp+fp+fn)).toFixed(3);
      }, { s, v }));
    }
    const sorted = [...ious].sort((a,b)=>a-b);
    const mean = +(ious.reduce((a,b)=>a+b,0)/ious.length).toFixed(3);
    out.push({ v: JSON.stringify(v), min: sorted[0], med: sorted[3], mean,
               ofCeil: Math.min(1, +(mean/CEIL[name]).toFixed(2)) });
  }
  console.log("=== " + name);
  out.forEach(o => console.log("   " + o.v.padEnd(44),
    "min", String(o.min).padEnd(6), "med", String(o.med).padEnd(6),
    "ka", String(o.mean).padEnd(6), "katosta", o.ofCeil));
  if (errors.length) console.log("   errors", errors);
  await close();
}
