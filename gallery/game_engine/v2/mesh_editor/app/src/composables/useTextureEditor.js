// ============================================================================
// useTextureEditor.js — texture asset library (params only) + eye layer editing.
// ============================================================================

import { reactive, computed, watch } from "vue";
import {
  createDefaultEyeTexture,
  createEyeLayer,
  normalizeEyeTexture,
  serializeEyeTexture,
  constrainEyeLayer,
  constrainAllEyeLayers,
  editableLayers,
  translateLayerTree,
  mirrorLayersX,
  resetEyePairToMirror,
  normalizeEyePair,
  restoreLayerToCircle,
  EYE_LAYER_TYPES,
} from "../lib/texture/eyeTexture.js";
import { usePathEditor } from "./usePathEditor.js";
import { newGuid } from "../lib/assetClone.js";
import {
  autoSmoothHandles,
  rebuildClosedYSymmetry,
  pathCentroid,
} from "../lib/pathModel.js";

export function useTextureEditor() {
  const state = reactive({
    textures: /** @type {Record<string, any>} */ ({}),
    selectedGuid: /** @type {string|null} */ (null),
    selectedLayerId: /** @type {string|null} */ (null),
    /** Y-mirror like mesh profile — edit right half (x ≥ 0). */
    symmetry: true,
    /** Recompute Bezier handles after moving a knot (smooth joins). */
    autoSmooth: true,
    /** Layer panel: edit knots/handles vs translate whole layer (+nest). */
    layerMode: "edit", // edit | move
    status: "Texture editor — params only (rasterized at runtime).",
    history: { canUndo: false, canRedo: false },
  });

  const path = usePathEditor({
    closed: true,
    clampNonNegativeX: false,
    viewport: { min: -1.2, max: 1.2 },
  });

  /** Whole-texture undo (layers + eyePair) — path-only history can't undo Move/nest. */
  let past = [];
  let future = [];
  let texGestureOpen = false;

  const selectedTexture = computed(() =>
    state.selectedGuid ? state.textures[state.selectedGuid] || null : null,
  );

  const layers = computed(() => editableLayers(selectedTexture.value));

  const selectedLayer = computed(() => {
    if (!state.selectedLayerId) return null;
    return layers.value.find((L) => L.id === state.selectedLayerId) || null;
  });

  const eyePair = computed(() => normalizeEyePair(selectedTexture.value?.eyePair));

  const flipX = computed(() => {
    const tex = selectedTexture.value;
    if (!tex) return false;
    const pair = normalizeEyePair(tex.eyePair);
    return pair.linked && pair.editSide === "right";
  });

  function refreshHistFlags() {
    state.history.canUndo = past.length > 0;
    state.history.canRedo = future.length > 0;
  }

  function cloneTexSnap(tex) {
    return {
      layers: JSON.parse(JSON.stringify(tex.layers || [])),
      rightLayers: tex.rightLayers ? JSON.parse(JSON.stringify(tex.rightLayers)) : null,
      eyePair: { ...normalizeEyePair(tex.eyePair) },
      selectedLayerId: state.selectedLayerId,
    };
  }

  function applyTexSnap(snap) {
    const tex = selectedTexture.value;
    if (!tex || !snap) return;
    tex.layers = snap.layers;
    tex.rightLayers = snap.rightLayers;
    tex.eyePair = { ...snap.eyePair };
    const list = editableLayers(tex);
    state.selectedLayerId =
      (snap.selectedLayerId && list.some((L) => L.id === snap.selectedLayerId)
        ? snap.selectedLayerId
        : null) ||
      list[0]?.id ||
      null;
    syncPathFromLayer({ soft: false });
    refreshHistFlags();
  }

  /** Snapshot current texture before a discrete edit (or first stroke of a gesture). */
  function pushTexHistory() {
    const tex = selectedTexture.value;
    if (!tex) return;
    past.push(cloneTexSnap(tex));
    if (past.length > 80) past.shift();
    future = [];
    refreshHistFlags();
  }

  function beginTexGesture() {
    if (texGestureOpen) return;
    pushTexHistory();
    texGestureOpen = true;
  }

  function endTexGesture() {
    texGestureOpen = false;
  }

  function undo() {
    const tex = selectedTexture.value;
    if (!tex || !past.length) return false;
    future.push(cloneTexSnap(tex));
    applyTexSnap(past.pop());
    texGestureOpen = false;
    path.endGesture();
    state.status = "Undo.";
    return true;
  }

  function redo() {
    const tex = selectedTexture.value;
    if (!tex || !future.length) return false;
    past.push(cloneTexSnap(tex));
    applyTexSnap(future.pop());
    texGestureOpen = false;
    path.endGesture();
    state.status = "Redo.";
    return true;
  }

  function clearTexHistory() {
    past = [];
    future = [];
    texGestureOpen = false;
    refreshHistFlags();
  }

  function ensureEyePair(tex) {
    if (!tex) return null;
    tex.eyePair = normalizeEyePair(tex.eyePair);
    return tex.eyePair;
  }

  function workingLayers() {
    return editableLayers(selectedTexture.value);
  }

  function workingTex() {
    const tex = selectedTexture.value;
    if (!tex) return null;
    return { layers: workingLayers() };
  }

  function layerWantsSymmetry(layer) {
    return state.symmetry && layer && layer.type !== "eyelid" && layer.closed !== false;
  }

  /**
   * @param {{ soft?: boolean }} [opts] soft=true: update knots without wiping path history
   *   (used mid Move-drag; texture history is the source of truth for Undo).
   */
  function syncPathFromLayer({ soft = false } = {}) {
    const layer = selectedLayer.value;
    if (!layer) {
      path.loadPath([], [], { closed: true });
      path.state.closed = true;
      return;
    }
    const closed = layer.type !== "eyelid";
    if (soft && path.state.knots.length === layer.knots.length && path.state.closed === closed) {
      path.applyKnotsFrom(layer.knots);
      path.state.segments = (layer.segments || []).map((s) => ({ ...s, textureData: null }));
      return;
    }
    path.loadPath(layer.knots, layer.segments, { closed, preserveSelection: soft });
  }

  function applyPathPolish({ movedPoint = false } = {}) {
    const closed = path.state.closed;
    if (movedPoint && state.autoSmooth) {
      autoSmoothHandles(path.state.knots, { closed });
    }
    if (layerWantsSymmetry(selectedLayer.value) && closed) {
      rebuildClosedYSymmetry(path.state.knots);
      if (movedPoint && state.autoSmooth) {
        autoSmoothHandles(path.state.knots, { closed: true });
      }
      path.syncSegments();
    }
  }

  function pushPathToLayer(opts = {}) {
    const tex = selectedTexture.value;
    const layer = selectedLayer.value;
    if (!tex || !layer) return;
    applyPathPolish(opts);
    layer.knots = path.state.knots.map((k) => ({ ...k }));
    layer.segments = path.state.segments.map((s) => ({ ...s }));
    layer.color = layer.color || path.state.knots[0]?.color || layer.color;
    constrainEyeLayer(workingTex(), layer.id);
    path.applyKnotsFrom(layer.knots);
    layer.segments = path.state.segments.map((s) => ({ ...s }));
  }

  watch(
    () => [
      state.selectedGuid,
      state.selectedLayerId,
      selectedTexture.value?.eyePair?.editSide,
      selectedTexture.value?.eyePair?.linked,
    ],
    () => syncPathFromLayer(),
  );

  function createEye(name = "Eye") {
    const tex = createDefaultEyeTexture({ name });
    state.textures[tex.assetGuid] = tex;
    state.selectedGuid = tex.assetGuid;
    state.selectedLayerId = tex.layers[0]?.id || null;
    constrainAllEyeLayers(tex);
    clearTexHistory();
    syncPathFromLayer();
    state.status = `Created eye texture “${tex.name}”.`;
    return tex;
  }

  function selectTexture(guid) {
    state.selectedGuid = guid;
    const tex = state.textures[guid];
    state.selectedLayerId = editableLayers(tex)[0]?.id || null;
    clearTexHistory();
    syncPathFromLayer();
  }

  function selectLayer(layerId) {
    state.selectedLayerId = layerId;
    syncPathFromLayer();
  }

  function findWorkingLayer(layerId) {
    return workingLayers().find((x) => x.id === layerId) || null;
  }

  function renameLayer(layerId, name) {
    const L = findWorkingLayer(layerId);
    if (!L) return;
    pushTexHistory();
    L.name = String(name || L.type).trim() || L.type;
  }

  function setLayerEnabled(layerId, enabled) {
    const L = findWorkingLayer(layerId);
    if (!L) return;
    pushTexHistory();
    L.enabled = !!enabled;
  }

  function setLayerColor(layerId, color) {
    const L = findWorkingLayer(layerId);
    if (!L) return;
    pushTexHistory();
    L.color = color;
    for (const k of L.knots || []) k.color = color;
  }

  function patchLayer(layerId, patch) {
    const L = findWorkingLayer(layerId);
    if (!L || !patch || typeof patch !== "object") return;
    pushTexHistory();
    if (patch.color != null) {
      L.color = patch.color;
      for (const k of L.knots || []) k.color = patch.color;
    }
    if (patch.fillSide != null && L.type === "eyelid") {
      L.fillSide = patch.fillSide === "below" ? "below" : "above";
    }
    if (L.type === "eyelid") {
      if (patch.border != null) L.border = !!patch.border;
      if (patch.borderWidth != null) {
        const w = Number(patch.borderWidth);
        if (Number.isFinite(w)) L.borderWidth = Math.min(0.25, Math.max(0.005, w));
      }
      if (patch.borderColor != null) L.borderColor = String(patch.borderColor);
    }
  }

  function moveLayer(layerId, dir) {
    const list = workingLayers();
    const i = list.findIndex((L) => L.id === layerId);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    pushTexHistory();
    const [row] = list.splice(i, 1);
    list.splice(j, 0, row);
  }

  function addLayer(type) {
    const tex = selectedTexture.value;
    if (!tex || tex.kind !== "eye") return null;
    if (!EYE_LAYER_TYPES.includes(type)) return null;
    const list = workingLayers();
    if (type !== "eyelid" && list.some((L) => L.type === type)) {
      state.status = `Layer type “${type}” already exists — select it to edit.`;
      const existing = list.find((L) => L.type === type);
      if (existing) selectLayer(existing.id);
      return existing;
    }
    pushTexHistory();
    const layer = createEyeLayer(type);
    if (type === "eyelid") layer.enabled = true;
    if (type === "eyelid") list.push(layer);
    else {
      const eyeballIdx = list.findIndex((L) => L.type === "eyeball");
      list.splice(eyeballIdx + 1, 0, layer);
    }
    constrainEyeLayer(workingTex(), layer.id);
    selectLayer(layer.id);
    state.status = `Added “${layer.name}”.`;
    return layer;
  }

  function removeLayer(layerId) {
    const tex = selectedTexture.value;
    if (!tex) return;
    const list = workingLayers();
    const L = list.find((x) => x.id === layerId);
    if (!L) return;
    if (L.type === "eyeball") {
      state.status = "Eyeball layer is required.";
      return;
    }
    pushTexHistory();
    const next = list.filter((x) => x.id !== layerId);
    const pair = ensureEyePair(tex);
    if (pair.editSide === "right" && !pair.linked) tex.rightLayers = next;
    else tex.layers = next;
    if (state.selectedLayerId === layerId) {
      state.selectedLayerId = next[0]?.id || null;
      syncPathFromLayer();
    }
  }

  function restoreSelectedToCircle() {
    const layer = selectedLayer.value;
    if (!layer) return false;
    if (layer.type === "eyelid") {
      state.status = "Eyelid is an open curve — Restore to circle is for closed layers.";
      return false;
    }
    pushTexHistory();
    restoreLayerToCircle(layer, { keepCenter: true });
    constrainEyeLayer(workingTex(), layer.id);
    syncPathFromLayer();
    state.status = `Restored “${layer.name}” to a circle.`;
    return true;
  }

  function restoreLayerCircle(layerId) {
    const L = findWorkingLayer(layerId);
    if (!L) return false;
    if (L.type === "eyelid") return false;
    pushTexHistory();
    restoreLayerToCircle(L, { keepCenter: true });
    constrainEyeLayer(workingTex(), L.id);
    if (state.selectedLayerId === layerId) syncPathFromLayer();
    state.status = `Restored “${L.name}” to a circle.`;
    return true;
  }

  function setLayerMode(mode) {
    state.layerMode = mode === "move" ? "move" : "edit";
    if (state.layerMode === "move") path.setToolMode("move");
    else if (path.state.toolMode === "move") path.setToolMode("edit");
  }

  function translateSelectedLayer(dx, dy) {
    const layer = selectedLayer.value;
    if (!layer) return;
    translateLayerTree(workingLayers(), layer.id, dx, dy);
    syncPathFromLayer({ soft: true });
  }

  function onTranslatePath(dx, dy) {
    beginTexGesture();
    translateSelectedLayer(dx, dy);
  }

  function setEditSide(side) {
    const tex = selectedTexture.value;
    if (!tex) return;
    pushTexHistory();
    const pair = ensureEyePair(tex);
    if (side === "both") {
      pair.editSide = "both";
      pair.linked = true;
      tex.rightLayers = null;
    } else if (side === "left") {
      pair.editSide = "left";
    } else if (side === "right") {
      pair.editSide = "right";
      if (!pair.linked) {
        if (!Array.isArray(tex.rightLayers) || !tex.rightLayers.length) {
          tex.rightLayers = mirrorLayersX(tex.layers);
        }
      }
    }
    const prevType = selectedLayer.value?.type;
    const list = editableLayers(tex);
    state.selectedLayerId =
      (prevType && list.find((L) => L.type === prevType)?.id) || list[0]?.id || null;
    syncPathFromLayer();
    state.status =
      pair.editSide === "both"
        ? "Editing both eyes (linked mirrors)."
        : `Editing ${pair.editSide} eye${pair.linked ? " (linked mirror)" : ""}.`;
  }

  function setEyeLinked(linked) {
    const tex = selectedTexture.value;
    if (!tex) return;
    pushTexHistory();
    const pair = ensureEyePair(tex);
    if (linked) {
      resetEyePairToMirror(tex, "left");
      pair.editSide = pair.editSide === "right" ? "both" : pair.editSide;
      state.status = "Eyes linked — right is a mirror of left.";
    } else {
      pair.linked = false;
      if (pair.editSide === "both") pair.editSide = "left";
      tex.rightLayers = mirrorLayersX(tex.layers);
      state.status = "Eyes unlinked — left and right can differ.";
    }
    syncPathFromLayer();
  }

  function setInterEyeDistance(value) {
    const tex = selectedTexture.value;
    if (!tex) return;
    const pair = ensureEyePair(tex);
    const d = Number(value);
    const next = Number.isFinite(d) ? Math.min(1, Math.max(0, d)) : pair.distance;
    if (next === pair.distance) return;
    // Distance is preview-only layout — don't spam history on every slider tick
    pair.distance = next;
  }

  function resetToMirrorImage() {
    const tex = selectedTexture.value;
    if (!tex) return;
    pushTexHistory();
    const pair = ensureEyePair(tex);
    const source = pair.editSide === "right" ? "right" : "left";
    resetEyePairToMirror(tex, source);
    pair.editSide = "both";
    state.selectedLayerId = tex.layers[0]?.id || null;
    syncPathFromLayer();
    state.status = "Reset to mirror image — both eyes linked.";
  }

  function symmetryAxisX() {
    const knots = path.state.knots;
    if (!knots?.length) return 0;
    return pathCentroid(knots).x;
  }

  let gestureMovedPoint = false;

  function onPathKnotUpdate(id, patch) {
    beginTexGesture();
    if (layerWantsSymmetry(selectedLayer.value) && patch.x != null) {
      const ax = symmetryAxisX();
      patch = { ...patch, x: Math.max(ax, Number(patch.x) || 0) };
    }
    path.updateKnot(id, patch);
    const movedPoint = patch.x != null || patch.y != null;
    if (movedPoint) gestureMovedPoint = true;
    pushPathToLayer({ movedPoint });
  }

  function onPathDragEnd() {
    endTexGesture();
    path.endGesture();
    if (state.layerMode === "move") {
      gestureMovedPoint = false;
      return;
    }
    pushPathToLayer({ movedPoint: gestureMovedPoint });
    gestureMovedPoint = false;
  }

  function onPathAdd(x, y) {
    const wx = layerWantsSymmetry(selectedLayer.value)
      ? Math.max(symmetryAxisX(), x)
      : x;
    pushTexHistory();
    if (path.insertKnotOnCurve(wx, y)) pushPathToLayer({ movedPoint: true });
  }

  function setSymmetry(on) {
    state.symmetry = !!on;
    if (state.symmetry && path.state.closed) {
      beginTexGesture();
      pushPathToLayer({ movedPoint: true });
      endTexGesture();
    }
  }

  function setAutoSmooth(on) {
    state.autoSmooth = !!on;
    if (state.autoSmooth) {
      beginTexGesture();
      pushPathToLayer({ movedPoint: true });
      endTexGesture();
    }
  }

  function removeSelectedTexture() {
    if (!state.selectedGuid) return;
    delete state.textures[state.selectedGuid];
    const keys = Object.keys(state.textures);
    state.selectedGuid = keys[0] || null;
    state.selectedLayerId = editableLayers(selectedTexture.value)[0]?.id || null;
    clearTexHistory();
    syncPathFromLayer();
  }

  function snapshotTextures() {
    const out = {};
    for (const [guid, tex] of Object.entries(state.textures)) {
      out[guid] =
        tex.kind === "eye" ? serializeEyeTexture(tex) : { ...tex, assetGuid: guid };
    }
    return out;
  }

  function loadTextures(map) {
    state.textures = {};
    for (const [guid, raw] of Object.entries(map || {})) {
      const tex =
        raw?.kind === "eye" || !raw?.kind
          ? normalizeEyeTexture({ ...raw, assetGuid: raw.assetGuid || guid })
          : { ...raw, assetGuid: raw.assetGuid || guid || newGuid() };
      state.textures[tex.assetGuid] = tex;
    }
    const keys = Object.keys(state.textures);
    state.selectedGuid = keys[0] || null;
    state.selectedLayerId = editableLayers(selectedTexture.value)[0]?.id || null;
    clearTexHistory();
    syncPathFromLayer();
  }

  const pathClosed = computed(() => selectedLayer.value?.type !== "eyelid");

  const clampNonNegativeX = computed(() => {
    const layer = selectedLayer.value;
    return layerWantsSymmetry(layer) && layer?.type === "eyeball";
  });

  const showMirror = computed(() => false);

  const canvasToolMode = computed(() => {
    if (state.layerMode === "move") return "move";
    return path.state.toolMode;
  });

  return {
    state,
    path,
    selectedTexture,
    selectedLayer,
    layers,
    eyePair,
    flipX,
    canvasToolMode,
    pathClosed,
    clampNonNegativeX,
    showMirror,
    createEye,
    selectTexture,
    selectLayer,
    renameLayer,
    setLayerEnabled,
    setLayerColor,
    patchLayer,
    moveLayer,
    addLayer,
    removeLayer,
    restoreSelectedToCircle,
    restoreLayerCircle,
    setLayerMode,
    onTranslatePath,
    setEditSide,
    setEyeLinked,
    setInterEyeDistance,
    resetToMirrorImage,
    onPathKnotUpdate,
    onPathDragEnd,
    onPathAdd,
    setSymmetry,
    setAutoSmooth,
    removeSelectedTexture,
    snapshotTextures,
    loadTextures,
    pushPathToLayer,
    syncPathFromLayer,
    undo,
    redo,
  };
}
