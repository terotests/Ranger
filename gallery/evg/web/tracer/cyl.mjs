/**
 * tracer/cyl.mjs — can a cylinder rule tell a limb from a rag?
 *
 *   node gallery/evg/web/tracer/photo.mjs --write /tmp/out
 *   node gallery/evg/web/tracer/cyl.mjs /tmp/out pose portrait
 *
 * The proposal: after the cut, a piece that hangs off the body across a *neck*
 * — a join about as wide as the piece itself, that does not fan out and does
 * not run back to the frame — is the rest of a limb and belongs in. A piece
 * that lies along the body for two hundred rows, or that balloons past the
 * join, does not. A flagpole below a black band, the next stripe of a zebra's
 * tail, a foot below the shadow across the shin: all the same shape.
 *
 * For every unselected piece touching the answer this prints the join, the
 * piece's own greatest width, how far it runs from the join, the area, and —
 * from the truth mask — whether admitting it would have been right.
 *
 *   venymä    pituus / jänne, how far the piece runs from its join over how
 *             wide the join is. A rag along a seam scores 0.05, a limb 1.
 *   paisunta  the widest band past the join over the band at the join. This
 *             is "suppeneva": a cylinder keeps its cross-section.
 *
 * What it found, in the order that matters:
 *
 *  1. **The coherence pass is not what cuts the foot off.** Of everything the
 *     cut chose and coherence then dropped, 30 px on the beach picture and
 *     8 px on the portrait are actually the person — against 17 063 px of
 *     background dropped on the portrait alone. So the candidates for any such
 *     rule are pieces the cut *rejected*, not pieces the tidy-up lost.
 *
 *  2. Among those, the two ratios separate: on the beach picture the pieces
 *     that belong have paisunta 1.17 against 3.67 for the ones that do not.
 *
 *  3. **And they are not enough.** A rule made of them alone is a wash — it
 *     brings the hair back on the portrait and the flagpole with it, because a
 *     curtain fold is a cylinder too. Two more tests, both read off the picture
 *     of that failure, are what made it work: how ragged the outline is against
 *     a smooth cylinder of the same area and length, and how much of that
 *     outline is actually the seam. See the comment over `wandCylinders`.
 *
 * The sweep this file prints is measured on the *scoring* raster and it knows
 * nothing about groups, so it reads high by about the size of the effect and
 * it cannot see what grouping is worth at all. It is here for the per-piece
 * table and for finding 1. The rule itself is swept in place, in the page,
 * where the wand's own raster is 1.5x finer and the same drape measures
 * differently.
 */
import fs from "node:fs";
import { openPage, waitOk } from "./eval-harness.mjs";

const OUT = process.argv[2];
const NAMES = process.argv.slice(3).filter((a) => !a.startsWith("-"));
if (!OUT) { console.error("käyttö: node cyl.mjs <hakemisto> [pose] [portrait]"); process.exit(1); }
const CASES = { pose: { W: 640, H: 427 }, portrait: { W: 512, H: 640 } };
const names = NAMES.length ? NAMES : Object.keys(CASES);

const { page, close } = await openPage();

