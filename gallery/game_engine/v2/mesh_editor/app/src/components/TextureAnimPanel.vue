<script setup>
/**
 * Texture-editor emotion morph test:
 * tag the current eye with an emotion, pick a topology-compatible peer
 * texture as the target, morph 0…1 (preview only — does not edit knots).
 */
import { computed, ref, watch } from "vue";
import {
  EYE_EMOTION_TAGS,
  normalizeEmotionTag,
  listCompatibleEmotionPeers,
  eyeTopologyKey,
} from "../lib/texture/eyeEmotion.js";

const props = defineProps({
  /** Currently selected eye texture (live). */
  texture: { type: Object, default: null },
  /** All loaded textures (live map values). */
  textures: { type: Array, default: () => [] },
  /** Guid of morph target peer, or "". */
  targetGuid: { type: String, default: "" },
  morphT: { type: Number, default: 0 },
});

const emit = defineEmits(["update-emotion", "update:targetGuid", "update:morphT"]);

const emotionDraft = ref("neutral");

const peers = computed(() => listCompatibleEmotionPeers(props.textures, props.texture));

const hasPeers = computed(() => peers.value.length > 0);

const topologyKey = computed(() =>
  props.texture ? eyeTopologyKey(props.texture) : "",
);

watch(
  () => props.texture?.emotion,
  (e) => {
    emotionDraft.value = normalizeEmotionTag(e || "neutral");
  },
  { immediate: true },
);

watch(
  () => props.texture?.assetGuid,
  () => {
    // Reset target when switching the edited texture.
    emit("update:targetGuid", "");
    emit("update:morphT", 0);
  },
);

watch(peers, (list) => {
  if (!props.targetGuid) return;
  if (!list.some((t) => t.assetGuid === props.targetGuid)) {
    emit("update:targetGuid", "");
    emit("update:morphT", 0);
  }
});

function commitEmotion() {
  const tag = normalizeEmotionTag(emotionDraft.value);
  emotionDraft.value = tag;
  emit("update-emotion", tag);
}

function onTargetChange(e) {
  emit("update:targetGuid", String(e.target.value || ""));
  emit("update:morphT", 0);
}

function onMorphInput(e) {
  emit("update:morphT", Number(e.target.value) || 0);
}

function jump(t) {
  emit("update:morphT", t);
}

function peerLabel(t) {
  const em = normalizeEmotionTag(t.emotion);
  return `${t.name || "Eye"} · ${em}`;
}
</script>

<template>
  <section class="anim-panel">
    <div class="anim-head">
      <span class="anim-title">Emotion morph</span>
      <span class="anim-sub">Texture test · compatible peers</span>
    </div>

    <p v-if="!texture" class="anim-hint">Select an eye texture to tag and morph.</p>
    <template v-else>
      <label class="field">
        This texture emotion
        <div class="emotion-row">
          <select v-model="emotionDraft" @change="commitEmotion">
            <option v-for="tag in EYE_EMOTION_TAGS" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
          <input
            v-model="emotionDraft"
            type="text"
            maxlength="32"
            placeholder="custom…"
            title="Custom emotion tag"
            @change="commitEmotion"
            @keydown.enter.prevent="commitEmotion"
          />
        </div>
      </label>

      <p class="topo" :title="topologyKey">
        topo {{ topologyKey ? topologyKey.slice(0, 42) + (topologyKey.length > 42 ? "…" : "") : "—" }}
      </p>

      <template v-if="!hasPeers">
        <p class="anim-hint">
          No other eye textures share this topology. Create a second eye (same knot
          counts), tag it e.g. <strong>angry</strong>, then morph here.
        </p>
      </template>
      <template v-else>
        <label class="field">
          Morph toward
          <select :value="targetGuid" @change="onTargetChange">
            <option value="">— pick compatible texture —</option>
            <option
              v-for="t in peers"
              :key="t.assetGuid"
              :value="t.assetGuid"
            >
              {{ peerLabel(t) }}
            </option>
          </select>
        </label>

        <label class="field morph" :class="{ dim: !targetGuid }">
          Morph
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            :disabled="!targetGuid"
            :value="morphT"
            @input="onMorphInput"
          />
          <span class="morph-val">{{ Math.round((morphT || 0) * 100) }}%</span>
        </label>

        <div class="anim-jumps">
          <button type="button" :disabled="!targetGuid" @click="jump(0)">A</button>
          <button type="button" :disabled="!targetGuid" @click="jump(0.5)">½</button>
          <button type="button" :disabled="!targetGuid" @click="jump(1)">B</button>
        </div>

        <p class="anim-hint">
          Preview only — working knots stay on texture A until you edit them.
        </p>
      </template>
    </template>
  </section>
</template>

<style scoped>
.anim-panel {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  width: 100%;
}
.anim-head {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.anim-title {
  font-weight: 600;
  font-size: 0.95rem;
}
.anim-sub {
  color: var(--ink-dim);
  font-size: 0.75rem;
}
.anim-hint {
  margin: 0;
  color: var(--ink-dim);
  font-size: 0.78rem;
  line-height: 1.35;
}
.topo {
  margin: 0;
  font-size: 0.68rem;
  color: var(--ink-dim);
  font-family: ui-monospace, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--ink-dim);
}
.field.dim {
  opacity: 0.5;
}
.emotion-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}
.morph {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.25rem 0.5rem;
  align-items: center;
}
.morph input[type="range"] {
  grid-column: 1 / -1;
  width: 100%;
}
.morph-val {
  font-variant-numeric: tabular-nums;
  justify-self: end;
}
.anim-jumps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.anim-jumps button {
  padding: 0.3rem 0.55rem;
  font-size: 0.8rem;
}
</style>
