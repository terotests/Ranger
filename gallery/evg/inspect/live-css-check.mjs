#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The loop, end to end: a file on disk → the dev server's watch → SSE → the
// page → the app's own cascade → the pixels.
//
//   npm run evg:inspect:live
//
// This is the gate for the claim the whole CSS feature rests on: **the
// stylesheet is an app's input, so handing back a changed one needs no
// interception.** Nothing here patches an element or holds a value over the
// app's head. A rule is written to `dashboard.css`, and what is checked is the
// colour of a rectangle in the DISPLAY LIST — not the element, not the panel.
// A value that reached the element and stopped there would be a frame that
// still shows the old colour, and that is the failure this exists to catch.
//
// It drives the real `gallery/ui/web/serve.mjs`, the real page and the real
// WebGL painter (through SwiftShader, since this has no GPU). The file is put
// back whatever happens, including on a crash.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const CSS = path.join(ROOT, "gallery/ui/demo/dashboard.css");
const PORT = 8191;
const CDP = 9407;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const named = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome"].filter(Boolean);
  for (const c of named) { try { if (fs.existsSync(c)) return c; } catch { /* keep looking */ } }
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(pw)) {
      const c = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch { /* none */ }
  return null;
}

if (!fs.existsSync(path.join(ROOT, "gallery/ui/demo/bundle.js"))) {
  console.error("no bundle — run: npm run ui:demo:build && node gallery/ui/demo/build.mjs");
  process.exit(1);
}
const chrome = findChrome();
if (!chrome) { console.error("no Chrome found — set CHROME_PATH to one"); process.exit(1); }

const original = fs.readFileSync(CSS, "utf8");
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  ok " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

