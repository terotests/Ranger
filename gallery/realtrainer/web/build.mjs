// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Bundle the demo page.
//
//   node gallery/realtrainer/web/build.mjs
//
// The stylesheet is generated into a module rather than fetched, so the page
// and the headless check style the tree from exactly the same text and cannot
// drift. esbuild comes from the conformance reference host, so there is one
// install for gallery/ui's playground, its gates and this.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { assertDomInstalled, MissingDomDeps } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// `--out DIR` writes the page for the site: index.html and the bundle beside
// it, and nothing else — the page loads one script. Without it the bundle
// lands here, where `rt:web` serves it.
const argv = process.argv.slice(2);
const outFlag = argv.indexOf("--out");
const OUT = outFlag >= 0 ? path.resolve(argv[outFlag + 1]) : null;
const DOM_DIR = path.join(HERE, "..", "..", "ui", "conformance", "dom");
const domRequire = createRequire(path.join(DOM_DIR, "package.json"));

if (!fs.existsSync(path.join(HERE, "..", "bin", "RealTrainerDemo.cjs"))) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}

// THE FIRST PICTURE MUST BE CURRENT. `index.html` carries a picture of the
// app's chrome computed by `snapshot.mjs`, and a page that paints a stale one
// replaces a flash with a subtler flash. So the build refuses rather than
// shipping a picture of an app that no longer looks like that.
const stale = spawnSync(process.execPath, [path.join(HERE, "snapshot.mjs"), "--check"], {
  stdio: ["ignore", "pipe", "pipe"],
});
if (stale.status !== 0) {
  process.stderr.write(stale.stderr.toString() || "");
  console.error("the baked first picture is stale — run `npm run rt:shot:sync`");
  process.exit(3);
}

