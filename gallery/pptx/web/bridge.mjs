/**
 * Does the binary scene bridge describe the SAME picture as the JSON one?
 *
 * WHY THIS TEST EXISTS. The page used to hand a frame over as JSON — the
 * editor built a 1.47 MB string and the page parsed it back. Measured on the
 * six-slide chart deck, one slide, 10 084 commands:
 *
 *     buildFrame      12 ms     the layout — the actual work
 *     toJson          62 ms     turning it into text
 *     JSON.parse      19 ms     turning that text back into objects
 *
 * Five sixths of every frame spent handing over a picture that took a sixth to
 * compute. `sceneBinary()` answers the same frame as typed arrays instead —
 * 8 ms to fill, and `decodeScene` walks them in place of the parse.
 *
 * That is only worth having if the two are the same picture, and "looks right
 * in the browser" is not evidence: the encoder writes coordinates as
 * hundredths of a unit in an `Int32Array`, packs colour into one integer and
 * pools every string, and any of those three can be subtly wrong in a way that
 * moves a shape a fraction of a pixel or picks a neighbouring shade. So this
 * walks every fixture, every slide, and compares the two frames command by
 * command and field by field.
 *
 * WHY FIXED POINT IS NOT A LOSS. `toJson` wrote two decimals and no more, so a
 * coordinate divided back by 100 is exactly the number the JSON carried. That
 * is the claim this test checks rather than assumes.
 *
 * WHY THE FRAME IS WARMED FIRST. The first frame after a slide change reports
 * ESTIMATED text boxes and later frames report measured ones — a separate,
 * still-open finding about the editor, not about the bridge. Comparing a cold
 * frame with a warm one compares two different pictures and says the bridge is
 * broken when it is not, so both sides are taken from a settled frame.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeScene } from "./host/pptx-host.mjs";
import { chartDeck } from "../tools/chart_deck.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const BUNDLE = path.join(HERE, "standalone/dist/pptx_web.js");

if (!fs.existsSync(BUNDLE)) {
  console.error("no bundle at " + BUNDLE + " — run `npm run pptx:web` first");
  process.exit(1);
}
const { PptxWeb } = (0, eval)(fs.readFileSync(BUNDLE, "utf8") + "; ({ PptxWeb })");

/** Node bytes as the ArrayBuffer-with-a-view the compiled code expects. */
const asRanger = (b) => {
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  ab._view = new DataView(ab);
  return ab;
};

const FONTS = ROOT + "/gallery/pdf_writer/assets/fonts";
function editor() {
  const web = new PptxWeb();
  web.start(960, 540);
  web.loadPresets(fs.readFileSync(ROOT + "/gallery/office/geom/assets/presets.txt", "utf8"));
  for (const f of ["Regular", "Bold", "Italic"]) {
    web.addFont("Open Sans", asRanger(fs.readFileSync(`${FONTS}/Open_Sans/OpenSans-${f}.ttf`)));
  }
  web.addFont("Calibri", asRanger(fs.readFileSync(`${FONTS}/Open_Sans/OpenSans-Regular.ttf`)));
  return web;
}

// The two writers emit their fields in their own order, so a command is
// compared by its VALUES — sorted by key — and not by its text.
const canonical = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));

const decks = fs.readdirSync(ROOT + "/gallery/pptx/fixtures")
  .filter((f) => f.endsWith(".pptx")).sort()
  .map((f) => ROOT + "/gallery/pptx/fixtures/" + f);

