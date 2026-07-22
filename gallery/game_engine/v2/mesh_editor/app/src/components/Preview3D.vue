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
  /**
   * Eye UV assign on the root surface:
   * '' | 'tl' (top-left click) | 'br' (bottom-right) | 'refine' (drag to move).
   */
  uvAssignPhase: { type: String, default: "" },
  /** When set (editing a sub-object), hover+drag that content’s instances on the root surface. */
  surfaceDragContentGuid: { type: String, default: null },
  children: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "place-hover",
  "place-commit",
  "place-cancel",
  "uv-assign-click",
  "uv-assign-drag",
  "uv-assign-drag-end",
  "uv-assign-done",
  "uv-assign-cancel",
  "surface-drag",
  "surface-drag-end",
  "select-child",
]);

const canvasRef = ref(null);
const wrapRef = ref(null);
const backendLabel = ref("…");
const hoverHit = ref(null);
const hoverChildGuid = ref(null);
let session = null;
let draggingOrbit = false;
let downPos = null;
let surfaceDragging = false;
let dragGuid = null;
let blockHostOrbit = false;
let dragRaf = 0;
let pendingDragHit = null;
let uvDragging = false;

const uvAssignActive = computed(() => {
  const p = props.uvAssignPhase;
  return p === "tl" || p === "br" || p === "refine";
});

const surfacePickActive = computed(() => props.placeMode || uvAssignActive.value);

const surfaceDragActive = computed(
  () => !!props.surfaceDragContentGuid && !surfacePickActive.value,
);

const displayMesh = computed(() =>
  orientMeshToPlacementNormal(props.mesh, props.placementNormal),
);

const orientInv = computed(() => {
  const dir = placementNormalDirection3(props.placementNormal);
  // Display = R * authoring, so inv = R^T where R maps dir → +Y
  const R = rotationAligning(dir, { x: 0, y: 1, z: 0 });
  return transposeMat3(R);
});

const uvBanner = computed(() => {
  const p = props.uvAssignPhase;
  if (p === "tl") return "Eye texture · click TOP-LEFT corner on the mesh · Esc cancel · right-drag orbit";
  if (p === "br") return "Eye texture · click BOTTOM-RIGHT corner · Esc cancel · right-drag orbit";
  if (p === "refine") return "Eye texture · drag to reposition · Done / Esc to finish · right-drag orbit";
  return "";
});

function pushDisplay() {
  if (!session) return;
  if (displayMesh.value) session.setMesh(displayMesh.value);
}

function getView() {
  return session?.getView?.() || null;
}

