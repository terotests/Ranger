<script setup>
const props = defineProps({
  layers: { type: Array, default: () => [] },
  selectedLayerId: { type: String, default: null },
  textureKind: { type: String, default: "eye" },
});

const emit = defineEmits([
  "select-layer",
  "rename-layer",
  "toggle-layer",
  "move-layer",
  "add-layer",
  "remove-layer",
  "set-color",
]);

const addTypes = [
  { id: "iris", label: "+ Iris" },
  { id: "pupil", label: "+ Pupil" },
  { id: "reflection", label: "+ Shine" },
  { id: "eyelid", label: "+ Eyelid" },
];
</script>

<template>
  <section class="panel">
    <header>
      <h2>Layers</h2>
      <span>{{ layers.length }}</span>
    </header>
    <p class="hint">
      Named parts · enable/disable · reorder. Iris stays in the eyeball, pupil in the iris,
      reflection in the eye; eyelid draws on top (clipped).
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
          :value="L.color || '#ffffff'"
          @click.stop
          @input="emit('set-color', L.id, $event.target.value)"
        />
        <button type="button" title="Move up" @click.stop="emit('move-layer', L.id, -1)">↑</button>
        <button type="button" title="Move down" @click.stop="emit('move-layer', L.id, 1)">↓</button>
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
  align-content: start;
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
</style>
