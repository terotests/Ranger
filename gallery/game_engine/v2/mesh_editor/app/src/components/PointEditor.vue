<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  knots: { type: Array, required: true },
  segments: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  selectedSegmentIndex: { type: Number, default: -1 },
  curveType: { type: Number, default: 0 },
  toolMode: { type: String, default: "edit" },
  viewMode: { type: String, default: "profile" },
});

const emit = defineEmits([
  "select",
  "select-segment",
  "update-knot",
  "update-segment",
  "remove-knot",
  "commit",
]);

const closed = computed(() => props.viewMode === "orbit");
const minKnots = computed(() => (closed.value ? 3 : 2));

/** Profile: top→bottom. Orbit: around the closed loop in knot order. */
const rows = computed(() => {
  const out = [];
  if (closed.value) {
    const n = props.knots.length;
    for (let i = 0; i < n; i++) {
      out.push({ kind: "knot", index: i, knot: props.knots[i] });
      out.push({ kind: "segment", index: i });
    }
    return out;
  }
  for (let i = props.knots.length - 1; i >= 0; i--) {
    out.push({ kind: "knot", index: i, knot: props.knots[i] });
    if (i > 0) out.push({ kind: "segment", index: i - 1 });
  }
  return out;
});

const expandedKey = ref(null);

watch(
  () => [props.selectedId, props.selectedSegmentIndex],
  () => {
    if (props.selectedId) expandedKey.value = "knot:" + props.selectedId;
    else if (props.selectedSegmentIndex >= 0) expandedKey.value = "seg:" + props.selectedSegmentIndex;
  },
);

function toggleDetails(key) {
  expandedKey.value = expandedKey.value === key ? null : key;
}

function onNum(id, key, ev) {
  const v = Number(ev.target.value);
  if (Number.isFinite(v)) {
    emit("update-knot", id, { [key]: v });
    emit("commit");
  }
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

function knotLabel(i) {
  if (closed.value) {
    if (i === 0) return "+X";
    return "pt";
  }
  if (i === 0) return "bottom";
  if (i === props.knots.length - 1) return "top";
  return "mid";
}

function segLabel(i) {
  if (!closed.value) return `seg ${i + 1}→${i + 2}`;
  const n = props.knots.length;
  const to = (i + 1) % n;
  return `seg ${i + 1}→${to + 1}`;
}
</script>

<template>
  <div class="point-editor">
    <header>
      <h2>
        {{ toolMode === "color" ? "Coloring" : viewMode === "orbit" ? "Orbit points" : "Points" }}
      </h2>
      <p v-if="viewMode === 'orbit'">
        Closed loop (canvas X→world X, Y→world Z). Color always editable; Details for numbers.
      </p>
      <p v-else>Top → bottom (matches the canvas). Color always editable; Details for numbers.</p>
    </header>

    <ul>
      <template v-for="row in rows" :key="row.kind + '-' + (row.knot?.id || row.index)">
        <!-- knot row -->
        <li
          v-if="row.kind === 'knot'"
          class="knot-row"
          :class="{ active: row.knot.id === selectedId }"
          @click="emit('select', row.knot.id)"
        >
          <div class="compact">
            <label class="swatch-wrap" @click.stop>
              <input
                type="color"
                :value="row.knot.color"
                @input="emit('update-knot', row.knot.id, { color: $event.target.value })"
              />
            </label>
            <div class="meta">
              <strong>#{{ row.index + 1 }}</strong>
              <span>{{ knotLabel(row.index) }}</span>
            </div>
            <button
              type="button"
              class="chip"
              title="x"
              @click.stop="toggleDetails('knot:' + row.knot.id)"
            >
              {{ row.knot.x.toFixed(2) }}
            </button>
            <button
              type="button"
              class="chip"
              title="y"
              @click.stop="toggleDetails('knot:' + row.knot.id)"
            >
              {{ row.knot.y.toFixed(2) }}
            </button>
            <button
              type="button"
              class="link"
              @click.stop="toggleDetails('knot:' + row.knot.id)"
            >
              {{ expandedKey === "knot:" + row.knot.id ? "Hide" : "Details" }}
            </button>
            <button
              type="button"
              class="danger icon"
              :disabled="knots.length <= minKnots"
              title="Remove"
              @click.stop="emit('remove-knot', row.knot.id)"
            >
              ×
            </button>
          </div>

          <div v-if="expandedKey === 'knot:' + row.knot.id" class="details" @click.stop>
            <div class="grid">
              <label class="field">
                x
                <input
                  type="number"
                  step="0.01"
                  :value="row.knot.x"
                  @change="onNum(row.knot.id, 'x', $event)"
                />
              </label>
              <label class="field">
                y
                <input
                  type="number"
                  step="0.01"
                  :value="row.knot.y"
                  @change="onNum(row.knot.id, 'y', $event)"
                />
              </label>
              <template v-if="curveType === 0">
                <label class="field">
                  hx
                  <input
                    type="number"
                    step="0.01"
                    :value="row.knot.hx"
                    @change="onNum(row.knot.id, 'hx', $event)"
                  />
                </label>
                <label class="field">
                  hy
                  <input
                    type="number"
                    step="0.01"
                    :value="row.knot.hy"
                    @change="onNum(row.knot.id, 'hy', $event)"
                  />
                </label>
              </template>
            </div>
          </div>
        </li>

        <!-- segment row (compact; expand for material) -->
        <li
          v-else
          class="seg-row"
          :class="{ active: selectedSegmentIndex === row.index }"
          @click="emit('select-segment', row.index)"
        >
          <div class="compact">
            <label class="swatch-wrap" @click.stop>
              <input
                type="color"
                :value="segments[row.index]?.color || knots[row.index]?.color || '#888888'"
                @input="emit('update-segment', row.index, { color: $event.target.value })"
              />
            </label>
            <div class="meta">
              <strong>{{ segLabel(row.index) }}</strong>
              <span
                >{{ segments[row.index]?.pathType || "bezier" }} ·
                {{ segments[row.index]?.texture || "gradient" }}</span
              >
            </div>
            <button
              type="button"
              class="chip"
              @click.stop="emit('update-segment', row.index, { color: null })"
            >
              gradient
            </button>
            <button
              type="button"
              class="link"
              @click.stop="toggleDetails('seg:' + row.index)"
            >
              {{ expandedKey === "seg:" + row.index ? "Hide" : "Details" }}
            </button>
          </div>

          <div v-if="expandedKey === 'seg:' + row.index" class="details" @click.stop>
            <div class="grid">
              <label class="field wide">
                Path type
                <select
                  :value="segments[row.index]?.pathType || 'bezier'"
                  @change="
                    emit('update-segment', row.index, { pathType: $event.target.value });
                    emit('commit');
                  "
                >
                  <option value="bezier">Bezier (cubic)</option>
                  <option value="line">Straight line</option>
                  <option value="arc">Circular arc</option>
                </select>
              </label>
              <label
                v-if="(segments[row.index]?.pathType || 'bezier') === 'arc'"
                class="field"
              >
                Arc bulge
                <input
                  type="number"
                  step="0.05"
                  :value="segments[row.index]?.arcBulge ?? ''"
                  placeholder="auto"
                  @change="
                    emit('update-segment', row.index, {
                      arcBulge:
                        $event.target.value === '' ? null : Number($event.target.value),
                    });
                    emit('commit');
                  "
                />
              </label>
              <label class="field">
                Roughness
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="segments[row.index]?.roughness ?? 0.4"
                  @change="onSegNum(row.index, 'roughness', $event)"
                />
              </label>
              <label class="field">
                Metalness
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="segments[row.index]?.metalness ?? 0"
                  @change="onSegNum(row.index, 'metalness', $event)"
                />
              </label>
              <label class="field">
                Opacity
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="segments[row.index]?.opacity ?? 1"
                  @change="onSegNum(row.index, 'opacity', $event)"
                />
              </label>
              <label class="field wide">
                Texture
                <select
                  :value="segments[row.index]?.texture || 'gradient'"
                  @change="emit('update-segment', row.index, { texture: $event.target.value })"
                >
                  <option value="gradient">Linear gradient</option>
                  <option value="none">Solid / none</option>
                  <option value="checker">Checker</option>
                  <option value="stripes">Stripes</option>
                  <option value="upload">Custom upload</option>
                </select>
              </label>
              <label
                v-if="(segments[row.index]?.texture || '') === 'upload'"
                class="field wide"
              >
                Image file
                <input type="file" accept="image/*" @change="onTextureFile(row.index, $event)" />
              </label>
            </div>
          </div>
        </li>
      </template>
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
  padding: 0.7rem 0.85rem 0.45rem;
  border-bottom: 1px solid var(--line);
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
}

