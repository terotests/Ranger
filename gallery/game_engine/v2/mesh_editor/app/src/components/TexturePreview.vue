<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from "vue";
import { renderEyeTexture, normalizeEyePair } from "../lib/texture/eyeTexture.js";

const props = defineProps({
  texture: { type: Object, default: null },
  /** Square eye cell size; pair canvas is wider. */
  size: { type: Number, default: 220 },
  pair: { type: Boolean, default: true },
  editSide: { type: String, default: "both" },
  distance: { type: Number, default: 0.35 },
});

const emit = defineEmits(["update-distance"]);

const canvasRef = ref(null);

const pairInfo = computed(() => normalizeEyePair(props.texture?.eyePair));

const canvasW = computed(() => {
  if (!props.pair) return props.size;
  const gap = Math.round(8 + (props.distance ?? pairInfo.value.distance) * props.size * 0.45);
  return props.size * 2 + gap + 24;
});

const canvasH = computed(() => props.size + 16);

function paint() {
  const c = canvasRef.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!props.texture) {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#1a221c";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#9aab9c";
    ctx.font = "12px sans-serif";
    ctx.fillText("No texture", 16, 28);
    return;
  }
  if (props.texture.kind === "eye") {
    renderEyeTexture(ctx, props.texture, {
      pair: props.pair,
      editSide: props.editSide || pairInfo.value.editSide,
    });
  }
}

function syncSize() {
  const c = canvasRef.value;
  if (!c) return;
  c.width = canvasW.value;
  c.height = canvasH.value;
  paint();
}

onMounted(syncSize);
watch(() => props.texture, paint, { deep: true });
watch(() => [props.size, props.pair, props.distance, props.editSide], syncSize);

onBeforeUnmount(() => {});
</script>

<template>
  <section class="panel">
    <header>
      <h2>Texture preview</h2>
      <span>{{ pair ? "left · right" : "dynamic" }}</span>
    </header>
    <canvas ref="canvasRef" class="view" :class="{ pair }" />
    <label v-if="pair" class="dist">
      Eye distance
      <input
        type="range"
        min="0"
        max="1"
        step="0.02"
        :value="distance"
        @input="emit('update-distance', Number($event.target.value))"
      />
    </label>
    <p class="hint">
      Left &amp; right eyes from params. Linked eyes stay mirror images — unlink to edit
      separately, or Reset to mirror image.
    </p>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 0.55rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.85rem;
  justify-items: center;
}
header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: baseline;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 400;
}
span {
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.view {
  width: min(100%, 280px);
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0a0e0c;
  display: block;
}
.view.pair {
  width: min(100%, 420px);
  aspect-ratio: auto;
  height: auto;
}
.dist {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: center;
  width: 100%;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.dist input {
  width: 100%;
}
.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
  text-align: center;
}
</style>
