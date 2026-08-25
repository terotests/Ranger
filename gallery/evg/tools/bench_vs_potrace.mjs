#!/usr/bin/env node
/**
 * Optional wall-clock comparison of EvgBitmapTracer (compiled ES6) vs
 * npm `potrace` and/or the system `potrace` CLI (skyrpex/potrace mirror).
 *
 * Usage:
 *   node gallery/evg/tools/bench_vs_potrace.mjs [.evg_trace_out]
 *
 * Install the JS reference with:  npm i --no-save potrace
 * Install the CLI with your package manager (potrace / potools).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");
const OUT = process.argv[2] ? join(ROOT, process.argv[2]) : join(ROOT, ".evg_trace_out");
mkdirSync(OUT, { recursive: true });

const cases = [
  { name: "rect_64", w: 64, h: 64, kind: "rect", x0: 8, y0: 8, rw: 48, rh: 48, iters: 40 },
  { name: "rect_256", w: 256, h: 256, kind: "rect", x0: 32, y0: 32, rw: 192, rh: 192, iters: 20 },
  { name: "checker_128", w: 128, h: 128, kind: "checker", iters: 20 },
  { name: "ring_128", w: 128, h: 128, kind: "ring", x0: 16, y0: 16, rw: 96, rh: 96, iters: 30 },
];

function makeBitmap(c) {
  const data = new Uint8Array(c.w * c.h);
  const set = (x, y, on) => {
    if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
    data[y * c.w + x] = on ? 1 : 0;
  };
  if (c.kind === "rect" || c.kind === "ring") {
    for (let y = c.y0; y < c.y0 + c.rh; y++) {
      for (let x = c.x0; x < c.x0 + c.rw; x++) set(x, y, true);
    }
    if (c.kind === "ring") {
      const ix = c.x0 + Math.floor(c.rw / 4);
      const iy = c.y0 + Math.floor(c.rh / 4);
      const iw = Math.floor(c.rw / 2);
      const ih = Math.floor(c.rh / 2);
      for (let y = iy; y < iy + ih; y++) {
        for (let x = ix; x < ix + iw; x++) set(x, y, false);
      }
    }
  } else if (c.kind === "checker") {
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) {
        const cell = Math.floor(x / 8) + Math.floor(y / 8);
        if (cell % 2 === 0) set(x, y, true);
      }
    }
  }
  return data;
}

function writePbm(path, w, h, data) {
  // P4 raw PBM — what the potrace CLI expects.
  const rowBytes = Math.ceil(w / 8);
  const buf = Buffer.alloc(rowBytes * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x]) {
        const bi = y * rowBytes + (x >> 3);
        buf[bi] |= 0x80 >> (x & 7);
      }
    }
  }
  writeFileSync(path, Buffer.concat([Buffer.from(`P4\n${w} ${h}\n`), buf]));
}

function tryRequirePotrace() {
  const require = createRequire(import.meta.url);
  try {
    return require(join(ROOT, "node_modules/potrace"));
  } catch {
    try {
      return require("potrace");
    } catch {
      return null;
    }
  }
}

function rgbaFromBitmap(w, h, data) {
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = data[i] ? 0 : 255;
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

async function benchNpmPotrace(Potrace, c, data) {
  // potrace npm expects a Jimp-like or file path; use Potrace.Posterize? 
  // The classic API: new Potrace.Potrace(); loadImage(buffer)...
  // Fall back to tracing via temporary PNG written as raw through Jimp-free path:
  // Many builds accept { data, width, height } through Posterizer — try Potrace.
  const params = {
    turdSize: 2,
    alphaMax: 1,
    optCurve: true,
    optTolerance: 0.2,
    threshold: 128,
    blackOnWhite: true,
  };

  // Build a minimal BMP so loadImage works without Jimp when possible.
  const bmp = encodeBmp(c.w, c.h, data);
  const tmp = join(OUT, `${c.name}.bmp`);
  writeFileSync(tmp, bmp);

  const runOnce = () =>
    new Promise((resolve, reject) => {
      const p = new Potrace.Potrace(params);
      p.loadImage(tmp, (err) => {
        if (err) return reject(err);
        const svg = p.getSVG();
        resolve(svg);
      });
    });

  // Warmup
  let last = await runOnce();
  const t0 = performance.now();
  for (let i = 0; i < c.iters; i++) last = await runOnce();
  const ms = performance.now() - t0;
  return { ms, svgChars: last.length, pathChars: (last.match(/ d="([^"]*)"/) || ["", ""])[1].length };
}

function encodeBmp(w, h, data) {
  // 24-bit BMP, bottom-up rows, row padded to 4 bytes.
  const rowSize = Math.floor((w * 3 + 3) / 4) * 4;
  const pixelSize = rowSize * h;
  const fileSize = 54 + pixelSize;
  const buf = Buffer.alloc(fileSize);
  buf.write("BM", 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(pixelSize, 34);
  for (let y = 0; y < h; y++) {
    const srcY = h - 1 - y;
    for (let x = 0; x < w; x++) {
      const on = data[srcY * w + x];
      const v = on ? 0 : 255;
      const o = 54 + y * rowSize + x * 3;
      buf[o] = v;
      buf[o + 1] = v;
      buf[o + 2] = v;
    }
  }
  return buf;
}

function benchCliPotrace(c, data) {
  const which = spawnSync("which", ["potrace"], { encoding: "utf8" });
  if (which.status !== 0) return null;
  const pbm = join(OUT, `${c.name}.pbm`);
  const svg = join(OUT, `${c.name}.cli.svg`);
  writePbm(pbm, c.w, c.h, data);
  // Warmup
  spawnSync("potrace", ["-s", "-o", svg, pbm], { encoding: "utf8" });
  const t0 = performance.now();
  for (let i = 0; i < c.iters; i++) {
    const r = spawnSync("potrace", ["-s", "-o", svg, pbm], { encoding: "utf8" });
    if (r.status !== 0) {
      console.log(`  FAIL cli potrace: ${r.stderr || r.stdout}`);
      return null;
    }
  }
  const ms = performance.now() - t0;
  const text = readFileSync(svg, "utf8");
  const m = text.match(/ d="([^"]*)"/);
  return { ms, svgChars: text.length, pathChars: m ? m[1].length : 0 };
}

function parseRangerLog() {
  const log = join(OUT, "bench_ranger.log");
  if (!existsSync(log)) return {};
  const map = {};
  for (const line of readFileSync(log, "utf8").split("\n")) {
    if (!line.startsWith("BENCH_CASE ")) continue;
    try {
      const obj = JSON.parse(line.slice("BENCH_CASE ".length));
      map[obj.name] = obj;
    } catch {
      /* ignore */
    }
  }
  return map;
}

