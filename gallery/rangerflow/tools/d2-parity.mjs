/**
 * d2-parity.mjs — how much of D2's own examples RangerFlow reads.
 *
 * Two inputs, neither of them an opinion:
 *
 *   harness/out/d2.json             computed by D2 itself (d2lib.Compile)
 *   harness/out/rangerflow_d2.json  computed by RangerFlow's reader
 *
 * over the same corpus, `fixtures/d2/`. Every file is compared on what a
 * reader can be wrong about — which objects exist and how deep they are, what
 * they are labelled and shaped, which of them are connected and with which
 * arrowheads, the rows of a `sql_table` and the members of a `class`, and the
 * boards the file declares.
 *
 *   npm run rangerflow:d2:parity
 *   npm run rangerflow:d2:parity -- --diff     every mismatch, in full
 *
 * **No geometry.** D2's oracle can answer it — it hands back every position
 * and every route — and it is deliberately not compared: RangerFlow lays a
 * diagram out with its own layered layout, and scoring that against dagre
 * would measure two layouts rather than one reader.
 *
 * The two vocabularies meet here and nowhere else. D2's answer is what it
 * *drew*: `shape: circle` comes back as `oval` and `square` as `rectangle`,
 * because that is the primitive it drew, and an arrowhead's `filled` is folded
 * into its name. RangerFlow's model keeps what was *written*. Translating in
 * one file keeps the model free of a foreign library's spelling.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "D2_PARITY.md");
const argv = process.argv.slice(2);
const wantDiff = argv.includes("--diff");

function read(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const oracle = read("d2.json");
const mine = read("rangerflow_d2.json");
if (!mine) {
  console.error("  no rangerflow_d2.json — run `npm run rangerflow:d2:dump` first");
  process.exit(1);
}

/** D2 answers with the primitive it drew; the reader keeps what was written. */
const DRAWN = { "": "rectangle", circle: "oval", square: "rectangle" };
const drawnShape = (s) => DRAWN[s] ?? s;

/**
 * A sequence diagram's lifelines are drawn as connections to invented
 * endpoints (`api-lifeline-end-1730115758`). They are D2 drawing a lifeline,
 * not a connection the file declared, so they are not a reader's to match.
 */
const isLifeline = (c) => /-lifeline-end-\d+$/.test(c.dst ?? "");

const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

function oracleObjects(diagram) {
  return (diagram.shapes ?? []).map((s) => ({
    id: s.id,
    label: norm(s.label),
    shape: s.type,
    level: s.level ?? 1,
  }));
}

function oracleConns(diagram) {
  return (diagram.connections ?? []).filter((c) => !isLifeline(c)).map((c) => ({
    src: c.src,
    dst: c.dst,
    label: norm(c.label),
    srcArrow: c.srcArrow || "none",
    dstArrow: c.dstArrow || "none",
  }));
}

/**
 * `text-transform: uppercase` is a style the reader records and the renderer
 * applies; D2's answer is the label it drew, already transformed. So the
 * transform is applied here, where the two spellings meet.
 */
function transformed(label, style) {
  const t = style?.["text-transform"];
  if (t === "uppercase") return label.toUpperCase();
  if (t === "lowercase") return label.toLowerCase();
  if (t === "capitalize") return label.replace(/\b\w/g, (c) => c.toUpperCase());
  return label;
}

function myObjects(entry) {
  return (entry.objects ?? []).map((o) => ({
    id: o.id,
    label: transformed(norm(o.label), o.style),
    shape: drawnShape(o.shape),
    level: o.level ?? 1,
  }));
}

function myConns(entry) {
  return (entry.connections ?? []).map((c) => ({
    src: c.src,
    dst: c.dst,
    label: norm(c.label),
    srcArrow: c.srcArrow || "none",
    dstArrow: c.dstArrow || "none",
  }));
}

