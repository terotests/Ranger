#!/usr/bin/env node
/**
 * Exporting a live-build screen as a brief another agent can paste.
 *
 *   npm run livebuild:export
 *
 * Save keeps a design on this machine. Export is the door out: the document,
 * the app if there is one, an outline, and the instructions that tell a
 * Ranger + EVG agent how to turn that picture into a real app. What is
 * checked here is that the payload is the session's own files (not the
 * example app), that the brief names the loop, and that a screen-with-tabs
 * takes its machine with it.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles, exportSession, outlineOf } from "./export.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

// --- without a server --------------------------------------------------------

const dash = JSON.parse(fs.readFileSync(path.join(here, "fixtures/dashboard.evg.json"), "utf8"));
const lines = outlineOf(dash);
if (!lines.some((l) => l.includes("Northwind"))) {
  throw new Error("the outline does not mention the screen's title:\n" + lines.slice(0, 8).join("\n"));
}
if (!lines.some((l) => /^0\s/.test(l))) {
  throw new Error("the outline has no root: " + lines[0]);
}
console.log(`  outline     ${lines.length} lines, starts ${lines[1] || lines[0]}`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-"));
fs.copyFileSync(path.join(here, "fixtures/dashboard.evg.json"), path.join(tmp, "doc.evg.json"));
const lonely = exportSession({
  dir: tmp,
  prompt: "a northwind phone",
  kind: "dashboard",
  viewport: { width: 390, height: 844 },
});
if (lonely.hasApp) throw new Error("a document with no app/ exported the example app");
if (!lonely.files["doc.evg.json"]) throw new Error("the document did not come along");
if (lonely.markdown.includes("traffic")) {
  throw new Error("the brief mentioned the example app's machine");
}
if (!lonely.markdown.includes("a northwind phone")) throw new Error("the ask did not reach the brief");
if (!lonely.markdown.includes("npm run rave -- check")) {
  throw new Error("the brief does not tell the next agent to check a Rave app");
}
if (!lonely.markdown.includes("npm run agent -- measure")) {
  throw new Error("the brief does not tell the next agent to measure the EVG document");
}
if (!lonely.markdown.includes("### `doc.evg.json`")) throw new Error("the document is not a fenced file in the brief");
if (lonely.markdownBare.includes("How to build the real app")) {
  throw new Error("the bare brief still carries the build instructions");
}
if (!lonely.markdown.includes("How to build the real app")) {
  throw new Error("the default brief dropped the build instructions");
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("  brief       document only, with the Rave / EVG loop, not the example app");

const withApp = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-app-"));
fs.copyFileSync(path.join(here, "fixtures/dashboard.evg.json"), path.join(withApp, "doc.evg.json"));
fs.cpSync(path.join(here, "fixtures/app"), path.join(withApp, "app"), { recursive: true });
const packed = exportSession({ dir: withApp, kind: "dashboard", name: "tabs" });
if (!packed.hasApp) throw new Error("an app next to the document was not exported");
if (!packed.files["app/machine.json"]) throw new Error("machine.json did not come along");
if (packed.pages !== 3) throw new Error(`expected 3 pages, got ${packed.pages}`);
if (!packed.markdown.includes("This paste already has an app")) {
  throw new Error("the brief does not say the machine is already there");
}
const collected = collectFiles(withApp);
if (!collected["app/pages/map.evg.json"]) throw new Error("a page was skipped");
fs.rmSync(withApp, { recursive: true, force: true });
console.log(`  with app    ${packed.pages} pages and the machine ride along`);

// An id on a node has to show up as an event the next agent can wire.
const tagged = JSON.parse(JSON.stringify(dash));
tagged.root.children[0].id = "nav.home";
if (!outlineOf(tagged).some((l) => l.includes("#nav.home"))) {
  throw new Error("an id on a node does not appear in the outline");
}
console.log("  ids         nav.home is visible in the outline");

// --- over HTTP, the same seam the page uses ----------------------------------

const saved = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-saved-"));
const port = 8700 + Math.floor(Math.random() * 60);
const server = spawn(process.execPath, [path.join(here, "serve.mjs")], {
  cwd: root,
  env: { ...process.env, EVG_LIVEBUILD_SAVED: saved, EVG_LIVEBUILD_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (b) => { log += b; });
server.stderr.on("data", (b) => { log += b; });

const done = (code) => {
  server.kill();
  fs.rmSync(saved, { recursive: true, force: true });
  process.exit(code);
};
process.on("uncaughtException", (e) => {
  console.error(e.message);
  console.error(log.slice(-800));
  done(1);
});

const base = `http://127.0.0.1:${port}`;
const ask = async (p, body) => {
  const res = await fetch(base + p, body
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const d = await res.json();
  if (d.error) throw new Error(`${p}: ${d.error}`);
  return d;
};

for (let i = 0; ; i += 1) {
  try {
    await ask("/saved");
    break;
  } catch (e) {
    if (i > 60) throw new Error(`the server never came up:\n${log.slice(-600)}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

await ask("/seed?kind=dashboard");
const first = await ask("/export?w=390&h=844");
if (first.format !== "evg-livebuild-export") throw new Error(`wrong format: ${first.format}`);
if (first.hasApp) throw new Error("a seed exported an app it does not have");
if (!first.markdown.includes("Northwind")) throw new Error("the seed's copy is not in the brief");
if (!first.files["doc.evg.json"]) throw new Error("HTTP export has no document");
if (!first.bundle || first.bundle.version !== 1) throw new Error("the JSON bundle is missing");
if (first.viewport.width !== 390 || first.viewport.height !== 844) {
  throw new Error(`viewport did not travel: ${JSON.stringify(first.viewport)}`);
}
console.log(`  http        seed brief ${first.nodes} nodes, ${first.bytes} bytes, no example app`);

const typed = await ask("/export?ask=" + encodeURIComponent("four-tab bottom nav"));
if (!typed.markdown.includes("four-tab bottom nav")) {
  throw new Error("the typed ask did not reach the brief");
}
console.log("  ask         the box on the page is what the next agent is told");

const session = path.join(os.tmpdir(), "evg-live-session");
const docPath = path.join(session, "doc.evg.json");
const doc = JSON.parse(fs.readFileSync(docPath, "utf8"));
doc.root.children[0].id = "nav.first";
doc.root.children[1].id = "nav.second";
fs.writeFileSync(docPath, JSON.stringify(doc, null, 1));

const ran = await ask("/app/data");
if (ran.example) throw new Error("Run did not make an app out of the named tabs");

const second = await ask("/export");
if (!second.hasApp) throw new Error("after Make app, export has no app");
if (second.pages < 2) throw new Error(`the app's pages did not come along: ${second.pages}`);
if (!second.files["app/machine.json"]) throw new Error("machine.json missing from the HTTP export");
if (!second.ids.includes("nav.first")) throw new Error(`ids did not travel: ${second.ids}`);
if (!second.markdown.includes("nav.first")) throw new Error("the brief does not name the tab ids");
console.log(`  app         ${second.pages} pages, ids ${second.ids.join(", ")}`);

console.log("ALL PASS — export is this session's files, a brief, and not the example app");
done(0);
