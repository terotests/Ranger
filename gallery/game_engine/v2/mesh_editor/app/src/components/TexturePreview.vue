<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { renderEyeTexture } from "../lib/texture/eyeTexture.js";

const props = defineProps({
  texture: { type: Object, default: null },
  size: { type: Number, default: 256 },
});

const canvasRef = ref(null);

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
    renderEyeTexture(ctx, props.texture);
  }
}

onMounted(paint);
watch(() => props.texture, paint, { deep: true });
watch(
  () => props.size,
  (s) => {
    if (canvasRef.value) {
      canvasRef.value.width = s;
      canvasRef.value.height = s;
      paint();
    }
  },
);

onBeforeUnmount(() => {});
</script>

<template>
  <section class="panel">
    <header>
      <h2>Texture preview</h2>
      <span>dynamic · params only</span>
    </header>
    <canvas ref="canvasRef" class="view" :width="size" :height="size" />
    <p class="hint">
      Rasterized at runtime from layer params (animatable). Mesh assign / UV projection comes later —
      background from vertex colours when applied.
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
.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
  text-align: center;
}
</style>
