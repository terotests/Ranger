# Readable routing — the plan

Status: **step 1–2 done** (oriented ports, perpendicular stubs) · steps 3–11 open
· 2026-09-03

The routing is currently a stack of independent local passes:

```
LayeredLayout.run          places the nodes
StatechartGraph.faceEdges  picks a SIDE for each end
EdgeLanes.assign           spreads endpoints, picks tracks
lay.routeLongEdges         chains edges that skip layers
OrthoRouter.repairAll      pushes routes off nodes they cross
OrientedPorts.apply        sockets + perpendicular stubs      ← new
StatechartGraph.declutter  moves labels off each other        ← new
```

Each pass improves the picture and none of them can see the others. That is the
architectural finding behind everything below: **a later route does not react to
an earlier one**, so edges end up sharing corridors, crossing at each other's
bends, and running along node borders — each of which is locally fine and
globally unreadable.

## The objective, in priority order

The router should optimise in **this order**, and readability comes before
shortest path:

1. Never intersect a node.
2. Leave and enter ports **perpendicularly**.
3. Maintain node clearance.
4. Avoid edge crossings.
5. Maintain separation between parallel unrelated edges.
6. Preserve distinct **fan-out lanes** for several sockets on one side.
7. Avoid labels, and keep a label clearly attached to its own edge.
8. Minimise bends.
9. Minimise total path length.
10. Simplify redundant orthogonal detours.

A cost function that expresses that, as a starting point:

```
cost = distance
     + bends       *  25
     + crossings   * 200
     + crossingAtAnotherEdgesBendOrSocket * 500
     + parallelProximity * 30
     + labelIntersection * 150
```

## The pipeline it should become

```
1.  assign sides
2.  assign sockets on each side
3.  determine departure lanes (fan-out)
4.  construct node exclusion zones (clearance halo)
5.  create routing corridors
6.  route edges
7.  detect conflicts
8.  reroute high-conflict edges
9.  place labels
10. reroute around labels if necessary
11. simplify paths
```

## Done

### 1–2 · Oriented ports and perpendicular stubs — `layout/OrientedPorts.rgr`

A port is a point **and** a direction. A side is a segment, not a point.

- Every rectangular node has four independent sides. Edges using the same side
  get several **sockets**, spread evenly along the usable length with a margin
  off each corner, ordered to match the spatial order of what they connect to.
- Every edge leaves its socket along the side's **outward normal** for
  `exitDistance` before it may turn, and arrives at the target socket along that
  side's normal. Hard constraint: simplification may merge a stub into a longer
  straight, never shorten one.

```
top → (0,-1)   right → (+1,0)   bottom → (0,+1)   left → (-1,0)

socket → straight perpendicular exit → bends → perpendicular entry → socket
```

Measured by `OrientedPorts.faults(g)`, printed by the statechart demo and gated
at **zero** by `npm run statechart:viz:check`.

### 9 (partly) · Labels moved off each other — `StatechartGraph.declutter`

Relaxation with label boxes, node boxes as immovable pushers, the short way out,
and a weak pull back to the edge's own line so a label settles just clear of what
it hit. On `chatMachine`: 120 labels sitting on something → 14.

## Open, in the order worth doing

### 3 · Departure lanes

Sockets are distinct but their **routes converge two pixels later**, so
distributing sockets does not by itself separate the lines.

```
socket A ─┐
socket B ─┤        ← what happens now
socket C ─┤
socket D ─┘
          │
```

> Each socket owns a short exclusive departure lane. Different sockets on the
> same side must stay separated for at least `fanOutDistance` before their
> routes may converge or cross.

```ts
exitDistance   = 16
fanOutDistance = 40
```

Cheapest implementation: stagger the turn distance per socket index, so siblings
turn at different distances and never share a corridor near the node.

### 4–5 · Node clearance halo, and no turning inside it

Routes currently turn immediately beside a node, and run close enough to a
border to read as part of the box:

```
┌──────────┐│
│          ││   ← the vertical is a different edge
└──────────┘│
```

> No edge may turn inside another node's clearance area, and no segment may run
> closer than `nodeClearance` to a node boundary, except for its own
> entry/exit stub.

