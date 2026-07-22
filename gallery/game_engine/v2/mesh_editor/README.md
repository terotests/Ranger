# Spline Mesh Editor

Vite + Vue editor under `gallery/game_engine/v2/mesh_editor` for building
**symmetrical spline silhouettes** plus an editable **orbit path** (Bezier
replacement for cos/sin), lathe-tessellated into 3D meshes rendered with
**Ranger Three**. Includes a **Texture** sector (eye editor first) that reuses
the shared Bezier path editor and stores **params only** (runtime raster).

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

### Spine view

- Edits the **tessellation centerline** (does **not** change Profile / Orbit 2D editors)
- Choose **Profile** or **Orbit** first — that sets which plane Spine edits (`spineSource`)
  - **Profile plane**: signed X offset vs Y (world X bend)
  - **Orbit plane**: signed X offset vs Y mapped to world Z bend
- Default is a straight vertical line (`x = 0`); add control points to curve it
- Lateral offsets are projected along the Frenet/parallel-transport frame during lathe
- **Reset spine** / **Reset both spines** restore a straight centerline

### Placement normal

- Straight **blue arrow** in Profile and Orbit (not Spine): object “up” for placement
- Default `(0, -1) → (0, 1)` (bottom → top); drag endpoints or edit From/To in the toolbar
- Independent of spine / profile radius — used when combining or seating objects on a surface
- **3D preview** rotates the mesh so this normal points world **+Y** whenever the object loads
  or the normal changes (authoring mesh stays unrotated)

## Tessellate

Two modes (`editor.tessellationMode`):

| Mode | Behaviour |
|------|-----------|
| **Rotation** (default) | Classic lathe: profile revolved using orbit as direction scales `(r·ox, y, r·oy)`, optionally along a spine centerline |
| **Torus** | Profile is swept as a tube cross-section along the **orbit path** (major ring). The ring is **unit-sized**: profile + major radius are scaled so outer ≈ 1. Spine modulates major radius (profile-spine X) and lifts the ring (orbit-spine X → Y) |

Shared steps:

1. Sample the **profile** curve (Bezier default, or Catmull-Rom)
2. Sample the closed **orbit** path
3. Apply the active mode kernel (rotation lathe or torus sweep), with optional spines
4. **Orbit samples N** is distributed across orbit spans (`≈ N / orbitKnots`)
5. **360° closed**: faces wrap the last orbit column to the first
6. **180°**: use the first half of the orbit samples; faces do **not** wrap
7. Mesh parts are **profile segment × orbit segment** so both colourings affect shading
8. Draw with Ranger Three (WebGL if available, else software)

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
`app/src/library/` (`schemaVersion` 4+, kind `ranger.splineProject`, with
`profile`, closed `orbit`, per-segment `pathType`, `spineProfile` / `spineOrbit`,
`assetGuid`, `embeddedAssets`, and `children`).

Offline fallback: **Export JSON** / **Import JSON** in the Library panel.

See [`library/README.md`](./library/README.md).

## Path types (SVG-style segments)

Each profile / orbit **segment** can be independently:

| Type | Behaviour |
|------|-----------|
| **Bezier** | Cubic with knot handles (default) |
| **Line** | Straight chord between endpoints |
| **Arc** | Circular arc; optional **bulge** (signed sagitta), else auto ≈ ¼ chord |

Mix freely along a path (Bezier → line → arc…), like SVG subpaths. Choose the type
in the segment **Details** menu.

## Undo / redo

Edits push immutable shape snapshots into an in-memory buffer (no Zustand dependency).
**Undo** / **Redo** in the toolbar, or `Ctrl+Z` / `Ctrl+Shift+Z` (`Ctrl+Y`).

## Views & tools

| View | Behaviour |
|------|-----------|
| **Profile** | Edit the Y-up silhouette (right half); place **sub-object** attach boxes |
| **Orbit** | Edit the closed XZ rotation path that replaces cos/sin |
| **Spine** | Edit the tessellation centerline bend for the plane last chosen via Profile/Orbit |

| Mode | Behaviour |
|------|-----------|
| **Edit** | Drag knots / Bezier handles / attach boxes; mesh refreshes on drag end |
| **Add** | Click the active curve to insert a knot |
| **Coloring** | Per-knot / segment colours; **Shift+click** multi-select; bulk whole / selection |

### Bulk colour

Toolbar **Bulk colour** → *Whole object* paints every knot/segment (+ object material) on the
active edit target; *Selection* paints only the multi-selected points.

### Sub-objects (schema v3+)

Attach another library project as a child (**Copy** = new GUID, **Link** = shared GUID).

1. Click **Copy** / **Copy×2** / **Link** in Sub-objects
2. Move over the **3D preview** (cursor = copy/+) — raycast hits the **root** surface
3. Click to place: the child’s **placement normal** aligns to the hit surface normal
4. Esc cancels; right-drag still orbits the preview

**Surface drag (sub-object edit):** open **Edit** on a child, then in the 3D preview
hover that instance (grab cursor) and drag — it slides on the root surface, staying
aligned to the hit normal (profile-plane children convert to surface placement on drag).

Editing the root **spine** (or profile) re-seats surface-placed children on the updated
root mesh along their stored parent normal. Child spines and placement normals are
stored on the embedded asset and survive save/load.

Also: **Twin** / **Sym** for mirrored pairs; Profile attach boxes for non-surface nudging; **Edit** loads a child large while the preview stays the full assembly.

### Texture editor (schema v9)

Top toggle **Mesh | Texture**. Shared path kit: `lib/pathModel.js`, `usePathEditor`,
`SplineCanvas` feature flags (lathe guides off in texture mode).

**Eye texture** (`textureAssets[*].kind: "eye"`):

| Layer | Role |
|-------|------|
| Eyeball | Closed Bezier silhouette (shape editor) |
| Iris | Closed path, constrained inside eyeball |
| Pupil | Closed path, constrained inside iris |
| Reflection | Shine spot, constrained inside eyeball |
| Eyelid | Open Bezier + filled clip region, drawn on top (clipped to eyeball) |

Layers can be named, reordered, enabled/disabled. Only **params** are saved
(`knots` / `segments` / colours) — `renderEyeTexture` rebuilds pixels at runtime
(animatable). Mesh UV projection / vertex-colour background assign is next.

Eye paths default to a **4-knot circle** (same κ ≈ 0.552 as Mesh Orbit). Toolbar
**Symmetry** mirrors the left from the right (centroid axis); **Auto smooth**
recomputes Bezier handles after moving a **point** (not while dragging handles).
Use **Add** to insert more knots.

**Emotion poses (schema v12):** each eye texture has `partClass: "eye"`, an
`emotion` tag, a `topologyKey` fingerprint, and optional `poses[]` snapshots of
the same knot topology so emotions can morph. Compatible textures share
`topologyKey`. Design: [`docs/EYE_EMOTION_RIG.md`](./docs/EYE_EMOTION_RIG.md).

**Anim preview (mesh toolbar):** after **Assign to mesh**, use **Anim preview**
to pick an animation class (currently **Emotion**) and morph From → To. If the
texture has no targets yet, **Seed demo emotions** builds procedural variants
for testing; the 3D preview re-bakes the UV atlas as you drag Morph.

## Shading base

Teapot-inspired modes exercised against Ranger Three:

| Mode | Material |
|------|----------|
| Wire | MeshBasic wireframe |
| Flat | Phong + flatShading |
| Smooth / Glossy / Reflective | Phong (+ studio env when reflective/metal) |

