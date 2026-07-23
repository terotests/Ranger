<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
// api used for assigning a library texture project onto the mesh without leaving Mesh mode
import SplineCanvas from "./components/SplineCanvas.vue";
import PointEditor from "./components/PointEditor.vue";
import Preview3D from "./components/Preview3D.vue";
import LibraryPanel from "./components/LibraryPanel.vue";
import ChildrenPanel from "./components/ChildrenPanel.vue";
import TextureLayerPanel from "./components/TextureLayerPanel.vue";
import TexturePreview from "./components/TexturePreview.vue";
import AssignTextureDialog from "./components/AssignTextureDialog.vue";
import TextureAnimPanel from "./components/TextureAnimPanel.vue";
import { useSplineEditor } from "./composables/useSplineEditor.js";
import { useTextureEditor } from "./composables/useTextureEditor.js";
import { useLibrary } from "./composables/useLibrary.js";
import { normalizeEyeUv } from "./lib/texture/eyeTexture.js";
import {
  morphBetweenTextures,
  normalizeEmotionTag,
  eyeTopologyKey,
  listCompatibleEmotionPeers,
} from "./lib/texture/eyeEmotion.js";
import * as api from "./library/api.js";

const {
  state,
  activeKnots,
  activeSegments,
  setViewMode,
  setToolMode,
  select,
  selectSegment,
  resetDefaults,
  resetSpine,
  resetPlacementNormal,
  updatePlacementNormal,
  removeKnot,
  removeSelected,
  updateKnot,
  updateSegment,
  applyMaterialToWhole,
  applyColorToSelection,
  sampleCurvePoints,
  findClosestOnCurve,
  insertKnotOnCurve,
  tessellate,
  applyProject: applyMeshProject,
  snapshotState: snapshotMeshState,
  attachFromProject,
  selectChild,
  editRoot,
  editChildContent,
  updateChildTransform,
  removeChild,
  centerChildOnAxis,
  toggleChildSymmetry,
  addSymmetricTwin,
  undo,
  redo,
  endGesture,
  isEditingChild,
  activePlacementNormal,
  setTextureAssetsProvider,
  assignEyeTextureToRootAsync,
  previewAssignedTextureMorph,
  clearAssignedTexture,
} = useSplineEditor();

const tex = useTextureEditor();
const texState = tex.state;
const texPath = tex.path;
const texLayers = tex.layers;
const texSelected = tex.selectedTexture;
const texPathClosed = tex.pathClosed;
const texClampX = tex.clampNonNegativeX;
const texShowMirror = tex.showMirror;
const texEyePair = tex.eyePair;
const texFlipX = tex.flipX;
const texCanvasToolMode = tex.canvasToolMode;

const workspace = ref("mesh"); // mesh | texture
const assignDialogOpen = ref(false);
const assignBusy = ref(false);
const assignProgress = ref("");
/** Square region mode on 3D preview (before texture dialog). */
const assignRegionMode = ref(false);
/** UV derived from the confirmed square (fed into the texture dialog). */
const assignRegionUv = ref(null);

/** Texture-editor emotion morph (peer texture + t). */
const texMorphTargetGuid = ref("");
const texMorphT = ref(0);

/** Mesh 3D atlas morph (peer texture + t) — bitmap hot-swap only. */
const meshMorphTargetGuid = ref("");
const meshMorphT = ref(0);
const meshMorphBusy = ref(false);
const preview3dRef = ref(null);
let meshMorphQueued = null;
let meshMorphRunning = false;

setTextureAssetsProvider(() => tex.snapshotTextures());

const loadedTextureList = computed(() => Object.values(texState.textures || {}));

/** Assigned eye texture for mesh anim panel. */
const assignedTexture = computed(() => {
  const guid = state.objectMaterial?.textureAsset;
  if (!guid) return null;
  return texState.textures[guid] || null;
});

const meshMorphPeers = computed(() =>
  listCompatibleEmotionPeers(loadedTextureList.value, assignedTexture.value),
);

/** Preview shows morph blend when a compatible peer is selected. */
const texPreviewTexture = computed(() => {
  const src = texSelected.value;
  if (!src) return null;
  const tgtGuid = texMorphTargetGuid.value;
  const t = texMorphT.value;
  if (!tgtGuid || t <= 0) return src;
  const tgt = texState.textures[tgtGuid];
  if (!tgt) return src;
  if (t >= 1) return tgt;
  return morphBetweenTextures(src, tgt, t) || src;
});

function snapshotState(kind) {
  const k = kind === "texture" ? "texture" : "mesh";
  return {
    ...snapshotMeshState({ includeMap: true }),
    textureAssets: tex.snapshotTextures(),
    projectKind: k,
  };
}