/** D2 splits a class's children into fields and methods; the reader marks them. */
function oracleMembers(shape) {
  if (shape.type === "sql_table") {
    return (shape.columns ?? []).map((c) => ({
      name: c.name?.label ?? "",
      type: c.type?.label ?? "",
      constraint: (c.constraint ?? []).join(","),
    }));
  }
  if (shape.type === "class") {
    const f = (shape.fields ?? []).map((x) => ({
      name: x.name, type: x.type ?? "", visibility: x.visibility, method: false,
    }));
    const m = (shape.methods ?? []).map((x) => ({
      name: x.name, type: x.return ?? "", visibility: x.visibility, method: true,
    }));
    return [...f, ...m];
  }
  return null;
}

function myMembers(o) {
  if (!o.fields) return [];
  if (o.shape === "sql_table") {
    return o.fields.map((f) => ({
      name: f.name, type: f.type ?? "", constraint: (f.constraint ?? []).join(","),
    }));
  }
  return o.fields.map((f) => ({
    name: f.name, type: f.type ?? "", visibility: f.visibility, method: !!f.method,
  }));
}

/**
 * Styles, compared on what the FILE said rather than on what the theme
 * decided. D2's answer is resolved — an unset fill comes back as the theme
 * token `B6` and an unset stroke width as 2 — so the comparison set is every
 * style this reader recorded, plus every style D2 reports with a value that
 * is not its default. That catches both directions: a style invented here,
 * and one D2 applied that this reader dropped on the floor.
 */
const STYLE_FIELD = {
  "fill": "fill",
  "stroke": "stroke",
  "stroke-width": "strokeWidth",
  "stroke-dash": "strokeDash",
  "border-radius": "borderRadius",
  "opacity": "opacity",
  "fill-pattern": "fillPattern",
  "font-size": "fontSize",
  "font-color": "color",
  "bold": "bold",
  "italic": "italic",
  "underline": "underline",
  "shadow": "shadow",
  "multiple": "multiple",
  "3d": "3d",
  "double-border": "double-border",
  "animated": "animated",
};
const SHAPE_DEFAULT = {
  strokeWidth: 2, strokeDash: 0, borderRadius: 0, opacity: 1, bold: true,
  italic: false, underline: false, shadow: false, multiple: false,
  "3d": false, "double-border": false, fontSize: 16, animated: false,
};
const CONN_DEFAULT = {
  strokeWidth: 2, strokeDash: 0, borderRadius: 10, opacity: 1, animated: false,
  italic: true, bold: false, underline: false, fontSize: 16,
};
/** A theme token — `B6`, `N1` — is D2 saying "nothing was set here". */
const isToken = (v) => typeof v === "string" && /^[A-Z]+\d*$/.test(v);

/**
 * Which styles may be read off D2's answer as "the file set this".
 *
 * Not the text ones: a container's label is 28pt and a table's header 20pt
 * and a leaf's 16pt, and `bold` is true for a leaf and false for a container
 * — all of that is the theme deciding, not the file. They are still compared
 * when THIS reader recorded them, which is the direction that can be wrong.
 */
const ADDED_FROM_D2 = new Set([
  "fill", "stroke", "stroke-width", "stroke-dash", "border-radius", "opacity",
  "fill-pattern", "shadow", "multiple", "3d", "double-border", "animated",
]);
/** `transparent` is what a `text` or `code` shape gets, not a fill somebody chose. */
const isDefaultish = (f, v) => (f === "fill" && v === "transparent");

function styleDiff(mine, theirs, defaults) {
  const ours = mine ?? {};
  const bad = [];
  for (const [k, f] of Object.entries(STYLE_FIELD)) {
    const want = theirs?.[f];
    const got = ours[k];
    if (got === undefined) {
      // Nothing recorded here. That is only wrong if D2's answer is evidence
      // the file asked for something: a real value, not a theme token, not
      // the default, and not one of the shape kinds D2 draws with no border.
      if (!ADDED_FROM_D2.has(k)) continue;
      if (want === undefined || want === null) continue;
      if (isToken(want) || isDefaultish(f, want)) continue;
      if (f in defaults && want === defaults[f]) continue;
      if (f === "strokeWidth" && want === 0) continue;
      bad.push(`${k}: ours undefined, D2 ${JSON.stringify(want)}`);
      continue;
    }
    // The file said something and this reader recorded it. Compare it with
    // what D2 resolved, whatever that turned out to be.
    if (want === undefined || want === null || isToken(want)) {
      bad.push(`${k}: ours ${JSON.stringify(got)}, D2 left it to the theme`);
      continue;
    }
    const same = typeof want === "number" ? Math.abs(Number(got) - want) < 0.001
      : typeof want === "boolean" ? (got === "true") === want
      : String(got) === String(want);
    if (!same) bad.push(`${k}: ours ${JSON.stringify(got)}, D2 ${JSON.stringify(want)}`);
  }
  return bad;
}

