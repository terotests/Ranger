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
      expanded: ["leads", "accounts"],
      items: [
        { value: "crm", name: "CRM", children: ["leads", "accounts", "activities"] },
        { value: "leads", name: "Leads", children: ["new-lead", "contacted-lead"] },
        { value: "new-lead", name: "New Lead" },
        { value: "contacted-lead", name: "Contacted Lead" },
        { value: "accounts", name: "Accounts", children: ["acme"] },
        { value: "acme", name: "Acme Corp", children: ["jane"] },
        // Declared, not only referenced. The first version named `jane` as
        // acme's child and never declared the node, so one side rendered a
        // nameless row and the other skipped it — and the two disagreed about
        // the fixture before either had done anything.
        { value: "jane", name: "Jane Doe" },
        { value: "activities", name: "Activities" },
      ],
    },
  ],
};

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

  await browser.close();
  const file = path.join(HERE, "tree-dnd.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  console.log("wrote " + path.relative(process.cwd(), file));
  for (const r of out.runs) {
    console.log("  " + r.name + ": " + r.steps.length + " steps, ends " + JSON.stringify(r.steps[r.steps.length - 1].order));
  }
}

await main();
