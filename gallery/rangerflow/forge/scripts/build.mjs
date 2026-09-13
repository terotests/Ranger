// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Bundle the Custom UI. The output (`static/rangerflow/macro.js`) is gitignored:
 * it is @forge/bridge plus this app, produced on the machine that deploys.
 */
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const outfile = path.join(ROOT, "static/rangerflow/macro.js");
const watch = process.argv.includes("--watch");

if (!fs.existsSync(path.join(ROOT, "node_modules/esbuild"))) {
  console.error("dependencies missing — from gallery/rangerflow/forge run:  npm install");
  process.exit(1);
}

const opts = {
  absWorkingDir: ROOT,
  entryPoints: ["src/frontend.js"],
  bundle: true,
  format: "iife",
  outfile: "static/rangerflow/macro.js",
  logLevel: "info",
  legalComments: "none",
};

if (watch) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log("watching Custom UI → static/rangerflow/macro.js");
} else {
  await esbuild.build(opts);
  const st = fs.statSync(outfile);
  if (st.size < 1000) {
    console.error("bundle too small:", outfile, st.size);
    process.exit(1);
  }
  console.log("wrote", path.relative(ROOT, outfile), `(${st.size} bytes)`);
}
