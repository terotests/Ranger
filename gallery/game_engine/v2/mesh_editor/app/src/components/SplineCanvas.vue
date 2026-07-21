<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  knots: { type: Array, required: true },
  segments: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  selectedSegmentIndex: { type: Number, default: -1 },
  curveType: { type: Number, default: 0 },
  symmetry: { type: Boolean, default: true },
  toolMode: { type: String, default: "edit" },
  viewport: { type: Object, required: true },
  sampleCurvePoints: { type: Function, required: true },
  findClosestOnCurve: { type: Function, required: true },
});

const emit = defineEmits(["select", "select-segment", "update-knot", "add-on-curve", "drag-end"]);

const canvasRef = ref(null);
const size = 560;
let dragging = null;
let raf = 0;
const hoverAdd = ref(null);

const curvePts = computed(() => props.sampleCurvePoints(28));

function worldToScreen(x, y, w, h) {
  const { min, max } = props.viewport;
  return [((x - min) / (max - min)) * w, ((max - y) / (max - min)) * h];
}

function screenToWorld(sx, sy, w, h) {
  const { min, max } = props.viewport;
  return [min + (sx / w) * (max - min), max - (sy / h) * (max - min)];
}

function drawGradientStroke(ctx, pts, getColor, w, h) {
  if (pts.length < 2) return;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const [x0, y0] = worldToScreen(a.x, a.y, w, h);
    const [x1, y1] = worldToScreen(b.x, b.y, w, h);
    ctx.strokeStyle = getColor(a, b, i);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

function segmentColor(segIndex) {
  const seg = props.segments[segIndex];
  if (seg?.color) return seg.color;
  const a = props.knots[segIndex];
  const b = props.knots[segIndex + 1];
  return a?.color || "#6ec8ff";
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = size;
  const h = size;
  if (canvas.width !== w * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#141a16");
  g.addColorStop(1, "#0c100e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const [x0, y0] = worldToScreen(-1, 1, w, h);
  const [x1, y1] = worldToScreen(1, -1, w, h);
  ctx.strokeStyle = "rgba(180,210,170,0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  ctx.strokeStyle = "rgba(180,210,170,0.08)";
  for (let v = -1; v <= 1; v += 0.5) {
    const [gx] = worldToScreen(v, 0, w, h);
    const [, gy] = worldToScreen(0, v, w, h);
    ctx.beginPath();
    ctx.moveTo(gx, y0);
    ctx.lineTo(gx, y1);
    ctx.moveTo(x0, gy);
    ctx.lineTo(x1, gy);
    ctx.stroke();
  }

  const [ax0, ay0] = worldToScreen(0, -1, w, h);
  const [ax1, ay1] = worldToScreen(0, 1, w, h);
  ctx.strokeStyle = "rgba(200,232,122,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax0, ay0);
  ctx.lineTo(ax1, ay1);
  ctx.stroke();

  const pts = curvePts.value;

  if (props.symmetry && pts.length > 1) {
    ctx.lineWidth = 2;
    drawGradientStroke(
      ctx,
      pts.map((p) => ({ ...p, x: -p.x })),
      (a) => {
        const c = segmentColor(a.segmentIndex ?? 0);
        return c.length === 7 ? c + "59" : "rgba(110,200,255,0.35)";
      },
      w,
      h,
    );
  }

  if (pts.length > 1) {
    ctx.lineWidth = props.toolMode === "color" ? 4 : 2.5;
    drawGradientStroke(
      ctx,
      pts,
      (a) => {
        const idx = a.segmentIndex ?? 0;
        if (props.toolMode === "color" && idx === props.selectedSegmentIndex) return "#ffffff";
        return segmentColor(idx);
      },
      w,
      h,
    );
  }

  // segment hit markers in color mode
  if (props.toolMode === "color") {
    for (let i = 0; i < props.knots.length - 1; i++) {
      const mid = evalMid(i);
      if (!mid) continue;
      const [sx, sy] = worldToScreen(mid.x, mid.y, w, h);
      ctx.beginPath();
      ctx.arc(sx, sy, i === props.selectedSegmentIndex ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = segmentColor(i);
      ctx.fill();
      ctx.strokeStyle = i === props.selectedSegmentIndex ? "#fff" : "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  props.knots.forEach((k, i) => {
    const [sx, sy] = worldToScreen(k.x, k.y, w, h);
    if (props.curveType === 0 && props.toolMode === "edit") {
      const [hx, hy] = worldToScreen(k.x + k.hx, k.y + k.hy, w, h);
      const [ix, iy] = worldToScreen(k.x - k.hx, k.y - k.hy, w, h);
      ctx.strokeStyle = "rgba(255,180,84,0.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      drawHandle(ctx, hx, hy, k.id === props.selectedId);
      drawHandle(ctx, ix, iy, false);
    }
    drawPoint(ctx, sx, sy, k.id === props.selectedId, k.color);

    if (props.symmetry && k.x > 0.001) {
      const [mx, my] = worldToScreen(-k.x, k.y, w, h);
      ctx.fillStyle = "rgba(110,200,255,0.35)";
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  if (props.toolMode === "add" && hoverAdd.value) {
    const [sx, sy] = worldToScreen(hoverAdd.value.x, hoverAdd.value.y, w, h);
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,232,122,0.9)";
    ctx.fill();
    ctx.strokeStyle = "#7ecf6a";
    ctx.stroke();
  }
}

function evalMid(segIndex) {
  const pts = curvePts.value.filter((p) => p.segmentIndex === segIndex);
  if (!pts.length) return null;
  return pts[(pts.length / 2) | 0];
}

function drawPoint(ctx, x, y, selected, color) {
  ctx.beginPath();
  ctx.arc(x, y, selected ? 8 : 6, 0, Math.PI * 2);
  ctx.fillStyle = color || (selected ? "#c8e87a" : "#e8efe6");
  ctx.fill();
  ctx.strokeStyle = selected ? "#ffffff" : "rgba(0,0,0,0.45)";
  ctx.lineWidth = selected ? 2 : 1.5;
  ctx.stroke();
}

function drawHandle(ctx, x, y, selected) {
  ctx.beginPath();
  ctx.arc(x, y, selected ? 5 : 4, 0, Math.PI * 2);
  ctx.fillStyle = selected ? "#ffb454" : "rgba(255,180,84,0.85)";
  ctx.fill();
}

function hitTestPoint(sx, sy) {
  const thresh = 10;
  for (const k of props.knots) {
    if (props.curveType === 0 && props.toolMode === "edit") {
      const [hx, hy] = worldToScreen(k.x + k.hx, k.y + k.hy, size, size);
      if (Math.hypot(hx - sx, hy - sy) <= thresh) return { id: k.id, mode: "handle" };
    }
    const [px, py] = worldToScreen(k.x, k.y, size, size);
    if (Math.hypot(px - sx, py - sy) <= thresh) return { id: k.id, mode: "point" };
  }
  return null;
}

function hitTestSegment(sx, sy) {
  const thresh = 12;
  for (let i = 0; i < props.knots.length - 1; i++) {
    const mid = evalMid(i);
    if (!mid) continue;
    const [mx, my] = worldToScreen(mid.x, mid.y, size, size);
    if (Math.hypot(mx - sx, my - sy) <= thresh) return i;
  }
  return -1;
}

function onPointerDown(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const [wx, wy] = screenToWorld(sx, sy, size, size);

  if (props.toolMode === "add") {
    emit("add-on-curve", Math.max(0, wx), wy);
    return;
  }

  if (props.toolMode === "color") {
    const pt = hitTestPoint(sx, sy);
    if (pt) {
      emit("select", pt.id);
      return;
    }
    const seg = hitTestSegment(sx, sy);
    if (seg >= 0) {
      emit("select-segment", seg);
      return;
    }
    return;
  }

  const hit = hitTestPoint(sx, sy);
  if (!hit) return;
  dragging = hit;
  emit("select", hit.id);
  canvasRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const [wx, wy] = screenToWorld(sx, sy, size, size);

  if (props.toolMode === "add") {
    hoverAdd.value = props.findClosestOnCurve(Math.max(0, wx), wy, 0.14);
    schedule();
    return;
  }

  if (!dragging || props.toolMode !== "edit") return;
  const k = props.knots.find((n) => n.id === dragging.id);
  if (!k) return;
  if (dragging.mode === "point") {
    emit("update-knot", dragging.id, { x: Math.max(0, wx), y: wy });
  } else {
    emit("update-knot", dragging.id, { hx: wx - k.x, hy: wy - k.y });
  }
}

function onPointerUp() {
  if (dragging && props.toolMode === "edit") {
    emit("drag-end");
  }
  dragging = null;
}

function schedule() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);
}

watch(
  () => [
    props.knots,
    props.segments,
    props.selectedId,
    props.selectedSegmentIndex,
    props.curveType,
    props.symmetry,
    props.toolMode,
    curvePts.value,
    hoverAdd.value,
  ],
  schedule,
  { deep: true },
);

onMounted(() => {
  schedule();
  window.addEventListener("resize", schedule);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", schedule);
});
</script>

<template>
  <div class="spline-wrap">
    <canvas
      ref="canvasRef"
      class="spline-canvas"
      :class="toolMode"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
    <div class="legend">
      <span class="dot axis" /> axis
      <span class="dot curve" /> profile / gradient
      <span class="dot handle" /> Bezier handle
    </div>
  </div>
</template>

<style scoped>
.spline-wrap {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
}

.spline-canvas {
  width: min(100%, 560px);
  height: auto;
  aspect-ratio: 1;
  border-radius: 14px;
  border: 1px solid var(--line);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  touch-action: none;
  cursor: crosshair;
}
.spline-canvas.add {
  cursor: copy;
}
.spline-canvas.color {
  cursor: pointer;
}

.legend {
  display: flex;
  gap: 0.9rem;
  margin-top: 0.65rem;
  font-size: 0.72rem;
  color: var(--ink-dim);
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.3rem;
}
.dot.axis {
  background: var(--accent-2);
}
.dot.curve {
  background: var(--curve);
}
.dot.handle {
  background: var(--handle);
}
</style>
