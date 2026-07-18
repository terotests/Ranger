# THREE — the Ranger clone of Three.js: what is built and how to use it

A portable 3D engine written in Ranger that runs canonical Three.js example
scenes. One object model compiles to ES6 (WebGL) and C++ (OpenGL/GLES), so the
same scene renders in the browser and natively (desktop GL, Raspberry Pi). No
three.js JavaScript is imported — the engine underneath is Ranger.

This document records **what is implemented** and **how to run and extend it**.
The design rationale and layering rules are in
[`IDEAL_THREE.md`](./IDEAL_THREE.md); the per-example notes are in
[`three/IDEAL_TEAPOT.md`](./three/IDEAL_TEAPOT.md) and
[`three/IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md).

---

## 1. Architecture (three layers)

Every file is on exactly one layer:

1. **Façade** — `three/tsx/three.tsx`. Thin `THREE.*` data classes so an
   unmodified Three.js example runs in the TSX interpreter. Holds mutable state
   only; delegates all work down. Interpreter-facing; not part of the engine.
2. **Object model** — `three/src/`. The canonical engine, pure Ranger: math
   (`ThreeVector3`/`Matrix4`/`Quaternion`/`Euler`), scene graph (`ThreeObject3D`,
   `ThreeScene`, `ThreePerspectiveCamera`), geometry, materials, textures,
   lights, and `ThreeWebGLRenderer`. Compiles to ES6 **and** C++. No JS.
3. **Render backend** — pluggable `ThreeRenderBackend`:
   - `ThreeSoftwareBackend` — pure-Ranger rasteriser (headless / fallback).
   - `ThreeGLBackend` (`three/src/three_gl.rgr`) — WebGL via es6 templates,
     OpenGL/GLES via cpp templates, from one source. Shaders are shared GLSL
     ES 1.00 (`three/src/three_gl_shaders.rgr`).

The object model can be driven three ways against the *same* classes: a TSX
façade (interpreter), Ranger code directly, or (future) a WASM guest.

---

## 2. What is implemented

### Object model (`three/src/`)
- **Math:** `ThreeVector3`, `ThreeEuler`, `ThreeQuaternion`, `ThreeMatrix4`
  (incl. `makeOrthographic`, `transformPoint`), `ThreeBox3`, `ThreeMathUtils`.
- **Scene graph:** `ThreeObject3D` (transforms, world matrices, bounds),
  `ThreeScene`, `ThreePerspectiveCamera`, `ThreeFirstPersonControls`,
  `ThreeOrbitControls`.
- **Geometry:** `ThreeBufferGeometry` (positions/normals/uvs/**tangents**/index),
  `ThreeBoxGeometry`, `ThreeTeapotGeometry` (Bézier patches).
- **Materials:** `ThreeMaterial`, `ThreeMeshBasicMaterial` (unlit),
  `ThreeMeshLambertMaterial` (diffuse), `ThreeMeshPhongMaterial`
  (specular/shininess/flatShading). baseColor **map** + tangent-space
  **normalMap** slots.
- **Textures:** `ThreeTexture`, `ThreeCubeTexture` (env maps / skybox),
  `ThreeTextureLoader`.
- **Lights:** `ThreeAmbientLight`, `ThreeDirectionalLight`
  (`castShadow`/`target`/`shadow`), `ThreeDirectionalLightShadow`.
- **GI:** `ThreeSphericalHarmonics3` (order-2 SH), `ThreeLightProbeGrid`
  (+ helper) — a probe volume with a directional bake, shadow-map sun
  visibility, and trilinear irradiance lookup.
- **Sky:** `ThreeSky` (Preetham atmospheric-scattering uniforms).
- **Tone mapping:** `ThreeToneMapping` (ACES Narkowicz, Reinhard).
- **Renderer:** `ThreeWebGLRenderer` (scene walk, light collection, tone-map +
  shadow + GI orchestration) over `ThreeRenderBackend`.

### GPU backend features (`ThreeGLBackend` / the übershader)
- Übershader lighting: unlit / Lambert / Blinn-Phong (up to 4 directional lights
  + ambient), two-sided materials.
- **HDR tone mapping** (`uToneMapping`/`uExposure`) — ACES / Reinhard / clamp.
- **Shadow mapping** — a two-pass depth render to an off-screen depth target
  (FBO) from the light, sampled with 3×3 PCF in the lit pass.
- **Light-probe GI** — the probe volume's SH is uploaded to a float texture and
  sampled **per fragment** (trilinear across the 8 surrounding probes). The bake
  is directional (cool sky + warm ground bounce + sun lobe) and uses the shadow
  map for **per-probe sun visibility** (PCF-softened), so shaded areas read
  cool/dim and sunlit areas keep the warm bounce.
- **Preetham atmosphere sky** — a daylight dome drawn behind the scene, sharing
  the scene's exposure + tone-map curve.
- **Textures** — mipmapped + anisotropic filtering; tangent-space **normal
  mapping** (uses the glTF `TANGENT` attribute; matches three.js's frame).
- **Cube-map** skybox + reflective materials.

### glTF asset loading
- `three/src/three_gltf_file.rgr` — parses `.glb` (or a multi-file `.gltf` +
  external buffers), decodes accessors (POSITION / NORMAL / TEXCOORD_0 /
  TANGENT / indices) into geometry, builds the node tree with TRS transforms,
  and resolves each material's baseColor + normal textures to image indices.
- `three/src/three_json.rgr` — a C++-compiling JSON parser
  (`ThreeJsonValue` / `ThreeJsonParser`).
- `three/src/three_http.rgr` — `http_get_bytes` over HTTPS (libcurl on native,
  Node `curl` on es6).
- `three/src/three_gltf_textures.rgr` — **native** texture decode: fetches each
  image and decodes JPEG/PNG with Ranger's own decoders
  (`pdf_writer/src/jpeg`, `lpc/src/png_decoder`), for the SDL / Pi path. In the
  browser the viewer decodes images with a canvas instead (the host can't decode
  JPEG/PNG in-browser); both feed the same `setImage` seam.

### Example scenes (demos)
See [§8 Demos & parity](#8-demos--parity) for the full catalog, the
where-does-it-run support matrix, and the API-coverage table.
- **Cube** — the canonical rotating textured cube (`three/tsx/cube.tsx`),
  unmodified.
- **Cubes** — a ring of crate-textured, colour-tinted spinning cubes
  (`three/tsx/cubes.tsx`): the same scene-graph code with many meshes, run 1:1 on
  the generic bridge (no new engine code).
- **Teapot** — `webgl_geometry_teapot` (`three/tsx/teapot.tsx`): lit materials,
  env-map reflections, a lil-gui panel; OrbitControls.
- **Sponza** — the light-probe-volume scene (`three/tsx/sponza.tsx`): the real
  glTF Sponza model with textures + normal maps, an atmospheric sky, a
  shadow-casting sun, ACES tone mapping, first-person controls, and the baked
  diffuse-GI probe volume. Composed by `ThreeSponzaScene`
  (`three/tsx/three_sponza_scene.rgr`) and reconciled from the interpreted scene
  by `three/tsx/three_sponza_tsx_bridge.rgr`.

---

## 3. How to run it

### Browser gallery (Cube / Teapot / Sponza)
```
cd gallery/game_engine/web
npm install
npm run build            # -> dist/ (static, self-contained)
cd dist && python3 -m http.server 8000
# open http://localhost:8000 and pick "Cube 3D", "Cubes", "Teapot", or "Sponza"
```
The gallery interprets each scene's `.tsx` against the `three.tsx` façade and
renders it with WebGL. Editing the shown script hot-reloads the scene.

- **Sponza** streams the real model + 69 textures at runtime from the Khronos
  sample-assets repo (they are too big to bundle), with a loading progress bar;
  expect a short download + in-browser decode on first open. Controls: WASD /
  arrows move, drag to look.

### Native SDL binaries (macOS / Linux / Raspberry Pi)
```
gallery/game_engine/scripts/build-teapot-sdl.sh --run
gallery/game_engine/scripts/build-sponza-sdl.sh --run     # fetches + decodes Sponza
```
Requirements: a C++17 compiler + SDL2 + OpenGL (libcurl for Sponza). On ARM
(Raspberry Pi) the scripts select GLES2. Editing `three/tsx/sponza.tsx` while it
runs hot-reloads the scene.

### Native launcher menu
```
npm run engine:game-sdl:launcher
```
The launcher lists games from `games/*/game.info`. The Three.js scenes appear in
the **Tests** category:
- `games/cube`, `games/cubes` — `render=tsx`: the **generic** interpreted-`.tsx`
  path — any `three.tsx`-façade scene through `ThreeTsxBridge` + `ThreeGLBackend`,
  the exact browser tsx3d-gl path, native. No per-demo runner: the scene file alone
  decides what renders (see §8.1). *(The native `render=tsx` path uses the
  procedural checker texture today; host-side image decode for `.tsx` scenes is the
  remaining follow-up.)*
- `games/teapot` — `render=three` (host = OrbitControls + lil-gui panel + procedural
  env cube / UV texture plumbing).
- `games/sponza` — `render=sponza` (host = first-person controls + async glTF +
  the `ThreeSponzaScene` GI-bake plumbing; WASD / arrows move, drag to look).

Every example — cube, cubes, teapot, Sponza — reconciles through the **one** generic
`ThreeTsxBridge`; the hosts are pure plumbing (controls, GUI, async loading, the
GPU-technique GI bake). **There are no per-demo `*_tsx_bridge.rgr` files** — both
the teapot and Sponza bridges have been deleted (see
[`IDEAL_THREE.md §5`](./IDEAL_THREE.md)).

---

## 4. Writing / editing a scene

### Edit an existing scene (hot reload)
Edit `three/tsx/sponza.tsx` (or `teapot.tsx`). The interpreter re-runs the scene
on change; scene parameters (sun azimuth/elevation, light intensity, probe
counts/bounds, shadow/GI toggles) reconcile live. In the browser gallery the
Monaco editor drives the reload; the native SDL runner watches the file.

### Build a scene from Ranger directly (no façade)
The object model is usable without the interpreter — construct the classes and
call `renderer.render(scene, camera)`:
```
def scene:ThreeScene (new ThreeScene)
def camera:ThreePerspectiveCamera (new ThreePerspectiveCamera)
def geo:ThreeBoxGeometry (new ThreeBoxGeometry)
def mat:ThreeMeshLambertMaterial (new ThreeMeshLambertMaterial)
def mesh:ThreeMesh (new ThreeMesh)
mesh.setGeometry(geo)
mesh.setMaterial(mat)
scene.add(mesh)
def gl:ThreeGLBackend (new ThreeGLBackend)
gl.init("")
def renderer:ThreeWebGLRenderer (new ThreeWebGLRenderer)
renderer.setBackend(gl)
renderer.render(scene camera)
```
`three/src/three_cube_demo_test.rgr` is a full example of this Ranger-only path.

### Add a scene to the gallery / launcher
- **Gallery:** add a block in `web/build.mjs` (mirror the `SPONZA_TSX_SCENES` /
  `TEAPOT_TSX_SCENES` entries) and a handler in `web/index.html`.
- **Native launcher:** create `games/<name>/game.info` with
  `render=three` (teapot-style host) or `render=sponza` (first-person host),
  plus `index.tsx` (the scene) and `three.tsx` (the façade copy).

---

## 5. Portability

- The object model + backend compile to **ES6 and C++** from one source
  (`node bin/output.js -es6|-l=cpp …`). GPU ops carry both a WebGL (`es6`) and an
  OpenGL/GLES (`cpp`) body via Ranger's template system.
- Shaders are GLSL ES 1.00 (one source for WebGL1/2, GLES2, desktop-GL compat).
  Normal mapping uses per-vertex tangents (not screen-space derivatives) so it
  works on WebGL2, where an ESSL-1.00 shader cannot use `dFdx`.
- **macOS:** the SDL build passes `-DGL_SILENCE_DEPRECATION`; Apple Silicon
  (aarch64) is treated as desktop GL, not GLES2.
- **Raspberry Pi (GLES2):** float-probe textures use `GL_RGBA` + `GL_FLOAT`,
  depth targets use `GL_DEPTH_COMPONENT`/`UNSIGNED_SHORT`, and textures skip
  mipmaps (NPOT), all guarded by `#if … && !defined(__APPLE__)`.

---

## 6. Tests

```
bash gallery/game_engine/three/src/run.sh      # prints ALL PASS per suite
```
Each object-model class has a `*_test.rgr` compiled to ES6 and run under Node.
The GPU backend and the interpreter bridges are covered; the browser and native
GL renders are verified by codegen + (browser) a headless-Chromium harness.

---

## 7. Known limitations / not yet done

- **No PBR specular / metallic-roughness** — materials are Lambert diffuse;
  Sponza's roughness/metallic maps are not used, so no view-dependent highlights.
- **baseColor is not sRGB-decoded** — color textures are sampled as linear, which
  skews midtone color (three.js linearizes sRGB color maps before lighting). Related:
  a texture's `colorSpace` / `wrapS` / `wrapT` / `anisotropy` set in the scene are
  carried on the façade but not yet applied by the object model / backend (the
  reconcile reads only the image), so they take their engine defaults.
- **GI is an analytic bake, not captured** — the probe SH is sky + ground bounce
  + sun-with-shadow-visibility; there is no per-probe cubemap capture, so no
  colored inter-surface bounce.
- **No anti-aliasing** (no MSAA/FXAA) and **no ambient occlusion**.
- **`normalScale`** (per-material normal-map strength) is not wired from the glTF.
- The native GL runs are codegen-verified in CI; the visual run is a local
  desktop-GL / device step.

---

## 8. Demos & parity

The goal is to run the **three.js examples section** (`threejs.org/examples`) 1:1
on three targets — **web** (WebGL), **macOS** (desktop OpenGL via SDL), and
**Raspberry Pi 5** (GLES2 via SDL) — from one Ranger object model. This section is
the demo catalog (what we have, where each runs) and the API-coverage table (what
is still missing to reach more of the examples section). The API *design* behind it
is in [`IDEAL_THREE.md`](./IDEAL_THREE.md).

### 8.1 Demos we have

| Demo | Scene | Three.js example | Renders via | Notes |
|---|---|---|---|---|
| **Cube** | `three/tsx/cube.tsx` | the intro rotating cube | generic bridge (`ThreeTsxBridge`) | canonical script, unmodified |
| **Cubes** | `three/tsx/cubes.tsx` | multi-mesh scene graph | generic bridge | many tinted crate cubes; no new engine code |
| **Teapot** | `three/tsx/teapot.tsx` | `webgl_geometry_teapot` | `ThreeTeapotTsxBridge` | lit + env-map reflections, lil-gui panel, OrbitControls |
| **Sponza** | `three/tsx/sponza.tsx` | `webgl_lightprobe` / light-probe volume | `ThreeSponzaTsxBridge` | real glTF model + textures + normal maps, sky, shadows, ACES, baked GI, first-person |

### 8.2 Where they run (support matrix)

✅ works (renders the specified assets) · ◐ codegen-verified, visual run pending.

| Demo | Web gallery (WebGL) | Native SDL (macOS / Linux desktop GL) | Raspberry Pi 5 (GLES2) |
|---|---|---|---|
| **Cube** | ✅ `Cube 3D` (real crate texture) | ◐ launcher `games/cube` (`render=tsx`), real crate via `texture.ppm`; codegen-verified | ◐ same build (GLES2 on ARM); codegen-verified |
| **Cubes** | ✅ `Cubes` (real crate texture) | ◐ launcher `games/cubes` (`render=tsx`), real crate via `texture.ppm`; codegen-verified | ◐ same build (GLES2 on ARM); codegen-verified |
| **Teapot** | ✅ `Teapot` | ✅ `build-teapot-sdl.sh`, launcher `games/teapot` (`render=three`) | ✅ same build (GLES2 auto-selected on ARM) |
| **Sponza** | ✅ `Sponza` | ✅ `build-sponza-sdl.sh`, launcher `games/sponza` (`render=sponza`) | ✅ same build (GLES2 path); fetch + decode over the network |

Notes: the native GL renders are codegen-verified (`-l=cpp`) and run on the user's
desktop/device; the browser renders are verified in headless Chromium. The
Pi-5/GLES2 divergences (float-texture formats, NPOT mipmaps, depth-target formats)
are guarded in `three_gl.rgr`; Apple Silicon is treated as desktop GL, not GLES2.
Cube/Cubes run natively through the *same* generic `ThreeTsxBridge` +
`ThreeGLBackend` as the web (`render=tsx`) and load the real crate (`texture.ppm`
staged in the game folder, decoded to the scene's texture path before the first
frame).

### 8.2.1 Fidelity — the TSX drives the real objects, no silent fakes

The reconciler's job is that the interpreted TSX actually drives the real object
model — not a façade that quietly hardcodes or drops what the scene specified.
Two guarantees make "are we running the specified thing?" **machine-checkable**:

**Specified settings are honoured (real driving).** The generic `ThreeTsxBridge`
reconciles, from the interpreted scene onto the real objects: geometry/material/
light **types**, transforms, **camera orientation** (`camera.rotation`, not just
position), **`scene.background`**, the renderer's **`toneMapping` /
`toneMappingExposure` / `shadowMap.enabled`**, a Preetham **`Sky`**, and a
**shadow-casting** directional light (`castShadow` + `shadow.mapSize` / extents).
`three_tsx_bridge_driven_test` and `three_tsx_bridge_features_test` assert each is
reflected in the real `ThreeWebGLRenderer` / `ThreeScene` / camera / sky / light —
so a scene that aims the camera, sets a clear colour, a tone-map curve, a sky or a
shadow-caster gets exactly that, not a hard-wired host value. (Unspecified values
keep sensible defaults — that is healthy, and not counted.) The generic bridge
therefore already reconciles the **Sponza scene content** (sky + sun + lit meshes);
this is why no per-demo scene bridge is needed — see the deprecation note below.

**Unspecified-but-unsupported things are loud, never faked.** Anything the scene
*specifies* that the bridge cannot reconcile is **counted and warned**, never
silently substituted:
- Textures: `hostTextureCount()` (real supplied asset) vs `fallbackTextureCount()`
  (placeholder); `collectTextureRequests()` reports the referenced paths so a host
  loads exactly those before frame 1. Web decodes the image, native decodes
  `texture.ppm`, and the native runner **logs** `tsx textures: host=N fallback=M`
  each launch.
- Everything else: `unsupportedCount()` (+ a one-line warning) covers an
  unsupported geometry/material/light type or an unhandled feature (e.g. a material
  `envMap` with no supplied cube map). It renders a visible placeholder but **says
  so**, instead of pretending the TSX drove it.

Tests in `run.sh`: `three_tsx_bridge_texture_test` (no asset ⇒ `fallback=1/host=0`;
supplied ⇒ `fallback=0/host=1`) and `three_tsx_bridge_driven_test` (camera / tone
mapping / background honoured; `envMap` ⇒ `unsupportedCount()≥1`).
`fallbackTextureCount()==0` **and** `unsupportedCount()==0` is the guarantee that a
scene rendered exactly what it specified.

Known exceptions (documented, not hidden — these are host **plumbing** choices, not
reconciliation): the **Sponza** host sets tone-mapping exposure to `0.09` (a
deliberate compensation for the non-PBR Lambert shading — the canonical scene's PBR
exposure of `1.0` would blow out), and drives the view via its first-person
controller rather than the scene's `camera.rotation`; in the browser it renders
procedural boxes until the glTF model streams in. (The scene itself — sky, sun,
model, meshes — is reconciled by the generic bridge; only these policy/plumbing bits
live in the host's `ThreeSponzaScene` module.)

### 8.3 API coverage — what's missing for the rest of the examples

Status: ✅ implemented · ◐ partial · ✗ missing. "Unlocks" names the example family
that becomes reachable once the row is ✅ on all three targets.

| Three.js module | Implemented (✅ / ◐) | Missing (✗) | Unlocks |
|---|---|---|---|
| **Math** | Vector3, Euler, Quaternion, Matrix4, Box3, Color, MathUtils ✅; Vector3.setFromSphericalCoords ◐ | Vector2, Vector4, Matrix3, Sphere, Plane, Ray, Frustum, Triangle, Spherical, Cylindrical | prerequisite for raycasting, UV/2D work, culling |
| **Core** | Object3D (transforms/world matrix/children ⇒ also covers Group), BufferGeometry (position/normal/uv/tangent/index), Clock via ThreeTimer ✅ | Raycaster, InstancedBufferGeometry, InterleavedBuffer, BufferAttribute usage beyond the fixed set, Layers, morph attributes | picking/interaction examples, instancing |
| **Cameras** | PerspectiveCamera ✅ | OrthographicCamera (public), CubeCamera, ArrayCamera, StereoCamera | ortho/CAD, cubemap-capture, VR examples |
| **Geometries** | BoxGeometry, TeapotGeometry ✅ | Sphere, Plane, Circle, Cylinder, Cone, Torus, TorusKnot, Ring, Tetra/Octa/Icosa/Dodeca, Capsule, Extrude, Lathe, Tube, Shape, Text, Edges/Wireframe geometry | **most `webgl_geometry_*` examples** |
| **Materials** | MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial (map + envMap; normalMap via glTF) ✅ | MeshStandardMaterial / MeshPhysicalMaterial (PBR metallic-roughness + IBL), ShaderMaterial / RawShaderMaterial, PointsMaterial, LineBasicMaterial / LineDashedMaterial, MeshToon/Matcap/Depth/Normal/Distance materials, per-material normalScale/aoMap/emissiveMap/roughnessMap | **material examples, correct glTF, custom-shader examples** |
| **Lights** | AmbientLight, DirectionalLight (+ shadow, PCF) ✅; LightProbeGrid (custom SH GI) ◐ | PointLight, SpotLight, HemisphereLight, RectAreaLight, standard LightProbe, point/spot shadow maps | **lights & shadow examples** |
| **Objects** | Mesh ✅ | Points, Line / LineSegments / LineLoop, Sprite, InstancedMesh, SkinnedMesh + Skeleton/Bone, LOD | particles, lines, sprites, instancing, skinned characters |
| **Textures** | Texture, CubeTexture (env/skybox) ✅; wrapping/filtering ◐ | DataTexture, CanvasTexture, VideoTexture, CompressedTexture (KTX2/Basis), DepthTexture (public), sRGB color-space decode | procedural/video/compressed-texture examples, correct color |
| **Loaders** | TextureLoader, CubeTextureLoader, GLTFLoader (geometry + TRS nodes + baseColor/normal textures) ◐ | glTF PBR materials / animations / skins / Draco / KTX2 / morph; OBJ, FBX, Collada, STL, PLY, 3MF, USDZ loaders | **loader examples** (the largest example family) |
| **Animation** | — | AnimationMixer, AnimationClip, KeyframeTrack, morph-target & skeletal animation, AnimationObjectGroup | **animation examples**, animated glTF |
| **Controls** (jsm) | OrbitControls, FirstPersonControls ✅ | TrackballControls, FlyControls, MapControls, PointerLockControls, TransformControls, DragControls, ArcballControls | controls & editor-style examples |
| **Renderer** | WebGLRenderer (render, setSize, tone mapping, shadow map, FBO) ◐ | EffectComposer + passes (post-processing), WebGLRenderTarget as public API, MRT, instanced/indirect draw, WebGPURenderer/TSL | **postprocessing examples**, render-target examples |
| **Scene extras** | Scene, Sky (Preetham) ✅ | Fog / FogExp2, background as texture/cubemap API, environment (IBL) property | fog examples, environment-lit examples |
| **Helpers** | LightProbeGridHelper (custom) ◐ | GridHelper, AxesHelper, Box3Helper, CameraHelper, Directional/Point/SpotLightHelper, SkeletonHelper, VertexNormalsHelper | helper/debug examples |
| **Tone/color** | ACES + Reinhard tone mapping, exposure ✅ | full color-management (sRGB working/output color spaces), LinearToneMapping/Cineon/AgX | color-managed examples, AgX examples |

### 8.4 Roadmap (priority order)

Ordered by how many example pages each unlocks per unit of work. Every item stays
inside the shared constraints — object model (ES6 + C++), GPU work as `gpu_*`
es6/cpp templates, shaders in **GLSL ES 1.00** — so each landed row advances web,
macOS, and Pi 5 together.

1. **Primitive geometries** — Sphere, Plane, Cylinder, Cone, Torus, TorusKnot,
   Circle, Ring, the polyhedra. Pure object-model math, portable by construction;
   lights up most `webgl_geometry_*` pages. Highest ratio. (A "Shapes" demo becomes
   trivial on the generic bridge, like Cubes.)
2. **MeshStandardMaterial (PBR) + IBL** — metallic-roughness lighting, an
   environment prefilter (FBO passes already exist), sRGB baseColor decode. Unlocks
   the material family and makes glTF render correctly. Stays ES 1.00 (analytic BRDF
   + prefiltered mip chain, no compute).
3. **Point / Spot / Hemisphere lights** (+ point/spot shadows) — extends the
   übershader light loop; shadow FBO plumbing is reusable. Unlocks lights & shadows.
4. **Points & Line objects** (`PointsMaterial`, `LineBasicMaterial`) — new draw
   modes (`GL_POINTS`/`GL_LINES`) + tiny shaders; particles/lines examples, cheap on
   all three targets.
5. **glTF animation + skinning** (`AnimationMixer`, morph + skeletal) — CPU-side
   sampling is portable; skinning needs a bone-matrix uniform path (ES 1.00-friendly).
   Unlocks animation and animated-loader examples.
6. **Raycaster + a couple more controls** (Transform/Trackball) — interaction/
   picking family; pure object model, no GPU work.
7. **More loaders** (OBJ/STL/PLY first — text/binary, no external deps; then
   Draco/KTX2, which need decoders like the JPEG/PNG path already used natively).
8. **Post-processing** (`EffectComposer` + core passes: FXAA, bloom, outline).
   Feasible in ES 1.00 with ping-pong FBOs + the existing float-texture support; the
   main risk item on GLES2/Pi (format/precision limits), so scope passes to what the
   shared dialect allows.
9. **Fog, Sprite, InstancedMesh, DataTexture/CanvasTexture** — smaller families,
   each a modest object-model + shader-uniform addition.

---

## 9. Value parity — running arbitrary Three.js code from the interpreter

§8 measures **render parity**: does a *known* scene draw the right pixels on all
three targets. This section measures a different, orthogonal axis — **value
parity**: can the interpreter *execute* an arbitrary Three.js snippet and have
every `THREE.*` call return the value real three.js returns, even when nothing is
drawn. The goal is "paste almost any random three.js code and it runs."

The two axes are decoupled and value parity is the larger, more foundational one.
A large fraction of real three.js code — and nearly all of it in docs, tutorials,
Stack Overflow answers and the setup half of every example — is pure math and
scene-graph manipulation that must return correct values *before a single pixel
matters*: `new THREE.Vector3(1,2,3).applyMatrix4(m).normalize().length()`,
`box.setFromObject(mesh).getCenter(v)`, `object.lookAt(target)`,
`raycaster.intersectObjects(scene.children)`, `camera.updateMatrixWorld()`. Today
the façade returns correct values only for the exact call sequences the four demo
scenes make; anything else throws or silently yields `undefined`.

Parity here has **three layers**, top to bottom. Layers 1–2 are what "run any
random code" actually needs; layer 3 is the §8 table.

### 9.1 Layer 1 — interpreter (ComponentEngine) language parity

The scenes run in Ranger's TSX interpreter (`gallery/pdf_writer/src/jsx/
ComponentEngine.rgr`, ~7.3 kloc), which the façade source is concatenated into and
evaluated. It already supports a broad JS subset: classes + methods, arrow
functions, destructuring (`ArrayPattern`/`ObjectPattern`/`RestElement`), spread,
`for…of`/`for…in`, `switch`, `try`/`throw`, template literals, `Map`/`Set`, and
the common `Array`/`Object`/`Math`/`JSON` builtins. Two limitations, however, cap
everything above them and are worked around by hand in the façade today:

- **No `extends` / `super`.** ComponentEngine has no class-inheritance path
  (grep: zero `extends`/`super` handling). This is why the façade comment says
  "no `extends`/`super` (flattened — each node carries its own position/rotation/
  scale)": every façade class re-declares Object3D's fields instead of inheriting
  them. Consequently **any user code that subclasses a THREE class throws** — and
  subclassing is idiomatic three.js (`class Controls extends EventDispatcher`,
  custom `extends BufferGeometry`, `extends Curve`, the whole jsm ecosystem).
- **Reference equality is broken.** `EvalValue.equals` returns `false` for every
  object/array comparison — *including a value against itself* — so `a === a` is
  `false` for objects (`gallery/pdf_writer/src/jsx/EvalValue.rgr:540` "reference
  equality for now → return false"). This silently breaks identity guards
  (`if (obj === selected)`), `array.indexOf(obj)` / `.includes(obj)`, parent/root
  checks (`obj.parent === null` works only because `null` is a primitive),
  Map/Set keyed by object, and raycast/selection dedup. The façade's
  `Scene.remove` cannot use identity and instead tags a `__removed` marker — a
  direct symptom of this gap.

Lower-priority interpreter gaps that arbitrary code hits: **no typed arrays**
(`Float32Array`/`Uint16Array`/… are unregistered, so `new THREE.BufferAttribute(
new Float32Array([...]), 3)` — the standard geometry-building idiom — throws); no
`Promise`/`async`/`await` (loaders must stay callback-shaped; `.loadAsync` is
unavailable); no class getters/setters (accessor properties like a `.needsUpdate`
setter can't be expressed).

### 9.2 Layer 2 — façade (`three.tsx`) value parity

The façade is **demo-shaped**: it declares only the classes, methods and constants
the cube/cubes/teapot/Sponza scenes touch. The underlying *values* mostly already
exist in the Ranger core (`three/src`) — the gap is that the interpreter-facing
façade doesn't surface them. The clearest example: the core `ThreeVector3` has 33
methods (`add`, `sub`, `cross`, `dot`, `normalize`, `applyMatrix4` via Matrix4,
`lerp`, `distanceTo`, …) but the façade `Vector3` exposes **5**
(`set`/`copy`/`setScalar`/`clone`/`setFromSphericalCoords`). So value parity is
largely a **surfacing** exercise, not new engine math.

Concrete façade gaps for arbitrary code:

- **Math is stubbed.** `Vector3` = 5 of ~90 methods. `Vector2`, `Vector4`,
  `Matrix3`, `Quaternion`, `Euler`, `Box3`, `Sphere`, `Ray`, `Plane`, `Line3`,
  `Triangle`, `Spherical`, `Cylindrical`, `Frustum`, `MathUtils` are **absent from
  the façade** (several exist in the core — `ThreeQuaternion`/`ThreeEuler`/
  `ThreeBox3`/`ThreeMathUtils` — just not exposed). `Color` is a hex box: no
  `.set('red')`, `.setHSL`, `.getHex`, `.r/.g/.b`, `.convertSRGBToLinear`.
- **Object3D surface is missing.** No `lookAt`, `traverse`/`traverseVisible`,
  `updateMatrixWorld`, `getWorldPosition/Quaternion/Scale/Direction`,
  `localToWorld`/`worldToLocal`, `applyMatrix4`, `rotateX/Y/Z`/`rotateOnAxis`,
  `translateOnAxis`, `.parent`, `.matrix`/`.matrixWorld`, `getObjectByName`,
  `clone`/`copy`. `add`/`remove` don't maintain `.parent`. Every scene node
  re-declares its own `position`/`rotation`/`scale` (the `extends` gap).
- **Constants are ad-hoc and silently `undefined`.** `teapot.tsx` reads
  `THREE.SRGBColorSpace`, which the façade never defines — it happens to resolve
  only because the *host* registers a `THREE` global with that one key
  (`web_tsx3d_gl_host.rgr` `registerGlobals`). Any other enum
  (`THREE.LinearFilter`, `THREE.RGBAFormat`, `THREE.AdditiveBlending`,
  `THREE.PCFSoftShadowMap`, …) evaluates to `undefined` with no error — code runs
  but configures the wrong thing.
- **Construction breadth.** Most geometry constructors (`SphereGeometry`,
  `PlaneGeometry`, …), materials (`MeshStandardMaterial`, `ShaderMaterial`,
  `PointsMaterial`, `LineBasicMaterial`), objects (`Group`, `Points`, `Line`,
  `Sprite`, `InstancedMesh`), `BufferGeometry.setAttribute`/`BufferAttribute`,
  `EventDispatcher`, `Clock`, `Raycaster`, and the loaders don't exist on the
  façade, so even `new THREE.X(...)` throws before any render question arises.

### 9.3 Layer 3 — render parity

Exactly the §8.3 table: once a call *executes and holds the right value*, does the
`ThreeTsxBridge` + `ThreeGLBackend` actually draw it (or loudly count it via
`unsupportedCount()`). This is downstream of layers 1–2 and unchanged here.

### 9.4 Steps for value parity (ordered by leverage)

1. **Fix the two interpreter blockers** — they cap every layer above them.
   (a) Reference/identity equality in `EvalValue.equals` (compare object/array
   handles instead of returning `false`), and (b) `extends`/`super` in
   ComponentEngine (field + method inheritance, `super(...)` constructor chaining,
   `super.m()` dispatch). Together these let the façade stop hand-flattening and
   let *user* subclasses run — the single biggest unlock for "random code."
2. **Make the math layer value-complete on the façade** — the highest-leverage
   pure-value work (no GPU). Surface the core's Vector3/Quaternion/Euler/Matrix4/
   Box3/Color/MathUtils in full and add the missing `Vector2/Vector4/Matrix3/
   Sphere/Ray/Plane/Line3/Triangle/Spherical`. Gate with a **numeric** test that
   runs three.js math snippets and asserts equality against known reference outputs.
3. **Complete the Object3D surface once** (post-`extends`): `lookAt`, `traverse*`,
   `updateMatrixWorld`, `getWorld*`, `local/worldToLocal`, `applyMatrix4`,
   `rotate*`/`translate*`, `.parent` bookkeeping, `getObjectByName`, `clone`/`copy`
   — inherited by Mesh/Camera/Light/Group/Scene.
4. **Ship a complete constant registry** — every `THREE.*` enum (sides, wrapping,
   filters, formats/types, color spaces, tone-mapping, blending, shadow-map types,
   draw usage) as real façade exports, so a constant is never silently `undefined`.
5. **Add typed arrays + the BufferAttribute/BufferGeometry builder API** to the
   interpreter and façade, so geometry-building code (`setAttribute(new
   BufferAttribute(new Float32Array(...), 3))`) executes.
6. **Broaden construction** — value holders for the remaining geometries,
   materials, objects, plus `EventDispatcher`, `Clock`, `Raycaster` (a value-level
   `intersectObjects` on the now-complete math layer), and callback-shaped loader
   stubs. Unrenderable ones still flow through the bridge's loud `unsupportedCount()`
   path, so "runs" never masquerades as "renders."
7. **A conformance harness — the measurable gate.** Mirror §8.2.1's machine-checked
   fidelity gate for values: assemble a corpus of snippets (three.js docs/examples,
   plus a generated set), run each under the interpreter against the façade, and
   classify — *executed clean* / *threw* (missing symbol · missing method ·
   unsupported language feature) / *value mismatch* vs a real-three.js reference.
   Track **"% runs without throwing"** as the parity metric. That number *is* the
   operational definition of "run almost any random Three.js code," made
   machine-checkable — the value-axis counterpart of
   `fallbackTextureCount()==0 && unsupportedCount()==0`.

Note the division of labour vs §8.4's roadmap: that roadmap grows **render**
coverage (new geometries/materials/lights that draw); this list grows **value**
coverage (the same API surface *executing and returning correct values*). Steps
1–4 are almost entirely interpreter + façade work with no GPU component, so they
advance web, macOS and Pi 5 identically and can land ahead of the matching render
support.