function pickParts(sx, sy, parts) {
  const view = getView();
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

function pickRoot(sx, sy) {
  return pickParts(sx, sy, props.rootMesh?.parts);
}

function contentGuidForInstance(instanceGuid) {
  const ch = props.children.find((c) => c.instanceGuid === instanceGuid);
  return ch?.contentGuid || null;
}

function pickEditableChild(sx, sy) {
  if (!surfaceDragActive.value) return null;
  const hit = pickParts(sx, sy, props.mesh?.parts);
  if (!hit?.instanceGuid) return null;
  if (contentGuidForInstance(hit.instanceGuid) !== props.surfaceDragContentGuid) {
    return null;
  }
  return hit;
}

function syncCursor() {
  const el = canvasRef.value;
  if (!el) return;
  if (props.placeMode || props.uvAssignPhase === "tl" || props.uvAssignPhase === "br") {
    el.style.cursor = "copy";
  } else if (uvDragging || surfaceDragging) el.style.cursor = "grabbing";
  else if (props.uvAssignPhase === "refine") el.style.cursor = "grab";
  else if (hoverChildGuid.value) el.style.cursor = "grab";
  else el.style.cursor = "crosshair";
}

function flushSurfaceDrag() {
  dragRaf = 0;
  const hit = pendingDragHit;
  pendingDragHit = null;
  if (!hit) return;
  if (uvDragging) {
    emit("uv-assign-drag", hit);
    return;
  }
  if (!dragGuid) return;
  emit("surface-drag", {
    instanceGuid: dragGuid,
    point: hit.point,
    normal: hit.normal,
  });
}

function queueSurfaceDrag(hit) {
  pendingDragHit = hit;
  if (dragRaf) return;
  dragRaf = requestAnimationFrame(flushSurfaceDrag);
}

function onPointerDown(e) {
  if (surfacePickActive.value) {
    if (e.button === 2 || e.button === 1) {
      draggingOrbit = true;
      blockHostOrbit = false;
      session?.host?.pointerDown?.(e.offsetX, e.offsetY, e.button);
      return;
    }
    if (e.button !== 0) return;
    if (props.uvAssignPhase === "refine") {
      const hit = pickRoot(e.offsetX, e.offsetY);
      if (hit?.uv) {
        uvDragging = true;
        blockHostOrbit = true;
        session?.setAutoRotate?.(false);
        queueSurfaceDrag(hit);
        try {
          canvasRef.value?.setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        e.stopPropagation();
        syncCursor();
        return;
      }
    }
    downPos = { x: e.offsetX, y: e.offsetY };
    e.stopPropagation();
    return;
  }

  if (surfaceDragActive.value && e.button === 0) {
    const childHit = pickEditableChild(e.offsetX, e.offsetY);
    if (childHit?.instanceGuid) {
      surfaceDragging = true;
      dragGuid = childHit.instanceGuid;
      blockHostOrbit = true;
      hoverChildGuid.value = dragGuid;
      session?.setAutoRotate?.(false);
      emit("select-child", dragGuid);
      // Snap immediately if root is under the cursor
      const rootHit = pickRoot(e.offsetX, e.offsetY);
      if (rootHit) queueSurfaceDrag(rootHit);
      try {
        canvasRef.value?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      e.stopPropagation();
      syncCursor();
      return;
    }
  }
}

function onPointerMove(e) {
  if (surfacePickActive.value) {
    if (draggingOrbit) {
      session?.host?.pointerMove?.(e.offsetX, e.offsetY);
      return;
    }
    if (uvDragging) {
      const rootHit = pickRoot(e.offsetX, e.offsetY);
      if (rootHit) queueSurfaceDrag(rootHit);
      return;
    }
    const hit = pickRoot(e.offsetX, e.offsetY);
    hoverHit.value = hit;
    if (props.placeMode) emit("place-hover", hit);
    return;
  }

  if (surfaceDragging && dragGuid) {
    const rootHit = pickRoot(e.offsetX, e.offsetY);
    if (rootHit) queueSurfaceDrag(rootHit);
    return;
  }

  if (surfaceDragActive.value) {
    const childHit = pickEditableChild(e.offsetX, e.offsetY);
    hoverChildGuid.value = childHit?.instanceGuid || null;
    syncCursor();
  }
}

function onPointerUp(e) {
  if (uvDragging) {
    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      dragRaf = 0;
    }
    flushSurfaceDrag();
    uvDragging = false;
    blockHostOrbit = false;
    session?.setAutoRotate?.(!surfacePickActive.value);
    emit("uv-assign-drag-end");
    syncCursor();
    return;
  }

  if (surfacePickActive.value) {
    if (draggingOrbit) {
      session?.host?.pointerUp?.();
      draggingOrbit = false;
      return;
    }
    if (e.button !== 0 || !downPos) return;
    const dist = Math.hypot(e.offsetX - downPos.x, e.offsetY - downPos.y);
    downPos = null;
    if (dist > 6) return;
    const hit = pickRoot(e.offsetX, e.offsetY);
    if (!hit) return;
    if (props.placeMode) emit("place-commit", hit);
    else if (props.uvAssignPhase === "tl" || props.uvAssignPhase === "br") {
      emit("uv-assign-click", hit);
    }
    return;
  }

  if (surfaceDragging) {
    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      dragRaf = 0;
    }
    flushSurfaceDrag();
    surfaceDragging = false;
    dragGuid = null;
    blockHostOrbit = false;
    session?.setAutoRotate?.(!surfacePickActive.value);
    emit("surface-drag-end");
    syncCursor();
  }
}

function onKeyDown(e) {
  if (e.key !== "Escape") return;
  if (props.placeMode) emit("place-cancel");
  else if (uvAssignActive.value) emit("uv-assign-cancel");
}

function onContextMenu(e) {
  if (surfacePickActive.value || surfaceDragging || uvDragging) e.preventDefault();
}

function onPointerLeave() {
  if (surfaceDragging || uvDragging) return;
  hoverChildGuid.value = null;
  syncCursor();
}

onMounted(async () => {
  try {
    session = await createPreviewSession(canvasRef.value, 420, {
      placeModeGetter: () => surfacePickActive.value || blockHostOrbit,
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
  if (dragRaf) cancelAnimationFrame(dragRaf);
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
  () => [props.placeMode, props.uvAssignPhase],
  () => {
    session?.setAutoRotate?.(!surfacePickActive.value && !surfaceDragging && !uvDragging);
    hoverHit.value = null;
    hoverChildGuid.value = null;
    syncCursor();
  },
);

watch(
  () => props.surfaceDragContentGuid,
  () => {
    hoverChildGuid.value = null;
    if (surfaceDragging) {
      surfaceDragging = false;
      dragGuid = null;
      blockHostOrbit = false;
      emit("surface-drag-end");
    }
    syncCursor();
  },
);
</script>

<template>
  <div
    ref="wrapRef"
    class="preview"
    :class="{
      placing: placeMode,
      'uv-assign': uvAssignActive,
      'surface-drag': surfaceDragActive,
    }"
  >
    <header>
      <h2>3D preview</h2>
      <span>{{ backendLabel }}</span>
    </header>
    <div class="view-wrap">
      <canvas
        ref="canvasRef"
        class="view"
        :class="{
          place: placeMode || uvAssignPhase === 'tl' || uvAssignPhase === 'br',
          grab: !!hoverChildGuid || surfaceDragging || uvAssignPhase === 'refine',
        }"
        @pointerdown.capture="onPointerDown"
        @pointermove.capture="onPointerMove"
        @pointerup.capture="onPointerUp"
        @pointerleave="onPointerLeave"
        @contextmenu="onContextMenu"
      />
      <div v-if="placeMode" class="place-banner">
        Place on surface · hover (+) · click to attach · Esc cancel · right-drag orbit
      </div>
      <div v-else-if="uvAssignActive" class="place-banner uv">
        <span>{{ uvBanner }}</span>
        <button
          v-if="uvAssignPhase === 'refine'"
          type="button"
          class="done"
          @click.stop="emit('uv-assign-done')"
        >
          Done
        </button>
      </div>
      <div v-else-if="surfaceDragActive" class="place-banner drag">
        Sub edit · hover sub-object · drag along surface · right-drag orbit
      </div>
    </div>
    <p class="hint">
      <template v-if="placeMode">Aim at the root surface — sub-object aligns to the normal</template>
      <template v-else-if="uvAssignPhase === 'tl'">
        Click where the top-left of the eye pair should sit
      </template>
      <template v-else-if="uvAssignPhase === 'br'">
        Click the bottom-right corner to set size and position
      </template>
      <template v-else-if="uvAssignPhase === 'refine'">
        Drag on the surface to slide the eyes · open Assign again for scale / gap sliders
      </template>
      <template v-else-if="surfaceDragActive">
        Drag the sub-object on the root surface (follows normals)
      </template>
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
.preview.uv-assign {
  border-color: rgba(250, 204, 21, 0.5);
  box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.22);
}
.preview.surface-drag {
  border-color: rgba(52, 211, 153, 0.45);
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.2);
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
.view.grab {
  cursor: grab;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.place-banner.drag {
  color: #a7f3d0;
}
.place-banner.uv {
  color: #fde68a;
  pointer-events: none;
}
.place-banner .done {
  pointer-events: auto;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  border-radius: 6px;
  border: 1px solid rgba(250, 204, 21, 0.45);
  background: rgba(250, 204, 21, 0.18);
  color: #fef3c7;
  cursor: pointer;
}

.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
</style>
