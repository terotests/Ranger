<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { DEFAULT_EYE_UV, normalizeEyeUv } from "../lib/texture/eyeTexture.js";
import * as api from "../library/api.js";

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Currently loaded texture assets [{ assetGuid, name, kind }] */
  loadedTextures: { type: Array, default: () => [] },
  /** Library projects that may contain textures (with optional .textures summaries) */
  libraryProjects: { type: Array, default: () => [] },
  /** Current objectMaterial.textureUv */
  initialUv: { type: Object, default: null },
  /** Preselected asset guid if already assigned */
  initialGuid: { type: String, default: "" },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "apply", "place", "preview"]);

/** "loaded:<guid>" | "lib:<slug>:<guid>" */
const sourceKey = ref("");
const uv = reactive({
  ...normalizeEyeUv(props.initialUv || DEFAULT_EYE_UV),
  eyeSeparationU: 0.12,
});
const status = ref("");
const resolving = ref(false);
/** Block live preview while the dialog is initializing (no auto-assign). */
const previewReady = ref(false);

const sources = computed(() => {
  const rows = [];
  const seen = new Set();

  for (const t of props.loadedTextures || []) {
    if (!t?.assetGuid || seen.has(t.assetGuid)) continue;
    seen.add(t.assetGuid);
    rows.push({
      key: `loaded:${t.assetGuid}`,
      label: `${t.name || "Texture"} (open in editor)`,
      kind: "loaded",
      guid: t.assetGuid,
      slug: null,
    });
  }

  for (const p of props.libraryProjects || []) {
    if (p.error) continue;
    const texList = Array.isArray(p.textures) ? p.textures : [];
    if (texList.length) {
      for (const t of texList) {
        if (!t?.assetGuid) continue;
        // Prefer the already-open copy when the same guid is loaded.
        if (seen.has(t.assetGuid)) continue;
        seen.add(t.assetGuid);
        rows.push({
          key: `lib:${p.slug}:${t.assetGuid}`,
          label: `${t.name || "Texture"} · ${p.name || p.slug}`,
          kind: "library",
          guid: t.assetGuid,
          slug: p.slug,
        });
      }
      continue;
    }
    // Legacy list entries without per-texture summaries
    const texN = p.textureCount || 0;
    if (p.projectKind === "texture" || texN > 0) {
      rows.push({
        key: `lib:${p.slug}:`,
        label: `${p.name || p.slug}${texN ? ` · ${texN} tex` : ""} (saved)`,
        kind: "library",
        guid: null,
        slug: p.slug,
      });
    }
  }
  return rows;
});

function resetFromProps() {
  const next = normalizeEyeUv(props.initialUv || DEFAULT_EYE_UV);
  Object.assign(uv, {
    ...next,
    eyeSeparationU: next.eyeSeparationU != null ? next.eyeSeparationU : 0.12,
  });
  status.value = "";

  // Only preselect when this mesh already has an assignment — never auto-pick “latest”.
  const want = props.initialGuid || "";
  if (want) {
    const match = sources.value.find((s) => s.guid === want);
    sourceKey.value = match?.key || (props.loadedTextures.some((t) => t.assetGuid === want)
      ? `loaded:${want}`
      : "");
  } else {
    sourceKey.value = "";
  }
}

watch(
  () => props.open,
  async (on) => {
    previewReady.value = false;
    if (!on) return;
    resetFromProps();
    await nextTick();
    previewReady.value = true;
  },
);

// Library list may arrive right after open (refresh). Re-bind selection if needed.
watch(
  () => props.libraryProjects,
  () => {
    if (!props.open || sourceKey.value) return;
    if (props.initialGuid) resetFromProps();
  },
  { deep: true },
);

function emitPreview() {
  if (!previewReady.value || !sourceKey.value) return;
  emit("preview", { sourceKey: sourceKey.value, uv: normalizeEyeUv(uv) });
}

watch(uv, () => emitPreview(), { deep: true });
watch(sourceKey, () => emitPreview());

async function resolveSelection() {
  const key = sourceKey.value;
  if (!key) return null;

  if (key.startsWith("loaded:")) {
    return { guid: key.slice("loaded:".length), assets: null };
  }

  if (key.startsWith("lib:")) {
    const rest = key.slice("lib:".length);
    const colon = rest.indexOf(":");
    const slug = colon >= 0 ? rest.slice(0, colon) : rest;
    const wantGuid = colon >= 0 ? rest.slice(colon + 1) : "";
    resolving.value = true;
    status.value = "Loading saved texture…";
    try {
      const doc = await api.loadProject(slug);
      const assets = doc?.textureAssets || {};
      const guids = Object.keys(assets);
      if (!guids.length) {
        status.value = "That project has no texture assets.";
        return null;
      }
      const guid = wantGuid && assets[wantGuid] ? wantGuid : guids[0];
      return { guid, assets };
    } catch (err) {
      status.value = "Load failed: " + (err.message || err);
      return null;
    } finally {
      resolving.value = false;
    }
  }
  return null;
}