const key = (x) => JSON.stringify(x);
const bag = (list) => list.map(key).sort();

function sameBag(a, b) {
  const x = bag(a), y = bag(b);
  if (x.length !== y.length) return false;
  return x.every((v, i) => v === y[i]);
}

function diffBag(a, b) {
  const x = bag(a), y = bag(b);
  const missing = x.filter((v) => !y.includes(v));
  const extra = y.filter((v) => !x.includes(v));
  return { missing, extra };
}

const rows = [];
let checks = 0, agreed = 0;

for (const entry of mine.diagrams) {
  const name = entry.file.replace(/\.d2$/, "");
  const theirs = oracle?.available ? oracle.diagrams?.[name]?.layouts?.dagre : null;
  const row = { file: entry.file, checks: [], notes: [] };
  rows.push(row);

  if (!theirs || theirs.error) {
    row.unmeasured = theirs?.error ? `D2 refused it: ${theirs.error}` : "no oracle";
    continue;
  }

  const add = (nm, ok, note) => {
    row.checks.push({ name: nm, ok });
    checks += 1;
    if (ok) agreed += 1;
    else if (note) row.notes.push(note);
  };

  const to = oracleObjects(theirs), mo = myObjects(entry);
  const theirIds = to.map((o) => o.id), myIds = mo.map((o) => o.id);
  add("objects", sameBag(theirIds, myIds),
    (() => {
      const d = diffBag(theirIds, myIds);
      const bits = [];
      if (d.missing.length) bits.push(`missed ${d.missing.join(", ")}`);
      if (d.extra.length) bits.push(`invented ${d.extra.join(", ")}`);
      return bits.length ? `objects: ${bits.join("; ")}` : "";
    })());

  const shared = to.filter((o) => myIds.includes(o.id));
  const mineById = new Map(mo.map((o) => [o.id, o]));
  const labelBad = shared.filter((o) => mineById.get(o.id).label !== o.label);
  add("labels", labelBad.length === 0,
    labelBad.length ? `labels: ${labelBad.slice(0, 4).map((o) =>
      `${o.id} is "${mineById.get(o.id).label}", D2 says "${o.label}"`).join("; ")}` : "");

  const shapeBad = shared.filter((o) => mineById.get(o.id).shape !== o.shape);
  add("shapes", shapeBad.length === 0,
    shapeBad.length ? `shapes: ${shapeBad.slice(0, 4).map((o) =>
      `${o.id} is ${mineById.get(o.id).shape}, D2 says ${o.shape}`).join("; ")}` : "");

  const levelBad = shared.filter((o) => mineById.get(o.id).level !== o.level);
  add("levels", levelBad.length === 0,
    levelBad.length ? `levels: ${levelBad.slice(0, 4).map((o) =>
      `${o.id} at ${mineById.get(o.id).level}, D2 says ${o.level}`).join("; ")}` : "");

  const tc = oracleConns(theirs), mc = myConns(entry);
  add("connections", sameBag(tc, mc),
    (() => {
      const d = diffBag(tc, mc);
      const bits = [];
      if (d.missing.length) bits.push(`missed ${d.missing.slice(0, 3).join(" ")}`);
      if (d.extra.length) bits.push(`invented ${d.extra.slice(0, 3).join(" ")}`);
      return bits.length ? `connections: ${bits.join("; ")}` : "";
    })());

  // What a shape carries besides its label, where the file said so: the
  // tooltip, the link, whether it has an icon at all, and a size the file
  // insisted on. D2 answers all four.
  {
    const bad = [];
    const theirShapes = new Map((theirs.shapes ?? []).map((x) => [x.id, x]));
    for (const o of entry.objects ?? []) {
      const t = theirShapes.get(o.id);
      if (!t) continue;
      const say = (what, got, want) => {
        if (String(got ?? "") !== String(want ?? "")) bad.push(`${o.id} ${what}: ours ${JSON.stringify(got ?? null)}, D2 ${JSON.stringify(want ?? null)}`);
      };
      if (o.tooltip || t.tooltip) say("tooltip", o.tooltip, t.tooltip);
      if (o.link || t.link) say("link", o.link, t.link);
      const theirIcon = t.icon ? true : false;
      if (o.icon || theirIcon) say("icon", o.icon ? true : false, theirIcon);
      if (o.width !== undefined) say("width", o.width, t.width);
      if (o.height !== undefined) say("height", o.height, t.height);
    }
    if (bad.length || (entry.objects ?? []).some((o) => o.tooltip || o.link || o.icon || o.width !== undefined)) {
      add("extras", bad.length === 0, bad.length ? `extras: ${bad.slice(0, 4).join(" | ")}` : "");
    }
  }

  // Styles, on the objects and on the connections.
  {
    const bad = [];
    const theirShapes = new Map((theirs.shapes ?? []).map((x) => [x.id, x]));
    for (const o of entry.objects ?? []) {
      const d = styleDiff(o.style, theirShapes.get(o.id), SHAPE_DEFAULT);
      if (d.length) bad.push(`${o.id} — ${d.join("; ")}`);
    }
    // Connections have no id in this reader's dump, so they are matched on
    // their ends and their place among the connections between that pair.
    const seen = new Map();
    for (const c of entry.connections ?? []) {
      const at = seen.get(c.src + "\u0000" + c.dst) ?? 0;
      seen.set(c.src + "\u0000" + c.dst, at + 1);
      const theirC = (theirs.connections ?? []).filter((t) => t.src === c.src && t.dst === c.dst)[at];
      const d = styleDiff(c.style, theirC, CONN_DEFAULT);
      if (d.length) bad.push(`(${c.src} -> ${c.dst})[${at}] — ${d.join("; ")}`);
    }
    add("styles", bad.length === 0, bad.length ? `styles: ${bad.slice(0, 4).join(" | ")}` : "");
  }

  // Rows of a table, members of a class — only where the file has one.
  const compartments = (theirs.shapes ?? []).filter((s) => s.type === "sql_table" || s.type === "class");
  if (compartments.length) {
    const bad = [];
    for (const s of compartments) {
      const mineO = (entry.objects ?? []).find((o) => o.id === s.id);
      if (!mineO) { bad.push(`${s.id} missing`); continue; }
      if (!sameBag(oracleMembers(s), myMembers(mineO))) {
        bad.push(`${s.id}: ${JSON.stringify(myMembers(mineO))} vs ${JSON.stringify(oracleMembers(s))}`);
      }
    }
    add("members", bad.length === 0, bad.length ? `members: ${bad.slice(0, 2).join("; ")}` : "");
  }

  // Boards: layers start empty, scenarios inherit, steps accumulate — and a
  // board can hold boards of its own, so the whole tree is compared, with
  // the ids on each one rather than a count. A layer that dropped half its
  // objects and gained the same number would pass a count.
  const theirBoards = (d) => {
    const out = [];
    for (const kind of ["layers", "scenarios", "steps"]) {
      for (const b of d[kind] ?? []) {
        out.push({
          kind: kind.slice(0, -1),
          name: b.name,
          objects: (b.shapes ?? []).map((s) => s.id).sort(),
          connections: oracleConns(b).length,
          boards: theirBoards(b),
        });
      }
    }
    return out.sort((a, z) => (a.kind + a.name).localeCompare(z.kind + z.name));
  };
  const myBoards = (e) => (e.boards ?? []).map((b) => ({
    kind: b.kind,
    name: b.name,
    objects: (b.objects ?? []).map((o) => o.id).sort(),
    connections: (b.connections ?? []).length,
    boards: myBoards(b),
  })).sort((a, z) => (a.kind + a.name).localeCompare(z.kind + z.name));
  const tb = theirBoards(theirs), mb = myBoards(entry);
  if (tb.length || mb.length) {
    add("boards", key(tb) === key(mb),
      `boards: ${JSON.stringify(mb)} vs ${JSON.stringify(tb)}`);
  }
}

