#!/usr/bin/env node
/**
 * Keeping a design, and getting it back.
 *
 *   npm run livebuild:save
 *
 * The live-build session is a temp directory, so until now everything this
 * page made was thrown away by the next start-over. What is checked here is
 * not that a folder appeared — it is the ROUND TRIP. A save that cannot be
 * opened is a folder you cannot trust, and the way that fails is quiet: the
 * document comes back and the app does not, or the app comes back attached to
 * yesterday's screen.
 *
 * It drives the server over HTTP, because that is the seam a database would
 * sit behind later: the page asks to save and to open, and never touches a
 * file itself.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const saved = fs.mkdtempSync(path.join(os.tmpdir(), "evg-saved-"));
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

const session = path.join(os.tmpdir(), "evg-live-session");
const docPath = path.join(session, "doc.evg.json");

// --- a screen worth keeping --------------------------------------------------

await ask("/seed?kind=dashboard");
const doc = JSON.parse(fs.readFileSync(docPath, "utf8"));
doc.root.children[0].id = "nav.first";
doc.root.children[1].id = "nav.second";
doc.root.children[0].children[0].text = "KEPT";
fs.writeFileSync(docPath, JSON.stringify(doc, null, 1));
const mine = fs.readFileSync(docPath, "utf8");

// Run turns a document with `nav.*` ids into an app, so the save has pages to
// carry. That is the case worth testing: a document alone would round-trip by
// accident.
const ran = await ask("/app/data");
if (ran.example) throw new Error("Run did not make an app out of the named tabs");

const first = await ask("/save", { name: "A Kept Screen" });
if (first.slug !== "a-kept-screen") throw new Error(`the name did not become a folder: ${first.slug}`);
if (first.pages !== 2) throw new Error(`the app's pages did not come along: ${first.pages}`);
if (!fs.existsSync(path.join(saved, first.slug, "app/machine.json"))) throw new Error("no machine in the save");
if (fs.readFileSync(path.join(saved, first.slug, "doc.evg.json"), "utf8") !== mine) {
  throw new Error("the document was rewritten on the way out");
}
console.log(`  save        ${first.slug}: the document, the machine and ${first.pages} pages`);

// A second save of the same name must not quietly replace the first.
const again = await ask("/save", { name: "A Kept Screen" });
if (again.slug !== "a-kept-screen-2") throw new Error(`a name collision overwrote something: ${again.slug}`);
console.log("  collision   the same name twice keeps both");

// --- start over, and get it back --------------------------------------------

await ask("/seed?kind=empty");
if (fs.readFileSync(docPath, "utf8") === mine) throw new Error("start over did not start over");
if (fs.existsSync(path.join(session, "app", "machine.json"))) throw new Error("start over left the old app behind");

const opened = await ask("/open", { slug: first.slug });
if (opened.name !== "A Kept Screen") throw new Error(`the name did not come back: ${opened.name}`);
if (fs.readFileSync(docPath, "utf8") !== mine) throw new Error("what came back is not what went in");
if (!fs.existsSync(path.join(session, "app/machine.json"))) throw new Error("the app did not come back");
if (!(opened.ncmds > 8)) throw new Error(`the reopened screen drew nothing: ${opened.ncmds}`);
console.log(`  open        byte for byte, with its app, and ${opened.ncmds} draw commands`);

// And it is live again: the app that came back is the one that runs.
const after = await ask("/app/data");
if (after.example) throw new Error("the app that came back is not the one Run uses");
if (Object.keys(after.pages).sort().join(",") !== "first,second") {
  throw new Error(`the states are not the saved ones: ${Object.keys(after.pages)}`);
}
console.log("  live        Run drives the app that came back, not the example");

// --- the list ----------------------------------------------------------------

const list = (await ask("/saved")).saved;
if (list.length !== 2) throw new Error(`the list has ${list.length} designs, not 2`);
if (!list.every((d) => d.name && d.saved)) throw new Error("a saved design has no name or no date");
console.log(`  list        ${list.map((d) => d.name).join(", ")}`);

// Nothing of this belongs in the repository.
if (fs.existsSync(path.join(here, "saved"))) throw new Error("saves landed inside the repository");
console.log("  outside     saves live under EVG_LIVEBUILD_SAVED, not in the tree");

console.log("ALL PASS — a design survives start over, comes back byte for byte, and runs");
done(0);
