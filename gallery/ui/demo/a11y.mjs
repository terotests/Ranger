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
const { SortableDemo } = require(path.join(ROOT, "gallery/ui/bin/SortableDemo.cjs"));
const { MotionDemo } = require(path.join(ROOT, "gallery/ui/bin/MotionDemo.cjs"));
const { TableDemo } = require(path.join(ROOT, "gallery/ui/bin/TableDemo.cjs"));
const { DropdownDemo } = require(path.join(ROOT, "gallery/ui/bin/DropdownDemo.cjs"));
const { DialogDemo } = require(path.join(ROOT, "gallery/ui/bin/DialogDemo.cjs"));
const { TreeDemo } = require(path.join(ROOT, "gallery/ui/bin/TreeDemo.cjs"));
const { TimelineDemo } = require(path.join(ROOT, "gallery/ui/bin/TimelineDemo.cjs"));
const { ResizeDemo } = require(path.join(ROOT, "gallery/ui/bin/ResizeDemo.cjs"));
const { FormDemo } = require(path.join(ROOT, "gallery/ui/bin/FormDemo.cjs"));
const MENUBAR_CSS = fs.readFileSync(path.join(HERE, "menubar.css"), "utf8");
const TOOLBAR_CSS = fs.readFileSync(path.join(HERE, "toolbar.css"), "utf8");
const SORTABLE_CSS = fs.readFileSync(path.join(HERE, "sortable.css"), "utf8");
const MOTION_CSS = fs.readFileSync(path.join(HERE, "motion.css"), "utf8");
const TABLE_CSS = fs.readFileSync(path.join(HERE, "table.css"), "utf8");
const DROPDOWN_CSS = fs.readFileSync(path.join(HERE, "dropdown.css"), "utf8");
const DIALOG_CSS = fs.readFileSync(path.join(HERE, "dialog.css"), "utf8");
const TREE_CSS = fs.readFileSync(path.join(HERE, "tree.css"), "utf8");
const TIMELINE_CSS = fs.readFileSync(path.join(HERE, "timeline.css"), "utf8");
const RESIZE_CSS = fs.readFileSync(path.join(HERE, "resize.css"), "utf8");
const FORM_CSS = fs.readFileSync(path.join(HERE, "form.css"), "utf8");

// The showcase keeps its tree, so unlike the other three it is an instance and
// the audit holds one — the same one for both states below, which is also a
// small check that a hover leaves the accessible tree alone.
const motion = new MotionDemo();
motion.init(MOTION_CSS);
const ORDER = ["demo", "spec", "video", "audio", "extra"];

// The table keeps its tree for the same reason, and the audit drives it the
// way a person would — by pressing the ids the hit test reports. A state
// reached by calling the controller directly is a state the page might not be
// able to get to.
const table = new TableDemo();
table.init(TABLE_CSS);

// The dropdown, driven the way the page drives it — through MenuCtl. The
// submenu state below is reached by hovering and letting the controller's own
// clock run, not by reaching in and setting a flag: a state the page cannot
// get to is a state not worth auditing.
const dropdown = new DropdownDemo();
dropdown.init(DROPDOWN_CSS);

// The dialog and the window. Two dialogs on one page is the state worth
// auditing: a modal and a non-modal one, side by side, each with its own name
// — and a title bar that is a real control in one and a heading in the other.
const dialog = new DialogDemo();
dialog.init(DIALOG_CSS);

// The tree. Rows that are SIBLINGS with their nesting in `aria-level` is a
// shape axe has opinions about — `aria-required-children` on the tree, and
// `aria-required-parent` on every row — and it is the shape headless-tree
// renders, so the audit is what decides whether copying it is defensible.
const treeview = new TreeDemo();
treeview.init(TREE_CSS);

const timeline = new TimelineDemo();
timeline.init(TIMELINE_CSS);

const resize = new ResizeDemo();
resize.init(RESIZE_CSS);
const form = new FormDemo();
form.init(FORM_CSS);

const CHECKED = ["Always Show Full URLs"];

