import { reactive, onMounted } from "vue";
import * as api from "../library/api.js";
import { buildProjectDocument, normalizeProjectKind } from "../library/schema.js";
import { migrateProject } from "../library/migrations.js";

const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

function emptyIdentity() {
  return { slug: null, name: "", saveAsName: "" };
}

/**
 * Local project library. Mesh and texture workspaces keep separate current-document
 * identities so Save cannot rewrite a mesh project as texture (or vice versa).
 *
 * @param {{
 *   snapshotState: (kind: 'mesh'|'texture') => object,
 *   applyProject: (doc: object, kind: 'mesh'|'texture') => void,
 *   tessellate: () => void,
 * }} opts
 */
export function useLibrary({ snapshotState, applyProject, tessellate }) {
  const lib = reactive({
    available: false,
    root: "",
    schemaVersion: 0,
    projects: [],
    mesh: emptyIdentity(),
    texture: emptyIdentity(),
    status: "",
    busy: false,
    busyCount: 0,
  });

  let refreshGen = 0;

  function beginBusy() {
    lib.busyCount += 1;
    lib.busy = true;
  }

  function endBusy() {
    lib.busyCount = Math.max(0, lib.busyCount - 1);
    lib.busy = lib.busyCount > 0;
  }

  function identity(kind) {
    return kind === "texture" ? lib.texture : lib.mesh;
  }

  function normalizeKind(kind) {
    return kind === "texture" ? "texture" : "mesh";
  }

  async function refresh() {
    const gen = ++refreshGen;
    beginBusy();
    try {
      const data = await api.listLibrary();
      if (gen !== refreshGen) return;
      lib.available = true;
      lib.root = data.root || "";
      lib.schemaVersion = data.schemaVersion || 0;
      lib.projects = data.projects || [];
      lib.status = `${lib.projects.length} projects · ${lib.root}`;
    } catch (err) {
      if (gen !== refreshGen) return;
      lib.available = false;
      lib.projects = [];
      lib.status = "Local library API offline (use npm run dev). " + (err.message || "");
    } finally {
      endBusy();
    }
  }

  async function load(slug, kindHint) {
    beginBusy();
    try {
      const doc = await api.loadProject(slug);
      const kind = normalizeKind(kindHint || doc.projectKind);
      applyProject(doc, kind);
      if (kind === "mesh") tessellate();
      const slot = identity(kind);
      slot.slug = doc.slug;
      slot.name = doc.name;
      slot.saveAsName = doc.name;
      lib.status = `Loaded ${doc.slug} (${kind})`;
      await refresh();
    } catch (err) {
      lib.status = "Load failed: " + (err.message || err);
    } finally {
      endBusy();
    }
  }

  async function save(kind) {
    const k = normalizeKind(kind);
    const slot = identity(k);
    if (!slot.slug) {
      return saveAs(slot.saveAsName || slot.name || "Untitled", k);
    }
    beginBusy();
    try {
      const prev = await api.loadProject(slot.slug).catch(() => null);
      if (prev && normalizeProjectKind(prev.projectKind) !== k) {
        lib.status =
          `“${slot.slug}” is a ${prev.projectKind} project — use Save as to create a new ${k} entry.`;
        return;
      }
      const doc = buildProjectDocument({
        state: snapshotState(k),
        name: slot.name || slot.saveAsName || "Untitled",
        slug: slot.slug,
        projectKind: k,
      });
      if (prev?.id) {
        doc.id = prev.id;
        doc.createdAt = prev.createdAt;
      } else {
        const existing = lib.projects.find((p) => p.slug === slot.slug);
        if (existing?.id) doc.id = existing.id;
      }
      doc.slug = slot.slug;
      doc.name = slot.name || doc.name;
      doc.projectKind = k;
      const saved = await api.saveProject(slot.slug, doc);
      slot.name = saved.name;
      slot.saveAsName = saved.name;
      lib.status = `Saved ${saved.slug} (${k})`;
      await refresh();
    } catch (err) {
      lib.status = "Save failed: " + (err.message || err);
    } finally {
      endBusy();
    }
  }

  async function saveAs(name, kind) {
    const k = normalizeKind(kind);
    const slot = identity(k);
    const n = String(name || slot.saveAsName || slot.name || "Untitled").trim();
    if (!n) {
      lib.status = "Enter a name to save.";
      return;
    }
    beginBusy();
    try {
      // Build the document on the client first (same as save/exportJson) so
      // textureMap TypedArrays become rgba8-base64 before fetch JSON.stringify.
      // Posting raw editor state drops the bake: TypedArrays revive as
      // `{ "0": n, … }` without .length and serializeTextureMap returns null.
      const doc = buildProjectDocument({
        state: snapshotState(k),
        name: n,
        projectKind: k,
      });
      const created = await api.createProject(doc);
      slot.slug = created.slug;
      slot.name = created.name;
      slot.saveAsName = created.name;
      lib.status = `Created ${created.slug} (${k})`;
      await refresh();
    } catch (err) {
      lib.status = "Save As failed: " + (err.message || err);
    } finally {
      endBusy();
    }
  }

  async function remove(slug, kind) {
    if (!slug) return;
    if (!confirm(`Delete local project “${slug}”?`)) return;
    beginBusy();
    try {
      await api.deleteProject(slug);
      for (const k of ["mesh", "texture"]) {
        const slot = identity(k);
        if (slot.slug === slug) {
          slot.slug = null;
          slot.name = "";
          slot.saveAsName = "";
        }
      }
      void kind;
      lib.status = `Deleted ${slug}`;
      await refresh();
    } catch (err) {
      lib.status = "Delete failed: " + (err.message || err);
    } finally {
      endBusy();
    }
  }

  /** Fallback when API is offline: download JSON. */
  function exportJson(name, kind) {
    const k = normalizeKind(kind);
    const slot = identity(k);
    const doc = buildProjectDocument({
      state: snapshotState(k),
      name: name || slot.name || slot.saveAsName || "spline",
      slug: slot.slug || undefined,
      projectKind: k,
    });
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (doc.slug || "spline") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    lib.status = "Downloaded " + a.download;
  }

  async function importJsonFile(file, kindHint) {
    beginBusy();
    try {
      if (!file) {
        lib.status = "No file selected.";
        return;
      }
      if (file.size > MAX_IMPORT_BYTES) {
        lib.status = `Import too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`;
        return;
      }
      let text;
      try {
        text = await file.text();
      } catch (err) {
        lib.status = "Could not read file: " + (err.message || err);
        return;
      }
      let raw;
      try {
        raw = JSON.parse(text);
      } catch (err) {
        lib.status = "Invalid JSON: " + (err.message || err);
        return;
      }
      const mig = migrateProject(raw);
      if (!mig.ok) {
        lib.status = "Import invalid: " + mig.errors.join("; ");
        return;
      }
      const kind = normalizeKind(kindHint || mig.doc.projectKind);
      mig.doc.projectKind = kind;
      if (lib.available) {
        const created = await api.createProject(mig.doc);
        await load(created.slug, kind);
      } else {
        applyProject(mig.doc, kind);
        if (kind === "mesh") tessellate();
        const slot = identity(kind);
        slot.name = mig.doc.name;
        slot.saveAsName = mig.doc.name;
        lib.status = "Imported into editor (API offline — not written to disk).";
      }
    } catch (err) {
      lib.status = "Import failed: " + (err.message || err);
    } finally {
      endBusy();
    }
  }

  onMounted(() => {
    refresh();
  });

  return {
    lib,
    refresh,
    load,
    save,
    saveAs,
    remove,
    exportJson,
    importJsonFile,
    identity,
  };
}