// ---------------------------------------------------------------- page side
async function shoot(name, W, H) {
  const stroke = JSON.parse(fs.readFileSync(`${OUT}/${name}-stroke.json`, "utf8"));
  await page.evaluate(() => { document.getElementById("status").textContent = "…"; });
  await page.setInputFiles("#file", `${OUT}/${name}.png`);
  await waitOk(page);
  await page.evaluate(() => { document.getElementById("status").textContent = "…";
    const b=document.getElementById("bgMode"); b.value="none"; b.dispatchEvent(new Event("change",{bubbles:true}));
    const c=document.getElementById("colorCount"); c.value="20"; c.dispatchEvent(new Event("input",{bubbles:true})); });
  await waitOk(page);
  if (!(await page.evaluate(() => document.getElementById("editToggle").getAttribute("aria-pressed") === "true")))
    await page.click("#editToggle");
  return await page.evaluate(async ({ pts, W, H }) => {
    const svg = document.querySelector("#outStage svg");
    const rect = svg.getBoundingClientRect(), stage = document.getElementById("outStage");
    const at=(fx,fy)=>({x:rect.left+fx*rect.width,y:rect.top+fy*rect.height});
    const send=(t,p)=>stage.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:p.x,clientY:p.y}));
    document.getElementById("toolMerge").click(); document.getElementById("toolWand").click();
    const m=document.getElementById("wandMode"); m.value="smart"; m.dispatchEvent(new Event("change",{bubbles:true}));
    const q=[];
    for(let i=0;i+1<pts.length;i++)for(let k=0;k<10;k++)
      q.push(at(pts[i][0]+(pts[i+1][0]-pts[i][0])*k/10, pts[i][1]+(pts[i+1][1]-pts[i][1])*k/10));
    q.push(at(pts.at(-1)[0],pts.at(-1)[1]));
    send("pointerdown",q[0]); q.slice(1).forEach(p=>send("pointermove",p)); send("pointerup",q.at(-1));

    const els=[...svg.querySelectorAll("path")].filter(p=>!p.closest("mask")&&!p.closest("clipPath"));
    const c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
    const vb=svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    g.setTransform(W/vb[2],0,0,H/vb[3],-vb[0]*W/vb[2],-vb[1]*H/vb[3]);
    els.forEach((p,i)=>{const v=i+1; g.fillStyle=`rgb(${v&255},${(v>>8)&255},${(v>>16)&255})`;
      g.fill(new Path2D(p.getAttribute("d")),"evenodd");});
    const idd=g.getImageData(0,0,W,H).data;
    // what the wand actually shows, clips honoured
    const clone=svg.cloneNode(true);
    [...clone.querySelectorAll("path")].forEach((p)=>{ if(p.closest("mask")||p.closest("clipPath"))return;
      p.setAttribute("fill", p.classList.contains("wand-off") ? "#ffffff" : "#000000");
      p.setAttribute("fill-rule","evenodd"); });
    const url="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
    const im=new Image(); im.src=url; await im.decode();
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.drawImage(im,0,0,W,H);
    const sd=g.getImageData(0,0,W,H).data;
    const ids=new Uint16Array(W*H), sel=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++){
      const id=idd[i*4]|(idd[i*4+1]<<8)|(idd[i*4+2]<<16);
      ids[i]= id>0 && id<65535 ? id : 0;
      sel[i]= (sd[i*4+3]>128 && sd[i*4]<128) ? 1 : 0;
    }
    // and what the cut chose but the coherence pass then threw away — the
    // set a rule like this one would have to argue with
    const L=window.__wandLast, chose=new Set(L.raw), kept=new Set(L.sel);
    g.setTransform(W/vb[2],0,0,H/vb[3],-vb[0]*W/vb[2],-vb[1]*H/vb[3]);
    g.clearRect(vb[0],vb[1],vb[2],vb[3]); g.fillStyle="#000";
    let nDrop=0;
    [...chose].forEach((i)=>{ if(kept.has(i))return; nDrop++;
      const p=els[i]; if(p) g.fill(new Path2D(p.getAttribute("d")),"evenodd"); });
    g.setTransform(1,0,0,1,0,0);
    const dd=g.getImageData(0,0,W,H).data;
    const drop=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++) drop[i]= (dd[i*4+3]>128 && !sel[i]) ? 1 : 0;
    const b64=(u8)=>{let s="";for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s);};
    return { n: els.length, ids: b64(new Uint8Array(ids.buffer)), sel: b64(sel),
             drop: b64(drop), nDrop };
  }, { pts: stroke, W, H });
}

const un = (s, T) => { const b = Buffer.from(s, "base64"); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
const readTruth = (name, W, H) => {
  // photo.mjs writes the truth as a plain white-on-black PNG; decode it with
  // the same canvas rather than a PNG reader we do not have.
  return page.evaluate(async ({ b64, W, H }) => {
    const t=new Image(); t.src="data:image/png;base64,"+b64; await t.decode();
    const c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
    g.drawImage(t,0,0,W,H); const d=g.getImageData(0,0,W,H).data;
    const m=new Uint8Array(W*H); for(let i=0;i<W*H;i++) m[i]=d[i*4]>128?1:0;
    let s=""; for(let i=0;i<m.length;i+=8192) s+=String.fromCharCode.apply(null,m.subarray(i,i+8192));
    return btoa(s);
  }, { b64: fs.readFileSync(`${OUT}/${name}-truth.png`).toString("base64"), W, H });
};

// ---------------------------------------------------------------- geometry
// Components of `mask`, four-connected, optionally split by region id too.
function pieces(mask, ids, W, H, byId) {
  const comp = new Int32Array(W * H).fill(-1), st = [];
  const info = [];
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || comp[s] >= 0) continue;
    const id = info.length; comp[s] = id; st.push(s);
    let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0, frame = 0, region = ids[s];
    while (st.length) {
      const q = st.pop(); n++;
      const x = q % W, y = (q / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x === 0 || y === 0 || x === W-1 || y === H-1) frame++;
      const ok = (t) => t >= 0 && mask[t] && comp[t] < 0 && (!byId || ids[t] === region);
      if (x > 0   && ok(q-1)) { comp[q-1] = id; st.push(q-1); }
      if (x < W-1 && ok(q+1)) { comp[q+1] = id; st.push(q+1); }
      if (y > 0   && ok(q-W)) { comp[q-W] = id; st.push(q-W); }
      if (y < H-1 && ok(q+W)) { comp[q+W] = id; st.push(q+W); }
    }
    info.push({ id, n, x0, x1, y0, y1, frame, region });
  }
  return { comp, info };
}

