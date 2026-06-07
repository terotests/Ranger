#!/usr/bin/env node
"use strict";

const fs = require("fs");

const templatePath = process.argv[2];
const wasmPath = process.argv[3];
const outPath = process.argv[4];

if (!templatePath || !wasmPath || !outPath) {
  console.error(
    "usage: embed-wasm-demo-html.js <template.html> <file.wasm> <out.html>"
  );
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
const b64 = fs.readFileSync(wasmPath).toString("base64");
const html = template.split("__WASM_B64__").join(b64);
fs.writeFileSync(outPath, html, "utf8");
