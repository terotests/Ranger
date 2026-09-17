/**
 * build.mjs — assemble the front page.
 *
 *   node landing/build.mjs                    -> landing/dist
 *   node landing/build.mjs --out "$SITE"      -> into the Pages artifact root
 *   node landing/build.mjs --no-examples      -> copy the committed targets.js
 *
 * The page is plain HTML, CSS and one module, so this does almost nothing:
 * it copies them, brings in the WebGL painter the backdrop is drawn with, and
 * regenerates the compiled examples so the "one source, many targets" section
 * shows what THIS commit's compiler writes rather than what some earlier one
 * did. Everything else the page needs — the traced mark, the hero's display
 * list, the screenshots — is committed, because regenerating it needs demos
 * built and toolchains present.
 *
 * Their generators, when you do want to re-run them:
 *
 *   node landing/tools/logo.mjs       the mark and the favicon (the bitmap tracer)
 *   node landing/tools/hero.mjs       the hero display list (EVG layout)
 *   node landing/tools/capture.mjs    screenshots of the demos that have no
 *   node landing/tools/shots.mjs      committed artifact, then the scale-down
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const argv = process.argv.slice(2);
const outAt = argv.indexOf("--out");
const OUT = outAt >= 0 ? path.resolve(argv[outAt + 1]) : path.join(HERE, "dist");
const withExamples = !argv.includes("--no-examples");

/** Files of the page itself. */
const PAGE = ["index.html", "styles.css", "main.js"];

/** Directories copied whole out of landing/assets. */
const ASSET_DIRS = ["shots", "hero"];

/** Single files out of landing/assets. */
const ASSET_FILES = ["ranger-mark.svg", "favicon.svg", "targets.js"];

/**
 * The WebGL painter the backdrop is drawn with, taken from the gallery rather
 * than copied into this folder: the front page draws its surface with the same
 * file the PowerPoint editor and the node-graph editor are drawn with, and a
 * fork of it here would quietly stop being that.
 */
const PAINTER = "gallery/evg/gl/evg-webgl.js";

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

if (withExamples) {
  console.log("compiling the front page's example for every target it shows...");
  execFileSync("node", ["landing/tools/examples.mjs"], { cwd: ROOT, stdio: "inherit" });
}

fs.mkdirSync(OUT, { recursive: true });

for (const f of PAGE) {
  const src = path.join(HERE, f);
  if (!fs.existsSync(src)) throw new Error(`landing/${f} is missing`);
  copy(src, path.join(OUT, f));
}

for (const d of ASSET_DIRS) {
  const src = path.join(HERE, "assets", d);
  if (!fs.existsSync(src)) throw new Error(`landing/assets/${d} is missing`);
  copyDir(src, path.join(OUT, "assets", d));
}

for (const f of ASSET_FILES) {
  const src = path.join(HERE, "assets", f);
  if (!fs.existsSync(src)) {
    throw new Error(`landing/assets/${f} is missing — see the generators in landing/build.mjs`);
  }
  copy(src, path.join(OUT, "assets", f));
}

copy(path.join(ROOT, PAINTER), path.join(OUT, "assets", "gl", "evg-webgl.js"));

// The hero's own sources are not served; only the display list it produced.
for (const leftover of ["hero.tsx", "hero.css"]) {
  const at = path.join(OUT, "assets", "hero", leftover);
  if (fs.existsSync(at)) fs.rmSync(at);
}

// A page that ships without its backdrop or its letter is a broken page, so
// say which piece is missing here rather than in somebody's browser.
for (const need of ["assets/hero/hero.json", "assets/ranger-mark.svg", "assets/gl/evg-webgl.js",
                    "assets/shots/figma.jpg", "assets/targets.js"]) {
  const at = path.join(OUT, need);
  if (!fs.existsSync(at) || fs.statSync(at).size === 0) throw new Error(`the build wrote no ${need}`);
}

const bytes = (function size(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return n;
})(OUT);

console.log(`front page -> ${path.relative(ROOT, OUT) || OUT}  (${(bytes / 1024).toFixed(0)} KB)`);
