# Spline Mesh Editor

Vite + Vue editor under `gallery/game_engine/v2/mesh_editor` for building
**symmetrical spline silhouettes** and lathe-tessellating them into 3D meshes
rendered with **Ranger Three**.

## Layout

```text
mesh_editor/
  tessellate/          Ranger math → ESM (Bezier / Catmull-Rom + Y-axis lathe)
    spline_lathe.rgr
    build.mjs
    spline_lathe.mjs   (generated)
  host/                Ranger Three preview host
    web_mesh_editor_host.rgr
  build-host.mjs       → dist/mesh_editor.bundle.js
  app/                 Vite + Vue 3 UI
    src/…
  README.md
```

## Coordinate system

- Unit plane: left/top `(-1, 1)`, right/bottom `(1, -1)`, Y up
- Viewport margin: `(-1.1 … 1.1)`
- Symmetry axis: vertical line `(0, -1) → (0, 1)`
- Editable profile is the **right half** (`x ≥ 0`); the left half is mirrored in the 2D view
- Default knots: bottom `(0,-1)`, mid `(0.5,0)`, top `(0,1)` with Bezier handles

## Tessellate

1. Sample the profile curve (Bezier default, or Catmull-Rom)
2. Revolve around Y for `N` angular steps
3. **360° closed** (default): omit the duplicate ring at `2π`, faces wrap
4. **180°**: same spacing over half a turn, last step omitted, faces do **not** wrap
5. Start angle places points at `z = 0`, `x = radius`
6. Assign the selected material and draw with Ranger Three (WebGL if available, else software)

## Run

From repo root (or `app/`):

```bash
# build Ranger tessellate module + Three host, then start Vite
cd gallery/game_engine/v2/mesh_editor/app
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5177`).

## Tools

| Mode | Behaviour |
|------|-----------|
| **Edit** | Drag knots and Bezier handles |
| **Add** | Click the profile curve to insert a knot (remove from the point list) |
| **Coloring** | Per-knot colours form a linear height gradient; each segment can override colour, roughness, metalness, opacity, and texture (gradient / checker / stripes / upload) |

Segment styles are lathed as separate mesh parts and previewed through Ranger Three materials (shininess ← roughness, reflectivity ← metalness).

