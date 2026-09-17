/**
 * dev — the showcase feedback loop, for changing a page or a theme.
 *
 *   node gallery/evg/showcase/dev.mjs cards
 *   node gallery/evg/showcase/dev.mjs cards -t studio -f png,html
 *   node gallery/evg/showcase/dev.mjs cards --watch
 *
 * WHY THIS EXISTS. `build.mjs` renders every page in every theme to four
 * targets, and it compiles the four Ranger tools first and DELETES them when
 * it is done (build.mjs, `fs.rmSync(TOOLS)`). Measured in a clean container:
 *
 *     compile one tool from .rgr ......... 6.3 s   (x4, then discarded)
 *     render one page to PNG ............. 0.9 s
 *     node start + parse of the tool ..... 0.06 s
 *     the whole showcase ................. 76 s
 *
 * A page's `.tsx` and a theme's `.css` are DATA that an already-compiled tool
 * reads at run time. Changing them cannot change the tool. So the 31 s of
 * compiling is not work, it is a cache that was thrown away, and the other
 * 45 s is 125 renders of pages that did not change.
 *
 * This keeps the tools in `.devcache/`, keyed on a hash of each tool's whole
 * transitive `Import` closure plus the compiler's own bundle. Edit a page or a
 * stylesheet and nothing recompiles; edit a `.rgr` under the closure and only
 * the tools that actually include it do. Then it renders the one page you
 * named, in one theme, to the targets you asked for.
 *
 * The result is the same pixels `build.mjs` produces — it shells out to the
 * same tools with the same arguments. It is the scheduling that differs.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, compileCached } from "./toolcache.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The four targets, and the tool that renders each. */
const TARGETS = {
  png: { tool: "evg_png_tool", src: "gallery/pdf_writer/src/tools/evg_png_tool.rgr", ext: "png", extra: [] },
  pdf: { tool: "evg_pdf_tool", src: "gallery/pdf_writer/src/tools/evg_pdf_tool.rgr", ext: "pdf", extra: [] },
  html: { tool: "evg_html_tool", src: "gallery/pdf_writer/src/tools/evg_html_tool.rgr", ext: "html", extra: ["-embed"] },
  json: { tool: "evg_displaylist_tool", src: "gallery/pdf_writer/src/tools/evg_displaylist_tool.rgr", ext: "json", extra: [] },
};

/**
 * Stylesheets a page needs beyond the gallery's own, in cascade order. Kept in
 * step with build.mjs `PAGE_CSS` — a page rendered without its defaults comes
 * out in the wrong colours and looks like an engine bug.
 */
const PAGE_CSS = {
  charts: ["charts-default.css"],
  chart_api: ["chart_api-default.css"],
  plots: ["plots-default.css"],
  more: ["more-default.css"],
  views: ["views-default.css"],
  variants: ["variants-default.css"],
  tables: ["tables-default.css"],
  drawing: ["drawing-default.css"],
};

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
function flag(...names) {
  for (const n of names) {
    const i = argv.indexOf(n);
    if (i >= 0) return argv.splice(i, 2)[1];
  }
  return null;
}
function bool(...names) {
  let found = false;
  for (const n of names) {
    const i = argv.indexOf(n);
    if (i >= 0) { argv.splice(i, 1); found = true; }
  }
  return found;
}

const watch = bool("--watch", "-w");
const force = bool("--force");
const quiet = bool("--quiet", "-q");
const listPages = bool("--list");
const theme = flag("--theme", "-t") || "editorial";
const formats = (flag("--formats", "-f") || "png").split(",").map((s) => s.trim()).filter(Boolean);
const outDir = path.resolve(flag("--out", "-o") || path.join(HERE, "dist-dev"));
const page = argv[0];