function applyProject(doc, kindHint) {
  const kind =
    kindHint === "texture" || kindHint === "mesh"
      ? kindHint
      : doc?.projectKind === "texture"
        ? "texture"
        : "mesh";
  workspace.value = kind;
  if (doc?.profile?.knots?.length >= 2) {
    applyMeshProject(doc);
  }
  tex.loadTextures(doc?.textureAssets || {});
}

if (!Object.keys(texState.textures).length) {
  tex.createEye("Eye");
}

const { lib, refresh, load, save, saveAs, remove, exportJson, importJsonFile } = useLibrary({
  snapshotState,
  applyProject,
  tessellate,
});

const loadedTextures = computed(() => Object.values(texState.textures || {}));
/** Saved texture-library entries only — mesh embeds must not appear in the picker. */
const libraryTextureProjects = computed(() =>
  (lib.projects || []).filter((p) => !p.error && p.projectKind === "texture"),
);

/** Orbit first, then place a square on the mesh, then pick a texture. */
function startAssignRegion() {
  placePending.value = null;
  assignDialogOpen.value = false;
  assignRegionUv.value = null;
  // Ensure rootMesh (+ UVs) exist for ray picks under the square.
  tessellate();
  assignRegionMode.value = true;
  state.status =
    "Assign — orbit the mesh, fit the yellow square over the eyes, then OK.";
}

function onAssignRegionCancel() {
  assignRegionMode.value = false;
  assignRegionUv.value = null;
  state.status = "Eye assign cancelled.";
}

async function onAssignRegionConfirm({ textureUv }) {
  assignRegionMode.value = false;
  assignRegionUv.value = textureUv || null;
  assignProgress.value = "";
  await refresh();
  assignDialogOpen.value = true;
  state.status = "Square placed — choose which eye texture to assign.";
}

function mergeAssignAssets(assets) {
  if (assets) tex.loadTextures({ ...tex.snapshotTextures(), ...assets });
}

async function onAssignApply({ guid, uv, assets }) {
  assignBusy.value = true;
  assignProgress.value = "Loading texture…";
  try {
    await new Promise((r) => setTimeout(r, 0));
    mergeAssignAssets(assets);
    const wantGuid = String(guid || "").trim();
    if (!wantGuid || !tex.snapshotTextures()[wantGuid]) {
      state.status = "Assign failed: texture asset not in editor after load.";
      return;
    }
    assignProgress.value = "Starting UV bake…";
    const ok = await assignEyeTextureToRootAsync(wantGuid, uv || assignRegionUv.value, {
      onProgress: (label) => {
        assignProgress.value = label;
      },
    });
    if (ok) {
      // Hard-verify persistence fields before closing the dialog.
      if (state.objectMaterial?.textureAsset !== wantGuid) {
        state.objectMaterial = {
          ...state.objectMaterial,
          texture: "asset",
          textureAsset: wantGuid,
          textureAssign: "eyePair",
          textureUv: normalizeEyeUv(uv || assignRegionUv.value || state.objectMaterial?.textureUv),
        };
      }
      if (!state.objectMaterial?.textureMap) {
        state.status = "Assign warning: UV atlas bake missing from material — re-assign if eyes look wrong.";
      }
      assignDialogOpen.value = false;
      assignRegionUv.value = null;
      state.status = `Eye texture assigned (${wantGuid.slice(0, 8)}…).`;
      tessellate();
    }
  } catch (err) {
    state.status = "Assign failed: " + (err.message || err);
  } finally {
    assignBusy.value = false;
    assignProgress.value = "";
  }
}

function onClearAssignedTexture() {
  assignRegionMode.value = false;
  assignRegionUv.value = null;
  clearAssignedTexture();
  tessellate();
}

function onTexEmotion(tag) {
  const live = texSelected.value;
  if (!live) return;
  live.emotion = normalizeEmotionTag(tag);
  live.topologyKey = eyeTopologyKey(live);
  texState.status = `Emotion “${live.emotion}” on “${live.name}”.`;
}

async function runMeshAtlasMorph(opts) {
  const toGuid = opts.targetGuid || meshMorphTargetGuid.value;
  if (!toGuid) return;
  meshMorphBusy.value = true;
  try {
    const res = await previewAssignedTextureMorph({
      toGuid,
      t: opts.t,
      width: opts.finalPass ? 384 : 256,
      height: opts.finalPass ? 384 : 256,
    });
    if (res?.ok && res.map) {
      preview3dRef.value?.updateAtlas(res.map.rgba, res.map.w, res.map.h);
    }
  } finally {
    meshMorphBusy.value = false;
  }
}

