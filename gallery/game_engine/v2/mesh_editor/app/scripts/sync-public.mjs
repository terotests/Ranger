#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const DIST = path.resolve(APP, "../dist");
const PUBLIC = path.join(APP, "public", "ranger");

fs.mkdirSync(PUBLIC, { recursive: true });
for (const f of ["mesh_editor.bundle.js", "engine-host.js", "vfs.js"]) {
  const src = path.join(DIST, f);
  if (!fs.existsSync(src)) {
    console.error("[sync-public] missing", src);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(PUBLIC, f));
}
console.log("[sync-public] ranger runtime → public/ranger/");
