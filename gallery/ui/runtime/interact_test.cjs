/**
 * Interactive counter: useState + onClick → hitTest → re-render → display list.
 * Run: npm run ui:interact
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { createRoot } = require("./ranger-ui-runtime.cjs");

let failed = 0;
function ok(name, cond) {
  if (!cond) {
    failed += 1;
    console.log("  FAIL " + name);
  } else {
    console.log("  ok   " + name);
  }
}

console.log("=== interactive onClick (Ranger → EVG) ===");

const root = createRoot();
root.setPageSize(360, 280);

function CounterApp() {
  const [n, setN] = root.useState("0");
  return root.createElement(
    root.View,
    {
      width: "320px",
      padding: "24px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      flexDirection: "column",
      gap: "12px",
    },
    root.createElement(root.Text, { fontSize: "20px", fontWeight: "bold", color: "#0f172a" }, "Ranger UI"),
    root.createElement(root.Text, { fontSize: "18px", color: "#111111" }, "count=" + n),
    root.createElement(
      root.Button,
      {
        onClick: () => setN(String(Number(n) + 1)),
      },
      "Increment",
    ),
  );
}

root.render(CounterApp);
ok("has hit regions", root.hitRegionCount() > 0);

const laid = root._ui.lastRoot;
ok("laid out root", laid != null);

// Find the button region roughly: last hit region should be the button.
const hits = root._ui.lastHits;
const regions = hits.regions;
ok("regions array", regions && regions.length > 0);
const btn = regions[regions.length - 1];
const cx = btn.x + btn.w / 2;
const cy = btn.y + btn.h / 2;
console.log("  button hit box", btn.handlerId, btn.x, btn.y, btn.w, btn.h);

const miss = root.dispatchClick(0, 0);
ok("miss not handled", miss.handled === false);

const click = root.dispatchClick(cx, cy);
ok("click handled", click.handled === true);
ok("rerendered after click", click.rerendered === true);

// After re-render, display list text should show count=1
const json = root.renderToDisplayListJson(root.currentTree, 360, 280);
ok("count=1 in display list", json.indexOf("count=1") >= 0);

const out = path.join(__dirname, "..", "bin", "counter_after_click.json");
fs.writeFileSync(out, json);
console.log("  wrote " + out);

// Second click
const hits2 = root._ui.lastHits.regions;
const btn2 = hits2[hits2.length - 1];
const click2 = root.dispatchClick(btn2.x + btn2.w / 2, btn2.y + btn2.h / 2);
ok("second click", click2.handled === true);
const json2 = root.renderToDisplayListJson(root.currentTree, 360, 280);
ok("count=2 in display list", json2.indexOf("count=2") >= 0);

if (failed > 0) {
  console.log("RESULT FAIL failed=" + failed);
  process.exit(1);
}
console.log("RESULT OK");
