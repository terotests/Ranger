/**
 * Build the EVG showcase: every page in every theme, rendered to PDF, PNG and
 * HTML, plus an index that puts them side by side.
 *
 *   node gallery/evg/showcase/build.mjs                       # -> showcase/dist
 *   node gallery/evg/showcase/build.mjs --out "$SITE/evg"     # for Pages
 *
 * The point of the gallery is that the pages carry no visual attributes at
 * all — they say what is on the page, and themes/showcase.css says how it
 * looks. Rendering the same tree under two themes and three targets is the
 * demonstration.
 *
 * Requires the Ranger compiler to be built (npm run compile).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");

const argv = process.argv.slice(2);
const outFlag = argv.indexOf("--out");
const OUT = outFlag >= 0 ? path.resolve(argv[outFlag + 1]) : path.join(HERE, "dist");
const TOOLS = path.join(OUT, ".tools");

/** Pages, in the order they appear in the gallery. */
const PAGES = [
  {
    id: "album",
    title: "Album spread",
    blurb:
      "grid-template-areas draws the spread as a picture of names, so a theme can rearrange it without touching the tree.",
    shows: ["grid-template-areas", "spans", "object-fit: cover", "gap"],
  },
  {
    id: "cards",
    title: "Cards on shared rows",
    blurb:
      "Three cards, three caption lengths, one baseline. Each card spans the deck's rows and declares grid-template-rows: subgrid, so the photo band and the caption band are shared.",
    shows: ["subgrid (rows)", "grid spans", "text wrapping"],
  },
  {
    id: "typography",
    title: "Type specimens",
    blurb:
      "Measured from the same TTF the page is painted with, kerned from the font's own GPOS pairs, and encoded so ä, — and “ ” survive the trip to PDF.",
    shows: ["real TTF metrics", "GPOS kerning", "align-items: baseline", "UTF-8 + WinAnsi"],
  },
  {
    id: "units",
    title: "Length units",
    blurb:
      "Five bars declared in five units, all the same length, because CSS pins them to the reference pixel. em follows the local font-size; rem stays with the root.",
    shows: ["px % em rem", "pt pc in mm cm"],
  },
  {
    id: "flex",
    title: "Flex",
    blurb:
      "Grow, shrink and basis; wrapping; and what a row does with what is left over. Every arrangement is a class.",
    shows: ["flex shorthand", "flex-shrink: 0", "justify-content", "flex-wrap"],
  },
  {
    id: "emoji",
    title: "Emoji",
    blurb:
      "Each specimen is several codepoints and one glyph, and only becomes that glyph if the whole cluster reaches the shaper together. The tinted rows use emoji-color, which exists because there are no inline spans to hang a second colour on.",
    shows: ["grapheme clusters", "GSUB ligatures", "Type0 / Identity-H", "emoji-color"],
  },
  {
    id: "boxmodel",
    title: "Box model",
    blurb:
      "Padding, per-side padding, borders, nesting and margins — the same geometry the browser-parity gate checks against Chromium.",
    shows: ["padding", "border", "margins", "nesting"],
  },
];

const THEMES = [
  { id: "editorial", label: "Editorial", note: "warm paper, serif display" },
  { id: "studio", label: "Studio", note: "dark, geometric sans" },
];

const CSS = path.join(HERE, "themes/showcase.css");

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 28,
    ...opts,
  });
}

