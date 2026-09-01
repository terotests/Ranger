#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// FilterCtl against the TanStack capture.
//
//   node gallery/ui/conformance/oracle/filters_check.mjs
//
// This gate READS `filters.json` rather than restating its numbers, so a
// re-capture that changes an answer breaks the gate instead of being quietly
// absorbed. The predicate cases below are not typed out here at all: they are
// walked out of the file, mapped onto the operator that stands on each filter
// function, and asserted one by one.
//
// The oracle covers the predicates and the emptiness rule. It does NOT cover
// the operator vocabulary, the rule tree or the chips — TanStack has none of
// those — so those sections say SPECIFIED where they stand on the component
// and the source of each claim is named in place.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const ORACLE = JSON.parse(fs.readFileSync(path.join(HERE, "filters.json"), "utf8"));

let pass = 0;
let fail = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};

// Ranger's `[string]` is a plain JS array on this backend, so both directions
// are the identity. Named anyway, because the day that stops being true this
// is the one place to change.
const strs = (a) => a;
const list = (a) => Array.from(a);

// A controller carrying the four fields the screenshot's chips name, over the
// oracle's own six rows. Same fixture on both sides — a gate that invents its
// own rows is comparing two different questions.
const mk = () => {
  const c = new H.FilterCtl();
  c.addField("title", "Title", "text");
  c.addField("assignee", "Assignee", "multi");
  c.addField("priority", "Priority", "option");
  c.addField("points", "Points", "number");
  for (const [v, l] of [["ada", "Ada"], ["grace", "Grace"], ["alan", "Alan"], ["katherine", "Katherine"]]) {
    c.addOption("assignee", v, l);
  }
  for (const [v, l] of [["urgent", "Urgent"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]]) {
    c.addOption("priority", v, l);
  }
  for (const r of ORACLE.rows) {
    c.addRecord(r.id);
    c.setCell(r.id, "title", strs([r.title]));
    c.setCell(r.id, "assignee", strs(r.assignee));
    c.setCell(r.id, "priority", strs([r.priority]));
    c.setCell(r.id, "points", strs([String(r.points)]));
  }
  return c;
};

// A one-rule controller, used to ask the predicate questions directly: one
// record whose cell is the probe's cell, one rule holding the probe's value.
const probe = (kind, op, cellVals, filterVals) => {
  const c = new H.FilterCtl();
  c.addField("c", "C", kind);
  c.addRecord("row");
  c.setCell("row", "c", strs(cellVals));
  c.addRule("r", "", "c", op);
  c.setValues("r", strs(filterVals));
  return c;
};

console.log("MEASURED — the predicates, walked out of filters.json");

// Which operator stands on which measured filter function. Only the functions
// an operator was built from are walked; `weakEquals` and
// `includesStringSensitive` are captured but nothing here claims them, and
// saying so is better than a silent gap.
const FROM_FN = {
  equalsString: { op: "is", kind: "option", cellOf: (c) => (c === null ? [] : [String(c)]), valOf: (v) => [String(v)] },
  includesString: { op: "contains", kind: "text", cellOf: (c) => (c === null ? [] : [String(c)]), valOf: (v) => [String(v)] },
  arrIncludesSome: { op: "has_any_of", kind: "multi", cellOf: (c) => c.map(String), valOf: (v) => v.map(String) },
  arrIncludesAll: { op: "has_all_of", kind: "multi", cellOf: (c) => c.map(String), valOf: (v) => v.map(String) },
  inNumberRange: {
    op: "is_between",
    kind: "number",
    cellOf: (c) => [String(c)],
    // A blank bound is the empty string here: the chip's two number inputs are
    // text, and "the person has not typed a top end" is an empty box.
    valOf: (v) => v.map((b) => (b === null || b === undefined ? "" : String(b))),
  },
};

