#!/usr/bin/env node
/**
 * Hold this reader's parse of a .fig against openfig-core's, node for node.
 *
 *   npm i openfig-core          # not a dependency of this repository
 *   npm run figma:parity -- path/to/file.fig
 *
 * Both read the same bytes. openfig-core is a parser, not a renderer, so
 * the comparison is of what came out of the kiwi message — which is the
 * question worth answering first: a node or a field that only one of them
 * has is a decoding fault, and one they both decoded that only one of them
 * draws is the converter's.
 *
 * Nothing leaves the machine. Layer names and text are printed, so run it
 * on a file you are allowed to look at.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");

const file = process.argv[2];
if (!file) {
  console.error("usage: npm run figma:parity -- path/to/file.fig");
  process.exit(2);
}
const path = resolve(process.cwd(), file);
if (!existsSync(path)) {
  console.error("no such file:", path);
  process.exit(2);
}

let parseFig;
try {
  ({ parseFig } = await import("openfig-core"));
} catch {
  console.error("openfig-core is not installed. `npm i openfig-core` and run this again.");
  process.exit(2);
}

execSync(
  "RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 " +
    "./gallery/figma/bench/ParityDump.rgr -d=./gallery/figma/bin -o=ParityDump.js",
  { cwd: root, stdio: "ignore" }
);
const bundle = readFileSync(resolve(root, "gallery/figma/bin/ParityDump.js"), "utf8");
const dump = (0, eval)(bundle + "; ParityDump.nodes");
const sceneOf = (0, eval)(bundle + "; ParityDump.scene");

const bytes = readFileSync(path);
const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
ab._view = new DataView(ab);

const t0 = performance.now();
const mine = JSON.parse(dump(ab));
const rangerMs = performance.now() - t0;
if (mine.error) {
  console.error("this reader failed:", mine.error);
  process.exit(1);
}

const t1 = performance.now();
const theirs = await parseFig(new Uint8Array(bytes));
const openfigMs = performance.now() - t1;

const guid = (g) => (g ? g.sessionID + ":" + g.localID : "");
const theirNodes = new Map();
for (const n of theirs.nodes) theirNodes.set(guid(n.guid), n);
const myNodes = new Map();
for (const n of mine) myNodes.set(n.id, n);

const onlyMine = [...myNodes.keys()].filter((k) => !theirNodes.has(k));
const onlyTheirs = [...theirNodes.keys()].filter((k) => !myNodes.has(k));

console.log("file                 ", path.split("/").pop(), "(" + bytes.length + " bytes)");
// Not a like-for-like timing: this reader's number includes serialising
// every node for the comparison. `npm run figma:bench` times the parse.
console.log("read                 ", "ranger " + rangerMs.toFixed(0) + "ms (incl. dump), openfig " + openfigMs.toFixed(0) + "ms");
console.log("nodes                ", "ranger " + myNodes.size + ", openfig " + theirNodes.size);
console.log("only in ranger       ", onlyMine.length, onlyMine.slice(0, 5).join(" "));
console.log("only in openfig      ", onlyTheirs.length, onlyTheirs.slice(0, 5).join(" "));

// Fields the other reader decoded on a node and this one did not. A
// difference here is in the decoder, before anything about drawing.
const missingField = new Map();
const typeDiff = [];
const geomDiff = [];
const textDiff = [];
for (const [id, mineNode] of myNodes) {
  const other = theirNodes.get(id);
  if (!other) continue;
  const mineFields = new Set(mineNode.fields);
  for (const k of Object.keys(other)) {
    if (mineFields.has(k)) continue;
    const row = missingField.get(k) || { count: 0, example: id + " " + JSON.stringify(mineNode.name) };
    row.count++;
    missingField.set(k, row);
  }
  if ((other.type || "") !== mineNode.type) {
    typeDiff.push(id + " ranger=" + mineNode.type + " openfig=" + other.type);
  }
  const ow = other.size?.x ?? 0, oh = other.size?.y ?? 0;
  const ox = other.transform?.m02 ?? 0, oy = other.transform?.m12 ?? 0;
  const off = (a, b) => Math.abs(a - b) > 0.01;
  if (off(ow, mineNode.w) || off(oh, mineNode.h) || off(ox, mineNode.x) || off(oy, mineNode.y)) {
    geomDiff.push(
      id + " " + JSON.stringify(mineNode.name) +
        " ranger=" + [mineNode.w, mineNode.h, mineNode.x, mineNode.y].map((n) => n.toFixed(1)).join(",") +
        " openfig=" + [ow, oh, ox, oy].map((n) => n.toFixed(1)).join(",")
    );
  }
  const otherText = other.textData?.characters ?? "";
  if (otherText !== (mineNode.text || "")) {
    textDiff.push(id + " ranger=" + JSON.stringify(mineNode.text) + " openfig=" + JSON.stringify(otherText));
  }
}

const show = (label, rows, limit = 8) => {
  console.log("\n" + label + ": " + rows.length);
  for (const r of rows.slice(0, limit)) console.log("   " + r);
  if (rows.length > limit) console.log("   … and " + (rows.length - limit) + " more");
};

const fieldRows = [...missingField]
  .sort((a, b) => b[1].count - a[1].count)
  .map(([k, v]) => String(v.count).padStart(6) + "  " + k + "   e.g. " + v.example);
show("fields openfig decoded that this reader did not", fieldRows, 15);
show("nodes whose type differs", typeDiff);
show("nodes whose size or position differs", geomDiff);
show("TEXT nodes whose characters differ", textDiff);

// What the converter made of the nodes both readers agree on. A type
// that is decoded and does not reach the scene is the converter's loss,
// and it is the thing you see as a page that is missing its content.
const scene = JSON.parse(sceneOf(ab));
if (!scene.error) {
  const decoded = new Map();
  for (const n of mine) decoded.set(n.type, (decoded.get(n.type) || 0) + 1);
  const drawn = new Map();
  for (const t of scene.types) drawn.set(t.type, t);
  const rows = [...decoded]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const d = drawn.get(type);
      const inScene = d ? d.nodes : 0;
      const nothing = d ? d.drawNothing : 0;
      return String(count).padStart(6) + " decoded  " + String(inScene).padStart(6) + " in the scene  " +
        (nothing ? String(nothing).padStart(6) + " of those draw nothing  " : "".padStart(31)) + type;
    });
  show("decoded against drawn, by node type", rows, 20);
  if (scene.overridesSeen) {
    console.log(
      "   " + scene.overridesSeen + " instance overrides, " + scene.overridesUsed + " applied" +
        (scene.overridesSeen === scene.overridesUsed ? "" : " — the rest name a node their component does not have")
    );
  }
  if (scene.imagesMissing) console.log("   " + scene.imagesMissing + " image fills have no bytes in the file");
}

const clean = !onlyMine.length && !onlyTheirs.length && !typeDiff.length && !geomDiff.length && !textDiff.length;
console.log(
  "\n" + (clean
    ? "the two parses agree on every node, its type, its box and its text — a difference on the page is in the drawing, not the decoding"
    : "the parses differ; the lists above say where")
);
