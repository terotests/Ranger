// Self-contained micro-benchmark that mirrors the hot interpreter path used by
// the "ar" (Arctic Rush) game's level/field initialization:
//   - module-level const arrays of object literals
//   - a while-loop road solver with member access, arithmetic and Math.sin
//   - building result arrays with push over the whole world height
//   - nested loops that build many small entity objects
//
// It intentionally uses NO native/host functions so it measures the pure
// ComponentEngine (TS interpreter) evaluation cost.

const WORLD_H = 6000;
const ROAD_CACHE_STEP = 8;
const BASE_W = 480;

const ROAD_POINTS = [
  { y: 6000, x: 240, half: 106, zone: 0 },
  { y: 5800, x: 170, half: 104, zone: 0 },
  { y: 5580, x: 310, half: 100, zone: 0 },
  { y: 5360, x: 185, half: 98, zone: 0 },
  { y: 5140, x: 300, half: 94, zone: 0 },
  { y: 4920, x: 220, half: 92, zone: 0 },
  { y: 4700, x: 150, half: 84, zone: 1 },
  { y: 4480, x: 315, half: 82, zone: 1 },
  { y: 4260, x: 190, half: 80, zone: 1 },
  { y: 4040, x: 325, half: 78, zone: 1 },
  { y: 3820, x: 205, half: 82, zone: 1 },
  { y: 3600, x: 285, half: 86, zone: 1 },
  { y: 3380, x: 165, half: 102, zone: 2 },
  { y: 3160, x: 310, half: 106, zone: 2 },
  { y: 2940, x: 190, half: 102, zone: 2 },
  { y: 2720, x: 325, half: 98, zone: 2 },
  { y: 2500, x: 180, half: 96, zone: 2 },
  { y: 2280, x: 285, half: 92, zone: 2 },
  { y: 2060, x: 145, half: 76, zone: 3 },
  { y: 1840, x: 325, half: 72, zone: 3 },
  { y: 1620, x: 175, half: 70, zone: 3 },
  { y: 1400, x: 315, half: 72, zone: 3 },
  { y: 1180, x: 190, half: 74, zone: 3 },
  { y: 960, x: 305, half: 76, zone: 3 },
  { y: 740, x: 165, half: 78, zone: 3 },
  { y: 520, x: 300, half: 82, zone: 3 },
  { y: 300, x: 195, half: 86, zone: 3 },
  { y: 100, x: 240, half: 92, zone: 3 }
];

function clamp(v, lo, hi) {
  if (v < lo) { return lo; }
  if (v > hi) { return hi; }
  return v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function scaleX(v) {
  return (v * BASE_W) / BASE_W;
}

function computeRoadAtRaw(y) {
  let i = 0;
  while (i < ROAD_POINTS.length - 1) {
    const a = ROAD_POINTS[i];
    const b = ROAD_POINTS[i + 1];

    if (y <= a.y && y >= b.y) {
      const span = a.y - b.y;
      const t = span == 0 ? 0 : (a.y - y) / span;
      const progress = WORLD_H - y;

      const wave =
        Math.sin(progress * 0.0105) * 38 +
        Math.sin(progress * 0.0042 + 1.2) * 22;

      const half = scaleX(lerp(a.half, b.half, t));
      const rawCenter = scaleX(lerp(a.x, b.x, t) + wave);

      return {
        center: clamp(rawCenter, half + scaleX(18), BASE_W - half - scaleX(18)),
        half: half,
        zone: t < 0.5 ? a.zone : b.zone
      };
    }
    i = i + 1;
  }

  const last = ROAD_POINTS[ROAD_POINTS.length - 1];
  const half = scaleX(last.half);
  return {
    center: clamp(scaleX(last.x), half + scaleX(18), BASE_W - half - scaleX(18)),
    half: half,
    zone: last.zone
  };
}

// Mirrors ensureRoadCache(): build three parallel arrays over the world.
function buildRoadCache() {
  const center = [];
  const halfArr = [];
  const zone = [];

  let y = 0;
  while (y <= WORLD_H + ROAD_CACHE_STEP) {
    const r = computeRoadAtRaw(y);
    center.push(r.center);
    halfArr.push(r.half);
    zone.push(r.zone);
    y = y + ROAD_CACHE_STEP;
  }

  return { center: center, half: halfArr, zone: zone };
}

// Mirrors placeEntities(): build many small entity objects in nested loops.
function buildEntities(cache) {
  const entities = [];
  const n = cache.center.length;

  let i = 0;
  while (i < n) {
    const c = cache.center[i];
    const h = cache.half[i];
    entities.push({
      x: c,
      y: i * ROAD_CACHE_STEP,
      left: c - h,
      right: c + h,
      visible: (i % 2) == 0 ? 1 : 0
    });
    i = i + 1;
  }

  return entities;
}

// One "level init": build the road cache and the entity list, return a checksum
// so nothing gets optimized away.
function initLevel() {
  const cache = buildRoadCache();
  const entities = buildEntities(cache);

  let sum = 0;
  let i = 0;
  while (i < entities.length) {
    const e = entities[i];
    sum = sum + e.x + e.left + e.right + e.visible;
    i = i + 1;
  }

  return sum | 0;
}
