# chart2part — 2D playfield chart → 3D parts

Place pinball parts in the 3D scene from a top-down **playfield chart**, measured
and **validated against the drawing** (not eyeballed).

The chart is an orthographic plan, so chart pixels map to world X,Z by one
uniform-scale similarity transform; height Y is assigned per part type. Parts are
built with SIGGRAPH-lineage operators (silhouette inflation / lathe / sweep /
extrude) and accepted only when their rendered silhouette matches the chart
(IoU ≥ 0.85).

## Files

| File | Role |
|---|---|
| `PROCESS.md` | full process + method references (measure → construct → validate) |
| `playfield_chart.json` | **data**: calibration landmarks + per-part **pixel** measurements (no world coords) |
| `transform.mjs` | **math**: similarity calibration + 2D→3D lift → world parts (shared) |
| `chartmeasure.mjs` | measurement microscope: `grid` or `crop` zoom to read chart pixels |
| `overlay.mjs` | validator: render vs chart overlay + per-part silhouette-IoU / error |

## Use

```bash
node chartmeasure.mjs <chart.jpg> grid 100                 # labeled grid to read landmarks
node chartmeasure.mjs <chart.jpg> crop <x> <y> <w> <h> <scale> <gridPx> out.png   # zoom a part
node -e "import('./transform.mjs').then(T=>...)"           # compute world parts from the JSON
node overlay.mjs                                           # build + validate placement vs chart
```

`build-pinball3d.mjs` injects the transformer's world parts into the scene guest,
so `pinball_live.tsx` carries **no hand-typed coordinates** — every position comes
from a chart pixel through `transform.mjs`.
