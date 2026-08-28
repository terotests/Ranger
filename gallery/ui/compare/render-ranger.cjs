/**
 * Render the shared CounterCard with Ranger → EVG display list (+ optional clicks).
 * Writes JSON for the WebGL panel in compare/index.html.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { createRoot } = require("../runtime/ranger-ui-runtime.cjs");
const { CounterCard } = require("./shared-counter.cjs");

const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });

const root = createRoot();
root.setPageSize(360, 280);
const App = CounterCard(root);

root.render(App);
const json0 = root.renderToDisplayListJson(root.currentTree, 360, 280);
fs.writeFileSync(path.join(outDir, "ranger-count-0.json"), json0);

const regions = root._ui.lastHits.regions;
const btn = regions[regions.length - 1];
root.dispatchClick(btn.x + btn.w / 2, btn.y + btn.h / 2);
const json1 = root.renderToDisplayListJson(root.currentTree, 360, 280);
fs.writeFileSync(path.join(outDir, "ranger-count-1.json"), json1);

root.dispatchClick(
  root._ui.lastHits.regions[root._ui.lastHits.regions.length - 1].x + 10,
  root._ui.lastHits.regions[root._ui.lastHits.regions.length - 1].y + 10,
);
const json2 = root.renderToDisplayListJson(root.currentTree, 360, 280);
fs.writeFileSync(path.join(outDir, "ranger-count-2.json"), json2);

console.log("wrote", outDir);
console.log("count-0 cmds", JSON.parse(json0).list.cmds.length);
console.log("count-1 has count=1", json1.includes("count=1"));
console.log("count-2 has count=2", json2.includes("count=2"));