let esbuild;
try {
  assertDomInstalled();
  esbuild = domRequire("esbuild");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

// THE COMPILED APP, AS AN ES MODULE — which is what lets the bundler throw
// away what the page cannot reach.
//
// The Ranger backend writes CommonJS: 359 class declarations and a tail of
// `module.exports.X = X`. A bundler must keep every one of those, because a
// CommonJS namespace is a runtime object and it cannot know what will be
// asked of it. Restate the same tail as one `export { … }` and the classes
// become ES module bindings, whose reachability is a STATIC question: esbuild
// answers it from the code, not from a profile of one run, and drops what
// nothing references. That is why this is a rewrite of the export list and
// nothing else — no reordering, no renaming, no filtering by hand.
//
// The page must then import the classes it wants BY NAME. A namespace import
// (`import * as RT`) asks for all of them and undoes the whole thing.
const APP_CJS = path.join(HERE, "..", "bin", "RealTrainerDemo.cjs");
const EXPORT_LINE = /^module\.exports\.([A-Za-z0-9_$]+) = ([A-Za-z0-9_$]+);$/;
const appNames = [];
const appBody = [];
for (const line of fs.readFileSync(APP_CJS, "utf8").split("\n")) {
  const m = EXPORT_LINE.exec(line);
  if (!m) {
    // Anything else touching `module.exports` would mean the backend's output
    // is no longer the shape this rewrite assumes, and a silent guess here
    // would produce a module that is quietly missing a class.
    if (line.includes("module.exports")) {
      console.error(`build.mjs: unexpected CommonJS in the compiled app: ${line.trim()}`);
      process.exit(3);
    }
    appBody.push(line);
    continue;
  }
  if (m[1] !== m[2]) {
    console.error(`build.mjs: the compiled app exports ${m[2]} as ${m[1]} — this rewrite assumes they match`);
    process.exit(3);
  }
  appNames.push(m[1]);
}

// AND NO `require`. The compiled app asks `require("fs")` in exactly one
// place — the text engine looking for font FILES, which a browser does not
// have. One CommonJS call in an ES module is enough for esbuild to treat the
// whole file as having CommonJS features and wrap it in a lazy initialiser,
// and a wrapped module is one blob: nothing inside it can be dropped. So the
// call becomes a reference to a stub declared here, which is the same answer
// the bundler's `no-filesystem` plugin gives and is what makes the module
// analysable.
const FS_STUB = [
  "const __rgr_no_fs = {",
  "  existsSync: () => false,",
  "  readFileSync: () => { throw new Error('no filesystem in the browser'); },",
  "  readdirSync: () => [],",
  "};",
].join("\n");
const appSource = appBody
  .join("\n")
  .split('require("fs")')
  .join("__rgr_no_fs")
  .split("require('fs')")
  .join("__rgr_no_fs");
if (appSource.includes("require(")) {
  console.error("build.mjs: the compiled app still calls require() — see the note above");
  process.exit(3);
}

// --- TWO MODULES, BECAUSE A CHUNK IS A MODULE ------------------------------
//
// A bundler splits at module boundaries, not at class boundaries. The whole
// compiled app is ONE file, so however carefully the app avoids naming Vela's
// compiler, a late `import()` of a module that reaches into that file pulls
// the file — and with it the app — into the same chunk. Nothing is deferred
// and the only sign is that the chunk is the size of everything.
//
// So the file is cut in two here, along the seam the app already declares
// (`RtCharts.rgr`): everything reachable from `RtVelaChartMaker` and from
// nothing the page needs to draw a frame goes into a second module, which
// imports what it needs from the first. Then the late `import()` is an import
// of a real module and the chunk is a real chunk.
//
// The cut is computed, not listed. What is listed is the ROOTS — the classes
// the page's entries name — and the cold root, which is the class the seam
// was cut in front of.
const HOT_ROOTS = ["RealTrainerDemo", "EVGHostTextMeasurer", "EVGDefaultMeasurer", "RtCharts", "RtChartMaker"];
const COLD_ROOTS = ["RtVelaChartMaker"];

// One block per class: its declaration and the static assignments that follow
// it, which belong to it and must travel with it.
const blocks = new Map();
const nameOf = /^class ([A-Za-z0-9_$]+)/;
let preamble = [];
let current = null;
for (const line of appSource.split("\n")) {
  const m = nameOf.exec(line);
  if (m) {
    current = { name: m[1], lines: [] };
    blocks.set(m[1], current);
  }
  (current ? current.lines : preamble).push(line);
}
const classNames = new Set(blocks.keys());
for (const root of [...HOT_ROOTS, ...COLD_ROOTS]) {
  if (!classNames.has(root)) {
    console.error(`build.mjs: the compiled app has no class ${root} — the seam moved`);
    process.exit(3);
  }
}

// What each class names. Identifiers only, and over-inclusion is safe: a name
// that appears in a comment or a string keeps a class that could have gone,
// never drops one that was needed.
const refs = new Map();
for (const [name, b] of blocks) {
  const found = new Set();
  for (const m of b.lines.join("\n").matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    if (m[0] !== name && classNames.has(m[0])) found.add(m[0]);
  }
  refs.set(name, found);
}
const closure = (roots) => {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const n = queue.pop();
    if (seen.has(n) || !blocks.has(n)) continue;
    seen.add(n);
    for (const r of refs.get(n)) queue.push(r);
  }
  return seen;
};
const hot = closure(HOT_ROOTS);
const cold = [...closure(COLD_ROOTS)].filter((n) => !hot.has(n));
const coldSet = new Set(cold);
// The invariant, checked rather than assumed: nothing the page needs may name
// anything in the cold half, or the bundler will pull it back in and the
// split will have been for nothing.
for (const name of hot) {
  for (const r of refs.get(name)) {
    if (coldSet.has(r)) {
      console.error(`build.mjs: ${name} is on the first-frame path and names ${r}, which was meant to be deferred`);
      process.exit(3);
    }
  }
}
// What the cold half needs from the hot one.
const coldNeeds = new Set();
for (const name of cold) {
  for (const r of refs.get(name)) if (!coldSet.has(r)) coldNeeds.add(r);
}