// Distance to the nearest cell that is not in the same component, by the
// 3-4 chamfer. Half the greatest value inside a component is its half-width.
function thickness(comp, W, H) {
  const INF = 1e9, d = new Float32Array(W * H).fill(INF);
  const diff = (a, b) => a !== b;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y*W + x, c = comp[p];
    if (c < 0) { d[p] = 0; continue; }
    if (x === 0 || y === 0 || x === W-1 || y === H-1
      || diff(comp[p-1], c) || diff(comp[p+1], c)
      || diff(comp[p-W], c) || diff(comp[p+W], c)) d[p] = 0;
  }
  const rel = (p, q, w) => { if (comp[q] === comp[p] && d[q] + w < d[p]) d[p] = d[q] + w; };
  for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
    const p = y*W+x; if (!d[p]) continue;
    rel(p, p-W-1, 4); rel(p, p-W, 3); rel(p, p-W+1, 4); rel(p, p-1, 3);
  }
  for (let y = H-2; y > 0; y--) for (let x = W-2; x > 0; x--) {
    const p = y*W+x; if (!d[p]) continue;
    rel(p, p+W+1, 4); rel(p, p+W, 3); rel(p, p+W-1, 4); rel(p, p+1, 3);
  }
  return d;
}

function stats(name, W, H, ids, sel, truth) {
  // the body: the largest connected piece of the answer
  const A = pieces(sel, ids, W, H, false);
  let body = -1, bodyN = 0;
  for (const c of A.info) if (c.n > bodyN) { bodyN = c.n; body = c.id; }

  // the candidates: connected pieces of one region that the cut left out
  const rest = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) rest[i] = (!sel[i] && ids[i]) ? 1 : 0;
  const B = pieces(rest, ids, W, H, true);
  const d = thickness(B.comp, W, H);

  const rows = [];
  const dist = new Int32Array(W * H).fill(-1), queue = new Int32Array(W * H);
  for (const c of B.info) {
    let join = 0, jx0 = W, jx1 = 0, jy0 = H, jy1 = 0, maxD = 0, tFg = 0;
    let qh = 0, qt = 0;
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
      const p = y*W + x; if (B.comp[p] !== c.id) continue;
      if (d[p] > maxD) maxD = d[p];
      if (truth[p]) tFg++;
      const touch = (x > 0 && sel[p-1] && A.comp[p-1] === body)
        || (x < W-1 && sel[p+1] && A.comp[p+1] === body)
        || (y > 0 && sel[p-W] && A.comp[p-W] === body)
        || (y < H-1 && sel[p+W] && A.comp[p+W] === body);
      if (touch) { join++; if (x<jx0)jx0=x; if(x>jx1)jx1=x; if(y<jy0)jy0=y; if(y>jy1)jy1=y;
        dist[p] = 0; queue[qt++] = p; }
    }
    if (!join) continue;
    // How the piece grows away from its join: a cylinder keeps its
    // cross-section and runs on; a rag lying along a seam is all join and no
    // length. Both are measured from the same walk.
    const band = [];
    while (qh < qt) {
      const p = queue[qh++], t = dist[p], x = p % W, y = (p / W) | 0;
      band[t] = (band[t] || 0) + 1;
      const go = (q) => { if (B.comp[q] === c.id && dist[q] < 0) { dist[q] = t + 1; queue[qt++] = q; } };
      if (x > 0) go(p-1); if (x < W-1) go(p+1);
      if (y > 0) go(p-W); if (y < H-1) go(p+W);
    }
    for (let k = 0; k < qt; k++) dist[queue[k]] = -1;   // leave the scratch clean
    const depth = band.length - 1;
    const w0 = band[0] || 1;
    let wmax = 0; for (let t = 1; t <= depth; t++) if ((band[t]||0) > wmax) wmax = band[t]||0;
    const span = Math.round(Math.hypot(jx1-jx0+1, jy1-jy0+1));
    const wide = 2 * maxD / 3 + 1;            // chamfer units back to pixels
    rows.push({ id: c.id, region: c.region, area: c.n, join, span, frame: c.frame,
      wide: +wide.toFixed(1), depth,
      elong: +(depth / Math.max(1, span)).toFixed(2),
      bal: +(wmax / w0).toFixed(2),
      fan: +(wide / Math.max(1, span)).toFixed(2),
      lie: +(span / Math.max(1, wide)).toFixed(2),
      fg: tFg, bg: c.n - tFg, want: tFg > c.n / 2 });
  }
  rows.sort((a, b) => b.area - a.area);
  return { rows, bodyN, A, B, d, body };
}

