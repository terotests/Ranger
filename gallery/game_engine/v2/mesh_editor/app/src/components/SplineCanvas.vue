<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  knots: { type: Array, required: true },
  selectedId: { type: String, default: null },
  curveType: { type: Number, default: 0 },
  symmetry: { type: Boolean, default: true },
  viewport: { type: Object, required: true },
  sampleCurvePoints: { type: Function, required: true },
});

const emit = defineEmits(["select", "update-knot"]);

const canvasRef = ref(null);
const size = 560;
let dragging = null; // { id, mode: 'point'|'handle' }
let raf = 0;

const curvePts = computed(() => props.sampleCurvePoints(28));

function worldToScreen(x, y, w, h) {
  const { min, max } = props.viewport;
  const sx = ((x - min) / (max - min)) * w;
  const sy = ((max - y) / (max - min)) * h;
  return [sx, sy];
}

function screenToWorld(sx, sy, w, h) {
  const { min, max } = props.viewport;
  const x = min + (sx / w) * (max - min);
  const y = max - (sy / h) * (max - min);
  return [x, y];
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

  // atmosphere
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#141a16");
  g.addColorStop(1, "#0c100e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // unit square
  const [x0, y0] = worldToScreen(-1, 1, w, h);
  const [x1, y1] = worldToScreen(1, -1, w, h);
  ctx.strokeStyle = "rgba(180,210,170,0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  // grid
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

  // axis
  const [ax0, ay0] = worldToScreen(0, -1, w, h);
  const [ax1, ay1] = worldToScreen(0, 1, w, h);
  ctx.strokeStyle = "rgba(200,232,122,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax0, ay0);
  ctx.lineTo(ax1, ay1);
  ctx.stroke();

  // mirrored curve
  const pts = curvePts.value;
  if (props.symmetry && pts.length > 1) {
    ctx.strokeStyle = "rgba(110,200,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [sx, sy] = worldToScreen(-p.x, p.y, w, h);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
  }

  // main curve
  if (pts.length > 1) {
    ctx.strokeStyle = "#6ec8ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [sx, sy] = worldToScreen(p.x, p.y, w, h);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
  }

  // bezier handles / catmull direction
  props.knots.forEach((k, i) => {
    const [sx, sy] = worldToScreen(k.x, k.y, w, h);
    if (props.curveType === 0) {
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
    } else if (i > 0) {
      // catmull: show direction toward previous for last-but guidance
      const prev = props.knots[i - 1];
      const [px, py] = worldToScreen(prev.x, prev.y, w, h);
      ctx.strokeStyle = "rgba(255,180,84,0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawPoint(ctx, sx, sy, k.id === props.selectedId);

    if (props.symmetry && k.x > 0.001) {
      const [mx, my] = worldToScreen(-k.x, k.y, w, h);
      ctx.fillStyle = "rgba(110,200,255,0.35)";
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawPoint(ctx, x, y, selected) {
  ctx.beginPath();
  ctx.arc(x, y, selected ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fillStyle = selected ? "#c8e87a" : "#e8efe6";
  ctx.fill();
  ctx.strokeStyle = selected ? "#7ecf6a" : "rgba(0,0,0,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawHandle(ctx, x, y, selected) {
  ctx.beginPath();
  ctx.arc(x, y, selected ? 5 : 4, 0, Math.PI * 2);
  ctx.fillStyle = selected ? "#ffb454" : "rgba(255,180,84,0.85)";
  ctx.fill();
}

function hitTest(sx, sy) {
  const canvas = canvasRef.value;
  const w = size;
  const h = size;
  const thresh = 10;
  for (const k of props.knots) {
    if (props.curveType === 0) {
      const [hx, hy] = worldToScreen(k.x + k.hx, k.y + k.hy, w, h);
      if (Math.hypot(hx - sx, hy - sy) <= thresh) return { id: k.id, mode: "handle" };
    }
    const [px, py] = worldToScreen(k.x, k.y, w, h);
    if (Math.hypot(px - sx, py - sy) <= thresh) return { id: k.id, mode: "point" };
  }
  return null;
}

function onPointerDown(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const hit = hitTest(sx, sy);
  if (!hit) return;
  dragging = hit;
  emit("select", hit.id);
  canvasRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!dragging) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const [wx, wy] = screenToWorld(sx, sy, size, size);
  const k = props.knots.find((n) => n.id === dragging.id);
  if (!k) return;
  if (dragging.mode === "point") {
    emit("update-knot", dragging.id, { x: Math.max(0, wx), y: wy });
  } else {
    emit("update-knot", dragging.id, { hx: wx - k.x, hy: wy - k.y });
  }
}

function onPointerUp() {
  dragging = null;
}

function schedule() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);
}

watch(() => [props.knots, props.selectedId, props.curveType, props.symmetry, curvePts.value], schedule, {
  deep: true,
});

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
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
    <div class="legend">
      <span class="dot axis" /> axis
      <span class="dot curve" /> profile
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
