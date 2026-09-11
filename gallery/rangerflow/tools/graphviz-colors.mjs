/**
 * graphviz-colors.mjs — the colour table, read off Graphviz rather than typed.
 *
 *   npm run rangerflow:graphviz:colors
 *   → gallery/rangerflow/domains/graphviz/DotColors.rgr   (generated)
 *
 * A DOT file paints with names — `cornflowerblue`, `gray37`, `red3` — and a
 * reader that does not know them draws a diagram in the wrong colours, which
 * is a diagram that says something false about itself. There are hundreds of
 * them, and a table of hundreds transcribed by hand is a table with mistakes
 * in it that nobody will ever find.
 *
 * So it is **measured**. Every candidate name is handed to Graphviz as a
 * node's `fillcolor`, and the RGB it painted with is read back out of its own
 * xdot output, where a colour is always hex whatever the name was. The names
 * proposed here are the public X11/SVG ones and the numbered variants the X11
 * scheme has; which of them exist, and what each one *is*, comes back from
 * Graphviz. That is the rule `PLAN_GRAPHVIZ.md` §2.3 sets, and the same one
 * the shape table follows.
 *
 * **How an unknown name is recognised.** Native `dot` says so on stderr —
 * `Warning: notacolour is not a known color.` — and that is the answer used
 * when the machine has it. Without it, Graphviz's silent fallback for an
 * unknown colour is black, so a candidate that comes back `#000000` is treated
 * as unknown unless it is one of the names that genuinely is black. The
 * generated file records which of the two methods produced it, because one is
 * a verdict and the other is an inference.
 *
 * **Licence.** Graphviz is EPL-1.0 and stays at arm's length: it is run here
 * as a subprocess or as a sandboxed WebAssembly module, never linked, and no
 * Graphviz source — its colour table included — is read or copied. What comes
 * back is its observable output. See `PLAN_GRAPHVIZ.md` §6.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const HARNESS = path.join(ROOT, "harness");
const OUT = path.join(ROOT, "domains", "graphviz", "DotColors.rgr");

// ------------------------------------------------------- the candidates ----
// The public X11/SVG colour names. Proposing a name is not claiming it exists:
// Graphviz says which of these it knows, and every value below comes from it.
const SVG = `aliceblue antiquewhite aqua aquamarine azure beige bisque black
blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate
coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod
darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray
darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey
dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold
goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory
khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral
lightcyan lightgoldenrod lightgoldenrodyellow lightgray lightgreen lightgrey
lightpink lightsalmon lightseagreen lightskyblue lightslateblue lightslategray
lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon
mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue
mintcream mistyrose moccasin navajowhite navy navyblue oldlace olive olivedrab
orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred
papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna
silver skyblue slateblue slategray slategrey snow springgreen steelblue tan
teal thistle tomato transparent turquoise violet violetred wheat white
whitesmoke yellow yellowgreen`.split(/\s+/).filter(Boolean);

// X11 gives many of its colours four shades, and the greys a hundred and one.
const SHADED = `antiquewhite aquamarine azure bisque blue brown burlywood
cadetblue chartreuse chocolate coral cornsilk cyan darkgoldenrod darkolivegreen
darkorange darkorchid darkseagreen darkslategray deeppink deepskyblue
dodgerblue firebrick gold goldenrod green honeydew hotpink indianred ivory khaki
lavenderblush lemonchiffon lightblue lightcyan lightgoldenrod lightpink
lightsalmon lightskyblue lightsteelblue lightyellow magenta maroon
mediumorchid mediumpurple mistyrose navajowhite olivedrab orange orangered
orchid palegreen paleturquoise palevioletred peachpuff pink plum purple red
rosybrown royalblue salmon seagreen seashell sienna skyblue slateblue
slategray snow springgreen steelblue tan thistle tomato turquoise violetred
wheat yellow`.split(/\s+/).filter(Boolean);

const candidates = new Set(SVG);
for (const base of SHADED) for (let i = 1; i <= 4; i++) candidates.add(`${base}${i}`);
for (let i = 0; i <= 100; i++) {
  candidates.add(`gray${i}`);
  candidates.add(`grey${i}`);
}
const names = [...candidates].sort();

// Graphviz paints an unknown colour black without being asked twice, so these
// are the names for which black is the right answer rather than a refusal.
const REALLY_BLACK = new Set(["black", "gray0", "grey0", "gray1", "grey1"]);

// ------------------------------------------------------- asking Graphviz ---
const harnessRequire = createRequire(path.join(HARNESS, "package.json"));
let gv = null;
try {
  const mod = await import(pathToFileURL(harnessRequire.resolve("@hpcc-js/wasm-graphviz")).href);
  gv = await mod.Graphviz.load();
} catch {
  gv = null;
}
const nativeProbe = spawnSync("dot", ["-V"], { encoding: "utf8" });
const hasNative = !nativeProbe.error;

if (!gv && !hasNative) {
  console.error("  no Graphviz on this machine — the colour table cannot be measured, and one written here anyway would be a table nobody computed");
  process.exit(1);
}

/** One graph, every candidate in it, so the whole table is one render. */
function askAll(list) {
  const src = "digraph colors {\n" +
    list.map((n, i) => `  c${i} [style=filled, fillcolor="${n}", label=""];`).join("\n") +
    "\n}\n";
  let json = "";
  let warnings = "";
  if (hasNative) {
    const run = spawnSync("dot", ["-Tjson"], { input: src, encoding: "utf8", maxBuffer: 1 << 28 });
    json = run.stdout;
    warnings = run.stderr ?? "";
  } else {
    json = gv.layout(src, "json", "dot");
  }
  const model = JSON.parse(json);
  const out = new Map();
  for (const o of model.objects ?? []) {
    const at = Number(String(o.name ?? "").slice(1));
    // The `C` op is the fill Graphviz painted the node with, in hex whatever
    // the name was — which is the whole reason xdot is asked rather than SVG,
    // where a name Graphviz recognises comes back as the name again.
    const fill = (o._draw_ ?? []).filter((d) => d.op === "C").pop();
    if (fill && Number.isInteger(at)) out.set(list[at], String(fill.color).toLowerCase());
  }
  return { values: out, warnings };
}