// ---------------------------------------------------------------- report
const num = (v, w) => String(v).padStart(w);
for (const name of names) {
  const { W, H } = CASES[name];
  const shot = await shoot(name, W, H);
  const ids = un(shot.ids, Uint16Array), sel = un(shot.sel, Uint8Array);
  const truth = un(await readTruth(name, W, H), Uint8Array);
  const S = stats(name, W, H, ids, sel, truth);

  let inter = 0, uni = 0;
  for (let i = 0; i < W*H; i++) { if (sel[i] && truth[i]) inter++; if (sel[i] || truth[i]) uni++; }
  console.log(`\n${name}  ${W}×${H} · valinta ${S.bodyN} px runkoa · IoU ${(inter/uni).toFixed(3)}`);
  const drop = un(shot.drop, Uint8Array);
  let dFg = 0, dBg = 0;
  for (let i = 0; i < W*H; i++) if (drop[i]) { if (truth[i]) dFg++; else dBg++; }
  console.log(`  koherenssi pudotti ${shot.nDrop} aluetta · niissä ${dFg} px kohdetta`
    + ` ja ${dBg} px taustaa — se ei siis ole se, mikä katkaisee jalan`);
  console.log(`  ${S.rows.length} ulkopuolista palaa koskettaa runkoa`
    + ` · niistä ${S.rows.filter(r=>r.want).length} kuuluisi mukaan`
    + ` (${S.rows.filter(r=>r.want).reduce((a,r)=>a+r.fg,0)} px)`);
  console.log("   pala   alue  liitos jänne leveys pituus  venymä  paisunta kehys    FGpx   BGpx  mukaan");
  for (const r of S.rows.slice(0, 28))
    console.log([num(r.id,7), num(r.area,6), num(r.join,7), num(r.span,5), num(r.wide,6),
      num(r.depth,6), num(r.elong,7), num(r.bal,9), num(r.frame,5), num(r.fg,7), num(r.bg,6),
      (r.want ? "  KYLLÄ" : "     ei")].join(" "));

  // Does either ratio separate the pieces that belong from the pieces that do not?
  const big = S.rows.filter((r) => r.area >= 60);
  const yes = big.filter((r) => r.want), no = big.filter((r) => !r.want);
  const med = (a, f) => { const v = a.map(f).sort((x,y)=>x-y); return v.length ? v[v.length>>1].toFixed(2) : "-"; };
  console.log(`  ≥60 px: ${yes.length} kuuluu, ${no.length} ei`);
  for (const [k, f] of [["venymä", r=>r.elong], ["paisunta", r=>r.bal],
                        ["fan", r=>r.fan], ["lie", r=>r.lie], ["ala", r=>r.area]])
    console.log(`    ${k.padEnd(9)} mediaani  kuuluu ${med(yes,f)}  ei ${med(no,f)}`);

  // What a rule made of them would actually win and lose, swept — and swept
  // again after the admitted pieces become body, which is the recursion the
  // proposal turns on: a striped limb only reaches its end one band at a time.
  console.log("   sääntö: venymä ≥ E ja paisunta ≤ B, ei kehyskosketusta");
  for (const E of [0.3, 0.6, 1.0]) for (const B of [2.0, 4.0]) for (const K of [0.05, 0.15, 1e9]) {
    const run = (rounds) => {
      const s2 = Uint8Array.from(sel);
      let took = 0, win = 0, lose = 0;
      for (let k = 0; k < rounds; k++) {
        const T = stats(name, W, H, ids, s2, truth);
        let any = 0;
        for (const r of T.rows) {
          if (r.frame || r.elong < E || r.bal > B || r.area > K * T.bodyN) continue;
          any++; took++; win += r.fg; lose += r.bg;
          for (let p = 0; p < W*H; p++) if (T.B.comp[p] === r.id) s2[p] = 1;
        }
        if (!any) break;
      }
      let i2 = 0, u2 = 0;
      for (let i = 0; i < W*H; i++) { if (s2[i] && truth[i]) i2++; if (s2[i] || truth[i]) u2++; }
      return { took, win, lose, iou: i2/u2 };
    };
    const a = run(1), b = run(4);
    console.log(`     E=${E} B=${B} K=${K}: ${num(a.took,4)} palaa · +${num(a.win,6)} oikein`
      + ` · +${num(a.lose,6)} väärin · IoU ${a.iou.toFixed(3)}`
      + `   │ 4 kierrosta: ${num(b.took,4)} · +${num(b.win,6)} · +${num(b.lose,6)}`
      + ` · IoU ${b.iou.toFixed(3)}`);
  }
}
await close();
