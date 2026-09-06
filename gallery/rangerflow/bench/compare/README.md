# RangerFlow vs React Flow — performance compare

```bash
npm run rangerflow:bench:compare          # 100, 500, 1000 nodes
npm run rangerflow:bench:compare -- 500   # one size
```

What it measures:

| Step | RangerFlow | React Flow stack |
| --- | --- | --- |
| Edge paths | `EdgeRouter` | `@xyflow/system` (`getBezierPath` …) |
| Force layout | `FlowSimulation` | `d3-force` (same graph) |
| Layered / scene / drag | EVG display list | — (DOM; not in Node) |

Behavioural parity (geometry match) is `npm run rangerflow:parity`, not this
meter. Output lands in `gallery/rangerflow/out/bench-compare.md`.
