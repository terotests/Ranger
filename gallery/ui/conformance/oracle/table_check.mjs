/**
 * TableCtl against the numbers TanStack actually produced.
 *
 *   node gallery/ui/conformance/oracle/table_check.mjs
 *
 * The conformance harness compares the two systems through a browser and a
 * trace. This is smaller and blunter and runs in CI without one: the same six
 * rows, the same clicks, and TanStack's own recorded answers out of
 * `table.json`.
 *
 * It exists because the state machine is where a table is got wrong, and the
 * three places it is got wrong are all invisible in a screenshot: a two-state
 * sort toggle, a numeric column that sorts ascending first, and a header
 * checkbox that clears rows it is not showing.
 *
 * The ONE deliberate difference is printed rather than asserted — see the note
 * about `nextPage`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "table.json"), "utf8"));
const mk = () => {
  const t = new H.TableCtl();
  t.tid = "tbl";
  t.addColumn("name", "Name", false, true);
  t.addColumn("role", "Role", false, true);
  t.addColumn("size", "Size", true, true);
  for (const r of oracle.rows) t.addRecord(r.id, [r.name, r.role, String(r.size)]);
  t.pageSize = 4;
  return t;
};
const ids = (t) => t.pageRecords().map((r) => r.key).join(" ");
const dir = (t, k) => ({ 0: "false", 1: "asc", 2: "desc" })[t.sortStateOf(k)];
let bad = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};

console.log("sort cycle, text column (oracle vs TableCtl)");
{
  const t = mk();
  for (const row of oracle.sortCycle) {
    if (row.click > 0) t.toggleSort("name");
    check(`click ${row.click} direction`, dir(t, "name"), row.isSorted);
    check(`click ${row.click} order`, ids(t), row.order.join(" "));
  }
}
console.log("sort cycle, numeric column");
{
  const t = mk();
  for (const row of oracle.numericSortCycle) {
    if (row.click > 0) t.toggleSort("size");
    check(`click ${row.click} direction`, dir(t, "size"), row.isSorted);
    if (row.order) check(`click ${row.click} order`, ids(t), row.order.join(" "));
  }
}
console.log("selection");
{
  const t = mk();
  const st = () => ({
    sel: t.records.filter((r) => r.selected).map((r) => r.key).sort().join(","),
    all: t.selectAllState() === 2,
    some: t.selectAllState() === 3,
    n: t.selectedCount(),
  });
  const want = oracle.selection;
  check("nothing selected", JSON.stringify(st()), JSON.stringify({ sel: "", all: false, some: false, n: 0 }));
  t.setRowSelected("r1", true);
  check("one row", JSON.stringify(st()), JSON.stringify({ sel: "r1", all: false, some: true, n: 1 }));
  t.toggleAllOnPage();
  check("all on page", JSON.stringify(st()), JSON.stringify({ sel: "r1,r2,r3,r4", all: true, some: false, n: 4 }));
  for (const r of ["r5", "r6"]) t.setRowSelected(r, true);
  check("then all rows", JSON.stringify(st()), JSON.stringify({ sel: "r1,r2,r3,r4,r5,r6", all: true, some: false, n: 6 }));
  t.toggleAllOnPage();
  check("clearing the page leaves the rest", JSON.stringify(st()), JSON.stringify({ sel: "r5,r6", all: false, some: false, n: 2 }));
}
console.log("pagination");
{
  const t = mk();
  const st = () => `idx=${t.pageIndex} count=${t.pageCount()} rows=${t.pageRecords().length} prev=${t.canPrevious()} next=${t.canNext()} ${ids(t)}`;
  const w = oracle.pagination;
  const fmt = (r) => `idx=${r.pageIndex} count=${r.pageCount} rows=${r.rowsOnPage} prev=${r.canPrevious} next=${r.canNext} ${r.ids.join(" ")}`;
  check("start", st(), fmt(w[0]));
  t.nextPage();
  check("nextPage", st(), fmt(w[1]));
  t.nextPage();
  // The one deliberate difference: TanStack walks past the end, this clamps.
  console.log(`  NOTE nextPage past the end: TanStack -> idx=${w[2].pageIndex} rows=${w[2].rowsOnPage}; TableCtl -> idx=${t.pageIndex} rows=${t.pageRecords().length}`);
  t.previousPage();
  t.previousPage();
  check("back at the start", st(), fmt(w[4]));
}
console.log("sorting while paged keeps the page");
{
  const t = mk();
  t.pageIndex = 1;
  t.toggleSort("name");
  check("page index", t.pageIndex, oracle.sortWhilePaged.pageIndexAfterSorting);
  check("rows shown", ids(t), oracle.sortWhilePaged.ids.join(" "));
}
// `failed=0` is the marker `scripts/run-gallery-editor-tests.sh` looks for.
console.log(bad ? `\nRESULT FAIL — failed=${bad}` : "\nRESULT OK — failed=0");
process.exitCode = bad ? 1 : 0;
