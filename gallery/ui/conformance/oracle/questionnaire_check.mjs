#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// QuestionnaireCtl: the flow shadcn's Questionnaire describes.
//
//   node gallery/ui/conformance/oracle/questionnaire_check.mjs
//
// SPECIFIED, NOT MEASURED, and the split is worth stating precisely because
// half of this component IS measured elsewhere.
//
//   THE PARTS have oracles. Single choice is a radio group, multiple choice
//   is a checkbox group, the free-text answer is an input, and all three are
//   already driven against Radix by the conformance harness. Nothing about
//   them is re-decided here.
//
//   THE FLOW does not. Base UI has no questionnaire primitive — the registry
//   ships field, fieldset, form, radio-group, checkbox-group, input and
//   progress, and shadcn composes them — and ui.shadcn.com is refused by the
//   proxy. So one question at a time, Previous/Skip/Next, the required gate,
//   the letter shortcuts and "Question 1 of 3" come from the component source
//   the user supplied and from one screenshot.
//
// The fixture is that source's own three questions, so the numbers below are
// its numbers: a required single-choice item with a free-text alternative, an
// optional multiple-choice item, and a required single-choice item.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));

let pass = 0;
let fail = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};

const mk = () => {
  const host = new H.UiHost();
  const q = host.addQuestionnaire("q", "Agent plan");

  q.addItem("direction", "What should the agent build next?",
    "Choose a direction or describe another task.", true, false);
  q.addChoice("direction", "tool-calls", "Tool call timeline",
    "Show what the agent ran and what came back.");
  q.addChoice("direction", "approvals", "Approval checkpoints",
    "Ask before sensitive or destructive actions.");
  q.addChoice("direction", "handoffs", "Sub-agent handoffs",
    "Make delegated work and results easier to follow.");
  q.addInput("direction", "Another agent feature", "Describe another feature…");

  q.addItem("signals", "What should every progress update include?",
    "Select all that apply, or skip this question.", false, true);
  for (const [v, l] of [["progress", "Progress"], ["decisions", "Decisions"],
                        ["risks", "Risks"], ["next-step", "Next step"]]) {
    q.addChoice("signals", v, l, "");
  }

  q.addItem("timing", "When should work begin?",
    "Choose when the agent should begin the work.", true, false);
  for (const [v, l] of [["now", "Start now"], ["next-cycle", "Next development cycle"],
                        ["backlog", "Add it to the backlog"]]) {
    q.addChoice("timing", v, l, "");
  }
  q.setDefaultItem("direction");
  q.build();
  return { host, q };
};
const chosen = (q) => {
  const it = q.current();
  return it.choices.filter((c) => c.chosen).map((c) => c.value).join(",");
};

console.log("it opens on the item defaultItem names");
{
  const { q } = mk();
  check("three questions", q.count(), 3);
  check("on the first", q.current().name, "direction");
  check("and says so", q.progressText(), "Question 1 of 3");
  // Not the same as index 0: the prop names an item, and naming the second
  // one has to work or the prop means nothing.
  const { q: q2 } = mk();
  q2.setDefaultItem("timing");
  check("defaultItem names an ITEM, not a position", q2.current().name, "timing");
  check("and the counter follows it", q2.progressText(), "Question 3 of 3");
}

console.log("the required gate");
{
  const { q } = mk();
  check("nothing is answered", q.isAnswered(), false);
  check("so Next is refused", q.next(), false);
  check("and we have not moved", q.current().name, "direction");
  // The error appears on the ATTEMPT, not while they are still reading.
  check("only now is there an error", q.errorText(), "Choose an option to continue.");
  const { q: q3 } = mk();
  check("before trying, there is none", q3.errorText(), "");
}

console.log("answering clears it");
{
  const { q } = mk();
  q.next();
  check("refused, with an error", q.errorText().length > 0, true);
  q.choose("approvals");
  check("choosing answers it", q.isAnswered(), true);
  check("and the error goes", q.errorText(), "");
  check("now Next moves on", q.next(), true);
  check("to the second question", q.current().name, "signals");
}

console.log("typing is an answer too");
{
  // The reference's submit reads ONE value for an item that has both cards
  // and a text box, so the two are the same slot and either fills it.
  const { q } = mk();
  q.typeInto("Something else entirely");
  check("the free-text answer counts", q.isAnswered(), true);
  check("so Next moves on", q.next(), true);
}

console.log("single choice replaces, multiple accumulates");
{
  const { q } = mk();
  q.choose("tool-calls");
  q.choose("approvals");
  check("a radio group keeps one", chosen(q), "approvals");
  q.next();
  check("on the multiple-choice item", q.current().name, "signals");
  q.choose("progress");
  q.choose("risks");
  check("a checkbox group keeps both", chosen(q), "progress,risks");
  q.choose("progress");
  check("and pressing one again clears just that one", chosen(q), "risks");
}