const measured = rows.filter((r) => !r.unmeasured);
const failing = rows.filter((r) => r.checks.some((c) => !c.ok));
const pct = checks ? Math.round((agreed / checks) * 1000) / 10 : 0;

const dims = ["objects", "labels", "shapes", "levels", "connections", "styles", "extras", "members", "boards"];
const cell = (r, nm) => {
  const c = r.checks.find((x) => x.name === nm);
  if (!c) return "—";
  return c.ok ? "✓" : "✗";
};

const lines = [];
lines.push("# D2 parity — the measured one");
lines.push("");
lines.push("> Regenerated by `npm run rangerflow:d2:parity`. Every number here comes from");
lines.push("> **D2 itself**, run over the same files in `fixtures/d2/` and asked what it");
lines.push("> understood. Nothing is transcribed, so nothing can be transcribed wrong.");
lines.push("");
const version = oracle?.version ?? "unavailable";
lines.push(`D2 ${version} · ${measured.length} of ${rows.length} files measured · ` +
  `**${agreed}/${checks} checks agree (${pct}%)**`);
lines.push("");
if (!oracle?.available) {
  lines.push(`> The oracle was not available (${oracle?.reason ?? "not built"}), so nothing`);
  lines.push("> below was computed. `npm run rangerflow:d2:oracle` needs a Go toolchain.");
  lines.push("");
}
lines.push("| example | objects | labels | shapes | levels | connections | styles | extras | members | boards |");
lines.push("| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
for (const r of rows) {
  if (r.unmeasured) {
    lines.push(`| \`${r.file}\` | ${r.unmeasured} | | | | | | | | |`);
    continue;
  }
  lines.push(`| \`${r.file}\` | ` + dims.map((d) => cell(r, d)).join(" | ") + " |");
}
lines.push("");
if (failing.length) {
  lines.push("## What differs");
  lines.push("");
  for (const r of failing) {
    const notes = r.notes.filter(Boolean);
    lines.push(`- **\`${r.file}\`** — ${notes.length ? notes.join("; ") : "see --diff"}`);
  }
  lines.push("");
}
lines.push("## What this compares");
lines.push("");
lines.push("- **The reading, not the drawing.** D2's answer carries every position and");
lines.push("  every route, and none of it is scored: RangerFlow has its own layered layout,");
lines.push("  measured against React Flow's and d3-force's own functions in");
lines.push("  [`PARITY.md`](PARITY.md). Comparing it to dagre would measure two layouts");
lines.push("  rather than one reader.");
lines.push("- **Nine dimensions, and a file is only asked the ones it has.** A file with");
lines.push("  no table is not asked about table rows, and a file with one board is not");
lines.push("  asked about boards.");
lines.push("- **The vocabularies meet in `tools/d2-parity.mjs`.** D2 answers with the");
lines.push("  primitive it drew — `circle` comes back `oval`, `square` comes back");
lines.push("  `rectangle`, and an arrowhead's `filled` is folded into its name. The reader");
lines.push("  keeps what the file *wrote*, and the translation lives in the meter so");
lines.push("  neither model has to hold the other's spelling.");
lines.push("");

fs.mkdirSync(path.dirname(DOC), { recursive: true });
fs.writeFileSync(DOC, lines.join("\n"));
console.log(`  d2 parity: ${agreed}/${checks} checks agree (${pct}%) → ${path.relative(process.cwd(), DOC)}`);
if (wantDiff) {
  for (const r of rows) {
    if (!r.notes?.length) continue;
    console.log(`\n${r.file}`);
    for (const n of r.notes) console.log(`  ${n}`);
  }
}
