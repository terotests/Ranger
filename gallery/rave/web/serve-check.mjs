// SPDX-License-Identifier: AGPL-3.0-or-later
//
// `rave serve` without a browser: the two things the page asks of it — the
// file on GET, the file written on PUT — and the change event that makes an
// agent editing the file and a person watching the screen one session.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "..", "cli.mjs");
const PORT = 8113;

let failed = 0;
const ok = (name, cond, extra) => {
  if (cond) return console.log(`  PASS  ${name}`);
  failed += 1;
  console.log(`  FAIL  ${name}${extra == null ? "" : "  — " + extra}`);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rave-serve-"));
const file = path.join(dir, "app.rave");

const run = (args) =>
  new Promise((done) => {
    const p = spawn(process.execPath, [CLI, ...args], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (c) => (out += c));
    p.stderr.on("data", (c) => (out += c));
    p.on("close", (code) => done({ code, out }));
  });

const made = await run(["new", "app.rave", "--name", "Served", "--start", "dashboard"]);
ok("a project is made on the command line", made.code === 0 && fs.existsSync(file), made.out);

const checked = await run(["check", "app.rave"]);
ok("…and it checks out", checked.code === 0 && /RAVE OK/.test(checked.out), checked.out);

const server = spawn(process.execPath, [CLI, "serve", "app.rave", "--port", String(PORT)], {
  cwd: dir,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stderr.on("data", (c) => (log += c));
const upFrom = Date.now();
while (!/at http/.test(log) && Date.now() - upFrom < 180000) {
  await new Promise((r) => setTimeout(r, 200));
}
ok("the server comes up", /at http/.test(log), log.slice(-400));

const base = `http://127.0.0.1:${PORT}`;
const doc = await (await fetch(`${base}/doc`)).text();
ok("GET /doc is the file", doc.includes('<app name="Served"'), doc.slice(0, 120));

const page = await fetch(`${base}/`);
ok("the editor page is served", page.ok && (await page.text()).includes("<canvas"));

// the change event the page follows
const events = await fetch(`${base}/events`);
const reader = events.body.getReader();
await reader.read(); // the retry line
fs.writeFileSync(file, doc.replace('name="Served"', 'name="Changed"'));
const heard = await Promise.race([
  reader.read().then(() => true),
  new Promise((r) => setTimeout(() => r(false), 5000)),
]);
ok("…and a write to the file is announced", heard);
reader.cancel();

const put = await fetch(`${base}/doc`, { method: "PUT", body: doc.replace('name="Served"', 'name="FromThePage"') });
ok("PUT /doc writes the file", put.status === 204);
ok("…really", fs.readFileSync(file, "utf8").includes('name="FromThePage"'));

server.kill();
fs.rmSync(dir, { recursive: true, force: true });
console.log(failed === 0 ? "\nALL PASS" : `\nfailed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