```ts
nodeClearance = 20
```

### 6 · One global router instead of many local passes

Replace `EdgeLanes` + `routeLongEdges` + `OrthoRouter.repairAll` with a single
grid-based orthogonal search:

- Candidate lines: each node's `left-clearance` and `right+clearance` (and the
  same in y), plus every socket and exit/entry coordinate.
- A grid segment is blocked if it intersects an inflated node rect.
- A\* over `(xIndex, yIndex, direction)` so a bend is a state change and can be
  charged for.
- Route edges in a deterministic order, **recording each finished route** so the
  next one is charged `crossings` and `parallelProximity` against it. That is
  the whole point: later routes must see earlier ones.

### 7 · Crossings, and crossings at a bend

```
    │
────┼────    is this a junction or a crossing?
    │
```

A reader cannot tell. Crossings are expensive; a crossing at another edge's
bend, socket or junction should be effectively forbidden (`500`).

### 8 · Parallel separation

> Two unrelated edges must never occupy the same or nearly the same corridor.

```ts
minParallelEdgeGap = 12
```

### 9–10 · Labels as obstacles, and attached to their own edge

Two changes:

- A placed label's bounding box becomes a **routing obstacle**, so a later route
  does not run through it. (Today the label pass runs last and the router has
  never heard of it.)
- A label goes **beside the longest unobstructed segment of its own edge**, not
  at the geometric midpoint, and keeps more distance from neighbouring edges than
  from its own:

```
        LABEL                      ──────── other edge ────────
─────────────────  edge      not         LABEL
                                   ───────── own edge ─────────
```

`[hasSingleAction]` and `[hasMultipleActions]` in the chat drawing are the case
that shows why: a reader has to work out which of three lines each belongs to.

### 11 · Simplify

```
│
└──┐
   │      a detour that goes down, aside, and back the same way
┌──┘
│
```

> Remove redundant orthogonal detours whenever two non-adjacent segments can be
> connected without violating obstacles or port constraints.

Never at the cost of rule 2: a stub is not a detour.

## How it is measured

Every rule needs a number the gate can check, in the way `OrientedPorts.faults`
already is. The ones that exist:

| Metric | Where | Gate |
| --- | --- | --- |
| ends not leaving square | `OrientedPorts.faults(g)` | `statechart:viz:check`, must be 0 |
| labels sitting on something | `StatechartGraph.clutter(g)` | `statechart:viz:check`, must fall and stay under a cap |
| overlapping segment pairs | `EdgeOverlap.pairs(g, tol)` | printed by `rangerflow:demo` |
| edges through an unrelated node | `EdgeOverlap.nodeCrossings(g)` | printed by `rangerflow:demo` |
| edges crossing each other | `EdgeOverlap.edgeCrossings(g)` | printed by `rangerflow:demo` |

The ones still to write: turns inside a clearance halo, parallel segments closer
than `minParallelEdgeGap`, crossings at a bend, and labels intersecting an edge
that is not their own.

**A rule with no metric is a preference.** Add the metric with the rule, print it
from the demo, and gate it — that is what stopped the label pass and the port
pass from quietly regressing.

## Where the code is

| | |
| --- | --- |
| `core/GraphModel.rgr` | `FlowPort` (side + offset), `FlowEdge.portNudge*`, `labelDX/labelDY` |
| `core/EdgeRouter.rgr` | path building; `route()` uses `e.waypoints` verbatim when they exist |
| `layout/OrientedPorts.rgr` | sockets and stubs (done) |
| `layout/EdgeLanes.rgr` | today's endpoint spreading and track assignment |
| `layout/OrthoRouter.rgr` | today's repair pass |
| `gallery/statechart/demo/statechart_viz.rgr` | the pipeline as it stands, and the metrics it prints |
| `gallery/statechart/tests/viz-check.mjs` | the gate |

The statechart drawing is the test case with the hardest geometry — ten boxes,
seventeen edges, six of them returning to one node — so work the rules against
`npm run statechart:viz` and keep `npm run rangerflow:test` (601 assertions)
green, since the nine RangerFlow scenarios use the same routing.
