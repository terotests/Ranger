<script setup>
import { computed } from "vue";

const props = defineProps({
  layers: { type: Array, default: () => [] },
  selectedLayerId: { type: String, default: null },
  textureKind: { type: String, default: "eye" },
  layerMode: { type: String, default: "edit" },
});

const emit = defineEmits([
  "select-layer",
  "rename-layer",
  "toggle-layer",
  "move-layer",
  "add-layer",
  "remove-layer",
  "set-color",
  "patch-layer",
  "set-layer-mode",
  "restore-circle",
]);

const addTypes = [
  { id: "iris", label: "+ Iris" },
  { id: "pupil", label: "+ Pupil" },
  { id: "reflection", label: "+ Shine" },
  { id: "eyelid", label: "+ Eyelid" },
];

const selected = computed(() => props.layers.find((L) => L.id === props.selectedLayerId) || null);
const eyelidSelected = computed(() => selected.value?.type === "eyelid");
const canRestoreCircle = computed(
  () =>
    !!selected.value &&
    selected.value.type !== "eyelid" &&
    selected.value.closed !== false,
);
</script>

<template>
  <section class="panel">
    <header>
      <h2>Layers</h2>
      <span>{{ layers.length }}</span>
    </header>
    <div class="mode-row">
      <button
        type="button"
        :class="{ active: layerMode === 'edit', primary: layerMode === 'edit' }"
        title="Edit knots and Bezier handles"
        @click="emit('set-layer-mode', 'edit')"
      >
        Edit
      </button>
      <button
        type="button"
        :class="{ active: layerMode === 'move', primary: layerMode === 'move' }"
        title="Drag to translate the selected layer (iris also moves pupil)"
        @click="emit('set-layer-mode', 'move')"
      >
        Move
      </button>
      <button
        type="button"
        :class="{ active: layerMode === 'rotate', primary: layerMode === 'rotate' }"
        title="Drag the ring handle to spin the layer about the pivot (drag the pivot to move it)"
        @click="emit('set-layer-mode', 'rotate')"
      >
        ⟳ Rotate
      </button>
    </div>
    <p class="hint">
      Edit = shape handles · Move = place layer · Rotate = spin about a pivot
      (iris follows its eyeball). Reorder with ↑↓.
    </p>
    <ul class="list">
      <li
        v-for="L in layers"
        :key="L.id"
        :class="{ active: L.id === selectedLayerId, off: L.enabled === false }"
        @click="emit('select-layer', L.id)"
      >
        <label class="en" @click.stop>
          <input
            type="checkbox"
            :checked="L.enabled !== false"
            @change="emit('toggle-layer', L.id, $event.target.checked)"
          />
        </label>
        <input
          class="name"
          :value="L.name"
          @click.stop
          @change="emit('rename-layer', L.id, $event.target.value)"
        />
        <span class="type">{{ L.type }}</span>
        <input
          class="swatch"
          type="color"
          :title="L.type === 'eyelid' ? 'Fill color' : 'Color'"
          :value="L.color || '#ffffff'"
          @click.stop
          @input="emit('set-color', L.id, $event.target.value)"
        />
        <button type="button" title="Order up" @click.stop="emit('move-layer', L.id, -1)">↑</button>
        <button type="button" title="Order down" @click.stop="emit('move-layer', L.id, 1)">↓</button>
        <button
          type="button"
          class="danger"
          :disabled="L.type === 'eyeball'"
          title="Remove"
          @click.stop="emit('remove-layer', L.id)"
        >
          ×
        </button>
      </li>
    </ul>

    <div v-if="canRestoreCircle" class="lid-opts">
      <p class="lid-title">{{ selected.name || selected.type }}</p>
      <button
        type="button"
        class="restore"
        title="Rebuild as a round Bezier circle at the current center"
        @click="emit('restore-circle', selected.id)"
      >
        Restore to circle
      </button>
    </div>

    <div v-if="eyelidSelected" class="lid-opts">
      <p class="lid-title">Eyelid</p>
      <label class="row">
        Fill
        <input
          class="swatch"
          type="color"
          :value="selected.color || '#c4a484'"
          @input="emit('patch-layer', selected.id, { color: $event.target.value })"
        />
      </label>
      <label class="row check">
        <input
          type="checkbox"
          :checked="!!selected.border"
          @change="emit('patch-layer', selected.id, { border: $event.target.checked })"
        />
        Border
      </label>
      <template v-if="selected.border">
        <label class="row">
          Border color
          <input
            class="swatch"
            type="color"
            :value="selected.borderColor || '#6e4f38'"
            @input="emit('patch-layer', selected.id, { borderColor: $event.target.value })"
          />
        </label>
        <label class="row">
          Width
          <input
            class="num"
            type="number"
            min="0.005"
            max="0.25"
            step="0.005"
            :value="selected.borderWidth ?? 0.035"
            @change="
              emit('patch-layer', selected.id, { borderWidth: Number($event.target.value) })
            "
          />
        </label>
      </template>
      <label class="row">
        Fill side
        <select
          :value="selected.fillSide === 'below' ? 'below' : 'above'"
          @change="emit('patch-layer', selected.id, { fillSide: $event.target.value })"
        >
          <option value="above">Above curve</option>
          <option value="below">Below curve</option>
        </select>
      </label>
    </div>

    <div v-if="textureKind === 'eye'" class="add-row">
      <button v-for="t in addTypes" :key="t.id" type="button" @click="emit('add-layer', t.id)">
        {{ t.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 0.55rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.85rem;
  min-height: 0;
  min-width: 0;
  align-content: start;
  position: relative;
  z-index: 1;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 400;
}
span {
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-dim);
  line-height: 1.35;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  max-height: 280px;
  overflow: auto;
}
li {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto auto auto;
  gap: 0.3rem;
  align-items: center;
  padding: 0.35rem 0.4rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
}
li.active {
  border-color: rgba(126, 207, 106, 0.45);
  background: rgba(126, 207, 106, 0.08);
}
li.off {
  opacity: 0.45;
}
.name {
  min-width: 0;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
  font-size: 0.78rem;
}
.type {
  font-size: 0.65rem;
  color: var(--ink-dim);
  text-transform: uppercase;
}
.swatch {
  width: 1.6rem;
  height: 1.4rem;
  padding: 0;
  border: none;
  background: none;
}
button {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}
button.danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.add-row button {
  font-size: 0.72rem;
}
.en {
  display: flex;
}
.mode-row {
  display: flex;
  gap: 0.35rem;
}
.mode-row button {
  flex: 1;
  font-size: 0.78rem;
}
.mode-row button.active {
  outline: 1px solid rgba(126, 207, 106, 0.55);
}
.lid-opts {
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.18);
}
.lid-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink);
}
.lid-opts .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--ink-dim);
}
.lid-opts .row.check {
  justify-content: flex-start;
  gap: 0.4rem;
}
.lid-opts .num {
  width: 4.5rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
  font-size: 0.75rem;
  color: var(--ink);
}
.lid-opts select {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
  font-size: 0.75rem;
  color: var(--ink);
}
.lid-opts .restore {
  width: 100%;
  font-size: 0.75rem;
  padding: 0.35rem 0.5rem;
}
</style>