/** Compile a Ranger tool. The compiler prints failures but still exits 0. */
function compile(src, outFile) {
  const log = sh("node", [
    "bin/output.js",
    "-es6",
    src,
    `-d=${path.relative(ROOT, TOOLS)}`,
    `-o=${outFile}`,
    "-nodecli",
  ], { env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr" } });
  if (log.includes("Compilation FAILED")) {
    process.stderr.write(log.split("\n").slice(-30).join("\n") + "\n");
    throw new Error(`compile failed: ${src}`);
  }
}

function render(tool, page, theme, outFile, extra = []) {
  const args = [
    path.join(TOOLS, tool),
    path.join(HERE, "pages", `${page}.tsx`),
    outFile,
    "-css",
    CSS,
    "-theme",
    theme,
    ...extra,
  ];
  const log = sh("node", args);
  const warnings = log
    .split("\n")
    .filter((l) => /warning:/i.test(l))
    .map((l) => l.trim());
  return warnings;
}

/** The WebGL viewer page. One canvas, one display list, the real faces. */
function viewerHtml(faceCss) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EVG on WebGL</title>
<style>
  ${faceCss}
  :root { color-scheme: light dark; }
  body { margin:0; background:#8b8f94; display:flex; flex-direction:column;
         align-items:center; gap:14px; padding:24px;
         font:14px/1.5 ui-sans-serif, system-ui, sans-serif; color:#fff }
  canvas { background:#fff; box-shadow:0 3px 22px rgba(0,0,0,.4); max-width:100%; height:auto }
  .bar { display:flex; gap:14px; align-items:baseline; flex-wrap:wrap; justify-content:center }
  a { color:#cfe4ff }
  code { background:rgba(0,0,0,.25); padding:1px 5px; border-radius:4px }
  #err { color:#ffd0d0; font:12px/1.4 monospace; white-space:pre-wrap; max-width:70ch }
</style>
</head>
<body>
  <div class="bar">
    <strong>EVG on WebGL</strong>
    <span id="stats" class="muted">loading…</span>
    <a href="../index.html">back to the gallery</a>
  </div>
  <canvas id="c"></canvas>
  <p class="bar">Same layout as the PDF — flex, grid, TTF metrics and kerning — drawn as GPU quads.
     Rounded corners come from a distance field in the fragment shader.</p>
  <p id="err"></p>
<script type="module">
import { renderDisplayList } from "./evg-webgl.js";
const list = new URLSearchParams(location.search).get("list") || "album-editorial.json";
const err = document.getElementById("err");
try {
  const doc = await (await fetch(list)).json();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.getElementById("c");
  c.style.width = doc.width + "px";
  c.width = Math.round(doc.width * dpr);
  c.height = Math.round(doc.height * dpr);
  const gl = c.getContext("webgl2", { antialias: true, premultipliedAlpha: false });
  if (!gl) throw new Error("This browser has no WebGL 2.");
  await document.fonts.ready;
  // A face nothing has used yet is not fetched until asked for by size.
  await Promise.all(doc.list.cmds.filter(x => x.text)
    .map(x => document.fonts.load(\`\${x.size}px "\${x.font}"\`).catch(() => {})));
  const s = renderDisplayList(gl, doc, { dpr });
  document.getElementById("stats").textContent =
    \`\${s.drawn} quads · \${s.textRuns} text runs\` + (s.skippedImages ? \` · \${s.skippedImages} images not yet drawn\` : "");
  window.__evgStats = s;
} catch (e) {
  err.textContent = String((e && e.stack) || e);
  window.__evgStats = { error: String(e) };
}
</script>
</body>
</html>
`;
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function indexHtml(entries, warnings) {
  const cards = PAGES.map((p) => {
    const shots = THEMES.map((t) => {
      const e = entries.find((x) => x.page === p.id && x.theme === t.id);
      return `
        <figure class="shot">
          <a href="${e.png}"><img src="${e.png}" alt="${esc(p.title)} — ${esc(t.label)}" loading="lazy"></a>
          <figcaption>
            <strong>${esc(t.label)}</strong> <span class="muted">${esc(t.note)}</span>
            <a class="dl" href="${e.pdf}">PDF</a>
            <a class="dl" href="${e.html}">HTML</a>
            <a class="dl" href="${e.gl}">WebGL</a>
          </figcaption>
        </figure>`;
    }).join("");
    return `
      <section class="page" id="${p.id}">
        <header>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.blurb)}</p>
          <ul class="tags">${p.shows.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          <p class="src"><a href="pages/${p.id}.tsx.txt">${p.id}.tsx</a> — no visual attributes; every rule is in <a href="showcase.css.txt">showcase.css</a></p>
        </header>
        <div class="shots">${shots}</div>
      </section>`;
  }).join("");

  const warnBlock = warnings.length
    ? `<section class="warnings"><h2>Engine warnings from this build</h2><pre>${esc(warnings.join("\n"))}</pre></section>`
    : `<section class="warnings"><h2>Engine warnings from this build</h2><p class="muted">None. Every declaration on every page was honoured.</p></section>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EVG showcase</title>
<style>
  :root {
    --bg: #ffffff; --fg: #1a1d21; --muted: #5c6672; --line: #e3e7ec;
    --accent: #2f6fd0; --card: #f7f9fb;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #12141a; --fg: #e8ecf1; --muted: #939eab; --line: #262b33;
            --accent: #6aa8ff; --card: #171b22; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg);
         font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 48px 24px 96px; }
  h1 { font-size: 2rem; margin: 0 0 .3em; letter-spacing: -.02em; }
  .lede { color: var(--muted); max-width: 62ch; margin: 0 0 8px; }
  .meta { color: var(--muted); font-size: .85rem; margin: 24px 0 0; }
  .page { border-top: 1px solid var(--line); padding-top: 32px; margin-top: 48px; }
  .page h2 { font-size: 1.25rem; margin: 0 0 .35em; }
  .page header p { color: var(--muted); max-width: 68ch; margin: 0 0 10px; }
  .tags { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0 0 10px; }
  .tags li { font-size: .72rem; letter-spacing: .02em; text-transform: uppercase;
             color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 9px; }
  .src { font-size: .85rem; }
  a { color: var(--accent); }
  .shots { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 18px; }
  .shot { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .shot img { display: block; width: 100%; height: auto; }
  figcaption { padding: 10px 12px; font-size: .85rem; border-top: 1px solid var(--line);
               display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .muted { color: var(--muted); }
  .dl { margin-left: auto; font-size: .78rem; border: 1px solid var(--line);
        border-radius: 6px; padding: 2px 8px; text-decoration: none; }
  .dl + .dl { margin-left: 0; }
  .warnings { border-top: 1px solid var(--line); padding-top: 32px; margin-top: 48px; }
  .warnings pre { background: var(--card); border: 1px solid var(--line); border-radius: 8px;
                  padding: 12px; overflow-x: auto; font-size: .8rem; }
  .note { background: var(--card); border: 1px solid var(--line); border-left: 3px solid var(--accent);
          border-radius: 8px; padding: 12px 14px; margin: 24px 0 0; font-size: .9rem; color: var(--muted); }
</style>
</head>
<body>
<div class="wrap">
  <h1>EVG showcase</h1>
  <p class="lede">
    EVG is the layout engine behind Ranger's PDF and image writers: a print-safe
    CSS subset — flex, grid, a stylesheet layer and real TrueType metrics —
    with no browser anywhere in the pipeline.
  </p>
  <p class="lede">
    Every page below is the same tree rendered under two themes and three
    targets. The <code>.tsx</code> files carry no colours, sizes or spacing:
    they say what is on the page, and one stylesheet says how it looks.
  </p>
  <p class="meta">Built from <code>gallery/evg/showcase</code>. PDF is the print target; PNG is the raster preview; HTML is the debug view.</p>

  ${cards}

  ${warnBlock}

  <div class="note">
    <strong>Known limits, visible here.</strong> The raster target decodes JPEGs
    with the repository's own decoder, which shows block artefacts — the PDF
    path embeds the original file untouched, so print output is unaffected.
  </div>
</div>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });
fs.mkdirSync(path.join(OUT, "gl", "fonts"), { recursive: true });
fs.mkdirSync(TOOLS, { recursive: true });

process.stdout.write("Compiling EVG tools...\n");
compile("./gallery/pdf_writer/src/tools/evg_pdf_tool.rgr", "evg_pdf_tool.js");
compile("./gallery/pdf_writer/src/tools/evg_png_tool.rgr", "evg_png_tool.js");
compile("./gallery/pdf_writer/src/tools/evg_html_tool.rgr", "evg_html_tool.js");
compile("./gallery/pdf_writer/src/tools/evg_displaylist_tool.rgr", "evg_displaylist_tool.js");

const entries = [];
const allWarnings = [];

for (const page of PAGES) {
  for (const theme of THEMES) {
    const stem = `${page.id}-${theme.id}`;
    process.stdout.write(`  ${stem}\n`);
    const png = `${stem}.png`;
    const json = `${stem}.json`;
    const pdf = `${stem}.pdf`;
    const html = `${stem}.html`;
    allWarnings.push(...render("evg_png_tool.js", page.id, theme.id, path.join(OUT, png)));
    allWarnings.push(...render("evg_pdf_tool.js", page.id, theme.id, path.join(OUT, pdf)));
    // The same page as draw commands, for the WebGL viewer.
    allWarnings.push(...render("evg_displaylist_tool.js", page.id, theme.id, path.join(OUT, "gl", json)));
    // -embed inlines the TTFs as data URIs. Without it the page references
    // font files by path, which resolves on the build machine and nowhere
    // else — the browser then falls back to a system face, wraps text where
    // EVG did not, and the absolutely-positioned boxes land on the headings.
    allWarnings.push(...render("evg_html_tool.js", page.id, theme.id, path.join(OUT, html), ["-embed"]));
    entries.push({ page: page.id, theme: theme.id, png, pdf, html, gl: `gl/view.html?list=${json}` });
  }
  // Source, served as text so the gallery can link to what produced the page.
  fs.copyFileSync(
    path.join(HERE, "pages", `${page.id}.tsx`),
    path.join(OUT, "pages", `${page.id}.tsx.txt`)
  );
}
fs.copyFileSync(CSS, path.join(OUT, "showcase.css.txt"));

// ---- WebGL viewer ---------------------------------------------------------
// The renderer itself, the faces it needs, and a page to put them together.
// Fonts are copied rather than linked: the published site has no access to the
// repository tree, and the whole point is that these are the same TTFs the
// layout was measured with.
fs.copyFileSync(path.join(ROOT, "gallery/evg/gl/evg-webgl.js"), path.join(OUT, "gl", "evg-webgl.js"));
const FONTS = path.join(ROOT, "gallery/pdf_writer/assets/fonts");
const FACES = [
  ["Cinzel", "Cinzel/Cinzel-Regular.ttf"],
  ["Cinzel-Bold", "Cinzel/Cinzel-Bold.ttf"],
  ["Noto Sans", "Noto_Sans/NotoSans-Regular.ttf"],
  ["Noto Sans-Bold", "Noto_Sans/NotoSans-Bold.ttf"],
  ["Josefin Sans", "Josefin_Sans/JosefinSans-Regular.ttf"],
  ["Josefin Sans-Bold", "Josefin_Sans/JosefinSans-Bold.ttf"],
];
const faceCss = [];
for (const [family, rel] of FACES) {
  const src = path.join(FONTS, rel);
  if (!fs.existsSync(src)) continue;
  const base = "fonts/" + path.basename(rel);
  fs.copyFileSync(src, path.join(OUT, "gl", base));
  faceCss.push(`@font-face{font-family:"${family}";src:url("${base}")}`);
}
fs.writeFileSync(path.join(OUT, "gl", "view.html"), viewerHtml(faceCss.join("\n  ")), "utf8");

const unique = [...new Set(allWarnings)];
fs.writeFileSync(path.join(OUT, "index.html"), indexHtml(entries, unique), "utf8");
fs.rmSync(TOOLS, { recursive: true, force: true });

process.stdout.write(
  `\nWrote ${entries.length * 3} files + index to ${path.relative(ROOT, OUT) || OUT}\n`
);
if (unique.length) {
  process.stdout.write(`Engine warnings (${unique.length}):\n`);
  for (const w of unique) process.stdout.write(`  ${w}\n`);
}
