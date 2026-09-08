#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser page, driven with no browser.
//
//   node gallery/firesim/tests/page-check.mjs
//
// `web/firesim-page.js` is the inspector, and it is the proof that the whole
// simulator runs in a tab. What it needs from a browser is small — element
// lookup, a click, a frame — so this stubs exactly that and presses the
// buttons. It catches the thing a screenshot would not: a control wired to an
// id that is not there, a seed that does not load, a rules file the page
// hands over in the wrong shape.
//
// It does NOT check that the page looks right. Nothing here draws.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(HERE, "..", "web");

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));

// --- the smallest DOM the page uses ------------------------------------------
class El {
  constructor(id = "") {
    this.id = id;
    this.children = [];
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.className = "";
    this.files = [];
    this.attrs = {};
  }
  append(...kids) {
    this.children.push(...kids);
  }
  get innerHTML() {
    return "";
  }
  set innerHTML(_) {
    this.children = [];
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  click() {
    if (this.onclick) this.onclick();
  }
  change(value) {
    if (value !== undefined) this.value = value;
    if (this.onchange) this.onchange({ target: this });
  }
  input(value) {
    this.value = value;
    if (this.oninput) this.oninput({ target: this });
  }
}

const els = new Map();
const el = (id) => {
  if (!els.has(id)) els.set(id, new El(id));
  return els.get(id);
};

// Every id the page markup carries. If the page reaches for one that is not
// in the HTML, this list is where it shows up.
const html = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
const idsInMarkup = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const asked = new Set();

globalThis.document = {
  getElementById(id) {
    asked.add(id);
    return el(id);
  },
  createElement() {
    return new El();
  },
};
const frames = [];
globalThis.requestAnimationFrame = (fn) => frames.push(fn);

// --- run the page -------------------------------------------------------------
if (!fs.existsSync(path.join(WEB, "firesim.browser.js"))) {
  console.error("the browser bundle is missing — run `node gallery/firesim/web/build.mjs`");
  process.exit(3);
}
await import(pathToFileURL(path.join(WEB, "firesim-page.js")).href);

const missing = [...asked].filter((id) => !idsInMarkup.has(id));
ok("every element the page reaches for is in the markup", missing.length === 0, missing.join(", "));

// Accounts.
el("email").value = "a@example.com";
el("password").value = "password1";
el("signup").click();
ok("the page can create an account", el("response").textContent.startsWith("created"), el("response").textContent);
ok("…and shows its claims", el("claims").textContent.includes("user_id"));
el("anon").click();
ok("…and an anonymous one", el("response").textContent.startsWith("anonymous"), el("response").textContent);

// Back to the named account, then seed as them.
el("who").change("uid-1");
el("seedDemo").click();
ok("the demo seed loads", el("seedStatus").textContent.startsWith("6 documents"), el("seedStatus").textContent);
ok("…and the store lists them", el("docs").children.length === 6, String(el("docs").children.length));

// A document opens.
el("docs").children[0].click();
ok("a document opens", el("doc").textContent.includes("{"));

// The wire, with the rules on.
el("url").value = "/v1/projects/demo-firesim/databases/(default)/documents/calendars/cal-plan";
el("method").value = "GET";
el("send").click();
ok("the owner reads their calendar", el("response").textContent.startsWith("200"), el("response").textContent.slice(0, 80));

el("who").change("uid-2"); // the anonymous account
el("send").click();
ok("another account is refused", el("response").textContent.startsWith("403"), el("response").textContent.slice(0, 80));

// The latency slider reaches the simulator.
el("latency").input("500");
el("who").change("uid-1");
el("send").click();
ok("the latency slider is real", el("response").textContent.includes("500 ms"), el("response").textContent.slice(0, 40));

// A rules file that does not parse is reported, not applied.
const goodRules = el("rules").value;
el("rules").value = "service cloud.firestore { match /x/{y} { allow read: if } }";
el("applyRules").click();
ok("a broken rules file is reported", el("rulesStatus").className.includes("bad"), el("rulesStatus").textContent);
el("rules").value = goodRules;
el("applyRules").click();
ok("…and a good one applies", el("rulesStatus").textContent === "applied");

// The model, driven through the page's own frame loop.
el("prompt").value = "Lisää lenkki ja kyykkytreeni";
el("ask").click();
let guard = 0;
while (frames.length && guard < 5000) {
  frames.shift()();
  guard += 1;
}
ok("the model streams into the page", el("reply").textContent.length > 10, el("reply").textContent);
ok("…and says what it proposes", el("replyMeta").textContent.includes("2 proposed"), el("replyMeta").textContent);

// Wipe.
el("wipe").click();
ok("wipe empties the store", el("doc").textContent === "the store is empty");

process.stdout.write(`\n  ${passed} passed`);
if (failures.length) {
  process.stdout.write(`, ${failures.length} FAILED\n\n`);
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.stdout.write("\n");
  process.exit(1);
}
process.stdout.write(", 0 failed\n\n  ALL PASS\n\n");
