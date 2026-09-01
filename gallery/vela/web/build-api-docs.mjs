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
    //
    // Run from INSIDE the package. documentation.js takes the project name and
    // version from the nearest package.json, and from the repository root that
    // is Ranger's own -- the published API was headed "ranger-compiler 3.3.1"
    // instead of "vela-chart 1.0.0", which is the sort of thing that looks
    // deliberate to a reader.
    run: (dir, out) => npx(["documentation", "build", "vela_chart.js",
                            "-f", "html", "-o", out, "--shallow"], dir),
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
    probe: () => run("gradle", ["--version"]),
    // Dokka resolves the Kotlin toolchain and its own plugin from
    // mavenCentral, so this one needs the network as well as gradle.
    run: (dir) => run("gradle", ["dokkaHtml", "--no-daemon", "-q"], dir, 1800000),
    from: "build/dokka/html",
    entry: "index.html",
  },
  {
    id: "dart", label: "Dart", tool: "dartdoc",
    flag: "-l=dart", file: "vela_chart.dart", pkg: "vela_chart",
    home: "https://dart.dev/tools/dart-doc",
    // dartdoc documents `lib/` and nothing else: a package with the library at
    // its root reports "Initialized dartdoc with 0 libraries" and succeeds,
    // which is a green build that published nothing. So the source is compiled
    // INTO lib/ and the manifest lifted back to the package root, which is the
    // layout every Dart package has.
    into: "lib",
    lift: ["pubspec.yaml", "README.md"],
    extraFlags: ["-pubspec", "-description=The Vela chart API"],
    probe: () => run("dart", ["--version"]),
    run: (dir, out) => {
      const got = run("dart", ["pub", "get"], dir);
      if (!got.ok) return got;
      return run("dart", ["doc", "--output", out], dir, 1200000);
    },
    entry: "index.html",
  },
  // C# / DocFX is OUT of this pipeline for now. It ran on the runner, exited 0,
  // printed "0 error(s)" and produced `_site/api/*.html` with no
  // `_site/index.html` -- so `--require` failed the whole deploy over a page
  // nobody could see. The docfx.json the compiler writes has since been given
  // the index.md and toc.yml its `build` stage needs (see writeDocFxConfig in
  // ng_RangerApiDoc.rgr and the case in api-docs.test.ts), but nothing here
  // has run DocFX against it: the egress policy on the dev box blocks the
  // .NET download host, so it cannot be checked before it ships. Put the entry
  // back once a run has actually produced a site.
];

