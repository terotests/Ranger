/**
 * Headless check that the compiled Fig viewer parses the sample and draws.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { figmaClipboard, figmaClipboardHtml, figmaClipboardName, FIG_FILE_RE } from "./clipboard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const js = join(dist, "fig_web.js");
if (!existsSync(js)) {
  console.error("missing dist/fig_web.js — run the build first");
  process.exit(1);
}

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
const clipStats = JSON.parse(web.stats());
// The copied layers are orphans by nature — they still point at the page
// they were copied from. Every one of them has to end up on a page, or it
// is parsed and never drawn, which is what a half-empty paste looks like.
if (clipStats.orphans < 1 || clipStats.adopted !== clipStats.orphans) {
  console.error("loose layers were not all placed", clipStats.orphans, clipStats.adopted);
  process.exit(1);
}
if (clipStats.unrooted !== 0) {
  console.error("clipboard sample had nodes naming no parent", clipStats.unrooted);
  process.exit(1);
}
console.log("paste ok — frames", pasteFrames.join(", "), "· loose layers →", pages[0].name,
  "· orphans", clipStats.orphans, "adopted", clipStats.adopted);

// A whole document pasted keeps its own page and invents none: the "Pasted"
// page is for layers with nowhere to go, not for every paste.
if (pasteStats.orphans !== 0 || pasteStats.adopted !== 0) {
  console.error("a whole document pasted grew a Pasted page", pasteStats.orphans, pasteStats.adopted);
  process.exit(1);
}

// ---- What a browser can do to the clipboard HTML on the way here --------
// Each of these is a real paste that must still parse; a regression here is
// a paste that does nothing on one browser and works on another.
const variants = {
  "single quotes": html.replace(/"/g, "'"),
  "named entities": html.replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;"),
  "numeric entities": html.replace(/<!--/g, "&#60;!--").replace(/-->/g, "--&#62;"),
  "hex entities": html.replace(/<!--/g, "&#x3C;!--").replace(/-->/g, "--&#x3E;"),
  "wrapped base64": html.replace(/(\(figma\))([A-Za-z0-9+/=]+)/, (m, a, b) => a + b.replace(/(.{40})/g, "$1\n")),
};
for (const [name, variant] of Object.entries(variants)) {
  const got = figmaClipboard(variant);
  if (got.buffer?.byteLength !== canvas.byteLength) {
    console.error("clipboard variant did not parse:", name, got.reason);
    process.exit(1);
  }
}

// Base64 comes in groups of four. A payload cut short would otherwise decode
// to fewer bytes with no complaint, and the parser would fail far from here.
const cut = html.replace(/(data-buffer="<!--\(figma\))([A-Za-z0-9+/=]+)(--)/, (m, a, b, c) => a + b.slice(0, b.length - 3) + c);
const cutClip = figmaClipboard(cut);
if (cutClip.buffer !== null || !/truncated/.test(cutClip.reason)) {
  console.error("a truncated buffer was accepted", cutClip.reason);
  process.exit(1);
}

// The debug block is what the page shows when a paste draws nothing, so it
// has to be filled in whether the paste worked or not.
const okDebug = figmaClipboard(html).debug;
if (okDebug.bytes !== canvas.byteLength || !okDebug.hasMetadata || okDebug.meta?.fileKey !== "abc123") {
  console.error("paste debug is missing what it saw", okDebug);
  process.exit(1);
}
if (!okDebug.prelude.startsWith("fig-")) {
  console.error("paste debug did not read the prelude", okDebug.prelude);
  process.exit(1);
}
const badDebug = figmaClipboard("<p>plain html</p>").debug;
if (badDebug.hasFigmaMarker !== false || badDebug.htmlChars !== 17) {
  console.error("rejected paste debug is wrong", badDebug);
  process.exit(1);
}
if (!FIG_FILE_RE.test("a.fig") || !FIG_FILE_RE.test("A.DECK") || FIG_FILE_RE.test("a.figx")) {
  console.error("FIG_FILE_RE does not name the files the page opens");
  process.exit(1);
}
// health.fig's message chunk is zstd, and nothing on this page installs a
// zstd host: the decoder that read it is the Ranger one in gallery/zstd.
// If a hook ever comes back, this says so rather than quietly using it.
if (typeof globalThis.__figZstdDecompress === "function") {
  console.error("something installed a zstd host hook — the page should not need one");
  process.exit(1);
}
const zstdWeb = new FigWeb();
zstdWeb.setViewport(1200, 800);
const fresh = readFileSync(figPath);
const freshAb = fresh.buffer.slice(fresh.byteOffset, fresh.byteOffset + fresh.byteLength);
freshAb._view = new DataView(freshAb);
if (!zstdWeb.openBytes(freshAb, "health.fig")) {
  console.error("health.fig failed on a fresh engine:", zstdWeb.error());
  process.exit(1);
}
const zstdStats = JSON.parse(zstdWeb.stats());
if (zstdStats.zstd !== true) {
  console.error("health.fig did not go through zstd, so this proves nothing", zstdStats.zstd);
  process.exit(1);
}

// A corrupt message chunk must fail rather than decode to an empty
// document: the schema chunk was checked for that and the message was not.
// Half way in is inside the zstd stream; nearer the ends is an image blob
// or ZIP padding, which the reader is right to shrug at.
const broken = readFileSync(figPath);
const brokenAb = broken.buffer.slice(broken.byteOffset, broken.byteOffset + broken.byteLength);
new Uint8Array(brokenAb)[brokenAb.byteLength >> 1] ^= 0xff;
brokenAb._view = new DataView(brokenAb);
const brokenWeb = new FigWeb();
brokenWeb.setViewport(1200, 800);
if (brokenWeb.openBytes(brokenAb, "broken.fig")) {
  console.error("a corrupted .fig was opened as if it were fine");
  process.exit(1);
}
console.log("zstd ok — read in Ranger, no host hook; a corrupted chunk is refused:", brokenWeb.error());

console.log("clipboard variants ok —", Object.keys(variants).join(", "), "· truncation caught · debug filled");