for (const [fn, spec] of Object.entries(FROM_FN)) {
  for (const row of ORACLE.predicates[fn]) {
    const cellVals = spec.cellOf(row.cell);
    const filterVals = spec.valOf(row.filter);
    const c = probe(spec.kind, spec.op, cellVals, filterVals);
    // A filter value the library would have dropped is not a predicate
    // question at all — it is the emptiness question, asked below. Skipping it
    // here rather than asserting the predicate's answer for it, because the
    // component never reaches the predicate in that state.
    if (!c.ruleActive("r")) continue;
    const label = `${fn}(${JSON.stringify(row.cell)}, ${JSON.stringify(row.filter)})`;
    check(label, c.matches("row"), row.pass);
  }
}

console.log("\nMEASURED — a negation is its positive, inverted");
// Not new cases: the SAME measured rows, run through the negated operator, so
// the pairing is proved against the capture rather than against itself.
const NEGATED = [
  ["equalsString", "is_not", "option", (c) => (c === null ? [] : [String(c)]), (v) => [String(v)]],
  ["includesString", "not_contains", "text", (c) => (c === null ? [] : [String(c)]), (v) => [String(v)]],
  ["arrIncludesSome", "has_none_of", "multi", (c) => c.map(String), (v) => v.map(String)],
];
for (const [fn, op, kind, cellOf, valOf] of NEGATED) {
  for (const row of ORACLE.predicates[fn]) {
    const c = probe(kind, op, cellOf(row.cell), valOf(row.filter));
    if (!c.ruleActive("r")) continue;
    check(`${op} ${JSON.stringify(row.cell)} / ${JSON.stringify(row.filter)}`, c.matches("row"), !row.pass);
  }
}

console.log("\nMEASURED — an empty rule is inert, not empty-matching");
// The finding the oracle measured down both routes. TanStack's own setter
// drops these; a component holding its own tree has to drop them itself, and
// pushed-in state proves what happens when it does not.
const inert = [
  ["multi, empty list", "multi", "has_any_of", []],
  ["text, empty string", "text", "contains", [""]],
  ["option, empty string", "option", "is", [""]],
  ["range, both ends blank", "number", "is_between", ["", ""]],
];
for (const [label, kind, op, vals] of inert) {
  const c = probe(kind, op, ["ada"], vals);
  check(`${label} is inactive`, c.ruleActive("r"), false);
}
// And per-operator: a range with ONE end blank still filters. That is the half
// of `autoRemove` a shared emptiness test would get wrong.
{
  const c = probe("number", "is_between", ["5"], ["1", ""]);
  check("range, lower bound only is active", c.ruleActive("r"), true);
  const d = probe("number", "is_between", ["5"], ["", "10"]);
  check("range, upper bound only is active", d.ruleActive("r"), true);
}

