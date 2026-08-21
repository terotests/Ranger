/**
 * d3_force_oracle.mjs — run d3-force on the graph RangerFlow runs.
 *
 * The React Flow force-layout example is `@xyflow/react` wired to `d3-force`,
 * so the reference for `layout/ForceLayout.rgr` is d3 itself: same graph, same
 * forces in the same order, same parameters, ticked by hand the same number of
 * times.
 *
 *   node gallery/rangerflow/harness/oracles/d3_force_oracle.mjs
 *   → gallery/rangerflow/harness/out/d3_force.json
 *
 * Two things are deliberately NOT controlled for. d3 seeds its own LCG per
 * force and RangerFlow has one; and the quadtree extents differ (d3 doubles
 * from the first point inserted, RangerFlow squares the bounding box). Both
 * only matter through `jiggle` and the Barnes-Hut approximation, so the
 * comparison reports *how much* they matter rather than assuming they do not.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceX,
  forceY,
} from "d3-force";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "out", "d3_force.json");

/** The same graph `ParityDump.rgr` builds: a ternary tree with three cross
 *  links, which is the shape React Flow's example ships with. Generated from
 *  a rule rather than a literal so both sides can build it without a file. */
function buildGraph(n) {
  const nodes = [];
  for (let i = 0; i < n; i += 1) nodes.push({ id: "n" + i });
  const links = [];
  for (let k = 1; k < n; k += 1) {
    links.push({ source: "n" + Math.floor((k - 1) / 3), target: "n" + k });
  }
  links.push({ source: "n5", target: "n17" });
  links.push({ source: "n8", target: "n23" });
  links.push({ source: "n11", target: "n26" });
  return { nodes, links };
}

const N = 30;
const TICKS = [1, 10, 50, 300];

const { nodes, links } = buildGraph(N);

// The React Flow example's numbers: a strong charge, a long weak link, and a
// gentle pull to the origin on both axes.
const sim = forceSimulation(nodes)
  .force("charge", forceManyBody().strength(-1000))
  .force("link", forceLink(links).id((d) => d.id).strength(0.05).distance(150))
  .force("x", forceX().x(0).strength(0.08))
  .force("y", forceY().y(0).strength(0.08))
  .stop();

const frames = {};
let done = 0;
for (const at of TICKS) {
  while (done < at) {
    sim.tick();
    done += 1;
  }
  frames["t" + at] = nodes.map((nd) => ({ id: nd.id, x: nd.x, y: nd.y }));
}

// The starting positions too: d3's phyllotaxis is reproduced in
// `FlowSimulation.placeNodes`, and if THAT drifts every later frame is noise.
const seeded = buildGraph(N);
const sim0 = forceSimulation(seeded.nodes).stop();
frames.t0 = seeded.nodes.map((nd) => ({ id: nd.id, x: nd.x, y: nd.y }));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: "d3-force",
      graph: { nodes: N, links: links.length },
      params: { charge: -1000, linkDistance: 150, linkStrength: 0.05, axisStrength: 0.08 },
      ticks: [0, ...TICKS],
      frames,
    },
    null,
    1,
  ),
);
console.log(
  `  ${N} nodes, ${links.length} links, ticks ${[0, ...TICKS].join("/")} → ` +
    path.relative(process.cwd(), OUT),
);
