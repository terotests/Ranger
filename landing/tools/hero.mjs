/**
 * hero.mjs — lay out the picture behind the first screen and write its
 * display list.
 *
 *   node landing/tools/hero.mjs
 *
 * landing/assets/hero/hero.tsx + hero.css go through EVG's layout engine here,
 * at build time, and come out as landing/assets/hero/hero.json — flat draw
 * commands in absolute pixels, with the `evg-surface-effect: ripple` block the
 * stylesheet declared. The page then draws that list on the GPU every frame
 * through lib/evg/gl/evg-webgl.js and pushes drops into `list.effect.drops`
 * as it goes, so the surface that ripples is EVG's own output rather than a
 * picture of it.
 *
 * The result is committed: the site build copies it, and only a change to the
 * scene needs this to have run.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SRC = "landing/assets/hero/hero.tsx";
const CSS = "landing/assets/hero/hero.css";
const OUT = path.join(ROOT, "landing/assets/hero/hero.json");

const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr" };
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, env, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

console.log("compiling the display-list tool...");
const log = run("node", ["dist/rgrc.js", "-es6", "./gallery/pdf_writer/src/tools/evg_displaylist_tool.rgr",
  "-d=./gallery/pdf_writer/bin", "-o=evg_displaylist_tool.js", "-nodecli"]);
if (log.includes("[FAIL]") || log.includes("Compilation FAILED")) {
  console.error(log);
  throw new Error("the display-list tool did not compile");
}

console.log("laying the scene out...");
run("node", ["./gallery/pdf_writer/bin/evg_displaylist_tool.js", SRC, path.relative(ROOT, OUT),
  "-css", CSS, "-w", "1600", "-h", "900"]);

const doc = JSON.parse(fs.readFileSync(OUT, "utf8"));

// An imported <Svg> is emitted twice: once as the flattened path the vector
// painters draw, and once as an image command for a painter that has no path
// support. The GPU painter has one, so the image is a second copy of the
// letter drawn over the first — and it would make the page fetch the SVG at
// runtime for nothing. Drop it.
const KIND_IMAGE = 2;
const before = doc.list.cmds.length;
doc.list.cmds = doc.list.cmds.filter((c) => c.k !== KIND_IMAGE);
const dropped = before - doc.list.cmds.length;

if (!doc.list.effect || doc.list.effect.kind !== "ripple") {
  throw new Error("the scene came out with no ripple effect — check evg-surface-effect in hero.css");
}

fs.writeFileSync(OUT, JSON.stringify(doc));
console.log(`wrote ${path.relative(ROOT, OUT)} — ${doc.list.cmds.length} commands` +
  `${dropped ? `, ${dropped} image fallback dropped` : ""}, ` +
  `${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
