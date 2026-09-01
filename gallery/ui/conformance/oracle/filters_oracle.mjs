/**
 * TanStack Table's column filters, asked what they actually do.
 *
 *   node gallery/ui/conformance/oracle/filters_oracle.mjs
 *
 * Writes `filters.json` beside this file. `FilterCtl.rgr` is built against
 * these answers and `filters_check.mjs` gates them; nothing reads the file at
 * run time.
 *
 * WHY TANSTACK. The shadcn filter bar — the row of chips reading
 * "Assignee has any of ●●● +1" — is a presentation over `columnFilters`.
 * Every shadcn-family data table is `@tanstack/react-table` underneath, so the
 * PREDICATE half of the component belongs to this library and can be measured.
 *
 * TWO THINGS THIS FILE LEARNED THE HARD WAY, both from a first version that
 * called `filterFns.x(row, id, value)` directly and wrote down what came back:
 *
 *   THE PREDICATE IS NOT THE WHOLE FUNCTION. `getFilteredRowModel` runs
 *   `filterFn.resolveFilterValue` on the filter value first. `inNumberRange`
 *   has one, and it is what turns a blank bound into an open end. Called
 *   directly, `inNumberRange(5, [null, 10])` is FALSE; called the way the
 *   table calls it, it is true. Both are recorded below, because the gap
 *   between them is the trap.
 *
 *   `autoRemove` IS A SETTER, NOT A FILTER. It runs inside
 *   `table.setColumnFilters` and nowhere else. A component that owns its own
 *   filter state and pushes `columnFilters` in — which is exactly what a
 *   filter bar with its own rule tree does — never goes through that setter,
 *   so an empty multi-select is applied verbatim and hides every row. The
 *   `wired` section below measures both routes and they disagree.
 *
 * THE FINDING THAT SHAPES THE RANGER SIDE. `columnFilters` is a flat array,
 * ANDed, one entry per column. It cannot express "priority is urgent OR
 * assignee has any of these", and it cannot nest. The state the shadcn filter
 * bar carries — the tree with `combinator` and `rules` — is therefore NOT
 * TanStack's state. It is a layer above it. So the PREDICATES are measured
 * here, the TREE, the operators and the chips are specified, and the split is
 * recorded rather than blurred.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");
const require = createRequire(path.join(DOM_DIR, "package.json"));

const core = require("@tanstack/table-core");
const { filterFns, createTable, getCoreRowModel, getFilteredRowModel } = core;

// ---------------------------------------------------------------------------
// 1. The predicates.
//
// Each probe is a place an implementation guesses, not a place it is obvious.
// The cell value and the filter value are both recorded so the JSON reads as a
// truth table rather than as a list of booleans.
//
// `raw` calls the predicate with the filter value as written. `resolved` runs
// `resolveFilterValue` first, which is what `getFilteredRowModel` does — so
// `resolved` is the answer to build against and `raw` is kept only to show
// where the two part company.
// ---------------------------------------------------------------------------
const rowOf = (v) => ({ getValue: () => v });
const call = (name, cell, fv, resolve) => {
  const f = filterFns[name];
  const value = resolve && f.resolveFilterValue ? f.resolveFilterValue(fv) : fv;
  try {
    return f(rowOf(cell), "c", value, () => {}) === true;
  } catch (e) {
    return { threw: e.constructor.name };
  }
};

const PROBES = {
  // Substring, and which way the case falls. The chip says "contains".
  includesString: [
    ["Ada Lovelace", "ada"],
    ["Ada Lovelace", "ADA"],
    ["Ada Lovelace", "lace"],
    ["Ada Lovelace", "adalovelace"],
    ["Ada Lovelace", ""],
    ["Ada Lovelace", " "],
    [42, "4"],
    [null, "a"],
  ],
  includesStringSensitive: [
    ["Ada Lovelace", "ada"],
    ["Ada Lovelace", "Ada"],
  ],
  // "is" on a single-value column.
  equalsString: [
    ["urgent", "urgent"],
    ["urgent", "URGENT"],
    ["urgent", "urg"],
    [null, "urgent"],
  ],
  equals: [
    ["urgent", "urgent"],
    [3, 3],
    [3, "3"],
    [null, null],
  ],
  weakEquals: [
    [3, "3"],
    ["3", 3],
    [0, ""],
  ],
  // The multi-select operators. `arrIncludes` takes a SCALAR filter value
  // against an array cell; the other two take an array.
  arrIncludes: [
    [["ada", "grace"], "ada"],
    [["ada", "grace"], "alan"],
    // The array operators compare with `.includes`, so unlike the string ones
    // they should be case SENSITIVE. Probed rather than reasoned about,
    // because "the string ones fold case" is the assumption that would carry
    // over by habit.
    [["ada", "grace"], "Ada"],
  ],
  arrIncludesAll: [
    [["ada", "grace", "alan"], ["ada", "grace"]],
    [["ada", "grace"], ["ada", "alan"]],
    [["ada", "grace"], []],
    [["ada", "grace"], ["Ada"]],
  ],
  arrIncludesSome: [
    [["ada", "grace"], ["alan", "grace"]],
    [["ada", "grace"], ["alan", "katherine"]],
    [["ada", "grace"], []],
    [[], ["ada"]],
    [["ada", "grace"], ["Ada"]],
  ],
  // A range chip with one end left blank is the common case, and the one an
  // implementation gets wrong. `null` rather than `undefined` because these
  // probes are serialised to JSON, and an undefined would vanish from the
  // record — a blank bound has to be visible in the file to be a fixture.
  inNumberRange: [
    [5, [1, 10]],
    [1, [1, 10]],
    [10, [1, 10]],
    [0, [1, 10]],
    [11, [1, 10]],
    [5, [null, 10]],
    [5, [1, null]],
    [5, [null, null]],
    [5, [10, 1]],
    ["5", [1, 10]],
  ],
};

const predicates = {};
for (const [fn, cases] of Object.entries(PROBES)) {
  predicates[fn] = cases.map(([cell, fv]) => {
    const raw = call(fn, cell, fv, false);
    const resolved = call(fn, cell, fv, true);
    const row = { cell, filter: fv, pass: resolved };
    // Only recorded where it differs, so the noise stays out of the file and
    // the one place it matters is impossible to miss.
    if (raw !== resolved) row.rawPass = raw;
    return row;
  });
}

const resolvesFilterValue = Object.keys(filterFns).filter(
  (k) => typeof filterFns[k].resolveFilterValue === "function",
);

// ---------------------------------------------------------------------------
// 2. autoRemove — the rule nobody guesses, and its real scope.
//
// A column filter whose value is "falsey" is dropped from `columnFilters`
// entirely. Which values count differs per function: `arrIncludesSome` also
// drops an empty array, which the plain falsey test would not, and
// `inNumberRange` drops only a range with BOTH ends blank.
//
// `shouldAutoRemoveFilter` in ColumnFiltering.ts ORs the per-function test
// with two of its own — undefined, and the empty string — so those two are
// dropped for every function whether or not its own test says so. That
// combined answer is what `effective` records; `own` is the function's test
// alone.
// ---------------------------------------------------------------------------
const AUTO_VALUES = [
  { label: "empty string", v: "" },
  { label: "undefined", v: undefined },
  { label: "null", v: null },
  { label: "zero", v: 0 },
  { label: "empty array", v: [] },
  { label: "one-element array", v: ["ada"] },
  { label: "both ends blank", v: [undefined, undefined] },
  { label: "lower bound only", v: [1, undefined] },
  { label: "upper bound only", v: [undefined, 10] },
];

// Mirrors shouldAutoRemoveFilter, so the file records the answer the table
// acts on rather than the answer one half of it gives.
const effectiveRemove = (f, v) =>
  (f.autoRemove ? f.autoRemove(v) === true : false) ||
  typeof v === "undefined" ||
  (typeof v === "string" && !v);

const autoRemove = {};
for (const fn of Object.keys(filterFns)) {
  const f = filterFns[fn];
  autoRemove[fn] = AUTO_VALUES.map(({ label, v }) => ({
    value: label,
    own: f.autoRemove ? f.autoRemove(v) === true : false,
    effective: effectiveRemove(f, v),
  }));
}

// ---------------------------------------------------------------------------
// 3. A wired table, down both routes.
//
// Same six people as `table_oracle.mjs`, given the columns the screenshot's
// chips name. `pushed` assigns state the way a component with its own filter
// model does; `set` routes the same filters through `table.setColumnFilters`,
// which is the only place `autoRemove` runs.
// ---------------------------------------------------------------------------
const ROWS = [
  { id: "r1", title: "Ship the parser", assignee: ["ada"], priority: "urgent", points: 8 },
  { id: "r2", title: "Fix the lexer", assignee: ["grace", "ada"], priority: "high", points: 3 },
  { id: "r3", title: "Write the docs", assignee: [], priority: "low", points: 1 },
  { id: "r4", title: "Ship the linker", assignee: ["alan"], priority: "urgent", points: 13 },
  { id: "r5", title: "Audit the tests", assignee: ["katherine", "grace"], priority: "medium", points: 5 },
  { id: "r6", title: "Trim the atlas", assignee: ["ada"], priority: "low", points: 2 },
];

const COLUMNS = [
  { id: "title", accessorKey: "title", filterFn: "includesString" },
  { id: "assignee", accessorKey: "assignee", filterFn: "arrIncludesSome" },
  { id: "priority", accessorKey: "priority", filterFn: "equalsString" },
  { id: "points", accessorKey: "points", filterFn: "inNumberRange" },
];

const blankState = (columnFilters) => ({
  columnFilters,
  sorting: [],
  pagination: { pageIndex: 0, pageSize: 100 },
  rowSelection: {},
  expanded: {},
  grouping: [],
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  columnSizingInfo: {
    startOffset: null, startSize: null, deltaOffset: null,
    deltaPercentage: null, isResizingColumn: false, columnSizingStart: [],
  },
  columnVisibility: {},
  globalFilter: undefined,
});

function makeTable(initial) {
  let state = blankState(initial);
  const table = createTable({
    data: ROWS,
    columns: COLUMNS,
    state,
    getRowId: (r) => r.id,
    onStateChange: (u) => { state = typeof u === "function" ? u(state) : u; },
    onColumnFiltersChange: (u) => {
      state = { ...state, columnFilters: typeof u === "function" ? u(state.columnFilters) : u };
      table.setOptions((prev) => ({ ...prev, state }));
    },
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  return { table, read: () => state };
}

const report = (table, read) => ({
  rows: table.getFilteredRowModel().rows.map((r) => r.id),
  applied: read().columnFilters.map((f) => f.id),
});

// Route A: the component owns the state and hands it over as it is.
function pushed(columnFilters) {
  const { table, read } = makeTable(columnFilters);
  return report(table, read);
}

// Route B: every filter goes in through the table's own setter.
function setThrough(columnFilters) {
  const { table, read } = makeTable([]);
  table.setColumnFilters(columnFilters);
  return report(table, read);
}

const CASES = {
  none: [],
  urgent: [{ id: "priority", value: "urgent" }],
  anyOfTwo: [{ id: "assignee", value: ["ada", "alan"] }],
  // Two chips at once. TanStack ANDs them; there is no way to say OR.
  twoChips: [
    { id: "priority", value: "urgent" },
    { id: "assignee", value: ["ada"] },
  ],
  // The chip a person has opened but not filled in yet.
  emptyMulti: [{ id: "assignee", value: [] }],
  emptyText: [{ id: "title", value: "" }],
  // A row whose cell is an empty array, against a filter naming four people:
  // "unassigned" is not a value you can select, so it can only fall out.
  unassigned: [{ id: "assignee", value: ["ada", "grace", "alan", "katherine"] }],
  // A one-sided range, and a wholly blank one.
  atLeastFive: [{ id: "points", value: [5, undefined] }],
  blankRange: [{ id: "points", value: [undefined, undefined] }],
};

const wired = {};
for (const [name, filters] of Object.entries(CASES)) {
  wired[name] = { pushed: pushed(filters), set: setThrough(filters) };
}

// ---------------------------------------------------------------------------
// 4. What TanStack CANNOT do, stated as data rather than left implied.
// ---------------------------------------------------------------------------
const FINDINGS = {
  columnFiltersAreAnded: {
    what:
      "`columnFilters` is a flat array of {id, value}, one per column, and " +
      "every entry must pass. `twoChips` returns the intersection.",
    consequence:
      "The `combinator` in the shadcn filter state has no TanStack " +
      "equivalent. An OR group, and any nesting at all, is evaluated by the " +
      "component and never reaches the table. FilterCtl therefore owns the " +
      "tree and its evaluation, and compiles to `columnFilters` only for the " +
      "one shape TanStack can hold: a single top-level AND of one rule per " +
      "column.",
  },
  autoRemoveIsSetterOnly: {
    what:
      "`emptyMulti` down the two routes disagrees: through the setter the " +
      "filter is dropped and all six rows survive; pushed in as state it is " +
      "applied and NO row survives. `shouldAutoRemoveFilter` is called from " +
      "`table.setColumnFilters` and from `column.setFilterValue`, and from " +
      "nowhere in the filtering itself.",
    consequence:
      "A filter bar that keeps its own tree does not get this cleanup, so " +
      "it must do the emptiness test itself before compiling a rule down. " +
      "FilterCtl treats an empty rule as INERT — it contributes nothing to " +
      "the predicate rather than matching nothing — which is what the setter " +
      "route does and what a half-built chip must do.",
  },
  resolveFilterValueIsPartOfTheFn: {
    what:
      `Only ${JSON.stringify(resolvesFilterValue)} carries a ` +
      "`resolveFilterValue`, and `getFilteredRowModel` runs it before the " +
      "predicate. Without it a blank bound compares as NaN and the row " +
      "fails; with it a blank bound becomes an open end. Rows carrying " +
      "`rawPass` in the predicates section are exactly the ones where this " +
      "changed the answer.",
    consequence:
      "'The predicate' is the pair, not the function. FilterCtl's range " +
      "operator normalises its bounds before comparing, and the gate covers " +
      "a blank lower bound, a blank upper bound and both blank.",
  },
  autoRemoveDiffersPerFn: {
    what:
      "`inNumberRange` drops the filter only when BOTH ends are blank; " +
      "`arrIncludesSome` also drops an empty array, which the shared falsey " +
      "test would not (an empty array is truthy). The shared test adds " +
      "undefined and the empty string on top of whatever the function says.",
    consequence:
      "'Is this rule empty?' is a per-operator question, not one shared " +
      "predicate. FilterCtl asks it per operator.",
  },
  noOperatorVocabulary: {
    what:
      "TanStack has nine filter functions and no notion of an operator " +
      "label, a negation, or which operators a column type offers.",
    consequence:
      "`is` / `is not` / `has any of` / `has none of` and the mapping from " +
      "a column type to its operator list are SPECIFIED from the component, " +
      "not measured. Where an operator is the negation of a measured one, " +
      "its predicate is the measured one inverted, and the gate proves that " +
      "on the measured cases rather than on cases invented for it.",
  },
  arrayOperatorsAreCaseSensitive: {
    what:
      "`arrIncludesSome` on [\"ada\",\"grace\"] against [\"Ada\"] is recorded " +
      "above, beside `equalsString` on \"urgent\" against \"URGENT\". The " +
      "string operators fold case and the array ones do not.",
    consequence:
      "One case rule for the whole component would be wrong for half of it. " +
      "FilterCtl folds case for the text and single-value operators and " +
      "compares the multi-value ones exactly, which is also the right answer " +
      "for the thing they hold: an option's stored value is an id, not prose.",
  },
  invertedRangeIsSwapped: {
    what:
      "`resolveFilterValue` on [10, 1] returns [1, 10] — it compares the two " +
      "parsed bounds and swaps them when min > max. So a range typed " +
      "backwards matches the same rows as the same range typed forwards, " +
      "recorded above as the [10,1] probe passing for the cell 5.",
    consequence:
      "A person dragging two number inputs past each other does not get an " +
      "empty table. FilterCtl swaps too, and the gate covers it — this is " +
      "the sort of quiet kindness that gets dropped in a reimplementation " +
      "because nobody writes it down.",
  },
  numbersAreCoercedOnBothSides: {
    what:
      "`inNumberRange` on the string \"5\" against [1,10] passes: the bounds " +
      "go through parseFloat in `resolveFilterValue` and the cell is " +
      "compared with `>=`/`<=`, which coerces. `includesString` on the " +
      "number 42 against \"4\" also passes, via String().",
    consequence:
      "A column whose cells arrive as strings still filters as numbers. " +
      "Recorded because the opposite is the plausible guess.",
  },
};

const version = require("@tanstack/table-core/package.json").version;
const file = path.join(HERE, "filters.json");
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      note:
        "Captured by filters_oracle.mjs from @tanstack/table-core. The " +
        "predicates, autoRemove and the two wiring routes are MEASURED; the " +
        "operator vocabulary, the rule tree and the chip surface are " +
        "specified — see FINDINGS.",
      library: `@tanstack/table-core@${version}`,
      resolvesFilterValue,
      rows: ROWS,
      predicates,
      autoRemove,
      wired,
      FINDINGS,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), file)}`);
