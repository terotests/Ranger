#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// ScrollerCtl: the policy, and the browser fact it stands on.
//
//   node gallery/ui/conformance/oracle/scroller_check.mjs
//
// shadcn's MessageScroller has no primitive under it — React Aria Components
// does not ship one — so the POLICY here is specification, taken from the
// prose in the component's own demo. What is NOT specification is the ground
// it stands on, measured in Chromium on a plain overflow container:
//
//   scrollTop comes back INTEGER-CLAMPED. Setting it to `bottom - 0.4` lands
//   exactly on the bottom, so "nearly at the bottom" by less than a pixel is
//   not a state a browser can be in. Hence a one-pixel threshold rather than
//   a smaller number pretending to be more careful.
//
//   Appending content does NOT keep the bottom: scrollTop stayed at 545 while
//   the gap grew to 37, the height of the added row. The container drifts
//   away from the newest message by itself. That is the whole reason this
//   component exists, and the reason `contentGrew` has to scroll rather than
//   trust the viewport to hold its place.
//
// The specified half is asserted as behaviour, not as pixels: pinned or not,
// unseen or not, the button present or not, and in or out of the tab order.

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

// A viewport 200 tall over 800 of content: 600 of scroll, six screens of
// transcript, which is enough to be somewhere other than an end.
const mk = () => {
  const host = new H.UiHost();
  const c = host.addScroller("sc", "Conversation");
  c.setViewport(600, 800, 200);
  c.build();
  return { host, c };
};
const shape = (c) => ({
  top: Math.round(c.scrollTop),
  pinned: c.pinned,
  unseen: c.unseen,
  button: c.buttonVisible(),
  tabbable: c.isFocusable(c.buttonTid()),
});
const fmt = (s) => `top=${s.top} pinned=${s.pinned} unseen=${s.unseen} button=${s.button} tab=${s.tabbable}`;

console.log("at rest, pinned to the bottom");
{
  const { c } = mk();
  check("it is at the bottom", c.atBottom(), true);
  check("auto-scroll is on", c.pinned, true);
  check("nothing is unseen", c.unseen, false);
  check("and there is no button to press", c.buttonVisible(), false);
  // The reference's own words: no ghost focus stops.
  check("which is also out of the tab order", c.isFocusable(c.buttonTid()), false);
}

console.log("tokens arrive while they are at the bottom");
{
  const { c } = mk();
  c.contentGrew(900);
  check("the view follows them down", c.scrollTop, 700);
  check("still pinned", c.pinned, true);
  check("and nothing is unseen", c.unseen, false);
}

console.log("they scroll up to re-read something");
{
  const { c } = mk();
  c.userScrolledTo(200);
  check("auto-scroll backs off", c.pinned, false);
  c.contentGrew(900);
  // The whole point: their position is PRESERVED. A version that scrolled
  // anyway would be the bug the component exists to fix.
  check("their position is untouched", c.scrollTop, 200);
  check("and the new content is marked unseen", c.unseen, true);
  check("so the button appears", c.buttonVisible(), true);
  check("and is tabbable while it is there", c.isFocusable(c.buttonTid()), true);
}

console.log("one tap goes back to the newest and re-engages");
{
  const { c } = mk();
  c.userScrolledTo(200);
  c.contentGrew(900);
  c.build();
  c.activate(c.buttonTid());
  check("it jumps to the bottom", c.scrollTop, 700);
  check("auto-scroll is on again", c.pinned, true);
  check("nothing is unseen", c.unseen, false);
  check("and the button is gone", c.buttonVisible(), false);
  check("and out of the tab order with it", c.isFocusable(c.buttonTid()), false);
}

console.log("scrolling back down by hand does the same");
{
  const { c } = mk();
  c.userScrolledTo(200);
  c.contentGrew(900);
  check("unseen while away", c.unseen, true);
  c.userScrolledTo(700);
  check("returning clears it", c.unseen, false);
  check("and re-engages auto-scroll", c.pinned, true);
  // Both halves of the button's rule: unseen alone would leave it up here.
  check("no button, because they have caught up", c.buttonVisible(), false);
}

