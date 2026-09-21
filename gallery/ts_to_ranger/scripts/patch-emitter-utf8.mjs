#!/usr/bin/env node
/**
 * Ranger's buffer_to_string Node codegen reads raw bytes (String.fromCharCode per byte),
 * which breaks UTF-8 in .tsx sources (em-dash, arrows in comments, etc.).
 * Replace with fs.readFileSync(..., 'utf8') after ts2ranger:compile.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emitterJs = path.resolve(
  __dirname,
  "../bin/ts_emitter_main.js"
);

// Matched as a shape rather than as an exact string: the `buffer_to_string`
// codegen has been rewritten more than once (a per-byte loop, then a chunked
// `fromCharCode.apply` for large files), and each time this script stopped
// matching and failed the build with "expected byte-read pattern not found"
// — which is a worse failure than the one it exists to prevent, because it
// stops the emitter being rebuilt at all. The two statements it replaces are
// the `const buf = …readFileSync(dir + '/' + base)…` binding and the
// `const src = …(buf);` that follows it.
const broken =
  /const buf = \(function\(\)\{[^\n]*readFileSync\(dir \+ '\/' \+ base\)[^\n]*\}\)\(\);\n\s*const src = \(function\(b\)\{[^\n]*\}\)\(buf\);/;

const fixed = `const src = require('fs').readFileSync(dir + '/' + base, 'utf8');`;

let s = fs.readFileSync(emitterJs, "utf8");
if (s.includes(fixed)) {
  process.exit(0);
}
if (!broken.test(s)) {
  console.error("patch-emitter-utf8: expected byte-read pattern not found in ts_emitter_main.js");
  process.exit(1);
}
s = s.replace(broken, fixed);
fs.writeFileSync(emitterJs, s);
console.log("patched ts_emitter_main.js for UTF-8 source reads");
