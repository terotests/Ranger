import fs from "node:fs";
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
for (const n of ["Element","SVGElement","HTMLElement","Node","DOMParser","NodeFilter","getComputedStyle","Option"]) globalThis[n]=dom.window[n];
const mermaid = (await import('mermaid')).default;
mermaid.initialize({ startOnLoad:false, securityLevel:'loose' });
const dump = (v) => v instanceof Map ? JSON.stringify([...v.entries()]) : JSON.stringify(v);
for (const src of JSON.parse(fs.readFileSync(process.argv[2],"utf8"))) {
  console.log('--- ', JSON.stringify(src));
  try {
    const d = await mermaid.mermaidAPI.getDiagramFromText(src);
    const db = d.db ?? d.getDB?.();
    console.log('   OK', Object.keys(db).filter(k=>/^get/.test(k)).map(k=>{try{return k+'='+String(dump(db[k]())).slice(0,300)}catch(e){return ''}}).filter(Boolean).join('\n      '));
  } catch(e) { console.log('   ERR', String(e.message||e).split('\n')[0].slice(0,160)); }
}
