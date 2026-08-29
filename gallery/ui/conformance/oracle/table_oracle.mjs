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
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender,
} from "@tanstack/react-table";

const ROWS = ${JSON.stringify(ROWS)};
const columns = [
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "role", accessorKey: "role", header: "Role" },
  { id: "size", accessorKey: "size", header: "Size" },
];

function App() {
  const [sorting, setSorting] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 4 });
  const table = useReactTable({
    data: ROWS,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (r) => r.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  window.__table = table;
  window.__ready = true;
  return null;
}
createRoot(document.getElementById("root")).render(React.createElement(App));
`;

async function capture(page) {
  return page.evaluate(async () => {
    const out = {};
    // Every mutation goes through React state, so the table object is REPLACED
    // on the next render. Reading it back synchronously reads the old one and
    // reports that nothing happened — which is exactly what the first run of
    // this file said: five clicks on a header and the sorting still `[]`.
    const t = () => window.__table;
    const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const step = async (fn) => { fn(); await settle(); };
    const order = () => t().getRowModel().rows.map((r) => r.id);
    const sortState = () => JSON.stringify(t().getState().sorting);

    // --- 1. the sort cycle
    //
    // Three clicks on one header. A hand-written table almost always toggles
    // between two states forever; this records whether there is a third.
    const cycle = [
      { click: 0, sorting: sortState(), order: order(), isSorted: t().getColumn("name").getIsSorted() },
    ];
    for (let i = 1; i <= 4; i++) {
      await step(() => t().getColumn("name").toggleSorting());
      cycle.push({
        click: i, sorting: sortState(), order: order(),
        isSorted: t().getColumn("name").getIsSorted(),
      });
    }
    out.sortCycle = cycle;

    // Which way a NUMERIC column starts, versus a text one. They differ, and
    // the reason is that "first click" means "most useful first click".
    await step(() => t().resetSorting());
    await step(() => t().getColumn("name").toggleSorting());
    const textFirst = t().getColumn("name").getIsSorted();
    await step(() => t().resetSorting());
    await step(() => t().getColumn("size").toggleSorting());
    const numberFirst = t().getColumn("size").getIsSorted();
    out.firstClickDirection = { text: textFirst, number: numberFirst };

    // The NUMERIC column's whole cycle, not just its first click. A three-state
    // cycle that starts the other way round could plausibly be
    // desc -> asc -> none or desc -> none -> asc, and choosing by taste is how
    // a table ends up disagreeing with every other table.
    await step(() => t().resetSorting());
    const numCycle = [{ click: 0, isSorted: t().getColumn("size").getIsSorted() }];
    for (let i = 1; i <= 4; i++) {
      await step(() => t().getColumn("size").toggleSorting());
      numCycle.push({
        click: i,
        isSorted: t().getColumn("size").getIsSorted(),
        order: t().getRowModel().rows.map((r) => r.id),
      });
    }
    out.numericSortCycle = numCycle;
    await step(() => t().resetSorting());

    // --- 2. selection
    await step(() => t().resetRowSelection());
    // NOT `resetPagination()`. Pagination is controlled here, so reset puts
    // back TanStack's own default of ten per page rather than the four this
    // probe was set up with — and the whole capture then measured a one-page
    // table: `toggleAllPageRowsSelected` selected all six rows and looked like
    // a bug in the library.
    await step(() => t().setPagination({ pageIndex: 0, pageSize: 4 }));
    const selState = () => ({
      selected: Object.keys(t().getState().rowSelection).sort(),
      allPageRows: t().getIsAllPageRowsSelected(),
      somePageRows: t().getIsSomePageRowsSelected(),
      allRows: t().getIsAllRowsSelected(),
      someRows: t().getIsSomeRowsSelected(),
      selectedCount: t().getSelectedRowModel().rows.length,
    });
    const sel = [{ after: "nothing", ...selState() }];
    await step(() => t().getRowModel().rows[0].toggleSelected(true));
    sel.push({ after: "one row on page 1", ...selState() });
    await step(() => t().toggleAllPageRowsSelected(true));
    sel.push({ after: "toggleAllPageRows(true)", ...selState() });
    await step(() => t().toggleAllRowsSelected(true));
    sel.push({ after: "toggleAllRows(true)", ...selState() });
    await step(() => t().toggleAllPageRowsSelected(false));
    sel.push({ after: "toggleAllPageRows(false)", ...selState() });
    out.selection = sel;
    await step(() => t().resetRowSelection());

    // --- 3. pagination
    const pageState = () => ({
      pageIndex: t().getState().pagination.pageIndex,
      pageCount: t().getPageCount(),
      rowsOnPage: t().getRowModel().rows.length,
      canPrevious: t().getCanPreviousPage(),
      canNext: t().getCanNextPage(),
      ids: t().getRowModel().rows.map((r) => r.id),
    });
    await step(() => t().setPagination({ pageIndex: 0, pageSize: 4 }));
    const pages = [{ after: "start", ...pageState() }];
    await step(() => t().nextPage());
    pages.push({ after: "nextPage", ...pageState() });
    await step(() => t().nextPage());
    pages.push({ after: "nextPage past the end", ...pageState() });
    await step(() => t().previousPage());
    pages.push({ after: "previousPage", ...pageState() });
    await step(() => t().setPageIndex(0));
    await step(() => t().previousPage());
    pages.push({ after: "previousPage at the start", ...pageState() });
    out.pagination = pages;

    // --- 4. sorting and pagination together: does sorting reset the page?
    await step(() => t().setPagination({ pageIndex: 1, pageSize: 4 }));
    await step(() => t().getColumn("name").toggleSorting());
    out.sortWhilePaged = {
      pageIndexAfterSorting: t().getState().pagination.pageIndex,
      ids: t().getRowModel().rows.map((r) => r.id),
    };

    // --- 5. what TanStack contributes to accessibility. Nothing, and saying so
    // in the capture is the point: the ARIA below has to come from elsewhere.
    out.ariaFromTanstack = {
      headerHasAriaSort: "getColumn(...).columnDef has no aria anything",
      keysOnHeaderContext: Object.keys(t().getHeaderGroups()[0].headers[0]).sort(),
    };
    return out;
  });
}

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".table-probe.jsx");
const bundle = path.join(HERE, ".table-probe.js");
fs.writeFileSync(entry, PROBE);
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

const html = `<!doctype html><meta charset="utf-8"><div id="root"></div><script src="./.table-probe.js"></script>`;
const pageFile = path.join(HERE, ".table-probe.html");
fs.writeFileSync(pageFile, html);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__ready === true", null, { timeout: 20000 });
const data = await capture(page);
const version = createRequire(path.join(DOM_DIR, "package.json"))("@tanstack/react-table/package.json").version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.rmSync(f, { force: true });

const file = path.join(HERE, "table.json");
fs.writeFileSync(file, JSON.stringify({ tanstack: version, rows: ROWS, ...data }, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), file) + "  (@tanstack/react-table " + version + ")");
console.log(JSON.stringify(data.sortCycle, null, 1));
