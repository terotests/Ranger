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

## Code layout & refactor status

`app/src` is ~14.7k lines and still has two files that are too big
(`composables/useSplineEditor.js` ≈1.8k, `App.vue` ≈1.4k). Work in progress; the
shape being moved toward:

```text
app/src/
  shared/          cross-feature, framework-light, unit-tested
    math/          mat3.js (3x3 + Rodrigues), scalar.js, color.js
    canvas/        useDragGesture.js (one canonical drag slot)
  lib/             feature modules (path, lathe, texture, pick, transform)
  composables/     editor state
  components/      Vue views
  library/         project persistence (schema + migrations + api)
```

**Done so far.** Measured duplication with a maximal-block detector (not by eye)
and removed the real cases — 313 → 266 duplicated significant lines:

| Was | Now |
|-----|-----|
| `mulMat3Vec` / `mulMatVec` / `mulMat3` — three identical 3x3 multiplies | `shared/math/mat3.js` |
| Rodrigues twist inlined twice in `transformPart` (positions + normals) | `rodrigues()` |
| `lerp` in two modules; colour hex helpers buried in `latheTessellate` | `shared/math/scalar.js`, `color.js` |
| `sampleOpenPath` vs `samplePath` — 15 identical lines differing only in `Math.max(0, p.x)` | one `sampleOpenChain(…, clampX)` |
| `knotUid` ×2, `defaultSegment` ×2 (one a narrower subset), `findLayer` ×2 | single definitions |
| Embedded-body hydration duplicated verbatim in undo *and* load (22 lines) | `hydrateEmbeddedBody()` |
| `textureAssets` entry validation duplicated in two validators | `validateTextureAssets()` |
| SplineCanvas's four independent drag flags | `useDragGesture` — one slot |

The four-flag drag state deserves calling out: `dragging` / `draggingChild` /
`draggingNormal` / `draggingTranslate` made "dragging a knot *and* translating" a
representable state, and every `pointerup` had to remember to clear all four.
That is the same illegal-state class `IDEAL.md` §0.1 lists as a runtime-correctness
bug in the v1 runner. One slot makes those states not exist.

Also note a trap found while extracting: the old `rotateFlatXyz` was documented
"in place" but actually **copied**, and its callers relied on the copy. The shared
module therefore exposes `rotateFlatXyzInPlace` and `rotateFlatXyzCopy` as
separate, named functions, and the unit test pins both.

**Next, in order.**

1. `Preview3D.vue` has the same mode soup, worse — five flags (`draggingOrbit`,
   `surfaceDragging`, `dragGuid`, `blockHostOrbit`, `regionDrag`). It is
   deliberately *not* converted yet: the e2e does not cover its orbit / region /
   surface-placement drags, and refactoring gesture code with no net is how the
   bug gets introduced. Add that coverage first, then convert.
2. Split `useSplineEditor.js` and `App.vue` by feature (mesh / texture /
   children / library) — both are far past the size where a reader can hold them.
3. Port the eye texture rasterizer (`eyeTexture.js` + `eyeEmotion.js`, ~2k lines)
   to Ranger so it also runs native / C++ / wasm32. This is the last "no runtime
   off the browser" claim; `rg3d_material_map_rgba` already gives its output
   somewhere to go, and `tests/diff/` is the established way to prove the port.
4. Comment density is still low in the components (0–3%); the shared modules and
   the tests now carry the *why*, the views mostly do not.

## Preview transport

The 3D preview runs on the **v2 transport**. `host/web_mesh_editor_host.rgr`
issues registry commands — the same ones a TSX or wasm32 guest issues — instead
of importing `three/port` classes and mutating `ThreeSceneHost`'s arrays:

```text
editor JS ──▶ WebMeshEditorHost ──▶ RgRegistryBridge.invoke("rg3d_*")
                                          │
                                          ▼
                                    RgRangerThree ──▶ typed host arenas
                                          │
                      ThreeSceneHost.render  (presentation READS host state)
```

The host holds only **guest ids** (the ints the bridge mints), never arena
indices. Meshes are DETACHED creates plus a separate `rg3d_entity_set_parent`,
so object lifetime and scene membership stay independent (D-SYNC).

Two seams read the arena directly, matching `web/web_live3d_host.rgr`:
**present** (`render` + `raw()` — a renderer reading host state is not a sync
boundary) and **view state** (camera/target/fov for the JS surface picker, plus
the orbit distance clamp, which has no command).

Commands added for authoring (new ids — the existing ones are golden and cannot
grow arguments): `rg3d_geometry_buffer` (interleaved vertex buffer + indices),
`rg3d_material_basic_ex`, `rg3d_material_phong_ex`, `rg3d_material_reflective`,
`rg3d_material_map_rgba` (generated atlas, no file), `rg3d_scene_background`,
`rg3d_scene_environment_studio`.