const { values, warnings } = askAll(names);

// Which names Graphviz refused. Its own words where it has them.
const refused = new Set();
for (const line of warnings.split("\n")) {
  const m = line.match(/Warning:\s+(\S+)\s+is not a known color/);
  if (m) refused.add(m[1]);
}
// Native `dot` warns about a name it does not know, so its silence is an
// answer; the WebAssembly build has no stderr to listen to and the fallback to
// black has to stand in for one.
const method = hasNative ? "verdict" : "inference";

const table = [];
const unknown = [];
for (const name of names) {
  const hex = values.get(name);
  if (!hex) {
    unknown.push(name);
    continue;
  }
  if (refused.has(name)) {
    unknown.push(name);
    continue;
  }
  if (method === "inference" && hex.startsWith("#000000") && !REALLY_BLACK.has(name)) {
    unknown.push(name);
    continue;
  }
  // `#rrggbbaa` where the alpha is opaque is `#rrggbb`; the only colour that
  // is not opaque is `transparent`, and a diagram that asked for nothing gets
  // nothing rather than black.
  let rgb = hex.slice(1);
  if (rgb.length === 8) {
    if (rgb.slice(6) === "00") continue;
    rgb = rgb.slice(0, 6);
  }
  table.push([name, rgb]);
}

// ---------------------------------------------------------- the .rgr file --
const version = hasNative
  ? (nativeProbe.stderr || nativeProbe.stdout || "").trim()
  : `graphviz ${gv.version()} (WebAssembly)`;

const CHUNK = 8;
const lines = [];
for (let i = 0; i < table.length; i += CHUNK) {
  lines.push(table.slice(i, i + CHUNK).map(([n, v]) => `${n} ${v}`).join(" "));
}

const rgr = `; SPDX-License-Identifier: AGPL-3.0-or-later

; ============================================================================
; DotColors.rgr — GENERATED. Do not edit.
; ============================================================================
;
;   npm run rangerflow:graphviz:colors
;
; The X11 colour names a DOT file paints with, and what each one is, **as
; Graphviz itself reported them**: every name below was handed to it as a
; node's \`fillcolor\` and the RGB read back out of its own xdot output, where a
; colour is always hex whatever the name was. Nothing here was transcribed, so
; nothing here can be transcribed wrong.
;
; Measured with ${version}
; ${table.length} names known${unknown.length > 0 ? `, ${unknown.length} candidates it does not know` : ""}
; A name Graphviz does not know was recognised by ${method === "verdict" ? "its own warning on stderr" : "its silent fallback to black"}.
;
; The values are packed as \`name rrggbb\` pairs and unpacked once, because a
; table of ${table.length} entries written as ${table.length} statements is a table that costs a
; second of compiler time on every target.
; ============================================================================

class DotColors {
    def table:[string:string]
    def loaded:boolean false

    Constructor () {
    }

    ; \`#rrggbb\` for a name Graphviz knows, and "" for one it does not — a
    ; reader that does not know a colour leaves it to the theme rather than
    ; inventing a shade.
    fn hex:string (name:string) {
        if (loaded == false) {
            this.load()
        }
        def v:string (?? (get table name) "")
        if ((strlen v) == 0) {
            return ""
        }
        return ("#" + v)
    }

    fn knows:boolean (name:string) {
        return ((strlen (this.hex(name))) > 0)
    }

    fn count:int () {
        if (loaded == false) {
            this.load()
        }
        return (array_length (keys table))
    }

    fn absorb:void (packed:string) {
        def parts:[string] (strsplit packed " ")
        def i:int 0
        while ((i + 1) < (array_length parts)) {
            set table (itemAt parts i) (itemAt parts (i + 1))
            i = (i + 2)
        }
    }

    fn load:void () {
        loaded = true
${lines.map((l) => `        this.absorb("${l}")`).join("\n")}
    }
}
`;

fs.writeFileSync(OUT, rgr);
console.log(`  graphviz colours: ${table.length} names measured with ${version} (${method}) → ${path.relative(process.cwd(), OUT)}`);
if (unknown.length) {
  console.log(`  ${unknown.length} candidates Graphviz does not know, e.g. ${unknown.slice(0, 6).join(", ")}`);
}