function currentUv() {
  return normalizeEyeUv({
    ...uv,
    eyeSeparationU: uv.eyeSeparationU != null ? uv.eyeSeparationU : 0.12,
  });
}

async function onApply() {
  const resolved = await resolveSelection();
  if (!resolved?.guid) {
    if (!status.value) status.value = "Pick a texture first.";
    return;
  }
  emit("apply", {
    guid: resolved.guid,
    uv: currentUv(),
    assets: resolved.assets,
  });
}

/** Resolve texture then place with two corner clicks on the 3D preview. */
async function onPlace() {
  const resolved = await resolveSelection();
  if (!resolved?.guid) {
    if (!status.value) status.value = "Pick a texture first.";
    return;
  }
  emit("place", {
    guid: resolved.guid,
    uv: currentUv(),
    assets: resolved.assets,
  });
}

function onBackdrop(e) {
  if (e.target === e.currentTarget) emit("close");
}
</script>

<template>
  <div v-if="open" class="backdrop" @click="onBackdrop">
    <section class="dialog" role="dialog" aria-labelledby="assign-tex-title">
      <header>
        <h2 id="assign-tex-title">Assign eye texture</h2>
        <button type="button" class="x" @click="emit('close')">×</button>
      </header>
      <p class="hint">
        Pick a texture, then <strong>Place on mesh</strong> and click the top-left and
        bottom-right corners in the 3D preview. Drag afterward to fine-tune. Sliders here
        adjust gap / fallback UV; atlas sclera uses mesh knot colors.
      </p>

      <label class="field">
        Texture
        <select v-model="sourceKey">
          <option value="">Select a texture…</option>
          <option v-for="s in sources" :key="s.key" :value="s.key">{{ s.label }}</option>
        </select>
      </label>
      <p v-if="!sources.length" class="warn">
        No textures found. Save one in Texture mode (Save As), or keep an eye open in the editor.
      </p>

      <div class="sliders">
        <label>
          Left ← → Right
          <input v-model.number="uv.centerU" type="range" min="0.15" max="0.85" step="0.01" />
          <span>{{ Number(uv.centerU).toFixed(2) }}</span>
        </label>
        <label>
          Down ← → Up
          <input v-model.number="uv.centerV" type="range" min="0.2" max="0.9" step="0.01" />
          <span>{{ Number(uv.centerV).toFixed(2) }}</span>
        </label>
        <label>
          Scale
          <input v-model.number="uv.scale" type="range" min="0.35" max="2.5" step="0.05" />
          <span>{{ Number(uv.scale).toFixed(2) }}×</span>
        </label>
        <label>
          Eye gap
          <input
            v-model.number="uv.eyeSeparationU"
            type="range"
            min="0.04"
            max="0.35"
            step="0.01"
          />
          <span>{{ Number(uv.eyeSeparationU || 0.12).toFixed(2) }}</span>
        </label>
      </div>

      <p v-if="status" class="status">{{ status }}</p>

      <footer>
        <button type="button" @click="emit('close')">Cancel</button>
        <button type="button" :disabled="busy || resolving || !sourceKey" @click="onApply">
          Apply UV
        </button>
        <button
          type="button"
          class="primary"
          :disabled="busy || resolving || !sourceKey"
          @click="onPlace"
        >
          {{ resolving ? "Loading…" : "Place on mesh" }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
}
.dialog {
  width: min(420px, 100%);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem 1.1rem;
  display: grid;
  gap: 0.75rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 400;
}
.x {
  padding: 0.15rem 0.45rem;
  font-size: 1.1rem;
}
.hint,
.warn,
.status {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-dim);
  line-height: 1.35;
}
.warn {
  color: #e8a070;
}
.field {
  display: grid;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--ink-dim);
}
.field select {
  width: 100%;
}
.sliders {
  display: grid;
  gap: 0.55rem;
}
.sliders label {
  display: grid;
  grid-template-columns: 7.5rem 1fr 2.4rem;
  gap: 0.45rem;
  align-items: center;
  font-size: 0.75rem;
  color: var(--ink-dim);
}
.sliders input[type="range"] {
  width: 100%;
}
footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}
</style>
