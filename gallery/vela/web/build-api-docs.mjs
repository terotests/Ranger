// The Vela chart API, published as one page per language, from the compiler's
// own API pipeline.
//
//   node gallery/vela/web/build-api-docs.mjs --out _site/vela/api
//
// WHAT THIS IS
// ------------
// `-apidoc` writes api.json -- the API as a structure, language-neutral -- and
// the compiler writes the SOURCE for each target with that API's documentation
// in the form that ecosystem reads: JSDoc on JavaScript, a Google docstring on
// Python, KDoc on Kotlin. The structure is the same API; the rendering is not,
// and the rendering is the interesting half.
//
// So the page takes the index from api.json and the prose from the generated
// source, side by side, one tab per language. Nothing here re-renders a doc
// comment: what is shown is the exact text the compiler emitted, which is the
// only way the page can be evidence of anything.
//
// WHY NOT documentation.js / pdoc / Dokka
// ---------------------------------------
// Those are the right tools to POINT AT this output, and PLAN_API_DOCS.md 7.3
// makes "the target's own tool works on it with no Ranger plugin" the test that
// the output is real. They are the wrong tools to BUILD A PAGE with here: three
// of them means three toolchains in the Pages job, three site layouts, and a
// deploy that fails when one of them is missing. This needs node, which the job
// already has.
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = "gallery/vela/src/VlChart.rgr";

// The three were chosen for how differently they spell the same thing: a JSDoc
// block, an indented Google docstring, and KDoc. A fourth would say less.
const LANGS = [
  { id: "javascript", flag: "-es6",       ext: "js", label: "JavaScript", comment: "JSDoc" },
  { id: "python",     flag: "-l=python",  ext: "py", label: "Python",     comment: "Google docstring" },
  { id: "kotlin",     flag: "-l=kotlin",  ext: "kt", label: "Kotlin",     comment: "KDoc" },
];

function compile(lang, outDir) {
  fs.mkdirSync(path.join(ROOT, outDir), { recursive: true });
  execFileSync(process.execPath, [
    "--max-old-space-size=8192", "bin/output.js", lang.flag, SRC,
    `-d=${outDir}`, `-o=vela_chart.${lang.ext}`, "-nodecli",
    "-apidoc=docs", "-apiformat=json,markdown",
  ], {
    cwd: ROOT, encoding: "utf-8",
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const dir = path.join(ROOT, outDir);
  return {
    api: JSON.parse(fs.readFileSync(path.join(dir, "docs/api.json"), "utf-8")),
    source: fs.readFileSync(path.join(dir, `vela_chart.${lang.ext}`), "utf-8"),
  };
}

// The documented declarations of a generated file, in order: the comment block
// the compiler wrote and the line it belongs to. Deliberately dumb -- it reads
// the shapes these three writers actually emit and nothing else, because a
// half-clever parser that silently matches the wrong block would put one
// method's prose under another's name.
function extractDocs(lang, src) {
  const out = [];
  const lines = src.split("\n");
  if (lang.ext === "py") {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\s*)(?:class\s+(\w+)|def\s+(\w+)\s*\()/);
      if (!m) continue;
      const name = m[2] || m[3];
      let j = i + 1;
      if (m[3] && /^\s*$/.test(lines[j] || "")) j++;
      const q = (lines[j] || "").match(/^\s*"""/);
      if (!q) continue;
      const body = [];
      let first = lines[j].replace(/^\s*"""/, "");
      if (first.trim()) body.push(first.trim());
      for (j = j + 1; j < lines.length && !/"""\s*$/.test(lines[j]); j++) body.push(lines[j]);
      if (j < lines.length) {
        const tail = lines[j].replace(/"""\s*$/, "");
        if (tail.trim()) body.push(tail);
      }
      out.push({ name, kind: m[2] ? "class" : "member",
                 decl: lines[i].trim(), doc: dedent(body) });
    }
    return out;
  }
  // JavaScript and Kotlin: a `/** … */` block, then the declaration under it.
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\/\*\*\s*$/.test(lines[i])) continue;
    const body = [];
    let j = i + 1;
    for (; j < lines.length && !/^\s*\*\/\s*$/.test(lines[j]); j++) {
      body.push(lines[j].replace(/^\s*\*\s?/, ""));
    }
    let k = j + 1;
    while (k < lines.length && !lines[k].trim()) k++;
    const decl = (lines[k] || "").trim();
    if (!decl) continue;
    // `Class.method = function (…)` is how JavaScript receives a static, and
    // missing it dropped all eight of VlJson's constructors from that panel.
    const nm = decl.match(
      /(?:class|fun|internal fun)\s+(\w+)|^\w+\.(\w+)\s*=\s*function|^(\w+)\s*\(/);
    out.push({
      name: nm ? (nm[1] || nm[2] || nm[3]) : decl.split(/[\s(]/)[0],
      kind: /^(?:class|open class|sealed)/.test(decl) ? "class" : "member",
      decl, doc: dedent(body),
    });
    i = k;
  }
  return out;
}

