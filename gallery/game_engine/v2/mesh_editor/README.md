# Spline Mesh Editor

Vite + Vue editor under `gallery/game_engine/v2/mesh_editor` for building
**symmetrical spline silhouettes** plus an editable **orbit path** (Bezier
replacement for cos/sin), lathe-tessellated into 3D meshes rendered with
**Ranger Three**.

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

### Profile view (default)

- Unit plane: left/top `(-1, 1)`, right/bottom `(1, -1)`, Y up
- Viewport margin: `(-1.1 … 1.1)`
- Symmetry axis: vertical line `(0, -1) → (0, 1)`
- Editable profile is the **right half** (`x ≥ 0`); the left half is mirrored in the 2D view
- Default knots: bottom `(0,-1)`, mid `(0.5,0)`, top `(0,1)` with Bezier handles

### Orbit view

- Same unit plane; canvas **x → world X**, canvas **y → world Z**
- Closed Bezier loop; default is a 4-knot **unit circle** (κ ≈ 0.55228475)
- Dashed unit circle guide shows the classic cos/sin path
- Knot / segment colours and materials apply to angular wedges of the mesh

## Tessellate

1. Sample the **profile** curve (Bezier default, or Catmull-Rom)
2. Sample the closed **orbit** path; each sample `(ox, oy)` replaces `(cos θ, sin θ)`
   so `position = (r·ox, y, r·oy)`. Unit circle ⇒ nearly identical to classic lathe
3. **Orbit samples N** is distributed across orbit spans (`≈ N / orbitKnots`)
4. **360° closed**: faces wrap the last orbit column to the first
5. **180°**: use the first half of the orbit samples; faces do **not** wrap
6. Mesh parts are **profile segment × orbit segment** so both colourings affect shading
7. Draw with Ranger Three (WebGL if available, else software)

## Run

From repo root (or `app/`):

```bash
# build Ranger tessellate module + Three host, then start Vite
cd gallery/game_engine/v2/mesh_editor/app
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5177`).

## Local library (filesystem “database”)

While `npm run dev` is running, the Vite plugin exposes `/api/library` and
writes versioned JSON projects under:

```text
gallery/game_engine/v2/mesh_editor/library/projects/<slug>/project.json
```

That tree is **gitignored** by default. Point elsewhere with
`MESH_EDITOR_LIBRARY=/abs/or/rel/path`. Schema + migrations live in
`app/src/library/` (`schemaVersion` 2+, kind `ranger.splineProject`, with
`profile` + closed `orbit` paths).

Offline fallback: **Export JSON** / **Import JSON** in the Library panel.

See [`library/README.md`](./library/README.md).

## Views & tools

| View | Behaviour |
|------|-----------|
| **Profile** | Edit the Y-up silhouette (right half) |
| **Orbit** | Edit the closed XZ rotation path that replaces cos/sin |

| Mode | Behaviour |
|------|-----------|
| **Edit** | Drag knots / Bezier handles; mesh refreshes when the drag ends |
| **Add** | Click the active curve to insert a knot |
| **Coloring** | Per-knot / per-segment colours & materials (profile or orbit) |

Profile list is **top → bottom**. Orbit list follows knot order around the loop.
Rows stay compact; **Details** expands numeric / material fields.

## Shading base

Teapot-inspired modes exercised against Ranger Three:

| Mode | Material |
|------|----------|
| Wire | MeshBasic wireframe |
| Flat | Phong + flatShading |
| Smooth / Glossy / Reflective | Phong (+ studio env when reflective/metal) |

