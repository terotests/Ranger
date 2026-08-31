#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Capture what @headless-tree/core does during a KEYBOARD drag.
//
// The DOM cannot be the oracle here. A keyboard drag moves a target between
// rows and BETWEEN rows, and the library publishes none of that as an
// attribute — a run of arrow presses produces a trace in which nothing at all
// changes until the drop lands. So this asks the library directly, the way
// `table_oracle.mjs` asks TanStack, and writes down every drag target step by
// step.
//
// What is recorded per step:
//
//   kind          "item" (drop INTO a row) or "line" (drop BETWEEN two rows)
//   item          the target row, or for a line its PARENT ("" is the root)
//   childIndex    where among the parent's children the line sits
//   insertionIndex the same index corrected for the rows about to be removed
//   lineIndex     which visible row the line sits above
//   lineLevel     its depth, in the library's terms: -1 root, 0 top level
//   focused       where DOM focus is, because it follows an item target only
//   order         the visible rows afterwards, which is all a drop changes
//
//   node gallery/ui/conformance/oracle/tree_dnd_oracle.mjs
//
// Writes oracle/tree-dnd.json. `ui:tree:dnd:check` compares TreeCtl against it.

import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.resolve(HERE, "..", "dom");

// One fixture, several runs. It is deliberately awkward: a folder with two
// children so there is a last-in-group boundary, a nested folder so there is a
// level to step out of, a leaf next to a folder so the `isFolder` rule in
// `canDrop` has something to skip, and a CLOSED folder so a target can be
// rejected for being closed rather than for being a leaf.
export const FIXTURE = {
  controls: [
    {
      type: "tree",
      tid: "tr",
      root: "crm",
      indent: 20,
      selection: true,
      dnd: true,
      // `acme` open too, so `jane` is a visible row. A run that points at a row
      // which is not visible cannot be measured on either side.
      expanded: ["leads", "accounts", "acme", "ops", "ops-team"],
      items: [
        { value: "crm", name: "CRM", children: ["leads", "accounts", "activities", "ops"] },
        // `archive` is a folder that is CLOSED, and it is first so that
        // `contacted-lead` stays the last of its group. Auto-open needs one:
        // `openOnDropDelay` fires only on a folder that is not already open,
        // and every other folder in this fixture is expanded.
        { value: "leads", name: "Leads", children: ["archive", "new-lead", "contacted-lead"] },
        { value: "archive", name: "Archive", children: ["old-deal"] },
        { value: "old-deal", name: "Old Deal" },
        { value: "new-lead", name: "New Lead" },
        { value: "contacted-lead", name: "Contacted Lead" },
        // Two children, so `jane` (last in acme's group, level 2) is followed by
        // a row at level 1 rather than level 0. Without that, the reparent
        // level's `max(minLevel, …)` clamp never bites and a mutation removing
        // it survives every case.
        { value: "accounts", name: "Accounts", children: ["acme", "globex"] },
        { value: "globex", name: "Globex" },
        { value: "acme", name: "Acme Corp", children: ["jane"] },
        // Declared, not only referenced. The first version named `jane` as
        // acme's child and never declared the node, so one side rendered a
        // nameless row and the other skipped it — and the two disagreed about
        // the fixture before either had done anything.
        { value: "jane", name: "Jane Doe" },
        { value: "activities", name: "Activities" },
        // A chain two deep at the very END of the tree, so its last row has
        // NOTHING below it and the reparent floor is 0. Everywhere else in
        // this fixture the floor is high enough to swallow the cursor's own
        // answer, and `max(minLevel, floor(leftPixels / indent))` reduces to
        // `minLevel` — which is how a version that never read `leftPixels` at
        // all passed every case. The names are long on purpose: `leftPixels`
        // is a fraction of the row's real WIDTH, and a narrow row cannot
        // reach the second indent.
        { value: "ops", name: "Operations and Delivery", children: ["ops-team"] },
        { value: "ops-team", name: "Operations Team Handover", children: ["ops-lead"] },
        { value: "ops-lead", name: "Operations Lead Handover" },
      ],
    },
  ],
};

