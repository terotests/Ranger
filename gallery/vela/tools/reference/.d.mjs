import * as vega from "vega";
import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const view = new vega.View(vega.parse(spec), { renderer: "none" });
await view.runAsync();
const IGNORED = new Set(['exit','zindex','bounds','mark','datum','source','clip','strokeForeground','context','zdirty']);
function show(m, ind=0) {
  console.log(" ".repeat(ind) + `MARK ${m.marktype} role=${m.role} name=${m.name} n=${(m.items||[]).length}`);
  for (const it of m.items || []) {
    const o = {}; for (const k of Object.keys(it)) { if (IGNORED.has(k)||k==='items') continue; const v=it[k]; if (v===null||v===undefined||typeof v==='object'||typeof v==='function') continue; o[k]=v; }
    console.log(" ".repeat(ind+2) + JSON.stringify(o).slice(0,220));
    for (const s of it.items||[]) if (s.marktype) show(s, ind+4);
  }
}
show(view.scenegraph().root);
