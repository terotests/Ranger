<script setup>
defineProps({
  knots: { type: Array, required: true },
  selectedId: { type: String, default: null },
  curveType: { type: Number, default: 0 },
});

const emit = defineEmits(["select", "update-knot"]);

function onNum(id, key, ev) {
  const v = Number(ev.target.value);
  if (Number.isFinite(v)) emit("update-knot", id, { [key]: v });
}
</script>

<template>
  <div class="point-editor">
    <header>
      <h2>Points</h2>
      <p>Right-side profile (x ≥ 0). Mirror is automatic.</p>
    </header>
    <ul>
      <li
        v-for="(k, i) in knots"
        :key="k.id"
        :class="{ active: k.id === selectedId }"
        @click="emit('select', k.id)"
      >
        <div class="row-title">
          <strong>#{{ i + 1 }}</strong>
          <span>{{ i === 0 ? "bottom" : i === knots.length - 1 ? "top" : "mid" }}</span>
        </div>
        <div class="grid">
          <label class="field">
            x
            <input type="number" step="0.01" :value="k.x" @change="onNum(k.id, 'x', $event)" />
          </label>
          <label class="field">
            y
            <input type="number" step="0.01" :value="k.y" @change="onNum(k.id, 'y', $event)" />
          </label>
          <template v-if="curveType === 0">
            <label class="field">
              hx
              <input type="number" step="0.01" :value="k.hx" @change="onNum(k.id, 'hx', $event)" />
            </label>
            <label class="field">
              hy
              <input type="number" step="0.01" :value="k.hy" @change="onNum(k.id, 'hy', $event)" />
            </label>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.point-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  backdrop-filter: blur(10px);
}

header {
  padding: 0.9rem 1rem 0.5rem;
  border-bottom: 1px solid var(--line);
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 400;
}

p {
  margin: 0.2rem 0 0;
  color: var(--ink-dim);
  font-size: 0.78rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0.4rem;
  overflow: auto;
}

li {
  padding: 0.65rem 0.7rem;
  border-radius: 8px;
  border: 1px solid transparent;
  margin-bottom: 0.35rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

li:hover {
  background: rgba(255, 255, 255, 0.03);
}

li.active {
  border-color: rgba(126, 207, 106, 0.4);
  background: rgba(126, 207, 106, 0.08);
}

.row-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.45rem;
  font-size: 0.8rem;
  color: var(--ink-dim);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}
</style>
