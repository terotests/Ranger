/**
 * tracer/cylshot.mjs — the same cut with the cylinder rule off and on.
 *
 *   node gallery/evg/web/tracer/photo.mjs --write /tmp/out
 *   node gallery/evg/web/tracer/cylshot.mjs /tmp/out
 *
 * Three panels per picture: the answer without the rule, the answer with it,
 * and what the rule alone changed — green where it added the person, red where
 * it added the background. The rule runs where it has to run, as the last step
 * after the cut, the tidy-up, the fence and the hole filling: it is a resolver
 * over a finished answer, not another opinion inside the energy.
 *
 * The numbers under each pair are the same ones cyl.mjs sweeps; this is what
 * they look like.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { openPage, waitOk } from "./eval-harness.mjs";
import { writePng } from "./png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2];
const DEST = process.argv[3] || OUT;
if (!OUT) { console.error("käyttö: node cylshot.mjs <hakemisto> [kohde]"); process.exit(1); }
const CASES = { pose: { W: 640, H: 427 }, portrait: { W: 512, H: 640 } };
// The best setting the sweep found: it is the one worth looking at, because a
// picture of a rule tuned to do nothing is a picture of nothing.
const ON = { long: 1, fan: 1.5, area: 0.05, min: 8 };

const { page, close } = await openPage();
for (const name of Object.keys(CASES)) {
  const { W, H } = CASES[name];
  const stroke = JSON.parse(fs.readFileSync(`${OUT}/${name}-stroke.json`, "utf8"));
  const truthB64 = fs.readFileSync(`${OUT}/${name}-truth.png`).toString("base64");
  const photoB64 = fs.readFileSync(`${OUT}/${name}.png`).toString("base64");

  await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
  await page.setInputFiles("#file", `${OUT}/${name}.png`);
  await waitOk(page);
  await page.evaluate(() => { document.getElementById("status").textContent = "…";
    const b=document.getElementById("bgMode"); b.value="none"; b.dispatchEvent(new Event("change",{bubbles:true}));
    const c=document.getElementById("colorCount"); c.value="20"; c.dispatchEvent(new Event("input",{bubbles:true})); });
  await waitOk(page);
  if (!(await page.evaluate(() => document.getElementById("editToggle").getAttribute("aria-pressed") === "true")))
    await page.click("#editToggle");

  const shot = await page.evaluate(async ({ pts, W, H, truthB64, photoB64, ON, name }) => {
    const svg = document.querySelector("#outStage svg");
    const rect = svg.getBoundingClientRect(), stage = document.getElementById("outStage");
    const at=(fx,fy)=>({x:rect.left+fx*rect.width,y:rect.top+fy*rect.height});
    const send=(t,p)=>stage.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:p.x,clientY:p.y}));
    const c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");

    const run = async (set) => {
      window.__cylSet = set;
      document.getElementById("toolMerge").click(); document.getElementById("toolWand").click();
      const m=document.getElementById("wandMode"); m.value="smart"; m.dispatchEvent(new Event("change",{bubbles:true}));
      const q=[];
      for(let i=0;i+1<pts.length;i++)for(let k=0;k<10;k++)
        q.push(at(pts[i][0]+(pts[i+1][0]-pts[i][0])*k/10, pts[i][1]+(pts[i+1][1]-pts[i][1])*k/10));
      q.push(at(pts.at(-1)[0],pts.at(-1)[1]));
      send("pointerdown",q[0]); q.slice(1).forEach(p=>send("pointermove",p)); send("pointerup",q.at(-1));
      const clone=svg.cloneNode(true);
      [...clone.querySelectorAll("path")].forEach((p)=>{ if(p.closest("mask")||p.closest("clipPath"))return;
        p.setAttribute("fill", p.classList.contains("wand-off") ? "#ffffff" : "#000000");
        p.setAttribute("fill-rule","evenodd"); });
      const url="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
      const im=new Image(); im.src=url; await im.decode();
      g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.drawImage(im,0,0,W,H);
      const d=g.getImageData(0,0,W,H).data, m2=new Uint8Array(W*H);
      for(let i=0;i<W*H;i++) m2[i]=(d[i*4+3]>128 && d[i*4]<128)?1:0;
      return m2;
    };
    const off = await run({ long: 1e9 });
    const on  = await run(ON);

    const load = async (b64) => { const im=new Image(); im.src="data:image/png;base64,"+b64; await im.decode();
      g.clearRect(0,0,W,H); g.drawImage(im,0,0,W,H); return g.getImageData(0,0,W,H).data; };
    const td = await load(truthB64), pd = await load(photoB64);
    const truth = new Uint8Array(W*H);
    for (let i=0;i<W*H;i++) truth[i]=td[i*4]>128?1:0;

    const iou=(m)=>{let tp=0,fp=0,fn=0;for(let i=0;i<W*H;i++){const go=m[i],wa=truth[i];
      if(go&&wa)tp++;else if(go)fp++;else if(wa)fn++;}
      return {iou:tp/(tp+fp+fn),p:tp/(tp+fp),r:tp/(tp+fn),fp,fn};};

    // three panels: without, with, and what the rule alone did
    const GAP=12, PAD=34, PW=W*3+GAP*2;
    const out=document.createElement("canvas"); out.width=PW; out.height=H+PAD+26;
    const o=out.getContext("2d");
    o.fillStyle="#14171b"; o.fillRect(0,0,out.width,out.height);
    const panel=(x, paint)=>{ const im=o.createImageData(W,H);
      for(let i=0;i<W*H;i++){ const t=paint(i);
        im.data[i*4]=t[0]; im.data[i*4+1]=t[1]; im.data[i*4+2]=t[2]; im.data[i*4+3]=255; }
      o.putImageData(im, x, PAD); };
    const dim=(i,k)=>[pd[i*4]*k, pd[i*4+1]*k, pd[i*4+2]*k];
    const over=(m)=>(i)=> m[i] ? [Math.min(255, pd[i*4]*0.55+90), Math.min(255, pd[i*4+1]*0.55+150),
                                  Math.min(255, pd[i*4+2]*0.55+120)] : dim(i,0.32);
    panel(0, over(off));
    panel(W+GAP, over(on));
    panel(2*(W+GAP), (i)=>{
      if (on[i] && !off[i]) return truth[i] ? [60,220,90] : [235,60,60];
      if (!on[i] && off[i]) return [235,190,60];
      return dim(i, on[i] ? 0.55 : 0.22);
    });
    const A=iou(off), B=iou(on);
    o.font="600 15px system-ui, sans-serif"; o.textBaseline="middle";
    o.fillStyle="#e8eaed";
    o.fillText(`ilman sylinteriä — IoU ${A.iou.toFixed(3)}`, 8, PAD/2);
    o.fillText(`sylinterin kanssa — IoU ${B.iou.toFixed(3)}`, W+GAP+8, PAD/2);
    o.fillText("mitä sääntö yksin muutti", 2*(W+GAP)+8, PAD/2);
    o.font="500 12px system-ui, sans-serif";
    o.fillStyle="#9aa3ad";
    o.fillText(`tarkkuus ${A.p.toFixed(3)} · saanti ${A.r.toFixed(3)}`, 8, PAD+H+13);
    o.fillText(`tarkkuus ${B.p.toFixed(3)} · saanti ${B.r.toFixed(3)}`, W+GAP+8, PAD+H+13);
    let add=0, addFg=0, gone=0;
    for(let i=0;i<W*H;i++){ if(on[i]&&!off[i]){add++; if(truth[i])addFg++;} if(!on[i]&&off[i])gone++; }
    o.fillStyle="#7ddc93"; o.fillText(`vihreä ${addFg} px kohdetta`, 2*(W+GAP)+8, PAD+H+13);
    o.fillStyle="#ef7d7d"; o.fillText(`· punainen ${add-addFg} px taustaa`, 2*(W+GAP)+8+150, PAD+H+13);
    return { png: Array.from(o.getImageData(0,0,out.width,out.height).data),
             w: out.width, h: out.height, off: A, on: B, add, addFg, gone };
  }, { pts: stroke, W, H, truthB64, photoB64, ON, name });

  const file = path.join(DEST, `${name}-sylinteri.png`);
  fs.writeFileSync(file, writePng(zlib, shot.w, shot.h, Buffer.from(shot.png)));
  console.log(`${name}: ilman ${shot.off.iou.toFixed(3)} → kanssa ${shot.on.iou.toFixed(3)}`
    + ` · lisäsi ${shot.add} px, joista ${shot.addFg} px kohdetta`
    + (shot.gone ? ` · poisti ${shot.gone} px` : "") + ` → ${file}`);
}
await close();
