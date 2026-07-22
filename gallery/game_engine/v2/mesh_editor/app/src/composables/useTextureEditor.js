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
    status: "Texture editor — params only (rasterized at runtime).",
  });

  const path = usePathEditor({
    closed: true,
    // Canvas clamps via SplineCanvas prop; eyelid must allow signed X.
    clampNonNegativeX: false,
    viewport: { min: -1.2, max: 1.2 },
  });

  const selectedTexture = computed(() =>
    state.selectedGuid ? state.textures[state.selectedGuid] || null : null,
  );

  const selectedLayer = computed(() => {
    const tex = selectedTexture.value;
    if (!tex || !state.selectedLayerId) return null;
    return tex.layers.find((L) => L.id === state.selectedLayerId) || null;
  });

  const layers = computed(() => selectedTexture.value?.layers || []);

  function layerWantsSymmetry(layer) {
    return state.symmetry && layer && layer.type !== "eyelid" && layer.closed !== false;
  }

  function syncPathFromLayer() {
    const layer = selectedLayer.value;
    if (!layer) {
      path.loadPath([], [], { closed: true });
      path.state.closed = true;
      return;
    }
    const closed = layer.type !== "eyelid";
    path.loadPath(layer.knots, layer.segments, { closed });
  }

  function applyPathPolish({ movedPoint = false } = {}) {
    const closed = path.state.closed;
    if (movedPoint && state.autoSmooth) {
      autoSmoothHandles(path.state.knots, { closed });
    }
    if (layerWantsSymmetry(selectedLayer.value) && closed) {
      rebuildClosedYSymmetry(path.state.knots);
      if (state.autoSmooth) autoSmoothHandles(path.state.knots, { closed: true });
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
    constrainEyeLayer(tex, layer.id);
    // If constrain moved knots, reload path editor
    path.loadPath(layer.knots, layer.segments, { closed: layer.type !== "eyelid" });
  }

  watch(
    () => [state.selectedGuid, state.selectedLayerId],
    () => syncPathFromLayer(),
  );

  function createEye(name = "Eye") {
    const tex = createDefaultEyeTexture({ name });
    state.textures[tex.assetGuid] = tex;
    state.selectedGuid = tex.assetGuid;
    state.selectedLayerId = tex.layers[0]?.id || null;
    constrainAllEyeLayers(tex);
    syncPathFromLayer();
    state.status = `Created eye texture “${tex.name}”.`;
    return tex;
  }

  function selectTexture(guid) {
    state.selectedGuid = guid;
    const tex = state.textures[guid];
    state.selectedLayerId = tex?.layers?.[0]?.id || null;
    syncPathFromLayer();
  }

  function selectLayer(layerId) {
    state.selectedLayerId = layerId;
    syncPathFromLayer();
  }

  function renameLayer(layerId, name) {
    const tex = selectedTexture.value;
    const L = tex?.layers.find((x) => x.id === layerId);
    if (!L) return;
    L.name = String(name || L.type).trim() || L.type;
  }

  function setLayerEnabled(layerId, enabled) {
    const L = selectedTexture.value?.layers.find((x) => x.id === layerId);
    if (!L) return;
    L.enabled = !!enabled;
  }

  function setLayerColor(layerId, color) {
    const L = selectedTexture.value?.layers.find((x) => x.id === layerId);
    if (!L) return;
    L.color = color;
    for (const k of L.knots || []) k.color = color;
  }

  function moveLayer(layerId, dir) {
    const tex = selectedTexture.value;
    if (!tex) return;
    const i = tex.layers.findIndex((L) => L.id === layerId);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= tex.layers.length) return;
    const [row] = tex.layers.splice(i, 1);
    tex.layers.splice(j, 0, row);
  }

  function addLayer(type) {
    const tex = selectedTexture.value;
    if (!tex || tex.kind !== "eye") return null;
    if (!EYE_LAYER_TYPES.includes(type)) return null;
    // One of each core type preferred; allow extra eyelids
    if (type !== "eyelid" && tex.layers.some((L) => L.type === type)) {
      state.status = `Layer type “${type}” already exists — select it to edit.`;
      const existing = tex.layers.find((L) => L.type === type);
      if (existing) selectLayer(existing.id);
      return existing;
    }
    const layer = createEyeLayer(type);
    if (type === "eyelid") layer.enabled = true;
    // Insert eyelid near top; others after eyeball
    if (type === "eyelid") tex.layers.push(layer);
    else {
      const eyeballIdx = tex.layers.findIndex((L) => L.type === "eyeball");
      tex.layers.splice(eyeballIdx + 1, 0, layer);
    }
    constrainEyeLayer(tex, layer.id);
    selectLayer(layer.id);
    state.status = `Added “${layer.name}”.`;
    return layer;
  }

  function removeLayer(layerId) {
    const tex = selectedTexture.value;
    if (!tex) return;
    const L = tex.layers.find((x) => x.id === layerId);
    if (!L) return;
    if (L.type === "eyeball") {
      state.status = "Eyeball layer is required.";
      return;
    }
    tex.layers = tex.layers.filter((x) => x.id !== layerId);
    if (state.selectedLayerId === layerId) {
      state.selectedLayerId = tex.layers[0]?.id || null;
      syncPathFromLayer();
    }
  }

  function symmetryAxisX() {
    const knots = path.state.knots;
    if (!knots?.length) return 0;
    return pathCentroid(knots).x;
  }

  function onPathKnotUpdate(id, patch) {
    // With symmetry, keep edits on the right half relative to path centroid.
    if (layerWantsSymmetry(selectedLayer.value) && patch.x != null) {
      const ax = symmetryAxisX();
      patch = { ...patch, x: Math.max(ax, Number(patch.x) || 0) };
    }
    path.updateKnot(id, patch);
    const movedPoint = patch.x != null || patch.y != null;
    pushPathToLayer({ movedPoint });
  }

  function onPathDragEnd() {
    path.endGesture();
    pushPathToLayer({ movedPoint: true });
  }

  function onPathAdd(x, y) {
    const wx = layerWantsSymmetry(selectedLayer.value)
      ? Math.max(symmetryAxisX(), x)
      : x;
    if (path.insertKnotOnCurve(wx, y)) pushPathToLayer({ movedPoint: true });
  }

  function setSymmetry(on) {
    state.symmetry = !!on;
    if (state.symmetry && path.state.closed) {
      pushPathToLayer({ movedPoint: true });
    }
  }

  function setAutoSmooth(on) {
    state.autoSmooth = !!on;
    if (state.autoSmooth) pushPathToLayer({ movedPoint: true });
  }

  function removeSelectedTexture() {
    if (!state.selectedGuid) return;
    delete state.textures[state.selectedGuid];
    const keys = Object.keys(state.textures);
    state.selectedGuid = keys[0] || null;
    state.selectedLayerId = selectedTexture.value?.layers?.[0]?.id || null;
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
    state.selectedLayerId = selectedTexture.value?.layers?.[0]?.id || null;
    syncPathFromLayer();
  }

  /** Path editor presents as closed for non-eyelid layers. */
  const pathClosed = computed(() => selectedLayer.value?.type !== "eyelid");

  /**
   * Canvas clamp for symmetry: only force world x≥0 for eyeball (centred on 0).
   * Off-centre iris/pupil still get centroid-based rebuild after edits.
   */
  const clampNonNegativeX = computed(() => {
    const layer = selectedLayer.value;
    return layerWantsSymmetry(layer) && layer?.type === "eyeball";
  });

  // Real left knots are stored (rebuilt from the right); no ghost-mirror overlay.
  const showMirror = computed(() => false);

  return {
    state,
    path,
    selectedTexture,
    selectedLayer,
    layers,
    pathClosed,
    clampNonNegativeX,
    showMirror,
    createEye,
    selectTexture,
    selectLayer,
    renameLayer,
    setLayerEnabled,
    setLayerColor,
    moveLayer,
    addLayer,
    removeLayer,
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
  };
}