function run(cmd, args, cwd, timeout = 600000) {
  const r = spawnSync(cmd, args, {
    cwd: cwd ? path.join(ROOT, cwd) : ROOT, encoding: "utf-8", timeout,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}
const npx = (args, cwd) => run("npx", ["--no-install", ...args], cwd);

function compile(lang, dir) {
  const inner = lang.into ? `${dir}/${lang.into}` : dir;
  fs.mkdirSync(path.join(ROOT, inner), { recursive: true });
  execFileSync(process.execPath, [
    "--max-old-space-size=8192", "bin/output.js", lang.flag, SRC,
    `-d=${inner}`, `-o=${lang.file}`, "-nodecli",
    "-apidoc=docs", "-apipackage",
    `-name=${lang.pkg}`, "-version=1.0.0", "-license=MIT",
    ...(lang.extraFlags || []),
  ], {
    cwd: ROOT, encoding: "utf-8",
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    maxBuffer: 64 * 1024 * 1024,
  });
  // The manifest belongs at the package root even when the source went into
  // lib/, because that is where the tool looks for it.
  for (const f of (lang.lift || [])) {
    const from = path.join(ROOT, inner, f);
    if (fs.existsSync(from)) fs.renameSync(from, path.join(ROOT, dir, f));
  }
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyTree(a, b); else fs.copyFileSync(a, b);
  }
}

// Which third-party hosts will a reader's browser be sent to? Measured from
// the generated files rather than stated from memory: a hand-written note
// claiming Dokka's unpkg script was "the only external request" was already
// wrong by seven, because Dokka also pulls the JetBrains typefaces and
// dartdoc pulls Google Fonts.
//
// Only what the page FETCHES counts. `<a href="https://api.dart.dev/…">` is a
// cross-reference a reader may click, not a request their browser makes, and
// counting it would overstate the exposure as badly as missing the fonts
// understated it. So this matches the tags that fetch -- link, script, img --
// and `url(…)` inside stylesheets.
function externalHosts(dir) {
  const hosts = new Set();
  const add = (u) => {
    const m = /^https?:\/\/([a-z0-9.-]+)/i.exec(u);
    if (m) hosts.add(m[1].toLowerCase());
  };
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(html|css|js)$/.test(e.name)) continue;
      const text = fs.readFileSync(p, "utf-8");
      for (const m of text.matchAll(
        /<(?:link|script|img|iframe)\b[^>]*?\b(?:href|src)\s*=\s*["']([^"']+)/gi)) add(m[1]);
      for (const m of text.matchAll(/url\(\s*["']?(https?:[^)"']+)/gi)) add(m[1]);
      // @import in a stylesheet fetches too.
      for (const m of text.matchAll(/@import\s+["'](https?:[^"']+)/gi)) add(m[1]);
    }
  };
  walk(dir);
  return [...hosts].sort();
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
        ${r.hosts && r.hosts.length
            ? `<p class="ext">fetches from ${r.hosts.map(esc).join(", ")}</p>`
            : `<p class="ext">no third-party requests</p>`}
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
    const docsDir = path.join(ROOT, l.into ? `${dir}/${l.into}` : dir, "docs");
    for (const f of ["api.json", "api.md"]) {
      fs.copyFileSync(path.join(docsDir, f), path.join(langOut, f));
    }

    if (!l.probe().ok) {
      console.log(`${l.tool} is not installed — skipped`);
      results.push({ ...l, built: false, why: `${l.tool} is not on PATH here` });
      continue;
    }
    const siteTmp = path.join(ROOT, dir, "__site");
    const r = l.run(dir, siteTmp);
    const produced = l.from ? path.join(ROOT, dir, l.from) : siteTmp;
    // A tool that exits 0 and a tool that produces no page are different
    // failures and used to report the same way: DocFX exited 0, printed
    // "0 error(s)" and wrote no index.html, and the log said
    // `DocFX FAILED — 0 error(s)`, which names neither problem. The tail of
    // the real output goes to the log so the next one is diagnosable.
    const entryAt = path.join(produced, l.entry);
    const missing = !fs.existsSync(entryAt);
    if (!r.ok || missing) {
      const tail = r.out.trim().split("\n").filter((x) => x.trim()).slice(-8);
      const what = !r.ok
        ? `exited non-zero`
        : `exited 0 but wrote no ${l.entry} in ${l.from || "__site"}/`;
      console.log(`${l.tool} FAILED — ${what}`);
      for (const line of tail) console.log(`      | ${line.slice(0, 160)}`);
      fs.writeFileSync(path.join(langOut, "toolchain.log"), r.out);
      results.push({ ...l, built: false, why: `${l.tool} ${what}` });
      continue;
    }
    copyTree(produced, langOut);
    const { pages, kb } = countFiles(langOut);
    // An entry file alone is not a site, but "how many pages is enough" is a
    // per-tool question and not a floor: documentation.js writes ONE page for
    // the whole API and pdoc writes two, while DocFX splits every type out.
    // So each language says what its own output must contain, and only where
    // there is something to say. A blanket minimum fails the single-page
    // tools; no check at all is how DocFX published `_site/api/*.html` with
    // no root page and called it success.
    const v = l.verify ? l.verify(langOut) : null;
    if (v && !v.ok) {
      console.log(`${l.tool} FAILED — ${v.why}`);
      results.push({ ...l, built: false, why: `${l.tool} ${v.why}` });
      continue;
    }
    const hosts = externalHosts(langOut);
    console.log(`${l.tool.padEnd(16)} ${String(pages).padStart(4)} pages, ${kb} KB`);
    results.push({ ...l, built: true, pages, kb, hosts });
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
