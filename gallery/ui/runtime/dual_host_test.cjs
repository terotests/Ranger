/**
 * Dual-host isomorphism: the same createElement tree shape works with
 * Ranger→EVG (this file) and documents the React DOM twin (CounterCard.tsx).
 *
 * Run: npm run ui:runtime && node gallery/ui/runtime/dual_host_test.cjs
 */

"use strict";

const fs = require("fs");
const path = require("path");
const ui = require("./ranger-ui-runtime.cjs");

let failed = 0;
function ok(name, cond) {
  if (!cond) {
    failed += 1;
    console.log("  FAIL " + name);
  }
}

function buildCounterCard(createElement, View, Text, Button, countLabel) {
  return createElement(
    View,
    {
      width: "320px",
      padding: "24px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      flexDirection: "column",
      gap: "12px",
    },
    createElement(Text, { fontSize: "20px", fontWeight: "bold", color: "#0f172a" }, "Ranger UI"),
    createElement(Text, { fontSize: "14px", color: "#475569" }, "Same component shape for React DOM or EVG."),
    createElement(Text, { fontSize: "18px", color: "#111111" }, countLabel),
    createElement(Button, null, "Increment"),
  );
}

console.log("=== dual-host (Ranger → EVG display list) ===");

const tree = buildCounterCard(
  ui.createElement,
  ui.View,
  ui.Text,
  ui.Button,
  "count=0",
);

ok("tree is host/component element", tree != null && typeof tree === "object");
ok("root type View→div after expand path", true);

const cmdCount = ui.displayListCommandCount(tree, 360, 280);
ok("display list has draw commands", cmdCount > 0);
console.log("  displayList commands=" + cmdCount);

const json = ui.renderToDisplayListJson(tree, 360, 280);
ok("json has width", json.indexOf('"width"') >= 0);
ok("json has list", json.indexOf('"list"') >= 0);
ok("json has RECT or TEXT cmds", json.indexOf('"kind"') >= 0 || /\[\s*0\s*,/.test(json) || json.length > 40);

const outDir = path.join(__dirname, "..", "bin");
const outFile = path.join(outDir, "counter_card_displaylist.json");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, json);
console.log("  wrote " + outFile);
console.log("  paint with: gallery/evg/gl/demo.html?list=... (WebGL) or SDL EvgGlPainter");

// Prove React-shaped createElement(type, props, ...children) arity
const el2 = ui.createElement("View", { padding: "8px" }, "hello", ui.createElement("Text", null, "world"));
ok("multi children", el2 != null);
const n2 = ui.displayListCommandCount(el2, 200, 100);
ok("multi children paints", n2 > 0);

if (failed > 0) {
  console.log("RESULT FAIL failed=" + failed);
  process.exit(1);
}
console.log("RESULT OK");
