// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Paths for the Office API reference, which is built OUTSIDE the Ranger
 * documentation site on purpose.
 *
 * The reference is generated from the facades under `gallery/`, and it quotes
 * their comments verbatim — the prose on the page is the AGPL source. The
 * documentation site under `docs/` is MIT. Generating one into the other put
 * AGPL text inside an MIT tree and published it under the MIT site's licence
 * footer, which is the mistake this directory exists to undo: the tools, the
 * registry and the output all live under `gallery/`, beside the code they
 * describe and under the same licence as it.
 *
 * So there is a second, deliberately small copy of what `docs/tools/lib`
 * offers. Importing that one back would put the MIT tree on this build's
 * dependency path, which is the thing being avoided.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, "..", "..", "..", "..");
export const HOME = path.resolve(here, "..");
export const REGISTRY = path.join(HOME, "api-sources.json");
/** The extracted model. Build output: written here and read by the renderer. */
export const DATA = path.join(HOME, ".model");

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