async function main() {
  const ranger = parseRangerLog();
  const Potrace = tryRequirePotrace();
  if (!Potrace) {
    console.log("  skip npm potrace (npm i --no-save potrace to enable)");
  } else {
    console.log("  npm potrace available");
  }

  console.log("  name            ranger_cmds ranger_path  cli_path   ratio");
  let qualityFail = 0;
  for (const c of cases) {
    const data = makeBitmap(c);
    let npmRes = null;
    let cliRes = null;
    if (Potrace) {
      try {
        npmRes = await benchNpmPotrace(Potrace, c, data);
      } catch (e) {
        console.log(`  WARN npm potrace failed on ${c.name}: ${e.message}`);
      }
    }
    try {
      cliRes = benchCliPotrace(c, data);
    } catch (e) {
      console.log(`  WARN cli potrace failed on ${c.name}: ${e.message}`);
    }
    const r = ranger[c.name] || {};
    const fmt = (v) => (v == null ? "   n/a" : String(v).padStart(7));
    const ratio =
      cliRes && r.pathChars
        ? (r.pathChars / cliRes.pathChars).toFixed(2) + "x"
        : "   n/a";
    console.log(
      `  ${c.name.padEnd(14)} ${fmt(r.commands)} ${fmt(r.pathChars)} ${fmt(cliRes && cliRes.pathChars)} ${String(ratio).padStart(7)}`
    );
    // Quality gate: rect/ring must stay within 1.5× CLI path size (or absolute slack).
    if (cliRes && r.pathChars != null && (c.name.startsWith("rect_") || c.name.startsWith("ring_"))) {
      const limit = Math.max(cliRes.pathChars * 1.5, cliRes.pathChars + 40);
      if (r.pathChars > limit) {
        console.log(`  FAIL quality ${c.name}: ranger pathChars ${r.pathChars} > limit ${limit.toFixed(0)} (cli ${cliRes.pathChars})`);
        qualityFail++;
      } else {
        console.log(`  PASS quality ${c.name}`);
      }
    }
  }

  const wall = existsSync(join(OUT, "bench_ranger.log"))
    ? readFileSync(join(OUT, "bench_ranger.log"), "utf8").split("\n").find((l) => l.startsWith("BENCH_RANGER_WALL_MS"))
    : null;
  if (wall) console.log(`  ${wall}`);
  console.log("  (ranger per-case ms are in the overall wall time; npm/cli are timed here)");
  if (qualityFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
