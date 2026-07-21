# Playfield-from-Chart: measure → construct → validate

A repeatable process for placing pinball parts in the 3D scene from a 2D
top-down **playfield chart** (e.g. the "Little Joe" parts diagram), so each part
lands at the correct location, orientation, and size — verified against the
drawing, not eyeballed.

The chart is an **orthographic plan view**: chart pixels map to world **X,Z** by
a single similarity transform (uniform scale + translation, no rotation/shear).
Height **Y** is not in the chart — it is assigned per part type.

---

## 0. Principle & tolerance

- **One uniform scale** for both axes (`s` world-units per chart-pixel). Using
  different X and Z scales would turn circles into ellipses — forbidden.
- A placement is **accepted** when the render-back error (below) is within
  tolerance: centroid error `< 0.15` world units AND orientation error `< 4°`.
  (0.15 wu ≈ 1.5 % of the playfield width.)
- Nothing downstream (unit tests, hero renders, other parts) proceeds for a part
  until that part passes validation.

---

## 1. Tools

| Step | Tool | Notes |
|---|---|---|
| Decode + measure the chart | `tests/chartmeasure.mjs` (Chromium via data-URI canvas) | `grid` mode = labeled coordinate grid over the whole chart; `crop x y w h scale gridPx out` = zoomed region with a fine grid. ffmpeg/ImageMagick can't decode this JPEG; Chromium does. |
| Store calibration + measurements | `guests/three/playfield_chart.json` | Landmarks, per-part pixel measurements, derived world values. Single source of truth. |
| Construct parts | `guests/three/pinball_live.tsx` on the `three.tsx` façade | Box / Cylinder / Sphere / **TubeGeometry** (outlines & wires). Built in each part's local frame, then positioned + rotated. |
| Render for validation | top-down GL render (`TOPDOWN=true`, `WIRE=true`) via `build-pinball3d.mjs` + `tests/multishot.mjs` | Wireframe on flat bg = clean silhouettes. |
| Validate (overlay + error) | `tests/overlay.mjs` (new) | Composite render over chart in a shared world window; color-key each part; compute centroid/orientation error. |

---

## 2. Calibrate (chart pixels → world X,Z)

1. In `grid` mode, read the **playfield inner-wall bounding box** in chart px:
   `xL` (left wall), `xR` (right wall), `yT` (top arch apex), `yB` (bottom edge /
   outhole baseline). Refine each with a zoomed `crop`.
2. Choose the world width of that box: `worldW` (e.g. `9.2`, the inner playfield
   width; rails sit just outside).
3. Derive:
   - `s = worldW / (xR - xL)`   (uniform world-units per pixel)
   - `cx = (xL + xR) / 2`, `cz = (yT + yB) / 2`   (chart center px)
   - `worldX(px) = (px - cx) * s`
   - `worldZ(py) = (py - cz) * s`   (top of chart → −Z, bottom → +Z)
4. The **table plane** must match: width `= (xR-xL)*s`, length `= (yB-yT)*s`
   (i.e. aspect follows the chart, not an arbitrary rectangle). Rails and camera
   framing are set from these, not hand-tuned.
5. Write `{ xL,xR,yT,yB, worldW, s, cx, cz }` to `playfield_chart.json`.

> The single uniform `s` is what guarantees shapes and gaps are proportional to
> the drawing.

---

## 3. Measure a part (per solid element)

For each part, `crop`-zoom the chart on it and read pixel coordinates. What to
read depends on the part's shape primitive:

- **Flipper (tapered bat / TubeGeometry)** — read:
  - `pivotPx` = center of the shaft-hole circle (the pivot).
  - `tipPx` = center of the rounded tip.
  - `baseDiaPx`, `tipDiaPx` = the two end-circle diameters.
- **Pop bumper / spinner (disc)** — center px + outer-ring diameter px.
- **Slingshot / rebound (triangle)** — the three corner px.
- **Standup target (blade)** — the two end px of its face + thickness.
- **Guide wire / rail (spline → TubeGeometry)** — an ordered list of px points
  along the wire centerline.

