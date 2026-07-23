<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed, reactive } from "vue";
import { createPreviewSession } from "../lib/rangerPreview.js";
import {
  orientMeshToPlacementNormal,
  placementNormalDirection3,
  rotationAligning,
} from "../lib/placementNormal.js";
import { pickRootSurface, transposeMat3 } from "../lib/meshPick.js";
import {
  DEFAULT_ASSIGN_REGION,
  clampAssignRegion,
  regionCorners,
  regionSamplePoints,
  eyeUvFromRegionSamples,
} from "../lib/assignRegion.js";
import { cubeSizeForView, makeSurfaceNormalCubePart } from "../lib/debugCube.js";

const props = defineProps({
  mesh: { type: Object, default: null },
  rootMesh: { type: Object, default: null },
  materialMode: { type: Number, default: 3 },
  placementNormal: {
    type: Object,
    default: () => ({ start: { x: 0, y: -1 }, end: { x: 0, y: 1 } }),
  },
  placeMode: { type: Boolean, default: false },
  /** Square region placement for eye UV assign (before texture dialog). */
  regionMode: { type: Boolean, default: false },
  /** When set (editing a sub-object), hover+drag that content’s instances on the root surface. */
  surfaceDragContentGuid: { type: String, default: null },
  children: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "place-hover",
  "place-commit",
  "place-cancel",
  "region-confirm",
  "region-cancel",
  "surface-drag",
  "surface-drag-end",
  "select-child",
]);

const canvasRef = ref(null);
const wrapRef = ref(null);
const backendLabel = ref("…");
const hoverHit = ref(null);
const hoverChildGuid = ref(null);
const region = reactive({ ...DEFAULT_ASSIGN_REGION });
const regionError = ref("");
let session = null;
let draggingOrbit = false;
let downPos = null;
let surfaceDragging = false;
let dragGuid = null;
let blockHostOrbit = false;
let dragRaf = 0;
let pendingDragHit = null;
/** @type {null | 'center' | 'tl' | 'tr' | 'bl' | 'br'} */
let regionDrag = null;

const surfacePickActive = computed(() => props.placeMode || props.regionMode);

const surfaceDragActive = computed(
  () => !!props.surfaceDragContentGuid && !surfacePickActive.value,
);

const displayMesh = computed(() =>
  orientMeshToPlacementNormal(props.mesh, props.placementNormal),
);

const orientInv = computed(() => {
  const dir = placementNormalDirection3(props.placementNormal);
  const R = rotationAligning(dir, { x: 0, y: 1, z: 0 });
  return transposeMat3(R);
});

const corners = computed(() => regionCorners(region));

const regionStyle = computed(() => {
  const c = corners.value;
  return {
    left: c.tl.x * 100 + "%",
    top: c.tl.y * 100 + "%",
    width: (c.br.x - c.tl.x) * 100 + "%",
    height: (c.br.y - c.tl.y) * 100 + "%",
  };
});

/** Blue corner markers from the latest region raycasts (display-space parts). */
let cornerMarkerParts = [];
let markerRaf = 0;

function pushDisplay() {
  if (!session) return;
  const base = displayMesh.value;
  if (!base) return;
  if (props.regionMode && cornerMarkerParts.length) {
    session.setMesh({ parts: [...(base.parts || []), ...cornerMarkerParts] });
  } else {
    session.setMesh(base);
  }
}

/**
 * Full surface hit at normalized overlay coords (for UV + corner markers).
 * Prefer display-space root parts so marker cubes share the pushed mesh space.
 */
function pickHitAtNorm(nx, ny) {
  const view = getView();
  if (!view) return null;
  const sx = nx * (view.width || 1);
  const sy = ny * (view.height || 1);
  const tilt = view.meshTilt;
  const yaw = view.meshAngle;
  const rootOnlyDisplay = (displayMesh.value?.parts || []).filter((p) => !p.instanceGuid);
  if (rootOnlyDisplay.length) {
    const hit = pickRootSurface(sx, sy, view, rootOnlyDisplay, tilt, yaw, null);
    if (hit) return hit;
  }
  const rootParts = props.rootMesh?.parts;
  if (rootParts?.length) {
    const hit = pickRootSurface(sx, sy, view, rootParts, tilt, yaw, orientInv.value);
    if (hit) return hit;
    return pickRootSurface(sx, sy, view, rootParts, tilt, yaw, null);
  }
  return null;
}

