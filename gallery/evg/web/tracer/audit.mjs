/**
 * tracer/audit.mjs — which regions the two errors are actually made of.
 *
 *   node gallery/evg/web/tracer/photo.mjs portrait --write /tmp/out
 *   node gallery/evg/web/tracer/audit.mjs /tmp/out
 *
 * Reads the picture, the truth and the stroke that photo.mjs saved, plays the
 * stroke again, and then attributes every wrong pixel to the region that drew
 * it — with everything the energy is made of beside it: the region's own truth
 * split, whether the cut took it, its contact with the frame, its distance to
 * each colour model, its depth from a hint, and the pairwise weight it has to
 * selected and to unselected neighbours.
 *
 * It exists to answer one question before any algorithm is changed: **can the
 * min-cut decide this at all?** A region that is 50 852 px of the man and
 * 14 713 px of the desk behind him has to be taken or left whole, and no
 * amount of better evidence will separate them — that is a job for the tracer,
 * or for clipping the region at the end. The first run of it said exactly
 * that, and saved a week of tuning the wrong thing.
 */
import fs from "node:fs";
import { openPage, waitOk } from "./eval-harness.mjs";
const OUT = process.argv[2];
if (!OUT) { console.error("käyttö: node audit.mjs <hakemisto>   (photo.mjs --write <hakemisto> ensin)"); process.exit(1); }
const W = 512, H = 640;
const stroke = JSON.parse(fs.readFileSync(OUT + "/portrait-stroke.json", "utf8"));
const truthB64 = fs.readFileSync(OUT + "/portrait-truth.png").toString("base64");

const { page, close } = await openPage();
await page.evaluate(() => { document.getElementById("status").textContent = "…"; window.__wandAuditOn = true; });
await page.setInputFiles("#file", OUT + "/portrait.png");
await waitOk(page);
await page.evaluate(() => { document.getElementById("status").textContent = "…";
  const b=document.getElementById("bgMode"); b.value="none"; b.dispatchEvent(new Event("change",{bubbles:true}));
  const c=document.getElementById("colorCount"); c.value="20"; c.dispatchEvent(new Event("input",{bubbles:true})); });
await waitOk(page);
await page.click("#editToggle");

const D = await page.evaluate(async ({ pts, W, H, truthB64 }) => {
  const svg = document.querySelector("#outStage svg");
  const rect = svg.getBoundingClientRect(); const stage = document.getElementById("outStage");
  const at=(fx,fy)=>({x:rect.left+fx*rect.width,y:rect.top+fy*rect.height});
  const drag=(ps)=>{const send=(t,p)=>stage.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:p.x,clientY:p.y}));
    const q=[];for(let i=0;i+1<ps.length;i++)for(let k=0;k<10;k++)q.push(at(ps[i][0]+(ps[i+1][0]-ps[i][0])*k/10,ps[i][1]+(ps[i+1][1]-ps[i][1])*k/10));
    q.push(at(ps.at(-1)[0],ps.at(-1)[1]));send("pointerdown",q[0]);q.slice(1).forEach(p=>send("pointermove",p));send("pointerup",q.at(-1));};
  document.getElementById("toolMerge").click(); document.getElementById("toolWand").click();
  const m=document.getElementById("wandMode"); m.value="smart"; m.dispatchEvent(new Event("change",{bubbles:true}));
  drag(pts);

  // per-region truth overlap and bbox, in the scoring raster
  const els=[...svg.querySelectorAll("path")].filter(p=>!p.closest("mask")&&!p.closest("clipPath"));
  const c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
  const vb=svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
  g.setTransform(W/vb[2],0,0,H/vb[3],-vb[0]*W/vb[2],-vb[1]*H/vb[3]);
  els.forEach((p,i)=>{const v=i+1;g.fillStyle=`rgb(${v&255},${(v>>8)&255},${(v>>16)&255})`;
    g.fill(new Path2D(p.getAttribute("d")),"evenodd");});
  const idd=g.getImageData(0,0,W,H).data;
  const t=new Image(); t.src="data:image/png;base64,"+truthB64; await t.decode();
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.drawImage(t,0,0,W,H);
  const td=g.getImageData(0,0,W,H).data;
  // what the wand actually shows, clips honoured
  const clone=svg.cloneNode(true);
  [...clone.querySelectorAll("path")].forEach((p)=>{ if(p.closest("mask")||p.closest("clipPath"))return;
    p.setAttribute("fill", p.classList.contains("wand-off") ? "#ffffff" : "#000000");
    p.setAttribute("fill-rule","evenodd"); });
  const url="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
  const im=new Image(); im.src=url; await im.decode();
  g.clearRect(0,0,W,H); g.drawImage(im,0,0,W,H);
  const sd=g.getImageData(0,0,W,H).data;
  const n=els.length;
  const fgPx=new Int32Array(n+1), bgPx=new Int32Array(n+1);
  const fpR=new Int32Array(n+1), fpAll=new Int32Array(n+1), fnH=new Int32Array(n+1), fnAll=new Int32Array(n+1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
    const id=idd[i*4]|(idd[i*4+1]<<8)|(idd[i*4+2]<<16);
    if(id<=0||id>n)continue;
    const want=td[i*4]>128, got=sd[i*4+3]>128 && sd[i*4]<128;
    if(want)fgPx[id]++; else bgPx[id]++;
    if(got&&!want){ fpAll[id]++; if(x>400)fpR[id]++; }
    if(!got&&want){ fnAll[id]++; if(y<140)fnH[id]++; }}
  return { n, fgPx:Array.from(fgPx), bgPx:Array.from(bgPx),
           fpR:Array.from(fpR), fpAll:Array.from(fpAll),
           fnH:Array.from(fnH), fnAll:Array.from(fnAll),
           last: window.__wandLast, audit: window.__wandAudit };
}, { pts: stroke, W, H, truthB64 });

