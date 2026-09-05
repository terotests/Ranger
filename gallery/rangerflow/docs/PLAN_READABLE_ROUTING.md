# Readable routing — the plan

Status: **steps 1–11 done** in `layout/ReadableRouter.rgr`, gated by
`statechart:viz:check` · what is left is in *Open* below · 2026-09-03

The routing was a stack of independent local passes:

```
LayeredLayout.run          places the nodes
StatechartGraph.faceEdges  picks a SIDE for each end
EdgeLanes.assign           spreads endpoints, picks tracks
lay.routeLongEdges         chains edges that skip layers
OrthoRouter.repairAll      pushes routes off nodes they cross
OrientedPorts.apply        sockets + perpendicular stubs
StatechartGraph.declutter  moves labels off each other
```

Each pass improved the picture and none of them could see the others. That was
the architectural finding behind everything below: **a later route did not
react to an earlier one**, so edges shared corridors, crossed at each other's
bends, and ran along node borders — each locally fine and globally unreadable.

The statechart pipeline is now:

```
LayeredLayout.run          places the nodes
StatechartGraph.faceEdges  picks a SIDE for each end            (still local)
ReadableRouter.route       sockets, lanes, halos, grid, every edge against
                           every route already drawn, conflict rounds
ReadableRouter.placeLabels each label beside its own edge, then an obstacle
ReadableRouter.finish      reroute through labels, simplify detours
```

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

All of it lives in `layout/ReadableRouter.rgr`; the numbers are its fields.

### 1–2 · Sides, sockets, perpendicular stubs

Sides are still `StatechartGraph.faceEdges` (see *Open*). Sockets are
`OrientedPorts.assignSockets`, and the stub is not searched at all: the search
starts at the stub's far end travelling along the normal and must reach the
target stub's far end travelling into it, so the first and last segments are
perpendicular by construction. On a diamond the line is run on to the outline,
because the socket sits on the bounding box and the shape does not.

### 3 · Departure lanes — `assignStubs`

Among the edges on one side heading the same way along it, the socket nearest
that way turns at `exitDistance` and each next one `fanOutStep` further out.
Ordered like that the fan never crosses itself, and no two siblings share the
corridor at the node.

```ts
exitDistance = 20   fanOutStep = 14
```

### 4–5 · Clearance halo

Every node is inflated by `nodeClearance` and a grid segment inside the inflated
rect is impassable, so a route can neither run closer than the clearance nor
turn inside it. Grazing the halo line is allowed — that IS the clearance. The
halo is given up in steps (20 → 10 → 4 → 0) only when a stub stands inside
another box's halo and no route exists at all.

```ts
nodeClearance = 20
```

### 6 · One global router — `search`

An orthogonal grid: the two stub ends, every halo's four sides, two lines
outside everything, and every gap split into lanes at least `minParallelGap`
wide. Dijkstra over `(cell, travel direction)` — direction, not axis, so a
reversal is impossible and the start and goal each have one forbidden way.
Edges are routed shortest first, and **every finished route is recorded**: the
next search is charged, per grid segment, for what it does to them.

### 7–8 · Crossings, junctions, corridors — `segmentExtra`, `turnExtraAt`

```
cost = distance
     + bends * 25
     + crossings * 200
     + crossing within 8 px of the other edge's bend or socket   + 500
     + turning within 8 px of another edge's line                + 500
     + parallel closer than 12 px:  2 per pixel of shared span
     + the same line:               + 8 per pixel
     + through a placed label       + 150
```

Then `conflictRounds` (3): each edge's conflict is its full cost minus its
length and bends; the most conflicted are lifted off the page one at a time,
routed again against everything else, and kept only if cheaper.

### 9–10 · Labels — `placeLabel`, `finish`