const STATES = [
  {
    name: "menubar — File open, with the Share submenu",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "File", true, false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "File", true, false, 1, "row-New Tab"),
  },
  {
    name: "menubar — View open, checkable rows",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "View", false, false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "View", false, false, 2, ""),
  },
  {
    name: "menubar — Profiles open, a radio set",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "Profiles", false, false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "Profiles", false, false, 3, ""),
  },
  {
    name: "menubar — everything closed",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "", false, false),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "", false, false, 4, ""),
  },
  {
    name: "menubar — the bar at the bottom, so the menu opens upwards",
    size: [1240, 560],
    lint: () => MenubarDemo.a11yProblems(MENUBAR_CSS, CHECKED, "Luis", "File", true, true),
    tree: () => MenubarDemo.a11yJson(MENUBAR_CSS, CHECKED, "Luis", "File", true, true, 5, ""),
  },
  {
    name: "sortable — at rest",
    size: [1240, 560],
    lint: () => SortableDemo.a11yProblems(SORTABLE_CSS, ORDER, ""),
    tree: () => SortableDemo.a11yJson(SORTABLE_CSS, ORDER, "", 6, ""),
  },
  {
    name: "sortable — a row picked up",
    size: [1240, 560],
    lint: () => SortableDemo.a11yProblems(SORTABLE_CSS, ORDER, "video"),
    tree: () => SortableDemo.a11yJson(SORTABLE_CSS, ORDER, "video", 7, "sr-row-video"),
  },
  {
    name: "motion — at rest",
    size: [1180, 1580],
    lint: () => {
      motion.setHover("");
      motion.setFlipped(false);
      return motion.a11yProblems();
    },
    tree: () => motion.a11yJson(8, ""),
  },
  {
    name: "motion — a card hovered, mid-flight",
    size: [1180, 1580],
    // Mid-transition on purpose. Contrast is measured off the display list, so
    // a colour half way between two states is a colour that has to pass on its
    // own — and a palette chosen only for its two ends can fail in between.
    lint: () => {
      motion.setHover("mo-card-lift");
      motion.setFlipped(true);
      motion.displayListJson();
      motion.tick(80.0);
      return motion.a11yProblems();
    },
    tree: () => motion.a11yJson(9, ""),
  },
  {
    // Every row focusable and every one of them needing a name of its own —
    // the shape that produced three axe violations when the table was first
    // built, so it is worth auditing at rest before anything is touched.
    name: "table — at rest, page 1",
    size: [900, 460],
    lint: () => {
      table.setHover("");
      return table.a11yProblems();
    },
    tree: () => table.a11yJson(10, ""),
  },
  {
    // Sorted, one row chosen, and on the short second page. `aria-sort` on a
    // columnheader, a mixed select-all, and a DISABLED Next all appear here and
    // in none of the states above; a disabled control that keeps focus is the
    // defect this state exists to catch.
    name: "table — sorted, one row selected, last page",
    size: [900, 460],
    lint: () => {
      table.press("tbl-col-name");
      table.press("tbl-check-p1");
      table.press("tbl-next");
      return table.a11yProblems();
    },
    tree: () => table.a11yJson(11, "tbl-prev"),
  },
  {
    name: "dropdown — closed",
    size: [900, 560],
    lint: () => dropdown.a11yProblems(),
    tree: () => dropdown.a11yJson(12, ""),
  },
  {
    // Open, with the submenu out. Three menus' worth of roles in one tree —
    // menu, menuitem, menuitemradio and a radiogroup of icon-only buttons —
    // and the icon-only ones are why this state exists: a button whose whole
    // content is a glyph has no name unless someone gives it one, and axe is
    // the thing that notices when nobody did.
    name: "dropdown — open, submenu out",
    size: [900, 560],
    lint: () => {
      dropdown.press("dd-trigger");
      dropdown.setHover("dd-item-status");
      dropdown.tick(150.0);
      return dropdown.a11yProblems();
    },
    tree: () => dropdown.a11yJson(13, "dd-item-status-item-available"),
  },
  {
    // A modal and a movable window at once. Two things axe is good at and this
    // is the only page with either: a dialog needs an accessible name, and a
    // control whose whole affordance is "you can drag me" needs to say so in
    // words — the bar carries a roledescription for exactly that reason.
    name: "dialog — a modal and a window, both open",
    size: [900, 560],
    lint: () => {
      dialog.openModal();
      dialog.openWindow();
      return dialog.a11yProblems();
    },
    tree: () => dialog.a11yJson(14, "win-titlebar"),
  },
  {
    // The window alone. With the modal shut, nothing masks the page behind it
    // — which is the whole difference between the two, and means everything
    // under the window is audited as reachable rather than hidden.
    name: "dialog — the window alone, page still reachable",
    size: [900, 560],
    lint: () => {
      dialog.press("dlg-close");
      return dialog.a11yProblems();
    },
    tree: () => dialog.a11yJson(15, ""),
  },
  {
    // Two separators and a breadcrumb, with the trail collapsed — which is the
    // state worth auditing: an ellipsis has to say that crumbs are missing,
    // and a splitter has to be named and have a range.
    name: "resizable — nested panels, the trail given way",
    size: [900, 520],
    lint: () => {
      const p = resize.outer.panels[0];
      const q = resize.outer.panels[1];
      q.size += p.size - 45;
      p.size = 45;
      resize.rebuild();
      return resize.a11yProblems();
    },
    tree: () => resize.a11yJson(18, "rz-sep-0"),
  },
  {
    // A form is full of the shapes axe minds and the diff cannot see: a label
    // that names a control, a message that describes it, a required marker
    // that is a glyph rather than a claim, and a group of radios. The state
    // worth auditing is the one with something WRONG in it — a field in error
    // has to say what is wrong where a reader will hear it, and a red ring is
    // not a sentence.
    name: "form — six controls, one of them in error",
    size: [620, 560],
    lint: () => form.a11yProblems(),
    tree: () => form.a11yJson(19, "fm-amount"),
  },
  {
    // The rail is a picture of the value and says nothing a reader needs, so
    // it is out of the tree entirely — which means this case is checking that
    // the LIST survived being the only thing left. A timeline whose rail was
    // announced would read as eight items where a person sees four.
    name: "timeline — a list of four events, three of them reached",
    size: [900, 520],
    lint: () => timeline.a11yProblems().concat(timeline.hostProblems()),
    tree: () => timeline.a11yJson(17, ""),
  },
  {
    name: "tree — three folders open, focus on a nested row",
    size: [900, 520],
    // The component host's own complaints ride along with the tree's. A page
    // that misuses the host — a `use` outside a pass, an unclosed `enter` —
    // renders a perfectly plausible frame and gets the lifecycle wrong, which
    // is exactly the kind of failure that has to announce itself.
    lint: () => {
      treeview.press("tv-item-jane");
      return treeview.a11yProblems().concat(treeview.hostProblems());
    },
    tree: () => treeview.a11yJson(16, "tv-item-jane"),
  },
  {
    // The same tree with a folder shut. Rows that were in the tree a moment
    // ago are GONE, not hidden — a browser drops collapsed items too, and
    // leaving them in would hand a reader rows nobody can reach.
    name: "tree — a folder collapsed",
    size: [900, 520],
    lint: () => {
      treeview.press("tv-item-accounts");
      return treeview.a11yProblems().concat(treeview.hostProblems());
    },
    tree: () => treeview.a11yJson(17, "tv-item-accounts"),
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
