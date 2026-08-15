import * as vega from "vega";
import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const view = new vega.View(vega.parse(spec), { renderer: "none" });
await view.runAsync();
const IGNORED = new Set(['exit','zindex','bounds','mark','datum','source','clip','strokeForeground','context']);
function walk(m, ind=0) {
  if (!m) return;
  if ((m.role||"").startsWith("legend")) {
    console.log(" ".repeat(ind) + `MARK ${m.marktype} role=${m.role}`);
    for (const it of m.items||[]) {
      const o = {}; for (const k of Object.keys(it)) { if (IGNORED.has(k)||k==='items') continue; const v=it[k]; if (v===null||v===undefined||typeof v==='object'||typeof v==='function') continue; o[k]=v; }
      console.log(" ".repeat(ind+2) + JSON.stringify(o));
      if (it.fill && typeof it.fill === 'object') console.log(" ".repeat(ind+2) + "  fill=" + JSON.stringify(it.fill));
      for (const s of it.items||[]) if (s.marktype) walk(s, ind+4);
    }
    return;
  }
  for (const it of m.items||[]) for (const c of it.items||[]) if (c.marktype) walk(c, ind);
}
walk(view.scenegraph().root);
