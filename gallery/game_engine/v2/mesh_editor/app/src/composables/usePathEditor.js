// ============================================================================
// usePathEditor.js — reusable single-path Bezier editor (texture layers, etc.).
// ============================================================================

import { reactive, computed, watch } from "vue";
import {
  knotUid,
  defaultSegment,
  syncOpenSegments,
  syncClosedSegments,
  samplePath,
} from "../lib/pathModel.js";
import { evalSpan as evalPathSpan } from "../lib/pathSample.js";
import { createEditHistory } from "../lib/editHistory.js";

/**
 * @param {{
 *   closed?: boolean,
 *   clampNonNegativeX?: boolean,
 *   defaultPathType?: string,
 *   curveType?: number,
 *   initialKnots?: any[],
 *   initialSegments?: any[],
 * }} [opts]
 */
export function usePathEditor(opts = {}) {
  const clampNonNegativeX = !!opts.clampNonNegativeX;
  const defaultPathType = opts.defaultPathType || "bezier";

  const state = reactive({
    knots: opts.initialKnots ? opts.initialKnots.map((k) => ({ ...k })) : [],
    segments: opts.initialSegments ? opts.initialSegments.map((s) => ({ ...s })) : [],
    curveType: opts.curveType | 0,
    toolMode: "edit",
    /** When true, path is a closed loop (orbit-style). */
    closed: !!opts.closed,
    selectedId: null,
    selectedIds: [],
    selectedSegmentIndex: -1,
    viewport: opts.viewport || { min: -1.15, max: 1.15 },
    history: { past: 0, future: 0, canUndo: false, canRedo: false },
  });

  const history = createEditHistory({ limit: 48 });

  function refreshHistoryFlags() {
    const info = history.info();
    state.history.past = info.past;
    state.history.future = info.future;
    state.history.canUndo = info.past > 0;
    state.history.canRedo = info.future > 0;
  }

  function snapshot() {
    return JSON.parse(
      JSON.stringify({
        knots: state.knots,
        segments: state.segments,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds,
        selectedSegmentIndex: state.selectedSegmentIndex,
      }),
    );
  }

  function restore(snap) {
    if (!snap) return;
    state.knots = (snap.knots || []).map((k) => ({ ...k }));
    state.segments = (snap.segments || []).map((s) => ({ ...s, textureData: null }));
    state.selectedId = snap.selectedId || null;
    state.selectedIds = snap.selectedIds || [];
    state.selectedSegmentIndex = snap.selectedSegmentIndex ?? -1;
    syncSegments();
  }

  let gestureOpen = false;
  function beginGesture(label = "edit") {
    if (gestureOpen) return;
    history.push(snapshot(), label);
    gestureOpen = true;
    refreshHistoryFlags();
  }
  function endGesture() {
    if (!gestureOpen) return;
    gestureOpen = false;
    history.baseline(snapshot());
    refreshHistoryFlags();
  }
  function commit(label = "edit") {
    history.push(snapshot(), label);
    refreshHistoryFlags();
  }

  function syncSegments() {
    state.segments = state.closed
      ? syncClosedSegments(state.knots, state.segments, defaultPathType)
      : syncOpenSegments(state.knots, state.segments, defaultPathType);
    if (state.selectedSegmentIndex >= state.segments.length) {
      state.selectedSegmentIndex = state.segments.length - 1;
    }
  }

  function loadPath(knots, segments, { closed, preserveSelection = false } = {}) {
    if (closed != null) state.closed = !!closed;
    const prevSel = state.selectedId;
    state.knots = (knots || []).map((k) => ({ ...k }));
    state.segments = (segments || []).map((s) => ({ ...s, textureData: null }));
    syncSegments();
    if (preserveSelection && prevSel && state.knots.some((k) => k.id === prevSel)) {
      state.selectedId = prevSel;
      state.selectedIds = [prevSel];
    } else {
      state.selectedId = state.knots[0]?.id || null;
      state.selectedIds = state.selectedId ? [state.selectedId] : [];
      state.selectedSegmentIndex = -1;
    }
    history.clear();
    history.baseline(snapshot());
    refreshHistoryFlags();
  }

  /** Copy knot fields from an external list without resetting selection/history. */
  function applyKnotsFrom(knots) {
    if (!knots?.length) return;
    const sameIds =
      knots.length === state.knots.length && knots.every((k, i) => k.id === state.knots[i]?.id);
    if (sameIds) {
      for (let i = 0; i < state.knots.length; i++) Object.assign(state.knots[i], knots[i]);
      return;
    }
    // Symmetry rebuild may reorder/add mirrors — replace in place, keep selection.
    const prevSel = state.selectedId;
    state.knots = knots.map((k) => ({ ...k }));
    syncSegments();
    if (prevSel && state.knots.some((k) => k.id === prevSel)) {
      state.selectedId = prevSel;
      state.selectedIds = [prevSel];
    } else if (!state.knots.some((k) => k.id === state.selectedId)) {
      state.selectedId = state.knots[0]?.id || null;
      state.selectedIds = state.selectedId ? [state.selectedId] : [];
    }
  }

  function sampleCurvePoints(n = 28) {
    return samplePath(state.knots, state.segments, {
      closed: state.closed,
      samplesPerSpan: n,
      curveType: state.curveType,
    });
  }

  function findClosestOnCurve(x, y, maxDist = 0.2) {
    const pts = sampleCurvePoints(36);
    let best = null;
    let bestD = maxDist;
    for (const p of pts) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function select(id, { additive = false } = {}) {
    if (!id) {
      state.selectedId = null;
      state.selectedIds = [];
      return;
    }
    if (additive) {
      const set = new Set(state.selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.selectedIds = [...set];
      state.selectedId = id;
    } else {
      state.selectedId = id;
      state.selectedIds = [id];
    }
    state.selectedSegmentIndex = -1;
  }

  function selectSegment(index) {
    state.selectedSegmentIndex = index;
    state.selectedId = null;
    state.selectedIds = [];
  }

  function updateKnot(id, patch) {
    const moving = patch.x != null || patch.y != null || patch.hx != null || patch.hy != null;
    if (moving) beginGesture("move-knot");
    else commit("knot");
    const k = state.knots.find((n) => n.id === id);
    if (!k) return;
    Object.assign(k, patch);
    if (clampNonNegativeX && typeof patch.x === "number") k.x = Math.max(0, k.x);
  }

  function updateSegment(index, patch) {
    commit("segment");
    const s = state.segments[index];
    if (!s) return;
    Object.assign(s, patch);
  }

  function insertKnotOnCurve(x, y) {
    const hit = findClosestOnCurve(x, y, 0.25);
    if (!hit) return false;
    commit("add-knot");
    const span = hit.segmentIndex ?? 0;
    const a = state.knots[span];
    const b = state.knots[state.closed ? (span + 1) % state.knots.length : span + 1];
    if (!a || !b) return false;
    const seg = state.segments[span];
    const mid = evalPathSpan(a, b, hit.t ?? 0.5, {
      pathType: seg?.pathType || defaultPathType,
      curveType: state.curveType,
      arcBulge: seg?.arcBulge ?? null,
    });
    const nk = {
      id: knotUid(),
      x: mid?.p?.x ?? x,
      y: mid?.p?.y ?? y,
      hx: 0,
      hy: 0,
      color: a.color || "#cccccc",
    };
    state.knots.splice(span + 1, 0, nk);
    syncSegments();
    select(nk.id);
    return true;
  }

  function removeSelected() {
    if (!state.selectedId) return;
    const minKnots = state.closed ? 3 : 2;
    if (state.knots.length <= minKnots) return;
    commit("remove-knot");
    state.knots = state.knots.filter((k) => k.id !== state.selectedId);
    syncSegments();
    state.selectedId = state.knots[0]?.id || null;
    state.selectedIds = state.selectedId ? [state.selectedId] : [];
  }

  function undo() {
    const prev = history.undo(snapshot());
    if (!prev) return false;
    restore(prev);
    refreshHistoryFlags();
    return true;
  }

  function redo() {
    const next = history.redo(snapshot());
    if (!next) return false;
    restore(next);
    refreshHistoryFlags();
    return true;
  }

  if (state.knots.length) {
    syncSegments();
    history.baseline(snapshot());
    refreshHistoryFlags();
    if (!state.selectedId) state.selectedId = state.knots[0].id;
  }

  watch(
    () => state.knots.map((k) => k.id).join(","),
    () => syncSegments(),
  );

  return {
    state,
    get closed() {
      return state.closed;
    },
    loadPath,
    applyKnotsFrom,
    syncSegments,
    sampleCurvePoints,
    findClosestOnCurve,
    select,
    selectSegment,
    updateKnot,
    updateSegment,
    insertKnotOnCurve,
    removeSelected,
    beginGesture,
    endGesture,
    undo,
    redo,
    setToolMode(mode) {
      state.toolMode = mode;
    },
  };
}