// Pointer runs. `over` is [row, xFraction, yFraction] — where in the row's
// rectangle the cursor sits, because that is the whole of what decides a
// placement: the vertical third picks above / into / below, and the horizontal
// position picks which LEVEL to reparent to at the end of a group.
export const POINTER_RUNS = [
  {
    name: "pointer: above a row",
    from: "new-lead",
    over: [["contacted-lead", 0.5, 0.1]],
    drop: true,
  },
  {
    name: "pointer: into a folder",
    from: "new-lead",
    over: [["accounts", 0.5, 0.55]],
    drop: true,
  },
  {
    name: "pointer: below a row",
    from: "new-lead",
    over: [["contacted-lead", 0.5, 0.9]],
    drop: true,
  },
  {
    name: "pointer: the last in a group, out to the left",
    from: "new-lead",
    over: [["contacted-lead", 0.02, 0.9]],
    drop: true,
  },
  {
    name: "pointer: an open folder takes children rather than siblings",
    from: "activities",
    over: [["leads", 0.5, 0.55]],
    drop: true,
  },
  {
    name: "pointer: moving across rows without dropping",
    from: "new-lead",
    over: [
      ["contacted-lead", 0.5, 0.1],
      ["accounts", 0.5, 0.55],
      ["activities", 0.5, 0.9],
    ],
    drop: false,
  },
  {
    // A row nothing may be dropped INTO has no middle: the reorder band grows
    // from 30% to 50% of it, so 0.4 is "above" here and would be "below" if
    // the band were fixed. `activities` is a leaf.
    name: "pointer: a leaf has no middle",
    from: "new-lead",
    over: [["activities", 0.5, 0.4]],
    drop: false,
  },
  {
    // An EXPANDED folder takes children from anywhere below its top band —
    // including the bottom of the row, where an ordinary row would reorder
    // BELOW. That branch is the only thing that makes the difference.
    name: "pointer: the bottom of an open folder is still inside it",
    from: "new-lead",
    over: [["leads", 0.5, 0.9]],
    drop: false,
  },
  {
    // Far left on the last row of a nested group. The level it lands on is
    // clamped by the row BELOW — here `globex` at level 1 — so pointing at
    // level 0 does not get you level 0.
    name: "pointer: a reparent cannot go further out than the row below",
    from: "new-lead",
    over: [["jane", 0.01, 0.9]],
    drop: false,
  },
  {
    // A target that cannot be dropped on leaves the PREVIOUS one standing —
    // the library returns before it writes, which is what stops the drop
    // indicator flickering off as the cursor crosses a row it cannot use.
    //
    // Reaching that state takes some care: the only way a computed target
    // fails the check is a REPARENT whose new parent is one of the dragged
    // rows. Dragging `accounts` and pointing far-left at `jane`, which is
    // inside it, is that case — and the step before it puts a good target in
    // place so "kept" and "cleared" are different answers.
    name: "pointer: a bad target leaves the last good one alone",
    from: "accounts",
    over: [
      ["leads", 0.5, 0.1],
      ["jane", 0.01, 0.9],
    ],
    drop: false,
  },
  {
    // The library keys its dragover on a DRAG CODE — row, placement type and
    // reparent level — and returns early when the code has not changed. The
    // catch is that the code's placement is computed with `canMakeChild`
    // forced TRUE, while the target's is computed with the real value. So on a
    // row nothing may be dropped into, 0.4 and 0.6 produce the SAME code
    // (both in the 0.3–0.7 middle) but DIFFERENT targets (above and below the
    // 0.5 split). The second move is swallowed, and the target stays "above".
    name: "pointer: the same drag code twice is not recomputed",
    from: "new-lead",
    over: [
      ["activities", 0.5, 0.4],
      ["activities", 0.5, 0.6],
    ],
    drop: false,
  },
  {
    // `openOnDropDelay`, 800ms by default: hold a drag over a CLOSED folder
    // and it opens under the cursor, so a drop can go somewhere that was not
    // visible when the drag began.
    name: "pointer: holding over a closed folder opens it",
    from: "new-lead",
    over: [["archive", 0.5, 0.5, 900]],
    drop: false,
  },
  {
    // And it does not open if the cursor leaves first: the timer checks that
    // the drag code is still the one it was armed with.
    name: "pointer: leaving a closed folder before the delay does not open it",
    from: "new-lead",
    over: [
      ["archive", 0.5, 0.5],
      ["contacted-lead", 0.5, 0.1, 900],
    ],
    drop: false,
  },
  {
    // Far left on the last row of the deepest group, with nothing below it.
    // The floor is 0, so the level is whatever the cursor says — one indent
    // in means level 1, which is `ops` rather than `ops-team`. This is the
    // only run in which `floor(leftPixels / indent)` decides anything.
    name: "pointer: how far in the cursor is picks the reparent level",
    from: "new-lead",
    over: [["ops-lead", 0.14, 0.9]],
    drop: true,
  },
  {
    // And one indent further out is the root itself.
    name: "pointer: further out again is the root",
    from: "new-lead",
    over: [["ops-lead", 0.02, 0.9]],
    drop: true,
  },
  {
    // Same row, same placement TYPE, different reparent LEVEL. The level is
    // part of the drag code, so these are two different codes and the second
    // move is not swallowed — the line walks out from `ops` to the root
    // without the cursor leaving the row.
    name: "pointer: the reparent level is part of the drag code",
    from: "new-lead",
    over: [
      ["ops-lead", 0.14, 0.9],
      ["ops-lead", 0.02, 0.9],
    ],
    drop: false,
  },
  {
    // Half the delay is not the delay.
    name: "pointer: a short hold over a closed folder opens nothing",
    from: "new-lead",
    over: [["archive", 0.5, 0.5, 400]],
    drop: false,
  },
  {
    // But two short holds are, because a repeat of the same move does not
    // restart the timer — the dragover returns on the drag code before it
    // reaches the arming, so the 800ms runs from the FIRST arrival.
    name: "pointer: two short holds add up to the delay",
    from: "new-lead",
    over: [
      ["archive", 0.5, 0.5, 400],
      ["archive", 0.5, 0.5, 500],
    ],
    drop: false,
  },
  {
    // The indicator and the drop can disagree, and this is the case where
    // they do. The drag code swallows the move from 0.4 to 0.6, so the line
    // stays ABOVE `activities` — but `onDrop` computes its own target from
    // its own coordinates and lands BELOW. Anything that drops the stored
    // target instead of recomputing gets this one wrong.
    name: "pointer: the drop recomputes and lands where the line did not",
    from: "new-lead",
    over: [
      ["activities", 0.5, 0.4],
      ["activities", 0.5, 0.6],
    ],
    drop: true,
  },
  {
    // The top band of a closed folder is a reorder, not a make-child, and a
    // folder only opens under a cursor that is pointing INTO it. Held for
    // longer than the delay, and `archive` stays shut.
    name: "pointer: hovering above a closed folder does not open it",
    from: "new-lead",
    over: [["archive", 0.5, 0.1, 900]],
    drop: false,
  },
  {
    // Pointing into a closed folder that is inside the rows being dragged.
    // The placement is make-child, so the timer is armed — and there is no
    // legal target, so when it fires it declines. Dragging `leads` and
    // pointing at its own child `archive` is that case, and without the
    // check `archive` would open under a drag that can never land in it.
    name: "pointer: a folder with nowhere to drop does not open",
    from: "leads",
    over: [["archive", 0.5, 0.5, 900]],
    drop: false,
  },
  {
    name: "pointer: onto itself, which is not allowed",
    from: "accounts",
    // 0.6 and not 0.5: with no make-child allowed the reorder band is half the
    // row, so exactly 0.5 sits ON the threshold and the answer depends on how
    // the rectangle rounds. A test should not straddle a boundary it is not
    // about.
    over: [["accounts", 0.5, 0.6]],
    drop: false,
  },
];