Record raw px in `playfield_chart.json` under `parts[<name>]`. Never convert by
hand — the loader applies the calibration.

---

## 4. Lift 2D → 3D

Apply the calibration to every measured px:

- **Location**: `world = (worldX(px), Ypart, worldZ(py))`. `Ypart` is a per-type
  constant (flippers/bumpers sit at the playfield surface; caps rise above it).
- **Pivot**: the flipper's pivot world point = `worldX/Z(pivotPx)`.
- **Orientation**: `angle = atan2( -(worldZ(tipPy) - worldZ(pivotPy)),
  worldX(tipPx) - worldX(pivotPx) )` — the direction pivot→tip. This is the
  part's **rest** orientation; actuated parts animate around it.
- **Shape critical dims**: multiply pixel dims by `s`
  (`baseR = baseDiaPx*s/2`, `tipR = tipDiaPx*s/2`, `length = |tip-pivot|`).
- Build the shape's **local-frame** path/params from these dims (e.g. the flipper
  bat outline as the convex hull of the base+tip circles), pivot at local origin.

---

## 4b. 2D → 3D construction methods (SIGGRAPH lineage)

The chart is a plan (top-down, orthographic) view, so construction is a
2D-outline → 3D-solid problem. Four classic operators cover every part; pick per
part by its real geometry:

