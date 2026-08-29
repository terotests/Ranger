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
// `sortStateOf` speaks aria-sort's vocabulary: 1 none, 2 ascending, 3
// descending, and 0 for something that has no aria-sort at all. TanStack's
// `getIsSorted()` says `false` where ARIA says "none", so the two are mapped
// here rather than either side bending to the other.
const dir = (t, k) => ({ 0: "false", 1: "false", 2: "asc", 3: "desc" })[t.sortStateOf(k)];
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
    if (row.click > 0) t.press("tbl-col-name");
    check(`click ${row.click} direction`, dir(t, "name"), row.isSorted);
    check(`click ${row.click} order`, ids(t), row.order.join(" "));
  }
}
console.log("sort cycle, numeric column");
{
  const t = mk();
  for (const row of oracle.numericSortCycle) {
    if (row.click > 0) t.press("tbl-col-size");
    check(`click ${row.click} direction`, dir(t, "size"), row.isSorted);
    if (row.order) check(`click ${row.click} order`, ids(t), row.order.join(" "));
  }
}
console.log("selection");
{
  const t = mk();
  const st = () => ({
    selected: t.records.filter((r) => r.selected).map((r) => r.key).sort(),
    allPageRows: t.selectAllState() === 2,
    somePageRows: t.selectAllState() === 3,
    selectedCount: t.selectedCount(),
  });
  // The same five moments the capture recorded, made by the same clicks.
  const w = oracle.selection;
  const same = (a, b) =>
    JSON.stringify({
      selected: a.selected, allPageRows: a.allPageRows,
      somePageRows: a.somePageRows, selectedCount: a.selectedCount,
    }) ===
    JSON.stringify({
      selected: b.selected, allPageRows: b.allPageRows,
      somePageRows: b.somePageRows, selectedCount: b.selectedCount,
    });
  const step = (i, fn) => {
    if (fn) fn();
    const got = st();
    const ok = same(got, w[i]);
    if (!ok) bad++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"} ${w[i].after}: ${JSON.stringify(got.selected)}` +
        (ok ? "" : `   want ${JSON.stringify(w[i].selected)}`),
    );
  };
  step(0, null);
  // The CHECKBOX, not the row: selection is a control you can reach, not a
  // click target that happens to be large.
  step(1, () => t.press("tbl-check-r1"));
  step(2, () => t.press("tbl-selectall"));
  step(3, () => { t.press("tbl-next"); t.press("tbl-selectall"); });
  step(4, () => { t.press("tbl-prev"); t.press("tbl-selectall"); });
}
console.log("pagination");
{
  const t = mk();
  const st = () =>
    `idx=${t.pageIndex} rows=${t.pageRecords().length} prev=${t.canPrevious()} next=${t.canNext()} ${ids(t)}`;
  const fmt = (r) =>
    `idx=${r.pageIndex} rows=${r.rowsOnPage} prev=${r.canPrevious} next=${r.canNext} ${r.ids.join(" ")}`;
  const w = oracle.pagination;
  // Clicked, including the two clicks that must do NOTHING because the control
  // is at an end. That the button is disabled rather than the page running
  // past the last row is the behaviour, not an implementation detail.
  check(w[0].after, st(), fmt(w[0]));
  t.press("tbl-next");
  check(w[1].after, st(), fmt(w[1]));
  t.press("tbl-next");
  check(w[2].after, st(), fmt(w[2]));
  t.press("tbl-prev");
  check(w[3].after, st(), fmt(w[3]));
  t.press("tbl-prev");
  check(w[4].after, st(), fmt(w[4]));
}
console.log("sorting while paged");
{
  const t = mk();
  t.press("tbl-next");
  check("page before sorting", t.pageIndex, oracle.sortWhilePaged.pageIndexBefore);
  t.press("tbl-col-name");
  check("page after sorting", t.pageIndex, oracle.sortWhilePaged.pageIndexAfterSorting);
  check("rows shown", ids(t), oracle.sortWhilePaged.ids.join(" "));
}
console.log(bad ? `\nRESULT FAIL — failed=${bad}` : "\nRESULT OK — failed=0");
process.exitCode = bad ? 1 : 0;