function dedent(lines) {
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(cut)).join("\n");
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(langs, apiClasses) {
  const documented = apiClasses.filter((c) => c.documented);
  const publicCount = documented.filter((c) => c.public).length;
  // documented members only. Counting every method of a documented class said
  // 172 where the page shows 129, which is a number that describes nothing.
  const methodCount = documented.reduce(
    (n, c) => n + (c.methods || []).filter((m) => m.documented).length, 0);

  const tabs = langs.map((l, i) =>
    `<button class="tab${i === 0 ? " on" : ""}" data-lang="${l.id}">${esc(l.label)}` +
    `<span class="conv">${esc(l.comment)}</span></button>`).join("");

  const panels = langs.map((l, i) => {
    // Each language resolves through ITS OWN api.json. compiledName is
    // per-target -- Python declares `bin` as `_bin` because `bin` is a
    // builtin -- and looking one language's members up under another's names
    // silently dropped five Python cards.
    const own = new Map();
    for (const c of l.api.classes) {
      const mm = new Map();
      for (const m of (c.methods || [])) mm.set(m.name, m.compiledName || m.name);
      own.set(c.name, mm);
    }
    const byName = new Map();
    for (const d of l.docs) if (!byName.has(d.name + "/" + d.kind)) byName.set(d.name + "/" + d.kind, d);
    const sections = documented.map((c) => {
      const cd = byName.get(c.name + "/class");
      const members = (c.methods || []).filter((m) => m.documented).map((m) => {
        const local = (own.get(c.name) || new Map()).get(m.name) || m.compiledName || m.name;
        const d = byName.get(local + "/member");
        if (!d) return "";
        return `<article class="m"><h4><code>${esc(d.decl.replace(/\s*\{\s*$/, ""))}</code></h4>` +
               `<pre class="doc">${esc(d.doc)}</pre></article>`;
      }).join("");
      if (!members && !cd) return "";
      return `<section class="cls"><h3>${esc(c.name)}` +
        (c.public ? `<span class="badge pub">public</span>` : `<span class="badge int">internal</span>`) +
        `</h3>` +
        (cd ? `<pre class="doc cd">${esc(cd.doc)}</pre>` : "") + members + `</section>`;
    }).join("");
    return `<div class="panel${i === 0 ? " on" : ""}" data-lang="${l.id}">${sections}</div>`;
  }).join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vela chart API — one API, three languages</title>
<style>
 :root { color-scheme: light dark; --bg:#fff; --fg:#1a1a1a; --mut:#5a5a5a;
   --line:#e3e3e3; --card:#fafafa; --acc:#2b6cb0; --pub:#276749; --int:#7b7b7b; }
 @media (prefers-color-scheme: dark) { :root { --bg:#15171a; --fg:#e8e8e8;
   --mut:#a2a2a2; --line:#2c2f34; --card:#1c1f23; --acc:#7fb0e6; --pub:#68d391; --int:#8e8e8e; } }
 * { box-sizing:border-box }
 body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 -apple-system,
   BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
 header { padding:2rem 1.25rem 1rem; border-bottom:1px solid var(--line); }
 .wrap { max-width:960px; margin:0 auto; }
 h1 { margin:0 0 .35rem; font-size:1.6rem; letter-spacing:-.01em }
 .sub { color:var(--mut); margin:0 0 1rem; max-width:60ch }
 .stats { display:flex; gap:1.5rem; flex-wrap:wrap; color:var(--mut); font-size:.86rem; margin:0 0 1rem }
 .stats b { color:var(--fg) }
 .tabs { display:flex; gap:.5rem; flex-wrap:wrap }
 .tab { font:inherit; cursor:pointer; background:var(--card); color:var(--fg);
   border:1px solid var(--line); border-radius:8px; padding:.5rem .85rem; display:flex;
   flex-direction:column; align-items:flex-start; line-height:1.25 }
 .tab.on { border-color:var(--acc); box-shadow:inset 0 -2px 0 var(--acc) }
 .conv { font-size:.72rem; color:var(--mut) }
 main { padding:1.5rem 1.25rem 4rem }
 .panel { display:none } .panel.on { display:block }
 .cls { margin:0 0 2.25rem; padding:0 0 .5rem; border-bottom:1px solid var(--line) }
 h3 { font-size:1.15rem; margin:1.5rem 0 .5rem; display:flex; align-items:center; gap:.6rem }
 .badge { font-size:.68rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase;
   border:1px solid currentColor; border-radius:999px; padding:.05rem .45rem }
 .pub { color:var(--pub) } .int { color:var(--int) }
 .m { margin:.9rem 0 0; padding:.75rem .9rem; background:var(--card);
   border:1px solid var(--line); border-radius:8px }
 .m h4 { margin:0 0 .5rem; font-weight:600; font-size:.9rem }
 code, pre { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace }
 h4 code { color:var(--acc); font-size:.88rem }
 pre.doc { margin:0; white-space:pre-wrap; overflow-x:auto; font-size:.82rem;
   color:var(--mut); line-height:1.5 }
 pre.cd { margin:0 0 .5rem; padding:.6rem .8rem; background:var(--card);
   border:1px solid var(--line); border-radius:8px }
 footer { border-top:1px solid var(--line); padding:1.25rem; color:var(--mut); font-size:.82rem }
 a { color:var(--acc) }
</style></head><body>
<header><div class="wrap">
 <h1>Vela chart API</h1>
 <p class="sub">One API, documented three ways. The structure comes from the
 compiler's <code>-apidoc</code> pipeline; the prose under each declaration is
 the exact comment the compiler wrote for that language, not a re-rendering of
 a common source.</p>
 <p class="stats"><span><b>${documented.length}</b> documented classes</span>
  <span><b>${publicCount}</b> public</span>
  <span><b>${methodCount}</b> documented members</span>
  <span>generated from <b>gallery/vela/src/VlChart.rgr</b></span></p>
 <div class="tabs">${tabs}</div>
</div></header>
<main><div class="wrap">${panels}</div></main>
<footer><div class="wrap">Built by <code>gallery/vela/web/build-api-docs.mjs</code>
 from this commit's compiler. The examples in each comment are Ranger functions
 that were compiled and type checked for that target, then rendered into the
 comment — see <code>PLAN_API_DOCS.md</code> §18.</div></footer>
<script>
 for (const t of document.querySelectorAll('.tab')) {
   t.addEventListener('click', () => {
     for (const x of document.querySelectorAll('.tab')) x.classList.toggle('on', x === t);
     for (const p of document.querySelectorAll('.panel'))
       p.classList.toggle('on', p.dataset.lang === t.dataset.lang);
   });
 }
</script></body></html>`;
}

function main() {
  const args = process.argv.slice(2);
  let out = "gallery/vela/web/dist/api";
  for (let i = 0; i < args.length; i++) if (args[i] === "--out") out = args[++i];

  const langs = [];
  let apiClasses = null;
  for (const l of LANGS) {
    process.stdout.write(`  ${l.label.padEnd(11)}`);
    const { api, source } = compile(l, `tmp/vela-apidoc/${l.id}`);
    const docs = extractDocs(l, source);
    if (docs.length === 0) throw new Error(`no documentation extracted for ${l.label}`);
    langs.push({ ...l, docs, api });
    apiClasses = apiClasses || api.classes;
    console.log(`${String(docs.length).padStart(4)} documented declarations`);
  }

  const dir = path.isAbsolute(out) ? out : path.join(ROOT, out);
  fs.mkdirSync(dir, { recursive: true });
  const html = render(langs, apiClasses);
  fs.writeFileSync(path.join(dir, "index.html"), html);
  // The artifacts themselves, beside the page, so the pipeline's own output is
  // downloadable rather than only rendered.
  for (const l of langs) {
    const from = path.join(ROOT, `tmp/vela-apidoc/${l.id}/docs`);
    const to = path.join(dir, l.id);
    fs.mkdirSync(to, { recursive: true });
    for (const f of ["api.json", "api.md"]) fs.copyFileSync(path.join(from, f), path.join(to, f));
  }
  console.log(`\n  wrote ${path.join(dir, "index.html")} (${(html.length / 1024).toFixed(0)} KB)`);
}

main();