const BIN = path.join(HERE, "..", "bin");
const hotNames = appNames.filter((n) => !coldSet.has(n));
fs.writeFileSync(
  path.join(BIN, "RealTrainerDemo.mjs"),
  "// Generated by web/build.mjs from RealTrainerDemo.cjs — do not edit.\n" +
    FS_STUB + "\n" +
    preamble.join("\n") + "\n" +
    hotNames.filter((n) => blocks.has(n)).map((n) => blocks.get(n).lines.join("\n")).join("\n") +
    `\nexport { ${hotNames.join(", ")} };\n`,
);
fs.writeFileSync(
  path.join(BIN, "RealTrainerDemo.charts.mjs"),
  "// Generated by web/build.mjs — the deferred half. See the note there.\n" +
    (coldNeeds.size
      ? `import { ${[...coldNeeds].join(", ")} } from "./RealTrainerDemo.mjs";\n`
      : "") +
    cold.map((n) => blocks.get(n).lines.join("\n")).join("\n") +
    `\nexport { ${cold.join(", ")} };\n`,
);
console.log(`  the app: ${hotNames.length} classes on the first-frame path, ${cold.length} deferred behind RtCharts`);

// A one-line re-export, so the page imports a path that is the same in the
// bundle and in the editor rather than reaching into ../bin.
fs.writeFileSync(
  path.join(HERE, "generated-host.js"),
  "// Generated by web/build.mjs — do not edit.\n" +
    // Named, never a namespace: see above. `EVGHostTextMeasurer` and
    // `EVGDefaultMeasurer` are the two classes the browser's text measurer
    // installs itself into (`gallery/evg/gl/evg-measure.js`).
    'export { RealTrainerDemo, EVGHostTextMeasurer, EVGDefaultMeasurer, RtCharts }\n' +
    '  from "../bin/RealTrainerDemo.mjs";\n' +
    // …and NOT the deferred half. Re-exporting it from here would put a
    // static edge from the page's entry to the cold module and the bundler
    // would fold it back into the first download — which it did, and the only
    // symptom was a chunk the size of everything. `charts-chunk.js` reaches
    // it directly.
    "",
);
// The stylesheet AND the session's COMPACT source. Neither is fetched: the
// page and the headless check have to style and parse exactly the same text,
// and a browser has no filesystem to read the fixture from anyway.
fs.writeFileSync(
  path.join(HERE, "generated.js"),
  "// Generated by web/build.mjs — do not edit.\n" +
    "export const REALTRAINER_CSS = " +
    JSON.stringify(fs.readFileSync(path.join(HERE, "realtrainer.css"), "utf8")) +
    ";\n" +
    "export const REALTRAINER_COMPACT = " +
    JSON.stringify(
      fs.readFileSync(path.join(HERE, "..", "fixtures", "session.compact"), "utf8"),
    ) +
    ";\n" +
    // …and the plan-week machine, from the same file XState is measured on.
    "export const REALTRAINER_PLAN_MACHINE = " +
    JSON.stringify(
      fs.readFileSync(path.join(HERE, "..", "fixtures", "machines", "planDialog.machine.json"), "utf8"),
    ) +
    ";\n" +
    "export const REALTRAINER_CHAT_MACHINE = " +
    JSON.stringify(
      fs.readFileSync(path.join(HERE, "..", "fixtures", "machines", "chat.machine.json"), "utf8"),
    ) +
    ";\n",
);
// THE SEED IS NOT CODE. 407 KB of reference data — a year of it — used to be a
// string literal in the bundle, downloaded before the first byte of the app
// could run and parsed before the first pixel. It is a FILE now, fetched by
// the document's head in parallel with the bundle and applied when it lands,
// so the two downloads overlap instead of queueing and the page can paint
// without it if it is slow. See index.html and main.js.
fs.copyFileSync(
  path.join(HERE, "..", "fixtures", "reference", "seed.json"),
  path.join(HERE, "seed.json"),
);