let bad = 0, commands = 0, slides = 0, opened = 0;
for (const deck of decks) {
  const web = editor();
  if (!web.openDeck(asRanger(fs.readFileSync(deck)), "d.pptx")) {
    console.log(`FAIL  ${path.basename(deck)} did not open: ${web.note}`);
    bad++;
    continue;
  }
  opened++;
  for (let sl = 0; sl < web.slideCount(); sl++) {
    web.gotoSlide(sl);
    web.scene(); web.scene(); web.scene();   // settle the text measurement
    const a = JSON.parse(web.scene()).list.cmds;
    const b = decodeScene(web.sceneBinary()).list.cmds;
    slides++;
    if (a.length !== b.length) {
      console.log(`FAIL  ${path.basename(deck)} slide ${sl + 1}: ${a.length} vs ${b.length} commands`);
      bad++;
      continue;
    }
    for (let i = 0; i < a.length; i++) {
      const ja = canonical(a[i]), jb = canonical(b[i]);
      commands++;
      if (ja !== jb) {
        if (bad < 5) {
          console.log(`FAIL  ${path.basename(deck)} slide ${sl + 1} cmd ${i}`);
          console.log(`        json   ${ja.slice(0, 240)}`);
          console.log(`        binary ${jb.slice(0, 240)}`);
        }
        bad++;
      }
    }
  }
}

/**
 * The chart deck, which is the deck this whole change exists for.
 *
 * The fixtures are hand-written probes of one OOXML feature each — a few
 * hundred commands, where the fixed cost of a call dominates and the bridge
 * looks like it barely matters. A chart slide is 10 000 commands, and that is
 * where the JSON hand-over cost five sixths of the frame. It is built rather
 * than checked in — see `tools/chart_deck.mjs` for why.
 */
let chart = null;
try {
  chart = chartDeck();
} catch (err) {
  console.log("note: the chart preset did not build (" + err.message + ") — timing falls back to a fixture");
}

if (chart) {
  const web = editor();
  if (!web.openDeck(asRanger(Buffer.from(chart)), "chart.pptx")) {
    console.log("FAIL  the chart deck did not open: " + web.note);
    bad++;
  } else {
    for (let sl = 0; sl < web.slideCount(); sl++) {
      web.gotoSlide(sl);
      web.scene(); web.scene(); web.scene();
      const a = JSON.parse(web.scene()).list.cmds;
      const b = decodeScene(web.sceneBinary()).list.cmds;
      slides++;
      if (a.length !== b.length) {
        console.log(`FAIL  chart deck slide ${sl + 1}: ${a.length} vs ${b.length} commands`);
        bad++;
        continue;
      }
      for (let i = 0; i < a.length; i++) {
        const ja = canonical(a[i]), jb = canonical(b[i]);
        commands++;
        if (ja !== jb) {
          if (bad < 5) {
            console.log(`FAIL  chart deck slide ${sl + 1} cmd ${i}`);
            console.log(`        json   ${ja.slice(0, 240)}`);
            console.log(`        binary ${jb.slice(0, 240)}`);
          }
          bad++;
        }
      }
    }
  }
}

// And the cost. Not asserted: a machine under load can be slow without
// anything being wrong. Printed, so a regression is visible.
const ms = (fn, n) => { const t = process.hrtime.bigint(); for (let i = 0; i < n; i++) fn(); return Number(process.hrtime.bigint() - t) / 1e6 / n; };
const timed = [];
if (chart) timed.push(["the chart deck", asRanger(Buffer.from(chart))]);
const biggest = decks.map((d) => [fs.statSync(d).size, d]).sort((x, y) => y[0] - x[0])[0][1];
timed.push([path.basename(biggest), asRanger(fs.readFileSync(biggest))]);
console.log("");
for (const [name, bytes] of timed) {
  const web = editor();
  web.openDeck(bytes, "d.pptx");
  web.gotoSlide(Math.min(1, web.slideCount() - 1));
  for (let i = 0; i < 5; i++) { web.scene(); web.sceneBinary(); }
  const n = decodeScene(web.sceneBinary()).list.cmds.length;
  const json = ms(() => JSON.parse(web.scene()), 10);
  const binary = ms(() => decodeScene(web.sceneBinary()), 10);
  console.log(`${name} (${n} commands)  scene+parse ${json.toFixed(1)} ms   sceneBinary+decode ${binary.toFixed(1)} ms   (${(json / binary).toFixed(1)}x)`);
}

console.log(`\n${opened} decks, ${slides} slides, ${commands} commands compared field for field`);
if (bad > 0) {
  console.log(`${bad} DIFFER`);
  process.exit(1);
}
console.log("ALL PASS  the binary bridge and the JSON one describe the same picture");
