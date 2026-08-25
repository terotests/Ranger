#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Copy the built PowerPoint API playground into the Office docs site so live
 * examples can iframe it under the same origin.
 *
 *   node gallery/office/docs/tools/sync-playground.mjs
 *
 * Looks for a built playground in this order:
 *   1. OFFICE_PLAYGROUND_DIST (Pages copies from _site/office)
 *   2. gallery/pptx/web/playground/dist (a local `npm run pptx:playground`)
 *   3. $GITHUB_WORKSPACE/_site/office
 *
 * Missing output is a warning, not a failure: the docs still build, the
 * iframes 404 until the playground is built. Pages copies after the
 * playground step, so the published site always has the examples.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dest = join(root, "gallery/office/docs/site/public/playground");
const candidates = [
  process.env.OFFICE_PLAYGROUND_DIST,
  join(root, "gallery/pptx/web/playground/dist"),
  process.env.GITHUB_WORKSPACE
    ? join(process.env.GITHUB_WORKSPACE, "_site/office")
    : "",
].filter(Boolean);

function isPlayground(dir) {
  return existsSync(join(dir, "index.html"))
    && existsSync(join(dir, "playground.mjs"))
    && existsSync(join(dir, "pptx_playground.js"));
}

const src = candidates.find(isPlayground);
if (!src) {
  console.warn("  playground dist not found; live examples will 404 until npm run pptx:playground");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("  copied playground → " + dest);
