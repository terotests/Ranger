#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The loop, end to end: a file on disk → the dev server's watch → SSE → the
// page → the app's own cascade → the pixels.
//
//   npm run evg:inspect:live
//
// This is the gate for the claim the whole CSS feature rests on: **the
// stylesheet is an app's input, so a changed one needs no interception.** Nothing here patches an element or holds a value over the
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

  // --- a save that changed nothing must change nothing -----------------------
  //
  // `fs.watch` fires for a touch, for a save that rewrote the same bytes, and
  // for an editor that writes through a temporary file. A reload costs a
  // re-parse, a full re-cascade and a relayout — most of a frame on this page
  // — so the page compares what arrived against what the app is HOLDING and
  // does nothing when they are the same. Against what it is holding, not
  // against what it last fetched, so it is still right when the change came
  // from somewhere else.
  const reloadsBefore = logs.filter((l) => /css reloaded/.test(l)).length;
  fs.writeFileSync(CSS, original);                       // same bytes, new mtime
  await sleep(900);
  const reloadsAfter = logs.filter((l) => /css reloaded/.test(l)).length;
  ok("rewriting the same bytes does not re-cascade", reloadsAfter === reloadsBefore,
     `${reloadsBefore} → ${reloadsAfter} reloads`);
  ok("but the watch did fire, so the check is the page's and not the server's",
     (serverSaid.match(/css → dashboard\.css/g) || []).length >= 2,
     (serverSaid.match(/css → dashboard\.css/g) || []).length + " watch events");

  // --- the caret stays where it was typed ------------------------------------
  //
  // The panel refreshes several times a second while it is open. Rebuilding
  // the editor on each of those takes the focus and the caret with it — you
  // type three characters and the cursor is back at the start. The pane is
  // therefore built once and updated in place, and this is the check that says
  // so, because it is the kind of thing that comes back silently.
  const caret = await evalIn(`(async () => {
    document.querySelectorAll(".evgi-tab")[2].click();
    await new Promise(r => setTimeout(r, 400));
    const ta = document.querySelector(".evgi-css textarea");
    if (!ta) return "no editor";
    ta.focus();
    ta.setSelectionRange(1234, 1234);
    const was = document.activeElement === ta;
    // The refreshes are DRIVEN here rather than waited for. The page only
    // repaints when something happens to it, so a quiet headless tab refreshes
    // the panel exactly never — and a version of this check that just waited
    // passed against the very bug it was written for.
    for (let k = 0; k < 5; k++) {
      await window.__inspector.refresh();
      await new Promise(r => setTimeout(r, 60));
    }
    const now = document.querySelector(".evgi-css textarea");
    return JSON.stringify({
      focusedBefore: was,
      sameBox: now === ta,
      focusedAfter: document.activeElement === now,
      caret: now ? now.selectionStart : -1,
    });
  })()`);
  const c = JSON.parse(caret || "{}");
  ok("the editor was focused to begin with", c.focusedBefore === true, caret);
  ok("the panel's refreshes do not replace the editor", c.sameBox === true, caret);
  ok("nor take the focus away", c.focusedAfter === true, caret);
  ok("and the caret is where it was left", c.caret === 1234, caret);

  fs.writeFileSync(CSS, original);
  await sleep(300);

  ws.close();
} catch (e) {
  failed++;
  console.log("  FAIL " + e.message);
}

cleanup();
console.log(failed ? `\n${failed} failed\n` : "\na rule on disk reached the painter, and nothing was intercepted\n");
process.exit(failed ? 1 : 0);
