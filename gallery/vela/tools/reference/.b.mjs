import * as vega from "vega";
import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const view = new vega.View(vega.parse(spec), { renderer: "none" });
await view.runAsync();
function walk(m, ind=0) {
  for (const it of m.items || []) {
    if (m.marktype === "group") {
      const b = it.bounds || {};
      console.log(" ".repeat(ind) + `${m.role}/${m.name} x=${it.x} y=${it.y} w=${it.width} h=${it.height} bounds=[${b.x1},${b.y1},${b.x2},${b.y2}]`);
    }
    for (const s of it.items||[]) if (s.marktype) walk(s, ind+2);
  }
}
walk(view.scenegraph().root);