function refreshCornerMarkers() {
  if (!props.regionMode || !session) {
    cornerMarkerParts = [];
    return;
  }
  const view = getView();
  if (!view) {
    cornerMarkerParts = [];
    return;
  }
  const edge = cubeSizeForView(view, 0.02);
  const c = regionCorners(region);
  const pts = [c.tl, c.tr, c.br, c.bl];
  const parts = [];
  for (const p of pts) {
    const hit = pickHitAtNorm(p.x, p.y);
    if (!hit?.point || !hit?.normal) continue;
    parts.push(makeSurfaceNormalCubePart(hit.point, hit.normal, edge, 0x3b82f6));
  }
  cornerMarkerParts = parts;
  pushDisplay();
}

function scheduleCornerMarkers() {
  if (markerRaf) return;
  markerRaf = requestAnimationFrame(() => {
    markerRaf = 0;
    refreshCornerMarkers();
  });
}

function getView() {
  return session?.getView?.() || null;
}

/** CSS offset → canvas pixel coords (handles CSS-scaled canvas). */
function eventToCanvas(e) {
  const el = canvasRef.value;
  if (!el) return { sx: e.offsetX, sy: e.offsetY };
  const cw = el.clientWidth || 1;
  const ch = el.clientHeight || 1;
  return {
    sx: (e.offsetX / cw) * (el.width || cw),
    sy: (e.offsetY / ch) * (el.height || ch),
  };
}

function eventToNorm(e) {
  const el = canvasRef.value;
  if (!el) return { x: 0.5, y: 0.5 };
  const cw = el.clientWidth || 1;
  const ch = el.clientHeight || 1;
  return {
    x: Math.min(1, Math.max(0, e.offsetX / cw)),
    y: Math.min(1, Math.max(0, e.offsetY / ch)),
  };
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
  if (props.placeMode) el.style.cursor = "copy";
  else if (props.regionMode) el.style.cursor = regionDrag ? "grabbing" : "default";
  else if (surfaceDragging) el.style.cursor = "grabbing";
  else if (hoverChildGuid.value) el.style.cursor = "grab";
  else el.style.cursor = "crosshair";
}

function flushSurfaceDrag() {
  dragRaf = 0;
  const hit = pendingDragHit;
  pendingDragHit = null;
  if (!hit || !dragGuid) return;
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

function resetRegion() {
  Object.assign(region, clampAssignRegion(DEFAULT_ASSIGN_REGION));
  regionError.value = "";
  regionDrag = null;
  scheduleCornerMarkers();
}

function applyRegionDrag(nx, ny) {
  if (!regionDrag) return;
  if (regionDrag === "center") {
    Object.assign(region, clampAssignRegion({ cx: nx, cy: ny, half: region.half }));
  } else {
    const half = Math.max(Math.abs(nx - region.cx), Math.abs(ny - region.cy));
    Object.assign(region, clampAssignRegion({ cx: region.cx, cy: region.cy, half }));
  }
  scheduleCornerMarkers();
}

function hitOnRegionHandle(nx, ny) {
  const c = regionCorners(region);
  const pad = 0.035;
  const pts = [
    ["tl", c.tl],
    ["tr", c.tr],
    ["bl", c.bl],
    ["br", c.br],
    ["center", c.center],
  ];
  for (const [name, p] of pts) {
    if (Math.hypot(nx - p.x, ny - p.y) <= pad) return name;
  }
  // Inside square → move
  if (nx >= c.tl.x && nx <= c.br.x && ny >= c.tl.y && ny <= c.br.y) {
    return "center";
  }
  return null;
}

function clientToNorm(clientX, clientY) {
  const el = canvasRef.value;
  if (!el) return { x: 0.5, y: 0.5 };
  const rect = el.getBoundingClientRect();
  const w = rect.width || 1;
  const h = rect.height || 1;
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / w)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / h)),
  };
}

