// ============================================================================
// library-smoke.mjs — schema migrate + on-disk roundtrip (no browser).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { migrateProject } from "./app/src/library/migrations.js";
import {
  CURRENT_SCHEMA_VERSION,
  buildProjectDocument,
  SCHEMA_KIND,
} from "./app/src/library/schema.js";

const legacy = {
  name: "Old dump",
  knots: [
    { id: "a", x: 0, y: -1, hx: 0.2, hy: 0, color: "#7ecf6a" },
    { id: "b", x: 0.5, y: 0, hx: 0, hy: 0.2, color: "#6ec8ff" },
    { id: "c", x: 0, y: 1, hx: -0.2, hy: 0, color: "#ffb454" },
  ],
  segments: [],
  pathSegments: 8,
};

const mig = migrateProject(legacy);
if (!mig.ok) throw new Error(mig.errors.join("; "));
if (mig.doc.schemaVersion !== CURRENT_SCHEMA_VERSION) throw new Error("version");
if (mig.doc.kind !== SCHEMA_KIND) throw new Error("kind");
if (mig.doc.profile.knots.length !== 3) throw new Error("knots");
if (mig.doc.profile.segments.length !== 2) throw new Error("segments filled");

const doc = buildProjectDocument({
  state: {
    ...mig.doc.editor,
    knots: mig.doc.profile.knots,
    segments: mig.doc.profile.segments,
  },
  name: "Tall vase",
});

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spline-lib-"));
const file = path.join(dir, "tall-vase", "project.json");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(doc, null, 2));
const again = migrateProject(JSON.parse(fs.readFileSync(file, "utf8")));
if (!again.ok || again.doc.name !== "Tall vase") throw new Error("roundtrip");

console.log("[library-smoke] OK", {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  slug: doc.slug,
  dir,
});