p {
  margin: 0.15rem 0 0;
  color: var(--ink-dim);
  font-size: 0.72rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0.3rem;
  overflow: auto;
}

li {
  border-radius: 7px;
  border: 1px solid transparent;
  margin-bottom: 0.2rem;
  cursor: pointer;
}

li:hover {
  background: rgba(255, 255, 255, 0.03);
}

li.active {
  border-color: rgba(126, 207, 106, 0.4);
  background: rgba(126, 207, 106, 0.08);
}

.seg-row {
  background: rgba(0, 0, 0, 0.14);
}
.seg-row.active {
  border-color: rgba(110, 200, 255, 0.5);
  background: rgba(110, 200, 255, 0.08);
}

.compact {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto auto;
  gap: 0.3rem;
  align-items: center;
  padding: 0.28rem 0.4rem;
}

.seg-row .compact {
  grid-template-columns: auto 1fr auto auto;
}

.meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}
.meta strong {
  font-size: 0.78rem;
}
.meta span {
  font-size: 0.65rem;
  color: var(--ink-dim);
}

.swatch-wrap {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 0;
  margin: 0;
}
.swatch-wrap input[type="color"] {
  width: 160%;
  height: 160%;
  margin: -30%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.chip,
.link,
.danger.icon {
  font-size: 0.68rem;
  padding: 0.18rem 0.4rem;
  border-radius: 5px;
}

.chip {
  font-variant-numeric: tabular-nums;
  background: rgba(0, 0, 0, 0.25);
  border-color: transparent;
  color: var(--ink-dim);
}

.link {
  background: transparent;
  border-color: transparent;
  color: var(--accent-2);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.danger.icon {
  color: #ffb0a4;
  border-color: rgba(255, 122, 106, 0.3);
  width: 1.5rem;
  padding: 0.1rem 0;
}
.danger.icon:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.details {
  padding: 0.35rem 0.45rem 0.5rem;
  border-top: 1px solid var(--line);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.field.wide {
  grid-column: 1 / -1;
}
</style>