| Operator | Method / reference | Use for |
|---|---|---|
| **Inflate** | Triangulate the outline → medial/**chordal axis** spine (Teddy, Igarashi '99) → height by **Poisson** `∇²h=−c`, `h=0` on boundary, then **sqrt/circular remap** (Baran & Lehtinen '09); front + mirrored back = closed solid (Monster Mash '20) | organically rounded solids seen from above: flipper bat/rubber, bumper skirts, target blades |
| **Lathe** | Revolve a measured radial profile about a vertical axis | axisymmetric caps: mushroom **bumper caps**, the **ball** |
| **Sweep** | Circular section along a centerline spline = `TubeGeometry` | **guide wires** (14/15/16), spinner shaft, rails |
| **Extrude** | Constant height from the outline | cabinet, posts, drop-target bodies |

**Medial axis unifies three things** (key insight, Teddy + Monster Mash): for a
flipper the pivot→tip **spine** is simultaneously (1) the axis to inflate along,
(2) the **orientation** (its direction), and (3) the **physics collider** segment.
So measuring the shaft-hole center (pivot) and the tip center is not just
placement — it defines the shape's spine, its angle, and its collider at once. The
pivot is Monster Mash's in-plane rigid handle: actuation = rigid rotation about it.

**Calibration is the planar-mapping step.** General case = a **homography** (4+
point correspondences, perspective photo); an orthographic scan (this chart)
degenerates to a **similarity** (uniform scale + rotation + translation, 2+
correspondences). The uniform scale (Section 2) is what keeps circles round.

**Implementation tiers** (choose per part; start low, escalate only if validation
fails):
- **T1 — parametric primitive/sweep** driven by the measured spine + radii
  (`TubeGeometry` outline, `Cylinder`, lathe profile). Cheap; already in the port.
- **T2 — true silhouette inflation**: a general geometry generator
  (constrained-Delaunay triangulation + discrete Poisson solve + sqrt remap) added
  to the three port. Faithful to any outline; a real engine feature (larger lift).

## 5. Construct & place

- Build the geometry in **local frame** (pivot at origin, principal axis +X):
  outlines/wires via `TubeGeometry(points, radius, radialSeg, closed)`; discs via
  `CylinderGeometry`; etc.
- Place: `mesh.position = pivotWorld`; `mesh.rotation.y = angle`. Because the
  geometry's origin is the pivot, `rotation.y` rotates about the true pivot — and
  the same node is what physics actuates.
- Physics collider is derived from the **same** measured pivot/tip (segment
  pivot→tip for a flipper), so visual and physical shapes cannot drift apart.

---

## 6. Validate (render-back)

1. Render the scene **top-down** (`TOPDOWN`, `WIRE`) into a square buffer. The
   camera is orthographic-equivalent over a **known world window** `W`
   (`[-halfW,halfW] × [zMin,zMax]`), so **world → render-px is exact and known**.
2. `overlay.mjs` builds a comparison at render resolution:
   - Draw the **chart**, scaled/translated by the SAME calibration into window
     `W`, at 50 % opacity.
   - Draw the **render** on top (wireframe).
   - The two should coincide. Emit `overlay_<part>.png` for visual check.
3. **Quantitative error** per part (shape-from-silhouette consistency — the
   analysis-by-synthesis check from the inflation literature):
   - Color-key the part in the render (unique wire color); mask those pixels to a
     **rendered silhouette** `S_r`.
   - Rasterize the **chart outline** for the same part into the same window = the
     reference silhouette `S_c`.
   - **Primary metric — silhouette IoU**: `IoU = |S_r ∩ S_c| / |S_r ∪ S_c|`
     (Jaccard). Captures position AND shape AND size in one number.
   - **Secondary** — centroid + principal-axis (PCA) angle of the mask → world:
     `err_pos = |centroidWorld − measuredCentroidWorld|`,
     `err_ang = |angle − measuredAngle|`. Localizes WHY IoU is low
     (offset vs. rotated vs. mis-sized).
   - Both silhouettes live in one world frame via the same calibration.
4. **Pass/fail**: accept if `IoU ≥ 0.85` AND `err_pos < 0.15` wu AND
   `err_ang < 4°`. Otherwise the secondary metrics say what to fix: `err_pos` high
   → reposition; `err_ang` high → re-measure tip; IoU low but pos/ang ok → wrong
   shape/size (re-measure radii, or escalate T1→T2 inflation). Fix ONE thing,
   rebuild, re-validate. Loop.
5. Log each part's `err_pos`, `err_ang`, pass/fail to `tmp/measure/report.txt`.

---

## 7. Order of operations

1. Calibrate (Section 2) → commit `playfield_chart.json` calibration block.
2. Resize the table plane / rails / camera window from the calibration.
3. Per part, in chart order: measure → lift → construct → **validate** → only
   then move to the next part.
4. Flippers first (they're the reference the user cares about), then bumpers,
   slingshots, targets, inserts, guide wires.
5. When all parts pass, THEN re-enable the shaded hero render and re-run unit
   tests / the gate.

---

## 8. Artifacts

```
guests/three/playfield_chart.json   calibration + raw px measurements + derived world values
guests/three/pinball_live.tsx       construction (reads the JSON's world values)
tests/chartmeasure.mjs              measurement microscope (grid / crop)
tests/overlay.mjs                   validation overlay + per-part error report
tmp/measure/grid.png, crop_*.png    working measurement images (not committed)
tmp/measure/overlay_<part>.png      validation overlays
tmp/measure/report.txt              per-part error + pass/fail log
```

---

## References (2D → 3D)

- Igarashi, Matsuoka, Tanaka. **Teddy: A Sketching Interface for 3D Freeform
  Design.** SIGGRAPH 1999. — silhouette inflation via the chordal axis transform.
- Baran, Lehtinen. **Notes on Inflating Curves.** 2009. — Poisson height field +
  sqrt/circular remap; the clean inflation formulation.
- Dvorožňák et al. **Monster Mash: A Single-View Approach to Casual 3D Modeling
  and Animation.** ACM TOG 39(6), SIGGRAPH Asia 2020. — single-view inflation +
  ARAP-L; in-plane rigid handles = pivots.
- (impl. reference) `unclearness/inflation_py` — triangulate → Poisson → sqrt →
  mesh, a concrete inflation pipeline.

## 9. Acceptance criteria

- Every placed part has a recorded measurement, a derived world value, an overlay
  image, and a logged `err_pos/err_ang` within tolerance.
- The table plane aspect equals the chart playfield aspect.
- No hand-entered world coordinates in `pinball_live.tsx` — all part positions
  come from `playfield_chart.json` via the calibration.
