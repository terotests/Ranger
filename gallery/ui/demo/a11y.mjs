/**
 * The accessibility audit for the demo page.
 *
 *   node gallery/ui/demo/a11y.mjs
 *
 * Two checks, and neither one is enough on its own:
 *
 *   EVGA11yTree.lint()   no browser: a focusable row with no accessible name,
 *                        a duplicate id, a parent that is not in the tree.
 *   axe-core             the industry rule set over what a screen reader
 *                        actually walks — the DOM `evg-a11y.js` mirrors the
 *                        tree into. Auditing the canvas would be auditing one
 *                        empty graphic, which is the whole problem this is
 *                        here to solve.
 *
 * The trees are computed in Node, straight out of the compiled demos, and the
 * page below only mirrors them. So this audits the same JSON the live page
 * publishes, in the states worth auditing: a menu open, a menu with checkable
 * rows open, and the toolbar.
 *
 * Colour contrast is excluded here for the reason a11y.mjs excludes it: the
 * mirror's ink is transparent by design, so axe would be measuring the wrong
 * surface. `npm run ui:a11y` measures contrast where the colour actually is,
 * in the display list.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);
const domRequire = createRequire(path.join(ROOT, "gallery/ui/conformance/dom/package.json"));

const { MenubarDemo } = require(path.join(ROOT, "gallery/ui/bin/MenubarDemo.cjs"));
const { ToolbarDemo } = require(path.join(ROOT, "gallery/ui/bin/ToolbarDemo.cjs"));
const MENUBAR_CSS = fs.readFileSync(path.join(HERE, "menubar.css"), "utf8");
const TOOLBAR_CSS = fs.readFileSync(path.join(HERE, "toolbar.css"), "utf8");

const CHECKED = ["Always Show Full URLs"];

const STATES = [
  {
    name: "menubar — File open, with the Share submenu",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "File", true),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "File", true, 1, "row-New Tab"),
  },
  {
    name: "menubar — View open, checkable rows",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "View", false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "View", false, 2, ""),
  },
  {
    name: "menubar — Profiles open, a radio set",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "Profiles", false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "Profiles", false, 3, ""),
  },
  {
    name: "menubar — everything closed",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "", false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "", false, 4, ""),
  },
  {
    name: "toolbar",
    size: [1240, 320],
    lint: () => ToolbarDemo.a11yProblems(TOOLBAR_CSS, true, false, false, "center", "Edited 2 hours ago"),
    tree: () => ToolbarDemo.a11yJson(TOOLBAR_CSS, true, false, false, "center", "Edited 2 hours ago", 1, "tb-bold"),
  },
];

const AXE = fs.readFileSync(domRequire.resolve("axe-core"), "utf8");

const html = `<!doctype html><meta charset="utf-8">
<link rel="icon" href="data:,">
<style>html,body{margin:0;background:#fff}#stage{position:relative}</style>
<div id="stage"></div>
<script type="module">
import { createA11yMirror } from "/gallery/evg/gl/evg-a11y.js";
const stage = document.getElementById("stage");
const mirror = createA11yMirror(stage, { label: "Ranger tree literal demos" });
window.__mirror = (tree, w, h) => {
  stage.style.width = w + "px";
  stage.style.height = h + "px";
  mirror.update(tree);
};
window.__READY__ = true;
</script>`;

const pageFile = path.join(ROOT, "tmp", "demo_a11y.html");
fs.mkdirSync(path.dirname(pageFile), { recursive: true });
fs.writeFileSync(pageFile, html);

const { createServer } = await import("node:http");
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = rel === "/" ? pageFile : path.join(ROOT, rel.slice(1));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  const type = file.endsWith(".js") || file.endsWith(".mjs") ? "text/javascript" : "text/html";
  res.writeHead(200, { "content-type": type }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1320, height: 700 } });
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });

console.log("gallery/ui/demo — accessibility audit (axe-core " +
  domRequire("axe-core/package.json").version + ")\n");

let failures = 0;
for (const state of STATES) {
  const problems = state.lint();
  const tree = JSON.parse(state.tree());
  await page.evaluate(
    ([t, w, h]) => window.__mirror(t, w, h),
    [tree, state.size[0], state.size[1]],
  );
  await page.addScriptTag({ content: AXE });
  const violations = await page.evaluate(async () => {
    const res = await window.axe.run(document.querySelector("#stage"), {
      resultTypes: ["violations"],
      rules: { "color-contrast": { enabled: false } },
    });
    return res.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => String(n.target)),
    }));
  });
  // A tree with no nodes passes every rule there is, so the count is part of
  // the check: an audit of nothing is not a clean audit.
  const mirrored = await page.evaluate(
    () => document.querySelectorAll("[data-a11y-id]").length,
  );
  const ok = problems.length === 0 && violations.length === 0 && mirrored === tree.nodes.length;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${state.name} — ${tree.nodes.length} nodes, ${mirrored} mirrored`);
  for (const p of problems) console.log(`    lint: ${p}`);
  for (const v of violations) {
    console.log(`    axe [${v.impact}] ${v.id}: ${v.help} (${v.nodes} nodes) ${v.targets.join(" ")}`);
  }
}

await browser.close();
server.close();
console.log("");
console.log(failures === 0 ? "RESULT OK" : `RESULT ${failures} state(s) with findings`);
process.exit(failures === 0 ? 0 : 1);
