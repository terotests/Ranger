<script setup>
defineProps({
  knots: { type: Array, required: true },
  segments: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  selectedSegmentIndex: { type: Number, default: -1 },
  curveType: { type: Number, default: 0 },
  toolMode: { type: String, default: "edit" },
});

const emit = defineEmits([
  "select",
  "select-segment",
  "update-knot",
  "update-segment",
  "remove-knot",
]);

function onNum(id, key, ev) {
  const v = Number(ev.target.value);
  if (Number.isFinite(v)) emit("update-knot", id, { [key]: v });
}

function onSegNum(index, key, ev) {
  const v = Number(ev.target.value);
  if (Number.isFinite(v)) emit("update-segment", index, { [key]: v });
}

async function onTextureFile(index, ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const bmp = await createImageBitmap(file);
  const w = Math.min(128, bmp.width);
  const h = Math.min(128, bmp.height);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(bmp, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  emit("update-segment", index, {
    texture: "upload",
    textureData: { rgba: img.data.slice(), w, h, name: file.name },
  });
}
</script>

<template>
  <div class="point-editor">
    <header>
      <h2>{{ toolMode === "color" ? "Coloring" : "Points" }}</h2>
      <p v-if="toolMode !== 'color'">Right-side profile (x ≥ 0). Remove from the list.</p>
      <p v-else>Knot colors form a linear gradient; segments can override material.</p>
    </header>

    <ul>
      <li
        v-for="(k, i) in knots"
        :key="k.id"
        :class="{ active: k.id === selectedId }"
        @click="emit('select', k.id)"
      >
        <div class="row-title">
          <strong>
            <span class="swatch" :style="{ background: k.color }" />
            #{{ i + 1 }}
          </strong>
          <span>{{ i === 0 ? "bottom" : i === knots.length - 1 ? "top" : "mid" }}</span>
        </div>

        <div v-if="toolMode === 'color'" class="grid">
          <label class="field wide">
            Knot color
            <input
              type="color"
              :value="k.color"
              @input="emit('update-knot', k.id, { color: $event.target.value })"
            />
          </label>
        </div>
        <div v-else class="grid">
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

        <div class="row-actions">
          <button
            type="button"
            class="danger"
            :disabled="knots.length <= 2"
            @click.stop="emit('remove-knot', k.id)"
          >
            Remove
          </button>
        </div>

        <!-- segment after this knot -->
        <div
          v-if="i < knots.length - 1 && toolMode === 'color'"
          class="segment"
          :class="{ active: selectedSegmentIndex === i }"
          @click.stop="emit('select-segment', i)"
        >
          <div class="row-title">
            <strong>Segment {{ i + 1 }}→{{ i + 2 }}</strong>
            <span class="swatch" :style="{ background: segments[i]?.color || k.color }" />
          </div>
          <div class="grid">
            <label class="field wide">
              Segment color
              <div class="color-row">
                <input
                  type="color"
                  :value="segments[i]?.color || k.color"
                  @input="emit('update-segment', i, { color: $event.target.value })"
                />
                <button type="button" @click.stop="emit('update-segment', i, { color: null })">
                  Use gradient
                </button>
              </div>
            </label>
            <label class="field">
              Roughness
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                :value="segments[i]?.roughness ?? 0.4"
                @change="onSegNum(i, 'roughness', $event)"
              />
            </label>
            <label class="field">
              Metalness
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                :value="segments[i]?.metalness ?? 0"
                @change="onSegNum(i, 'metalness', $event)"
              />
            </label>
            <label class="field">
              Opacity
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                :value="segments[i]?.opacity ?? 1"
                @change="onSegNum(i, 'opacity', $event)"
              />
            </label>
            <label class="field wide">
              Texture
              <select
                :value="segments[i]?.texture || 'gradient'"
                @change="emit('update-segment', i, { texture: $event.target.value })"
              >
                <option value="gradient">Linear gradient</option>
                <option value="none">Solid / none</option>
                <option value="checker">Checker</option>
                <option value="stripes">Stripes</option>
                <option value="upload">Custom upload</option>
              </select>
            </label>
            <label v-if="(segments[i]?.texture || '') === 'upload'" class="field wide">
              Image file
              <input type="file" accept="image/*" @change="onTextureFile(i, $event)" />
            </label>
          </div>
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
  align-items: center;
  margin-bottom: 0.45rem;
  font-size: 0.8rem;
  color: var(--ink-dim);
  gap: 0.4rem;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  vertical-align: -1px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.field.wide {
  grid-column: 1 / -1;
}

.row-actions {
  margin-top: 0.45rem;
}

button.danger {
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  color: #ffb0a4;
  border-color: rgba(255, 122, 106, 0.35);
}

button.danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.segment {
  margin-top: 0.55rem;
  padding: 0.55rem;
  border-radius: 8px;
  border: 1px dashed rgba(180, 210, 170, 0.25);
  background: rgba(0, 0, 0, 0.18);
}

.segment.active {
  border-style: solid;
  border-color: rgba(110, 200, 255, 0.55);
}

.color-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.color-row input[type="color"] {
  width: 2.4rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
}

.color-row button {
  font-size: 0.72rem;
  padding: 0.3rem 0.5rem;
}
</style>
