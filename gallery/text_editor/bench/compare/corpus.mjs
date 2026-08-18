/**
 * Shared corpus + operation list for Ranger EVG editor vs canvas-editor.
 * Keep this list in sync with gallery/text_editor/bench/editor_bench.rgr.
 */

export function makeCorpus(lines) {
  const out = [];
  for (let i = 0; i < lines; i++) {
    out.push(
      `L${i} the quick brown fox jumps over the lazy dog ${i}`
    );
  }
  return out;
}

export function corpusText(lines) {
  return makeCorpus(lines).join("\n");
}

/** Ordered ops both adapters must implement. */
export const OPS = [
  "init",
  "open_document",
  "first_paint",
  "scroll_1000_lines",
  "insert_char",
  "insert_1000_chars",
  "backspace",
  "select_100_lines",
  "replace_selection",
  "select_all",
  "resize_window",
  "jump_line",
];

export function parseArgs(argv = process.argv.slice(2)) {
  let lines = 1000;
  let engines = ["ranger", "canvas-editor"];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--lines" && argv[i + 1]) {
      lines = parseInt(argv[++i], 10);
    } else if (argv[i] === "--engine" && argv[i + 1]) {
      engines = [argv[++i]];
    } else if (/^\d+$/.test(argv[i])) {
      lines = parseInt(argv[i], 10);
    }
  }
  return { lines, engines };
}

export function formatTable(results) {
  const engines = results.map((r) => r.engine);
  const opNames = OPS.filter((op) =>
    results.some((r) => r.ops && r.ops[op] != null)
  );
  const colW = Math.max(22, ...engines.map((e) => e.length + 2));
  let out = "";
  out += "op".padEnd(22) + engines.map((e) => e.padStart(colW)).join("") + "\n";
  out += "-".repeat(22 + colW * engines.length) + "\n";
  for (const op of opNames) {
    const row = [op.padEnd(22)];
    for (const r of results) {
      const ms = r.ops?.[op];
      row.push(
        (ms == null ? "—" : `${ms.toFixed(1)} ms`).padStart(colW)
      );
    }
    out += row.join("") + "\n";
  }
  out += "-".repeat(22 + colW * engines.length) + "\n";
  const totals = results.map((r) => {
    const t = Object.values(r.ops || {}).reduce((a, b) => a + b, 0);
    return `${t.toFixed(1)} ms`.padStart(colW);
  });
  out += "TOTAL".padEnd(22) + totals.join("") + "\n";
  return out;
}
