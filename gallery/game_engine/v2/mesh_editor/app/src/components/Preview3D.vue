<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from "vue";
import { createPreviewSession } from "../lib/rangerPreview.js";
import {
  orientMeshToPlacementNormal,
  placementNormalDirection3,
  rotationAligning,
} from "../lib/placementNormal.js";
import { pickRootSurface, transposeMat3 } from "../lib/meshPick.js";

const props = defineProps({
  mesh: { type: Object, default: null },
  rootMesh: { type: Object, default: null },
  materialMode: { type: Number, default: 3 },
  placementNormal: {
    type: Object,
    default: () => ({ start: { x: 0, y: -1 }, end: { x: 0, y: 1 } }),
  },
  placeMode: { type: Boolean, default: false },
});

const emit = defineEmits(["place-hover", "place-commit", "place-cancel"]);

const canvasRef = ref(null);
const wrapRef = ref(null);
const backendLabel = ref("…");
const hoverHit = ref(null);
let session = null;
let draggingOrbit = false;
let downPos = null;

const displayMesh = computed(() =>
  orientMeshToPlacementNormal(props.mesh, props.placementNormal),
);

const orientInv = computed(() => {
  const dir = placementNormalDirection3(props.placementNormal);
  // Display = R * authoring, so inv = R^T where R maps dir → +Y
  const R = rotationAligning(dir, { x: 0, y: 1, z: 0 });
  return transposeMat3(R);
});

function pushDisplay() {
  if (!session) return;
  if (displayMesh.value) session.setMesh(displayMesh.value);
}

function getView() {
  return session?.getView?.() || null;
}

function pickAt(sx, sy) {
  const view = getView();
  const parts = props.rootMesh?.parts;
  if (!view || !parts?.length) return null;
  return pickRootSurface(
    sx,
    sy,
    view,
    parts,
    view.meshTilt,
    view.meshAngle,
    orientInv.value,
  );
}

function onPointerDown(e) {
  if (!props.placeMode) return;
  if (e.button === 2 || e.button === 1) {
    draggingOrbit = true;
    session?.host?.pointerDown?.(e.offsetX, e.offsetY, e.button);
    return;
  }
  if (e.button !== 0) return;
  downPos = { x: e.offsetX, y: e.offsetY };
  // Don't start orbit on left in place mode
  e.stopPropagation();
}

function onPointerMove(e) {
  if (!props.placeMode) return;
  if (draggingOrbit) {
    session?.host?.pointerMove?.(e.offsetX, e.offsetY);
    return;
  }
  const hit = pickAt(e.offsetX, e.offsetY);
  hoverHit.value = hit;
  emit("place-hover", hit);
}

function onPointerUp(e) {
  if (!props.placeMode) return;
  if (draggingOrbit) {
    session?.host?.pointerUp?.();
    draggingOrbit = false;
    return;
  }
  if (e.button !== 0 || !downPos) return;
  const dist = Math.hypot(e.offsetX - downPos.x, e.offsetY - downPos.y);
  downPos = null;
  if (dist > 6) return;
  const hit = pickAt(e.offsetX, e.offsetY);
  if (hit) emit("place-commit", hit);
}

function onKeyDown(e) {
  if (!props.placeMode) return;
  if (e.key === "Escape") {
    emit("place-cancel");
  }
}

function onContextMenu(e) {
  if (props.placeMode) e.preventDefault();
}

onMounted(async () => {
  try {
    session = await createPreviewSession(canvasRef.value, 420, {
      placeModeGetter: () => props.placeMode,
    });
    backendLabel.value = session.useGL ? "Ranger Three · WebGL" : "Ranger Three · software";
    pushDisplay();
    session.setMaterialMode(props.materialMode);
    session.setAutoRotate?.(true);
  } catch (err) {
    backendLabel.value = "preview failed";
    console.error(err);
  }
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
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

watch(
  () => props.placeMode,
  (on) => {
    session?.setAutoRotate?.(!on);
    hoverHit.value = null;
    if (canvasRef.value) {
      canvasRef.value.style.cursor = on ? "copy" : "crosshair";
    }
  },
);
</script>

<template>
  <div ref="wrapRef" class="preview" :class="{ placing: placeMode }">
    <header>
      <h2>3D preview</h2>
      <span>{{ backendLabel }}</span>
    </header>
    <div class="view-wrap">
      <canvas
        ref="canvasRef"
        class="view"
        :class="{ place: placeMode }"
        @pointerdown.capture="onPointerDown"
        @pointermove.capture="onPointerMove"
        @pointerup.capture="onPointerUp"
        @contextmenu="onContextMenu"
      />
      <div v-if="placeMode" class="place-banner">
        Place on surface · hover (+) · click to attach · Esc cancel · right-drag orbit
      </div>
      <div
        v-if="placeMode && hoverHit"
        class="hit-dot"
        :style="{
          // approximate marker — banner is enough; keep simple center cue
        }"
      />
    </div>
    <p class="hint">
      <template v-if="placeMode">Aim at the root surface — sub-object aligns to the normal</template>
      <template v-else>Drag to orbit · wheel to zoom · view aligned so placement normal points up</template>
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
.preview.placing {
  border-color: rgba(59, 130, 246, 0.55);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.25);
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

.view-wrap {
  position: relative;
  justify-self: center;
  width: 100%;
  max-width: 420px;
}

.view {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0a0e0c;
  touch-action: none;
  cursor: crosshair;
  display: block;
}
.view.place {
  cursor: copy;
}

.place-banner {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
  color: #bfdbfe;
  font-size: 0.68rem;
  pointer-events: none;
  text-align: center;
}

.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
</style>
