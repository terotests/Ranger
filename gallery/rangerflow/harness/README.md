# The parity harness

A scorecard we wrote from imagination would only measure our imagination. So
the reference answers here are not written down — they are **computed by React
Flow and by d3-force**, in this directory, from the same inputs RangerFlow is
given.

```text
harness/oracles/reactflow_oracle.mjs   @xyflow/system  →  out/reactflow.json
harness/oracles/d3_force_oracle.mjs    d3-force        →  out/d3_force.json
tests/ParityDump.rgr                   RangerFlow      →  out/rangerflow.json
                                              ↓
                              tools/parity.mjs  →  docs/PARITY.md
```

`@xyflow/system` is the package React Flow itself builds on, and the functions
compared — `getBezierPath`, `getSmoothStepPath`, `getStraightPath`,
`getViewportForBounds`, `pointToRendererPoint`, `rendererPointToPoint` — are
the *same functions* a React Flow app calls. There is no reimplementation in
the middle to be wrong about.

## Install

```bash
npm run rangerflow:parity          # installs on first run, then measures
cd gallery/rangerflow/harness && npm install    # or do it by hand
```

The dependencies are **not** vendored and the generated `out/` is **not**
committed: an oracle you cannot regenerate is a number you have to trust.

## Offline

Without a registry the oracle files cannot be produced. `npm run
rangerflow:parity` then reports what is missing and scores only the behavioural
half, rather than pretending the geometry was checked.
