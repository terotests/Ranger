/**
 * reactflow_oracle.mjs — ask React Flow the questions RangerFlow is asked.
 *
 * Every value written here comes out of `@xyflow/system`, the package React
 * Flow is built on: `getBezierPath` and friends are the same functions a React
 * Flow app calls to draw an edge, and `getViewportForBounds` is the one
 * `fitView` uses. Nothing is transcribed, so nothing can be transcribed wrong.
 *
 *   node gallery/rangerflow/harness/oracles/reactflow_oracle.mjs
 *   → gallery/rangerflow/harness/out/reactflow.json
 *
 * The case ids are built by the same rules `tests/ParityDump.rgr` uses. They
 * are not shared through a file, so they can drift — which is why
 * `tools/parity.mjs` compares the two id sets and fails loudly when they do.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  getViewportForBounds,
  pointToRendererPoint,
  rendererPointToPoint,
  getNodesBounds,
  getRectsOverlappingArea,
} from "@xyflow/system";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "out", "reactflow.json");

// RangerFlow keeps sides as ints so a hot loop compares numbers; React Flow
// uses its Position strings. This is the one place the two vocabularies meet.
const SIDE = ["top", "right", "bottom", "left"];

/** The target offsets each side pair is tried at: ahead, behind, above, a
 *  near-overlap, and straight down — the cases where a router's control-point
 *  maths either holds or folds into a hairpin. */
const OFFSETS = [
  [250, 200],
  [-250, 200],
  [250, -200],
  [-40, 20],
  [0, 300],
];

const SOURCE = { x: 150, y: 120 };

const cases = [];

function pathCase(kind, s, t, i) {
  const [dx, dy] = OFFSETS[i];
  const args = {
    sourceX: SOURCE.x,
    sourceY: SOURCE.y,
    sourcePosition: SIDE[s],
    targetX: SOURCE.x + dx,
    targetY: SOURCE.y + dy,
    targetPosition: SIDE[t],
  };
  let result;
  if (kind === "bezier") result = getBezierPath(args);
  else if (kind === "straight") result = getStraightPath(args);
  else if (kind === "smoothstep") result = getSmoothStepPath(args);
  else if (kind === "step") result = getSmoothStepPath({ ...args, borderRadius: 0 });
  else throw new Error("unknown kind " + kind);
  const [d, labelX, labelY] = result;
  cases.push({
    id: `path:${kind}:${s}:${t}:${i}`,
    kind: "path",
    d,
    labelX,
    labelY,
  });
}

for (const kind of ["bezier", "straight", "step", "smoothstep"]) {
  for (let s = 0; s < 4; s += 1) {
    for (let t = 0; t < 4; t += 1) {
      for (let i = 0; i < OFFSETS.length; i += 1) pathCase(kind, s, t, i);
    }
  }
}

// --- viewport algebra -------------------------------------------------------
// `pointToRendererPoint` is RangerFlow's toFlowX/toFlowY, and
// `rendererPointToPoint` is toScreenX/toScreenY. If these disagree, every hit
// test in the editor lands somewhere the picture is not.
const TRANSFORMS = [
  [0, 0, 1],
  [40, -20, 2],
  [-315.5, 88.25, 0.4375],
  [1200, 900, 0.1],
];
const POINTS = [
  [0, 0],
  [100, 50],
  [-250.5, 725.25],
  [1919, 1079],
];

TRANSFORMS.forEach((tr, ti) => {
  POINTS.forEach((p, pi) => {
    const toFlow = pointToRendererPoint({ x: p[0], y: p[1] }, tr);
    const toScreen = rendererPointToPoint({ x: p[0], y: p[1] }, tr);
    cases.push({ id: `vp:toflow:${ti}:${pi}`, kind: "point", x: toFlow.x, y: toFlow.y });
    cases.push({ id: `vp:toscreen:${ti}:${pi}`, kind: "point", x: toScreen.x, y: toScreen.y });
  });
});

// `fitView`, which is where a padding convention either matches or quietly
// frames the diagram differently from the reference.
const BOUNDS = [
  { x: 0, y: 0, width: 200, height: 100 },
  { x: -400, y: -250, width: 1600, height: 900 },
  { x: 120.5, y: -37.25, width: 55, height: 800 },
  { x: 0, y: 0, width: 8000, height: 40 },
];
const SIZES = [
  [800, 400],
  [1440, 900],
  [320, 240],
];
const PADDINGS = [0, 0.1, 0.25];

BOUNDS.forEach((b, bi) => {
  SIZES.forEach((sz, si) => {
    PADDINGS.forEach((pad, pi) => {
      const v = getViewportForBounds(b, sz[0], sz[1], 0.1, 4, pad);
      cases.push({
        id: `vp:fit:${bi}:${si}:${pi}`,
        kind: "viewport",
        x: v.x,
        y: v.y,
        zoom: v.zoom,
      });
    });
  });
});

// --- bounds and box selection ----------------------------------------------
// React Flow's own node-bounds helper, and the overlap test its rectangle
// selection uses to decide what a dragged box caught.
const NODE_SETS = [
  [
    { id: "a", position: { x: 0, y: 0 }, width: 150, height: 40 },
    { id: "b", position: { x: 300, y: 120 }, width: 150, height: 40 },
  ],
  [
    { id: "a", position: { x: -80.5, y: 220.25 }, width: 220, height: 96 },
    { id: "b", position: { x: 640, y: -410 }, width: 80, height: 300 },
    { id: "c", position: { x: 90, y: 90 }, width: 10, height: 10 },
  ],
];
NODE_SETS.forEach((nodes, i) => {
  const b = getNodesBounds(nodes);
  cases.push({ id: `bounds:${i}`, kind: "rect", x: b.x, y: b.y, width: b.width, height: b.height });
});

const OVERLAPS = [
  [{ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 }],
  [{ x: 0, y: 0, width: 100, height: 100 }, { x: 100, y: 0, width: 100, height: 100 }],
  [{ x: 0, y: 0, width: 100, height: 100 }, { x: 120, y: 0, width: 100, height: 100 }],
  [{ x: 0, y: 0, width: 100, height: 100 }, { x: 10, y: 10, width: 10, height: 10 }],
  // Fractional, because React Flow rounds the area up and a whole-number case
  // would never say so.
  [{ x: 0, y: 0, width: 10.5, height: 10.5 }, { x: 5.25, y: 5.25, width: 10, height: 10 }],
];
OVERLAPS.forEach((pair, i) => {
  cases.push({
    id: `overlap:${i}`,
    kind: "scalar",
    value: getRectsOverlappingArea(
      pair[0].x, pair[0].y, pair[0].width, pair[0].height,
      pair[1].x, pair[1].y, pair[1].width, pair[1].height,
    ),
  });
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ source: "@xyflow/system", cases }, null, 1));
console.log(`  ${cases.length} reference values → ${path.relative(process.cwd(), OUT)}`);
