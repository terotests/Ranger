<script setup>
/**
 * Mesh-side animation class preview: pick class (e.g. emotion), from/to targets,
 * and morph 0…1. Re-bakes the assigned eye atlas into the 3D preview.
 */
import { computed, ref, watch } from "vue";
import {
  ANIM_CLASS_EMOTION,
  listAnimClassesForPart,
  listAnimTargets,
  ensureDemoAnimTargets,
  PART_CLASS_EYE,
} from "../lib/texture/eyeEmotion.js";

const props = defineProps({
  /** Assigned texture asset (live editor object), or null */
  texture: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["morph", "seed"]);

const animClass = ref(ANIM_CLASS_EMOTION);
const fromTarget = ref("neutral");
const toTarget = ref("angry");
const morphT = ref(0);
const scrubbing = ref(false);

const classes = computed(() =>
  listAnimClassesForPart(props.texture?.partClass || PART_CLASS_EYE),
);

const targets = computed(() => {
  if (!props.texture) return [];
  return listAnimTargets(props.texture, animClass.value);
});

const hasTargets = computed(() => targets.value.length >= 2);

const classLabel = computed(() => {
  const c = classes.value.find((x) => x.id === animClass.value);
  return c?.label || animClass.value;
});

watch(
  targets,
  (list) => {
    if (!list.length) return;
    if (!list.includes(fromTarget.value)) fromTarget.value = list[0];
    if (!list.includes(toTarget.value)) {
      toTarget.value = list.find((t) => t !== fromTarget.value) || list[0];
    }
  },
  { immediate: true },
);

function emitMorph(finalPass = false) {
  emit("morph", {
    animClass: animClass.value,
    from: fromTarget.value,
    to: toTarget.value,
    t: morphT.value,
    finalPass,
  });
}

function onSliderInput() {
  scrubbing.value = true;
  emitMorph(false);
}

function onSliderChange() {
  scrubbing.value = false;
  emitMorph(true);
}

function onSeed() {
  emit("seed", { animClass: animClass.value });
}

function swap() {
  const a = fromTarget.value;
  fromTarget.value = toTarget.value;
  toTarget.value = a;
  emitMorph(true);
}

function jump(t) {
  morphT.value = t;
  emitMorph(true);
}

/** Expose ensure for parent if needed */
defineExpose({ ensureDemoAnimTargets, targets, animClass });
</script>

<template>
  <div class="anim-panel" :class="{ dim: disabled }">
    <div class="anim-head">
      <span class="anim-title">Anim preview</span>
      <span class="anim-sub">{{ classLabel }} A → B</span>
    </div>

    <p v-if="!texture" class="anim-hint">Assign an eye texture to enable morph preview.</p>
    <template v-else>
      <label class="field">
        Class
        <select v-model="animClass" :disabled="disabled || busy">
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>
      </label>

      <div v-if="!hasTargets" class="anim-seed">
        <p class="anim-hint">
          No {{ classLabel.toLowerCase() }} targets on this texture yet.
        </p>
        <button
          type="button"
          class="primary"
          :disabled="disabled || busy"
          title="Create procedural emotion targets from the current eye for testing"
          @click="onSeed"
        >
          Seed demo emotions
        </button>
      </div>

      <template v-else>
        <div class="anim-row">
          <label class="field">
            From
            <select v-model="fromTarget" :disabled="disabled || busy" @change="emitMorph(true)">
              <option v-for="t in targets" :key="'f-' + t" :value="t">{{ t }}</option>
            </select>
          </label>
          <button
            type="button"
            class="swap"
            title="Swap from/to"
            :disabled="disabled || busy"
            @click="swap"
          >
            ↔
          </button>
          <label class="field">
            To
            <select v-model="toTarget" :disabled="disabled || busy" @change="emitMorph(true)">
              <option v-for="t in targets" :key="'t-' + t" :value="t">{{ t }}</option>
            </select>
          </label>
        </div>

        <label class="field morph">
          Morph
          <input
            v-model.number="morphT"
            type="range"
            min="0"
            max="1"
            step="0.02"
            :disabled="disabled || busy"
            @input="onSliderInput"
            @change="onSliderChange"
          />
          <span class="morph-val">{{ Math.round(morphT * 100) }}%</span>
        </label>

        <div class="anim-jumps">
          <button type="button" :disabled="disabled || busy" @click="jump(0)">A</button>
          <button type="button" :disabled="disabled || busy" @click="jump(0.5)">½</button>
          <button type="button" :disabled="disabled || busy" @click="jump(1)">B</button>
          <button
            type="button"
            :disabled="disabled || busy"
            title="Add/refresh procedural emotion targets"
            @click="onSeed"
          >
            Reseed
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.anim-panel {
  margin-top: 0.65rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.anim-panel.dim {
  opacity: 0.55;
}
.anim-head {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.anim-title {
  font-weight: 600;
  font-size: 0.92rem;
}
.anim-sub {
  color: var(--ink-dim);
  font-size: 0.78rem;
}
.anim-hint {
  margin: 0;
  color: var(--ink-dim);
  font-size: 0.8rem;
  line-height: 1.35;
}
.anim-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.35rem;
  align-items: end;
}
.swap {
  padding: 0.35rem 0.45rem;
  margin-bottom: 0.05rem;
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
  color: var(--ink-dim);
  font-size: 0.8rem;
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
.anim-seed {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-items: flex-start;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--ink-dim);
}
</style>
