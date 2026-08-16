// For every gallery example that draws differently, name the FIRST structural
// difference between the reference's compiled Vega and ours — ranked, so the
// causes come out in order of how many charts each one accounts for.
import fs from 'fs';
import path from 'path';
const VELA = '/home/user/Ranger/gallery/vela';
const CORPUS = path.join(VELA, 'tests', 'corpus');
const vega = await import('vega');
const vegaLite = await import('vega-lite');
const VelaWeb = (function () {
  const src = fs.readFileSync(path.join(VELA, 'bin', 'vela_web.js'), 'utf8').replace(/^#![^\n]*\n/, '');
  return new Function('require', `${src}\n; return VelaWeb;`)(undefined);
})();
function split(line, sep) { const o=[]; let c='',q=false;
  for (let i=0;i<line.length;i++){const ch=line[i];
    if(q){if(ch==='"'){if(line[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
    else if(ch==='"')q=true; else if(ch===sep){o.push(c);c='';} else c+=ch;} o.push(c); return o; }
function delim(t,s){const r=t.replace(/\r\n/g,'\n').trim().split('\n');const h=split(r[0],s);
  return r.slice(1).map(l=>{const cs=split(l,s);const o={};h.forEach((n,i)=>{const c=cs[i];
    o[n]=c===undefined||c===''?null:Number.isNaN(Number(c))?c:Number(c);});return o;});}
function inline(node){ if(Array.isArray(node)){node.forEach(inline);return;}
  if(!node||typeof node!=='object')return;
  if(typeof node.url==='string'){
    const f=path.join(CORPUS,'data',node.url.replace(/^data\//,''));
    if(!fs.existsSync(f)) throw new Error('nodata');
    const t=fs.readFileSync(f,'utf8');
    const ty=(node.format&&node.format.type)||(node.url.endsWith('.csv')?'csv':node.url.endsWith('.tsv')?'tsv':'json');
    const v=ty==='csv'?delim(t,','):ty==='tsv'?delim(t,'\t'):JSON.parse(t);
    if(!Array.isArray(v)) throw new Error('nodata');
    node.values=v; delete node.url; delete node.format; }
  for(const k of Object.keys(node)) inline(node[k]); }

const paths = [];
for (const file of fs.readdirSync(path.join(CORPUS,'specs')).sort()) {
  const name = file.replace(/\.vl\.json$/,'');
  let spec;
  try { spec = JSON.parse(fs.readFileSync(path.join(CORPUS,'specs',file),'utf8')); inline(spec); } catch { continue; }
  let ref;
  try { ref = spec.$schema && spec.$schema.includes('/vega/') ? spec : vegaLite.compile(structuredClone(spec)).spec; } catch { continue; }
  let answer;
  try { answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), '')); } catch { continue; }
  if (!answer.ok || !answer.vega) continue;
  const got = JSON.parse(answer.vega);
  const found = [];
  function walk(a,b,p){
    if (found.length > 6) return;
    if (JSON.stringify(a)===JSON.stringify(b)) return;
    if (a===undefined){found.push(`+ ${p}`);return;}
    if (b===undefined){found.push(`- ${p}`);return;}
    // The NAME of a data set is not observable in the drawing: the reference
    // calls it source_0 where this calls it data_0, and both charts are the
    // same chart. Sorting a survey by it buries everything that matters.
    if (/\.data$/.test(p) || /^signals\[\]\.name$/.test(p)) return;
    if (typeof a!=='object'||typeof b!=='object'||a===null||b===null){found.push(`~ ${p}`);return;}
    if (Array.isArray(a)!==Array.isArray(b)){found.push(`# ${p}`);return;}
    for (const k of new Set([...Object.keys(a),...Object.keys(b)])) walk(a[k],b[k],`${p}.${k}`);
  }
  for (const part of ['width','height','padding','signals','scales','axes','legends','marks']) walk(ref[part],got[part],part);
  if (!found.length) continue;
  // Take out the indices so the same difference on ten charts counts once.
  paths.push({ name, key: found[0].replace(/\.\d+/g,'[]') });
}
const tally = new Map();
for (const row of paths) {
  if (!tally.has(row.key)) tally.set(row.key, []);
  tally.get(row.key).push(row.name);
}
for (const [key, names] of [...tally].sort((a,b)=>b[1].length-a[1].length).slice(0,25)) {
  console.log(String(names.length).padStart(3), key, ' e.g.', names.slice(0,3).join(', '));
}
console.log(`\n${paths.length} charts differ in their compiled Vega`);
