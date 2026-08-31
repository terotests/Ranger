#!/usr/bin/env node
/**
 * bench_speed.mjs — wall clock, across tracers and across image sizes.
 *
 * Measured the way a person feels it: one process per conversion, median of
 * several runs after a warm-up. Process startup is measured separately and
 * printed, so it can be read out of the numbers rather than guessed at — it is
 * 40 ms of every Node row and 2 ms of every native one.
 *
 * Three sizes rather than one, because the interesting number is not what a
 * tracer does on a thumbnail. A tracer whose cost per pixel rises with the
 * picture will beat everything on the small case and lose the one that
 * matters.
 *
 * Not apples to apples on work done, and it cannot be: potrace traces one
 * bitmap and the colour tracers quantize first, and they do not agree on how
 * many shapes an answer should have. Read it next to the fidelity table from
 * bench_vs_others.mjs, never on its own.
 *
 *   node gallery/evg/tools/bench_speed.mjs
 *   AUTOTRACE=… VTRACER=… RUNS=5 node gallery/evg/tools/bench_speed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { decodePng, writePbm } from "./bench_image.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, ".evg_trace_out/speed");
fs.mkdirSync(OUT, { recursive: true });
const RUNS = +(process.env.RUNS || 5);
const require = createRequire(path.join(ROOT, "package.json"));
const has = (c) => { try { execFileSync("which", [c], { stdio: "ignore" }); return true; } catch { return false; } };
const hasModule = (m) => { try { require.resolve(m); return true; } catch { return false; } };

const median = a => [...a].sort((x, y) => x - y)[a.length >> 1];
function once(cmd, args) {
  const t0 = process.hrtime.bigint();
  try { execFileSync(cmd, args, { stdio: "ignore", cwd: ROOT, timeout: 300000 }); } catch { return null; }
  return Number(process.hrtime.bigint() - t0) / 1e6;
}
// The warm-up sets the budget: something already slow is measured once rather
// than five times, so one slow tracer cannot hold up the table.
function timeIt(cmd, args) {
  const warm = once(cmd, args);
  if (warm === null) return null;
  const runs = warm > 4000 ? 1 : (warm > 800 ? 2 : RUNS);
  const t = [];
  for (let i = 0; i < runs; i++) { const v = once(cmd, args); if (v === null) return null; t.push(v); }
  return median(t);
}

// Sizes: the sample, and it scaled up, so the table shows scaling and not
// just startup. Made here rather than committed.
const SAMPLE = path.join(ROOT, "gallery/evg/web/tracer/sample.png");
const images = [["320x221", SAMPLE]];
for (const [w, h] of [[960, 663], [1920, 1326]]) {
  const f = path.join(OUT, `scaled_${w}.png`);
  if (!fs.existsSync(f)) {
    try {
      execFileSync(process.execPath, [path.join(ROOT, "gallery/evg/tools/scale_png.mjs"), SAMPLE, f, String(w), String(h)],
                   { stdio: "ignore", cwd: ROOT });
    } catch { continue; }
  }
  if (fs.existsSync(f)) images.push([`${w}x${h}`, f]);
}
for (const [, f] of images) writePbm(f.replace(/\.png$/, ".pbm"), decodePng(f));

const floors = {
  node: timeIt(process.execPath, ["-e", "0"]),
  python: has("python3") ? timeIt("python3", ["-c", "0"]) : null,
  native: timeIt("/bin/true", []),
};
console.log(`process startup floor:  node ${floors.node.toFixed(0)} ms` +
  (floors.python === null ? "" : ` · python ${floors.python.toFixed(0)} ms`) +
  ` · native ${floors.native.toFixed(1)} ms`);
console.log(`up to ${RUNS} runs each after a warm-up, median reported\n`);

const AT = process.env.AUTOTRACE || (has("autotrace") ? "autotrace" : null);
const VT = process.env.VTRACER || (has("vtracer") ? "vtracer" : null);
const BIN = "gallery/evg/bin";
const cases = [];
if (fs.existsSync(path.join(ROOT, BIN, "evg_trace_cli")))
  cases.push(["Ranger C++", "native", s => [`./${BIN}/evg_trace_cli`, [s, `${OUT}/cpp.svg`, "--preset", "poster"]]]);
if (fs.existsSync(path.join(ROOT, BIN, "evg_trace_cli.js")))
  cases.push(["Ranger Node", "node", s => [process.execPath, [`${BIN}/evg_trace_cli.js`, s, `${OUT}/node.svg`, "--preset", "poster"]]]);
if (fs.existsSync(path.join(ROOT, BIN, "evg_trace_cli.py")) && floors.python !== null)
  cases.push(["Ranger Python", "python", s => ["python3", [`${BIN}/evg_trace_cli.py`, s, `${OUT}/py.svg`, "--preset", "poster"]]]);
if (VT) cases.push(["vtracer", "native", s => [VT, [s, `${OUT}/vt.svg`]]]);
if (AT) cases.push(["autotrace", "native", s => [AT,
  ["-input-format", "png", "-output-format", "svg", "-color-count", "8",
   "-despeckle-level", "4", "-output-file", `${OUT}/at.svg`, s]]]);
if (hasModule("imagetracerjs")) {
  // A one-line runner on disk rather than a -e string: the quoting of a
  // program inside a program is where these scripts go wrong.
  const runner = path.join(OUT, "run_imagetracer.mjs");
  fs.writeFileSync(runner, [
    'import fs from "node:fs";',
    'import { createRequire } from "node:module";',
    `import { decodePng } from ${JSON.stringify(path.join(ROOT, "gallery/evg/tools/bench_image.mjs"))};`,
    `const I = createRequire(${JSON.stringify(path.join(ROOT, "package.json"))})("imagetracerjs");`,
    "const im = decodePng(process.argv[2]);",
    "fs.writeFileSync(process.argv[3], I.imagedataToSVG(" +
      "{ width: im.width, height: im.height, data: im.data }, { numberofcolors: 8 }));",
  ].join("\n"));
  cases.push(["imagetracerjs", "node", s => [process.execPath, [runner, s, `${OUT}/it.svg`]]]);
}
if (has("potrace")) cases.push(["potrace (mono only)", "native",
  s => ["potrace", [s.replace(/\.png$/, ".pbm"), "-s", "-o", `${OUT}/pot.svg`]]]);

const rows = [];
for (const [name, kind, mk] of cases) {
  const row = { tracer: name, startup: +floors[kind].toFixed(0) };
  for (const [label, src] of images) {
    const [cmd, args] = mk(src);
    const ms = timeIt(cmd, args);
    row[label] = ms === null ? "—" : Math.round(ms);
  }
  rows.push(row);
}
console.table(rows);
// Where a colour trace's time actually goes. Stacked mode traces the image
// once per swatch, so the cost is the mono cost times the colour count plus
// the quantization — which is the price of the stacking, and the number to
// look at before blaming the fitting core.
const cliCpp = path.join(ROOT, BIN, "evg_trace_cli");
const cliAny = fs.existsSync(cliCpp) ? [cliCpp, []]
             : (fs.existsSync(path.join(ROOT, BIN, "evg_trace_cli.js"))
                ? [process.execPath, [`${BIN}/evg_trace_cli.js`]] : null);
if (cliAny) {
  const [cmd, pre] = cliAny;
  const build = fs.existsSync(cliCpp) ? "C++" : "Node";
  const small = images[0][1];
  const byColour = [];
  for (const n of [1, 2, 4, 8, 16, 24]) {
    const ms = timeIt(cmd, [...pre, small, `${OUT}/k.svg`, "--colorCount", String(n)]);
    byColour.push({ colours: n, [`${images[0][0]} (${build})`]: ms === null ? "—" : Math.round(ms) });
  }
  console.log(`\ncost by colour count — stacked mode traces once per swatch\n`);
  console.table(byColour);
}

const mp = images.map(([l]) => { const [w, h] = l.split("x").map(Number); return (w*h/1e6).toFixed(2); });
console.log(`\nmegapixels: ${mp.join(" / ")}`);
console.log("potrace traces one bitmap; the colour tracers quantize first, and they do not\n" +
            "agree on how many shapes an answer should have. Read this next to the fidelity\n" +
            "table from bench_vs_others.mjs, never on its own.");
