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
fs.mkdirSync(TOOLS, { recursive: true });

process.stdout.write("Compiling EVG tools...\n");
compile("./gallery/pdf_writer/src/tools/evg_pdf_tool.rgr", "evg_pdf_tool.js");
compile("./gallery/pdf_writer/src/tools/evg_png_tool.rgr", "evg_png_tool.js");
compile("./gallery/pdf_writer/src/tools/evg_html_tool.rgr", "evg_html_tool.js");

const entries = [];
const allWarnings = [];

for (const page of PAGES) {
  for (const theme of THEMES) {
    const stem = `${page.id}-${theme.id}`;
    process.stdout.write(`  ${stem}\n`);
    const png = `${stem}.png`;
    const pdf = `${stem}.pdf`;
    const html = `${stem}.html`;
    allWarnings.push(...render("evg_png_tool.js", page.id, theme.id, path.join(OUT, png)));
    allWarnings.push(...render("evg_pdf_tool.js", page.id, theme.id, path.join(OUT, pdf)));
    allWarnings.push(...render("evg_html_tool.js", page.id, theme.id, path.join(OUT, html)));
    entries.push({ page: page.id, theme: theme.id, png, pdf, html });
  }
  // Source, served as text so the gallery can link to what produced the page.
  fs.copyFileSync(
    path.join(HERE, "pages", `${page.id}.tsx`),
    path.join(OUT, "pages", `${page.id}.tsx.txt`)
  );
}
fs.copyFileSync(CSS, path.join(OUT, "showcase.css.txt"));

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
