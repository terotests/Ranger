import fs from 'fs'; import path from 'path';
const VELA='/home/user/Ranger/gallery/vela';
const vega=await import('vega'); const vl=await import('vega-lite');
function splitRow(line,sep){const out=[];let cell='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'){if(line[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;}else if(c==='"')q=true;else if(c===sep){out.push(cell);cell='';}else cell+=c;}out.push(cell);return out;}
function pd(text,sep){const L=text.split(/\r?\n/).filter(l=>l.length);const h=splitRow(L[0],sep);return L.slice(1).map(l=>{const c=splitRow(l,sep);const r={};h.forEach((k,i)=>{const v=c[i];r[k]=v===undefined||v===''?null:(v.trim()===''||isNaN(Number(v))?v:Number(v));});return r;});}
const VelaWeb=(function(){const s=fs.readFileSync(path.join(VELA,'bin','vela_web.js'),'utf8').replace(/^#![^\n]*\n/,'');return new Function('require',`${s}\n; return VelaWeb;`)(undefined);})();
function texts(svg){return [...svg.matchAll(/<text[^>]*opacity="0"[^>]*>[^<]*<|<text[^>]*>([^<]*)</g)].map(m=>m[1]).filter(x=>x!==undefined);}
for (const name of process.argv.slice(2)) {
  try {
    const spec=JSON.parse(fs.readFileSync(path.join(VELA,'tests/corpus/specs',name+'.vl.json'),'utf8'));
    (function inl(o){if(o&&typeof o==='object'){if(typeof o.url==='string'){const f=path.join(VELA,'tests/corpus/data',path.basename(o.url));const txt=fs.readFileSync(f,'utf8');const ty=(o.format&&o.format.type)||(o.url.endsWith('.csv')?'csv':o.url.endsWith('.tsv')?'tsv':'json');o.values=ty==='csv'?pd(txt,','):ty==='tsv'?pd(txt,'\t'):JSON.parse(txt);delete o.url;delete o.format;return;}for(const k of Object.keys(o))inl(o[k]);}})(spec);
    const view=new vega.View(vega.parse(vl.compile(spec).spec),{renderer:'none'});
    await view.runAsync();
    const R=texts(await view.toSVG());
    const r=JSON.parse(VelaWeb.render(JSON.stringify(spec),'UTC'));
    const M=r.ok?texts(r.svg):['REFUSED: '+(r.errors||[]).join(';')];
    const setR=new Set(R), setM=new Set(M);
    const onlyR=R.filter(x=>!setM.has(x)), onlyM=M.filter(x=>!setR.has(x));
    if (onlyR.length||onlyM.length) {
      console.log(name);
      console.log('   only ref :', JSON.stringify(onlyR.slice(0,10)));
      console.log('   only mine:', JSON.stringify(onlyM.slice(0,10)));
    } else console.log(name, ' (labels agree)');
  } catch(e){ console.log(name, 'ERR', String(e.message).slice(0,70)); }
}
