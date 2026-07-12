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

const broken = `const buf = (function(){ var b = require('fs').readFileSync(dir + '/' + base); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
  const src = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(buf);`;

const fixed = `const src = require('fs').readFileSync(dir + '/' + base, 'utf8');`;

let s = fs.readFileSync(emitterJs, "utf8");
if (s.includes(fixed)) {
  process.exit(0);
}
if (!s.includes(broken)) {
  console.error("patch-emitter-utf8: expected byte-read pattern not found in ts_emitter_main.js");
  process.exit(1);
}
s = s.replace(broken, fixed);
fs.writeFileSync(emitterJs, s);
console.log("patched ts_emitter_main.js for UTF-8 source reads");