function endRegionDrag() {
  if (!regionDrag) return;
  regionDrag = null;
  blockHostOrbit = false;
  window.removeEventListener("pointermove", onRegionWindowMove);
  window.removeEventListener("pointerup", onRegionWindowUp);
  syncCursor();
}

function onRegionWindowMove(e) {
  if (!regionDrag) return;
  const n = clientToNorm(e.clientX, e.clientY);
  applyRegionDrag(n.x, n.y);
}

function onRegionWindowUp() {
  endRegionDrag();
}

function startRegionDrag(handle) {
  if (!handle) return;
  regionDrag = handle;
  blockHostOrbit = true;
  regionError.value = "";
  window.addEventListener("pointermove", onRegionWindowMove);
  window.addEventListener("pointerup", onRegionWindowUp);
  syncCursor();
}

function pickUvAtNorm(nx, ny) {
  return pickHitAtNorm(nx, ny)?.uv || null;
}

function confirmRegion() {
  regionError.value = "";
  if (!getView() || !canvasRef.value) {
    regionError.value = "Preview not ready.";
    return;
  }
  if (!props.rootMesh?.parts?.length && !displayMesh.value?.parts?.length) {
    regionError.value = "No mesh to pick — tessellate first.";
    return;
  }

  // Prefer the square center (face aimed at), then corners for scale/gap.
  const c = regionCorners(region);
  const centerHit = pickUvAtNorm(c.center.x, c.center.y);
  const cornerPts = [c.tl, c.tr, c.br, c.bl];
  let samples = [];
  for (const p of cornerPts) {
    const uv = pickUvAtNorm(p.x, p.y);
    if (uv) samples.push(uv);
  }
  if (centerHit) samples.unshift(centerHit);
  if (samples.length < 2) {
    samples = centerHit ? [centerHit] : [];
    for (const p of regionSamplePoints(region, 5)) {
      const uv = pickUvAtNorm(p.x, p.y);
      if (uv) samples.push(uv);
    }
  }

  const uniq = [];
  for (const uv of samples) {
    if (!uniq.some((u) => Math.hypot(u[0] - uv[0], u[1] - uv[1]) < 1e-4)) {
      uniq.push(uv);
    }
  }

  const textureUv = eyeUvFromRegionSamples(uniq, region, {
    centerHit: centerHit || undefined,
  });
  if (!textureUv) {
    regionError.value =
      "Could not hit the mesh under the square — orbit the face toward the camera, or shrink the square.";
    return;
  }
  emit("region-confirm", { textureUv, region: { ...clampAssignRegion(region) } });
}