// A browser has no filesystem, and the only thing in this bundle that asks for
// one is the text engine's search for font FILES. The honest answer there is
// NO — there is no file — and the renderer falls back to the same estimating
// measurer the Node check uses, which is what keeps the two pictures the same.
const noFilesystem = {
  name: "no-filesystem",
  setup(build) {
    build.onResolve({ filter: /^fs$/ }, () => ({ path: "fs", namespace: "stub-fs" }));
    build.onLoad({ filter: /.*/, namespace: "stub-fs" }, () => ({
      contents:
        "export const existsSync = () => false;\n" +
        "export const readFileSync = () => { throw new Error('no filesystem in the browser'); };\n" +
        "export const readdirSync = () => [];\n" +
        "export default { existsSync, readFileSync, readdirSync };\n",
      loader: "js",
    }));
  },
};

// MINIFIED. The generated app is machine-written and reads like it — long
// identifiers, one statement per line, every temporary named — and none of
// that survives to the browser usefully. What the page ships is the behaviour,
// and the source it is compiled from is a `.rgr` file in the repository, not
// this bundle. Property names are left alone by esbuild, which is what the
// Ranger objects and every check that reaches into them depend on.
const MINIFY = process.env.RT_NO_MINIFY !== "1";

// ONE BUILD, THREE ENTRIES, AND CHUNKS.
//
// `splitting` is not a size optimisation here, it is a correctness one. The
// chart compiler is loaded late (`charts-chunk.js`), and a separate esbuild
// pass would give that file its OWN copy of `RtCharts` — a second singleton,
// installed into, while the app kept asking the first one. Splitting is what
// makes the late import reach the same module instance the app is holding.
//
// The entry points are named so their outputs keep the names the page, the
// checks and the deployment already use.
// Last build's chunks, gone. Their names carry a content hash, so a rebuild
// writes new files beside the old ones and the directory fills with chunks
// nothing imports — which the page would not notice and the deployment would
// happily ship.
for (const f of fs.readdirSync(HERE)) {
  if (/^chunk-[A-Z0-9]+\.js$/.test(f)) fs.unlinkSync(path.join(HERE, f));
}

const result = await esbuild.build({
  entryPoints: {
    "bundle": path.join(HERE, "main.js"),
    "bundle-worker": path.join(HERE, "main-worker.js"),
    "worker-bundle": path.join(HERE, "engine-worker.js"),
  },
  bundle: true,
  format: "esm",
  splitting: true,
  minify: MINIFY,
  outdir: HERE,
  entryNames: "[name]",
  chunkNames: "chunk-[hash]",
  metafile: true,
  plugins: [noFilesystem],
  logLevel: "info",
});

// What was produced, so the copy below does not have to guess at hashed names
// and the deployment cannot ship a page whose chunk was left behind.
const produced = Object.keys(result.metafile.outputs).map((p) => path.basename(p));

// WHICH CHUNKS ARE DEFERRED, written down rather than inferred. A chunk that
// is only ever reached through `import()` is one the page can paint without;
// `shell-check.mjs` holds exactly those back at the server to prove it, and a
// deployment can check they were shipped. The bundler knows which they are —
// this only asks it.
const deferred = new Set();
for (const out of Object.values(result.metafile.outputs)) {
  for (const imp of out.imports || []) {
    if (imp.kind === "dynamic-import") deferred.add(path.basename(imp.path));
  }
}
fs.writeFileSync(
  path.join(HERE, "build-manifest.json"),
  JSON.stringify({ scripts: produced, deferred: [...deferred] }, null, 2) + "\n",
);

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of produced) {
    fs.copyFileSync(path.join(HERE, name), path.join(OUT, name));
  }
  fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
  fs.copyFileSync(path.join(HERE, "seed.json"), path.join(OUT, "seed.json"));
  fs.copyFileSync(path.join(HERE, "build-manifest.json"), path.join(OUT, "build-manifest.json"));
  console.log(`  wrote ${path.relative(process.cwd(), OUT)}/index.html and ${produced.length} scripts`);
}
