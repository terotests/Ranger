# IDEAL_TEAPOT — running the classic Three.js teapot example 1:1

> Goal: run [`webgl_geometry_teapot`](https://threejs.org/examples/#webgl_geometry_teapot)
> **1:1, unmodified**, as `.tsx` in the interpreter, rendered with WebGL by the
> Ranger Three clone — lighting, multiple material types, `OrbitControls`, the
> `TeapotGeometry`, and the **lil-gui** panel (as an **EVG overlay**). Companion
> to [`../IDEAL_THREE.md`](../IDEAL_THREE.md). Built piece by piece, each with a
> `*_test.rgr`, like the cube.

The teapot is the right next target: one example exercises most of the base 3D
system that the cube doesn't — real lighting, lit/wireframe/double-sided
materials, procedural geometry, mouse-driven camera, on-demand rendering, and a
UI overlay. It tells us where the architecture needs to grow.

## 1. What the example needs vs. what exists today

| Feature the teapot uses | Status | Where |
|---|---|---|
| `PerspectiveCamera`, `camera.position.set`, `Scene`, `Mesh`, `WebGLRenderer`, `TextureLoader` | ✅ have | `three/src` |
| `BufferGeometry` **normals** (stored) | ✅ stored, ❌ not uploaded/used | `three_buffer_geometry.rgr` |
| **Lights** — `AmbientLight`, `DirectionalLight` | ❌ | — |
| **Lit materials** — `MeshLambertMaterial`, `MeshPhongMaterial` (specular, shininess, flatShading) | ❌ (only unlit `MeshBasicMaterial`) | — |
| **`wireframe`**, **`side: DoubleSide`**, **`flatShading`** | ❌ | — |
| **`Color(0xAAAAAA)`**, `scene.background` (solid / skybox / null) | ❌ | — |
| **`TeapotGeometry`** (Bézier-patch tessellator) | ❌ | — |
| **`OrbitControls`** (mouse orbit/zoom/pan) + pointer input into the scene | ❌ (cube demo has no input) | — |
| **`CubeTextureLoader`** + `envMap` reflection + skybox | ❌ | — |
| **`GUI`** (lil-gui): dropdowns, checkboxes, `onChange` | ❌ | — |
| On-demand `render()` (not `setAnimationLoop`), resize, `scene.add(light)`, `scene.remove`, `geometry.dispose()` | ⚠️ partial | `three_webgl_renderer.rgr`, host |
| **EVG → RGBA overlay** over a rendered frame | ✅ have (reusable) | `scripting/game_hud.rgr` (`drawTree`), `pdf_writer/.../EVGRasterRenderer.rgr` |

The GL vertex pipeline currently uploads **pos+uv only** (stride 20) and the
shader is **unlit** (`three_gl_shaders.rgr`). Lighting is the foundational change:
it touches the vertex buffer layout, the shaders, the renderer's uniform feed,
and adds the material/light classes.

## 2. Architecture decisions (resolve before/while building)

- **Übershader vs. per-material programs.** Recommend **one GLSL ES 1.00
  übershader** driven by uniforms: ambient term + up to `N` directional lights
  (uniform arrays), material params (diffuse/specular/shininess), and mode flags
  (`uHasTex`, `uWireframe`, `uUnlit`, `uFlat`). Lambert = diffuse only; Phong =
  add Blinn-Phong specular. Keeps one program, matches "one shader, many
  targets." (WebGL1/GLES2 support small fixed-size uniform arrays fine.)
- **Normals in the vertex buffer.** Move to interleaved **pos3 + norm3 + uv2**
  (stride 32); add `aNormal`, a normal matrix uniform, and world-space lighting.
- **Flat shading.** GLSL ES 1.00 has no `dFdx` without an extension, so flat
  shading = **per-face duplicated vertices with the face normal** (a geometry
  variant), computed when `material.flatShading` is set. Matches Three's result.
- **Env/reflection maps are the hardest GPU piece.** `samplerCube` + reflection
  vector + a skybox pass. **Recommend deferring**: first ship the teapot with
  `reflective` falling back to `glossy`; add cube maps as its own later slice so
  the teapot runs sooner. (Flagged, not silently dropped.)
- **GUI overlay = EVG, not DOM.** Keep UI in Ranger: build the lil-gui panel as
  an `EVGElement` tree and **rasterise it to an RGBA overlay** (reusing
  `game_hud`'s `drawTree` / `EVGRasterRenderer`). In the browser this is a 2D
  canvas stacked over the WebGL canvas; native draws EVG over the GL framebuffer.
  This is the "EVG overlay in the 3D engine" support — it exists in the *game*
  host (`game_hud.rgr`) and needs a home in the **3D host** (`web_tsx3d_gl_host` /
  a shared `Three*Overlay`), plus pointer hit-testing to drive `onChange`.
- **Input plumbing.** `OrbitControls` and the GUI both need pointer events routed
  from the host into the interpreter/bridge — new for the 3D path (the cube demo
  takes no input). One small event surface (`pointerdown/move/up/wheel` +
  viewport size) serves both.
- **On-demand rendering.** The teapot calls `render()` on control/GUI change, not
  every frame. The host keeps a "dirty" flag: render when the scene, camera, or
  GUI changed; idle otherwise. Cheap and matches the example.

## 3. Pieces (dependency order; each is a `Three*` class + `*_test.rgr`)

**Phase A — Lighting + lit materials (the core upgrade; unblocks a lit teapot)**
1. `ThreeColor` (hex → rgb; `set`, `getHex`) + `material.color` + `scene.background` clear colour.
2. Vertex pipeline: interleave normals (stride 32); `three_gl.rgr` mesh upload + `three_gl_shaders.rgr` gain `aNormal`, normal matrix, world-space varyings.
3. `ThreeLight` base; `ThreeAmbientLight`, `ThreeDirectionalLight` (color, intensity, direction). `ThreeScene` collects lights; renderer feeds light uniforms.
4. Übershader lighting: Lambert (diffuse) + Blinn-Phong (specular/shininess). Software backend gets the same model so headless tests stay meaningful.
5. `ThreeMeshLambertMaterial`, `ThreeMeshPhongMaterial` (specular, shininess, flatShading, side). `side: DoubleSide` (backface cull off / two-sided normal). `wireframe` (draw `gl.LINES`, or a barycentric fragment). `flatShading` (per-face normal geometry variant).

**Phase B — TeapotGeometry**
6. `ThreeTeapotGeometry(size, tess, bottom, lid, body, fitLid, blinn)` — port the Utah-teapot Bézier patch data + cubic-Bézier surface evaluation → positions, normals, uvs, indices. Self-contained, deterministic; a `*_test.rgr` asserts vertex/þtriangle counts and bounds per tessellation.

**Phase C — Camera controls + interaction**
7. Host pointer-event surface (`pointerdown/move/up/wheel`, viewport) → interpreter.
8. `ThreeOrbitControls(camera, domElement)` — drag → spherical orbit, wheel → dolly, right/two-finger → pan; `addEventListener('change', render)` → mark dirty. On-demand render loop in the host.

**Phase D — Scene/renderer plumbing (small)**
9. `scene.add(light)`, `scene.remove(mesh)`, `geometry.dispose()`, `scene.background` (solid Color / null / skybox), resize (`camera.aspect` + `updateProjectionMatrix` + `renderer.setSize`), `renderer.domElement` / `container.appendChild` DOM stubs, a `materials` map (multiple material instances, switch by name).

**Phase E — GUI overlay (lil-gui via EVG)**
10. A thin `GUI` façade: `gui.add(obj, prop, options?)` → controller; `.name(label)`, `.onChange(cb)`. Controllers: dropdown (options array), checkbox (bool), (later: slider/number).
11. `ThreeUiOverlay` in the 3D host: build the panel as an `EVGElement` tree (reuse `EVGBox`/`EVGText`/`EVGColor`/`EVGLayout`), rasterise via `game_hud`'s `drawTree` / `EVGRasterRenderer` to an RGBA layer, composite over the WebGL frame (browser: a 2D overlay canvas; native: EVG over the GL framebuffer). Pointer hit-testing → set the bound value → invoke `onChange` → mark dirty.

**Phase F — Textures/env (defer; own slice)**
12. `TextureLoader` `wrapS/wrapT = RepeatWrapping`, `anisotropy` (best-effort), `colorSpace`.
13. `CubeTextureLoader().setPath().load([6])`, `MeshPhongMaterial.envMap` reflection (`samplerCube`, reflect vector), skybox `scene.background = textureCube`. Until then, `reflective` renders as `glossy`.

## 4. Milestones (shippable slices)

- **M1 — Lit teapot, one material. ✅ DONE.** Phases A + B + minimal D: the teapot
  renders, lit (Lambert/Phong), on a solid background. Proves lighting +
  procedural geometry end-to-end (headless software test + browser WebGL).
  Verified in headless Chromium (`web_teapot_gl_probe`).
- **M2 — Orbitable teapot. ✅ DONE.** + Phase C: `ThreeOrbitControls` — drag to
  orbit, wheel to dolly, on-demand render (`needsRender()`), host pointer surface.
  Added the `atan2` math builtin + `Object3D.lookAt` / `Matrix4.lookAt` +
  quaternion-from-matrix. Verified orbit + zoom in the browser.
- **M3 — The GUI. ✅ DONE.** + Phase E + the rest of D: `ThreeGuiOverlay` — a
  lil-gui-style panel built as an EVG tree, rasterised to RGBA (GameHudBlitter +
  SoftCanvas), composited as a 2D overlay over the WebGL frame; pointer hit-test
  drives `createNewTeapot()` (tessellation stepper, lid/body/bottom/fitLid/blinn
  toggles) and material switching (shading dropdown: wireframe / flat / smooth /
  glossy). Wireframe = GL line-edge draw; flat = per-face-normal geometry variant.
  The full example minus reflections. Verified all modes in the browser.
- **M4 — Reflections.** + Phase F: cube maps, `envMap`, skybox → the example 1:1.
  (Also still deferred from M3: the `textured` and `reflective` dropdown options.)

## 5. Portability & test rules (unchanged from IDEAL_THREE)

- No JavaScript in the object model, lights, materials, geometry, controls, or the
  übershader logic — pure Ranger, compiles to C++ (`-l=cpp`) as well as ES6.
- GPU code stays in the backend via `three_gl.rgr` templates (WebGL es6 + GLES
  cpp from one source). The übershader is shared GLSL ES 1.00.
- Every piece keeps a `*_test.rgr`; the software backend implements the same
  lighting model so headless tests stay meaningful. Browser WebGL is verified by
  the same headless-Chromium screenshot path used for the cube.
- The EVG overlay is pure Ranger UI (EVG tree → raster), reused from the game
  host; it is additive and does not touch the object model.
