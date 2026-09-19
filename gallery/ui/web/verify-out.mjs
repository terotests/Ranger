#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WHAT THE DEPLOYMENT IS ABOUT TO SERVE.
//
//   node gallery/ui/web/verify-out.mjs <dir>
//
// A page whose bundle failed to copy looks exactly like a page whose bundle
// failed to compile, and both look fine until someone opens them. The build
// script copies two directories; this holds the artifact to the files a
// visitor will actually load, and to strings the programs themselves contain
// — not identifiers a minifier would rename, because these bundles are not
// minified.

import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: verify-out.mjs <dir>");
  process.exit(2);
}

const fail = (why) => {
  console.error(`the built page is wrong: ${why}`);
  process.exit(1);
};

const read = (rel) => {
  const file = path.join(dir, rel);
  if (!fs.existsSync(file)) fail(`${rel} missing`);
  const body = fs.readFileSync(file, "utf8");
  if (!body.length) fail(`${rel} is empty`);
  return body;
};

const root = read("index.html");
if (!root.includes('location.replace("demo/"')) fail("the /ui/ redirect does not keep ?demo=");
if (!root.includes('href="demo/"')) fail("the /ui/ redirect has no noscript path");

const demoHtml = read("demo/index.html");
const demoJs = read("demo/bundle.js");
const webHtml = read("web/index.html");
const webJs = read("web/bundle.js");

if (!demoHtml.includes("../web/index.html")) {
  fail("the demo page does not link to the playground with the relative path the local server uses");
}
if (!demoHtml.includes("./bundle.js")) fail("the demo page does not load its bundle");
if (!webHtml.includes("./bundle.js")) fail("the playground does not load its bundle");

// The demos are separate compiled modules concatenated into one bundle. A
// copy that dropped the dashboard or the host would still be a large file.
for (const s of ["DashboardDemo", "CalendarDemo", "MenubarDemo", "MetadataDemo", "OtpDemo"]) {
  if (!demoJs.includes(s)) fail(`demo/bundle.js has no ${s}`);
}
for (const s of ["buildHost", "snapshotDom", "SPECS"]) {
  if (!webJs.includes(s)) fail(`web/bundle.js has no ${s}`);
}
if (!webJs.includes("../demo/index.html")) {
  fail("the playground bundle has no link back to the demos");
}

const kb = (rel) => Math.round(fs.statSync(path.join(dir, rel)).size / 1024);
console.log(`  demo/bundle.js ${kb("demo/bundle.js")} kB, web/bundle.js ${kb("web/bundle.js")} kB`);
