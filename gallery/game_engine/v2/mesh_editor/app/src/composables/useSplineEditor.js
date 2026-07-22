import { reactive, computed, watch } from "vue";
import { SplineLathe } from "../../../tessellate/spline_lathe.mjs";
import { tessellateBody } from "../lib/latheTessellate.js";
import { transformParts } from "../lib/meshTransform.js";
import { evalSpan as evalPathSpan } from "../lib/pathSample.js";
import { createEditHistory } from "../lib/editHistory.js";
import {
  newGuid,
  cloneBodyContent,
  defaultChildTransform,
} from "../lib/assetClone.js";
import { defaultSpineKnots, defaultSpineSegments } from "../lib/spineLathe.js";
import {
  defaultPlacementNormal,
  normalizePlacementNormal,
  placementNormalDirection3,
} from "../lib/placementNormal.js";
import { raycastMeshParts } from "../lib/meshPick.js";
import {
  defaultSegment,
  cloneSeg,
  syncOpenSegments as syncOpenSegmentsOn,
  syncClosedSegments as syncOrbitSegmentsOn,
} from "../lib/pathModel.js";

/** @typedef {{ id: string, x: number, y: number, hx: number, hy: number, color: string }} Knot */
/** @typedef {{ fromId: string, toId: string, color: string|null, roughness: number, metalness: number, opacity: number, texture: string, textureData: any, textureAsset?: string|null, pathType?: string, arcBulge?: number|null }} Segment */

function uid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

const DEFAULT_COLORS = ["#7ecf6a", "#6ec8ff", "#ffb454", "#e87ac8", "#c8e87a", "#ff7a6a"];

function defaultKnots() {
  return SplineLathe.defaultKnots().map((k, i) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));
}

function defaultOrbitKnots() {
  return SplineLathe.defaultOrbitKnots().map((k, i) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: DEFAULT_COLORS[(i + 2) % DEFAULT_COLORS.length],
  }));
}

