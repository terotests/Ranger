/**
 * erazer/web/smoke.mjs — does the Erazer page bundle actually recognise a UI?
 *
 *   npm run erazer:web && npm run erazer:web:smoke
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

if (!fs.existsSync(path.join(DIST, "index.html")) ||
    !fs.existsSync(path.join(DIST, "erazer.js"))) {
  console.error(`no Erazer page in ${path.relative(ROOT, DIST)} — run: npm run erazer:web`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
if (!html.includes("erazer.js") || !html.includes("Erazer")) {
  console.error("index.html does not load the Erazer bundle");
  process.exit(1);
}
if (!html.includes('id="file"') || !html.includes('accept="image/*"')) {
  console.error("live page is missing a file input that accepts images");
  process.exit(1);
}
if (!html.includes("paste") || !html.includes("loadBlob")) {
  console.error("live page is missing paste / blob load");
  process.exit(1);
}
if (!html.includes("teachBtn") || !html.includes("Opeta valinta")) {
  console.error("live page is missing layout-net training UI");
  process.exit(1);
}

const bundle = fs.readFileSync(path.join(DIST, "erazer.js"), "utf8");
const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(bundle, sandbox);

const { Erazer, ErazerPaint, ErazerLayoutNet, ErazerLayoutBox } = sandbox;
if (typeof Erazer !== "function" || typeof ErazerPaint !== "function") {
  console.error("bundle did not publish Erazer / ErazerPaint");
  process.exit(1);
}
if (typeof ErazerLayoutNet !== "function" || typeof ErazerLayoutBox !== "function") {
  console.error("bundle did not publish ErazerLayoutNet / ErazerLayoutBox");
  process.exit(1);
}

const img = ErazerPaint.button();
const doc = Erazer.analyze(img);
const buttons = doc.root.roleCount("button");
if (buttons < 1) {
  console.error("sample button was not recognised:\n" + doc.outline);
  process.exit(1);
}
if (!String(doc.json).includes("erazer-button")) {
  console.error("EVG JSON did not carry erazer-button");
  process.exit(1);
}

const chips = Erazer.analyze(ErazerPaint.chipRow());
if (chips.root.roleCount("button") < 3) {
  console.error("chip row did not yield three buttons:\n" + chips.outline);
  process.exit(1);
}
const strip = Erazer.analyze(ErazerPaint.chipStrip());
if (strip.root.roleCount("button") < 3 || strip.root.roleCount("tab") > 0) {
  console.error("uneven chip strip was not three buttons:\n" + strip.outline);
  process.exit(1);
}
const sliders = Erazer.analyze(ErazerPaint.sliders());
if (sliders.root.roleCount("slider") < 3) {
  console.error("slider fixture did not yield three sliders:\n" + sliders.outline);
  process.exit(1);
}

const net = new ErazerLayoutNet();
const list = net.synthList(4, 16);
net.teach(list, "list", 5);
const pred = net.predict(list);
if (pred.type !== "list" || pred.confidence < 0.5) {
  console.error("layout net did not learn a vertical label list: " + pred.type + " " + pred.confidence);
  process.exit(1);
}

console.log("erazer web smoke ok — button, chip row, sliders, layout-net");
