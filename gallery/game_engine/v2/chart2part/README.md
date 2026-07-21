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
# measure
node chartmeasure.mjs <chart.jpg> grid 100                 # labeled grid to read landmarks
node chartmeasure.mjs <chart.jpg> crop <x> <y> <w> <h> <scale> <gridPx> out.png   # zoom a part

# build (injects the transformed world parts) + render at high DPR + validate
node ../web/build-pinball3d.mjs --out /tmp/pb
node valshot.mjs /tmp/pb /tmp/pb/val.png 2.5              # hi-res render (small parts → many px)
node overlay.mjs /tmp/pb/val.png                          # overlay vs chart + per-part IoU/err
```

The scene renders green fiducials at the table-plane corners; `overlay.mjs` reads
them to solve the exact world→pixel map, so the check needs no assumptions about
the camera. Flippers currently validate at **IoU 0.88 / 0.86, err_pos 0.02 wu**
(pass = IoU ≥ 0.85, err_pos < 0.15 wu).

`build-pinball3d.mjs` injects the transformer's world parts into the scene guest,
so `pinball_live.tsx` carries **no hand-typed coordinates** — every position comes
from a chart pixel through `transform.mjs`.
