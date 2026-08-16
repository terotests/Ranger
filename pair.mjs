import fs from 'fs';
import path from 'path';
const VELA = '/home/user/Ranger/gallery/vela';
const CORPUS = path.join(VELA, 'tests', 'corpus');
const OUT = '/tmp/claude-0/-home-user-Ranger/927540c9-ecc0-5daa-bb4e-9f8716a367ac/scratchpad';
const vega = await import('vega');
const vegaLite = await import('vega-lite');
const VelaWeb = (function () {
  const source = fs.readFileSync(path.join(VELA, 'bin', 'vela_web.js'), 'utf8').replace(/^#![^\n]*\n/, '');
  return new Function('require', `${source}\n; return VelaWeb;`)(undefined);
})();
function split(line, sep) { const out=[]; let c='',q=false;
  for (let i=0;i<line.length;i++){const ch=line[i];
    if(q){if(ch==='"'){if(line[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
    else if(ch==='"')q=true; else if(ch===sep){out.push(c);c='';} else c+=ch;}
  out.push(c); return out; }
function delim(text, sep) { const rows=text.replace(/\r\n/g,'\n').trim().split('\n'); const head=split(rows[0],sep);
  return rows.slice(1).map(l=>{const cs=split(l,sep);const r={};head.forEach((n,i)=>{const c=cs[i];
    r[n]=c===undefined||c===''?null:Number.isNaN(Number(c))?c:Number(c);});return r;}); }
function inline(node) { if (Array.isArray(node)) { node.forEach(inline); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.url === 'string') {
    const file = path.join(CORPUS,'data', node.url.replace(/^data\//,''));
    const text = fs.readFileSync(file,'utf8');
    const type = (node.format&&node.format.type) || (node.url.endsWith('.csv')?'csv':node.url.endsWith('.tsv')?'tsv':'json');
    node.values = type==='csv'?delim(text,','):type==='tsv'?delim(text,'\t'):JSON.parse(text);
    delete node.url; delete node.format;
  }
  for (const k of Object.keys(node)) inline(node[k]); }
const name = process.argv[2];
const spec = JSON.parse(fs.readFileSync(path.join(CORPUS,'specs',`${name}.vl.json`),'utf8'));
inline(spec);
const vg = spec.$schema && spec.$schema.includes('/vega/') ? spec : vegaLite.compile(structuredClone(spec)).spec;
const view = new vega.View(vega.parse(structuredClone(vg)), { renderer:'none' });
await view.runAsync();
fs.writeFileSync(`${OUT}/ref.svg`, await view.toSVG());
fs.writeFileSync(`${OUT}/ref.vg.json`, JSON.stringify(vg,null,1));
const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
if (!answer.ok) { console.log('REFUSED', answer.errors); process.exit(1); }
fs.writeFileSync(`${OUT}/got.svg`, answer.svg);
fs.writeFileSync(`${OUT}/got.vg.json`, answer.vega||'');
const size = s => { const m=/width="([0-9.]+)" height="([0-9.]+)"/.exec(s); return m?`${m[1]}x${m[2]}`:'?'; };
console.log('ref', size(fs.readFileSync(`${OUT}/ref.svg`,'utf8')), ' got', size(answer.svg));