let srv = null, browser = null, profile = null;
const cleanup = () => {
  try { fs.writeFileSync(CSS, original); } catch { /* nothing better to do */ }
  try { browser && browser.kill(); } catch { /* gone */ }
  try { srv && srv.kill(); } catch { /* gone */ }
  try { profile && fs.rmSync(profile, { recursive: true, force: true }); } catch { /* chrome still holds it */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

try {
  srv = spawn("node", ["gallery/ui/web/serve.mjs"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), PAGE: "/gallery/ui/demo/index.html" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverSaid = "";
  srv.stdout.on("data", (d) => (serverSaid += d));
  srv.stderr.on("data", (d) => (serverSaid += d));
  await sleep(900);

  profile = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "evglive-"));
  browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--no-proxy-server",
    "--proxy-bypass-list=<-loopback>", "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
    `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, "about:blank"], {
    stdio: "ignore",
    env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
  });

  let ver = null;
  for (let i = 0; i < 3000 && !ver; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CDP}/json/version`); if (r.ok) ver = await r.json(); } catch { /* not up */ }
    if (!ver) await sleep(5);
  }
  if (!ver) throw new Error("chromium did not open a devtools endpoint");

  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener("message", (m) => {
    const g = JSON.parse(m.data);
    if (g.id && pending.has(g.id)) { pending.get(g.id)(g); pending.delete(g.id); }
    else if (g.method === "Runtime.consoleAPICalled") logs.push((g.params.args || []).map((a) => a.value ?? a.description).join(" "));
  });
  const send = (method, params = {}, S) => new Promise((res) => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params, ...(S ? { sessionId: S } : {}) }));
  });
  const { result: tgt } = await send("Target.createTarget", { url: "about:blank" });
  const { result: att } = await send("Target.attachToTarget", { targetId: tgt.targetId, flatten: true });
  const S = att.sessionId;
  await send("Page.enable", {}, S);
  await send("Runtime.enable", {}, S);
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/gallery/ui/demo/index.html?inspect=1&demo=dashboard` }, S);
  const evalIn = async (expr) =>
    (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, S)).result?.result?.value;

  let up = false;
  for (let i = 0; i < 400 && !up; i++) { up = await evalIn("document.querySelectorAll('.evgi-row').length > 3"); if (!up) await sleep(50); }
  ok("the page painted and the panel attached", up === true);

  // The card's fill, read off the display list the painter was handed.
  const cardFill = () => evalIn(`(() => {
    const doc = JSON.parse(window.__lastList);
    const cmds = doc.list ? doc.list.cmds : doc.cmds;
    const c = cmds.find((c) => c.k === 0 && c.r === 14 && c.w > 200 && c.w < 340);
    return c ? c.c.join(",") : "none";
  })()`);

  const before = await cardFill();
  ok("a card is drawn with the sheet's colour", before === "255,255,255,1", before);

  fs.writeFileSync(CSS, original + "\n/* written by evg:inspect:live */\n.db-card { background-color: #2266dd; }\n");
  let after = before;
  for (let i = 0; i < 60 && after === before; i++) { await sleep(50); after = await cardFill(); }
  ok("saving the file changed the picture", after === "34,102,221,1", `${before} → ${after}`);
  ok("and the page said which sheet it reloaded", logs.some((l) => /css reloaded: dashboard\.css/.test(l)),
     JSON.stringify(logs.slice(0, 3)));
  ok("and the server saw one save, not three", (serverSaid.match(/css → dashboard\.css/g) || []).length === 1,
     (serverSaid.match(/css → dashboard\.css/g) || []).length + " events");

  // The panel followed it too — it is a reader of the same channels, so a
  // reload it did not notice would leave it describing a frame that is gone.
  const rows = await evalIn(`(() => {
    window.__inspector.refresh();
    return document.querySelectorAll(".evgi-row").length;
  })()`);
  ok("the panel re-read the tree after the reload", typeof rows === "number" && rows > 3, String(rows));

  fs.writeFileSync(CSS, original);
  let back = after;
  for (let i = 0; i < 60 && back === after; i++) { await sleep(50); back = await cardFill(); }
  ok("putting the file back puts the picture back", back === before, `${after} → ${back}`);

  // --- and the other direction -----------------------------------------------
  //
  // The panel edits the app's input, so "save" means writing the text back
  // where the input came from. This is the same loop run the other way: the
  // page PUTs, the server writes the file, the watch sees it, and every other
  // page open on that sheet re-cascades.
  // NO STRING ESCAPES IN HERE. This source is a template literal, so a `\n`
  // written in it is a real newline by the time the expression reaches the
  // page — and a real newline inside a JavaScript string literal is a syntax
  // error, which the protocol reports as the whole evaluation returning
  // nothing. Joining an array of lines has no escape to get wrong.
  const saved = await evalIn(`(async () => {
    const i = window.__inspector;
    document.querySelectorAll(".evgi-tab")[2].click();
    await new Promise(r => setTimeout(r, 300));
    const ta = document.querySelector(".evgi-css textarea");
    if (!ta) return "no editor";
    const btn = [...document.querySelectorAll(".evgi-btn")].find(b => b.textContent === "save to disk");
    if (!btn) return "no save button";
    ta.value += ["", "/* saved from the panel by evg:inspect:live */", ".db-card { background-color: #118844; }", ""].join(String.fromCharCode(10));
    ta.dispatchEvent(new Event("input"));
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    return "clicked";
  })()`);
  ok("the panel offers a save", saved === "clicked", String(saved));

  let onDisk = "";
  for (let i = 0; i < 60; i++) { onDisk = fs.readFileSync(CSS, "utf8"); if (/118844/.test(onDisk)) break; await sleep(50); }
  ok("saving from the panel wrote the file", /118844/.test(onDisk));
  ok("and did not lose what was already in it", onDisk.startsWith(original.slice(0, 400)));
  ok("and the picture is the saved colour", (await cardFill()) === "17,136,68,1", await cardFill());

  fs.writeFileSync(CSS, original);
  await sleep(400);

  ws.close();
} catch (e) {
  failed++;
  console.log("  FAIL " + e.message);
}

cleanup();
console.log(failed ? `\n${failed} failed\n` : "\na rule on disk reached the painter, and nothing was intercepted\n");
process.exit(failed ? 1 : 0);
