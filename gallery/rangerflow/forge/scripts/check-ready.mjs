// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Refuse to deploy a bundle that was never built, or an app.id that is still
 * the placeholder. `forge register` rewrites manifest.yml with a real id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLACEHOLDER_APP_ID =
  "ari:cloud:ecosystem::app/00000000-0000-4000-8000-000000000000";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");

export function appIdFromManifest(yaml) {
  const m = String(yaml).match(/^\s*id:\s*(ari:cloud:ecosystem::app\/[0-9a-f-]+)\s*$/mi);
  return m ? m[1] : "";
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const yaml = fs.readFileSync(path.join(ROOT, "manifest.yml"), "utf8");
  const id = appIdFromManifest(yaml);
  const bundle = path.join(ROOT, "static/rangerflow/macro.js");

  const errors = [];
  if (!fs.existsSync(bundle)) {
    errors.push("static/rangerflow/macro.js is missing — run: npm run build");
  }
  if (!id) {
    errors.push("manifest.yml has no app.id");
  } else if (id === PLACEHOLDER_APP_ID) {
    errors.push(
      "app.id is still the placeholder. Run: npm run login && npm run register\n" +
        "  (forge register writes a real id into manifest.yml; keep that change local\n" +
        "   unless you are publishing a shared app.)"
    );
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("ready to deploy", id);
}