const L = D.last, A = D.audit;
const sel = new Set(L.sel), cut = new Set(A.cut), fgSeed = new Set(L.fg);
const un = new Map(A.unary.map((r) => [r[0], r]));
const nb = new Map();
for (const [a,b,w,len,edge,dc] of A.pair) {
  if (!nb.has(a)) nb.set(a, []); if (!nb.has(b)) nb.set(b, []);
  nb.get(a).push([b,w,len,edge,dc]); nb.get(b).push([a,w,len,edge,dc]);
}
const frame = new Set(L.frame), flen = L.frameLen || {};

function row(i) {
  const u = un.get(i) || [i, L.seen[i], NaN, NaN, -1, NaN, NaN];
  const ns = nb.get(i) || [];
  let wSel = 0, wBg = 0;
  for (const [j,w] of ns) { if (sel.has(j)) wSel += w; else wBg += w; }
  const id1 = i + 1;
  return { id: i, seen: L.seen[i], fg: D.fgPx[id1]||0, bg: D.bgPx[id1]||0,
    fpR: D.fpR[id1]||0, fpAll: D.fpAll[id1]||0, fnH: D.fnH[id1]||0, fnAll: D.fnAll[id1]||0,
    sel: sel.has(i) ? (fgSeed.has(i) ? "SEED" : "kyllä") : "ei",
    inCut: cut.has(i) ? "k" : "e", frame: frame.has(i) ? (flen[i]||0) : 0,
    dF: u[2], dB: u[3], depth: u[4], toBg: u[5], toFg: u[6],
    wSel: +wSel.toFixed(1), wBg: +wBg.toFixed(1) };
}
const hdr = "  id   seen    FGpx   BGpx   virhe valittu cut kehys    dF    dB syv    ->BG    ->FG   ΣWsel    ΣWbg";
const fmt = (r, e) => [String(r.id).padStart(4), String(r.seen).padStart(7),
  String(r.fg).padStart(7), String(r.bg).padStart(6), String(e).padStart(7),
  r.sel.padStart(7), r.inCut.padStart(3), String(r.frame).padStart(6),
  String(r.dF).padStart(6), String(r.dB).padStart(6), String(r.depth).padStart(3),
  String(r.toBg).padStart(8), String(r.toFg).padStart(8),
  String(r.wSel).padStart(7), String(r.wBg).padStart(8)].join(" ");

const rows = [];
for (let i = 0; i < D.n; i++) rows.push(row(i));
const leak = rows.filter((r) => r.fpR >= 40).sort((a,b)=>b.fpR-a.fpR);
const hair = rows.filter((r) => r.fnH >= 40).sort((a,b)=>b.fnH-a.fnH);

console.log("=== OIKEAN LAIDAN VUOTO — regionit joiden vastuulla on väärin valittua taustaa x>400");
console.log(hdr); leak.slice(0,12).forEach((r)=>console.log(fmt(r, r.fpR)));
console.log("  " + leak.length + " regionia · " + leak.reduce((a,r)=>a+r.fpR,0) + " px vuotoa"
  + " · niissä oikeaa kuvaa yhteensä " + leak.reduce((a,r)=>a+r.fg,0) + " px");
console.log("");
console.log("=== HIUKSET — regionit joiden vastuulla on valitsematta jäänyttä kuvaa y<140");
console.log(hdr); hair.slice(0,12).forEach((r)=>console.log(fmt(r, r.fnH)));
console.log("  " + hair.length + " regionia · " + hair.reduce((a,r)=>a+r.fnH,0) + " px puuttuvaa"
  + " · niissä taustaa yhteensä " + hair.reduce((a,r)=>a+r.bg,0) + " px");
await close();
