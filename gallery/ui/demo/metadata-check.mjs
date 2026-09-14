#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The metadata card: the combobox on a page, with rows around it.
//
// `combobox_check.mjs` drives ComboboxCtl by id and proves its rules against
// Base UI's capture. This is the other half — the things a controller cannot
// know and a page has to get right:
//
//   the label column: every label the same width, every control on one x,
//     and a label centred against a control of any height;
//   the list opens UNDER its box, left-aligned with it, and above the rows
//     below it — an overlay surface, not a row in the form;
//   the chips are drawn in pick order and the input sits after the last one;
//   the caret is where the index says, in a 40px box and in a 28px one;
//   Save puts an error on the hint's line and into the control's description,
//     and Discard takes it back;
//   Tab walks the ring: one stop per control, three inside the date field;
//   focus leaving a combobox settles its text, through the page's own blur.
//
//   node gallery/ui/demo/metadata-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/MetadataDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "metadata.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};
const eq = (name, got, want) => ok(name, String(got) === String(want), `got ${got} want ${want}`);

const fresh = () => { const d = new M.MetadataDemo(); d.init(CSS); d.displayListJson(); return d; };
const flat = (d) => {
  d.displayListJson();
  const out = [];
  const walk = (el, parent) => { out.push({ el, parent, cls: el.className || "" }); for (const k of el.children) walk(k, el); };
  walk(d.root, null);
  return out;
};
const has = (n, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(n.cls);
const find = (d, c) => flat(d).filter((n) => has(n, c));
const one = (d, id) => flat(d).find((n) => n.el.id === id);
const box = (d, id) => { const n = one(d, id); return n && { x: n.el.calculatedX, y: n.el.calculatedY, w: n.el.calculatedWidth, h: n.el.calculatedHeight }; };
const mid = (b) => b.y + b.h / 2;
const a11yNodes = (d) => JSON.parse(d.a11yJson(1, d.focused)).nodes;
const a11y = (d, id) => a11yNodes(d).find((n) => n.id === id);

console.log("--- the sheet and the tree ---");
{
  const d = fresh();
  eq("no stylesheet errors", d.styleErrorCount(), 0);
  const problems = Array.from(d.a11yProblems());
  ok("no accessibility lint", problems.length === 0, problems.join("; "));
}

console.log("--- one label column, whatever is in it ---");
{
  const d = fresh();
  const rows = find(d, "md-row");
  eq("nine rows: seven fields and two automatic values", rows.length, 9);
  const labels = rows.map((r) => r.el.children[0]);
  const cells = rows.map((r) => r.el.children[1]);
  ok("every label has the same width", labels.every((l) => Math.abs(l.calculatedWidth - labels[0].calculatedWidth) < 0.5),
    labels.map((l) => l.calculatedWidth).join(","));
  ok("every control starts on one x", cells.every((c) => Math.abs(c.calculatedX - cells[0].calculatedX) < 0.5),
    cells.map((c) => Math.round(c.calculatedX)).join(","));
  // A label and its control are centred against each other: compare midlines.
  const misaligned = rows.filter((r) => {
    const l = r.el.children[0], c = r.el.children[1];
    return Math.abs((l.calculatedY + l.calculatedHeight / 2) - (c.calculatedY + c.calculatedHeight / 2)) > 1;
  });
  ok("label and control share a midline in every row", misaligned.length === 0, misaligned.map((r) => r.el.id).join(","));
  const title = box(d, "md-title"), pills = box(d, "md-approved"), date = box(d, "md-due");
  ok("the text box, the pills and the date field are different heights — and still lined up",
    title.h !== pills.h && Math.abs(title.x - pills.x) < 0.5 && Math.abs(title.x - date.x) < 0.5,
    `${title.h}/${pills.h}/${date.h} at x ${title.x}/${pills.x}/${date.x}`);
  ok("the required star is drawn beside a required label and hidden from a reader",
    find(d, "md-star").length === 3 && find(d, "md-star").every((s) => s.el.a11yHidden === true));
}

console.log("--- the chips, and the caret in two sizes of box ---");
{
  const d = fresh();
  const chip = box(d, "md-customer-chip-estt"), input = box(d, "md-customer-input"), group = box(d, "md-customer-group");
  ok("the chip sits inside the group", chip.x >= group.x && chip.y >= group.y && chip.y + chip.h <= group.y + group.h + 0.5);
  ok("the input follows the chip on the same line", input.x >= chip.x + chip.w && Math.abs(mid(input) - mid(chip)) < 2,
    `chip ${JSON.stringify(chip)} input ${JSON.stringify(input)}`);
  eq("focus opens on the title", d.focused, "md-title");
  const car = box(d, "md-title-caret"), tbox = box(d, "md-title"), txt = box(d, "md-title-text");
  ok("the title's caret is drawn at the end of its text", car && Math.abs(car.x - (txt.x + txt.w)) < 2, JSON.stringify({ car, txt }));
  ok("and vertically inside the 40px box on its text line", car.y >= tbox.y && car.y + car.h <= tbox.y + tbox.h, JSON.stringify({ car, tbox }));
  ok("no other box draws a caret", flat(d).filter((n) => has(n, "ui-input-caret")).length === 1);
  d.press("md-customer-input");
  const car2 = box(d, "md-customer-input-caret"), in2 = box(d, "md-customer-input");
  ok("the combobox's caret is inside its 28px input", car2 && car2.y >= in2.y && car2.y + car2.h <= in2.y + in2.h, JSON.stringify({ car2, in2 }));
  ok("and the title's is gone", !one(d, "md-title-caret"));
}

console.log("--- the list is an overlay under its box ---");
{
  const d = fresh();
  d.press("md-customer-input");
  ok("the list opened", d.customer.open);
  const group = box(d, "md-customer-group"), list = box(d, "md-customer-content"), below = box(d, "md-amount");
  ok("it hangs just under the group", list && list.y >= group.y + group.h && list.y - (group.y + group.h) < 8, JSON.stringify({ group, list }));
  ok("left-aligned with it", Math.abs(list.x - group.x) < 1, `${list.x} vs ${group.x}`);
  ok("and over the row below rather than pushing it", below.y < list.y + list.h && Math.abs(below.y - 338) < 40, JSON.stringify({ below, list }));
  const items = flat(d).filter((n) => /^md-customer-item-/.test(n.el.id));
  eq("all five customers are offered", items.length, 5);
  ok("the chosen one is drawn selected", has(one(d, "md-customer-item-estt"), "ui-combobox-item-state-selected"));
  ok("and highlighted, being the first chosen", has(one(d, "md-customer-item-estt"), "ui-combobox-item-active"));
  d.type("c"); d.type("i");
  const filtered = flat(d).filter((n) => /^md-customer-item-/.test(n.el.id)).map((n) => n.el.id.replace("md-customer-item-", ""));
  eq("typing \"ci\" filters to the two that contain it", filtered.join(","), "fortney,chicago");
  ok("the empty row is not drawn while there are matches", !one(d, "md-customer-empty"));
  d.key("ArrowDown"); d.key("Enter");
  eq("ArrowDown then Enter picks the first match and appends its chip", Array.from(d.customer.values).join(","), "estt,fortney");
  ok("the list is still open", d.customer.open);
  eq("the query was spent", d.customer.input.value, "");
  const c1 = box(d, "md-customer-chip-estt"), c2 = box(d, "md-customer-chip-fortney");
  ok("chips are drawn in pick order, left to right", c2.x > c1.x, JSON.stringify({ c1, c2 }));
  d.type("z"); d.type("z");
  ok("nonsense draws the empty row", !!one(d, "md-customer-empty"));
  eq("with the card's own words", one(d, "md-customer-empty").el.textContent, "No customers found.");
}

console.log("--- the controllers' meaning reaches the page's own a11y tree ---");
{
  const d = fresh();
  const combos = a11yNodes(d).filter((n) => n.role === "combobox");
  eq("two comboboxes, from UiTree.dress", combos.map((n) => n.name).join(","), "Class,Customer");
  const cls = a11y(d, "md-class-input");
  ok("closed says not expanded (tri 1 = no, and expandable)", cls && cls.expanded === 1 && cls.expandable === true, JSON.stringify(cls));
  ok("the title box is a textbox holding its value", (a11y(d, "md-title") || {}).role === "textbox" && /Fortney/.test((a11y(d, "md-title") || {}).value || ""), JSON.stringify(a11y(d, "md-title")));
  d.press("md-customer-input");
  ok("open: a listbox", !!a11yNodes(d).find((n) => n.role === "listbox"));
  const opts = a11yNodes(d).filter((n) => n.role === "option");
  eq("with five options", opts.length, 5);
  ok("the chosen one says selected", (opts.find((o) => o.name === "ESTT Corporation") || {}).selected === true);
  const chips = a11y(d, "md-customer-chips");
  ok("the chips are a toolbar", chips && chips.role === "toolbar", JSON.stringify(chips));
  ok("and the remove is a named button", (a11y(d, "md-customer-chip-estt-remove") || {}).role === "button");
}

console.log("--- save, discard, and the error on the hint's line ---");
{
  const d = fresh();
  ok("the customer row opens with its hint", !!find(d, "md-hint").find((n) => /Backspace/.test(n.el.textContent)));
  d.press("md-customer-input");
  d.key("Backspace");
  eq("Backspace in the empty box takes the chip", Array.from(d.customer.values).length, 0);
  d.press("md-save");
  eq("Save says one field needs attention", d.status, "1 field needs attention.");
  const err = find(d, "md-error");
  eq("one error line", err.length, 1);
  eq("on the customer row, where the hint was", err[0].el.textContent, "Pick at least one customer.");
  ok("and the hint is gone from that row", !find(d, "md-hint").find((n) => /Backspace/.test(n.el.textContent)));
  ok("the box is drawn invalid", has(one(d, "md-customer-group"), "ui-combobox-group-invalid"));
  eq("the control's description is the error, not the hint", d.customer.description, "Pick at least one customer.");
  eq("and it says it is invalid", d.customer.invalid, true);
  const node = a11y(d, "md-status");
  ok("the status line is a live status a reader hears", node && node.role === "status" && /attention/.test(node.name), JSON.stringify(node));
  d.press("md-discard");
  eq("Discard restores the chip", Array.from(d.customer.values).join(","), "estt");
  eq("and clears the error", find(d, "md-error").length, 0);
  eq("the description is the hint again", d.customer.description, "Pick one or more. Backspace in the empty box takes the last one.");
  eq("Discard says so", d.status, "Changes discarded.");
  d.press("md-save");
  eq("a Save with everything filled bumps the version", d.status, "Saved as version 2.");
}

console.log("--- the ring, and a blur that settles the combobox ---");
{
  const d = fresh();
  const stops = [];
  for (let i = 0; i < 11; i++) { d.key("Tab"); stops.push(d.focused); }
  eq("Tab walks one stop per control, three inside the date field, then the buttons, then round",
    stops.join(" "),
    "md-class-input md-number md-customer-input md-amount md-due-month md-due-day md-due-year md-approved-no md-save md-discard md-title");
  d.press("md-class-input");
  d.keyWith("a", false, true);
  for (const ch of "zz") d.type(ch);
  eq("a query typed into Class", d.cls.input.value, "zz");
  d.key("Tab");
  eq("Tab away reverts it to the chosen label — the page's blur reached the controller", d.cls.input.value, "Invoice");
  ok("and closed the list", !d.cls.open);
  eq("focus moved on", d.focused, "md-number");
  d.press("md-class-trigger");
  ok("the trigger opens Class", d.cls.open);
  d.press("md-class-item-memo");
  eq("a click on a row chooses it", d.cls.value, "memo");
  eq("and the box shows the label", d.cls.input.value, "Memo");
  d.press("md-approved-yes");
  eq("the segmented control is a radio group: a click chooses", d.approved.value, "yes");
  ok("drawn as the pill that is on", has(one(d, "md-approved-yes"), "ui-togglegroup-item-state-on"));
  d.key("ArrowLeft");
  eq("and the arrows move focus along it", d.focused, "md-approved-no");
}

console.log(`\npassed=${passed} failed=${failed}`);
console.log(failed === 0 ? "ALL PASS" : "RESULT FAIL");
process.exit(failed === 0 ? 0 : 1);
