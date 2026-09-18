/**
 * logos.mjs — the marks in the strip under the hero, put through the same
 * pipeline as Ranger's own.
 *
 *   node landing/tools/logos.mjs
 *
 * Each one starts as a vector in landing/assets/logos/src — simple-icons,
 * CC0-1.0, the file is beside them — and is then:
 *
 *   1. RASTERISED by gallery/pdf_writer/src/tools/evg_png_tool.rgr, which
 *      lays out a one-element page and fills the mark into a 320 × 320 bitmap
 *      with EVG's own scanline rasteriser. After this step the logo is pixels
 *      and nothing else.
 *   2. TRACED back by lib/evg/tools/evg_trace_cli.rgr: threshold, edge
 *      walk, corner detection, cubic fitting. What comes out is a path this
 *      repository computed from an image, which is the point of showing them.
 *
 * The result goes to landing/assets/logos/<name>.svg with `currentColor` as
 * its fill, so the page can tint the whole strip at once, and is committed.
 *
 * The marks are the trademarks of the projects they belong to. They appear on
 * the front page to say which languages and platforms Ranger compiles for,
 * which is what they are for; nothing here is an endorsement by any of them.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SRC = path.join(ROOT, "landing/assets/logos/src");
const OUT = path.join(ROOT, "landing/assets/logos");
const TMP = path.join(ROOT, ".landing_tmp/logos");

/** The strip, in the order it scrolls. */
const MARKS = [
  "swift", "apple", "kotlin", "android", "javascript", "typescript", "nodedotjs",
  "dotnet", "cplusplus", "rust", "go", "python", "dart", "flutter", "php",
  "openjdk", "webassembly", "llvm", "raspberrypi",
];

const SIZE = 320;

const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, env, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

/** The compiler exits 0 on failure, so read the log rather than the status. */
function compile(src, outDir, outFile) {
  const log = run("node", ["bin/output.js", "-es6", src, `-d=${outDir}`, `-o=${outFile}`, "-nodecli"]);
  if (log.includes("[FAIL]") || log.includes("Compilation FAILED")) {
    console.error(log);
    throw new Error(`failed to compile ${src}`);
  }
}

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

console.log("compiling the raster tool and the tracer...");
compile("gallery/pdf_writer/src/tools/evg_png_tool.rgr", "gallery/pdf_writer/bin", "evg_png_tool.js");
compile("lib/evg/tools/evg_trace_cli.rgr", "lib/evg/bin", "evg_trace_cli.js");

// One stylesheet for all of them: black on white at the full sheet, which is
// what the tracer's threshold wants to see.
fs.writeFileSync(path.join(TMP, "mark.css"),
  `.sheet { width: ${SIZE}px; height: ${SIZE}px; background: #ffffff; }\n` +
  `.mark  { width: ${SIZE}px; height: ${SIZE}px; fill: #000000; }\n`);

const made = [];
for (const name of MARKS) {
  const src = path.join(SRC, `${name}.svg`);
  if (!fs.existsSync(src)) throw new Error(`no source mark for ${name}`);

  const tsx = path.join(TMP, `${name}.tsx`);
  fs.writeFileSync(tsx,
    'import { View, Svg } from "./evg_types";\n\n' +
    "function render() {\n  return (\n    <View className=\"sheet\">\n" +
    `      <Svg className="mark" src="${path.relative(TMP, src).split(path.sep).join("/")}" />\n` +
    "    </View>\n  );\n}\n");

  const png = path.join(TMP, `${name}.png`);
  run("node", ["gallery/pdf_writer/bin/evg_png_tool.js", tsx, png,
    "-w", String(SIZE), "-h", String(SIZE), "-css", path.join(TMP, "mark.css")]);
  if (!fs.existsSync(png)) throw new Error(`${name}: the raster tool wrote no bitmap`);

  const traced = path.join(TMP, `${name}.traced.svg`);
  run("node", ["lib/evg/bin/evg_trace_cli.js", png, traced,
    "--threshold", "170", "--turdsize", "6", "--alphamax", "1.0", "--opttolerance", "0.25"]);

  const svg = fs.readFileSync(traced, "utf8");
  const paths = [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0]);
  if (!paths.length) throw new Error(`${name}: the tracer wrote no path`);

  // currentColor, no intrinsic size: the strip decides both.
  const body = paths
    .map((p) => p.replace(/fill="[^"]*"/, 'fill="currentColor"'))
    .join("");
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">${body}</svg>\n`;
  fs.writeFileSync(path.join(OUT, `${name}.svg`), wrapped);
  made.push([name, paths.length, wrapped.length]);
  console.log(`  ${name.padEnd(13)} ${String(paths.length).padStart(2)} path(s)  ${(wrapped.length / 1024).toFixed(1)} KB`);
}

const total = made.reduce((n, m) => n + m[2], 0);
console.log(`traced ${made.length} marks into landing/assets/logos (${(total / 1024).toFixed(0)} KB)`);
