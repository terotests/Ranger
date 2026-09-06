/**
 * reactflow_perf.mjs — the React Flow / d3 half of the performance meter.
 *
 * Measures what can be compared fairly in Node against RangerFlow's
 * `--bench --json` output:
 *
 *   edge paths   @xyflow/system getBezierPath / getStraightPath /
 *                getSmoothStepPath — the same 320 cases × 200 iters
 *   force layout d3-force on the SAME graph shape as rangerflow_demo
 *                (binary tree + cross links every 7th node), 300 ticks
 *   viewport     getViewportForBounds + pointToRendererPoint throughput
 *
 * Scene build and drag are DOM work in React Flow; those live in
 * gallery/rangerflow/bench/compare/browser/ and are scored separately.
 *
 *   node gallery/rangerflow/harness/oracles/reactflow_perf.mjs [N]
 *   → gallery/rangerflow/out/bench-reactflow.json
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
} from "@xyflow/system";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceX,
  forceY,
} from "d3-force";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT_DIR = path.join(ROOT, "out");
const OUT = path.join(OUT_DIR, "bench-reactflow.json");

const SIDE = ["top", "right", "bottom", "left"];
const OFFSETS = [
  [250, 200],
  [-250, 200],
  [250, -200],
  [-40, 20],
  [0, 300],
];
const SOURCE = { x: 150, y: 120 };
const PATH_ITERS = 200;

function buildGraph(n) {
  const nodes = [];
  for (let i = 0; i < n; i += 1) {
    nodes.push({ id: "n" + i, x: 0, y: 0 });
  }
  const links = [];
  for (let k = 1; k < n; k += 1) {
    links.push({ source: "n" + Math.floor(k / 2), target: "n" + k });
    if (k % 7 === 0) {
      links.push({ source: "n" + Math.floor(k / 3), target: "n" + k });
    }
  }
  return { nodes, links };
}

function benchPathsOnce() {
  for (let s = 0; s < 4; s += 1) {
    for (let t = 0; t < 4; t += 1) {
      for (let i = 0; i < OFFSETS.length; i += 1) {
        const [dx, dy] = OFFSETS[i];
        const args = {
          sourceX: SOURCE.x,
          sourceY: SOURCE.y,
          sourcePosition: SIDE[s],
          targetX: SOURCE.x + dx,
          targetY: SOURCE.y + dy,
          targetPosition: SIDE[t],
        };
        getBezierPath(args);
        getStraightPath(args);
        getSmoothStepPath({ ...args, borderRadius: 0 });
        getSmoothStepPath(args);
      }
    }
  }
}

function now() {
  return performance.now();
}

const n = Math.max(1, parseInt(process.argv[2] || "500", 10) || 500);
const { nodes, links } = buildGraph(n);

console.log(`== React Flow stack: benchmark, ${n} nodes ==`);
console.log(`  ${nodes.length} nodes, ${links.length} edges`);

const tPath0 = now();
for (let i = 0; i < PATH_ITERS; i += 1) benchPathsOnce();
const pathMs = now() - tPath0;
const pathCases = 320 * PATH_ITERS;
console.log(`  edge paths    ${pathMs.toFixed(1)} ms (${pathCases} paths)`);

const tForce0 = now();
const sim = forceSimulation(nodes)
  .force("charge", forceManyBody().strength(-400))
  .force(
    "link",
    forceLink(links)
      .id((d) => d.id)
      .distance(120)
  )
  .force("x", forceX().x(0).strength(0.1))
  .force("y", forceY().y(0).strength(0.1))
  .stop();
for (let i = 0; i < 300; i += 1) sim.tick();
const forceMs = now() - tForce0;
console.log(`  force layout  ${forceMs.toFixed(1)} ms (300 ticks)`);

const bounds = { x: 0, y: 0, width: 2000, height: 1200 };
const tVp0 = now();
let vpIters = 0;
while (now() - tVp0 < 50) {
  for (let i = 0; i < 1000; i += 1) {
    const vp = getViewportForBounds(bounds, 1600, 900, 0.1, 2, 0.05);
    const tr = [vp.x, vp.y, vp.zoom];
    pointToRendererPoint({ x: 100, y: 80 }, tr);
    rendererPointToPoint({ x: 400, y: 300 }, tr);
  }
  vpIters += 1000;
}
const viewportMs = now() - tVp0;
console.log(
  `  viewport ops  ${viewportMs.toFixed(1)} ms (${vpIters} getViewport+project rounds)`
);

const result = {
  engine: "reactflow",
  source: "@xyflow/system + d3-force",
  nodes: n,
  edges: links.length,
  path_ms: pathMs,
  path_cases: pathCases,
  force_ms: forceMs,
  force_ticks: 300,
  viewport_ms: viewportMs,
  viewport_iters: vpIters,
  // Not measured here — React Flow paints through the DOM.
  scene_fit_ms: null,
  drag_ms_per_frame: null,
  note: "scene/drag require the browser half (browser/)",
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`  wrote ${OUT}`);