function onPointerDown(e) {
  if (props.regionMode) {
    if (e.button === 2 || e.button === 1) {
      draggingOrbit = true;
      blockHostOrbit = false;
      session?.host?.pointerDown?.(e.offsetX, e.offsetY, e.button);
      return;
    }
    if (e.button !== 0) return;
    const n = eventToNorm(e);
    const handle = hitOnRegionHandle(n.x, n.y);
    if (handle) {
      startRegionDrag(handle);
      e.stopPropagation();
      return;
    }
    // Outside square: left-click does nothing (right-drag still orbits).
    e.stopPropagation();
    return;
  }

  if (props.placeMode) {
    if (e.button === 2 || e.button === 1) {
      draggingOrbit = true;
      blockHostOrbit = false;
      session?.host?.pointerDown?.(e.offsetX, e.offsetY, e.button);
      return;
    }
    if (e.button !== 0) return;
    downPos = { x: e.offsetX, y: e.offsetY };
    e.stopPropagation();
    return;
  }

  if (surfaceDragActive.value && e.button === 0) {
    const { sx, sy } = eventToCanvas(e);
    const childHit = pickEditableChild(sx, sy);
    if (childHit?.instanceGuid) {
      surfaceDragging = true;
      dragGuid = childHit.instanceGuid;
      blockHostOrbit = true;
      hoverChildGuid.value = dragGuid;
      session?.setAutoRotate?.(false);
      emit("select-child", dragGuid);
      const rootHit = pickRoot(sx, sy);
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
  if (props.regionMode) {
    if (draggingOrbit) {
      session?.host?.pointerMove?.(e.offsetX, e.offsetY);
      return;
    }
    return;
  }

  if (props.placeMode) {
    if (draggingOrbit) {
      session?.host?.pointerMove?.(e.offsetX, e.offsetY);
      return;
    }
    const { sx, sy } = eventToCanvas(e);
    const hit = pickRoot(sx, sy);
    hoverHit.value = hit;
    emit("place-hover", hit);
    return;
  }

  if (surfaceDragging && dragGuid) {
    const { sx, sy } = eventToCanvas(e);
    const rootHit = pickRoot(sx, sy);
    if (rootHit) queueSurfaceDrag(rootHit);
    return;
  }

  if (surfaceDragActive.value) {
    const { sx, sy } = eventToCanvas(e);
    const childHit = pickEditableChild(sx, sy);
    hoverChildGuid.value = childHit?.instanceGuid || null;
    syncCursor();
  }
}

function onPointerUp(e) {
  if (props.regionMode) {
    if (draggingOrbit) {
      session?.host?.pointerUp?.();
      draggingOrbit = false;
      scheduleCornerMarkers();
    }
    return;
  }

  if (props.placeMode) {
    if (draggingOrbit) {
      session?.host?.pointerUp?.();
      draggingOrbit = false;
      return;
    }
    if (e.button !== 0 || !downPos) return;
    const dist = Math.hypot(e.offsetX - downPos.x, e.offsetY - downPos.y);
    downPos = null;
    if (dist > 6) return;
    const { sx, sy } = eventToCanvas(e);
    const hit = pickRoot(sx, sy);
    if (hit) emit("place-commit", hit);
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
    session?.setAutoRotate?.(false);
    emit("surface-drag-end");
    syncCursor();
  }
}

function onKeyDown(e) {
  if (e.key !== "Escape") return;
  if (props.placeMode) emit("place-cancel");
  else if (props.regionMode) emit("region-cancel");
}

function onContextMenu(e) {
  if (surfacePickActive.value || surfaceDragging) e.preventDefault();
}

function onPointerLeave() {
  if (surfaceDragging || regionDrag) return;
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
    session.setAutoRotate?.(false);
  } catch (err) {
    backendLabel.value = "preview failed";
    console.error(err);
  }
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  endRegionDrag();
  if (dragRaf) cancelAnimationFrame(dragRaf);
  if (markerRaf) cancelAnimationFrame(markerRaf);
  session?.dispose();
  session = null;
});

// Identity-only: tessellate() replaces the mesh root. Deep watch would traverse
// every position/normal/uv/index/mapRgba element (seconds on large atlases).
watch(displayMesh, () => pushDisplay());

watch(
  () => props.materialMode,
  (mode) => {
    if (session) session.setMaterialMode(mode);
  },
);

