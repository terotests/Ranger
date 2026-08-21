#!/usr/bin/env node
/**
 * PPTX feature harness
 *
 * Loads every fixture in harness/manifest.json through PptxApp
 * (parse → resolve → display list / EVG) and checks declarative expectations.
 *
 *   npm run pptx:harness
 *   node gallery/pptx/harness/run.mjs [--fixture 06-text-runs.pptx] [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const PPTX = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function argVal(name, def) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return def;
}
function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

const ONLY = argVal("--fixture", null);
const AS_JSON = hasFlag("--json");

const modPath = path.join(PPTX, "bin/pptx_app_module.cjs");
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run pptx:module");
  process.exit(1);
}

const { PptxApp } = require(modPath);
const fontDir = path.join(ROOT, "gallery/pdf_writer/assets/fonts");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));

function walkShapes(shapes, visit) {
  for (const s of shapes || []) {
    visit(s);
    if (s.kind === "group" && s._children) {
      walkShapes(s._children, visit);
    }
  }
}

function collect(info) {
  const texts = [];
  const fills = [];
  const presets = [];
  let pictures = 0;
  let groups = 0;
  let groupChildren = 0;
  let runs = 0;
  let paragraphs = 0;
  let shapesTotal = 0;
  let unresolvedSchemeFills = 0;
  let maxRotation = 0;
  let imagePart = "";
  let imageBytes = 0;
  let minDl = Infinity;
  let minEvg = Infinity;

  for (const slide of info.slide || []) {
    shapesTotal += slide.shapeCount || 0;
    minDl = Math.min(minDl, slide.displayListCmds || 0);
    minEvg = Math.min(minEvg, slide.evgChildren || 0);
    for (const s of slide.shapes || []) {
      const inherited = s.inherited === true || s.inherited === "true";
      if (s.text && !inherited) texts.push(s.text);
      if (s.fill) fills.push(s.fill.toUpperCase());
      if (s.preset && !inherited) presets.push(s.preset);
      if (s.kind === "picture" && !inherited) {
        pictures += 1;
        imagePart = s.imagePart || imagePart;
        imageBytes = Math.max(imageBytes, s.imageBytes || 0);
      }
      if (s.kind === "group" && !inherited) {
        groups += 1;
        groupChildren = Math.max(groupChildren, s.children || 0);
      }
      if (!inherited && typeof s.runs === "number") runs += s.runs;
      if (!inherited && typeof s.paragraphs === "number") paragraphs = Math.max(paragraphs, s.paragraphs);
      // A fill can name a theme slot and still be resolved: the editor keeps
      // the slot so re-theming can find it again. Unresolved means no colour.
      const namesScheme = s.fillScheme === true || s.fillScheme === "true";
      if (namesScheme && !s.fill) unresolvedSchemeFills += 1;
      if (typeof s.rotation === "number") maxRotation = Math.max(maxRotation, Math.abs(s.rotation));
    }
  }
  if (minDl === Infinity) minDl = 0;
  if (minEvg === Infinity) minEvg = 0;
  return {
    texts,
    fills,
    presets,
    pictures,
    groups,
    groupChildren,
    runs,
    paragraphs,
    shapesTotal,
    unresolvedSchemeFills,
    maxRotation,
    imagePart,
    imageBytes,
    minDl,
    minEvg,
  };
}

function inRange(v, range) {
  return v >= range[0] && v <= range[1];
}

function checkFixture(entry, info) {
  const exp = entry.expect || {};
  const c = collect(info);
  const fails = [];

  const pass = (name, ok, detail = "") => {
    if (!ok) fails.push(detail ? `${name}: ${detail}` : name);
  };

  if (exp.slides != null) pass("slides", info.slides === exp.slides, `got ${info.slides}`);
  if (exp.slideWidthPt) pass("slideWidthPt", inRange(info.slideWidth, exp.slideWidthPt), `got ${info.slideWidth}`);
  if (exp.slideHeightPt) pass("slideHeightPt", inRange(info.slideHeight, exp.slideHeightPt), `got ${info.slideHeight}`);
  if (exp.themeAccent1) pass("themeAccent1", (info.theme?.accent1 || "").toUpperCase() === exp.themeAccent1.toUpperCase());

  const first = (info.slide && info.slide[0]) || {};
  if (exp.minShapes != null) pass("minShapes", (first.shapeCount || 0) >= exp.minShapes, `got ${first.shapeCount}`);
  if (exp.minShapesTotal != null) pass("minShapesTotal", c.shapesTotal >= exp.minShapesTotal, `got ${c.shapesTotal}`);
  if (exp.minDisplayListCmds != null) {
    const dl = exp.slides === 1 ? first.displayListCmds || 0 : c.minDl;
    // For multi-slide kitchen, require at least one slide meeting the bar
    const okDl =
      exp.slides > 1
        ? (info.slide || []).some((s) => (s.displayListCmds || 0) >= exp.minDisplayListCmds)
        : (first.displayListCmds || 0) >= exp.minDisplayListCmds;
    pass("minDisplayListCmds", okDl, `got ${first.displayListCmds}`);
  }
  if (exp.minEvgChildren != null) {
    pass("minEvgChildren", (first.evgChildren || 0) >= exp.minEvgChildren, `got ${first.evgChildren}`);
  }
  if (exp.textContains) {
    const blob = c.texts.join("\n");
    for (const t of exp.textContains) {
      pass(`textContains:${t}`, blob.includes(t));
    }
  }
  if (exp.fills) {
    for (const f of exp.fills) {
      pass(`fill:${f}`, c.fills.includes(f.toUpperCase()));
    }
  }
  if (exp.presets) {
    for (const p of exp.presets) {
      pass(`preset:${p}`, c.presets.includes(p));
    }
  }
  if (exp.minPictures != null) pass("minPictures", c.pictures >= exp.minPictures, `got ${c.pictures}`);
  if (exp.minGroups != null) pass("minGroups", c.groups >= exp.minGroups, `got ${c.groups}`);
  if (exp.minGroupChildren != null) {
    pass("minGroupChildren", c.groupChildren >= exp.minGroupChildren, `got ${c.groupChildren}`);
  }
  if (exp.minRuns != null) pass("minRuns", c.runs >= exp.minRuns, `got ${c.runs}`);
  if (exp.minParagraphs != null) pass("minParagraphs", c.paragraphs >= exp.minParagraphs, `got ${c.paragraphs}`);
  if (exp.minRotationDeg != null) {
    pass("minRotationDeg", c.maxRotation >= exp.minRotationDeg, `got ${c.maxRotation}`);
  }
  if (exp.imagePartContains) {
    pass("imagePartContains", c.imagePart.includes(exp.imagePartContains), c.imagePart);
  }
  if (exp.minImageBytes != null) pass("minImageBytes", c.imageBytes >= exp.minImageBytes, `got ${c.imageBytes}`);
  if (exp.noUnresolvedSchemeFills) {
    pass("noUnresolvedSchemeFills", c.unresolvedSchemeFills === 0, `got ${c.unresolvedSchemeFills}`);
  }

  return fails;
}

const app = new PptxApp();
app.init(fontDir);

const fixturesDir = path.join(PPTX, "fixtures");
const results = [];
let failed = 0;
const featureHits = Object.fromEntries((manifest.features || []).map((f) => [f, { total: 0, pass: 0 }]));

for (const entry of manifest.fixtures) {
  if (ONLY && entry.file !== ONLY) continue;
  const full = path.join(fixturesDir, entry.file);
  const row = { file: entry.file, title: entry.title, features: entry.features || [], ok: false, fails: [] };
  if (!fs.existsSync(full)) {
    row.fails = ["fixture missing on disk"];
    failed += 1;
    results.push(row);
    continue;
  }
  const okLoad = app.load(full);
  if (!okLoad) {
    row.fails = ["failed to open/parse"];
    failed += 1;
    results.push(row);
    continue;
  }
  let info;
  try {
    info = JSON.parse(app.inspectJson());
  } catch (e) {
    row.fails = ["inspectJson parse error: " + e];
    failed += 1;
    results.push(row);
    continue;
  }
  row.fails = checkFixture(entry, info);
  row.ok = row.fails.length === 0;
  row.inspect = {
    slides: info.slides,
    slideWidth: info.slideWidth,
    slideHeight: info.slideHeight,
    shapes: (info.slide || []).map((s) => s.shapeCount),
    cmds: (info.slide || []).map((s) => s.displayListCmds),
  };
  if (!row.ok) failed += 1;
  for (const f of entry.features || []) {
    if (!featureHits[f]) featureHits[f] = { total: 0, pass: 0 };
    featureHits[f].total += 1;
    if (row.ok) featureHits[f].pass += 1;
  }
  results.push(row);
}

app.close();

if (AS_JSON) {
  console.log(JSON.stringify({ failed, results, featureHits }, null, 2));
} else {
  console.log("=== PPTX feature harness ===\n");
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    const meta = r.inspect
      ? `slides=${r.inspect.slides} shapes=[${(r.inspect.shapes || []).join(",")}] cmds=[${(r.inspect.cmds || []).join(",")}]`
      : "";
    console.log(`  ${mark}  ${r.file}  — ${r.title}`);
    if (meta) console.log(`        ${meta}`);
    if (r.features?.length) console.log(`        features: ${r.features.join(", ")}`);
    for (const f of r.fails) console.log(`        · ${f}`);
  }
  console.log("\n--- feature coverage ---");
  for (const [name, hit] of Object.entries(featureHits)) {
    if (hit.total === 0) {
      console.log(`  ${name}: (no fixtures)`);
    } else {
      const ok = hit.pass === hit.total ? "ok" : "PARTIAL";
      console.log(`  ${ok.padEnd(7)} ${name}  ${hit.pass}/${hit.total}`);
    }
  }
  console.log("");
  console.log(failed === 0 ? "ALL PASS" : `FAILED ${failed}`);
}

process.exit(failed === 0 ? 0 : 1);
