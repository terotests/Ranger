#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Copy the live Chart API page into the Office docs site so examples can
 * iframe it under the same origin.
 *
 *   node gallery/office/docs/tools/sync-chart-api.mjs
 *
 * Looks for a built page in this order:
 *   1. OFFICE_CHART_API_DIST (Pages copies from _site/evg/chart-api)
 *   2. gallery/evg/showcase/dist/chart-api (a local `npm run showcase`)
 *   3. $GITHUB_WORKSPACE/_site/evg/chart-api
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dest = join(root, "gallery/office/docs/site/public/chart-api");
const candidates = [
  process.env.OFFICE_CHART_API_DIST,
  join(root, "gallery/evg/showcase/dist/chart-api"),
  process.env.GITHUB_WORKSPACE
    ? join(process.env.GITHUB_WORKSPACE, "_site/evg/chart-api")
    : "",
].filter(Boolean);

function isChartApi(dir) {
  return existsSync(join(dir, "index.html"))
    && existsSync(join(dir, "vela_chart_api.js"));
}

const src = candidates.find(isChartApi);
if (!src) {
  console.warn("  chart-api dist not found; live Chart API examples will 404 until npm run showcase");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("  copied chart-api → " + dest);
