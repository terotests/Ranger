<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { DEFAULT_EYE_UV, normalizeEyeUv } from "../lib/texture/eyeTexture.js";
import { buildAssignTextureSources } from "../lib/assignTextureSources.js";
import * as api from "../library/api.js";

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Currently loaded texture assets [{ assetGuid, name, kind }] */
  loadedTextures: { type: Array, default: () => [] },
  /** Library projects that may contain textures (with optional .textures summaries) */
  libraryProjects: { type: Array, default: () => [] },
  /** UV from the 3D square region (required placement). */
  initialUv: { type: Object, default: null },
  /** Preselected asset guid if already assigned */
  initialGuid: { type: String, default: "" },
  busy: { type: Boolean, default: false },
  /** Progress label while assign runs (loader). */
  progressLabel: { type: String, default: "" },
});

const emit = defineEmits(["close", "apply"]);

/** "loaded:<guid>" | "lib:<slug>:<guid>" */
const sourceKey = ref("");
const uv = reactive({
  ...normalizeEyeUv(props.initialUv || DEFAULT_EYE_UV),
  eyeSeparationU: 0.12,
});
const status = ref("");
const resolving = ref(false);

const sources = computed(() =>
  buildAssignTextureSources(props.loadedTextures, props.libraryProjects),
);

function resetFromProps() {
  const next = normalizeEyeUv(props.initialUv || DEFAULT_EYE_UV);
  Object.assign(uv, {
    ...next,
    eyeSeparationU: next.eyeSeparationU != null ? next.eyeSeparationU : 0.12,
  });
  status.value = "";

  const want = props.initialGuid || "";
  if (want) {
    const match = sources.value.find((s) => s.guid === want);
    sourceKey.value =
      match?.key ||
      (props.loadedTextures.some((t) => t.assetGuid === want) ? `loaded:${want}` : "");
  } else {
    sourceKey.value = "";
  }
}

watch(
  () => props.open,
  async (on) => {
    if (!on) return;
    resetFromProps();
    await nextTick();
  },
);

watch(
  () => props.libraryProjects,
  () => {
    if (!props.open || sourceKey.value) return;
    if (props.initialGuid) resetFromProps();
  },
  { deep: true },
);

watch(
  () => props.initialUv,
  (v) => {
    if (!props.open || !v) return;
    const next = normalizeEyeUv(v);
    Object.assign(uv, {
      ...next,
      eyeSeparationU: next.eyeSeparationU != null ? next.eyeSeparationU : uv.eyeSeparationU,
    });
  },
  { deep: true },
);

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

async function onApply() {
  const resolved = await resolveSelection();
  if (!resolved?.guid) {
    if (!status.value) status.value = "Pick a texture first.";
    return;
  }
  emit("apply", {
    guid: resolved.guid,
    uv: normalizeEyeUv({
      ...uv,
      eyeSeparationU: uv.eyeSeparationU != null ? uv.eyeSeparationU : 0.12,
    }),
    assets: resolved.assets,
  });
}

function onBackdrop(e) {
  if (props.busy) return;
  if (e.target === e.currentTarget) emit("close");
}
</script>

<template>
  <div v-if="open" class="backdrop" @click="onBackdrop">
    <section class="dialog" role="dialog" aria-labelledby="assign-tex-title">
      <header>
        <h2 id="assign-tex-title">Choose eye texture</h2>
        <button type="button" class="x" :disabled="busy" @click="emit('close')">×</button>
      </header>
      <p class="hint">
        Placement comes from the square on the 3D preview. Pick which eye texture to paint
        there — assignment may take a moment.
      </p>

      <label class="field">
        Texture
        <select v-model="sourceKey" :disabled="busy">
          <option value="">Select a texture…</option>
          <option v-for="s in sources" :key="s.key" :value="s.key">{{ s.label }}</option>
        </select>
      </label>
      <p v-if="!sources.length" class="warn">
        No textures found. Save one in Texture mode (Save As), or keep an eye open in the editor.
      </p>

      <label class="gap">
        Eye gap
        <input
          v-model.number="uv.eyeSeparationU"
          type="range"
          min="0.04"
          max="0.35"
          step="0.01"
          :disabled="busy"
        />
        <span>{{ Number(uv.eyeSeparationU || 0.12).toFixed(2) }}</span>
      </label>

      <div v-if="busy || progressLabel" class="loader" aria-live="polite">
        <div class="spinner" />
        <p>{{ progressLabel || "Assigning…" }}</p>
      </div>
      <p v-else-if="status" class="status">{{ status }}</p>

      <footer>
        <button type="button" :disabled="busy" @click="emit('close')">Cancel</button>
        <button
          type="button"
          class="primary"
          :disabled="busy || resolving || !sourceKey"
          @click="onApply"
        >
          {{ busy ? "Working…" : resolving ? "Loading…" : "Assign" }}
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
.gap {
  display: grid;
  grid-template-columns: 5rem 1fr 2.4rem;
  gap: 0.45rem;
  align-items: center;
  font-size: 0.75rem;
  color: var(--ink-dim);
}
.gap input[type="range"] {
  width: 100%;
}
.loader {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--line);
}
.loader p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ink);
}
.spinner {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid rgba(250, 204, 21, 0.25);
  border-top-color: #facc15;
  animation: spin 0.7s linear infinite;
  flex: 0 0 auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}
</style>