console.log("\nMEASURED — the wired table's surviving rows");
// The oracle ran these against a real table. `set` is the route that matches
// this component's contract: an inert rule contributes nothing.
const scenarios = {
  none: (c) => {},
  urgent: (c) => { c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"])); },
  anyOfTwo: (c) => { c.addRule("f1", "", "assignee", "has_any_of"); c.setValues("f1", strs(["ada", "alan"])); },
  twoChips: (c) => {
    c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
    c.addRule("f2", "", "assignee", "has_any_of"); c.setValues("f2", strs(["ada"]));
  },
  emptyMulti: (c) => { c.addRule("f1", "", "assignee", "has_any_of"); },
  emptyText: (c) => { c.addRule("f1", "", "title", "contains"); c.setValues("f1", strs([""])); },
  unassigned: (c) => {
    c.addRule("f1", "", "assignee", "has_any_of");
    c.setValues("f1", strs(["ada", "grace", "alan", "katherine"]));
  },
  atLeastFive: (c) => { c.addRule("f1", "", "points", "is_between"); c.setValues("f1", strs(["5", ""])); },
  blankRange: (c) => { c.addRule("f1", "", "points", "is_between"); c.setValues("f1", strs(["", ""])); },
};
for (const [name, build] of Object.entries(scenarios)) {
  const c = mk();
  build(c);
  check(`${name} survivors`, list(c.survivors()).join(","), ORACLE.wired[name].set.rows.join(","));
}

// And the divergence, stated as an assertion rather than left in prose: down
// the OTHER route the same empty chip hides everything. This controller
// deliberately does not do that, and the gate says which side it is on.
check(
  "emptyMulti disagrees between the two TanStack routes",
  ORACLE.wired.emptyMulti.pushed.rows.length === 0 && ORACLE.wired.emptyMulti.set.rows.length === 6,
  true,
);

console.log("\nMEASURED — case folds for strings and not for lists");
{
  const c = probe("option", "is", ["urgent"], ["URGENT"]);
  check("`is` folds case", c.matches("row"), true);
  const d = probe("multi", "has_any_of", ["ada", "grace"], ["Ada"]);
  check("`has any of` does not fold case", d.matches("row"), false);
}

console.log("\nMEASURED — a range typed backwards is swapped");
{
  const c = probe("number", "is_between", ["5"], ["10", "1"]);
  check("[10,1] matches 5", c.matches("row"), true);
  const d = probe("number", "is_between", ["11"], ["10", "1"]);
  check("[10,1] does not match 11", d.matches("row"), false);
}

console.log("\nSPECIFIED — the rule tree, which TanStack cannot hold");
{
  // The OR the flat columnFilters array has no way to express. r1 is urgent,
  // r5 is Katherine's; neither is both, so an OR keeps them both and an AND
  // keeps neither.
  const c = mk();
  c.setCombinator("root", "or");
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "assignee", "has_any_of"); c.setValues("f2", strs(["katherine"]));
  check("OR of two chips", list(c.survivors()).join(","), "r1,r4,r5");
  c.setCombinator("root", "and");
  check("AND of the same two", list(c.survivors()).join(","), "");
}
{
  // An inert child is skipped in an OR too. The tempting bug is the other way:
  // an empty chip ORed in matches everything.
  const c = mk();
  c.setCombinator("root", "or");
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "assignee", "has_any_of");
  check("an empty chip in an OR is skipped", list(c.survivors()).join(","), "r1,r4");
}
{
  // Nesting: (priority is urgent) AND (assignee has ada OR points 1..2).
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addGroup("g1", "root", "or");
  c.addRule("f2", "g1", "assignee", "has_any_of"); c.setValues("f2", strs(["ada"]));
  c.addRule("f3", "g1", "points", "is_between"); c.setValues("f3", strs(["1", "2"]));
  check("nested OR inside an AND", list(c.survivors()).join(","), "r1");
}
{
  // Removing a group takes its rules with it, and the tree goes back to what
  // the outer rule alone says.
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addGroup("g1", "root", "or");
  c.addRule("f2", "g1", "assignee", "has_any_of"); c.setValues("f2", strs(["katherine"]));
  c.removeNode("g1");
  check("removing a group drops its rules", c.has("f2"), false);
  check("survivors after the removal", list(c.survivors()).join(","), "r1,r4");
}

console.log("\nSPECIFIED — the serialised state");
{
  // The exact shape the component carries: `path` an array, `value` an array
  // even for a one-value operator.
  const c = mk();
  c.addRule("seed-1", "", "assignee", "has_any_of");
  c.setValues("seed-1", strs(["ada", "grace", "alan", "katherine"]));
  c.addRule("seed-2", "", "priority", "is");
  c.setValues("seed-2", strs(["urgent"]));
  const want = {
    id: "root",
    type: "group",
    combinator: "and",
    rules: [
      { id: "seed-1", type: "rule", path: ["assignee"], operator: "has_any_of", value: ["ada", "grace", "alan", "katherine"] },
      { id: "seed-2", type: "rule", path: ["priority"], operator: "is", value: ["urgent"] },
    ],
  };
  check("toJson", c.toJson(), JSON.stringify(want));
  // And it survives a round trip through a JSON parser, which is the thing a
  // hand-rolled serialiser gets wrong.
  let parsed = null;
  try { parsed = JSON.parse(c.toJson()); } catch (e) { parsed = { err: e.message }; }
  check("toJson parses", parsed && parsed.rules && parsed.rules.length, 2);
}
{
  // A value with a quote in it. The one case a hand-rolled writer breaks on,
  // and a filter over free text will meet it.
  const c = mk();
  c.addRule("f1", "", "title", "contains");
  c.setValues("f1", strs(['say "hi"\\now']));
  let ok = false;
  try { ok = JSON.parse(c.toJson()).rules[0].value[0] === 'say "hi"\\now'; } catch (e) { ok = e.message; }
  check("a quoted, backslashed value round-trips", ok, true);
}

