import { reactive, computed } from "vue";
import { SplineLathe, SplineKnot } from "@tessellate";

/** @typedef {{ id: string, x: number, y: number, hx: number, hy: number }} Knot */

function uid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

function defaultKnots() {
  const raw = SplineLathe.defaultKnots();
  return raw.map((k) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
  }));
}

export function useSplineEditor() {
  const state = reactive({
    knots: defaultKnots(),
    selectedId: null,
    curveType: 0, // 0 bezier, 1 catmull
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360, // 180 = open cutaway (last step omitted, no wrap)
    materialMode: 3,
    symmetry: true,
    viewport: { min: -1.1, max: 1.1 },
    mesh: null,
    stats: { verts: 0, tris: 0, profile: 0 },
    status: "Edit the right-side profile, then Tessellate.",
  });

  const selected = computed(() => state.knots.find((k) => k.id === state.selectedId) || null);

  function select(id) {
    state.selectedId = id;
  }

  function resetDefaults() {
    state.knots = defaultKnots();
    state.selectedId = state.knots[1]?.id || null;
    state.mesh = null;
    state.status = "Reset to default silhouette.";
  }

  function addKnot() {
    const mid = state.knots[Math.floor(state.knots.length / 2)] || { x: 0.35, y: 0 };
    const k = { id: uid(), x: Math.max(0, mid.x), y: mid.y + 0.15, hx: 0.12, hy: 0 };
    state.knots.splice(Math.max(1, state.knots.length - 1), 0, k);
    state.selectedId = k.id;
  }

  function removeSelected() {
    if (!selected.value || state.knots.length <= 2) return;
    const idx = state.knots.findIndex((k) => k.id === state.selectedId);
    state.knots.splice(idx, 1);
    state.selectedId = state.knots[Math.min(idx, state.knots.length - 1)]?.id || null;
  }

  function updateKnot(id, patch) {
    const k = state.knots.find((n) => n.id === id);
    if (!k) return;
    Object.assign(k, patch);
    if (typeof patch.x === "number") k.x = Math.max(0, patch.x);
  }

  function toRangerKnots() {
    return state.knots.map((k) => SplineKnot.of(k.x, k.y, k.hx, k.hy));
  }

  function sampleCurvePoints(samplesPerSpan = 24) {
    const mesh = SplineLathe.sampleProfile(toRangerKnots(), state.curveType, samplesPerSpan);
    const pts = [];
    for (let i = 0; i < mesh.profileX.length; i++) {
      pts.push({ x: mesh.profileX[i], y: mesh.profileY[i] });
    }
    return pts;
  }

  function tessellate() {
    const phi = (state.revolutionDeg * Math.PI) / 180;
    const closed = state.revolutionDeg >= 359.9;
    const mesh = SplineLathe.sampleAndLatheEx(
      toRangerKnots(),
      state.curveType,
      state.pathSegments,
      state.angularSteps,
      phi,
      closed,
    );
    state.mesh = {
      positions: mesh.positions.slice(),
      normals: mesh.normals.slice(),
      uvs: mesh.uvs.slice(),
      indices: mesh.indices.slice(),
      profileX: mesh.profileX.slice(),
      profileY: mesh.profileY.slice(),
    };
    state.stats = {
      verts: (mesh.positions.length / 3) | 0,
      tris: (mesh.indices.length / 3) | 0,
      profile: mesh.profileX.length,
    };
    state.status = `Tessellated ${state.stats.verts} verts / ${state.stats.tris} tris.`;
    return state.mesh;
  }

  if (!state.selectedId && state.knots.length) {
    state.selectedId = state.knots[1].id;
  }

  return {
    state,
    selected,
    select,
    resetDefaults,
    addKnot,
    removeSelected,
    updateKnot,
    sampleCurvePoints,
    tessellate,
  };
}