watch(
  () => [props.placeMode, props.regionMode],
  () => {
    session?.setAutoRotate?.(false);
    hoverHit.value = null;
    hoverChildGuid.value = null;
    if (props.regionMode) {
      resetRegion();
      scheduleCornerMarkers();
    } else {
      cornerMarkerParts = [];
      pushDisplay();
    }
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

/** Hot-swap UV atlas pixels without rebuilding mesh geometry. */
function updateAtlas(rgba, w, h) {
  return !!session?.updateSharedMap?.(rgba, w, h);
}

defineExpose({ updateAtlas });
</script>

<template>
  <div
    ref="wrapRef"
    class="preview"
    :class="{
      placing: placeMode,
      'region-mode': regionMode,
      'surface-drag': surfaceDragActive,
    }"
  >
    <header>
      <h2>3D preview</h2>
      <span>{{ backendLabel }}</span>
    </header>
    <div class="view-wrap">
      <!-- Stack keeps the region overlay pixel-aligned with the canvas box. -->
      <div class="canvas-stack">
        <canvas
          ref="canvasRef"
          class="view"
          :class="{
            place: placeMode,
            grab: !!hoverChildGuid || surfaceDragging,
          }"
          @pointerdown.capture="onPointerDown"
          @pointermove.capture="onPointerMove"
          @pointerup.capture="onPointerUp"
          @pointerleave="onPointerLeave"
          @contextmenu="onContextMenu"
        />

        <div v-if="regionMode" class="region-layer" aria-hidden="true">
          <div class="region-box" :style="regionStyle">
            <button
              type="button"
              class="handle center"
              title="Drag to move"
              @pointerdown.stop.prevent="startRegionDrag('center')"
            />
            <button
              v-for="h in ['tl', 'tr', 'bl', 'br']"
              :key="h"
              type="button"
              class="handle corner"
              :class="h"
              title="Drag to resize"
              @pointerdown.stop.prevent="startRegionDrag(h)"
            />
          </div>
        </div>

        <div v-if="placeMode" class="place-banner">
          Place on surface · hover (+) · click to attach · Esc cancel · right-drag orbit
        </div>
        <div v-else-if="regionMode" class="place-banner region">
          <span>
            Fit the square · blue cubes = raycast corners · right-drag orbit · no autorotate
          </span>
          <button type="button" class="ban-btn" @click.stop="emit('region-cancel')">
            Cancel
          </button>
          <button type="button" class="ban-btn ok" @click.stop="confirmRegion">OK</button>
        </div>
        <div v-else-if="surfaceDragActive" class="place-banner drag">
          Sub edit · hover sub-object · drag along surface · right-drag orbit
        </div>
      </div>
    </div>
    <p v-if="regionError" class="err">{{ regionError }}</p>
    <p class="hint">
      <template v-if="placeMode">Aim at the root surface — sub-object aligns to the normal</template>
      <template v-else-if="regionMode">
        Orbit the mesh first if needed, then fit the square and press OK to choose a texture
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
.preview.region-mode {
  border-color: rgba(250, 204, 21, 0.55);
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
  justify-self: center;
  width: 100%;
  max-width: 420px;
}
.canvas-stack {
  position: relative;
  width: 100%;
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
  vertical-align: top;
}
.view.place {
  cursor: copy;
}
.view.grab {
  cursor: grab;
}

.region-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 12px;
  overflow: hidden;
}
.region-box {
  position: absolute;
  border: 1.5px solid rgba(250, 204, 21, 0.95);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    inset 0 0 0 999px rgba(250, 204, 21, 0.08);
  pointer-events: none;
}
.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1.5px solid #fde68a;
  background: rgba(15, 23, 42, 0.9);
  pointer-events: auto;
  cursor: grab;
  box-sizing: border-box;
}
.handle:active {
  cursor: grabbing;
}
.handle.center {
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: rgba(250, 204, 21, 0.85);
  border-color: #fff8c5;
}
.handle.corner {
  border-radius: 2px;
}
.handle.tl {
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}
.handle.tr {
  right: 0;
  top: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}
.handle.bl {
  left: 0;
  bottom: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}
.handle.br {
  right: 0;
  bottom: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
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
  gap: 0.45rem;
  flex-wrap: wrap;
}
.place-banner.drag {
  color: #a7f3d0;
}
.place-banner.region {
  color: #fde68a;
  pointer-events: none;
}
.place-banner .ban-btn {
  pointer-events: auto;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
  cursor: pointer;
}
.place-banner .ban-btn.ok {
  border-color: rgba(250, 204, 21, 0.55);
  background: rgba(250, 204, 21, 0.22);
  color: #fef3c7;
}

.hint,
.err {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.err {
  color: #f0a070;
}
</style>
