/**
 * The document both editors open, and the key script both editors are given.
 * Keeping them here rather than in the runner is what makes the comparison a
 * comparison: neither adapter can quietly use a different workload.
 */

/** A small, exactly known document — behaviour is asserted against columns. */
export const PARITY_DOC = [
  "const alpha = 1;",
  "function beta(rows) {",
  "  return rows.length;",
  "}",
  "",
  "// tail",
].join("\n");

/** A big one, for the timings. */
export function bigDoc(lines) {
  const out = [];
  for (let i = 0; i < lines; i++) {
    out.push(`const line${i} = compute(${i}, "value ${i}");`);
  }
  return out.join("\n");
}

/**
 * One keyboard step. `keys` are pressed in order with Playwright, so both
 * editors receive real key events through their own focused element.
 */
export const KEY_SCRIPT = [
  { name: "Ctrl+Home", keys: ["Control+Home"] },
  { name: "ArrowRight x3", keys: ["ArrowRight", "ArrowRight", "ArrowRight"] },
  { name: "Ctrl+ArrowRight", keys: ["Control+ArrowRight"] },
  { name: "Ctrl+ArrowRight again", keys: ["Control+ArrowRight"] },
  { name: "Ctrl+ArrowLeft", keys: ["Control+ArrowLeft"] },
  { name: "Home", keys: ["Home"] },
  { name: "End", keys: ["End"] },
  { name: "ArrowDown (keeps the column)", keys: ["ArrowDown"] },
  { name: "ArrowDown onto a shorter line", keys: ["ArrowDown", "ArrowDown"] },
  { name: "ArrowUp back to a long line", keys: ["ArrowUp", "ArrowUp"] },
  { name: "Ctrl+End", keys: ["Control+End"] },
  { name: "Shift+ArrowLeft x2", keys: ["Shift+ArrowLeft", "Shift+ArrowLeft"] },
  { name: "Shift+ArrowUp", keys: ["Shift+ArrowUp"] },
  { name: "ArrowRight collapses", keys: ["ArrowRight"] },
  { name: "type 'zz'", keys: [], type: "zz" },
  { name: "Backspace", keys: ["Backspace"] },
  { name: "Enter", keys: ["Enter"] },
  { name: "Tab", keys: ["Tab"] },
  { name: "Escape then Tab", keys: ["Escape", "Tab"], focusMayLeave: true },
];

export function formatTable(rows, headers) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)),
  );
  const line = (cells) =>
    "| " + cells.map((c, i) => String(c ?? "").padEnd(widths[i])).join(" | ") + " |";
  const rule = "|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|";
  return [line(headers), rule, ...rows.map(line)].join("\n");
}
