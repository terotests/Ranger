/**
 * logo.mjs — vectorise the Ranger logo with Ranger's own vectoriser.
 *
 *   node landing/tools/logo.mjs
 *
 * landing/assets/logo/ranger-mark.png is the project's mark as a 304 × 304
 * bitmap — the avatar, and the same shield as
 * ranger-vscode-extension/icons/ranger-file-icon.svg.
 * gallery/evg/tools/evg_trace_cli.rgr reads it and writes paths: the image is
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
const log = run("node", ["bin/output.js", "-es6", "./gallery/evg/tools/evg_trace_cli.rgr",
  "-d=./gallery/evg/bin", "-o=evg_trace_cli.js", "-nodecli"]);
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
run("node", ["gallery/evg/bin/evg_trace_cli.js", SRC, traced,
  "--colorCount", "4", "--alphamax", "1.0", "--opttolerance", "0.2", "--turdsize", "3"]);

const svg = fs.readFileSync(traced, "utf8");
const layers = [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0]);
if (layers.length < 2) throw new Error(`the tracer wrote ${layers.length} layer(s) — expected the shield's three`);

const box = /viewBox="([^"]+)"/.exec(svg);
if (!box) throw new Error("the tracer wrote no viewBox");

// Rewritten as the page wants it: no intrinsic size, so it scales to whatever
// box it is put in, and a title for the screen readers that will meet it.
const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box[1]}" role="img" aria-label="Ranger">
<title>Ranger</title>
${layers.join("\n")}
</svg>
`;
fs.writeFileSync(MARK, wrapped);
console.log(`wrote ${path.relative(ROOT, MARK)} (${(wrapped.length / 1024).toFixed(1)} KB, ${layers.length} layers)`);

// The tab icon is the same paths, so the favicon cannot drift from the mark.
fs.writeFileSync(FAV, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box[1]}">
${layers.join("\n")}
</svg>
`);
console.log(`wrote ${path.relative(ROOT, FAV)}`);
