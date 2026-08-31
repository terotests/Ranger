#!/usr/bin/env node
/**
 * bench_vs_others.mjs — score EvgBitmapTracer against the other open-source
 * tracers, on the same image and by the same measure.
 *
 * Wall-clock alone says nothing about a tracer, and neither does file size: a
 * tracer that drops half the picture is fast and small. So the SVG is
 * rasterized back with Chromium and compared to the source it came from —
 * RMSE over RGB and SSIM over 8x8 windows — and the bytes are read next to
 * that. A result is only interesting as a size-at-a-fidelity.
 *
 * Two comparisons, because they answer different questions:
 *
 *   colour — the whole pipeline (quantize, segment, fit, encode) against
 *            vtracer and ImageTracerJS, scored against the original.
 *   mono   — geometry alone: the same thresholded bitmap through this tracer
 *            and through potrace, scored against that bitmap. potrace is the
 *            reference implementation of the algorithm EvgTraceFit implements,
 *            so this is the one number that says whether the fit is right.
 *
 * Every competitor is optional and skipped when absent:
 *
 *   apt install potrace                 # the mono reference (also Inkscape's engine)
 *   npm i --no-save imagetracerjs       # colour, pure JS
 *   npm i --no-save potrace             # Inkscape's multi-scan, as a JS port
 *   cargo install vtracer-cli           # colour, or point VTRACER at a binary
 *   build autotrace and set AUTOTRACE   # colour, the other classic
 *
 * Inkscape is not run directly and does not need to be: its Trace Bitmap is
 * potrace, and 1.2 exposes no trace action to a command line (`--action-list`
 * has none), so it cannot be scripted anyway. The `potrace posterize` row is
 * the same algorithm its Multiple Scans mode uses — potrace over N brightness
 * layers, stacked — through the npm port.
 *
 * Chromium comes from Playwright; PLAYWRIGHT_CHROMIUM may point at another one.
 *
 *   node gallery/evg/tools/bench_vs_others.mjs [image.png]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, ".evg_trace_out/bench");
const SRC = process.argv[2] ? path.resolve(process.argv[2])
                            : path.join(ROOT, "gallery/evg/web/tracer/sample.png");
fs.mkdirSync(OUT, { recursive: true });

const require = createRequire(path.join(ROOT, "package.json"));
const has = (cmd) => { try { execFileSync("which", [cmd], { stdio: "ignore" }); return true; } catch { return false; } };
const hasModule = (m) => { try { require.resolve(m); return true; } catch { return false; } };

// ---------------------------------------------------------------- PNG decode
function decodePng(file) {
  const b = fs.readFileSync(file);
  let o = 8, ihdr = null; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), t = b.toString("ascii", o + 4, o + 8);
    if (t === "IHDR") ihdr = { w: b.readUInt32BE(o + 8), h: b.readUInt32BE(o + 12), depth: b[o + 16], color: b[o + 17] };
    if (t === "IDAT") idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
    if (t === "IEND") break;
  }
  if (!ihdr || ihdr.depth !== 8) throw new Error("only 8-bit PNG input");
  const ch = { 0: 1, 2: 3, 6: 4 }[ihdr.color];
  if (!ch) throw new Error("unsupported PNG colour type " + ihdr.color);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { w, h } = ihdr, stride = w * ch, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), pos = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++], line = Buffer.from(raw.subarray(pos, pos + stride)); pos += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0, bb = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (ft === 1) v += a; else if (ft === 2) v += bb; else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c); }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * ch, d = (y * w + x) * 4;
      if (ch === 1) { px[d] = px[d+1] = px[d+2] = line[s]; px[d+3] = 255; }
      else { px[d] = line[s]; px[d+1] = line[s+1]; px[d+2] = line[s+2]; px[d+3] = ch === 4 ? line[s+3] : 255; }
    }
    prev = line;
  }
  return { width: w, height: h, data: px };
}

// ------------------------------------------------------------------- metrics
const rmse = (a, b) => { let s = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) for (let c = 0; c < 3; c++) { const d = a[i+c] - b[i+c]; s += d*d; n++; }
  return Math.sqrt(s / n); };
function ssim(a, b, w, h) {
  const gray = p => { const g = new Float64Array(w * h);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = 0.299*p[i] + 0.587*p[i+1] + 0.114*p[i+2];
    return g; };
  const ga = gray(a), gb = gray(b), C1 = 6.5025, C2 = 58.5225, win = 8, step = 4;
  let acc = 0, cnt = 0;
  for (let y = 0; y + win <= h; y += step) for (let x = 0; x + win <= w; x += step) {
    let ma = 0, mb = 0;
    for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) { const k = (y+j)*w + x+i; ma += ga[k]; mb += gb[k]; }
    const n = win * win; ma /= n; mb /= n;
    let va = 0, vb = 0, cov = 0;
    for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) { const k = (y+j)*w + x+i;
      const da = ga[k] - ma, db = gb[k] - mb; va += da*da; vb += db*db; cov += da*db; }
    va /= n-1; vb /= n-1; cov /= n-1;
    acc += ((2*ma*mb + C1) * (2*cov + C2)) / ((ma*ma + mb*mb + C1) * (va + vb + C2));
    cnt++;
  }
  return acc / cnt;
}

// Real segments and command letters, honouring implicit command repetition.
const ARITY = { M:2,m:2,L:2,l:2,H:1,h:1,V:1,v:1,C:6,c:6,S:4,s:4,Q:4,q:4,T:2,t:2,A:7,a:7,Z:0,z:0 };
function pathStats(svg) {
  let segs = 0, letters = 0;
  for (const m of svg.matchAll(/ d="([^"]*)"/g)) {
    const toks = m[1].match(/[A-Za-z]|-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    let need = 0, got = 0;
    for (const t of toks) {
      if (/[A-Za-z]/.test(t)) { need = ARITY[t] ?? 0; got = 0; letters++; if (need === 0) segs++; }
      else if (++got === need) { segs++; got = 0; }
    }
  }
  return { segs, letters };
}

// --------------------------------------------------------------- rasterizing
async function rasterize(files, w, h) {
  const req = createRequire("/opt/node22/lib/node_modules/x");
  let chromium;
  try { ({ chromium } = req("playwright")); } catch { ({ chromium } = require("playwright")); }
  const exe = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(exe)
    ? { executablePath: exe, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const out = [];
  for (const f of files) {
    // The drawing box is forced: potrace writes its size in pt, and an
    // unconstrained svg would render half again too large and score as noise.
    await page.setContent(`<style>html,body{margin:0;padding:0;background:#fff}` +
      `svg{display:block;width:${w}px;height:${h}px}</style>${fs.readFileSync(f, "utf8")}`);
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: w, height: h } });
    const p = f.replace(/\.svg$/, ".render.png");
    fs.writeFileSync(p, png);
    out.push(decodePng(p));
  }
  await browser.close();
  return out;
}

// ------------------------------------------------------------------- tracers
const img = decodePng(SRC);
const { width: W, height: H, data: PX } = img;

const tracerJs = path.join(ROOT, "gallery/evg/bin/evg_trace_cli.js");
if (!fs.existsSync(tracerJs)) {
  console.error("build the CLI first:  npm run evg:trace:cli:run  (or evg:trace:cli)");
  process.exit(1);
}

const rows = [], files = [];
function record(name, file, ms) {
  const svg = fs.readFileSync(file, "utf8");
  const st = pathStats(svg);
  files.push(file);
  rows.push({ name, ms: ms ?? null, kB: +(svg.length / 1024).toFixed(0),
              paths: (svg.match(/<path/g) || []).length, segs: st.segs, letters: st.letters });
}
function ranger(name, args, out) {
  const f = path.join(OUT, out);
  const t0 = performance.now();
  execFileSync(process.execPath, [tracerJs, SRC, f, ...args], { stdio: "ignore" });
  record(name, f, Math.round(performance.now() - t0));
}

console.log(`source: ${path.relative(ROOT, SRC)}  ${W}x${H}\n`);
console.log("=== colour ===  scored against the source image\n");

for (const [name, args] of [
  ["Ranger poster", ["--preset", "poster"]],
  ["Ranger broken", ["--preset", "broken"]],
  ["Ranger print", ["--preset", "print"]],
  ["Ranger print p1", ["--preset", "print", "--pathPrecision", "1"]],
]) ranger(name, args, name.replace(/\W+/g, "_") + ".svg");

const VT = process.env.VTRACER || (has("vtracer") ? "vtracer" : null);
if (VT) {
  for (const [name, args] of [["vtracer default", []], ["vtracer poster", ["--preset", "poster"]],
                              ["vtracer cutout", ["--hierarchical", "cutout"]]]) {
    const f = path.join(OUT, name.replace(/\W+/g, "_") + ".svg");
    const t0 = performance.now();
    try { execFileSync(VT, [SRC, f, ...args], { stdio: "ignore" }); record(name, f, Math.round(performance.now() - t0)); }
    catch { console.log(`  skip ${name} (vtracer refused these options)`); }
  }
} else console.log("  skip vtracer (not installed — cargo install vtracer-cli)");

const AT = process.env.AUTOTRACE || (has("autotrace") ? "autotrace" : null);
if (AT) {
  // More colours make autotrace worse here, not better, and its despeckle is
  // worth more than either — both were swept before these were picked.
  for (const [name, extra] of [["autotrace c8", []],
                               ["autotrace c8 despeckled", ["-despeckle-level", "4"]],
                               ["autotrace c4", ["-color-count", "4"]]]) {
    const f = path.join(OUT, name.replace(/\W+/g, "_") + ".svg");
    const args = ["-input-format", path.extname(SRC).slice(1), "-output-format", "svg",
                  "-color-count", "8", ...extra, "-output-file", f, SRC];
    const t0 = performance.now();
    try { execFileSync(AT, args, { stdio: "ignore" }); record(name, f, Math.round(performance.now() - t0)); }
    catch { console.log(`  skip ${name} (autotrace refused this input)`); }
  }
} else console.log("  skip autotrace (not installed — set AUTOTRACE to a built binary)");

// Inkscape's Multiple Scans is potrace over N brightness layers. It is slow
// enough that the step count has to be kept low: 4 steps is seconds, 8 did not
// finish in seven minutes here.
if (hasModule("potrace")) {
  const potrace = require("potrace");
  for (const steps of [4]) {
    const f = path.join(OUT, `potrace_posterize${steps}.svg`);
    const t0 = performance.now();
    try {
      const svg = await new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error("timeout")), 120000);
        potrace.posterize(SRC, { steps }, (e, v) => { clearTimeout(timer); e ? rej(e) : res(v); });
      });
      fs.writeFileSync(f, svg);
      record(`potrace posterize ${steps} (Inkscape)`, f, Math.round(performance.now() - t0));
    } catch (e) { console.log(`  skip potrace posterize ${steps} (${e.message})`); }
  }
} else console.log("  skip potrace posterize (npm i --no-save potrace)");

if (hasModule("imagetracerjs")) {
  const ImageTracer = require("imagetracerjs");
  for (const [name, opts] of [["imagetracerjs c8", { numberofcolors: 8 }],
                              ["imagetracerjs c16", { numberofcolors: 16 }]]) {
    const t0 = performance.now();
    const svg = ImageTracer.imagedataToSVG({ width: W, height: H, data: PX }, opts);
    const f = path.join(OUT, name.replace(/\W+/g, "_") + ".svg");
    fs.writeFileSync(f, svg);
    record(name, f, Math.round(performance.now() - t0));
  }
} else console.log("  skip imagetracerjs (npm i --no-save imagetracerjs)");

let r = await rasterize(files, W, H);
rows.forEach((x, i) => { x.rmse = +rmse(PX, r[i].data).toFixed(2);
                         x.ssim = +ssim(PX, r[i].data, W, H).toFixed(3); });
rows.sort((a, b) => a.rmse - b.rmse);
console.table(rows);

// ------------------------------------------------------------------ mono
console.log("\n=== mono ===  geometry alone, scored against the thresholded bitmap\n");
if (!has("potrace")) {
  console.log("  skip (potrace not installed — apt install potrace)");
} else {
  const THR = 128;
  const ref = Buffer.alloc(W * H * 4), bits = new Uint8Array(W * H);
  for (let i = 0, p = 0; p < W * H; p++, i += 4) {
    const g = 0.299*PX[i] + 0.587*PX[i+1] + 0.114*PX[i+2];
    bits[p] = g < THR ? 1 : 0;
    const v = bits[p] ? 0 : 255;
    ref[i] = ref[i+1] = ref[i+2] = v; ref[i+3] = 255;
  }
  const rowBytes = Math.ceil(W / 8), pbm = Buffer.alloc(rowBytes * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (bits[y*W + x]) pbm[y*rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
  const pbmFile = path.join(OUT, "mono.pbm");
  fs.writeFileSync(pbmFile, Buffer.concat([Buffer.from(`P4\n${W} ${H}\n`), pbm]));

  const mrows = [], mfiles = [];
  const mrecord = (name, file, ms) => { const svg = fs.readFileSync(file, "utf8");
    const st = pathStats(svg); mfiles.push(file);
    mrows.push({ name, ms, kB: +(svg.length/1024).toFixed(0), segs: st.segs, letters: st.letters }); };
  for (const [name, args] of [
    ["Ranger curves", ["--colorCount", "1", "--threshold", String(THR)]],
    ["Ranger polygon", ["--colorCount", "1", "--threshold", String(THR), "--optcurve", "false"]],
  ]) {
    const f = path.join(OUT, name.replace(/\W+/g, "_") + ".svg");
    const t0 = performance.now();
    execFileSync(process.execPath, [tracerJs, SRC, f, ...args], { stdio: "ignore" });
    mrecord(name, f, Math.round(performance.now() - t0));
  }
  for (const [name, args] of [["potrace -a1 (curves)", ["-s"]], ["potrace -a0 (polygon)", ["-s", "-a", "0"]]]) {
    const f = path.join(OUT, name.replace(/\W+/g, "_") + ".svg");
    const t0 = performance.now();
    execFileSync("potrace", [pbmFile, ...args, "-o", f]);
    mrecord(name, f, Math.round(performance.now() - t0));
  }
  r = await rasterize(mfiles, W, H);
  mrows.forEach((x, i) => { x.rmse = +rmse(ref, r[i].data).toFixed(2);
                            x.ssim = +ssim(ref, r[i].data, W, H).toFixed(4); });
  console.table(mrows);
  console.log("  Both tracers are given the same bitmap at the same threshold, so a\n" +
              "  difference here is a difference in the fit and nothing else.");
}