async function onMeshAtlasMorph(opts) {
  meshMorphQueued = opts;
  if (meshMorphRunning) return;
  meshMorphRunning = true;
  try {
    while (meshMorphQueued) {
      const next = meshMorphQueued;
      meshMorphQueued = null;
      await runMeshAtlasMorph(next);
    }
  } finally {
    meshMorphRunning = false;
  }
}

function onMeshMorphTarget(guid) {
  meshMorphTargetGuid.value = guid || "";
  meshMorphT.value = 0;
  if (guid) {
    onMeshAtlasMorph({ targetGuid: guid, t: 0, finalPass: true });
  }
}

function onMeshMorphT(t) {
  meshMorphT.value = t;
  onMeshAtlasMorph({
    targetGuid: meshMorphTargetGuid.value,
    t,
    finalPass: false,
  });
}

const materials = [
  { id: 0, label: "Wire" },
  { id: 1, label: "Flat" },
  { id: 2, label: "Smooth" },
  { id: 3, label: "Glossy" },
  { id: 4, label: "Reflective" },
];

const tools = [
  { id: "edit", label: "Edit" },
  { id: "add", label: "Add" },
  { id: "color", label: "Coloring" },
];

const views = [
  { id: "profile", label: "Profile" },
  { id: "orbit", label: "Orbit" },
  { id: "spine", label: "Spine" },
];

const spinePlaneLabel = computed(() =>
  state.spineSource === "orbit" ? "Orbit plane (Z)" : "Profile plane (X)",
);

function onResetSpine() {
  resetSpine("active");
  tessellate();
}

function onResetSpineBoth() {
  resetSpine("both");
  tessellate();
}

function onResetPlacementNormal() {
  resetPlacementNormal();
}

function onUpdatePlacementNormal(patch) {
  updatePlacementNormal(patch);
}

function onNormalNum(which, axis, ev) {
  const v = Number(ev.target.value);
  if (!Number.isFinite(v)) return;
  if (which === "start") {
    updatePlacementNormal({ start: { [axis]: v } });
  } else {
    updatePlacementNormal({ end: { [axis]: v } });
  }
  endGesture();
}

const knots = computed(() => activeKnots());
const segments = computed(() => activeSegments());
const placementNormal = computed(() => activePlacementNormal());
const editingLabel = computed(() =>
  isEditingChild()
    ? state.embeddedAssets[state.editTarget]?.name || "sub-object"
    : "root",
);

function onTessellate() {
  tessellate();
}

function onAddOnCurve(x, y) {
  if (insertKnotOnCurve(x, y)) tessellate();
}

function onRemoveKnot(id) {
  removeKnot(id);
  tessellate();
}

function onUpdateKnot(id, patch) {
  updateKnot(id, patch);
  if (patch && patch.color != null) tessellate();
}

function onUpdateSegment(index, patch) {
  updateSegment(index, patch);
  tessellate();
}

function onDragEnd() {
  endGesture();
  tessellate();
}

function onListCommit() {
  endGesture();
  tessellate();
}

function onSelect(id, opts) {
  select(id, opts || {});
}

function onBulkWhole() {
  applyMaterialToWhole({
    color: state.bulkColor,
    roughness: state.objectMaterial.roughness,
    metalness: state.objectMaterial.metalness,
    opacity: state.objectMaterial.opacity,
    texture: state.objectMaterial.texture,
  });
  tessellate();
}

function onBulkSelection() {
  applyColorToSelection(state.bulkColor);
  tessellate();
}

function onMoveChild(guid, patch) {
  updateChildTransform(guid, patch);
}

function onUndo() {
  if (undo()) tessellate();
}

function onRedo() {
  if (redo()) tessellate();
}

function onKeyDown(e) {
  if (isEditableTarget(e.target)) return;
  const mod = e.metaKey || e.ctrlKey;
  if (!mod) return;
  const key = e.key.toLowerCase();
  if (key === "z" && !e.shiftKey) {
    e.preventDefault();
    if (workspace.value === "texture") tex.undo();
    else onUndo();
  } else if ((key === "z" && e.shiftKey) || key === "y") {
    e.preventDefault();
    if (workspace.value === "texture") tex.redo();
    else onRedo();
  }
}

function isEditableTarget(target) {
  if (!target || typeof target !== "object") return false;
  const el = /** @type {HTMLElement} */ (target);
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return !!el.closest?.("input, textarea, select, [contenteditable='true']");
}

const placePending = ref(null); // { slug, mode, symmetric, doc }

const placeLabel = computed(() => {
  if (!placePending.value) return "";
  const p = placePending.value;
  return `${p.doc?.name || p.slug} (${p.mode}${p.symmetric ? " ×2" : ""})`;
});