console.log("an anchored turn settles near the top, with a peek");
{
  const { c } = mk();
  // A turn beginning 300 into the content: it should NOT snap to the bottom.
  c.anchorTo(300);
  check("it sits a peek above the turn", c.scrollTop, 300 - c.peek);
  check("which is not the bottom", c.atBottom(), false);
  check("so auto-scroll is off", c.pinned, false);
  // And a turn near the end cannot scroll past the end.
  const { c: c2 } = mk();
  c2.anchorTo(100000);
  check("an anchor past the end clamps", c2.scrollTop, 600);
  check("and that IS the bottom, so it re-engages", c2.pinned, true);
}

console.log("the edges");
{
  const { c } = mk();
  c.userScrolledTo(-500);
  check("scrolling above the top clamps", c.scrollTop, 0);
  c.userScrolledTo(99999);
  check("and below the bottom clamps", c.scrollTop, 600);
  // Content shorter than the viewport: max scroll is zero and everything is
  // the bottom, so the button must never appear.
  const host = new H.UiHost();
  const s = host.addScroller("sc2", "Short");
  s.setViewport(0, 50, 200);
  check("a transcript shorter than its box is at the bottom", s.atBottom(), true);
  s.contentGrew(60);
  check("and growing it keeps that true", s.atBottom(), true);
  check("with no button", s.buttonVisible(), false);
}

console.log("unseen and at the bottom at once");
{
  // A HOLE THIS GATE HAD. Mutating `buttonVisible` to ignore whether they are
  // at the bottom changed nothing: every case above has unseen true only
  // while they are away, so the two halves of the rule never disagreed and
  // the mutation passed 37/37.
  //
  // The state is reachable — a resize with a taller box has less to scroll,
  // so the reader can arrive at the bottom without moving — and it is now
  // handled where it happens: `setViewport` clears `unseen` when it lands
  // there, for the same reason scrolling there does.
  const { c } = mk();
  c.userScrolledTo(200);
  c.contentGrew(900);
  check("away from the bottom with something unseen", fmt(shape(c)),
    "top=200 pinned=false unseen=true button=true tab=true");
  // The box grows until there is nothing left to scroll.
  c.setViewport(200, 900, 900);
  check("a resize that reaches the bottom clears it", fmt(shape(c)),
    "top=200 pinned=true unseen=false button=false tab=false");

  // And the guard itself, on a state built by hand — which is the only way to
  // reach it now that the transitions all clear the flag, and is worth
  // keeping precisely because a later change could re-open the door.
  const { c: c2 } = mk();
  c2.unseen = true;
  check("at the bottom, an unseen flag still offers no button",
    c2.atBottom() && c2.unseen && c2.buttonVisible() === false, true);
}

console.log("what a reader is told");
{
  const { c } = mk();
  c.userScrolledTo(200);
  c.contentGrew(900);
  c.build();
  const rows = c.rows();
  const byTid = (t) => rows.find((r) => r.tid === t);
  const log = byTid(c.contentTid());
  check("the transcript is a log", H.EVGA11yRole.ariaName(log.role), "log");
  const b = byTid(c.buttonTid());
  check("the button is a button", H.EVGA11yRole.ariaName(b.role), "button");
  check("named for what it does", b.name, "Jump to newest message");
  check("and a tab stop while it is up", b.tabStop, true);
  c.jumpToBottom();
  c.build();
  check("gone from the tree once they are caught up",
    c.rows().find((r) => r.tid === c.buttonTid()) === undefined, true);
}

const total = pass + fail;
console.log("");
console.log(`${pass}/${total} scroller behaviours`);
console.log("  aria-relevant=additions is the reference's other half and has no field");
console.log("  here — recorded rather than half-claimed. It is also the browser default");
console.log("  for a log, so the gap is smaller than it looks; it is still a gap.");
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
