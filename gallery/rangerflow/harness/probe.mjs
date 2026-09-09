import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
for (const n of ["Element","SVGElement","HTMLElement","Node","DOMParser","NodeFilter","getComputedStyle","Option"]) globalThis[n]=dom.window[n];
const mermaid = (await import('mermaid')).default;
mermaid.initialize({ startOnLoad:false, securityLevel:'loose' });
const src = process.argv[2];
try {
  const d = await mermaid.mermaidAPI.getDiagramFromText(src);
  const db = d.db ?? d.getDB?.();
  console.log('OK type:', d.type ?? d.getType?.());
  const keys = Object.keys(db).filter(k=>/^get/.test(k));
  for (const k of keys) {
    try { const v = db[k](); console.log(k, '=', JSON.stringify(v)?.slice(0,600)); } catch(e){}
  }
} catch(e) { console.log('ERR', String(e.message||e).split('\n').slice(0,3).join(' | ')); }
