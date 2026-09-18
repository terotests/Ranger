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

const bundle = fs.readFileSync(path.join(DIST, "erazer.js"), "utf8");
const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(bundle, sandbox);

const { Erazer, ErazerPaint } = sandbox;
if (typeof Erazer !== "function" || typeof ErazerPaint !== "function") {
  console.error("bundle did not publish Erazer / ErazerPaint");
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

console.log("erazer web smoke ok — button recognised, json has erazer-button");
