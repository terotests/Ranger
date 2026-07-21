<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from "vue";
import { createPreviewSession } from "../lib/rangerPreview.js";
import { orientMeshToPlacementNormal } from "../lib/placementNormal.js";

const props = defineProps({
  mesh: { type: Object, default: null },
  materialMode: { type: Number, default: 3 },
  placementNormal: {
    type: Object,
    default: () => ({ start: { x: 0, y: -1 }, end: { x: 0, y: 1 } }),
  },
});

const canvasRef = ref(null);
const backendLabel = ref("…");
let session = null;

const displayMesh = computed(() =>
  orientMeshToPlacementNormal(props.mesh, props.placementNormal),
);

function pushDisplay() {
  if (!session) return;
  if (displayMesh.value) session.setMesh(displayMesh.value);
}

onMounted(async () => {
  try {
    session = await createPreviewSession(canvasRef.value, 420);
    backendLabel.value = session.useGL ? "Ranger Three · WebGL" : "Ranger Three · software";
    pushDisplay();
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

watch(displayMesh, () => pushDisplay(), { deep: true });

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
    <p class="hint">
      Drag to orbit · wheel to zoom · view aligned so placement normal points up
    </p>
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
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0a0e0c;
  justify-self: center;
  touch-action: none;
}

.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
</style>
