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
if (!html.includes("layout-lab.js") || !html.includes("buildSetBtn") || !html.includes("trainGpuBtn")) {
  console.error("live page is missing HTML test-set / WebGPU train buttons");
  process.exit(1);
}
if (!fs.existsSync(path.join(DIST, "layout-lab.js"))) {
  console.error("layout-lab.js was not copied to dist");
  process.exit(1);
}
const components = fs.readFileSync(path.join(DIST, "components.html"), "utf8");
if (!components.includes('data-concept="form"') || !components.includes('data-role="checkbox"')) {
  console.error("components.html is missing layout ground-truth annotations");
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

const labJs = fs.readFileSync(path.join(DIST, "layout-lab.js"), "utf8");
vm.runInContext(labJs, sandbox);
const { ErazerLayoutLab } = sandbox;
if (!ErazerLayoutLab || ErazerLayoutLab.MIN_SAMPLES < 2) {
  console.error("layout-lab did not publish ErazerLayoutLab");
  process.exit(1);
}
const hits = ErazerLayoutLab.matchBoxes(
  [{ type: "label", x: 10, y: 10, w: 40, h: 12 }, { type: "label", x: 400, y: 10, w: 40, h: 12 }],
  { x: 0, y: 0, w: 80, h: 40 },
  4
);
if (hits.length !== 1) {
  console.error("matchBoxes should keep the in-group primitive, got " + hits.length);
  process.exit(1);
}
const scoped = ErazerLayoutLab.scopeCss(":root { --x: 1 } body { margin: 0 } .card { color: red }", "#captureHost");
if (!scoped.includes("#captureHost {") || !scoped.includes("#captureHost .card") || scoped.includes(":root")) {
  console.error("scopeCss did not prefix fixture selectors:\n" + scoped);
  process.exit(1);
}
const dump = ErazerLayoutLab.packDump(
  ErazerLayoutLab.CLASSES,
  net.w1, net.b1, net.w2, net.b2
);
const fresh = new ErazerLayoutNet();
if (!fresh.loadWeights(dump)) {
  console.error("Ranger loadWeights rejected layout-lab packDump");
  process.exit(1);
}
const again = fresh.predict(list);
if (again.type !== "list") {
  console.error("reloaded dump did not keep the list class: " + again.type);
  process.exit(1);
}

// The lab's training helpers, as far as they go without a DOM. The rest —
// IndexedDB, the fixtures, the capture — is `lab-check.mjs` in a browser.
const seeds = ErazerLayoutLab.seedSamples();
const seedLabels = [...new Set(seeds.map((s) => s.label))].sort();
if (JSON.stringify(seedLabels) !==
    JSON.stringify(["card", "form", "grid", "list", "nav", "property_row", "toolbar"])) {
  console.error("seedSamples does not cover the seeded classes: " + seedLabels.join(","));
  process.exit(1);
}

const parsed = ErazerLayoutLab.parseDump(ErazerLayoutLab.currentDump());
if (!parsed || parsed.inSize !== 40 || parsed.hidSize !== 32 || parsed.w1.length !== 40 * 32) {
  console.error("parseDump did not read the live weights back");
  process.exit(1);
}
if (ErazerLayoutLab.parseDump("v1 40 32 8 a,b w,x") !== null) {
  console.error("parseDump accepted a truncated dump");
  process.exit(1);
}

const evened = ErazerLayoutLab.balance(
  { x: [[1], [2], [3], [4], [5]], y: [0, 0, 0, 0, 1] }, 8
);
const evenedOnes = evened.y.filter((v) => v === 1).length;
if (evenedOnes < 3) {
  console.error("balance left the minority class at " + evenedOnes);
  process.exit(1);
}

// The gate the training run is decided by. The shipped model has to name every
// archetype; a freshly initialised one must not, or the gate proves nothing.
const cases = ErazerLayoutLab.evalCases([]);
const live = ErazerLayoutLab.scoreParts(ErazerLayoutLab.currentDump(), cases);
if (live.core < 1) {
  console.error("the seeded model misses an archetype: core=" + live.core);
  process.exit(1);
}
const cold = ErazerLayoutLab.scoreParts(new ErazerLayoutNet().dumpWeights(), cases);
if (!(cold.core < live.core)) {
  console.error("an untrained net scored the archetypes as well as the seeded one");
  process.exit(1);
}

// Warm start: fine-tuning on a handful of samples must not cost the archetypes.
const fixtures = [
  { label: "list", boxes: net.synthList(5, 16) },
  { label: "toolbar", boxes: net.synthToolbar(3, 16) },
  { label: "toolbar", boxes: net.synthToolbar(5, 16) },
  { label: "toolbar", boxes: net.synthToolbar(6, 16) }
];
const tuned = ErazerLayoutLab.trainCPU(fixtures, 6);
const after = ErazerLayoutLab.scoreParts(tuned.dump, cases);
if (after.core < live.core) {
  console.error("trainCPU lost an archetype: " + live.core + " -> " + after.core);
  process.exit(1);
}

console.log("erazer web smoke ok — button, chip row, sliders, layout-net, html-set, train gate");