const PAGES = fs.readdirSync(path.join(HERE, "pages"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort();

if (listPages) {
  process.stdout.write(PAGES.join("\n") + "\n");
  process.exit(0);
}

if (!page || argv.includes("-h") || argv.includes("--help")) {
  process.stderr.write(`usage: node gallery/evg/showcase/dev.mjs <page> [options]

  -t, --theme <id>       editorial (default), studio, autumn, or any theme id
  -f, --formats <list>   png (default), pdf, html, json — comma separated
  -o, --out <dir>        output directory (default: showcase/dist-dev)
  -w, --watch            re-render when the page or any stylesheet changes
      --force            recompile the tools even on a cache hit
      --list             print the page ids and exit
  -q, --quiet            only print the output paths

pages: ${PAGES.join(" ")}
`);
  process.exit(1);
}

if (!PAGES.includes(page)) {
  process.stderr.write(`dev: no such page '${page}'. Known pages:\n  ${PAGES.join("\n  ")}\n`);
  process.exit(1);
}

for (const f of formats) {
  if (!TARGETS[f]) {
    process.stderr.write(`dev: no such target '${f}'. Known: ${Object.keys(TARGETS).join(", ")}\n`);
    process.exit(1);
  }
}

// ------------------------------------------------------------- the tool cache

/** The compiled tool for a target, from `.devcache/` when the sources match. */
function toolFor(target) {
  const { tool, src } = TARGETS[target];
  return compileCached(src, tool, { force });
}

// ----------------------------------------------------------------- rendering

function sheetsFor(id) {
  return [
    ...(PAGE_CSS[id] || []).map((f) => path.join(HERE, "themes", f)),
    path.join(HERE, "themes/showcase.css"),
  ];
}

function renderOne(target) {
  const spec = TARGETS[target];
  const { path: toolPath, cached, ms } = toolFor(target);
  if (!cached && !quiet) process.stdout.write(`  compiled ${spec.tool} (${(ms / 1000).toFixed(1)}s)\n`);

  const outFile = path.join(outDir, `${page}-${theme}.${spec.ext}`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const args = [
    toolPath,
    path.join(HERE, "pages", `${page}.tsx`),
    outFile,
    ...sheetsFor(page).flatMap((s) => ["-css", s]),
    "-theme", theme,
    ...spec.extra,
  ];
  const t0 = Date.now();
  const log = execFileSync("node", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });
  const warnings = log.split("\n").filter((l) => /warning:/i.test(l)).map((l) => l.trim());
  return { outFile, ms: Date.now() - t0, warnings };
}

function renderAll() {
  const t0 = Date.now();
  const results = [];
  for (const f of formats) {
    try {
      results.push(renderOne(f));
    } catch (e) {
      process.stderr.write(`dev: ${f}: ${e.message}\n`);
      return null;
    }
  }
  const seen = new Set();
  for (const r of results) {
    process.stdout.write(quiet ? `${r.outFile}\n` : `  ${path.relative(process.cwd(), r.outFile)}  ${r.ms}ms\n`);
    for (const w of r.warnings) if (!seen.has(w)) { seen.add(w); }
  }
  if (seen.size && !quiet) {
    process.stdout.write(`  engine warnings:\n`);
    for (const w of seen) process.stdout.write(`    ${w}\n`);
  }
  if (!quiet) process.stdout.write(`  ${page} / ${theme} in ${((Date.now() - t0) / 1000).toFixed(2)}s\n`);
  return results;
}

if (!quiet) process.stdout.write(`dev: ${page} / ${theme} -> ${formats.join(", ")}\n`);
renderAll();

// --------------------------------------------------------------------- watch

if (watch) {
  // The page's own source and every stylesheet that can reach it. A theme is
  // shared, so a change to showcase.css re-renders whatever page is loaded.
  const watched = [path.join(HERE, "pages"), path.join(HERE, "themes")];
  let timer = null;
  const bounce = (file) => {
    if (file && !/\.(tsx|css)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      process.stdout.write(`\ndev: ${file || "change"} —\n`);
      renderAll();
    }, 60);
  };
  for (const dir of watched) fs.watch(dir, { persistent: true }, (_e, f) => bounce(f));
  process.stdout.write(`\ndev: watching pages/ and themes/ — ctrl-c to stop\n`);
}
