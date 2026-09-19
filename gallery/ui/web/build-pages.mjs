#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The UI gallery, assembled for the site.
//
//   node gallery/ui/web/build-pages.mjs --out DIR
//
// Two pages, the same relative layout the local server uses:
//
//   DIR/demo/   the tree-literal demos (dashboard, forms, calendar, …)
//   DIR/web/    Radix vs Ranger, the conformance playground
//   DIR/        a redirect that lands on demo/ and keeps ?demo= and the hash
//
// The pages are already bundled — this copies them. A relative link that
// works at gallery/ui/demo/index.html works here too, which is the whole
// reason the directories keep those names. Rewriting the JavaScript to sit
// at a prettier URL would make the published page a different page.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(HERE, "..");
const DEMO = path.join(UI, "demo");

const argv = process.argv.slice(2);
const outFlag = argv.indexOf("--out");
const OUT = outFlag >= 0 ? path.resolve(argv[outFlag + 1]) : null;
if (!OUT) {
  console.error("usage: node gallery/ui/web/build-pages.mjs --out DIR");
  process.exit(2);
}

function need(file, how) {
  if (!fs.existsSync(file) || !fs.statSync(file).size) {
    console.error(`${path.relative(process.cwd(), file)} missing — ${how}`);
    process.exit(3);
  }
}

need(path.join(DEMO, "bundle.js"), "run `npm run ui:demo:build && node gallery/ui/demo/build.mjs` first");
need(path.join(DEMO, "index.html"), "the demo page is gone");
need(path.join(HERE, "bundle.js"), "run `npm run ui:web:build` first");
need(path.join(HERE, "index.html"), "the playground page is gone");

function copyPage(fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });
  for (const name of ["index.html", "bundle.js"]) {
    fs.copyFileSync(path.join(fromDir, name), path.join(toDir, name));
  }
}

copyPage(DEMO, path.join(OUT, "demo"));
copyPage(HERE, path.join(OUT, "web"));

// /ui/ is the URL anyone will share. The pages themselves stay at /ui/demo/
// and /ui/web/ so their relative links are the same ones a developer follows
// on `npm run ui:web`. The search string is how the demo page picks a tab
// (`?demo=dashboard`); dropping it here would open the menubar every time.
const redirect = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ranger UI</title>
<meta http-equiv="refresh" content="0; url=demo/">
<link rel="canonical" href="demo/">
<script>location.replace("demo/" + location.search + location.hash);</script>
</head>
<body>
<p><a href="demo/">Open the UI gallery</a></p>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, "index.html"), redirect);

const kb = (rel) => Math.round(fs.statSync(path.join(OUT, rel)).size / 1024);
process.stdout.write(
  `  ${path.relative(process.cwd(), OUT)}  demo/ ${kb("demo/bundle.js")} kB, web/ ${kb("web/bundle.js")} kB\n`,
);
