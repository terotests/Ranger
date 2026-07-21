import { reactive, onMounted } from "vue";
import * as api from "../library/api.js";
import { buildProjectDocument } from "../library/schema.js";
import { migrateProject } from "../library/migrations.js";

export function useLibrary({ snapshotState, applyProject, tessellate }) {
  const lib = reactive({
    available: false,
    root: "",
    schemaVersion: 0,
    projects: [],
    currentSlug: null,
    currentName: "",
    status: "",
    busy: false,
    saveAsName: "",
  });

  async function refresh() {
    lib.busy = true;
    try {
      const data = await api.listLibrary();
      lib.available = true;
      lib.root = data.root || "";
      lib.schemaVersion = data.schemaVersion || 0;
      lib.projects = data.projects || [];
      lib.status = `${lib.projects.length} projects · ${lib.root}`;
    } catch (err) {
      lib.available = false;
      lib.projects = [];
      lib.status = "Local library API offline (use npm run dev). " + (err.message || "");
    } finally {
      lib.busy = false;
    }
  }

  async function load(slug) {
    lib.busy = true;
    try {
      const doc = await api.loadProject(slug);
      applyProject(doc);
      tessellate();
      lib.currentSlug = doc.slug;
      lib.currentName = doc.name;
      lib.saveAsName = doc.name;
      lib.status = `Loaded ${doc.slug}`;
      await refresh();
    } catch (err) {
      lib.status = "Load failed: " + (err.message || err);
    } finally {
      lib.busy = false;
    }
  }

  async function save() {
    if (!lib.currentSlug) {
      return saveAs(lib.saveAsName || lib.currentName || "Untitled spline");
    }
    lib.busy = true;
    try {
      const doc = buildProjectDocument({
        state: snapshotState(),
        name: lib.currentName || lib.saveAsName || "Untitled spline",
        id: undefined,
        slug: lib.currentSlug,
      });
      // Keep stable id from disk if present
      const existing = lib.projects.find((p) => p.slug === lib.currentSlug);
      if (existing?.id) doc.id = existing.id;
      const prev = await api.loadProject(lib.currentSlug).catch(() => null);
      if (prev?.id) {
        doc.id = prev.id;
        doc.createdAt = prev.createdAt;
      }
      doc.slug = lib.currentSlug;
      doc.name = lib.currentName || doc.name;
      const saved = await api.saveProject(lib.currentSlug, doc);
      lib.currentName = saved.name;
      lib.status = `Saved ${saved.slug}`;
      await refresh();
    } catch (err) {
      lib.status = "Save failed: " + (err.message || err);
    } finally {
      lib.busy = false;
    }
  }

  async function saveAs(name) {
    const n = String(name || lib.saveAsName || "Untitled spline").trim();
    if (!n) {
      lib.status = "Enter a name to save.";
      return;
    }
    lib.busy = true;
    try {
      const created = await api.createProject({
        name: n,
        state: snapshotState(),
      });
      lib.currentSlug = created.slug;
      lib.currentName = created.name;
      lib.saveAsName = created.name;
      lib.status = `Created ${created.slug}`;
      await refresh();
    } catch (err) {
      lib.status = "Save As failed: " + (err.message || err);
    } finally {
      lib.busy = false;
    }
  }

  async function remove(slug) {
    if (!slug) return;
    if (!confirm(`Delete local project “${slug}”?`)) return;
    lib.busy = true;
    try {
      await api.deleteProject(slug);
      if (lib.currentSlug === slug) {
        lib.currentSlug = null;
        lib.currentName = "";
      }
      lib.status = `Deleted ${slug}`;
      await refresh();
    } catch (err) {
      lib.status = "Delete failed: " + (err.message || err);
    } finally {
      lib.busy = false;
    }
  }

  /** Fallback when API is offline: download JSON. */
  function exportJson(name) {
    const doc = buildProjectDocument({
      state: snapshotState(),
      name: name || lib.currentName || "spline",
      slug: lib.currentSlug || undefined,
    });
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (doc.slug || "spline") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    lib.status = "Downloaded " + a.download;
  }

  async function importJsonFile(file) {
    const text = await file.text();
    const raw = JSON.parse(text);
    const mig = migrateProject(raw);
    if (!mig.ok) {
      lib.status = "Import invalid: " + mig.errors.join("; ");
      return;
    }
    if (lib.available) {
      const created = await api.createProject(mig.doc);
      await load(created.slug);
    } else {
      applyProject(mig.doc);
      tessellate();
      lib.currentName = mig.doc.name;
      lib.status = "Imported into editor (API offline — not written to disk).";
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
  };
}
