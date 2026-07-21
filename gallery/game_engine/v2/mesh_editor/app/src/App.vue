<script setup>
import { onMounted } from "vue";
import SplineCanvas from "./components/SplineCanvas.vue";
import PointEditor from "./components/PointEditor.vue";
import Preview3D from "./components/Preview3D.vue";
import { useSplineEditor } from "./composables/useSplineEditor.js";

const {
  state,
  setToolMode,
  select,
  selectSegment,
  resetDefaults,
  removeKnot,
  removeSelected,
  updateKnot,
  updateSegment,
  sampleCurvePoints,
  findClosestOnCurve,
  insertKnotOnCurve,
  tessellate,
} = useSplineEditor();

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
  if (patch && patch.color) tessellate();
}

function onUpdateSegment(index, patch) {
  updateSegment(index, patch);
  tessellate();
}

onMounted(() => {
  tessellate();
});
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="brand">
        <p class="eyebrow">Ranger · gallery/game_engine/v2</p>
        <h1>Spline Mesh Editor</h1>
        <p class="lede">
          Symmetrical Bezier profiles around the Y axis, lathed into a 3D mesh and rendered with
          Ranger Three — with Edit / Add / Coloring tools.
        </p>
      </div>
      <div class="actions">
        <div class="tool-row">
          <button
            v-for="t in tools"
            :key="t.id"
            :class="{ active: state.toolMode === t.id, primary: state.toolMode === t.id }"
            @click="setToolMode(t.id)"
          >
            {{ t.label }}
          </button>
        </div>
        <button @click="resetDefaults">Reset</button>
        <button @click="removeSelected" :disabled="!state.selectedId">Remove</button>
        <button class="primary" @click="onTessellate">Tessellate</button>
      </div>
    </header>

    <section class="toolbar">
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
        Angular steps N
        <input v-model.number="state.angularSteps" type="number" min="3" max="64" />
      </label>
      <label class="field">
        Revolution
        <select v-model.number="state.revolutionDeg">
          <option :value="360">360° closed</option>
          <option :value="180">180° (skip last)</option>
        </select>
      </label>
      <label class="field check">
        <input v-model="state.symmetry" type="checkbox" />
        Show mirror
      </label>
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
      <p class="status">
        {{ state.status }} · {{ state.stats.parts || 0 }} parts · {{ state.stats.verts }}v /
        {{ state.stats.tris }}t
      </p>
    </section>

    <main class="workspace">
      <SplineCanvas
        :knots="state.knots"
        :segments="state.segments"
        :selected-id="state.selectedId"
        :selected-segment-index="state.selectedSegmentIndex"
        :curve-type="state.curveType"
        :symmetry="state.symmetry"
        :tool-mode="state.toolMode"
        :viewport="state.viewport"
        :sample-curve-points="sampleCurvePoints"
        :find-closest-on-curve="findClosestOnCurve"
        @select="select"
        @select-segment="selectSegment"
        @update-knot="onUpdateKnot"
        @add-on-curve="onAddOnCurve"
      />
      <PointEditor
        :knots="state.knots"
        :segments="state.segments"
        :selected-id="state.selectedId"
        :selected-segment-index="state.selectedSegmentIndex"
        :curve-type="state.curveType"
        :tool-mode="state.toolMode"
        @select="select"
        @select-segment="selectSegment"
        @update-knot="onUpdateKnot"
        @update-segment="onUpdateSegment"
        @remove-knot="onRemoveKnot"
      />
      <Preview3D :mesh="state.mesh" :material-mode="state.materialMode" />
    </main>
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
  max-width: 38rem;
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

.toolbar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) 1.4fr;
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

.mats span {
  display: block;
  font-size: 0.78rem;
  color: var(--ink-dim);
  margin-bottom: 0.3rem;
}

.mat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
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
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.85fr) minmax(260px, 0.9fr);
  gap: 1rem;
  min-height: 0;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
}
</style>
