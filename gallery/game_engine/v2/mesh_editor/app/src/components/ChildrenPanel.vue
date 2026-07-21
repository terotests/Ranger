<script setup>
import { computed } from "vue";

const props = defineProps({
  children: { type: Array, default: () => [] },
  embeddedAssets: { type: Object, default: () => ({}) },
  selectedChildGuid: { type: String, default: null },
  editTarget: { type: String, default: "root" },
  projects: { type: Array, default: () => [] },
  assetGuid: { type: String, default: "" },
});

const emit = defineEmits([
  "select-child",
  "edit-child",
  "edit-root",
  "update-transform",
  "remove-child",
  "center",
  "toggle-symmetry",
  "add-twin",
  "attach",
  "tessellate",
]);

const selected = computed(() =>
  props.children.find((c) => c.instanceGuid === props.selectedChildGuid) || null,
);

function shortGuid(g) {
  return g ? g.slice(0, 8) + "…" : "—";
}

function onAttach(slug, mode, symmetric) {
  emit("attach", { slug, mode, symmetric });
}
</script>

<template>
  <aside class="children">
    <header>
      <h2>Sub-objects</h2>
      <p>
        Root GUID <code>{{ shortGuid(assetGuid) }}</code>. Copy = new GUID; link / twins share
        content GUID.
      </p>
    </header>

    <div class="row">
      <button type="button" :class="{ active: editTarget === 'root' }" @click="emit('edit-root')">
        Edit root
      </button>
    </div>

    <ul class="list">
      <li
        v-for="ch in children"
        :key="ch.instanceGuid"
        :class="{
          active: ch.instanceGuid === selectedChildGuid,
          editing: editTarget === ch.contentGuid,
        }"
        @click="emit('select-child', ch.instanceGuid)"
      >
        <div class="title">
          <strong>{{ ch.name }}</strong>
          <span class="badge">{{ ch.mode }}</span>
          <span v-if="ch.transform.useSymmetry" class="badge sym">sym</span>
        </div>
        <div class="meta">
          content {{ shortGuid(ch.contentGuid) }}
          · ({{ ch.transform.x.toFixed(2) }}, {{ ch.transform.y.toFixed(2) }})
          · ×{{ ch.transform.scale.toFixed(2) }}
        </div>
        <div class="actions" @click.stop>
          <button type="button" @click="emit('edit-child', ch.instanceGuid)">Edit</button>
          <button type="button" @click="emit('toggle-symmetry', ch.instanceGuid)">Sym</button>
          <button type="button" @click="emit('add-twin', ch.instanceGuid)">Twin</button>
          <button type="button" @click="emit('center', ch.instanceGuid)">Center</button>
          <button type="button" class="danger" @click="emit('remove-child', ch.instanceGuid)">
            ×
          </button>
        </div>
      </li>
      <li v-if="!children.length" class="empty">No sub-objects yet — attach from the library.</li>
    </ul>

    <div v-if="selected" class="xform">
      <h3>Placement</h3>
      <label>
        x
        <input
          type="number"
          step="0.01"
          :value="selected.transform.x"
          :disabled="selected.transform.snapCenterline"
          @change="
            emit('update-transform', selected.instanceGuid, {
              x: Number($event.target.value),
              snapCenterline: false,
            });
            emit('tessellate');
          "
        />
      </label>
      <label>
        y
        <input
          type="number"
          step="0.01"
          :value="selected.transform.y"
          @change="
            emit('update-transform', selected.instanceGuid, { y: Number($event.target.value) });
            emit('tessellate');
          "
        />
      </label>
      <label>
        rot Y°
        <input
          type="number"
          step="1"
          :value="selected.transform.rotationYDeg"
          @change="
            emit('update-transform', selected.instanceGuid, {
              rotationYDeg: Number($event.target.value),
            });
            emit('tessellate');
          "
        />
      </label>
      <label>
        bbox scale
        <input
          type="number"
          step="0.01"
          min="0.01"
          :value="selected.transform.scale"
          @change="
            emit('update-transform', selected.instanceGuid, { scale: Number($event.target.value) });
            emit('tessellate');
          "
        />
      </label>
    </div>

    <div class="attach">
      <h3>Attach from library</h3>
      <p v-if="!projects.length" class="hint">Save another spline first, then attach it here.</p>
      <div v-for="p in projects" :key="p.slug" class="proj">
        <span>{{ p.name || p.slug }}</span>
        <button type="button" @click="onAttach(p.slug, 'copy', false)">Copy</button>
        <button type="button" @click="onAttach(p.slug, 'copy', true)">Copy×2</button>
        <button type="button" @click="onAttach(p.slug, 'link', false)">Link</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.children {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  padding: 0.7rem 0.75rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: auto;
}
header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 400;
}
header p,
.hint {
  margin: 0.2rem 0 0;
  font-size: 0.7rem;
  color: var(--ink-dim);
}
code {
  font-size: 0.68rem;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.list li {
  padding: 0.45rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
}
.list li.active {
  border-color: rgba(126, 207, 106, 0.55);
}
.list li.editing {
  background: rgba(126, 207, 106, 0.08);
}
.empty {
  cursor: default;
  color: var(--ink-dim);
  font-size: 0.75rem;
}
.title {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.badge {
  font-size: 0.62rem;
  padding: 0.05rem 0.3rem;
  border-radius: 4px;
  border: 1px solid var(--line);
  color: var(--ink-dim);
}
.badge.sym {
  color: var(--accent-2);
}
.meta {
  font-size: 0.68rem;
  color: var(--ink-dim);
  margin-top: 0.15rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.35rem;
}
.actions button,
.row button,
.proj button {
  font-size: 0.68rem;
  padding: 0.2rem 0.4rem;
}
.danger {
  color: #ffb0a4;
}
.xform,
.attach {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  border-top: 1px solid var(--line);
  padding-top: 0.45rem;
}
.xform h3,
.attach h3 {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
}
.xform label {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.68rem;
  color: var(--ink-dim);
}
.proj {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  font-size: 0.75rem;
}
.proj span {
  flex: 1;
  min-width: 4rem;
}
button.active {
  border-color: rgba(126, 207, 106, 0.6);
}
</style>