console.log("\nSPECIFIED — what can and cannot be pushed down to TanStack");
{
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "assignee", "has_any_of"); c.setValues("f2", strs(["ada"]));
  check("a flat AND pushes down", c.canPushDown(), true);
  check(
    "and compiles to columnFilters",
    c.columnFilterJson(),
    JSON.stringify([{ id: "priority", value: "urgent" }, { id: "assignee", value: ["ada"] }]),
  );
  c.setCombinator("root", "or");
  check("an OR does not push down", c.pushdownReason(), "or-at-root");
  check("and compiles to nothing rather than to something narrower", c.columnFilterJson(), "[]");
}
{
  const c = mk();
  c.addRule("f1", "", "priority", "is_not"); c.setValues("f1", strs(["urgent"]));
  check("a negation does not push down", c.pushdownReason(), "negated-operator");
}
{
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "priority", "is"); c.setValues("f2", strs(["high"]));
  check("two chips on one field do not push down", c.pushdownReason(), "two-rules-one-field");
}
{
  const c = mk();
  c.addGroup("g1", "root", "and");
  check("a nested group does not push down", c.pushdownReason(), "nested-group");
}
{
  // An INACTIVE second chip on the same field is not a conflict — it is not
  // going down at all. The version that counted rules rather than active ones
  // refused a tree it could have pushed.
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "priority", "is");
  check("an empty second chip on the same field still pushes down", c.canPushDown(), true);
  check("and is left out of the compiled filters", c.columnFilterJson(), JSON.stringify([{ id: "priority", value: "urgent" }]));
}

console.log("\nSPECIFIED — the chip, from the screenshot");
{
  const c = mk();
  c.addRule("f1", "", "assignee", "has_any_of");
  c.setValues("f1", strs(["ada", "grace", "alan", "katherine"]));
  // Four values, three shown and a "+1" — the count in the picture.
  check("four values collapse to three and a +1", c.valueText("f1"), "Ada, Grace, Alan +1");
  check("the chip reads as one line", c.chipText("f1"), "Assignee has any of Ada, Grace, Alan +1");
  c.setValues("f1", strs(["ada", "grace", "alan"]));
  check("exactly three shows no overflow", c.valueText("f1"), "Ada, Grace, Alan");
  c.setValues("f1", strs([]));
  check("an empty chip says what it wants", c.valueText("f1"), "Select…");
}
{
  const c = mk();
  c.addRule("f1", "", "points", "is_between");
  c.setBound("f1", 0, "5");
  check("a lower bound alone reads as an inequality", c.valueText("f1"), "≥ 5");
  c.setBound("f1", 1, "13");
  check("both bounds read as a range", c.valueText("f1"), "5 – 13");
  c.setBound("f1", 0, "");
  check("an upper bound alone reads the other way", c.valueText("f1"), "≤ 13");
}
{
  // Toggling. A list operator adds and removes; a one-value one replaces.
  const c = mk();
  c.addRule("f1", "", "assignee", "has_any_of");
  c.toggleValue("f1", "ada");
  c.toggleValue("f1", "grace");
  check("a multi chip accumulates", c.valueText("f1"), "Ada, Grace");
  c.toggleValue("f1", "ada");
  check("and toggles back off", c.valueText("f1"), "Grace");
  const d = mk();
  d.addRule("f2", "", "priority", "is");
  d.toggleValue("f2", "urgent");
  d.toggleValue("f2", "high");
  check("a single-value chip replaces", d.valueText("f2"), "High");
}
{
  // Changing the operator trims values the new one cannot use, so the
  // serialised state never carries four values under `is`.
  const c = mk();
  c.addRule("f1", "", "assignee", "has_any_of");
  c.setValues("f1", strs(["ada", "grace", "alan"]));
  c.setOperator("f1", "is");
  check("narrowing the operator trims the values", c.valueText("f1"), "Ada");
}
{
  const c = mk();
  check("a multi field offers the list operators", list(H.FilterCtl.operatorsFor("multi")).join(","), "has_any_of,has_all_of,has_none_of");
  check("a number field has no `greater than`", list(H.FilterCtl.operatorsFor("number")).includes("is_greater_than"), false);
  c.addRule("f1", "", "assignee", "has_any_of");
  check("`is` is not offered on a multi field", c.operatorAllowed("assignee", "is"), false);
  check("`contains` is not offered on a number field", c.operatorAllowed("points", "contains"), false);
}

