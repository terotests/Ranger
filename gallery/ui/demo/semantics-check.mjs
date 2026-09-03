#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a screen reader is told about a form field, on the ELEMENT path.
//
//   node gallery/ui/demo/semantics-check.mjs
//
// There are two accessible-tree producers in this repo and they are not the
// same thing:
//
//   the CONTROLLER path — `UiHost` serialises `UiRow` straight to JSON, with
//   `aria-invalid`, `aria-required` and `aria-readonly` as three-state
//   STRINGS. It is what the conformance harness compares against a real
//   <input>, and the rule it recorded is in behaviours.json:
//   "aria-required is published only when it was asked for". Absent and
//   "false" are different claims — a field that says `aria-required="false"`
//   has been asked and answered, and one that says nothing has not.
//
//   the ELEMENT path — `EVGA11yFromTree` walks a tree literal. It is what
//   every demo on the page uses, and what the DOM mirror a real reader sees
//   is built from. It carried `readOnly` as a BOOLEAN that nothing set, and
//   had no `required` or `invalid` at all.
//
// So the invoice form's red ring and its "That address is missing an @."
// reached a person and reached nobody else: visually a field in error,
// semantically a text box like any other. This is the gate for the second
// path saying what the first one already says.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/FormDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "form.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => {
  const d = new M.FormDemo();
  d.init(CSS);
  d.displayListJson();
  return d;
};
const treeOf = (d) => JSON.parse(d.a11yJson(1, ""));
const node = (t, id) => (t.nodes || []).find((n) => n.id === id);

console.log("--- a field in error says so ---");
{
  const d = fresh();
  const t = treeOf(d);
  const bad = node(t, "fm-email");
  ok("the email field is in the tree", !!bad, JSON.stringify(Object.keys(t).slice(0, 4)));
  // The demo opens with the email in error — the picture's red ring and the
  // sentence under it. A reader must get the same claim.
  ok("it is marked invalid", bad && bad.invalid === "true", JSON.stringify(bad));
  ok("and described by the error, not by the hint",
    bad && /@/.test(bad.desc || ""), bad && bad.desc);

  // And a field that is fine must say NOTHING rather than "false".
  const fine = node(t, "fm-name");
  ok("a valid field claims nothing about validity",
    fine && fine.invalid === undefined, JSON.stringify(fine && fine.invalid));
}

console.log("--- required is published only when asked for ---");
{
  const t = treeOf(fresh());
  const req = node(t, "fm-name");
  ok("a required field says so", req && req.required === "true", JSON.stringify(req && req.required));
  const opt = node(t, "fm-search");
  ok("an optional one says nothing at all",
    opt && opt.required === undefined, JSON.stringify(opt && opt.required));
}

console.log("--- readonly, in the same three states ---");
{
  const t = treeOf(fresh());
  const ro = node(t, "fm-invoice");
  ok("the read-only field says so", ro && ro.readonly === "true", JSON.stringify(ro && ro.readonly));
  const rw = node(t, "fm-name");
  ok("an editable one says nothing", rw && rw.readonly === undefined, JSON.stringify(rw && rw.readonly));
}

console.log("--- the password toggle is a toggle ---");
{
  // `aria-pressed` has existed on EVGElement and in the node all along, and
  // the demo used the accessible NAME instead — under a comment saying the
  // field did not exist. It does; a toggle button that says what it will do
  // is a legitimate second spelling, but the state belongs in the state.
  const d = fresh();
  const before = node(treeOf(d), "fm-secret-eye");
  ok("the eye is a button", before && before.role === "button", JSON.stringify(before));
  ok("not pressed to begin with", before && before.pressed === 1, JSON.stringify(before && before.pressed));
  d.press("fm-secret-eye");
  const after = node(treeOf(d), "fm-secret-eye");
  ok("and pressed once the password is showing",
    after && after.pressed === 2, JSON.stringify(after && after.pressed));
}

console.log("");
console.log(failed ? `RESULT FAIL — passed=${passed} failed=${failed}` : `RESULT OK — passed=${passed} failed=0`);
process.exitCode = failed ? 1 : 0;