function defaultObjectMaterial() {
  return { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" };
}

function projectDocToBody(doc, { newGuidForCopy = true } = {}) {
  return cloneBodyContent(
    {
      assetGuid: doc.assetGuid,
      name: doc.name,
      profile: doc.profile,
      orbit: doc.orbit,
      spineProfile: doc.spineProfile,
      spineOrbit: doc.spineOrbit,
      placementNormal: doc.placementNormal,
      editor: doc.editor,
      objectMaterial: doc.objectMaterial,
      knots: doc.profile?.knots,
      segments: doc.profile?.segments,
      orbitKnots: doc.orbit?.knots,
      orbitSegments: doc.orbit?.segments,
      spineProfileKnots: doc.spineProfile?.knots,
      spineProfileSegments: doc.spineProfile?.segments,
      spineOrbitKnots: doc.spineOrbit?.knots,
      spineOrbitSegments: doc.spineOrbit?.segments,
    },
    {
      preserveGuid: !newGuidForCopy && !!doc.assetGuid,
      name: doc.name || "Sub-object",
    },
  );
}

function mapSegSnapshot(s) {
  return {
    fromId: s.fromId,
    toId: s.toId,
    color: s.color,
    roughness: s.roughness,
    metalness: s.metalness,
    opacity: s.opacity,
    texture: s.texture,
    textureAsset: s.textureAsset || null,
    pathType: s.pathType || "bezier",
    arcBulge: s.arcBulge ?? null,
  };
}

function loadSpineBlock(block, fallbackKnots) {
  if (block?.knots?.length >= 2) {
    return {
      knots: block.knots.map((k) => ({ ...k })),
      segments: (block.segments || []).map((s) => ({
        ...s,
        textureData: null,
        textureAsset: s.textureAsset || null,
        pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
        arcBulge: s.arcBulge ?? null,
      })),
    };
  }
  const knots = fallbackKnots();
  return { knots, segments: defaultSpineSegments(knots) };
}

export function useSplineEditor() {
  const state = reactive({
    assetGuid: newGuid(),
    viewMode: "profile", // profile | orbit | spine
    spineSource: "profile", // which spine plane Spine view edits
    knots: defaultKnots(),
    segments: /** @type {Segment[]} */ ([]),
    orbitKnots: defaultOrbitKnots(),
    orbitSegments: /** @type {Segment[]} */ ([]),
    spineProfileKnots: defaultSpineKnots(),
    spineProfileSegments: /** @type {Segment[]} */ ([]),
    spineOrbitKnots: defaultSpineKnots(),
    spineOrbitSegments: /** @type {Segment[]} */ ([]),
    placementNormal: defaultPlacementNormal(),
    objectMaterial: defaultObjectMaterial(),
    selectedId: null,
    selectedIds: /** @type {string[]} */ ([]),
    selectedSegmentIndex: -1,
    toolMode: "edit",
    curveType: 0,
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360,
    tessellationMode: "rotation", // rotation | torus
    materialMode: 3,
    symmetry: true,
    viewport: { min: -1.1, max: 1.1 },
    /** @type {Record<string, any>} */
    embeddedAssets: {},
    /** @type {any[]} */
    children: [],
    selectedChildGuid: null,
    /** 'root' | contentGuid */
    editTarget: "root",
    bulkColor: "#7ecf6a",
    mesh: null,
    /** Root-only mesh parts for surface raycasting (no children). */
    rootMesh: null,
    stats: { verts: 0, tris: 0, profile: 0, parts: 0 },
    status: "Edit mode — drag points. Sub-objects attach in Profile view.",
    history: { canUndo: false, canRedo: false, past: 0, future: 0 },
  });

  const history = createEditHistory({ limit: 80 });

  function refreshHistoryFlags() {
    const info = history.info();
    state.history.canUndo = info.canUndo;
    state.history.canRedo = info.canRedo;
    state.history.past = info.past;
    state.history.future = info.future;
  }

  /** Shape-only snapshot for the undo buffer (immutable clone). */
  function snapshotShape() {
    return JSON.parse(
      JSON.stringify({
        editTarget: state.editTarget,
        viewMode: state.viewMode,
        spineSource: state.spineSource,
        knots: state.knots,
        segments: state.segments.map(mapSegSnapshot),
        orbitKnots: state.orbitKnots,
        orbitSegments: state.orbitSegments.map(mapSegSnapshot),
        spineProfileKnots: state.spineProfileKnots,
        spineProfileSegments: state.spineProfileSegments.map(mapSegSnapshot),
        spineOrbitKnots: state.spineOrbitKnots,
        spineOrbitSegments: state.spineOrbitSegments.map(mapSegSnapshot),
        placementNormal: normalizePlacementNormal(state.placementNormal),
        objectMaterial: state.objectMaterial,
        embeddedAssets: state.embeddedAssets,
        children: state.children,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds,
        selectedSegmentIndex: state.selectedSegmentIndex,
        selectedChildGuid: state.selectedChildGuid,
      }),
    );
  }

  function restoreShape(snap) {
    if (!snap) return;
    state.editTarget = snap.editTarget || "root";
    state.viewMode =
      snap.viewMode === "orbit" || snap.viewMode === "spine" ? snap.viewMode : "profile";
    state.spineSource = snap.spineSource === "orbit" ? "orbit" : "profile";
    state.knots = (snap.knots || []).map((k) => ({ ...k }));
    state.segments = (snap.segments || []).map((s) => ({ ...s, textureData: null }));
    state.orbitKnots = (snap.orbitKnots || []).map((k) => ({ ...k }));
    state.orbitSegments = (snap.orbitSegments || []).map((s) => ({ ...s, textureData: null }));
    const sp = loadSpineBlock(
      { knots: snap.spineProfileKnots, segments: snap.spineProfileSegments },
      defaultSpineKnots,
    );
    const so = loadSpineBlock(
      { knots: snap.spineOrbitKnots, segments: snap.spineOrbitSegments },
      defaultSpineKnots,
    );
    state.spineProfileKnots = sp.knots;
    state.spineProfileSegments = sp.segments;
    state.spineOrbitKnots = so.knots;
    state.spineOrbitSegments = so.segments;
    state.placementNormal = normalizePlacementNormal(snap.placementNormal);
    state.objectMaterial = { ...defaultObjectMaterial(), ...(snap.objectMaterial || {}) };
    state.embeddedAssets = {};
    for (const [guid, body] of Object.entries(snap.embeddedAssets || {})) {
      const bsp = loadSpineBlock(
        { knots: body.spineProfileKnots, segments: body.spineProfileSegments },
        defaultSpineKnots,
      );
      const bso = loadSpineBlock(
        { knots: body.spineOrbitKnots, segments: body.spineOrbitSegments },
        defaultSpineKnots,
      );
      state.embeddedAssets[guid] = {
        ...body,
        knots: (body.knots || []).map((k) => ({ ...k })),
        segments: (body.segments || []).map((s) => ({ ...s, textureData: null })),
        orbitKnots: (body.orbitKnots || []).map((k) => ({ ...k })),
        orbitSegments: (body.orbitSegments || []).map((s) => ({ ...s, textureData: null })),
        spineProfileKnots: bsp.knots,
        spineProfileSegments: bsp.segments,
        spineOrbitKnots: bso.knots,
        spineOrbitSegments: bso.segments,
        placementNormal: normalizePlacementNormal(body.placementNormal),
        objectMaterial: { ...defaultObjectMaterial(), ...(body.objectMaterial || {}) },
      };
    }
    state.children = (snap.children || []).map((c) => ({
      ...c,
      transform: { ...defaultChildTransform(), ...(c.transform || {}) },
    }));
    state.selectedId = snap.selectedId || null;
    state.selectedIds = snap.selectedIds || [];
    state.selectedSegmentIndex = snap.selectedSegmentIndex ?? -1;
    state.selectedChildGuid = snap.selectedChildGuid || null;
    syncSegments();
  }

  /** Push current shape onto the undo buffer before a mutating edit. */
  function commitToHistory(label = "") {
    history.push(snapshotShape(), label);
    refreshHistoryFlags();
  }

  function undo() {
    const prev = history.undo(snapshotShape());
    if (!prev) {
      state.status = "Nothing to undo.";
      return false;
    }
    restoreShape(prev);
    refreshHistoryFlags();
    state.status = `Undo (${state.history.past} left).`;
    return true;
  }

  function redo() {
    const next = history.redo(snapshotShape());
    if (!next) {
      state.status = "Nothing to redo.";
      return false;
    }
    restoreShape(next);
    refreshHistoryFlags();
    state.status = `Redo (${state.history.future} ahead).`;
    return true;
  }

  let gestureOpen = false;
  function beginGesture(label = "edit") {
    if (gestureOpen) return;
    commitToHistory(label);
    gestureOpen = true;
  }
  function endGesture() {
    if (!gestureOpen) return;
    gestureOpen = false;
    history.baseline(snapshotShape());
    refreshHistoryFlags();
  }

  function isOrbit() {
    return state.viewMode === "orbit";
  }

  function isSpine() {
    return state.viewMode === "spine";
  }

  function isEditingChild() {
    return state.editTarget !== "root" && !!state.embeddedAssets[state.editTarget];
  }

  function bodyRef() {
    if (isEditingChild()) return state.embeddedAssets[state.editTarget];
    return null;
  }

  function activeKnots() {
    const b = bodyRef();
    if (isSpine()) {
      if (b) {
        return state.spineSource === "orbit" ? b.spineOrbitKnots : b.spineProfileKnots;
      }
      return state.spineSource === "orbit" ? state.spineOrbitKnots : state.spineProfileKnots;
    }
    if (b) return isOrbit() ? b.orbitKnots : b.knots;
    return isOrbit() ? state.orbitKnots : state.knots;
  }

  function activeSegments() {
    const b = bodyRef();
    if (isSpine()) {
      if (b) {
        return state.spineSource === "orbit" ? b.spineOrbitSegments : b.spineProfileSegments;
      }
      return state.spineSource === "orbit"
        ? state.spineOrbitSegments
        : state.spineProfileSegments;
    }
    if (b) return isOrbit() ? b.orbitSegments : b.segments;
    return isOrbit() ? state.orbitSegments : state.segments;
  }

  function activeObjectMaterial() {
    const b = bodyRef();
    return b ? b.objectMaterial : state.objectMaterial;
  }

  function activeCurveType() {
    const b = bodyRef();
    return b ? b.curveType : state.curveType;
  }

  function setActiveCurveType(v) {
    const b = bodyRef();
    if (b) b.curveType = v;
    else state.curveType = v;
  }

  function syncSegments() {
    const b = bodyRef();
    if (b) {
      b.segments = syncOpenSegmentsOn(b.knots, b.segments || []);
      b.orbitSegments = syncOrbitSegmentsOn(b.orbitKnots, b.orbitSegments || []);
      if (!b.spineProfileKnots?.length) {
        b.spineProfileKnots = defaultSpineKnots();
        b.spineProfileSegments = defaultSpineSegments(b.spineProfileKnots);
      } else {
        b.spineProfileSegments = syncOpenSegmentsOn(
          b.spineProfileKnots,
          b.spineProfileSegments || [],
          "line",
        );
      }
      if (!b.spineOrbitKnots?.length) {
        b.spineOrbitKnots = defaultSpineKnots();
        b.spineOrbitSegments = defaultSpineSegments(b.spineOrbitKnots);
      } else {
        b.spineOrbitSegments = syncOpenSegmentsOn(
          b.spineOrbitKnots,
          b.spineOrbitSegments || [],
          "line",
        );
      }
    } else {
      state.segments = syncOpenSegmentsOn(state.knots, state.segments);
      state.orbitSegments = syncOrbitSegmentsOn(state.orbitKnots, state.orbitSegments);
      if (!state.spineProfileSegments.length) {
        state.spineProfileSegments = defaultSpineSegments(state.spineProfileKnots);
      } else {
        state.spineProfileSegments = syncOpenSegmentsOn(
          state.spineProfileKnots,
          state.spineProfileSegments,
          "line",
        );
      }
      if (!state.spineOrbitSegments.length) {
        state.spineOrbitSegments = defaultSpineSegments(state.spineOrbitKnots);
      } else {
        state.spineOrbitSegments = syncOpenSegmentsOn(
          state.spineOrbitKnots,
          state.spineOrbitSegments,
          "line",
        );
      }
    }
    const segs = activeSegments();
    if (state.selectedSegmentIndex >= segs.length) state.selectedSegmentIndex = segs.length - 1;
  }

  syncSegments();

  const selected = computed(() => activeKnots().find((k) => k.id === state.selectedId) || null);
  const selectedSegment = computed(() =>
    state.selectedSegmentIndex >= 0 ? activeSegments()[state.selectedSegmentIndex] || null : null,
  );

  function setViewMode(mode) {
    if (mode === "orbit") {
      state.spineSource = "orbit";
      state.viewMode = "orbit";
    } else if (mode === "spine") {
      state.viewMode = "spine";
    } else {
      state.spineSource = "profile";
      state.viewMode = "profile";
    }
    state.selectedId = null;
    state.selectedIds = [];
    state.selectedSegmentIndex = -1;
    state.selectedId = activeKnots()[0]?.id || null;
    if (state.viewMode === "spine") {
      state.status = `Spine (${state.spineSource}) — bend the tessellation centerline. Does not change Profile/Orbit editors.`;
    } else if (state.viewMode === "orbit") {
      state.status = "Orbit view — closed Bezier path replaces cos/sin.";
    } else {
      state.status = "Profile view — attach sub-objects here (boxes on the silhouette).";
    }
  }

  function resetSpine(which = "active") {
    commitToHistory("reset-spine");
    const body = bodyRef();
    const resetOne = (target) => {
      const knots = defaultSpineKnots();
      const segs = defaultSpineSegments(knots);
      if (body) {
        if (target === "profile") {
          body.spineProfileKnots = knots;
          body.spineProfileSegments = segs;
        } else {
          body.spineOrbitKnots = knots;
          body.spineOrbitSegments = segs;
        }
      } else if (target === "profile") {
        state.spineProfileKnots = knots;
        state.spineProfileSegments = segs;
      } else {
        state.spineOrbitKnots = knots;
        state.spineOrbitSegments = segs;
      }
    };
    if (which === "both") {
      resetOne("profile");
      resetOne("orbit");
    } else {
      resetOne(state.spineSource === "orbit" ? "orbit" : "profile");
    }
    state.selectedId = activeKnots()[0]?.id || null;
    state.selectedIds = [];
    state.selectedSegmentIndex = -1;
    state.status = `Spine (${state.spineSource}) reset to a straight vertical centerline.`;
  }

  function setToolMode(mode) {
    state.toolMode = mode;
    if (mode === "edit") state.status = "Edit mode — drag knots and Bezier handles.";
    if (mode === "add") state.status = "Add mode — click the curve to insert a knot.";
    if (mode === "color") {
      state.status = "Coloring — click points (Shift = multi-select). Use bulk apply for all / selection.";
    }
  }

  function select(id, { additive = false } = {}) {
    state.selectedSegmentIndex = -1;
    if (additive && state.toolMode === "color") {
      const set = new Set(state.selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.selectedIds = [...set];
      state.selectedId = id;
    } else {
      state.selectedId = id;
      state.selectedIds = id ? [id] : [];
    }
  }

  function selectSegment(index) {
    state.selectedSegmentIndex = index;
    state.selectedId = null;
    state.selectedIds = [];
  }

  function resetDefaults() {
    commitToHistory("reset");
    state.assetGuid = newGuid();
    state.knots = defaultKnots();
    state.segments = [];
    state.orbitKnots = defaultOrbitKnots();
    state.orbitSegments = [];
    state.spineProfileKnots = defaultSpineKnots();
    state.spineProfileSegments = [];
    state.spineOrbitKnots = defaultSpineKnots();
    state.spineOrbitSegments = [];
    state.spineSource = "profile";
    state.placementNormal = defaultPlacementNormal();
    state.tessellationMode = "rotation";
    state.objectMaterial = defaultObjectMaterial();
    state.embeddedAssets = {};
    state.children = [];
    state.editTarget = "root";
    state.selectedChildGuid = null;
    syncSegments();
    state.viewMode = "profile";
    state.selectedId = state.knots[1]?.id || null;
    state.selectedIds = [];
    state.selectedSegmentIndex = -1;
    state.mesh = null;
    history.clear();
    history.baseline(snapshotShape());
    refreshHistoryFlags();
    state.status = "Reset to default silhouette + unit-circle orbit + straight spines.";
  }

  function removeKnot(id) {
    const knots = activeKnots();
    const min = isOrbit() ? 3 : 2;
    if (knots.length <= min) return;
    commitToHistory("remove-knot");
    const idx = knots.findIndex((k) => k.id === id);
    if (idx < 0) return;
    knots.splice(idx, 1);
    state.selectedIds = state.selectedIds.filter((x) => x !== id);
    syncSegments();
    state.selectedId = knots[Math.min(idx, knots.length - 1)]?.id || null;
    state.selectedSegmentIndex = -1;
  }

  function removeSelected() {
    if (state.selectedId) removeKnot(state.selectedId);
  }

  function updateKnot(id, patch) {
    const moving =
      patch.x != null || patch.y != null || patch.hx != null || patch.hy != null;
    if (moving) beginGesture("move-knot");
    else commitToHistory("knot");
    const k = activeKnots().find((n) => n.id === id);
    if (!k) return;
    Object.assign(k, patch);
    // Profile radius stays ≥0; orbit + spine allow signed offsets.
    if (!isOrbit() && !isSpine() && typeof patch.x === "number") k.x = Math.max(0, patch.x);
  }

  function updateSegment(index, patch) {
    commitToHistory("segment");
    const s = activeSegments()[index];
    if (!s) return;
    Object.assign(s, patch);
  }

  function activePlacementNormal() {
    const b = bodyRef();
    if (b) return normalizePlacementNormal(b.placementNormal);
    return normalizePlacementNormal(state.placementNormal);
  }

  function updatePlacementNormal(patch) {
    const moving =
      patch?.start != null ||
      patch?.end != null ||
      patch?.startX != null ||
      patch?.startY != null ||
      patch?.endX != null ||
      patch?.endY != null;
    if (moving) beginGesture("move-normal");
    else commitToHistory("placement-normal");
    const target = bodyRef();
    const cur = normalizePlacementNormal(
      target ? target.placementNormal : state.placementNormal,
    );
    const next = {
      start: { ...cur.start, ...(patch.start || {}) },
      end: { ...cur.end, ...(patch.end || {}) },
    };
    if (patch.startX != null) next.start.x = Number(patch.startX);
    if (patch.startY != null) next.start.y = Number(patch.startY);
    if (patch.endX != null) next.end.x = Number(patch.endX);
    if (patch.endY != null) next.end.y = Number(patch.endY);
    // Keep a non-zero length
    if (Math.hypot(next.end.x - next.start.x, next.end.y - next.start.y) < 1e-6) {
      next.end.y = next.start.y + 0.01;
    }
    if (target) target.placementNormal = next;
    else state.placementNormal = next;
  }

  function resetPlacementNormal() {
    commitToHistory("reset-normal");
    const target = bodyRef();
    if (target) target.placementNormal = defaultPlacementNormal();
    else state.placementNormal = defaultPlacementNormal();
    state.status = "Placement normal reset to bottom→top (0,-1)→(0,1).";
  }

  function applyColorToKnots(ids, color) {
    const knots = activeKnots();
    for (const id of ids) {
      const k = knots.find((n) => n.id === id);
      if (k) k.color = color;
    }
  }

  /** Bulk: whole active body (knots + segment solids + object material). */
  function applyMaterialToWhole(patch) {
    commitToHistory("bulk-material");
    const mat = activeObjectMaterial();
    Object.assign(mat, patch);
    const knots = activeKnots();
    const segs = activeSegments();
    if (patch.color != null) {
      for (const k of knots) k.color = patch.color;
      for (const s of segs) s.color = patch.color;
    }
    if (patch.roughness != null) for (const s of segs) s.roughness = patch.roughness;
    if (patch.metalness != null) for (const s of segs) s.metalness = patch.metalness;
    if (patch.opacity != null) for (const s of segs) s.opacity = patch.opacity;
    if (patch.texture != null) for (const s of segs) s.texture = patch.texture;
    state.status = "Applied material to whole object.";
  }

  function applyColorToSelection(color) {
    const ids = state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : [];
    if (!ids.length) {
      state.status = "Select one or more points first (Shift+click in Coloring).";
      return;
    }
    commitToHistory("color-selection");
    applyColorToKnots(ids, color);
    state.status = `Colored ${ids.length} point(s).`;
  }

  function evalSpan(a, b, t, pathType = "bezier", arcBulge = null) {
    return evalPathSpan(a, b, t, {
      pathType,
      curveType: activeCurveType(),
      arcBulge,
    });
  }

  function sampleCurvePoints(samplesPerSpan = 24) {
    const knots = activeKnots();
    const segs = activeSegments();
    const pts = [];
    if (isOrbit()) {
      const n = knots.length;
      for (let i = 0; i < n; i++) {
        const a = knots[i];
        const b = knots[(i + 1) % n];
        const seg = segs[i];
        for (let s = 0; s < samplesPerSpan; s++) {
          const t = s / samplesPerSpan;
          const { p } = evalSpan(a, b, t, seg?.pathType || "bezier", seg?.arcBulge);
          pts.push({ x: p.x, y: p.y, segmentIndex: i, t });
        }
      }
      if (pts.length) pts.push({ ...pts[0], t: 1 });
      return pts;
    }
    // profile or spine (open path); spine keeps signed x
    for (let i = 0; i < knots.length - 1; i++) {
      const a = knots[i];
      const b = knots[i + 1];
      const seg = segs[i];
      const last = i < knots.length - 2 ? samplesPerSpan - 1 : samplesPerSpan;
      for (let s = 0; s <= last; s++) {
        const t = s / samplesPerSpan;
        const { p } = evalSpan(
          a,
          b,
          t,
          seg?.pathType || (isSpine() ? "line" : "bezier"),
          seg?.arcBulge,
        );
        pts.push({
          x: isSpine() ? p.x : Math.max(0, p.x),
          y: p.y,
          segmentIndex: i,
          t,
        });
      }
    }
    return pts;
  }

  function findClosestOnCurve(wx, wy, maxDist = 0.12) {
    const pts = sampleCurvePoints(40);
    const limit = isOrbit() && pts.length > 1 ? pts.length - 1 : pts.length;
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < limit; i++) {
      const p = pts[i];
      const d = Math.hypot(p.x - wx, p.y - wy);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function insertKnotOnCurve(wx, wy) {
    const hit = findClosestOnCurve(wx, wy);
    if (!hit) {
      state.status = "Click closer to the curve to add a point.";
      return null;
    }
    commitToHistory("add-knot");
    const knots = activeKnots();
    const segs = activeSegments();
    const segIndex = hit.segmentIndex;
    const n = knots.length;
    const a = knots[segIndex];
    const b = isOrbit() ? knots[(segIndex + 1) % n] : knots[segIndex + 1];
    const oldSeg = segs[segIndex] ? { ...segs[segIndex] } : defaultSegment(a.id, b.id);
    const { p, tan } = evalSpan(
      a,
      b,
      hit.t,
      oldSeg.pathType || (isSpine() ? "line" : "bezier"),
      oldSeg.arcBulge,
    );
    const tl = Math.hypot(tan.x, tan.y) || 1;
    const k = {
      id: uid(),
      x: isOrbit() || isSpine() ? p.x : Math.max(0, p.x),
      y: p.y,
      hx: (tan.x / tl) * 0.14,
      hy: (tan.y / tl) * 0.14,
      color: DEFAULT_COLORS[knots.length % DEFAULT_COLORS.length],
    };

    if (isOrbit()) {
      const old = segs.slice();
      knots.splice(segIndex + 1, 0, k);
      const next = [];
      const nn = knots.length;
      for (let i = 0; i < nn; i++) {
        const fromId = knots[i].id;
        const toId = knots[(i + 1) % nn].id;
        if (i === segIndex || i === segIndex + 1) {
          next.push({ ...oldSeg, fromId, toId, textureData: oldSeg.textureData });
        } else {
          const oldIdx = i < segIndex ? i : i - 1;
          next.push(cloneSeg(old[oldIdx] || oldSeg, fromId, toId));
        }
      }
      const body = bodyRef();
      if (body) body.orbitSegments = next;
      else state.orbitSegments = next;
    } else {
      knots.splice(segIndex + 1, 0, k);
      const next = [];
      for (let i = 0; i < knots.length - 1; i++) {
        const fromId = knots[i].id;
        const toId = knots[i + 1].id;
        if (i === segIndex || i === segIndex + 1) {
          next.push({ ...oldSeg, fromId, toId, textureData: oldSeg.textureData });
        } else if (i < segIndex) {
          next.push(cloneSeg(segs[i], fromId, toId));
        } else {
          next.push(cloneSeg(segs[i - 1], fromId, toId));
        }
      }
      const body = bodyRef();
      if (isSpine()) {
        if (state.spineSource === "orbit") {
          if (body) body.spineOrbitSegments = next;
          else state.spineOrbitSegments = next;
        } else if (body) body.spineProfileSegments = next;
        else state.spineProfileSegments = next;
      } else if (body) body.segments = next;
      else state.segments = next;
    }

    state.selectedId = k.id;
    state.selectedIds = [k.id];
    state.selectedSegmentIndex = -1;
    state.status = `Added knot.`;
    return k;
  }

  function rootBodySnapshot() {
    return {
      assetGuid: state.assetGuid,
      name: "root",
      curveType: state.curveType,
      pathSegments: state.pathSegments,
      angularSteps: state.angularSteps,
      revolutionDeg: state.revolutionDeg,
      tessellationMode: state.tessellationMode === "torus" ? "torus" : "rotation",
      objectMaterial: state.objectMaterial,
      knots: state.knots,
      segments: state.segments,
      orbitKnots: state.orbitKnots,
      orbitSegments: state.orbitSegments,
      spineProfileKnots: state.spineProfileKnots,
      spineProfileSegments: state.spineProfileSegments,
      spineOrbitKnots: state.spineOrbitKnots,
      spineOrbitSegments: state.spineOrbitSegments,
    };
  }

  function pushTransformedParts(parts, childParts, xf, mirrorX, body, instanceGuid) {
    const pn = normalizePlacementNormal(body?.placementNormal);
    const up = placementNormalDirection3(pn);
    const pivot = [pn.start.x, pn.start.y, 0];
    const surfaceXf = xf.surface
      ? {
          ...xf,
          x: mirrorX ? -xf.x : xf.x,
          nx: mirrorX ? -xf.nx : xf.nx,
          ny: xf.ny,
          nz: xf.nz,
          mirrorX: false,
          childUpX: up.x,
          childUpY: up.y,
          childUpZ: up.z,
          pivotX: pivot[0],
          pivotY: pivot[1],
          pivotZ: pivot[2],
        }
      : {
          x: xf.x,
          y: xf.y,
          rotationYDeg: xf.rotationYDeg,
          scale: xf.scale,
          snapCenterline: xf.snapCenterline,
          mirrorX,
        };
    const placed = transformParts(childParts, surfaceXf, xf.surface ? pivot : undefined);
    for (const p of placed) {
      parts.push(instanceGuid ? { ...p, instanceGuid } : p);
    }
  }

  /**
   * Keep surface-placed children seated on the root: raycast along the stored
   * parent normal through the attach point and refresh point + normal.
   * Called after root (re)tessellation so spine/profile edits re-align subs.
   */
  function resnapSurfaceChildren(rootParts) {
    if (!rootParts?.length) return;
    for (const ch of state.children) {
      const xf = ch.transform;
      if (!xf?.surface) continue;
      const nx = Number(xf.nx) || 0;
      const ny = Number(xf.ny) || 1;
      const nz = Number(xf.nz) || 0;
      const L = Math.hypot(nx, ny, nz) || 1;
      const n = [nx / L, ny / L, nz / L];
      const px = Number(xf.x) || 0;
      const py = Number(xf.y) || 0;
      const pz = Number(xf.z) || 0;
      const origin = [px + n[0] * 0.75, py + n[1] * 0.75, pz + n[2] * 0.75];
      let hit = raycastMeshParts(origin, [-n[0], -n[1], -n[2]], rootParts);
      if (!hit) {
        hit = raycastMeshParts(
          [px - n[0] * 0.75, py - n[1] * 0.75, pz - n[2] * 0.75],
          n,
          rootParts,
        );
      }
      if (!hit) continue;
      xf.x = hit.point[0];
      xf.y = hit.point[1];
      xf.z = hit.point[2];
      xf.nx = hit.normal[0];
      xf.ny = hit.normal[1];
      xf.nz = hit.normal[2];
    }
  }

  function tessellate() {
    // Always assemble from ROOT + children (preview shows full object even when editing a child).
    const root = tessellateBody(rootBodySnapshot());
    state.rootMesh = { parts: root.parts.slice() };
    // Spine / profile edits move the root surface — re-seat surface children on it.
    resnapSurfaceChildren(state.rootMesh.parts);
    const parts = root.parts.slice();
    let totalV = root.verts;
    let totalT = root.tris;

    for (const ch of state.children) {
      if (ch.visible === false) continue;
      const body = state.embeddedAssets[ch.contentGuid];
      if (!body || body.knots.length < 2 || body.orbitKnots.length < 3) continue;
      const child = tessellateBody(body);
      const xf = ch.transform || defaultChildTransform();
      pushTransformedParts(parts, child.parts, xf, false, body, ch.instanceGuid);
      totalV += child.verts;
      totalT += child.tris;
      // Symmetry: same content, mirrored placement (linked eyes without a second instance).
      if (xf.useSymmetry && !xf.snapCenterline && !xf.surface && Math.abs(xf.x) > 0.001) {
        pushTransformedParts(parts, child.parts, xf, true, body, ch.instanceGuid);
        totalV += child.verts;
        totalT += child.tris;
      }
    }

    state.mesh = { parts };
    state.stats = {
      verts: totalV,
      tris: totalT,
      profile: state.knots.length,
      parts: parts.length,
    };
    const focus = isEditingChild()
      ? `editing sub “${state.embeddedAssets[state.editTarget]?.name || state.editTarget.slice(0, 8)}”`
      : "editing root";
    state.status = `Assembly · ${parts.length} parts · ${totalV}v / ${totalT}t · ${focus}`;
    return state.mesh;
  }

  function selectChild(instanceGuid) {
    state.selectedChildGuid = instanceGuid;
  }

  function editRoot() {
    state.editTarget = "root";
    state.selectedId = state.knots[0]?.id || null;
    state.selectedIds = [];
    state.status = "Editing root body — preview shows full assembly.";
  }

  function editChildContent(instanceGuid) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    const body = state.embeddedAssets[ch.contentGuid];
    if (!body) {
      state.status = "Missing embedded content for this sub-object.";
      return;
    }
    if (!body.placementNormal) body.placementNormal = defaultPlacementNormal();
    state.selectedChildGuid = instanceGuid;
    state.editTarget = ch.contentGuid;
    state.viewMode = "profile";
    state.selectedId = body.knots[0]?.id || null;
    state.selectedIds = [];
    state.status = `Editing “${ch.name}” (GUID ${ch.contentGuid.slice(0, 8)}…) — linked instances share this content. Preview = full assembly.`;
  }

  function updateChildTransform(instanceGuid, patch) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    const moving =
      patch.x != null ||
      patch.y != null ||
      patch.z != null ||
      patch.nx != null ||
      patch.ny != null ||
      patch.nz != null ||
      patch.surface != null;
    if (moving) beginGesture("move-child");
    else commitToHistory("child-transform");
    Object.assign(ch.transform, patch);
    if (patch.snapCenterline) {
      ch.transform.x = 0;
      ch.transform.useSymmetry = false;
    }
    if (patch.surface) {
      ch.transform.snapCenterline = false;
      ch.transform.useSymmetry = false;
    }
  }

  function removeChild(instanceGuid) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    commitToHistory("remove-child");
    state.children = state.children.filter((c) => c.instanceGuid !== instanceGuid);
    const stillUsed = state.children.some((c) => c.contentGuid === ch.contentGuid);
    if (!stillUsed && ch.mode === "copy") {
      delete state.embeddedAssets[ch.contentGuid];
    }
    if (state.selectedChildGuid === instanceGuid) state.selectedChildGuid = null;
    if (state.editTarget === ch.contentGuid && !stillUsed) editRoot();
    state.status = `Removed sub-object “${ch.name}”.`;
  }

  function centerChildOnAxis(instanceGuid) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    commitToHistory("center-child");
    ch.transform.snapCenterline = true;
    ch.transform.x = 0;
    ch.transform.useSymmetry = false;
    state.status = "Centered sub-object on the symmetry axis.";
  }

  /**
   * Attach a library/project document as a sub-object.
   * mode 'copy' → new assetGuid (Save of original won't affect this).
   * mode 'link' → keep source assetGuid so edits stay linked.
   * symmetric → also add a mirrored instance sharing the same contentGuid.
   */
  function attachFromProject(doc, { mode = "copy", symmetric = false, name, transform } = {}) {
    if (!doc?.profile?.knots || !doc?.orbit?.knots) {
      state.status = "Project needs profile + orbit to attach.";
      return null;
    }
    commitToHistory("attach");
    const asCopy = mode !== "link";
    let contentGuid;
    let bodyName = name || doc.name || "Sub-object";

    if (!asCopy && doc.assetGuid && state.embeddedAssets[doc.assetGuid]) {
      contentGuid = doc.assetGuid;
      bodyName = state.embeddedAssets[contentGuid].name || bodyName;
    } else {
      const body = projectDocToBody(doc, { newGuidForCopy: asCopy });
      if (!asCopy && doc.assetGuid) body.assetGuid = doc.assetGuid;
      body.name = bodyName;
      body.placementNormal = normalizePlacementNormal(doc.placementNormal);
      state.embeddedAssets[body.assetGuid] = body;
      contentGuid = body.assetGuid;
    }

    const makeInst = (xf, label) => ({
      instanceGuid: newGuid(),
      contentGuid,
      mode: asCopy ? "copy" : "link",
      name: label,
      sourceId: doc.id || null,
      sourceSlug: doc.slug || null,
      transform: defaultChildTransform(xf),
      visible: true,
    });

    const baseXf = transform?.surface
      ? {
          x: transform.x,
          y: transform.y,
          z: transform.z ?? 0,
          nx: transform.nx ?? 0,
          ny: transform.ny ?? 1,
          nz: transform.nz ?? 0,
          surface: true,
          scale: transform.scale ?? 0.28,
          rotationYDeg: transform.rotationYDeg ?? 0,
          useSymmetry: false,
          snapCenterline: false,
        }
      : { x: 0.45, y: 0.35, useSymmetry: false };

    const primary = makeInst(
      baseXf,
      bodyName + (symmetric ? " (R)" : ""),
    );
    state.children.push(primary);
    if (symmetric) {
      if (transform?.surface) {
        state.children.push(
          makeInst(
            { ...baseXf, x: -baseXf.x, nx: -baseXf.nx },
            bodyName + " (L)",
          ),
        );
      } else {
        state.children.push(
          makeInst(
            { x: -0.45, y: 0.35, rotationYDeg: 0, useSymmetry: false },
            bodyName + " (L)",
          ),
        );
      }
    }

    state.selectedChildGuid = primary.instanceGuid;
    state.status = asCopy
      ? `Attached copy “${bodyName}” (new GUID ${contentGuid.slice(0, 8)}…).`
      : `Attached link “${bodyName}” (shared GUID ${contentGuid.slice(0, 8)}…).`;
    return primary;
  }

  /** Toggle symmetry flag on an instance (mirror render without second instance). */
  function toggleChildSymmetry(instanceGuid) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    commitToHistory("child-sym");
    ch.transform.useSymmetry = !ch.transform.useSymmetry;
    if (ch.transform.useSymmetry) ch.transform.snapCenterline = false;
    state.status = ch.transform.useSymmetry
      ? "Symmetry on — mirrored twin uses the same content GUID."
      : "Symmetry off.";
  }

  /** Add a mirrored instance sharing content (separate transform, linked edits). */
  function addSymmetricTwin(instanceGuid) {
    const ch = state.children.find((c) => c.instanceGuid === instanceGuid);
    if (!ch) return;
    commitToHistory("twin");
    const twin = {
      instanceGuid: newGuid(),
      contentGuid: ch.contentGuid,
      mode: ch.mode,
      name: ch.name.replace(/ \(R\)$/, "") + " (L)",
      sourceId: ch.sourceId,
      sourceSlug: ch.sourceSlug,
      transform: {
        ...ch.transform,
        x: -Math.abs(ch.transform.x || 0.45),
        useSymmetry: false,
        snapCenterline: false,
      },
      visible: true,
    };
    state.children.push(twin);
    state.status = `Added symmetric twin — shared content GUID ${ch.contentGuid.slice(0, 8)}…`;
    return twin;
  }

  function applyProject(doc) {
    if (!doc?.profile?.knots) return false;
    const ed = doc.editor || {};
    state.assetGuid = doc.assetGuid || newGuid();
    state.curveType = ed.curveType | 0;
    state.pathSegments = ed.pathSegments || 12;
    state.angularSteps = ed.angularSteps || 24;
    state.revolutionDeg = ed.revolutionDeg || 360;
    state.tessellationMode = ed.tessellationMode === "torus" ? "torus" : "rotation";
    state.materialMode = ed.materialMode ?? 3;
    state.symmetry = ed.symmetry !== false;
    state.viewMode =
      ed.viewMode === "orbit" || ed.viewMode === "spine" ? ed.viewMode : "profile";
    state.spineSource = ed.spineSource === "orbit" ? "orbit" : "profile";
    state.objectMaterial = {
      color: doc.objectMaterial?.color ?? null,
      roughness: doc.objectMaterial?.roughness ?? 0.4,
      metalness: doc.objectMaterial?.metalness ?? 0,
      opacity: doc.objectMaterial?.opacity ?? 1,
      texture: doc.objectMaterial?.texture || "gradient",
    };
    state.knots = doc.profile.knots.map((k) => ({ ...k }));
    state.segments = (doc.profile.segments || []).map((s) => ({
      ...s,
      textureData: null,
      textureAsset: s.textureAsset || null,
      pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
      arcBulge: s.arcBulge ?? null,
    }));
    if (doc.orbit?.knots?.length >= 3) {
      state.orbitKnots = doc.orbit.knots.map((k) => ({ ...k }));
      state.orbitSegments = (doc.orbit.segments || []).map((s) => ({
        ...s,
        textureData: null,
        textureAsset: s.textureAsset || null,
        pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
        arcBulge: s.arcBulge ?? null,
      }));
    } else {
      state.orbitKnots = defaultOrbitKnots();
      state.orbitSegments = [];
    }
    {
      const sp = loadSpineBlock(doc.spineProfile, defaultSpineKnots);
      const so = loadSpineBlock(doc.spineOrbit, defaultSpineKnots);
      state.spineProfileKnots = sp.knots;
      state.spineProfileSegments = sp.segments;
      state.spineOrbitKnots = so.knots;
      state.spineOrbitSegments = so.segments;
    }
    state.placementNormal = normalizePlacementNormal(doc.placementNormal);

    state.embeddedAssets = {};
    for (const [guid, body] of Object.entries(doc.embeddedAssets || {})) {
      const bsp = loadSpineBlock(
        { knots: body.spineProfileKnots, segments: body.spineProfileSegments },
        defaultSpineKnots,
      );
      const bso = loadSpineBlock(
        { knots: body.spineOrbitKnots, segments: body.spineOrbitSegments },
        defaultSpineKnots,
      );
      state.embeddedAssets[guid] = {
        ...body,
        knots: (body.knots || []).map((k) => ({ ...k })),
        segments: (body.segments || []).map((s) => ({ ...s, textureData: null })),
        orbitKnots: (body.orbitKnots || []).map((k) => ({ ...k })),
        orbitSegments: (body.orbitSegments || []).map((s) => ({ ...s, textureData: null })),
        spineProfileKnots: bsp.knots,
        spineProfileSegments: bsp.segments,
        spineOrbitKnots: bso.knots,
        spineOrbitSegments: bso.segments,
        placementNormal: normalizePlacementNormal(body.placementNormal),
        objectMaterial: { ...defaultObjectMaterial(), ...(body.objectMaterial || {}) },
      };
    }
    state.children = (doc.children || []).map((ch) => ({
      ...ch,
      transform: { ...defaultChildTransform(), ...(ch.transform || {}) },
    }));
    state.editTarget = "root";
    state.selectedChildGuid = null;
    syncSegments();
    state.selectedId = state.knots[1]?.id || state.knots[0]?.id || null;
    state.selectedIds = [];
    state.selectedSegmentIndex = -1;
    history.clear();
    history.baseline(snapshotShape());
    refreshHistoryFlags();
    state.status = `Loaded “${doc.name}” (schema v${doc.schemaVersion}, GUID ${state.assetGuid.slice(0, 8)}…).`;
    return true;
  }

  function snapshotState() {
    const embedded = {};
    for (const [guid, body] of Object.entries(state.embeddedAssets)) {
      embedded[guid] = {
        assetGuid: body.assetGuid,
        name: body.name,
        curveType: body.curveType,
        pathSegments: body.pathSegments,
        angularSteps: body.angularSteps,
        revolutionDeg: body.revolutionDeg,
        tessellationMode: body.tessellationMode === "torus" ? "torus" : "rotation",
        objectMaterial: { ...body.objectMaterial },
        knots: body.knots.map((k) => ({ ...k })),
        segments: body.segments.map(mapSegSnapshot),
        orbitKnots: body.orbitKnots.map((k) => ({ ...k })),
        orbitSegments: body.orbitSegments.map(mapSegSnapshot),
        spineProfileKnots: (body.spineProfileKnots || []).map((k) => ({ ...k })),
        spineProfileSegments: (body.spineProfileSegments || []).map(mapSegSnapshot),
        spineOrbitKnots: (body.spineOrbitKnots || []).map((k) => ({ ...k })),
        spineOrbitSegments: (body.spineOrbitSegments || []).map(mapSegSnapshot),
        placementNormal: normalizePlacementNormal(body.placementNormal),
      };
    }
    return {
      assetGuid: state.assetGuid,
      curveType: state.curveType,
      pathSegments: state.pathSegments,
      angularSteps: state.angularSteps,
      revolutionDeg: state.revolutionDeg,
      tessellationMode: state.tessellationMode === "torus" ? "torus" : "rotation",
      materialMode: state.materialMode,
      symmetry: state.symmetry,
      viewMode: state.viewMode,
      spineSource: state.spineSource,
      objectMaterial: { ...state.objectMaterial },
      knots: state.knots.map((k) => ({ ...k })),
      segments: state.segments.map(mapSegSnapshot),
      orbitKnots: state.orbitKnots.map((k) => ({ ...k })),
      orbitSegments: state.orbitSegments.map(mapSegSnapshot),
      spineProfileKnots: state.spineProfileKnots.map((k) => ({ ...k })),
      spineProfileSegments: state.spineProfileSegments.map(mapSegSnapshot),
      spineOrbitKnots: state.spineOrbitKnots.map((k) => ({ ...k })),
      spineOrbitSegments: state.spineOrbitSegments.map(mapSegSnapshot),
      placementNormal: normalizePlacementNormal(state.placementNormal),
      embeddedAssets: embedded,
      children: state.children.map((c) => ({
        instanceGuid: c.instanceGuid,
        contentGuid: c.contentGuid,
        mode: c.mode,
        name: c.name,
        sourceId: c.sourceId,
        sourceSlug: c.sourceSlug,
        transform: { ...c.transform },
        visible: c.visible !== false,
      })),
    };
  }

  if (!state.selectedId && state.knots.length) {
    state.selectedId = state.knots[1].id;
    state.selectedIds = [state.selectedId];
  }

  history.baseline(snapshotShape());
  refreshHistoryFlags();

  watch(
    () => [
      state.knots.length,
      state.orbitKnots.length,
      state.editTarget,
      Object.keys(state.embeddedAssets).length,
    ],
    () => syncSegments(),
  );

  return {
    state,
    selected,
    selectedSegment,
    activeKnots,
    activeSegments,
    activeObjectMaterial,
    activeCurveType,
    activePlacementNormal,
    setActiveCurveType,
    isEditingChild,
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
    syncSegments,
    applyProject,
    snapshotState,
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
    beginGesture,
    endGesture,
    commitToHistory,
  };
}
