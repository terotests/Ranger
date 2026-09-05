/**
 * Headless check that the compiled Fig viewer parses the sample and draws.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installZstd } from "./zstd.mjs";
import { figmaClipboard, figmaClipboardHtml, figmaClipboardName } from "./clipboard.mjs";

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

// A paste: the same fig-kiwi bytes wrapped the way Figma's clipboard wraps
// them, decoded back and opened with no ZIP around them.
const canvas = web.canvasBytes();
if (!canvas || canvas.byteLength < 1000) {
  console.error("canvasBytes did not come back", canvas && canvas.byteLength);
  process.exit(1);
}
const html = figmaClipboardHtml(canvas, { fileKey: "abc123", pasteID: 7, dataType: "scene" });
const clip = figmaClipboard(html);
if (!clip.buffer || clip.buffer.byteLength !== canvas.byteLength) {
  console.error("clipboard html did not round-trip", clip.buffer && clip.buffer.byteLength, canvas.byteLength);
  process.exit(1);
}
if (clip.meta?.fileKey !== "abc123" || figmaClipboardName(clip.meta) !== "paste from abc123") {
  console.error("figmeta did not round-trip", clip.meta);
  process.exit(1);
}
// What a browser may hand back after sanitising: single quotes, entities.
const sanitised = html.replace(/"/g, "'").replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;");
if (figmaClipboard(sanitised).buffer?.byteLength !== canvas.byteLength) {
  console.error("sanitised clipboard html did not parse");
  process.exit(1);
}
if (!figmaClipboard("<p>plain html</p>").reason || figmaClipboard("").reason !== "no text/html on the clipboard") {
  console.error("non-Figma html gave no reason");
  process.exit(1);
}
if (figmaClipboard("<p>plain html</p>").buffer !== null) {
  console.error("plain html was taken for a Figma paste");
  process.exit(1);
}
clip.buffer._view = new DataView(clip.buffer);
if (!web.openBytes(clip.buffer, figmaClipboardName(clip.meta))) {
  console.error("pasted bytes failed:", web.error());
  process.exit(1);
}
const pasteStats = JSON.parse(web.stats());
if (pasteStats.pasted !== true) {
  console.error("paste not flagged as a paste", pasteStats);
  process.exit(1);
}
const pasteFrames = JSON.parse(web.frames()).map((f) => f.name);
if (!pasteFrames.includes("Dashboard")) {
  console.error("pasted bytes lost the frames", pasteFrames);
  process.exit(1);
}
// Copied layers alone, no page with them: they get one.
if (!web.openClipboardSample()) {
  console.error("clipboard sample failed:", web.error());
  process.exit(1);
}
const pages = JSON.parse(web.pages());
if (pages.length !== 1 || pages[0].name !== "Pasted") {
  console.error("orphan layers did not get a page", pages);
  process.exit(1);
}
const pasted = JSON.parse(web.frames()).map((f) => f.name);
if (!pasted.includes("Card")) {
  console.error("pasted frame missing", pasted);
  process.exit(1);
}
console.log("paste ok — frames", pasteFrames.join(", "), "· loose layers →", pages[0].name);
