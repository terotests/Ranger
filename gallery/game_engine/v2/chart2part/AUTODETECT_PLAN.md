# Plan: auto-detect non-circular parts (slingshots, targets, guide wires)

## Why

The bumpers only landed once I **stopped eyeballing** and detected their centers
with a Hough circle vote. Everything else (slingshot triangles, guide-wire
splines) is still hand-read off a blurry, cluttered scan — and that keeps landing
wrong. This plan extends the same "detect from the chart, don't eyeball" idea to
polygon and polyline parts.

It also fixes the deeper flaw the bumpers exposed: the silhouette-IoU check is
**circular** (render vs. our own measurement), so it can't catch a bad
measurement — only a check against a *chart-derived* feature can. Auto-detection
makes the measurement chart-derived, and we add a chart-feature IoU on top.

## Scope / order

1. **Slingshot rebound triangles (E)** — corner detection. *Primary goal.*
2. **Standup targets (25)** — small blobs (reuse disc/blob detection).
3. **Rollover-insert grid (13)** — array of small circles (reuse Hough circle).
4. **Guide wires (14/15/16)** — polyline/spline tracing.

Do them in that order; each reuses the harness from the previous.

---

## Part A — triangle corners (slingshots)

A rebound triangle in the chart has **three corner posts** (small filled dark
discs) and **three edges** (the rebound line + the dashed light-shield). Two
independent detectors, cross-checked:

### A1. Corner-post blob detector (primary — simplest, most reliable)

The 3 posts are exactly the corners. Steps, per part, in a hand-given ROI:
1. **ROI**: a window around the rough part location (current JSON estimate, or a
   coarse click). Keeps clutter out.
2. **Binarize**: `gray < T` → ink mask (tune T once; ~150).
3. **Find filled blobs**: connected-components on the ink mask; keep components
   whose area ∈ [postAreaMin, postAreaMax] AND whose **fill ratio** (area /
   boundingbox-area) is high (posts are solid discs, unlike thin lines/rings).
4. **Pick 3**: expect exactly 3 post blobs in the ROI; if >3, take the 3 whose
   pairwise distances best match a triangle of the expected scale; if <3, fall
   back to A2 (lines).
5. **Corners** = blob centroids. Order them (e.g. top / bottom-left /
   bottom-right by angle from the triangle centroid) so left/right slings and the
   guest use a consistent winding.

### A2. Hough-line edge detector (fallback / refine)

When posts are missing or merged:
1. ROI + binarize as above.
2. **Connect dashes**: dilate the mask a few px so the dashed light-shield edges
   become continuous (or prefer the solid rebound line — see A3).
3. **Hough line accumulator**: for each ink pixel `(x,y)`, for `θ ∈ [0,180)`,
   `ρ = x·cosθ + y·sinθ`, vote `A[θ][ρ]`. Peaks = candidate lines.
4. **Pick 3 edges**: non-max-suppress the accumulator; take the 3 strongest peaks
   with **distinct angles** (a triangle's edges are ≥~30° apart) — this rejects
   the many parallel insert-grid/lane lines.
5. **Corners** = pairwise intersections of the 3 lines (3 intersection points).
6. Reject if the intersections don't form a plausible triangle (area / edge
   lengths within expected range).

### A3. Which triangle — rebound vs. light-shield

Each corner has an inner **rebound** line and an outer **dashed light-shield**.
Decide once which the physical slingshot is (likely the rebound rubber = the
inner/solid triangle) and encode the choice: prefer **solid** (continuous) over
**dashed** lines in A2, or the **inner** post ring in A1. Record the choice in
`playfield_chart.json` per part so it's explicit.

### A4. Cross-check + output

Run A1 and A2; if their corners agree within a few px, high confidence. Emit the
3 corner px to paste into `playfield_chart.json` (`type: "triangle"`), and draw
them on the chart (already supported in `refine.mjs`) for the eyeball confirm.

---

## Part B — guide wires / rails (14/15/16, splines)

Thin curved lines → a **polyline** traced from the chart:
1. ROI around the wire.
2. Binarize → thin structures.
3. **Skeletonize** (morphological thinning) to a 1-px centerline.
4. **Trace**: find an endpoint (skeleton pixel with one neighbor), walk the
   skeleton to the other endpoint, collecting the ordered pixel path.
5. **Simplify**: Ramer–Douglas–Peucker to a short ordered polyline (the control
   points).
6. Emit as `type: "polyline"` (`liftPolyline` already exists). Guest builds it
   with `TubeGeometry` (single-arg `push` — the interpreter drops multi-arg
   push, already learned). Overlay reference = the polyline **stroked** at the
   tube's pixel width, then filled/masked.

---

## Part C — close the circular-IoU flaw

Make the check compare to the **chart**, not to our own numbers:
1. From the detector, rasterize the **detected chart feature** (the triangle from
   its 3 detected corners; the circle from its Hough center/radius) into the
   render window via the fiducial-solved projection → `S_chart`.
2. Rendered part mask `S_render` (as today).
3. **chart-feature IoU** = `|S_chart ∩ S_render| / |S_chart ∪ S_render|`.
   This is measurement-independent: if the guest's part drifts from the chart
   feature, IoU drops even though both came from the same JSON.
4. Keep the draw-on-chart image as the human confirm. Accept a part when
   chart-feature IoU ≥ 0.85 AND the overlay looks aligned.

---

## Integration points (files)

| File | Change |
|---|---|
| `refine.mjs` | add `detectTriangle` (A1 blob + A2 Hough-line) and `detectPolyline` (B); keep the draw-on-chart marks (posts/edges/corners) |
| `playfield_chart.json` | slings/targets/wires get detector-produced pixels; record the rebound-vs-shield choice |
| `transform.mjs` | `liftTriangle` / `liftPolyline` already exist — no change |
| `pinball_live.tsx` | `buildPartC`: triangle → `PrismGeometry` (exists); add polyline → `TubeGeometry` builder (single-arg push) |
| `overlay.mjs` | add polyline reference (stroked path); add the **chart-feature IoU** (Part C) |

## Validation loop (per part)

detect → paste px → **draw-on-chart** (refine.mjs) confirm → build + hi-res
render (`valshot.mjs`) → **overlay** chart-feature IoU (`overlay.mjs`) → accept if
IoU ≥ 0.85 and aligned; else adjust the ONE bad edge/corner and repeat.

## Fallbacks

- If a scan region is too degraded for A1/A2, fall back to **manual corner entry**
  with the draw-on-chart loop (what we have now) — but that's the exception, not
  the default.
- Keep a per-part `"_source": "hough" | "blob" | "manual"` field so it's clear
  which parts are auto-measured vs. hand-placed.

## Effort (rough)

- A1 blob corner detector: ~1 iteration (small; connected-components + filter).
- A2 Hough-line fallback: ~1–2 iterations.
- Re-measure + validate 2 slingshots: fast once A1 works.
- B polyline tracer: ~2 iterations (skeleton + trace + RDP).
- C chart-feature IoU: small addition to `overlay.mjs`.

No engine/port changes needed — `PrismGeometry` and `TubeGeometry` already exist;
this is all measurement + validation tooling.
