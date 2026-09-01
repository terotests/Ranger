// The Vela chart API, published with each platform's OWN documentation tool.
//
//   node gallery/vela/web/build-api-docs.mjs --out _site/vela/api
//
// WHAT THIS IS
// ------------
// `-apidoc -apipackage` writes, per target, the package that ecosystem expects:
// a package.json whose `docs` script calls documentation.js, a pyproject.toml
// and a module carrying `__docformat__ = "google"` for pdoc, a
// build.gradle.kts with the Dokka plugin. This step then runs those tools.
//
// That is the point, and it is the test PLAN_API_DOCS.md 7.3 sets: the target's
// own tool reads Ranger's output with no Ranger-specific plugin. A page built
// by a renderer of ours would prove nothing about that -- it would only prove
// we can render our own JSON. These pages are built by documentation.js, pdoc
// and Dokka, so the site IS the evidence.
//
// EVERY LANGUAGE IS INDEPENDENTLY OPTIONAL
// ----------------------------------------
// A tool that is not installed is reported and skipped; the index says so on
// the page rather than quietly showing fewer tabs. `--require` turns that into
// a failure for CI, where a silently missing toolchain would publish a smaller
// site than intended and nobody would notice.
import { execFileSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = "gallery/vela/src/VlChart.rgr";
const WORK = "tmp/vela-apidoc";

const LANGS = [
  {
    id: "javascript", label: "JavaScript", tool: "documentation.js",
    flag: "-es6", file: "vela_chart.js", pkg: "vela-chart",
    home: "https://documentation.js.org/",
    probe: () => npx(["documentation", "--version"]),
    // -f html writes a directory; the package.json this pipeline emits names
    // the same command in its own `docs` script.
    run: (dir, out) => npx(["documentation", "build", path.join(dir, "vela_chart.js"),
                            "-f", "html", "-o", out, "--shallow"]),
    entry: "index.html",
  },
  {
    id: "python", label: "Python", tool: "pdoc",
    flag: "-l=python", file: "vela_chart.py", pkg: "vela-chart",
    home: "https://pdoc.dev/",
    probe: () => run("pdoc", ["--version"]),
    run: (dir, out) => run("pdoc", ["-o", out, "vela_chart.py"], dir),
    entry: "vela_chart.html",
  },
  {
    id: "kotlin", label: "Kotlin", tool: "Dokka",
    flag: "-l=kotlin", file: "vela_chart.kt", pkg: "vela.chart",
    home: "https://kotl.in/dokka",
    // Dokka's pages load the Kotlin Playground from unpkg.com for the "Run"
    // button on samples. It is the only external request any of these three
    // tools makes, and a published site should say so rather than make it
    // quietly.
    external: "unpkg.com (Kotlin Playground, for the Run button on samples)",
    probe: () => run("gradle", ["--version"]),
    // Dokka resolves the Kotlin toolchain and its own plugin from
    // mavenCentral, so this one needs the network as well as gradle.
    run: (dir) => run("gradle", ["dokkaHtml", "--no-daemon", "-q"], dir, 1800000),
    from: "build/dokka/html",
    entry: "index.html",
  },
];

function run(cmd, args, cwd, timeout = 600000) {
  const r = spawnSync(cmd, args, {
    cwd: cwd ? path.join(ROOT, cwd) : ROOT, encoding: "utf-8", timeout,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}
const npx = (args) => run("npx", ["--no-install", ...args]);

function compile(lang, dir) {
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  execFileSync(process.execPath, [
    "--max-old-space-size=8192", "bin/output.js", lang.flag, SRC,
    `-d=${dir}`, `-o=${lang.file}`, "-nodecli",
    "-apidoc=docs", "-apipackage",
    `-name=${lang.pkg}`, "-version=1.0.0", "-license=MIT",
  ], {
    cwd: ROOT, encoding: "utf-8",
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    maxBuffer: 64 * 1024 * 1024,
  });
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyTree(a, b); else fs.copyFileSync(a, b);
  }
}

function countFiles(dir) {
  let n = 0, bytes = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) { n++; bytes += fs.statSync(p).size; }
    }
  };
  walk(dir);
  return { pages: n, kb: Math.round(bytes / 1024) };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function indexPage(results) {
  const built = results.filter((r) => r.built);
  const cards = results.map((r) => r.built
    ? `<a class="card ok" href="${r.id}/${r.entry}">
        <h2>${esc(r.label)}</h2>
        <p class="tool">built by <strong>${esc(r.tool)}</strong></p>
        <p class="num">${r.pages} page${r.pages === 1 ? "" : "s"} · ${r.kb} KB</p>
        <p class="art">artifacts: <span>api.json</span> <span>api.md</span></p>
        ${r.external ? `<p class="ext">loads ${esc(r.external)}</p>` : ""}
       </a>`
    : `<div class="card off">
        <h2>${esc(r.label)}</h2>
        <p class="tool">${esc(r.tool)} <strong>not run</strong></p>
        <p class="num">${esc(r.why)}</p>
        <p class="art">the pipeline's own artifacts are still here:
          <a href="${r.id}/api.json">api.json</a> · <a href="${r.id}/api.md">api.md</a></p>
       </div>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vela chart API — built by each platform's own tool</title>
<style>
 :root{color-scheme:light dark;--bg:#fff;--fg:#1a1a1a;--mut:#5a5a5a;--line:#e3e3e3;
  --card:#fafafa;--acc:#2b6cb0;--off:#9a9a9a}
 @media (prefers-color-scheme:dark){:root{--bg:#15171a;--fg:#e8e8e8;--mut:#a2a2a2;
  --line:#2c2f34;--card:#1c1f23;--acc:#7fb0e6;--off:#777}}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--fg);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
 .wrap{max-width:900px;margin:0 auto;padding:2.5rem 1.25rem 4rem}
 h1{margin:0 0 .4rem;font-size:1.7rem;letter-spacing:-.01em}
 .sub{color:var(--mut);max-width:64ch;margin:0 0 2rem}
 .grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
 .card{display:block;text-decoration:none;color:inherit;background:var(--card);
  border:1px solid var(--line);border-radius:10px;padding:1.1rem 1.2rem}
 .card.ok:hover{border-color:var(--acc)}
 .card.off{opacity:.72}
 .card h2{margin:0 0 .3rem;font-size:1.1rem}
 .tool{margin:0 0 .5rem;color:var(--mut);font-size:.88rem}
 .card.ok .tool strong{color:var(--acc)}
 .num{margin:0 0 .6rem;color:var(--mut);font-size:.82rem}
 .art{margin:0;font-size:.75rem;color:var(--mut)}
 .art span,.art a{border:1px solid var(--line);border-radius:4px;padding:.05rem .3rem;
  margin-right:.25rem;color:var(--mut)}
 .art a{color:var(--acc);text-decoration:none}
 .ext{margin:.5rem 0 0;font-size:.72rem;color:var(--mut);font-style:italic}
 .note{margin:2rem 0 0;padding:1rem 1.1rem;border-left:3px solid var(--line);color:var(--mut);
  font-size:.88rem}
 code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
 a{color:var(--acc)}
</style></head><body><div class="wrap">
<h1>Vela chart API</h1>
<p class="sub">One API, published by <strong>each platform's own documentation
 tool</strong>. The compiler's <code>-apidoc -apipackage</code> pipeline writes the
 package each ecosystem expects — a <code>package.json</code> whose <code>docs</code>
 script calls documentation.js, a <code>pyproject.toml</code> and a module carrying
 <code>__docformat__&nbsp;=&nbsp;"google"</code>, a <code>build.gradle.kts</code> with the
 Dokka plugin — and those tools then build the pages below. Nothing here is
 rendered by Ranger, which is what makes the site evidence rather than a
 claim.</p>
<div class="grid">${cards}</div>
<p class="note">Generated from <code>gallery/vela/src/VlChart.rgr</code> by this
 commit's compiler. The examples in each page are Ranger functions that were
 compiled and type checked for that target and then rendered into the comment
 — see <code>PLAN_API_DOCS.md</code> §18. ${built.length} of ${results.length}
 toolchains ran here.</p>
</div></body></html>`;
}

function main() {
  const args = process.argv.slice(2);
  let out = "gallery/vela/web/dist/api";
  let require_ = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") out = args[++i];
    else if (args[i] === "--require") require_ = true;
  }
  const dest = path.isAbsolute(out) ? out : path.join(ROOT, out);
  fs.mkdirSync(dest, { recursive: true });

  const results = [];
  for (const l of LANGS) {
    const dir = `${WORK}/${l.id}`;
    fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
    process.stdout.write(`  ${l.label.padEnd(11)}`);
    compile(l, dir);

    // The pipeline's own artifacts go up whether or not the tool ran, so a
    // missing toolchain still leaves the API published in a readable form.
    const langOut = path.join(dest, l.id);
    fs.mkdirSync(langOut, { recursive: true });
    for (const f of ["api.json", "api.md"]) {
      fs.copyFileSync(path.join(ROOT, dir, "docs", f), path.join(langOut, f));
    }

    if (!l.probe().ok) {
      console.log(`${l.tool} is not installed — skipped`);
      results.push({ ...l, built: false, why: `${l.tool} is not on PATH here` });
      continue;
    }
    const siteTmp = path.join(ROOT, dir, "__site");
    const r = l.run(dir, siteTmp);
    const produced = l.from ? path.join(ROOT, dir, l.from) : siteTmp;
    if (!r.ok || !fs.existsSync(path.join(produced, l.entry))) {
      const why = (r.out.trim().split("\n").pop() || "no output").slice(0, 120);
      console.log(`${l.tool} FAILED — ${why}`);
      results.push({ ...l, built: false, why: `${l.tool} failed: ${why}` });
      continue;
    }
    copyTree(produced, langOut);
    const { pages, kb } = countFiles(langOut);
    console.log(`${l.tool.padEnd(16)} ${String(pages).padStart(4)} pages, ${kb} KB`);
    results.push({ ...l, built: true, pages, kb });
  }

  fs.writeFileSync(path.join(dest, "index.html"), indexPage(results));
  const built = results.filter((r) => r.built).length;
  console.log(`\n  ${built} of ${results.length} toolchains ran; wrote ${path.join(dest, "index.html")}`);
  if (require_ && built !== results.length) {
    console.error("  --require: a documentation toolchain was missing or failed");
    process.exit(1);
  }
}

main();