console.log("skip is offered only where it is allowed");
{
  const { q } = mk();
  check("not on a required item", q.canSkip(), false);
  check("and refuses if asked", q.skip(), false);
  q.choose("approvals");
  q.next();
  check("but yes on an optional one", q.canSkip(), true);
  check("and it moves on", q.skip(), true);
  check("without recording anything", q.current().name, "timing");
  // Going back proves the skip left the item untouched.
  q.previous();
  check("the skipped item is still unanswered", q.isAnswered(), false);
}

console.log("previous never validates");
{
  const { q } = mk();
  q.choose("approvals");
  q.next();
  // On an optional item with nothing chosen, going BACK must not be gated by
  // the item you are going back to change.
  check("back from an empty optional item", q.previous(), true);
  check("lands on the first", q.current().name, "direction");
  check("with its answer intact", chosen(q), "approvals");
  check("and there is nowhere before the first", q.previous(), false);

  // FROM A REQUIRED, UNANSWERED ITEM — which is the case the claim is really
  // about and which this gate did not have. Mutating `previous` to run the
  // same gate as `next` changed nothing at 55 of 55, because every previous()
  // above was called from an OPTIONAL item, where the gate passes anyway.
  const { q: q2 } = mk();
  q2.choose("approvals");
  q2.next();
  q2.skip();
  check("standing on a required item with nothing chosen", q2.current().name, "timing");
  check("  which Next would refuse", q2.canAdvance(), false);
  check("  and Previous still allows", q2.previous(), true);
  check("  landing on the one before it", q2.current().name, "signals");
}

console.log("the letter shortcuts");
{
  const { q } = mk();
  check("A is the first choice", q.valueForLetter("A"), "tool-calls");
  check("B the second", q.valueForLetter("B"), "approvals");
  check("C the third", q.valueForLetter("C"), "handoffs");
  check("and D is nothing here", q.valueForLetter("D"), "");
  q.keyDown(q.itemTid(), "B");
  check("pressing one chooses it", chosen(q), "approvals");
}

console.log("the last question submits");
{
  const { q } = mk();
  q.choose("approvals");
  q.next();
  q.skip();
  check("on the last", q.current().name, "timing");
  check("submitted is not set yet", q.submitted, false);
  check("required, so Next is refused", q.next(), false);
  q.choose("now");
  check("answered, Next submits", q.next(), true);
  check("and says so", q.submitted, true);
}

console.log("what a reader is told");
{
  const { q } = mk();
  const rowOf = (t) => q.rows().find((r) => r.tid === t);
  const name = (r) => H.EVGA11yRole.ariaName(r.role);
  check("the progress line is a status", name(rowOf(q.progressTid())), "status");
  check("reading the count", rowOf(q.progressTid()).name, "Question 1 of 3");
  const group = rowOf(q.itemTid());
  check("a single-choice item is a radiogroup", name(group), "radiogroup");
  check("marked required", group.required, "true");
  check("and described by its own description", group.description,
    "Choose a direction or describe another task.");
  const c = rowOf(q.choiceTid("approvals"));
  check("a choice is a radio", name(c), "radio");
  check("carrying its own description", c.description,
    "Ask before sensitive or destructive actions.");
  check("and its shortcut, which the badge only draws", c.keyShortcut, "B");
  check("the free-text answer is a textbox", name(rowOf(q.inputTid())), "textbox");

  // After a refusal the group is invalid, and the error REPLACES the
  // description — reading both leaves a reader to work out which still holds.
  q.next();
  const bad = rowOf(q.itemTid());
  check("a refused item is marked invalid", bad.invalid, "true");
  check("and described by the error", bad.description, "Choose an option to continue.");

  // The multiple-choice item is a plain group of checkboxes, which is what
  // the two Base UI primitives underneath would be.
  const { q: q2 } = mk();
  q2.choose("approvals");
  q2.next();
  check("a multiple-choice item is a group", H.EVGA11yRole.ariaName(q2.rows().find((r) => r.tid === q2.itemTid()).role), "group");
  check("of checkboxes", H.EVGA11yRole.ariaName(q2.rows().find((r) => r.tid === q2.choiceTid("risks")).role), "checkbox");
  check("and it is not required", q2.rows().find((r) => r.tid === q2.itemTid()).required, "");
}

const total = pass + fail;
console.log("");
console.log(`${pass}/${total} questionnaire behaviours`);
console.log("  Not stated by the source and therefore not built: whether Skip records a");
console.log("  marker, whether Previous wraps from the first item, what the shortcuts do");
console.log("  past Z, and whether an answered required item can be un-answered.");
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
