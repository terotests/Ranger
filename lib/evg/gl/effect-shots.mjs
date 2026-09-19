/**
 * The effect presets, painted.
 *
 *   node lib/evg/gl/effect-shots.mjs [out.png] [--tile 440x280] [--only plasma]
 *
 * One picture of every preset in `effect-presets.css`, drawn through the real
 * painter with the values that file holds — read out of it rather than
 * repeated here, so a preset somebody changes changes its own picture and a
 * preset nobody can parse fails loudly instead of quietly drawing the default.
 *
 * The reading is `effect-presets.js` — deliberately not a CSS parser, and
 * shared with the gallery demo's background picker so there is one answer to
 * what that file says. The ENGINE's own parser reads it for real in
 * `fx-check.mjs`, which holds every preset to producing the effect it names.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MissingDomDeps, requireHostTool, findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";
import { parsePresets } from "./effect-presets.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Every preset block in `effect-presets.css`, read off disk. The parsing is
 *  `effect-presets.js`, which the gallery's background picker imports too —
 *  one answer to "what does that file say", in a module with no `fs` in it. */
export function readPresets(file = path.join(HERE, "effect-presets.css")) {
  return parsePresets(fs.readFileSync(file, "utf8"));
}

const OUT = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : path.join(HERE, "effect-presets.png");
const tileArg = process.argv.indexOf("--tile");
const [TW, TH] = tileArg > -1 && process.argv[tileArg + 1]
  ? process.argv[tileArg + 1].split("x").map(Number)
  : [440, 280];

const onlyAt = process.argv.indexOf("--only");
const only = onlyAt > -1 ? process.argv[onlyAt + 1] : null;
const presets = readPresets().filter((p) => !only || p.kind.includes(only) || p.name.includes(only));
if (presets.length === 0) {
  console.error("no preset blocks found in effect-presets.css" + (only ? ` matching ${only}` : ""));
  process.exit(3);
}

// Two to a row, with a gap, and the name under each.
const COLS = 2;
const GAP = 16;
const LABEL = 30;
const ROWS = Math.ceil(presets.length / COLS);
const W = COLS * TW + (COLS + 1) * GAP;
const H = ROWS * (TH + LABEL) + (ROWS + 1) * GAP;

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

/** Which layer each registered effect is, read out of the painter rather than
 *  listed here. Only one question is asked of it: a BACKDROP effect draws what
 *  is BEHIND it, so its tile needs something behind it — over a flat colour a
 *  lens is invisible by construction, because the refraction of one colour is
 *  that colour. A source effect gets a plain ground, which is what it wants. */
const LAYER = {};
for (const m of painter.matchAll(/name:\s*"([a-z-]+)",\s*\n\s*layer:\s*"([a-z]+)"/g)) LAYER[m[1]] = m[2];

const cmds = [{ k: 0, x: 0, y: 0, w: W, h: H, c: [10, 11, 18, 1] }];
const effects = [];
presets.forEach((p, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = GAP + col * (TW + GAP);
  const y = GAP + row * (TH + LABEL + GAP);
  // THE GROUND FIRST, AND THE EFFECT ON A RECTANGLE OF ITS OWN — which is how
  // a page does it, and the only arrangement that works for every layer. A
  // BACKDROP effect runs BEFORE the element's own background, so a preset
  // painted as one opaque rectangle with `efx` on it would have its drops
  // drawn and then covered by the very box that asked for them. Here the
  // colour is the ground, and the effect's own box is transparent — exactly
  // what `.fx-glass` does over the demo's sky.
  cmds.push({ k: 0, x, y, w: TW, h: TH, r: 14, c: p.background });
  if (LAYER[p.kind] === "backdrop") {
    // A page under the glass: a title bar and three lines of body, the shapes
    // whose edges a drop or a pane visibly bends.
    const bars = [[0.06, 0.18, 0.46, 0.075, [120, 142, 212, 1]],
      [0.06, 0.34, 0.80, 0.030, [78, 88, 132, 1]],
      [0.06, 0.44, 0.72, 0.030, [78, 88, 132, 1]],
      [0.06, 0.54, 0.55, 0.030, [78, 88, 132, 1]],
      [0.06, 0.72, 0.88, 0.012, [168, 178, 228, 1]]];
    for (const [bx, by, bw, bh, c] of bars) {
      cmds.push({ k: 0, x: x + TW * bx, y: y + TH * by, w: TW * bw, h: TH * bh, r: 3, c });
    }
  }
  cmds.push({ k: 0, x, y, w: TW, h: TH, r: 14, c: [0, 0, 0, 0], efx: p.name });
  effects.push({ id: p.name, kind: p.kind, on: p.trigger || "always", box: [x, y, TW, TH], r: 14, p: p.params, time: 3.2 });
  cmds.push({
    k: 3, x: x + 2, y: y + TH + 7, w: TW, h: 18,
    c: [150, 158, 196, 1], text: `.${p.name} — ${p.kind} — ${p.title}`, font: "Open Sans", size: 13,
  });
});

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
${painter}
try {
  const gl = document.getElementById("c").getContext("webgl2", { antialias: true, alpha: false });
  const doc = ${JSON.stringify({ width: W, height: H, cmds, effects })};
  renderDisplayList(gl, { list: { cmds: doc.cmds, effects: doc.effects }, width: doc.width, height: doc.height }, { dpr: 1 });
} catch (e) { window.__ERR__ = String(e && e.stack || e); }
window.__DONE__ = true;
</script></body>`;

let chromium;
try {
  ({ chromium } = requireHostTool("playwright-core"));
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const tab = await browser.newPage({ viewport: { width: W + 20, height: H + 20 } });
const tmp = path.join(HERE, ".effect-shots.html");
fs.writeFileSync(tmp, page);
await tab.goto(pathToFileURL(tmp).href);
await tab.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
const err = await tab.evaluate(() => window.__ERR__ || null);
if (err) { console.error("painter threw: " + err); process.exit(1); }
await tab.locator("#c").screenshot({ path: OUT });
await browser.close();
fs.rmSync(tmp, { force: true });
console.log(`${presets.length} presets → ${OUT}`);
for (const p of presets) console.log(`  .${p.name}  ${p.kind}`);
