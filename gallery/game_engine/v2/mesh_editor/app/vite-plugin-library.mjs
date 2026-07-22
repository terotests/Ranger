// ============================================================================
// vite-plugin-library.mjs — local folder "database" for spline projects.
// ============================================================================
// Default root: gallery/game_engine/v2/mesh_editor/library/projects
// Override with MESH_EDITOR_LIBRARY=/absolute/or/relative/path
//
// Each project is a folder:
//   <slug>/project.json
// Semantically versioned via schemaVersion; GET always migrates to current.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { migrateProject } from "./src/library/migrations.js";
import {
  CURRENT_SCHEMA_VERSION,
  buildProjectDocument,
  nowIso,
  slugify,
  validateProject,
} from "./src/library/schema.js";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, "../library/projects");

function resolveRoot() {
  const env = process.env.MESH_EDITOR_LIBRARY;
  if (env && env.trim()) return path.resolve(process.cwd(), env.trim());
  return DEFAULT_ROOT;
}

function ensureRoot(root) {
  fs.mkdirSync(root, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function listProjects(root) {
  ensureRoot(root);
  const out = [];
  for (const name of fs.readdirSync(root)) {
    const dir = path.join(root, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const file = path.join(dir, "project.json");
    if (!fs.existsSync(file)) continue;
    try {
      const raw = readJson(file);
      const mig = migrateProject(raw);
      if (!mig.ok) {
        out.push({
          slug: name,
          id: raw.id || name,
          name: raw.name || name,
          updatedAt: raw.updatedAt || null,
          schemaVersion: raw.schemaVersion || 0,
          error: mig.errors.join("; "),
        });
        continue;
      }
      const d = mig.doc;
      const projectKind = d.projectKind === "texture" ? "texture" : "mesh";
      const textureCount = Object.keys(d.textureAssets || {}).length;
      out.push({
        slug: d.slug || name,
        id: d.id,
        name: d.name,
        description: d.description || "",
        tags: d.tags || [],
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
        schemaVersion: d.schemaVersion,
        projectKind,
        textureCount,
        knotCount:
          projectKind === "texture"
            ? textureCount
            : d.profile?.knots?.length || 0,
      });
    } catch (err) {
      out.push({ slug: name, name, error: String(err.message || err) });
    }
  }
  out.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return out;
}

function uniqueSlug(root, base) {
  let slug = slugify(base);
  let n = 0;
  while (fs.existsSync(path.join(root, slug))) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function splineLibraryPlugin() {
  const root = resolveRoot();
  ensureRoot(root);

  return {
    name: "spline-library",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url?.split("?")[0] || "";
        if (!urlPath.startsWith("/api/library")) return next();

        try {
          if (req.method === "GET" && urlPath === "/api/library") {
            return sendJson(res, 200, {
              root,
              schemaVersion: CURRENT_SCHEMA_VERSION,
              projects: listProjects(root),
            });
          }

          if (req.method === "GET" && urlPath === "/api/library/meta") {
            return sendJson(res, 200, {
              root,
              schemaVersion: CURRENT_SCHEMA_VERSION,
              kind: "ranger.splineProject",
              envOverride: process.env.MESH_EDITOR_LIBRARY || null,
            });
          }

          const m = urlPath.match(/^\/api\/library\/([^/]+)\/?$/);
          if (m) {
            const slug = decodeURIComponent(m[1]);
            const dir = path.join(root, slug);
            const file = path.join(dir, "project.json");

            if (req.method === "GET") {
              if (!fs.existsSync(file)) return sendJson(res, 404, { error: "not found" });
              const mig = migrateProject(readJson(file));
              if (!mig.ok) return sendJson(res, 422, { error: "migrate failed", errors: mig.errors });
              // Persist migrated form so the folder stays current.
              if ((readJson(file).schemaVersion || 0) < CURRENT_SCHEMA_VERSION) {
                writeJson(file, mig.doc);
              }
              return sendJson(res, 200, mig.doc);
            }

            if (req.method === "PUT") {
              const body = await readBody(req);
              if (!body) return sendJson(res, 400, { error: "empty body" });
              const mig = migrateProject({ ...body, slug, updatedAt: nowIso() });
              if (!mig.ok) return sendJson(res, 422, { error: "invalid", errors: mig.errors });
              mig.doc.slug = slug;
              mig.doc.updatedAt = nowIso();
              writeJson(file, mig.doc);
              return sendJson(res, 200, mig.doc);
            }

            if (req.method === "DELETE") {
              if (!fs.existsSync(dir)) return sendJson(res, 404, { error: "not found" });
              fs.rmSync(dir, { recursive: true, force: true });
              return sendJson(res, 200, { ok: true, slug });
            }
          }

          if (req.method === "POST" && urlPath === "/api/library") {
            const body = await readBody(req);
            if (!body) return sendJson(res, 400, { error: "empty body" });
            // Accept either a full document or { name, state-like fields }.
            let doc;
            if (body.profile && body.editor) {
              const mig = migrateProject(body);
              if (!mig.ok) return sendJson(res, 422, { error: "invalid", errors: mig.errors });
              doc = mig.doc;
            } else if (body.state) {
              doc = buildProjectDocument({
                state: body.state,
                name: body.name,
                description: body.description,
                tags: body.tags,
              });
            } else {
              return sendJson(res, 400, { error: "expected project document or { name, state }" });
            }
            const errors = validateProject(doc);
            if (errors.length) return sendJson(res, 422, { error: "invalid", errors });
            doc.slug = uniqueSlug(root, body.slug || doc.slug || doc.name);
            doc.updatedAt = nowIso();
            if (!doc.createdAt) doc.createdAt = doc.updatedAt;
            writeJson(path.join(root, doc.slug, "project.json"), doc);
            return sendJson(res, 201, doc);
          }

          return sendJson(res, 404, { error: "unknown library route" });
        } catch (err) {
          return sendJson(res, 500, { error: String(err.message || err) });
        }
      });
    },
  };
}
