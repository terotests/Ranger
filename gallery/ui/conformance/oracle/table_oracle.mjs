/**
 * TanStack Table, asked what it actually does.
 *
 *   node gallery/ui/conformance/oracle/table_oracle.mjs
 *
 * Writes `table.json` beside this file. `TableCtl.rgr` is built against these
 * numbers and `behaviours.json` catalogues them; nothing reads the file at run
 * time.
 *
 * WHY TANSTACK AND NOT RADIX. Radix has no table, and ReUI's is
 * `@tanstack/react-table` underneath — as is every shadcn-family one. So that
 * is the oracle, exactly as dnd-kit is the oracle for the sortable.
 *
 * But it is a NARROWER oracle than dnd-kit, and pretending otherwise would be
 * the whole mistake. dnd-kit owns its accessibility: it writes the
 * roledescription, the aria-pressed and the announcements, so copying dnd-kit
 * gets those right for free. TanStack is headless — it computes state and
 * hands you nothing to render. There is no `aria-sort` in it, no roles, no
 * announcements, not one attribute.
 *
 * So this file captures the two things TanStack really decides, and the ARIA
 * comes from the HTML table spec and the WAI-ARIA grid pattern instead:
 *
 * IT DRIVES THE REFERENCE COMPONENT, NOT A STAND-IN. An earlier version built
 * its own little TanStack table beside `dom/app.jsx`'s, and the two disagreed
 * about whether sorting resets the page — twice, for two different reasons.
 * Both times the stand-in was wrong: `autoResetPageIndex` defaults to ON, and
 * whether it fires depends on how the table is WIRED, which is precisely the
 * part a headless library leaves to its caller. So the oracle renders the same
 * component the conformance harness compares against and clicks the same test
 * ids a person would. One source of truth, and the question cannot come back.
 *
 *   1. The SORT CYCLE. Three clicks on a header is the question, and the
 *      answer is not the obvious one — see `sortCycle` below.
 *   2. The SELECTION arithmetic, including what the header checkbox reads as
 *      when some but not all rows are chosen, and whether "all" means the page
 *      or the table.
 *   3. The PAGINATION arithmetic at the edges.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");

// Six rows, so a page size of 4 gives one full page and one short one — the
// short page is where pagination arithmetic goes wrong.
const ROWS = [
  { id: "r1", name: "Ada", role: "Engineer", size: 30 },
  { id: "r2", name: "Grace", role: "Admiral", size: 10 },
  { id: "r3", name: "Alan", role: "Logician", size: 20 },
  { id: "r4", name: "Edsger", role: "Engineer", size: 50 },
  { id: "r5", name: "Barbara", role: "Geneticist", size: 40 },
  { id: "r6", name: "Katherine", role: "Mathematician", size: 60 },
];

const PROBE = `
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "__APP__";
createRoot(document.getElementById("root")).render(
  React.createElement(App, { fixture: window.__FIXTURE__ }),
);
window.__ready = true;
`;

const FIXTURE = {
  controls: [
    {
      type: "table",
      tid: "tb",
      name: "People",
      pageSize: 4,
      columns: [
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "size", label: "Size", numeric: true },
      ],
      rows: ROWS.map((r) => ({ key: r.id, cells: [r.name, r.role, String(r.size)] })),
    },
  ],
};

async function capture(page) {
  // Every question is asked by clicking, and every answer is read off the
  // table object the component publishes. Nothing here reaches past the
  // component to call a library method — that is the door that gave the wrong
  // answers.
  const click = async (tid) => {
    await page.locator(`[data-tid="${tid}"]`).click({ force: true });
    await page.waitForTimeout(40);
  };
  const read = () =>
    page.evaluate(() => {
      const t = window.__tableProbe;
      const s = t.getState();
      return {
        sorting: JSON.stringify(s.sorting),
        nameSorted: t.getColumn("name").getIsSorted(),
        sizeSorted: t.getColumn("size").getIsSorted(),
        order: t.getRowModel().rows.map((r) => r.id),
        pageIndex: s.pagination.pageIndex,
        pageCount: t.getPageCount(),
        rowsOnPage: t.getRowModel().rows.length,
        canPrevious: t.getCanPreviousPage(),
        canNext: t.getCanNextPage(),
        selected: Object.keys(s.rowSelection).sort(),
        selectedCount: t.getSelectedRowModel().rows.length,
        allPageRows: t.getIsAllPageRowsSelected(),
        somePageRows: t.getIsSomePageRowsSelected(),
        allRows: t.getIsAllRowsSelected(),
      };
    });
  const reset = () =>
    page.evaluate(async () => {
      const t = window.__tableProbe;
      t.resetSorting();
      t.resetRowSelection();
      t.setPagination({ pageIndex: 0, pageSize: 4 });
      await new Promise((r) => setTimeout(r, 60));
    });

  const out = {};

  // --- 1. the sort cycle, four clicks on one header
  await reset();
  const cycle = [{ click: 0, ...(await read()) }];
  for (let i = 1; i <= 4; i++) {
    await click("tb-col-name");
    cycle.push({ click: i, ...(await read()) });
  }
  out.sortCycle = cycle.map((r) => ({
    click: r.click, sorting: r.sorting, isSorted: r.nameSorted, order: r.order,
  }));

  // --- 2. and on a numeric one, which starts the other way round
  await reset();
  const numCycle = [{ click: 0, ...(await read()) }];
  for (let i = 1; i <= 4; i++) {
    await click("tb-col-size");
    numCycle.push({ click: i, ...(await read()) });
  }
  out.numericSortCycle = numCycle.map((r) => ({
    click: r.click, isSorted: r.sizeSorted, order: r.order,
  }));
  out.firstClickDirection = {
    text: out.sortCycle[1].isSorted,
    number: out.numericSortCycle[1].isSorted,
  };

  // --- 3. selection, through the checkbox and the rows
  await reset();
  const sel = [{ after: "nothing", ...(await read()) }];
  await click("tb-check-r1");
  sel.push({ after: "one row on page 1", ...(await read()) });
  await click("tb-selectall");
  sel.push({ after: "the header box", ...(await read()) });
  await click("tb-next");
  await click("tb-selectall");
  sel.push({ after: "and again on page 2", ...(await read()) });
  await click("tb-prev");
  await click("tb-selectall");
  sel.push({ after: "clearing page 1", ...(await read()) });
  out.selection = sel.map((r) => ({
    after: r.after, selected: r.selected, selectedCount: r.selectedCount,
    allPageRows: r.allPageRows, somePageRows: r.somePageRows, allRows: r.allRows,
  }));

  // --- 4. paging, and what the controls say at the ends
  await reset();
  const pages = [{ after: "start", ...(await read()) }];
  await click("tb-next");
  pages.push({ after: "next", ...(await read()) });
  await click("tb-next");
  pages.push({ after: "next again, on the last page", ...(await read()) });
  await click("tb-prev");
  pages.push({ after: "prev", ...(await read()) });
  await click("tb-prev");
  pages.push({ after: "prev again, on the first page", ...(await read()) });
  out.pagination = pages.map((r) => ({
    after: r.after, pageIndex: r.pageIndex, pageCount: r.pageCount,
    rowsOnPage: r.rowsOnPage, canPrevious: r.canPrevious, canNext: r.canNext, ids: r.order,
  }));

  // --- 5. sorting while paged
  await reset();
  await click("tb-next");
  const before = await read();
  await click("tb-col-name");
  const after = await read();
  out.sortWhilePaged = {
    pageIndexBefore: before.pageIndex,
    pageIndexAfterSorting: after.pageIndex,
    ids: after.order,
    $comment:
      "autoResetPageIndex defaults to ON, so re-ordering puts you back on the " +
      "first page. Page two of the old order means nothing.",
  };

  return out;
}

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".table-probe.jsx");
const bundle = path.join(HERE, ".table-probe.js");
fs.writeFileSync(
  entry,
  // A plain path, not a file:// URL: esbuild resolves imports as paths.
  PROBE.replace("__APP__", path.join(DOM_DIR, "app.jsx").split(path.sep).join("/")));
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outfile: bundle,
  loader: { ".jsx": "jsx" },
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(DOM_DIR, "node_modules")],
  logLevel: "silent",
});

const html =
  `<!doctype html><meta charset="utf-8">` +
  `<script>window.__FIXTURE__ = ${JSON.stringify(FIXTURE)};</script>` +
  `<div id="root"></div><script src="./.table-probe.js"></script>`;
const pageFile = path.join(HERE, ".table-probe.html");
fs.writeFileSync(pageFile, html);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__tableProbe !== undefined", null, { timeout: 20000 });
const data = await capture(page);
const version = createRequire(path.join(DOM_DIR, "package.json"))("@tanstack/react-table/package.json").version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.rmSync(f, { force: true });

const file = path.join(HERE, "table.json");
fs.writeFileSync(file, JSON.stringify({ tanstack: version, rows: ROWS, ...data }, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), file) + "  (@tanstack/react-table " + version + ")");
console.log("sort cycle:", data.sortCycle.map((r) => r.isSorted).join(" -> "));
console.log("numeric   :", data.numericSortCycle.map((r) => r.isSorted).join(" -> "));
console.log("sorting while paged:", JSON.stringify(data.sortWhilePaged));