The switch is **pixel-identical** to the previous direct-Three render
(0 of 108241 pixels differ).

> **Shared-atlas rule.** The old host handed ONE mutable `ThreeTexture` to every
> part, so a batch always showed the LAST atlas uploaded — and because UVs are
> global across the profile (`v = row / rows-1`), that sharing is what makes a
> multi-part gradient continuous. A command API mints a texture per material, so
> `setPartMapBuffer` re-applies the staged atlas to every live part. Drop that
> and each part samples its own atlas through global UVs, seaming at every
> segment boundary. Locked by `tests/host/transport_guard.mjs`.

## Ranger port (in progress)

The editor started as browser-only JavaScript, which meant nothing it authored
could be tessellated or rasterized on native / Pi / wasm32 — the engine's whole
point. The rendering logic is moving into Ranger kernel by kernel; each one
keeps its JS original as a reference until a parity suite proves the port is a
drop-in.

| Kernel | Where it runs now |
|--------|-------------------|
| Bezier / Catmull-Rom / arc sampling | **Ranger** (`SplineLathe.bezierPoint`, `catmullPoint`, …) |
| Spine frames (parallel transport) | **Ranger** — `SplineLathe.buildSpineFrames` |
| Rotation lathe on a spine | **Ranger** — `SplineLathe.latheOnSpine` |
| Torus / tube sweep + unit fit | **Ranger** — `SplineLathe.torusOnSpine`, `torusUnitFitScale` |
| Part assembly / colouring (`latheTessellate.js`) | JS |
| Eye texture rasterizer (`eyeTexture.js`, `eyeEmotion.js`) | JS — **still no non-browser runtime** |

The Ranger entry points take and return **flat primitive arrays**, never object
graphs, so the same functions lower to the wasm32 / native ABI unchanged.

`app/src/lib/spineLathe.js` now exports thin wrappers that derive the centre
line (spine sampling is still JS) and call Ranger; the former implementations
remain as `latheProfileWithOrbitOnSpineJs` / `latheProfileAsTorusOnSpineJs`,
which exist **only** so `tests/diff/spine_lathe_parity.mjs` can diff them
(72 checks across straight/bent spines, open/closed, torus, dense sampling).
Delete them when that suite is retired.

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

## Tests

```bash
npm run engine:v2:mesh:test    # module smokes + browser e2e
npm run engine:v2:mesh:e2e     # e2e only
```

Two layers, both registered in the central v2 gate (`npm run engine:v2:test`):

| Layer | What it covers |
|-------|----------------|
| **Module smokes** — every `app/scripts/smoke-*.mjs` | pure-Node module logic (spine, torus, mesh pick, eye texture, atlas sharing, placement normal, library path safety). Discovered by glob, so a new smoke cannot be silently left out |
| **Port parity** — `tests/diff/*.mjs` | each kernel moved from JS into Ranger is diffed against its JS reference on identical inputs (positions/normals/uvs/indices, bit-identical). See *Ranger port* below |
| **Transport guard** — `tests/host/*.mjs` | the preview host must keep driving `RgRegistryBridge` (no direct `three/port` resource imports, no poking arena arrays) and must preserve the shared-atlas semantics. See *Preview transport* below |
| **Browser e2e** — `tests/e2e/mesh_editor_e2e.mjs` | the real app: rebuilds both `.rgr` halves, starts an actual Vite dev server (live `/api/library`), drives headless Chromium. Asserts both canvases render, the five shading modes, torus vs rotation, view switching, knot edit → mesh change → undo, the texture workspace, and a library save/load round-trip |

The e2e writes to a temp `MESH_EDITOR_LIBRARY`, never your own `library/projects/`.
It **SKIPs** (exit 3, never a fake pass) when app deps or Chromium are missing;
`V2_SKIP_BROWSER=1` forces the skip.

Two gotchas worth knowing before extending the e2e:

- A **WebGL canvas reads back blank** via `drawImage`/`getImageData` after the
  frame composites. Measure it with an element screenshot (`canvasStats` does
  this automatically).
- Set numeric fields by **typing + Enter**, not Playwright's `fill()`. `fill()`
  leaves the input's native dirty flag set, so a second real `change` fires on
  the next blur — an extra edit that makes undo look broken when it is not.

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

**Emotion morph:** tag each eye with an emotion. Compatible peers (same
`topologyKey`) can morph 0…1 in the **Texture** preview, and after **Assign to
mesh** the same peer morph hot-swaps the UV atlas bitmap in 3D (no tessellate /
UV rebuild — endpoint atlases are pre-baked, then pixels are lerped).

## Shading base

Teapot-inspired modes exercised against Ranger Three:

| Mode | Material |
|------|----------|
| Wire | MeshBasic wireframe |
| Flat | Phong + flatShading |
| Smooth / Glossy / Reflective | Phong (+ studio env when reflective/metal) |