async function onBeginPlace({ slug, mode, symmetric }) {
  try {
    const doc = await api.loadProject(slug);
    assignRegionMode.value = false;
    placePending.value = { slug, mode, symmetric, doc };
    state.status = `Place mode — click the root surface in 3D to attach “${doc.name || slug}”.`;
    if (!state.rootMesh) tessellate();
  } catch (err) {
    state.status = "Attach failed: " + (err.message || err);
  }
}

function onCancelPlace() {
  placePending.value = null;
  state.status = "Place cancelled.";
}

function onPlaceCommit(hit) {
  const pending = placePending.value;
  if (!pending?.doc || !hit) return;
  attachFromProject(pending.doc, {
    mode: pending.mode,
    symmetric: pending.symmetric,
    transform: {
      surface: true,
      x: hit.point[0],
      y: hit.point[1],
      z: hit.point[2],
      nx: hit.normal[0],
      ny: hit.normal[1],
      nz: hit.normal[2],
      scale: 0.28,
      rotationYDeg: 0,
    },
  });
  placePending.value = null;
  tessellate();
}

const surfaceDragContentGuid = computed(() =>
  isEditingChild() ? state.editTarget : null,
);

function onSurfaceDrag({ instanceGuid, point, normal }) {
  if (!instanceGuid || !point || !normal) return;
  updateChildTransform(instanceGuid, {
    surface: true,
    x: point[0],
    y: point[1],
    z: point[2],
    nx: normal[0],
    ny: normal[1],
    nz: normal[2],
  });
  tessellate();
}

function onSurfaceDragEnd() {
  endGesture();
  tessellate();
}

