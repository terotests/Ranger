/**
 * script_smoke.mjs — the report path, driven the way the UI drives it.
 *
 * The unit test (tests/GridScriptTest.rgr) calls the engine directly. This
 * one goes through the app: the same command ids the toolbar button and the
 * palette send, the same display list the window paints, the same PDF the
 * export writes. What it is really checking is that the wiring exists — a
 * command that reaches nothing, a preview that paints nothing and an export
 * that writes nothing all pass a unit test of the engine.
 *
 *   node gallery/datagrid/web/script_smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const require = createRequire(import.meta.url);
const modPath = path.resolve(ROOT, "gallery/datagrid/bin/grid_app_module.cjs");

if (!fs.existsSync(modPath)) {
  console.error("build it first:  npm run datagrid:module");
  process.exit(1);
}

const { GridApp } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");
const outDir = path.resolve(ROOT, "gallery/datagrid/harness/out/script");
fs.mkdirSync(outDir, { recursive: true });

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

/** The scene the host would paint this frame. */
function scene(app) {
  return JSON.parse(app.sceneJson());
}

function textsOf(doc) {
  return doc.list.cmds.filter((c) => c.k === 3).map((c) => c.text);
}

const app = new GridApp();
app.init(fontDir);
const fixture = path.resolve(ROOT, "gallery/datagrid/fixtures/business-workbook.xlsx");
const loaded = app.loadXlsx(fixture);
check("fixture loaded", loaded, app.loadError);

// A workbook with no script says so rather than opening an empty preview.
app.runCommand("script.run", "");
check("no script, no preview", app.view.preview.active === false, app.view.status);

// The command the palette sends. It writes a script into the workbook and
// runs it, so the first thing a new script does is show its own output.
app.runCommand("script.new", "sales");
check("preview opened", app.view.preview.active === true, app.view.status);
check("script is in the workbook", app.book.scriptCount() === 1);
check("named as asked", app.book.scriptAt(0).name === "sales");
check("stored as an .xlsx part", app.book.scriptAt(0).part === "ranger/sales.tsx");

const doc = scene(app);
const texts = textsOf(doc);
const sheetName = app.book.activeName();
check("the page is painted", doc.list.cmds.length > 40, `${doc.list.cmds.length} commands`);
check("the report headline is on screen", texts.some((t) => t.includes("sales  page 1/")));
check("the sheet's own name is on the page", texts.includes(sheetName));

// Esc closes it, and the sheet comes back.
app.runCommand("script.close", "");
check("closed", app.view.preview.active === false);
const sheetDoc = scene(app);
check("the sheet is back", textsOf(sheetDoc).includes("A"), "column headers");

// Export writes a PDF beside the workbook — this host has a disk.
app.runCommand("script.run", "");
app.book.sourcePath = path.join(outDir, "smoke.xlsx");
app.runCommand("script.export.pdf", "");
const pdfPath = path.join(outDir, "smoke-sales.pdf");
const wrote = fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 800;
check("pdf written", wrote, app.view.status);
if (wrote) {
  const head = fs.readFileSync(pdfPath).subarray(0, 4).toString("latin1");
  check("and it is a pdf", head === "%PDF", head);
}

// The script travels with the workbook: save, reload, run again.
app.runCommand("file.save", "");
const app2 = new GridApp();
app2.init(fontDir);
const reopened = app2.loadXlsx(path.join(outDir, "smoke.xlsx"));
check("saved workbook reopens", reopened, app2.loadError);
check("with its script still in it", app2.book.scriptCount() === 1);
app2.runCommand("script.run", "");
check("and the report runs from it", app2.view.preview.active === true, app2.view.status);

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n  ${checks.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
