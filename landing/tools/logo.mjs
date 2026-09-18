/**
 * logo.mjs — vectorise the Ranger logo with Ranger's own vectoriser.
 *
 *   node landing/tools/logo.mjs
 *
 * landing/assets/logo/ranger-mark.png is the project's mark as a 304 × 304
 * bitmap — the avatar, and the same shield as
 * ranger-vscode-extension/icons/ranger-file-icon.svg.
 * lib/evg/tools/evg_trace_cli.rgr reads it and writes paths: the image is
 * posterised into flat colour regions, each region's edges are walked, the
 * corners are found, cubics are fitted to what is between them, and every
 * layer comes out as one evenodd path.
 *
 * What lands in landing/assets is therefore a real vector logo — about 7 KB,
 * three layers, sharp at any size — produced by this repository from a
 * picture, with no design tool in between. It is what the navigation bar, the
 * favicon, the colophon and the rippling backdrop all draw.
 *
 * The same tracer compiles to Node, Python, C++ and Rust, and
 * `npm run evg:trace:cli:smoke` asserts all four write byte-identical SVG for
 * the same input.
 *
 * The output is committed, so building the site does not need this to have run.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SRC = path.join(ROOT, "landing/assets/logo/ranger-mark.png");
const TMP = path.join(ROOT, ".landing_tmp/logo");
const MARK = path.join(ROOT, "landing/assets/ranger-mark.svg");
const FAV = path.join(ROOT, "landing/assets/favicon.svg");

const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, env, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

if (!fs.existsSync(SRC)) throw new Error(`no ${path.relative(ROOT, SRC)} to trace`);
fs.mkdirSync(TMP, { recursive: true });

console.log("compiling the bitmap tracer...");
// The compiler exits 0 on failure, so read the log rather than the status.
const log = run("node", ["bin/output.js", "-es6", "./lib/evg/tools/evg_trace_cli.rgr",
  "-d=./lib/evg/bin", "-o=evg_trace_cli.js", "-nodecli"]);
if (log.includes("[FAIL]") || log.includes("Compilation FAILED")) {
  console.error(log);
  throw new Error("the tracer did not compile");
}

console.log("tracing the mark...");
const traced = path.join(TMP, "mark.svg");
// colorCount 4 posterises into the shield's own palette — black rim, gold
// field, the dark letter, and the paper behind it, which skipLuma drops.
// alphamax is the corner threshold and opttolerance the curve fit; looser than
// this rounds the shield's points off, tighter fits the bitmap's stair-steps.
// The palette is PINNED to the logo's own four colours rather than quantised
// out of the picture. Left to itself the quantiser spends a swatch on the
// anti-aliased band around the shield and the rim comes out dashed; naming the
// colours puts every boundary pixel on one of the four that are really there.
// turdsize 12 then drops the specks that band still leaves — at 3 it kept
// thirty-three of them, each a few pixels of gold sitting in the black rim.
run("node", ["lib/evg/bin/evg_trace_cli.js", SRC, traced,
  "--colorCount", "4",
  "--paletteMode", "fixed",
  "--paletteHex", "#070705,#35311E,#FBC802,#FFFFFF",
  // lumaWeight 1 measures colour difference in plain RGB. The default weights
  // luma three times over, and under that weighting the half-lit pixels around
  // the shield's outer edge read as closer to the dark letter than to the black
  // rim — so a thread of the letter's colour was laid along the outside of the
  // rim. snapRatio lets a boundary pixel join a region it actually touches
  // rather than one it merely resembles.
  "--lumaWeight", "1",
  "--snapRatio", "6.0",
  "--alphamax", "1.0", "--opttolerance", "0.35", "--turdsize", "12"]);

const svg = fs.readFileSync(traced, "utf8");
const all = [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0]);

// The paper the mark was photographed on is one of the four palette entries,
// and the tracer hands it back as a layer like any other. On the page it is a
// white slab behind a logo that has to sit on black as often as on white, so
// it is dropped here rather than clipped away — a consumer that does not honour
// the clip (EVG's SVG importer, which the backdrop goes through) would draw it.
const layers = all.filter((p) => {
  const hex = /fill="#([0-9A-Fa-f]{6})"/.exec(p);
  if (!hex) return true;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) < 250;
});
if (layers.length !== all.length) {
  console.log(`  dropped ${all.length - layers.length} near-white layer(s)`);
}
if (layers.length < 2) throw new Error(`the tracer wrote ${layers.length} layer(s) — expected the shield's three`);

const box = /viewBox="([^"]+)"/.exec(svg);
if (!box) throw new Error("the tracer wrote no viewBox");

// The first layer is the black silhouette — the whole shield, drawn under
// everything else — and the layers above it are the gold field, the dark
// letter and whatever the posterizer kept of the paper behind the mark. They
// are clipped to the silhouette, so nothing a layer traced half a pixel wide
// of the outline can escape past it and the paper layer disappears entirely.
// The clip is the silhouette's own path rather than an approximation of it,
// so the outline stays exactly where the trace put it.
const [silhouette, ...over] = layers;
const clipD = /\sd="([^"]+)"/.exec(silhouette);
if (!clipD) throw new Error("the silhouette layer carries no path");

const body = over.length
  ? `${silhouette}
<g clip-path="url(#ranger-mark-clip)">
${over.join("\n")}
</g>`
  : silhouette;

// Rewritten as the page wants it: no intrinsic size, so it scales to whatever
// box it is put in, and a title for the screen readers that will meet it.
const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box[1]}" role="img" aria-label="Ranger">
<title>Ranger</title>
<defs><clipPath id="ranger-mark-clip"><path clip-rule="evenodd" d="${clipD[1]}"/></clipPath></defs>
${body}
</svg>
`;
fs.writeFileSync(MARK, wrapped);
console.log(`wrote ${path.relative(ROOT, MARK)} (${(wrapped.length / 1024).toFixed(1)} KB, ${layers.length} layers)`);

// The tab icon is the same paths, so the favicon cannot drift from the mark.
fs.writeFileSync(FAV, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box[1]}">
<defs><clipPath id="ranger-fav-clip"><path clip-rule="evenodd" d="${clipD[1]}"/></clipPath></defs>
${over.length ? `${silhouette}\n<g clip-path="url(#ranger-fav-clip)">\n${over.join("\n")}\n</g>` : silhouette}
</svg>
`);
console.log(`wrote ${path.relative(ROOT, FAV)}`);
