<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { createPreviewSession } from "../lib/rangerPreview.js";

const props = defineProps({
  mesh: { type: Object, default: null },
  materialMode: { type: Number, default: 3 },
});

const canvasRef = ref(null);
const backendLabel = ref("…");
let session = null;

onMounted(async () => {
  try {
    session = await createPreviewSession(canvasRef.value, 420);
    backendLabel.value = session.useGL ? "Ranger Three · WebGL" : "Ranger Three · software";
    if (props.mesh) session.setMesh(props.mesh);
    session.setMaterialMode(props.materialMode);
  } catch (err) {
    backendLabel.value = "preview failed";
    console.error(err);
  }
});

onBeforeUnmount(() => {
  session?.dispose();
  session = null;
});

watch(
  () => props.mesh,
  (m) => {
    if (m && session) session.setMesh(m);
  },
);

watch(
  () => props.materialMode,
  (mode) => {
    if (session) session.setMaterialMode(mode);
  },
);
</script>

<template>
  <div class="preview">
    <header>
      <h2>3D preview</h2>
      <span>{{ backendLabel }}</span>
    </header>
    <canvas ref="canvasRef" class="view" />
    <p class="hint">Drag to orbit · wheel to zoom · Tessellate to rebuild</p>
  </div>
</template>

<style scoped>
.preview {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.55rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.85rem;
  min-height: 0;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 400;
}

span {
  font-size: 0.72rem;
  color: var(--ink-dim);
}

.view {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0a0d0b;
  touch-action: none;
  display: block;
}

.hint {
  margin: 0;
  text-align: center;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
</style>
