<script setup>
import { ref } from "vue";

defineProps({
  lib: { type: Object, required: true },
});

const emit = defineEmits([
  "refresh",
  "load",
  "save",
  "save-as",
  "remove",
  "export",
  "import-file",
]);

const fileRef = ref(null);

function onFile(ev) {
  const f = ev.target.files?.[0];
  if (f) emit("import-file", f);
  ev.target.value = "";
}
</script>

<template>
  <aside class="library">
    <header>
      <h2>Library</h2>
      <p v-if="lib.available" class="path" :title="lib.root">
        v{{ lib.schemaVersion }} · {{ lib.root }}
      </p>
      <p v-else class="path warn">{{ lib.status || "Library offline" }}</p>
    </header>

    <div class="save-row">
      <input
        v-model="lib.saveAsName"
        type="text"
        placeholder="Name (e.g. tall vase)"
        @keyup.enter="emit('save-as', lib.saveAsName)"
      />
      <button type="button" class="primary" :disabled="lib.busy" @click="emit('save-as', lib.saveAsName)">
        Save as
      </button>
      <button
        type="button"
        :disabled="lib.busy || !lib.currentSlug"
        @click="emit('save')"
      >
        Save
      </button>
    </div>

    <div class="row-actions">
      <button type="button" :disabled="lib.busy" @click="emit('refresh')">Refresh</button>
      <button type="button" @click="emit('export', lib.saveAsName)">Export JSON</button>
      <button type="button" @click="fileRef?.click()">Import JSON</button>
      <input ref="fileRef" type="file" accept="application/json,.json" hidden @change="onFile" />
    </div>

    <p v-if="lib.currentSlug" class="current">
      Editing <strong>{{ lib.currentName }}</strong>
      <span class="slug">{{ lib.currentSlug }}</span>
    </p>

    <ul class="list">
      <li v-if="!lib.projects.length" class="empty">No saved splines yet.</li>
      <li
        v-for="p in lib.projects"
        :key="p.slug"
        :class="{ active: p.slug === lib.currentSlug, bad: !!p.error }"
      >
        <button type="button" class="open" :disabled="!!p.error" @click="emit('load', p.slug)">
          <strong>{{ p.name || p.slug }}</strong>
          <span>{{ p.error || `${p.knotCount || "?"} pts · ${p.updatedAt?.slice(0, 19) || ""}` }}</span>
        </button>
        <button
          type="button"
          class="danger"
          title="Delete"
          :disabled="lib.busy"
          @click="emit('remove', p.slug)"
        >
          ×
        </button>
      </li>
    </ul>

    <p class="hint">{{ lib.status }}</p>
  </aside>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.7rem 0.75rem;
  gap: 0.55rem;
}

header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
}

.path {
  margin: 0.2rem 0 0;
  font-size: 0.65rem;
  color: var(--ink-dim);
  word-break: break-all;
}
.path.warn {
  color: #ffb0a4;
}

.save-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.35rem;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.current {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-dim);
}
.current .slug {
  margin-left: 0.35rem;
  opacity: 0.7;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  min-height: 4rem;
  flex: 1;
}

li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.25rem;
  border-radius: 7px;
  border: 1px solid transparent;
  padding: 0.15rem;
}
li.active {
  border-color: rgba(126, 207, 106, 0.4);
  background: rgba(126, 207, 106, 0.08);
}
li.bad {
  opacity: 0.7;
}
li.empty {
  display: block;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--ink-dim);
}

.open {
  text-align: left;
  background: transparent;
  border: none;
  padding: 0.35rem 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.open strong {
  font-size: 0.82rem;
}
.open span {
  font-size: 0.65rem;
  color: var(--ink-dim);
}

.danger {
  width: 1.6rem;
  padding: 0.15rem 0;
  color: #ffb0a4;
  border-color: rgba(255, 122, 106, 0.3);
}

.hint {
  margin: 0;
  font-size: 0.68rem;
  color: var(--ink-dim);
}
</style>