onMounted(() => {
  tessellate();
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="brand">
        <p class="eyebrow">Ranger · gallery/game_engine/v2</p>
        <h1>Spline Mesh Editor</h1>
        <p class="lede">
          <template v-if="workspace === 'mesh'">
            Profile + orbit lathe with an optional curved
            <strong>spine</strong> centerline, bulk colouring, and sub-objects — editing
            <strong>{{ editingLabel }}</strong>.
          </template>
          <template v-else>
            <strong>Texture editor</strong> — procedural eye layers (params only, runtime
            raster). Shared Bezier path editor · iris/pupil clipped inside the eyeball.
          </template>
        </p>
      </div>
      <div class="actions">
        <div class="tool-row sector">
          <button
            type="button"
            :class="{ active: workspace === 'mesh', primary: workspace === 'mesh' }"
            @click="workspace = 'mesh'"
          >
            Mesh
          </button>
          <button
            type="button"
            :class="{ active: workspace === 'texture', primary: workspace === 'texture' }"
            @click="workspace = 'texture'"
          >
            Texture
          </button>
        </div>
        <div v-if="workspace === 'mesh'" class="tool-row">
          <button
            v-for="v in views"
            :key="v.id"
            :class="{ active: state.viewMode === v.id, primary: state.viewMode === v.id }"
            @click="setViewMode(v.id)"
          >
            {{ v.label }}
          </button>
        </div>
        <div v-else class="tool-row">
          <button type="button" class="primary" @click="tex.createEye()">New eye</button>
          <button
            type="button"
            :disabled="!texState.selectedGuid"
            @click="tex.removeSelectedTexture()"
          >
            Delete texture
          </button>
          <button
            type="button"
            :class="{ active: texEyePair.editSide === 'left', primary: texEyePair.editSide === 'left' }"
            title="Edit left eye"
            @click="tex.setEditSide('left')"
          >
            Left
          </button>
          <button
            type="button"
            :class="{ active: texEyePair.editSide === 'right', primary: texEyePair.editSide === 'right' }"
            title="Edit right eye"
            @click="tex.setEditSide('right')"
          >
            Right
          </button>
          <button
            type="button"
            :class="{ active: texEyePair.editSide === 'both', primary: texEyePair.editSide === 'both' }"
            title="Both eyes stay linked as mirrors"
            @click="tex.setEditSide('both')"
          >
            Both
          </button>
          <label
            class="tex-check"
            title="When linked, right eye is always a mirror of left"
          >
            <input
              type="checkbox"
              :checked="texEyePair.linked"
              @change="tex.setEyeLinked($event.target.checked)"
            />
            Linked mirrors
          </label>
          <button
            type="button"
            title="Copy active side to the other as a mirror image and link"
            :disabled="!texState.selectedGuid"
            @click="tex.resetToMirrorImage()"
          >
            Reset to mirror image
          </button>
          <label class="tex-check" title="Edit right half; left is mirrored (like mesh profile)">
            <input
              type="checkbox"
              :checked="texState.symmetry"
              @change="tex.setSymmetry($event.target.checked)"
            />
            Symmetry
          </label>
          <label
            class="tex-check"
            title="After moving a point, recompute Bezier handles for smooth joins"
          >
            <input
              type="checkbox"
              :checked="texState.autoSmooth"
              @change="tex.setAutoSmooth($event.target.checked)"
            />
            Auto smooth
          </label>
        </div>
        <p v-if="workspace === 'mesh' && state.viewMode === 'spine'" class="spine-hint">
          Editing {{ spinePlaneLabel }} · pick Profile/Orbit first to choose which bend
        </p>
        <div class="tool-row">
          <button
            v-for="t in tools"
            :key="t.id"
            :class="{
              active:
                workspace === 'mesh'
                  ? state.toolMode === t.id
                  : texState.layerMode === 'edit' && texPath.state.toolMode === t.id,
              primary:
                workspace === 'mesh'
                  ? state.toolMode === t.id
                  : texState.layerMode === 'edit' && texPath.state.toolMode === t.id,
            }"
            @click="
              workspace === 'mesh'
                ? setToolMode(t.id)
                : (tex.setLayerMode('edit'), texPath.setToolMode(t.id))
            "
          >
            {{ t.label }}
          </button>
        </div>
        <template v-if="workspace === 'mesh'">
          <button @click="resetDefaults">Reset</button>
          <button
            v-if="state.viewMode === 'spine'"
            type="button"
            title="Straighten the active spine plane"
            @click="onResetSpine"
          >
            Reset spine
          </button>
          <button
            v-if="state.viewMode === 'spine'"
            type="button"
            title="Straighten both spine planes"
            @click="onResetSpineBoth"
          >
            Reset both spines
          </button>
          <button @click="onUndo" :disabled="!state.history.canUndo" title="Ctrl+Z">Undo</button>
          <button @click="onRedo" :disabled="!state.history.canRedo" title="Ctrl+Shift+Z">
            Redo
          </button>
          <button @click="removeSelected" :disabled="!state.selectedId">Remove</button>
          <button class="primary" @click="onTessellate">Tessellate</button>
        </template>
        <template v-else>
          <button
            @click="tex.undo()"
            :disabled="!texState.history.canUndo"
            title="Ctrl+Z"
          >
            Undo
          </button>
          <button
            @click="tex.redo()"
            :disabled="!texState.history.canRedo"
            title="Ctrl+Shift+Z"
          >
            Redo
          </button>
          <button
            @click="
              () => {
                texPath.removeSelected();
                tex.pushPathToLayer();
              }
            "
            :disabled="!texPath.state.selectedId"
          >
            Remove
          </button>
        </template>
      </div>
    </header>

    <section v-if="workspace === 'mesh'" class="toolbar">
      <label class="field">
        Curve
        <select v-model.number="state.curveType">
          <option :value="0">Bezier (default)</option>
          <option :value="1">Catmull-Rom</option>
        </select>
      </label>
      <label class="field">
        Path segments
        <input v-model.number="state.pathSegments" type="number" min="2" max="64" />
      </label>
      <label class="field">
        Orbit samples N
        <input v-model.number="state.angularSteps" type="number" min="3" max="96" />
      </label>
      <label class="field">
        Tessellation
        <select v-model="state.tessellationMode" @change="onTessellate">
          <option value="rotation">Rotation (lathe)</option>
          <option value="torus">Torus (ring sweep)</option>
        </select>
      </label>
      <label class="field">
        Revolution
        <select v-model.number="state.revolutionDeg" @change="onTessellate">
          <option :value="360">360° closed</option>
          <option :value="180">180° (half orbit)</option>
        </select>
      </label>
      <label
        class="field check"
        :class="{ dim: state.viewMode === 'orbit' || state.viewMode === 'spine' }"
      >
        <input
          v-model="state.symmetry"
          type="checkbox"
          :disabled="state.viewMode === 'orbit' || state.viewMode === 'spine'"
        />
        Show mirror
      </label>
      <button
        type="button"
        class="primary"
        title="Place a square on the 3D preview, then choose an eye texture"
        @click="startAssignRegion"
      >
        Assign to mesh
      </button>
      <button
        type="button"
        :disabled="!state.objectMaterial?.textureAsset"
        title="Remove UV eye assignment"
        @click="onClearAssignedTexture"
      >
        Clear texture
      </button>
      <TextureAnimPanel
        v-if="assignedTexture"
        :texture="assignedTexture"
        :textures="loadedTextureList"
        :target-guid="meshMorphTargetGuid"
        :morph-t="meshMorphT"
        @update-emotion="
          (tag) => {
            if (assignedTexture) {
              assignedTexture.emotion = normalizeEmotionTag(tag);
              assignedTexture.topologyKey = eyeTopologyKey(assignedTexture);
            }
          }
        "
        @update:target-guid="onMeshMorphTarget"
        @update:morph-t="onMeshMorphT"
      />
      <p v-else-if="state.objectMaterial?.textureAsset" class="hint">
        Load the assigned eye in Texture to morph peers ({{ meshMorphPeers.length }} compatible).
      </p>
      <div class="mats">
        <span>Shading base</span>
        <div class="mat-row">
          <button
            v-for="m in materials"
            :key="m.id"
            :class="{ active: state.materialMode === m.id }"
            @click="state.materialMode = m.id"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
      <div class="bulk">
        <span>Bulk colour</span>
        <div class="bulk-row">
          <input v-model="state.bulkColor" type="color" />
          <button type="button" @click="onBulkWhole">Whole object</button>
          <button type="button" @click="onBulkSelection">Selection</button>
        </div>
      </div>
      <div class="normal-panel">
        <span>Placement normal</span>
        <div class="normal-row">
          <label>
            From
            <input
              type="number"
              step="0.05"
              :value="placementNormal.start.x"
              @change="onNormalNum('start', 'x', $event)"
            />
            <input
              type="number"
              step="0.05"
              :value="placementNormal.start.y"
              @change="onNormalNum('start', 'y', $event)"
            />
          </label>
          <label>
            To
            <input
              type="number"
              step="0.05"
              :value="placementNormal.end.x"
              @change="onNormalNum('end', 'x', $event)"
            />
            <input
              type="number"
              step="0.05"
              :value="placementNormal.end.y"
              @change="onNormalNum('end', 'y', $event)"
            />
          </label>
          <button type="button" title="Reset to (0,-1)→(0,1)" @click="onResetPlacementNormal">
            Reset ↑
          </button>
        </div>
      </div>
      <p class="status">
        {{ state.status }} · {{ state.stats.parts || 0 }} parts · {{ state.stats.verts }}v /
        {{ state.stats.tris }}t · GUID {{ state.assetGuid.slice(0, 8) }}…
      </p>
    </section>

    <main v-if="workspace === 'mesh'" class="workspace">
      <SplineCanvas
        :knots="knots"
        :segments="segments"
        :selected-id="state.selectedId"
        :selected-ids="state.selectedIds"
        :selected-segment-index="state.selectedSegmentIndex"
        :curve-type="state.curveType"
        :symmetry="state.symmetry"
        :tool-mode="state.toolMode"
        :view-mode="state.viewMode"
        :children="state.children"
        :selected-child-guid="state.selectedChildGuid"
        :edit-target="state.editTarget"
        :viewport="state.viewport"
        :placement-normal="placementNormal"
        :sample-curve-points="sampleCurvePoints"
        :find-closest-on-curve="findClosestOnCurve"
        @select="onSelect"
        @select-segment="selectSegment"
        @update-knot="onUpdateKnot"
        @update-placement-normal="onUpdatePlacementNormal"
        @add-on-curve="onAddOnCurve"
        @drag-end="onDragEnd"
        @select-child="selectChild"
        @move-child="onMoveChild"
      />
      <PointEditor
        :knots="knots"
        :segments="segments"
        :selected-id="state.selectedId"
        :selected-segment-index="state.selectedSegmentIndex"
        :curve-type="state.curveType"
        :tool-mode="state.toolMode"
        :view-mode="state.viewMode"
        @select="onSelect"
        @select-segment="selectSegment"
        @update-knot="onUpdateKnot"
        @update-segment="onUpdateSegment"
        @remove-knot="onRemoveKnot"
        @commit="onListCommit"
      />
      <div class="side-stack">
        <Preview3D
          ref="preview3dRef"
          :mesh="state.mesh"
          :root-mesh="state.rootMesh"
          :material-mode="state.materialMode"
          :placement-normal="state.placementNormal"
          :place-mode="!!placePending"
          :region-mode="assignRegionMode"
          :surface-drag-content-guid="surfaceDragContentGuid"
          :children="state.children"
          @place-commit="onPlaceCommit"
          @place-cancel="onCancelPlace"
          @region-confirm="onAssignRegionConfirm"
          @region-cancel="onAssignRegionCancel"
          @surface-drag="onSurfaceDrag"
          @surface-drag-end="onSurfaceDragEnd"
          @select-child="selectChild"
        />
        <ChildrenPanel
          :children="state.children"
          :embedded-assets="state.embeddedAssets"
          :selected-child-guid="state.selectedChildGuid"
          :edit-target="state.editTarget"
          :projects="(lib.projects || []).filter((p) => !p.error && p.projectKind !== 'texture')"
          :asset-guid="state.assetGuid"
          :place-mode="!!placePending"
          :place-label="placeLabel"
          @select-child="selectChild"
          @edit-child="
            (g) => {
              editChildContent(g);
              tessellate();
            }
          "
          @edit-root="
            () => {
              editRoot();
              tessellate();
            }
          "
          @update-transform="updateChildTransform"
          @remove-child="
            (g) => {
              removeChild(g);
              tessellate();
            }
          "
          @center="
            (g) => {
              centerChildOnAxis(g);
              tessellate();
            }
          "
          @toggle-symmetry="
            (g) => {
              toggleChildSymmetry(g);
              tessellate();
            }
          "
          @add-twin="
            (g) => {
              addSymmetricTwin(g);
              tessellate();
            }
          "
          @begin-place="onBeginPlace"
          @cancel-place="onCancelPlace"
          @tessellate="onTessellate"
        />
      </div>
      <LibraryPanel
        :lib="lib"
        project-kind="mesh"
        :save-disabled="assignBusy"
        @refresh="refresh"
        @load="(slug) => load(slug, 'mesh')"
        @save="() => !assignBusy && save('mesh')"
        @save-as="(name) => !assignBusy && saveAs(name, 'mesh')"
        @remove="(slug) => remove(slug, 'mesh')"
        @export="(name) => exportJson(name, 'mesh')"
        @import-file="(file) => importJsonFile(file, 'mesh')"
      />
    </main>

    <main v-else class="workspace texture-workspace">
      <div class="tex-canvas-col">
        <SplineCanvas
          :knots="texPath.state.knots"
          :segments="texPath.state.segments"
          :selected-id="texPath.state.selectedId"
          :selected-ids="texPath.state.selectedIds"
          :selected-segment-index="texPath.state.selectedSegmentIndex"
          :curve-type="texPath.state.curveType"
          :symmetry="texShowMirror"
          :tool-mode="texCanvasToolMode"
          :flip-x="texFlipX"
          view-mode="profile"
          :path-closed="texPathClosed"
          :show-unit-circle="false"
          :show-placement-normal-prop="false"
          :show-attachments-prop="false"
          :show-mirror="texShowMirror"
          :show-lathe-guides="false"
          :clamp-non-negative-x="texClampX"
          :children="[]"
          :viewport="texPath.state.viewport"
          :sample-curve-points="texPath.sampleCurvePoints"
          :find-closest-on-curve="texPath.findClosestOnCurve"
          @select="(id, opts) => texPath.select(id, opts || {})"
          @select-segment="texPath.selectSegment"
          @update-knot="tex.onPathKnotUpdate"
          @add-on-curve="tex.onPathAdd"
          @translate-path="tex.onTranslatePath"
          @drag-end="tex.onPathDragEnd"
        />
        <p class="tex-canvas-hint">
          Few control points · Symmetry mirrors left · Add tool inserts knots · Auto smooth
          keeps joins continuous
        </p>
      </div>
      <TextureLayerPanel
        :layers="texLayers"
        :selected-layer-id="texState.selectedLayerId"
        :texture-kind="texSelected?.kind || 'eye'"
        :layer-mode="texState.layerMode"
        @select-layer="tex.selectLayer"
        @rename-layer="tex.renameLayer"
        @toggle-layer="tex.setLayerEnabled"
        @move-layer="tex.moveLayer"
        @add-layer="tex.addLayer"
        @remove-layer="tex.removeLayer"
        @set-color="tex.setLayerColor"
        @patch-layer="tex.patchLayer"
        @set-layer-mode="tex.setLayerMode"
        @restore-circle="tex.restoreLayerCircle"
      />
      <div class="side-stack">
        <TexturePreview
          :texture="texPreviewTexture"
          :pair="true"
          :edit-side="texEyePair.editSide"
          :distance="texEyePair.distance"
          @update-distance="tex.setInterEyeDistance"
        />
        <TextureAnimPanel
          :texture="texSelected"
          :textures="loadedTextureList"
          :target-guid="texMorphTargetGuid"
          :morph-t="texMorphT"
          @update-emotion="onTexEmotion"
          @update:target-guid="texMorphTargetGuid = $event"
          @update:morph-t="texMorphT = $event"
        />
        <section class="tex-list panel-ish">
          <h2>Textures</h2>
          <p class="hint">{{ texState.status }}</p>
          <ul>
            <li
              v-for="t in Object.values(texState.textures)"
              :key="t.assetGuid"
              :class="{ active: t.assetGuid === texState.selectedGuid }"
              @click="tex.selectTexture(t.assetGuid)"
            >
              {{ t.name }} · {{ t.emotion || "neutral" }}
            </li>
          </ul>
          <p v-if="!Object.keys(texState.textures).length" class="hint">
            Click <strong>New eye</strong> to start. Layers: eyeball, iris, pupil, shine,
            optional eyelid. Tag each eye with an emotion, then morph between compatible
            textures above.
          </p>
        </section>
      </div>
      <LibraryPanel
        :lib="lib"
        project-kind="texture"
        @refresh="refresh"
        @load="(slug) => load(slug, 'texture')"
        @save="() => save('texture')"
        @save-as="(name) => saveAs(name, 'texture')"
        @remove="(slug) => remove(slug, 'texture')"
        @export="(name) => exportJson(name, 'texture')"
        @import-file="(file) => importJsonFile(file, 'texture')"
      />
    </main>
    <AssignTextureDialog
      :open="assignDialogOpen"
      :loaded-textures="loadedTextures"
      :library-projects="libraryTextureProjects"
      :initial-uv="assignRegionUv || state.objectMaterial?.textureUv"
      :initial-guid="state.objectMaterial?.textureAsset || ''"
      :busy="assignBusy"
      :progress-label="assignProgress"
      @close="
        () => {
          if (!assignBusy) assignDialogOpen = false;
        }
      "
      @apply="onAssignApply"
    />
  </div>
</template>

<style scoped>
.shell {
  --pad: clamp(1rem, 2vw, 1.75rem);
  min-height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 1rem;
  padding: var(--pad);
}

.top {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: end;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

h1 {
  margin: 0.15rem 0 0.35rem;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
}

.lede {
  margin: 0;
  max-width: 42rem;
  color: var(--ink-dim);
  font-size: 0.95rem;
  line-height: 1.45;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tool-row {
  display: flex;
  gap: 0.35rem;
  margin-right: 0.35rem;
  padding: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.2);
}

.spine-hint {
  margin: 0;
  width: 100%;
  font-size: 0.72rem;
  color: var(--ink-dim);
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) 1.2fr 1fr;
  gap: 0.75rem;
  align-items: end;
  padding: 0.85rem 1rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.check {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-bottom: 0.35rem;
}
.check.dim {
  opacity: 0.45;
}

.mats span,
.bulk span {
  display: block;
  font-size: 0.78rem;
  color: var(--ink-dim);
  margin-bottom: 0.3rem;
}

.mat-row,
.bulk-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.bulk-row input[type="color"] {
  width: 2rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  background: transparent;
}

.normal-panel {
  grid-column: span 2;
}

.normal-panel > span {
  display: block;
  font-size: 0.78rem;
  color: var(--ink-dim);
  margin-bottom: 0.3rem;
}

.normal-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: end;
}

.normal-row label {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.72rem;
  color: var(--ink-dim);
}

.normal-row input[type="number"] {
  width: 4.2rem;
  padding: 0.25rem 0.35rem;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  color: var(--ink);
}

.status {
  margin: 0;
  align-self: center;
  font-size: 0.78rem;
  color: var(--ink-dim);
  grid-column: 1 / -1;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(220px, 0.75fr) minmax(260px, 0.95fr) minmax(
      200px,
      0.7fr
    );
  gap: 1rem;
  min-height: 0;
  align-items: stretch;
}

/* Keep Bezier canvas from spilling over Layers checkboxes */
.texture-workspace {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 300px) minmax(0, 0.9fr) minmax(180px, 0.65fr);
}
.tex-canvas-col {
  min-width: 0;
  overflow: hidden;
  display: grid;
  gap: 0.45rem;
  align-content: start;
}
.tex-canvas-col :deep(.spline-wrap) {
  min-width: 0;
  width: 100%;
  overflow: hidden;
}
.tex-canvas-col :deep(.spline-canvas) {
  width: 100%;
  max-width: min(100%, 480px);
  justify-self: center;
}
.tex-canvas-hint {
  margin: 0;
  font-size: 0.7rem;
  color: var(--ink-dim);
  text-align: center;
}
.tex-check {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--ink-dim);
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}
.tex-check input {
  margin: 0;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.tex-list {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.85rem;
}
.tex-list h2 {
  margin: 0 0 0.4rem;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 400;
}
.tex-list .hint {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.tex-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}
.tex-list li {
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.85rem;
}
.tex-list li.active {
  border-color: rgba(126, 207, 106, 0.45);
  background: rgba(126, 207, 106, 0.08);
}
.tool-row.sector {
  padding: 0.15rem;
  border-radius: 10px;
  border: 1px solid var(--line);
}

@media (max-width: 1200px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
}
</style>