export const RUNS = [
  {
    name: "leaf out of its folder",
    click: "new-lead",
    keys: ["Control+Shift+KeyD", "ArrowDown", "ArrowDown", "ArrowDown", "Enter"],
  },
  {
    name: "walking up instead",
    click: "contacted-lead",
    keys: ["Control+Shift+KeyD", "ArrowUp", "ArrowUp", "ArrowUp", "Enter"],
  },
  {
    name: "a folder, dragged whole",
    click: "acme",
    keys: ["Control+Shift+KeyD", "ArrowDown", "ArrowDown", "Enter"],
  },
  {
    name: "escape leaves everything alone",
    click: "new-lead",
    keys: ["Control+Shift+KeyD", "ArrowDown", "ArrowDown", "Escape"],
  },
  {
    name: "two selected rows travel together",
    click: "new-lead",
    extraClicks: [["contacted-lead", ["Control"]]],
    keys: ["Control+Shift+KeyD", "ArrowDown", "ArrowDown", "ArrowDown", "Enter"],
  },
];

async function main() {
  const esbuild = requireDom("esbuild");
  await esbuild.build({
    entryPoints: [path.join(DOM_DIR, "app.jsx")],
    bundle: true,
    outfile: path.join(DOM_DIR, "bundle.js"),
    loader: { ".jsx": "jsx" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });

  const { chromium } = requireDom("playwright-core");
  const browser = await chromium.launch({ executablePath: findChromium() });
  const out = { fixture: FIXTURE, runs: [] };

  for (const run of RUNS) {
    const page = await browser.newPage();
    await page.addInitScript(`window.__FIXTURE__ = ${JSON.stringify(FIXTURE)};`);
    await page.goto(pathToFileURL(path.join(DOM_DIR, "index.html")).href);
    await page.waitForFunction("window.__READY__ === true");

    const look = () =>
      page.evaluate(() => {
        const t = window.__treeProbe;
        const st = t.getState();
        const tgt = st.dnd && st.dnd.dragTarget;
        const el = document.activeElement;
        return {
          dragging: !!st.dnd,
          dragged: st.dnd && st.dnd.draggedItems ? st.dnd.draggedItems.map((d) => d.getId()) : [],
          kind: tgt ? ("childIndex" in tgt ? "line" : "item") : "none",
          item: tgt ? tgt.item.getId() : "",
          childIndex: tgt && "childIndex" in tgt ? tgt.childIndex : -1,
          insertionIndex: tgt && "insertionIndex" in tgt ? tgt.insertionIndex : -1,
          lineIndex: tgt && "dragLineIndex" in tgt ? tgt.dragLineIndex : -1,
          lineLevel: tgt && "dragLineLevel" in tgt ? tgt.dragLineLevel : -99,
          focused: el && el.dataset && el.dataset.tid ? el.dataset.tid : "",
          order: t.getItems().map((i) => i.getId()),
        };
      });

    await page.locator(`[data-tid="tr-item-${run.click}"]`).click({ force: true });
    for (const [id, mods] of run.extraClicks || []) {
      await page.locator(`[data-tid="tr-item-${id}"]`).click({ force: true, modifiers: mods });
    }
    const steps = [{ step: "start", ...(await look()) }];
    for (const k of run.keys) {
      await page.keyboard.press(k);
      await page.waitForTimeout(90);
      steps.push({ step: k, ...(await look()) });
    }
    out.runs.push({ name: run.name, click: run.click, extraClicks: run.extraClicks || [], keys: run.keys, steps });
    await page.close();
  }

  // --- the pointer runs -------------------------------------------------------
  //
  // Real HTML5 drag events, dispatched at a stated point inside a row. Playwright
  // cannot drive native drag-and-drop through the mouse, so these are synthetic
  // DragEvents — which is exactly what the library reads: `clientX`, `clientY`
  // and the row's own rectangle, and nothing else.
  out.pointerRuns = [];
  for (const run of POINTER_RUNS) {
    const page = await browser.newPage();
    await page.addInitScript(`window.__FIXTURE__ = ${JSON.stringify(FIXTURE)};`);
    await page.goto(pathToFileURL(path.join(DOM_DIR, "index.html")).href);
    await page.waitForFunction("window.__READY__ === true");

    const look = () =>
      page.evaluate(() => {
        const t = window.__treeProbe;
        const st = t.getState();
        const tgt = st.dnd && st.dnd.dragTarget;
        return {
          dragging: !!st.dnd,
          dragged: st.dnd && st.dnd.draggedItems ? st.dnd.draggedItems.map((d) => d.getId()) : [],
          selected: st.selectedItems ? st.selectedItems.slice() : [],
          kind: tgt ? ("childIndex" in tgt ? "line" : "item") : "none",
          item: tgt ? tgt.item.getId() : "",
          childIndex: tgt && "childIndex" in tgt ? tgt.childIndex : -1,
          insertionIndex: tgt && "insertionIndex" in tgt ? tgt.insertionIndex : -1,
          lineIndex: tgt && "dragLineIndex" in tgt ? tgt.dragLineIndex : -1,
          lineLevel: tgt && "dragLineLevel" in tgt ? tgt.dragLineLevel : -99,
          order: t.getItems().map((i) => i.getId()),
        };
      });

    await page.evaluate((id) => {
      const el = document.querySelector(`[data-tid="tr-item-${id}"]`);
      const dt = new DataTransfer();
      el.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
      window.__dt = dt;
    }, run.from);
    const steps = [{ step: "dragstart " + run.from, ...(await look()) }];

    for (const [id, fx, fy, wait] of run.over) {
      await page.evaluate(
        ([id2, fx2, fy2]) => {
          const el = document.querySelector(`[data-tid="tr-item-${id2}"]`);
          const b = el.getBoundingClientRect();
          el.dispatchEvent(
            new DragEvent("dragover", {
              bubbles: true,
              cancelable: true,
              dataTransfer: window.__dt,
              clientX: b.left + b.width * fx2,
              clientY: b.top + b.height * fy2,
            }),
          );
        },
        [id, fx, fy],
      );
      // A fourth number on an `over` step is a HOLD, in ms. It is how
      // `openOnDropDelay` gets measured at all: the folder opens 800ms after
      // the cursor arrives, so the capture has to sit still for longer than
      // that and then look again.
      await page.waitForTimeout(wait ?? 40);
      // The two numbers the placement logic actually reads. Recorded rather
      // than the fractions, because `leftPixels` is measured against the row's
      // real WIDTH — which the two implementations have no reason to share, and
      // the contract under test is the placement rule and not the layout.
      const geom = await page.evaluate(
        ([id2, fx2, fy2]) => {
          const el = document.querySelector(`[data-tid="tr-item-${id2}"]`);
          const b = el.getBoundingClientRect();
          return { topPercent: fy2, leftPixels: b.width * fx2 };
        },
        [id, fx, fy],
      );
      steps.push({
        step: `dragover ${id} ${fx} ${fy}` + (wait ? ` +${wait}ms` : ""),
        over: id,
        wait: wait ?? 0,
        ...geom,
        ...(await look()),
      });
    }

    if (run.drop) {
      // The drop event carries the SAME point as the last dragover, because the
      // item's `onDrop` recomputes the target from the event's own coordinates
      // rather than reading the one the dragover stored. A drop dispatched with
      // no clientX/clientY reads `topPercent` as a large negative and lands
      // "above" whatever the pointer was actually over — which is what the
      // first capture recorded, and it looked like the drop had done nothing.
      const [lastId, lastFx, lastFy] = run.over[run.over.length - 1];
      await page.evaluate(
        ([id2, fx2, fy2]) => {
          const el = document.querySelector(`[data-tid="tr-item-${id2}"]`);
          const b = el.getBoundingClientRect();
          el.dispatchEvent(
            new DragEvent("drop", {
              bubbles: true,
              cancelable: true,
              dataTransfer: window.__dt,
              clientX: b.left + b.width * fx2,
              clientY: b.top + b.height * fy2,
            }),
          );
        },
        [lastId, lastFx, lastFy],
      );
      await page.waitForTimeout(120);
      steps.push({ step: "drop", over: lastId, ...(await look()) });
    }

    out.pointerRuns.push({ name: run.name, from: run.from, over: run.over, drop: !!run.drop, steps });
    await page.close();
  }

  await browser.close();
  const file = path.join(HERE, "tree-dnd.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  console.log("wrote " + path.relative(process.cwd(), file));
  for (const r of out.runs.concat(out.pointerRuns)) {
    console.log("  " + r.name + ": " + r.steps.length + " steps, ends " + JSON.stringify(r.steps[r.steps.length - 1].order));
  }
}

await main();
