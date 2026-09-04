/**
 * Headless check that the compiled Fig viewer parses the sample and draws.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installZstd } from "./zstd.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const js = join(dist, "fig_web.js");
if (!existsSync(js)) {
  console.error("missing dist/fig_web.js — run the build first");
  process.exit(1);
}

// A Figma export is zstd inside the ZIP; the page installs the same hook.
installZstd();
// The page has no require(). The bundle must still define FigWeb.
const src = readFileSync(js, "utf8");
const FigWeb = (0, eval)(src + "; FigWeb");
if (typeof FigWeb !== "function") {
  console.error("FigWeb is not a function");
  process.exit(1);
}

const web = new FigWeb();
if (!web.openSample()) {
  console.error("openSample failed:", web.error());
  process.exit(1);
}
if ((web.pageCount() | 0) < 2) {
  console.error("expected two sample pages, got", web.pageCount());
  process.exit(1);
}
const scene = JSON.parse(web.scene());
const cmds = scene.list?.cmds || [];
if (cmds.length < 4) {
  console.error("expected draw commands, got", cmds.length);
  process.exit(1);
}
const stats = JSON.parse(web.stats());
if (stats.ok !== true) {
  console.error("stats.ok is not true", stats);
  process.exit(1);
}
const tree = JSON.parse(web.tree());
if (!tree.children || tree.children.length < 1) {
  console.error("tree has no children");
  process.exit(1);
}
console.log("fig smoke ok — pages", web.pageCount(), "cmds", cmds.length, "nodes", stats.nodes);

// A real Figma export: three phone frames, Auto Layout everywhere, text in
// fonts the page does not have, one image, a stroke-only chart line.
const figPath = join(here, "..", "..", "fixtures", "health.fig");
const bytes = readFileSync(figPath);
const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
ab._view = new DataView(ab);
web.setViewport(1200, 800);
if (!web.openBytes(ab, "health.fig")) {
  console.error("health.fig failed:", web.error());
  process.exit(1);
}
const frames = JSON.parse(web.frames()).map((f) => f.name);
for (const want of ["Dashboard", "Activity", "Progress"]) {
  if (!frames.includes(want)) {
    console.error("health.fig: frame missing", want, frames);
    process.exit(1);
  }
}
const evg = web.evgDump();
// Auto Layout children sit where Figma put them: the header 20px in, 28px down.
if (!evg.includes('id="1:4" position="absolute" left="20px" top="28px"')) {
  console.error("health.fig: header is not at the stored 20,28");
  process.exit(1);
}
// Text paints as its own glyph outlines — no span carrying a background.
if (evg.includes("<span")) {
  console.error("health.fig: text fell back to spans");
  process.exit(1);
}
const health = JSON.parse(web.scene());
const hc = health.list?.cmds || [];
const img = hc.find((c) => c.k === 2);
if (!img || img.src !== "aa64b7b3e303e0ea28a3bb6efa93741511acd803") {
  console.error("health.fig: the avatar image did not resolve", img);
  process.exit(1);
}
const paths = hc.filter((c) => c.k === 6).length;
if (paths < 100) {
  console.error("health.fig: expected glyph and vector paths, got", paths);
  process.exit(1);
}
if (hc.some((c) => c.k === 3)) {
  console.error("health.fig: a text command slipped through beside the outlines");
  process.exit(1);
}
const warns = JSON.parse(web.warnings());
if (warns.length) {
  console.error("health.fig: unexpected warnings", warns);
  process.exit(1);
}
console.log("health.fig ok — frames", frames.join(", "), "cmds", hc.length, "paths", paths);