A label is tried beside every segment of its own edge, at three points along it,
on both sides, at four distances out. The score prefers a long segment, the
middle of the edge, and closeness; it charges a box by how much of it the label
covers (the shape, not its bounding box — a diamond's corners are empty),
another label likewise, another edge's line through the box heavily and near it
a little, and its own edge's other segments a little. Placed, the box is an
obstacle; an edge already drawn through somebody's label is routed again with
the labels on the page, and its own label placed again after.

The old `declutter` was measuring from `(0, 0)`: it read `EdgePath.midX` of a
path nobody had flattened. `midX` is now half way along by **length**, so the
anchor no longer moves with the zoom either.

### 11 · Simplify — `simplify`

Any two non-adjacent corners that can be joined straight or by one bend, without
entering a halo, without more bends, and with a lower total cost, are joined and
the detour between them dropped. Stubs are never touched.

## Open

- **Side assignment is still local.** `faceEdges` chooses left/right/top/bottom
  from the centre-to-centre vector before the router runs. `else` on
  `chatMachine` leaves the diamond's left and has to go round `error` because
  its corridor is full; from the bottom tip it would not. Step 1 of the pipeline
  wants the router to try the candidate sides and keep the cheapest.
- **Crossings.** `chatMachine` draws with six, none at a bend. Whether any of
  them can go is a question for side assignment and for the layout, not for the
  search.
- **A label with nowhere to go.** `ACCEPT_ALL, CLOSE_REVIEW [hasAcceptedActions]`
  has a 53-pixel segment between two boxes with a third above; every candidate
  covers something, and the least-covering one is taken. More room is a layout
  answer (`nodeGap`), or a narrower wrap.
- **The RangerFlow scenarios** still run `EdgeLanes` + `routeLongEdges` +
  `OrthoRouter.repairAll`. The router is opt-in; `rangerflow:test` covers it on
  its own graph (`testReadableRouter`) but the nine demos have not been moved.

## How it is measured

Every rule has a number the gate checks. `statechart:viz:check` prints and
holds:

| Metric | Where | Gate |
| --- | --- | --- |
| ends not leaving square | `OrientedPorts.faults(g)` | 0 |
| labels sitting on something | `StatechartGraph.clutter(g)` | ≤ before, and ≤ 1 on chat, 0 on the fixtures |
| every transition routed | `ReadableRouter.route` | all of them |
| edges through an unrelated node | `EdgeOverlap.nodeCrossings(g)` | 0 |
| turns inside a clearance halo | `ReadableRouter.haloTurns(g, 20)` | 0 |
| parallel segments closer than 12 px | `ReadableRouter.parallelClose(g, 12)` | 0 |
| crossings at another edge's bend | `ReadableRouter.crossingsAtBend(g, 8)` | 0 |
| labels crossed by another edge | `ReadableRouter.labelHits(g)` | 0 |
| edges crossing each other | `EdgeOverlap.edgeCrossings(g)` | ≤ 6 on chat, 0 on the fixtures |

**A rule with no metric is a preference.** The caps are what the router reaches
today with no room to spare, so a change that adds a crossing has to say so in
the gate.

## Where the code is

| | |
| --- | --- |
| `layout/ReadableRouter.rgr` | the router, the label placer, the simplifier, and the metrics |
| `core/GraphModel.rgr` | `FlowPort` (side + offset), `FlowEdge.portNudge*`, `labelDX/labelDY` |
| `core/EdgeRouter.rgr` | path building; `route()` uses `e.waypoints` verbatim when they exist; `midX/midY` half way by length |
| `layout/OrientedPorts.rgr` | sockets (used by the router) and the stub measure |
| `layout/OrthoRouter.rgr` | the heap and the grid helpers the router reuses; still the repair pass for the RangerFlow scenarios |
| `gallery/statechart/demo/statechart_viz.rgr` | the pipeline, and the metrics it prints |
| `gallery/statechart/tests/viz-check.mjs` | the gate |
| `tests/RangerFlowTest.rgr` · `testReadableRouter` | a fan of three, a box in the corridor, a label on every line |

The statechart drawing is the test case with the hardest geometry — ten boxes,
seventeen edges, six of them returning to one node — so work the rules against
`npm run statechart:viz` and keep `npm run rangerflow:test` (615 assertions)
green.