console.log("\nSPECIFIED — the bar's keyboard and accessible rows");
{
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "assignee", "has_any_of"); c.setValues("f2", strs(["ada"]));
  const rows = list(c.rows());
  const byTid = Object.fromEntries(rows.map((r) => [r.tid, r]));
  check("the bar is a toolbar", byTid.filterbar.role, 17);
  check("a chip is a group", byTid.f1.role, 1);
  check("named as the whole filter", byTid.f1.name, "Priority is Urgent");
  check("its value button says what it opens", byTid["f1-value"].hasPopup, "listbox");
  check("its menu is named for its chip", byTid["f1-menu"].name, "Options for Priority");
  check("the add button is last", rows[rows.length - 1].tid, "add");
  // Roving focus: exactly one tab stop across chips AND the add button.
  check("exactly one tab stop", rows.filter((r) => r.tabStop).length, 1);
  check("and it starts on the first chip", rows.find((r) => r.tabStop).tid, "f1");
  c.onKey("ArrowRight");
  check("ArrowRight moves it", list(c.rows()).find((r) => r.tabStop).tid, "f2");
  c.onKey("End");
  check("End lands on the add button", c.activeId, "add");
  c.onKey("ArrowRight");
  check("and does not wrap past it", c.activeId, "add");
  c.onKey("Home");
  check("Home comes back", c.activeId, "f1");
}
{
  const c = mk();
  c.addRule("f1", "", "assignee", "has_any_of"); c.setValues("f1", strs(["ada"]));
  c.open("f1");
  const rows = list(c.rows());
  const byTid = Object.fromEntries(rows.map((r) => [r.tid, r]));
  check("an open chip has a listbox", byTid["f1-list"].role, 37);
  check("which says several may be picked", byTid["f1-list"].multiSelectable, "true");
  check("its options carry the chosen state", byTid["f1-opt-ada"].selected, 2);
  check("and the unchosen one says so", byTid["f1-opt-grace"].selected, 1);
  check("the value button reports expanded", byTid["f1-value"].expanded, 2);
  // A one-value chip's list is NOT multi-selectable, and that is the only
  // thing telling a reader it closes after a pick.
  const d = mk();
  d.addRule("f2", "", "priority", "is");
  d.open("f2");
  const drows = Object.fromEntries(list(d.rows()).map((r) => [r.tid, r]));
  check("a single-value list is not multi-selectable", drows["f2-list"].multiSelectable, "");
}
{
  // Backspace removes the focused chip — but not while a list is open under
  // it, where the key belongs to the text the person is typing.
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.addRule("f2", "", "assignee", "has_any_of"); c.setValues("f2", strs(["ada"]));
  c.focusFirst();
  c.onKey("Backspace");
  check("Backspace removes the focused chip", c.has("f1"), false);
  check("and focus lands on the next one", c.activeId, "f2");
  c.open("f2");
  check("Backspace is refused while a list is open", c.onKey("Backspace"), false);
  check("and the chip is still there", c.has("f2"), true);
  check("Escape closes the list", c.onKey("Escape"), true);
  check("after which Backspace works again", c.onKey("Backspace"), true);
}
{
  // The add button is never removable, and Backspace on it does nothing.
  const c = mk();
  c.addRule("f1", "", "priority", "is"); c.setValues("f1", strs(["urgent"]));
  c.onKey("End");
  check("Backspace on the add button is refused", c.onKey("Backspace"), false);
  check("and the chip survives", c.has("f1"), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
