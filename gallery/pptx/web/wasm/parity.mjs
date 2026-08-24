/**
 * Do the two engines draw the same picture, and which one is faster?
 *
 *   npm run pptx:wasm:parity
 *
 * WHY BOTH QUESTIONS IN ONE TOOL. They are the same question asked twice. A
 * WebAssembly build that is faster because it drops half the shapes is not
 * faster, and a build that agrees to the unit but takes twice as long is not
 * worth the download. So this loads BOTH engines in one process, walks every
 * fixture and every slide, compares the frames field by field, and only then
 * times them — on the deck the timing is actually about.
 *
 * WHAT MAKES THE COMPARISON FAIR. One source file, `pptx_web.rgr`, compiled
 * two ways. One page, `standalone.mjs`, running over either. One display-list
 * contract, walked by the same `decodeScene`. The only difference left is the
 * backend, which is the thing being measured.
 *
 * WHY THE FRAME IS WARMED. The first frame after a slide change reports
 * ESTIMATED text boxes and later frames report measured ones — a known finding
 * about the editor, not about either backend. Comparing a cold frame with a
 * warm one says the engines disagree when they do not.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeScene } from "../host/pptx-host.mjs";
import { chartDeck } from "../../tools/chart_deck.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const JS_BUNDLE = path.join(ROOT, "gallery/pptx/web/standalone/dist/pptx_web.js");
const WASM_GLUE = path.join(HERE, "dist/pptx_wasm.mjs");

for (const [f, how] of [[JS_BUNDLE, "npm run pptx:web"], [WASM_GLUE, "npm run pptx:wasm"]]) {
  if (!fs.existsSync(f)) { console.error(`no build at ${f} — run: ${how}`); process.exit(1); }
}

const FONTS = ROOT + "/gallery/pdf_writer/assets/fonts";
const PRESETS = fs.readFileSync(ROOT + "/gallery/office/geom/assets/presets.txt", "utf8");
const faces = ["Regular", "Bold", "Italic"].map((f) =>
  fs.readFileSync(`${FONTS}/Open_Sans/OpenSans-${f}.ttf`));

// ---- the WebAssembly engine -----------------------------------------------
// FIRST, and this order matters. Emscripten decides at load time whether it is
// in a browser or in Node, and it decides by looking at `globalThis.window`.
// Evaluating the JavaScript bundle below defines globals of its own; anything
// that leaves a `window` behind would make the WASM glue take the browser
// path, `fetch` a file:// URL, fail, and abort with an EMPTY message — which
// reads as a broken engine when it is a broken environment guess. Loading the
// module while the global object is still clean removes the question.
//
// From dist/, not from here: `wasm-host.mjs` imports `./pptx_wasm.mjs`, which
// only exists once the build has put the two of them side by side.
const { installPptxWeb } = await import("./dist/wasm-host.mjs");
const WasmWeb = await installPptxWeb();

// ---- the JavaScript engine ------------------------------------------------
const { PptxWeb: JsWeb } =
  (0, eval)(fs.readFileSync(JS_BUNDLE, "utf8") + "; ({ PptxWeb })");
const asRanger = (b) => {
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  ab._view = new DataView(ab);
  return ab;
};

function editor(Klass, toBytes) {
  const web = new Klass();
  web.start(960, 540);
  web.loadPresets(PRESETS);
  for (const f of faces) web.addFont("Open Sans", toBytes(f));
  web.addFont("Calibri", toBytes(faces[0]));
  return web;
}
const js = () => editor(JsWeb, asRanger);
const wa = () => editor(WasmWeb, (b) => new Uint8Array(b));

// The two writers put their fields in their own order, so a command is
// compared by its VALUES, sorted by key.
const canonical = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));

const decks = fs.readdirSync(ROOT + "/gallery/pptx/fixtures")
  .filter((f) => f.endsWith(".pptx")).sort()
  .map((f) => [f, fs.readFileSync(ROOT + "/gallery/pptx/fixtures/" + f)]);
decks.push(["the chart deck", Buffer.from(chartDeck())]);

let bad = 0, commands = 0, slides = 0;
for (const [name, raw] of decks) {
  const a = js(), b = wa();
  const openedA = a.openDeck(asRanger(raw), "d.pptx");
  const openedB = b.openDeck(new Uint8Array(raw), "d.pptx");
  if (openedA !== openedB) {
    console.log(`FAIL  ${name}: js opened=${openedA}, wasm opened=${openedB} (${b.note})`);
    bad++;
    continue;
  }
  if (!openedA) continue;
  if (a.slideCount() !== b.slideCount()) {
    console.log(`FAIL  ${name}: ${a.slideCount()} slides in js, ${b.slideCount()} in wasm`);
    bad++;
    continue;
  }
  for (let sl = 0; sl < a.slideCount(); sl++) {
    a.gotoSlide(sl); b.gotoSlide(sl);
    for (let i = 0; i < 3; i++) { a.sceneBinary(); b.sceneBinary(); }   // settle
    const ca = decodeScene(a.sceneBinary()).list.cmds;
    const cb = decodeScene(b.sceneBinary()).list.cmds;
    slides++;
    if (ca.length !== cb.length) {
      console.log(`FAIL  ${name} slide ${sl + 1}: ${ca.length} commands in js, ${cb.length} in wasm`);
      bad++;
      continue;
    }
    for (let i = 0; i < ca.length; i++) {
      const x = canonical(ca[i]), y = canonical(cb[i]);
      commands++;
      if (x !== y) {
        if (bad < 5) {
          console.log(`FAIL  ${name} slide ${sl + 1} cmd ${i}`);
          console.log(`        js   ${x.slice(0, 240)}`);
          console.log(`        wasm ${y.slice(0, 240)}`);
        }
        bad++;
      }
    }
  }
}

// ---- and the cost ---------------------------------------------------------
// Not asserted — a loaded machine is slow without anything being wrong — but
// printed, because this is the number the whole build was made to find out.
const ms = (fn, n) => {
  const t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  return Number(process.hrtime.bigint() - t) / 1e6 / n;
};
console.log("");
for (const [name, raw] of [["the chart deck", Buffer.from(chartDeck())],
                           ["20-business-deck.pptx", fs.readFileSync(ROOT + "/gallery/pptx/fixtures/20-business-deck.pptx")]]) {
  const a = js(), b = wa();
  a.openDeck(asRanger(raw), "d.pptx");
  b.openDeck(new Uint8Array(raw), "d.pptx");
  const at = Math.min(1, a.slideCount() - 1);
  a.gotoSlide(at); b.gotoSlide(at);
  for (let i = 0; i < 8; i++) { decodeScene(a.sceneBinary()); decodeScene(b.sceneBinary()); }
  const n = decodeScene(a.sceneBinary()).list.cmds.length;
  // Split, because the two halves answer different questions. `sceneBinary()`
  // is the ENGINE — laying the slide out and filling the arrays — and is the
  // only part a backend change can move. `decodeScene` is the page walking
  // those arrays into objects, and is the same JavaScript either way; it is
  // reported so the engine number is not read as the whole frame.
  const eJs = ms(() => a.sceneBinary(), 10);
  const eWa = ms(() => b.sceneBinary(), 10);
  const dJs = ms(() => decodeScene(a.sceneBinary()), 10) - eJs;
  const dWa = ms(() => decodeScene(b.sceneBinary()), 10) - eWa;
  const faster = eJs / eWa;
  console.log(`${name} (${n} commands)`);
  console.log(`    engine   js ${eJs.toFixed(1)} ms   wasm ${eWa.toFixed(1)} ms   ` +
    (faster >= 1 ? `wasm ${faster.toFixed(2)}x faster` : `wasm ${(1 / faster).toFixed(2)}x slower`));
  console.log(`    decode   js ${dJs.toFixed(1)} ms   wasm ${dWa.toFixed(1)} ms   (the same JavaScript in both)`);
}

// The download, which is the other half of "is it worth it".
const { gzipSync } = await import("node:zlib");
const gzip = (f) => gzipSync(fs.readFileSync(f), { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(0) + " KB";
const wasmGz = gzip(path.join(HERE, "dist/pptx_wasm.wasm")) + gzip(WASM_GLUE);
const jsGz = gzip(JS_BUNDLE);
console.log(`\nengine download   js ${kb(jsGz)} gzipped   wasm ${kb(wasmGz)} gzipped   (${(wasmGz / jsGz).toFixed(1)}x)`);

console.log(`\n${decks.length} decks, ${slides} slides, ${commands} commands compared field for field`);
if (bad > 0) { console.log(`${bad} DIFFER`); process.exit(1); }
console.log("ALL PASS  the WebAssembly engine and the JavaScript one draw the same picture");
