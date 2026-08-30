/**
 * Do the two ways of asking for a frame say the same thing?
 *
 *   node gallery/pptx/web/host/scene-binary-check.mjs
 *
 * The engine publishes every frame twice: as JSON from `scene()`, and as three
 * `Int32Array`s from `sceneBinary()` that `decodeScene` walks. The JSON is the
 * older path and the slower one — 1.5 MB of text per frame, five sixths of the
 * budget spent handing over a picture that took a sixth to compute — but it is
 * also the one nothing can silently misread, because every field arrives with
 * its own name attached. The binary is the fast path and it is POSITIONAL, so
 * a decoder that disagrees with the writer about the shape of a record reads
 * every field from the wrong place and cannot tell.
 *
 * WHY THIS FILE EXISTS. That is not hypothetical. The record grew from 24
 * fields to 26 when a rotation needed an origin to turn about; this decoder
 * went on multiplying by 24; and the frame it produced was nonsense from the
 * second command onwards. Nothing said so. The first thing that noticed was
 * `new Array(eCount)` on some later slide being handed a ring count that was
 * really somebody's colour — "RangeError: Invalid array length" — in the
 * WebAssembly parity job, which needs an Emscripten toolchain, runs late, and
 * pointed a hundred fields downstream of the mistake.
 *
 * So: no browser, no toolchain, one second, and it names the field.
 *
 * The two are compared for EVERY slide of every fixture, not just the first —
 * a stride bug shows up in command 1 and is gone by the time anybody looks at
 * a picture, and the first command of a slide is the background, which starts
 * at offset zero and is therefore the one command a wrong stride gets right.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeScene, sceneStride, SCENE_FIELDS_READ } from "./pptx-host.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const BUNDLE = path.join(ROOT, "gallery/pptx/web/standalone/dist/pptx_web.js");
const FIXTURES = path.join(ROOT, "gallery/pptx/fixtures");

if (!fs.existsSync(BUNDLE)) {
  console.error("missing " + path.relative(ROOT, BUNDLE) + " — run `npm run pptx:web` first");
  process.exit(3);
}

const { PptxWeb } = (0, eval)(fs.readFileSync(BUNDLE, "utf8") + "; ({ PptxWeb })");

// The Ranger runtime wants an ArrayBuffer carrying its own DataView.
const asRanger = (b) => {
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  ab._view = new DataView(ab);
  return ab;
};

// The bundle is built for a browser, so what a page hands it, this hands it
// too: the preset geometry and the faces the layout measures with. Without
// them the engine reaches for `require` and dies inside the first frame — and
// without the fonts a text box is ESTIMATED rather than measured, which is a
// difference the two paths would then both report and this would not catch.
const FONTS = path.join(ROOT, "gallery/pdf_writer/assets/fonts");
const PRESETS = fs.readFileSync(
  path.join(ROOT, "gallery/office/geom/assets/presets.txt"), "utf8");
const FACES = ["Regular", "Bold", "Italic"].map((f) =>
  fs.readFileSync(path.join(FONTS, "Open_Sans", `OpenSans-${f}.ttf`)));

function engine() {
  const web = new PptxWeb();
  web.start(960, 540);
  web.loadPresets(PRESETS);
  for (const f of FACES) web.addFont("Open Sans", asRanger(f));
  web.addFont("Calibri", asRanger(FACES[0]));
  return web;
}

// Field by field, and the field that differs is what gets printed. Comparing
// two JSON strings would say "these frames differ", which is exactly what the
// RangeError already said.
function firstDifference(a, b) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  for (const k of keys) {
    const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
    if (x !== y) return `${k}: json=${x} binary=${y}`;
  }
  return null;
}

const decks = fs.readdirSync(FIXTURES).filter((f) => f.endsWith(".pptx")).sort();
let checkedSlides = 0, checkedCommands = 0, bad = 0;

// The empty editor first: it draws before any deck is open, and it is the one
// frame every page renders whether or not a file was ever loaded.
{
  const web = engine();
  const bin = web.sceneBinary();
  console.log("record shape: " + sceneStride(bin) + " ints per command, " +
    "of which this decoder reads " + SCENE_FIELDS_READ);
}

for (const name of decks) {
  const raw = fs.readFileSync(path.join(FIXTURES, name));
  const web = engine();
  if (!web.openDeck(asRanger(raw), name)) {
    console.log("SKIP  " + name + ": the engine did not open it");
    continue;
  }
  for (let sl = 0; sl < web.slideCount(); sl++) {
    web.gotoSlide(sl);
    // Warm it first. The frame right after a slide change reports ESTIMATED
    // text boxes and later frames report MEASURED ones — a known property of
    // the editor, not of either path — so a cold JSON frame against a warm
    // binary one reports 304 differences that are all the same difference, and
    // none of them are about the record layout this is here to check.
    for (let i = 0; i < 3; i++) web.sceneBinary();
    const viaJson = JSON.parse(web.scene());
    const viaBinary = decodeScene(web.sceneBinary());
    checkedSlides++;

    const ja = viaJson.list.cmds, jb = viaBinary.list.cmds;
    if (ja.length !== jb.length) {
      console.log(`FAIL  ${name} slide ${sl + 1}: ${ja.length} commands in the ` +
        `JSON, ${jb.length} in the binary`);
      bad++;
      continue;
    }
    if (viaJson.width !== viaBinary.width || viaJson.height !== viaBinary.height) {
      console.log(`FAIL  ${name} slide ${sl + 1}: ${viaJson.width}x${viaJson.height} ` +
        `in the JSON, ${viaBinary.width}x${viaBinary.height} in the binary`);
      bad++;
    }
    for (let i = 0; i < ja.length; i++) {
      checkedCommands++;
      const diff = firstDifference(ja[i], jb[i]);
      if (diff) {
        if (bad < 5) console.log(`FAIL  ${name} slide ${sl + 1} cmd ${i} — ${diff}`);
        bad++;
      }
    }
  }
}

// `passed=…/failed=…` then `ALL PASS`, which is what the gallery suite runner
// greps for. A checker whose result nothing can read is a checker that reports
// green by not being looked at.
console.log(`${decks.length} decks, ${checkedSlides} slides, ${checkedCommands} commands`);
console.log(`passed=${checkedCommands - bad} failed=${bad}`);
if (bad > 0) {
  console.log(`FAILURES — ${bad} command(s) differ between the two paths`);
  process.exit(1);
}
console.log("ALL PASS — the JSON and the binary describe the same frame");
