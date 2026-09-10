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
fs.writeFileSync(
  path.join(HERE, "..", "bin", "RealTrainerDemo.mjs"),
  "// Generated by web/build.mjs from RealTrainerDemo.cjs — do not edit.\n" +
    FS_STUB + "\n" +
    appSource +
    `\nexport { ${appNames.join(", ")} };\n`,
);

// A one-line re-export, so the page imports a path that is the same in the
// bundle and in the editor rather than reaching into ../bin.
fs.writeFileSync(
  path.join(HERE, "generated-host.js"),
  "// Generated by web/build.mjs — do not edit.\n" +
    // Named, never a namespace: see above. `EVGHostTextMeasurer` and
    // `EVGDefaultMeasurer` are the two classes the browser's text measurer
    // installs itself into (`gallery/evg/gl/evg-measure.js`).
    'export { RealTrainerDemo, EVGHostTextMeasurer, EVGDefaultMeasurer } from "../bin/RealTrainerDemo.mjs";\n',
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

await esbuild.build({
  entryPoints: [path.join(HERE, "main.js")],
  bundle: true,
  format: "esm",
  minify: MINIFY,
  outfile: path.join(HERE, "bundle.js"),
  plugins: [noFilesystem],
  logLevel: "info",
});
// The same page with the engine in a Worker (`?engine=worker`): the host that
// paints, and the worker that holds the app. Two bundles, because a Worker is
// its own script; the generated module is in the worker's and not the host's.
await esbuild.build({
  entryPoints: [path.join(HERE, "main-worker.js")],
  bundle: true,
  format: "esm",
  minify: MINIFY,
  outfile: path.join(HERE, "bundle-worker.js"),
  plugins: [noFilesystem],
  logLevel: "info",
});
await esbuild.build({
  entryPoints: [path.join(HERE, "engine-worker.js")],
  bundle: true,
  format: "esm",
  minify: MINIFY,
  outfile: path.join(HERE, "worker-bundle.js"),
  plugins: [noFilesystem],
  logLevel: "info",
});

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(path.join(HERE, "bundle.js"), path.join(OUT, "bundle.js"));
  fs.copyFileSync(path.join(HERE, "bundle-worker.js"), path.join(OUT, "bundle-worker.js"));
  fs.copyFileSync(path.join(HERE, "worker-bundle.js"), path.join(OUT, "worker-bundle.js"));
  fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
  fs.copyFileSync(path.join(HERE, "seed.json"), path.join(OUT, "seed.json"));
  console.log(`  wrote ${path.relative(process.cwd(), OUT)}/index.html and bundle.js`);
}
