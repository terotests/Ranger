// What `gallery/office/text` drags in behind it.
//
// `OfficeTextMetrics` answers two questions of arithmetic — offset → x, and x
// → offset. It used to take a `UITextRenderer` to ask them, which put
// `framebuffer.rgr`, `SoftCanvas`, `RasterText` and a bitmap fallback font in
// the import closure of every consumer of the shared metrics. That is why
// `gallery/markdown`, whose output is a display list and a PDF and which has
// no rasterizer anywhere in it, could not use them.
//
// The cut is described in gallery/office/text/OfficeMeasure.rgr. This is the
// check that it stays cut, because nothing else would notice: adding
// `Import "../../game_engine/ui/UITextRenderer.rgr"` back to any file in the
// closure compiles, passes every suite, and silently doubles what a markdown
// build links.
//
//   npm run office:metrics:closure
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

// The roots that must stay renderer-free, and why each one is on the list.
const ROOTS = [
  ["gallery/office/text/OfficeTextMetrics.rgr", "offset → x and back, for every editor"],
  ["gallery/office/text/OfficeMeasure.rgr", "the width question itself"],
  ["gallery/office/text/OfficeFont.rgr", "which face draws this run"],
];

// Anything under these is a painter or a rasterizer. Measurement does not
// need one, and a closure that contains one has stopped being measurement.
const FORBIDDEN = [
  "gallery/game_engine/",
  "gallery/pdf_writer/src/raster/",
  "gallery/evg/EVGDisplayList.rgr",
];

// Repo-relative in, repo-relative out. It resolved absolute paths and then
// re-joined them onto ROOT for one draft, which made every closure exactly one
// file and reported all three roots clean — a check that counts the wrong noun
// reports the failure as fine, which is the trap gallery/PLAN_EDITOR_KERNEL.md
// §6 names. The guard below is that a closure of one is itself an error.
function importsOf(rel) {
  const dir = path.dirname(rel);
  const out = [];
  for (const line of fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n")) {
    const m = /^\s*Import\s+"([^"]+)"/.exec(line);
    if (m) out.push(path.posix.normalize(path.posix.join(dir, m[1])));
  }
  return out;
}

function closure(entry) {
  const seen = new Map(); // file -> the file that imported it first
  const stack = [[entry, null]];
  while (stack.length > 0) {
    const [f, via] = stack.pop();
    if (seen.has(f)) continue;
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    seen.set(f, via);
    for (const d of importsOf(f)) {
      stack.push([d, f]);
    }
  }
  return seen;
}

// The chain, so a failure says HOW it got there rather than only that it did.
function chain(seen, file) {
  const out = [file];
  let cur = seen.get(file);
  while (cur) {
    out.push(cur);
    cur = seen.get(cur);
  }
  return out.reverse().join("\n      → ");
}

let bad = 0;
for (const [root, why] of ROOTS) {
  const seen = closure(root);
  const hits = [...seen.keys()].filter((f) => FORBIDDEN.some((p) => f.startsWith(p)));
  console.log(`${root}  —  ${why}`);
  console.log(`  ${seen.size} files in the closure`);
  if (seen.size < 2) {
    bad += 1;
    console.log("  WALKED NOTHING — the traversal is broken, not the closure clean");
    console.log("");
    continue;
  }
  if (hits.length > 0) {
    bad += hits.length;
    for (const h of hits) {
      console.log(`  RENDERER IN THE CLOSURE: ${h}`);
      console.log(`      ${chain(seen, h)}`);
    }
  } else {
    console.log("  no renderer, no rasterizer, no display list");
  }
  console.log("");
}

if (bad > 0) {
  console.error(
    `${bad} forbidden import(s). See gallery/office/text/OfficeMeasure.rgr for what this is protecting.`
  );
  process.exit(1);
}
console.log("ALL PASS — the shared metrics are still arithmetic");
