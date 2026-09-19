#!/usr/bin/env node
/**
 * A stylesheet in the document, and an effect that is a shader.
 *
 *   npm run livebuild:fx        (needs the server on :8765)
 *
 * Two things that were missing together, and are one feature from where an
 * agent stands: a `.evg.json` could only say things INLINE — every node
 * carrying its own copy of the same six properties — and the one painter the
 * live page had was SVG, which has no answer for a surface effect.
 *
 * So this asks for both at once, the way the person asking would: a document
 * with a `css` block, a class that declares a starfield, and a page that
 * actually shows one. What is checked is the whole path — the sheet survives
 * a round trip without being inlined, the cascade reaches the display list as
 * an effect instance, the page notices and switches painters, and the picture
 * MOVES, because a starfield that renders once is a wallpaper.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const require_ = createRequire(import.meta.url);
const URL_ = process.env.EVG_LIVEBUILD_URL || "http://127.0.0.1:8765/";

let chromium;
try {
  ({ chromium } = require_("playwright-core"));
} catch {
  console.error("playwright-core is not installed");
  process.exit(2);
}
const chrome =
  process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
if (!chrome) {
  console.error("no Chrome on this machine");
  process.exit(2);
}

const agentBin = path.join(root, "lib/evg/bin/evg_agent.js");
if (!fs.existsSync(agentBin)) {
  spawnSync("bash", ["scripts/rgr-suite.sh", "./lib/evg/agent/evg_agent.rgr", "./lib/evg/bin", "evg_agent.js"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
  });
}

const session = path.join(os.tmpdir(), "evg-live-session");
const doc = path.join(session, "doc.evg.json");

// --- the ask, as an agent would write it -------------------------------------

const CSS = [
  ".sky { evg-surface-effect: starfield; evg-effect-on: always;",
  "       evg-fx-density: 1.6; evg-fx-nebula: 0.8; evg-fx-hue: 228; evg-fx-hue2: 305 }",
  ".card { border-radius: 22px }",
  "",
].join("\n");

await fetch(new URL("/seed?kind=dashboard", URL_));
const ops = path.join(session, "fx-ops.json");
fs.writeFileSync(
  ops,
  JSON.stringify({
    ops: [
      { op: "set-css", value: CSS },
      { op: "set-prop", at: "0", prop: "class-name", value: "sky" },
      { op: "set-prop", at: "0/2", prop: "class-name", value: "card" },
    ],
  }),
);
const applied = JSON.parse(
  spawnSync(process.execPath, [agentBin, "patch", doc, ops], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 })
    .stdout.trim(),
);
if (!applied.ok) throw new Error(`the ops were refused: ${JSON.stringify(applied.rejected || applied)}`);
console.log(`  ops         a stylesheet and two classes, applied in one batch`);

// The sheet is DATA, not something that got inlined into forty nodes. That is
// the whole point of putting it in the document: one place to change.
const written = JSON.parse(fs.readFileSync(doc, "utf8"));
if (!written.css) throw new Error("the document did not keep its stylesheet");
// Only the TREE, not the file: the sheet's own text says `evg-surface-effect`
// and is supposed to. What must not happen is the cascade being copied onto
// the nodes, which would make the sheet a one-time macro instead of a sheet.
const inlined = (el) =>
  Object.keys(el.props || {}).some((k) => k.startsWith("evg-")) ||
  (el.children || []).some(inlined);
if (inlined(written.root)) {
  throw new Error("the cascade was inlined into the nodes — the sheet is supposed to stay one place");
}
console.log("  document    the sheet round-trips, and the cascade is not copied into the tree");

// --- the cascade reaches the display list ------------------------------------

const framed = await (await fetch(new URL("/doc", URL_))).json();
const effects = (framed.list && framed.list.effects) || [];
if (effects.length !== 1) throw new Error(`the sheet's effect did not reach the list: ${JSON.stringify(effects)}`);
if (effects[0].kind !== "starfield") throw new Error(`wrong effect: ${effects[0].kind}`);
if (effects[0].p.density !== 1.6 || effects[0].p.hue !== 228) {
  throw new Error(`the parameters did not come along: ${JSON.stringify(effects[0].p)}`);
}
console.log(`  cascade     .sky → ${effects[0].kind} over ${effects[0].box.slice(2).join("×")}, with its parameters`);

// --- and the page draws it ---------------------------------------------------

const browser = await chromium.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const problems = [];
page.on("pageerror", (e) => problems.push(e.message));
await page.goto(URL_);
await page.waitForFunction(() => window.__painter, null, { timeout: 30000 });

const painter = await page.evaluate(() => window.__painter);
if (painter !== "webgl") throw new Error(`a document with a shader was painted with ${painter}`);
if ((await page.locator("#screen canvas").count()) !== 1) throw new Error("no canvas on the phone");
await page.waitForFunction(() => window.__glStats && window.__glStats.fxDrawn > 0, null, { timeout: 30000 });
const stats = await page.evaluate(() => window.__glStats);
console.log(`  painter     webgl, ${stats.drawn} commands and ${stats.fxDrawn} effect pass`);

// A starfield that renders once is a wallpaper. `always` means it runs off a
// clock, so two frames a moment apart must not be the same picture.
const shot = async () => (await page.locator("#screen").screenshot()).toString("base64");
const first = await shot();
await page.waitForTimeout(600);
const second = await shot();
if (first === second) throw new Error("the effect is not animating — two frames are identical");
console.log("  animated    two frames apart are different pictures");

// And a document with no effect goes back to the SVG painter, which is what
// every other screen here wants: cheaper, and its text is selectable.
await page.click("#chips .chip");
await page.waitForFunction(() => window.__painter === "svg", null, { timeout: 30000 });
if ((await page.locator("#screen svg").count()) !== 1) throw new Error("the SVG painter did not come back");
if ((await page.locator("#screen canvas").count()) !== 0) throw new Error("the canvas was left behind");
console.log("  back        a screen without effects is SVG again, and the canvas is gone");

await browser.close();
if (problems.length) throw new Error(problems.join("\n"));
console.log("ALL PASS — a stylesheet in the document, and an effect the page actually draws");
