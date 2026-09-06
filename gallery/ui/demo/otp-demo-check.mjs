#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The one-time code demo: OtpCtl drawn, and the page around it agreeing.
//
//   node gallery/ui/demo/otp-demo-check.mjs
//
// `ui:otp:check` replays input-otp's recorded behaviour against the controller
// with nothing drawn. What only a page can check: that the slots are boxes a
// pointer can reach, that the active slot and the caret slot are the ones the
// controller says, that a full code lights Verify and a reader is told the
// count, and that Tab leaves the field and Shift+Tab comes back at the end.
// Every interaction goes through `hitId(x, y)` at a real coordinate, so a
// slot the layout put somewhere else is a failure here and not a surprise on
// the page.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/OtpDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "otp.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => {
  const d = new M.OtpDemo();
  d.init(CSS);
  d.displayListJson();
  return d;
};
const flat = (d) => {
  const out = [];
  const walk = (el) => { out.push(el); for (const k of el.children) walk(k); };
  walk(d.root);
  return out;
};
const byId = (d, id) => flat(d).find((e) => e.id === id);
const hasClass = (el, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(el.className || "");
const withClass = (d, c) => flat(d).filter((e) => hasClass(e, c));
const centre = (el) => ({ x: el.calculatedX + el.calculatedWidth / 2, y: el.calculatedY + el.calculatedHeight / 2 });
const clickOn = (d, id) => {
  d.displayListJson();
  const el = byId(d, id);
  const c = centre(el);
  const hit = d.hitId(c.x, c.y);
  d.press(hit);
  return hit;
};
const slots = (d) => Array.from({ length: 6 }, (_, i) => byId(d, `ot-code-slot${i}`));
// The caret slot draws a bar; it holds no character.
const shown = (d) => slots(d).map((e) => (e.textContent && e.textContent !== "|") ? e.textContent : "_").join("");
const active = (d) => slots(d).map((e, i) => hasClass(e, "ui-otp-slot-active") ? i : -1).filter((i) => i >= 0);
const caret = (d) => slots(d).map((e, i) => hasClass(e, "ui-otp-slot-caret") ? i : -1).filter((i) => i >= 0);
const cmds = (d) => JSON.parse(d.displayListJson()).cmds || [];

console.log("the stylesheet and the tree");
{
  const d = fresh();
  ok("the stylesheet parses without error", d.styleErrorCount() === 0,
    Array.from({ length: d.styleErrorCount() }, (_, i) => d.styleErrorAt(i)).join("; "));
  ok("six slots, in a row, 36 wide", slots(d).every((s) => s && Math.abs(s.calculatedWidth - 36) < 0.5),
    slots(d).map((s) => s && s.calculatedWidth).join(","));
  const xs = slots(d).map((s) => s.calculatedX);
  ok("laid out left to right", xs.every((x, i) => i === 0 || x > xs[i - 1]), xs.join(","));
  ok("a dash between the third and fourth", withClass(d, "ui-otp-sep").length === 1 &&
    byId(d, "ot-code-sep3").calculatedX > xs[2] && byId(d, "ot-code-sep3").calculatedX < xs[3]);
  ok("nothing is active while unfocused", active(d).length === 0 && caret(d).length === 0);
  ok("the four-character invite field has four slots", Array.from({ length: 4 }, (_, i) => byId(d, `ot-invite-slot${i}`)).every(Boolean) && !byId(d, "ot-invite-slot4"));
}

console.log("a click on a slot focuses the code at its end");
{
  const d = fresh();
  const hit = clickOn(d, "ot-code-slot3");
  ok("the pointer reaches the slot", hit === "ot-code-slot3", hit);
  ok("the field takes focus", d.focused === "ot-code" && d.code.focused, d.focused);
  ok("the first slot is active and carries the caret", active(d).join() === "0" && caret(d).join() === "0", `${active(d)} ${caret(d)}`);
  ok("and the caret is drawn as a bar", byId(d, "ot-code-slot0").textContent === "|");
}

console.log("typing fills, the status counts, Verify lights on the sixth");
{
  const d = fresh();
  clickOn(d, "ot-code-slot0");
  for (const k of ["1", "2", "3"]) d.key(k);
  ok("three digits", shown(d) === "123___", shown(d));
  ok("the fourth slot is the caret slot", active(d).join() === "3" && caret(d).join() === "3", `${active(d)} ${caret(d)}`);
  ok("the status says how far", byId(d, "ot-status").textContent === "3 of 6 digits", byId(d, "ot-status").textContent);
  ok("Verify is off", hasClass(byId(d, "ot-verify"), "ot-btn-off"));
  d.key("a");
  ok("a letter is refused", shown(d) === "123___", shown(d));
  for (const k of ["4", "5", "6"]) d.key(k);
  ok("six digits", shown(d) === "123456", shown(d));
  ok("the last slot stays active, no caret", active(d).join() === "5" && caret(d).length === 0, `${active(d)} ${caret(d)}`);
  ok("the status says complete", byId(d, "ot-status").textContent === "Code complete" && hasClass(byId(d, "ot-status"), "ot-status-done"));
  ok("Verify is lit", hasClass(byId(d, "ot-verify"), "ot-btn-primary"));
  d.key("7");
  ok("a seventh digit replaces the sixth", shown(d) === "123457", shown(d));
  ok("Verify shows the code", (() => { clickOn(d, "ot-verify"); return byId(d, "ot-result") && byId(d, "ot-result").textContent === "Verified 123457"; })(),
    byId(d, "ot-result") && byId(d, "ot-result").textContent);
  // The primary button is black; its label has its own token, so the sheet
  // has to say white — there are no descendant selectors to inherit from.
  const verifyRun = cmds(d).find((c) => c.text === "Verify");
  ok("the lit Verify's label is drawn white on the black button",
    verifyRun && verifyRun.c[0] === 255 && verifyRun.c[1] === 255 && verifyRun.c[2] === 255, JSON.stringify(verifyRun && verifyRun.c));
}

console.log("the selection is never a bare caret inside the value — input-otp's rule, drawn");
{
  const d = fresh();
  clickOn(d, "ot-code-slot0");
  for (const k of ["1", "2", "3", "4", "5", "6"]) d.key(k);
  d.key("Home");
  ok("Home selects the first slot", active(d).join() === "0", String(active(d)));
  d.key("9");
  ok("a digit replaces it and moves on", shown(d) === "923456" && active(d).join() === "1", `${shown(d)} ${active(d)}`);
  d.key("ArrowRight");
  d.key("Backspace");
  ok("Backspace on a middle slot leaves the one before it active", shown(d) === "92456_" && active(d).join() === "1", `${shown(d)} ${active(d)}`);
  d.keyWith("a", false, true);
  ok("Ctrl+A makes every filled slot active", active(d).join() === "0,1,2,3,4", String(active(d)));
  d.key("Backspace");
  ok("and Backspace empties the code", shown(d) === "______" && caret(d).join() === "0", `${shown(d)} ${caret(d)}`);
}

console.log("a click on a focused field selects the slot clicked");
{
  const d = fresh();
  clickOn(d, "ot-code-slot0");
  for (const k of ["1", "2", "3", "4"]) d.key(k);
  clickOn(d, "ot-code-slot1");
  ok("slot 1", active(d).join() === "1", String(active(d)));
  d.key("8");
  ok("typing there replaces", shown(d) === "1834__" && active(d).join() === "2", `${shown(d)} ${active(d)}`);
  clickOn(d, "ot-code-slot5");
  ok("an empty slot clicked goes to the end", active(d).join() === "4" && caret(d).join() === "4", `${active(d)} ${caret(d)}`);
}

console.log("Tab leaves and Shift+Tab comes back at the end");
{
  const d = fresh();
  clickOn(d, "ot-code-slot0");
  for (const k of ["1", "2", "3"]) d.key(k);
  d.key("Home");
  ok("Home is on the first slot", active(d).join() === "0", String(active(d)));
  d.keyWith("Tab", false, false);
  ok("Tab goes to the invite field", d.focused === "ot-invite" && !d.code.focused && d.invite.focused, d.focused);
  ok("nothing in the code is active", active(d).length === 0);
  d.key("x");
  d.key("7");
  ok("the invite field takes letters and digits", d.invite.value === "x7", d.invite.value);
  d.keyWith("Tab", true, false);
  ok("Shift+Tab returns to the code, at the end", d.focused === "ot-code" && active(d).join() === "3" && caret(d).join() === "3", `${d.focused} ${active(d)}`);
  d.keyWith("Tab", false, false);
  d.keyWith("Tab", false, false);
  ok("Tab past the invite reaches Resend, skipping the unlit Verify", d.focused === "ot-resend", d.focused);
  d.key("Enter");
  ok("Enter on Resend clears the code", d.code.value === "" && shown(d) === "______", shown(d));
}

console.log("what a reader is told");
{
  const d = fresh();
  const problems = d.a11yProblems();
  ok("the tree lints clean", problems.length === 0, problems.join("; "));
  clickOn(d, "ot-code-slot0");
  for (const k of ["1", "2"]) d.key(k);
  const tree = JSON.parse(d.a11yJson(1, ""));
  const node = (id) => tree.nodes.find((n) => n.id === id);
  const code = node("ot-code");
  ok("the code is one textbox named for the field", code && code.role === "textbox" && code.name === "One-time code", JSON.stringify(code));
  ok("whose value is the whole code", code && code.value === "12", code && code.value);
  ok("with a roledescription the bench recognises", code && code.roledesc === "One-time code", code && code.roledesc);
  ok("the slots are not announced", !tree.nodes.some((n) => n.id === "ot-code-slot0"));
  const status = node("ot-status");
  ok("the count is a status", status && status.role === "status" && status.name === "2 of 6 digits", JSON.stringify(status));
  const verify = node("ot-verify");
  ok("Verify is a disabled button until the code is full", verify && verify.role === "button" && verify.disabled === true, JSON.stringify(verify));
}

console.log("");
if (failed === 0) console.log(`RESULT OK — passed=${passed} failed=0`);
else { console.log(`RESULT FAIL — passed=${passed} failed=${failed}`); process.exit(1); }
