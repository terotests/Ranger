# IDEAL_THREE — a Ranger clone of Three.js, one object model for every target

> Status: **active design + build** (see [`three/`](./three) and
> [`three/README.md`](./three/README.md)). Companion to [`IDEAL_3D.md`](./IDEAL_3D.md)
> (the WASM host-owned-scene model) — this document covers the **portable Ranger
> 3D object model** and the **Three.js-compatible API** on top of it.
>
> Targets run 1:1 in the interpreter, each with `*_test.rgr` in `run.sh`: the
> rotating cube (§6–§7), the teapot ([`IDEAL_TEAPOT.md`](./three/IDEAL_TEAPOT.md)),
> and the Sponza light-probe volume ([`IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md)) —
> §8 records what each added and where it renders; **§9 is the example-section
> parity table** (what runs today, what's missing, and the roadmap to the full
> three.js examples section on web / macOS / Pi 5).

## 1. The goal

Run the canonical Three.js example **1:1, unmodified**, as a `.tsx` script in the
browser TSX engine:

```js
import * as THREE from 'three';
const camera = new THREE.PerspectiveCamera( 70, w/h, 0.1, 100 );
camera.position.z = 2;
const scene = new THREE.Scene();
const texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { map: texture } );
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setAnimationLoop( () => { mesh.rotation.x += 0.005; renderer.render( scene, camera ); } );
```

…while the **actual engine** underneath is **Ranger** — the same code that
compiles to native (C++) and, in the future, to WASM. No three.js JavaScript is
imported into the browser; the 3D engine is Ranger.

## 2. The three layers

Every file belongs to exactly one layer:

```
   ┌────────────────────────────────────────────────────────────────────┐
   │ 1. FAÇADE  (TSX-only adapter — optional, additive)                   │
   │    three.tsx: thin THREE.* data classes so the 1:1 script runs in    │
   │    the interpreter. Holds mutable state (position/rotation/params);   │
   │    delegates all heavy work down. NOT part of the object model.       │
   ├────────────────────────────────────────────────────────────────────┤
   │ 2. OBJECT MODEL  (the canonical engine — pure Ranger)  ← three/src   │
   │    ThreeVector3/Matrix4/Quaternion/Euler, Object3D, Scene, Camera,   │
   │    BufferGeometry/BoxGeometry, Material, Texture, Mesh, WebGLRenderer.│
   │    All math + scene graph + resource ownership. NO JS. Compiles to    │
   │    ES6, C++, and (target) WASM from one source.                       │
   ├────────────────────────────────────────────────────────────────────┤
   │ 3. RENDER BACKEND  (pluggable — ThreeRenderBackend)                   │
   │    ThreeSoftwareBackend (pure Ranger rasteriser, default/fallback)   │
   │    ThreeGLBackend      (three_gl.rgr: WebGL via es6 templates,        │
   │                         OpenGL/GLES via cpp templates — one source)   │
   └────────────────────────────────────────────────────────────────────┘
```

## 3. The object model is canonical and front-end-agnostic

**Layer 2 is the whole engine.** A full scene can be built and rendered from
**Ranger code alone**, with no façade and no TSX — the cube demo
(`three/src/three_cube_demo_test.rgr`) does exactly this. Three front-ends drive
the *same* object model:

```
                 ┌─ TSX façade (interpreter)  → reconciles into the model at render
   scene source: ├─ Ranger code               → constructs the model objects directly
                 └─ WASM guest (future)        → constructs the model objects directly
                                                        ▼
                                            Ranger Three object model (layer 2)
```

- **Ranger / C++ / WASM** use the object model **directly** — no façade, no
  reconciliation. A `Ranger → WASM` build of layer 2 yields the *same* classes
  (`ThreeObject3D`, `ThreeMesh`, …) in WASM linear memory; a WASM guest sets
  `position`/`rotation` on them and calls `render()`.
- **The TSX façade is an adapter for the interpreter only**, because the
  interpreter cannot hold Ranger objects directly. Its thin data mirror +
  render-time reconciliation is a TSX-specific detail; it adds nothing to the
  object model and is invisible to the other paths.

**Consequence (the WASM guarantee):** choosing a thin façade for TSX does **not**
reshape or burden the object model. The object model stays canonical; a future
WASM use compiles the same layer-2 Ranger and drives it natively. The façade is
additive, not foundational.

## 4. Dynamic mutation without proxies — the Three.js `needsUpdate` model

The façade must support dynamic property mutation (`mesh.rotation.x += 0.005`
every frame, `camera.position.z = 2`, resize handlers). It does so **without
proxy objects or deep interpreter changes**, by mirroring Three.js's own model:

| Kind | Lives in | Sync |
|------|----------|------|
| **Mutable per-frame state** — position, rotation, scale, camera fov/aspect/near/far, material colour | the façade object, as plain data | **re-read fresh at every `render()`** — mutation is picked up automatically |
| **Heavy immutable resource** — geometry vertices, texture pixels | uploaded once to the object model / backend, cached by handle | re-built/re-uploaded only when `needsUpdate` is set (exactly Three.js) |

`renderer.render(scene, camera)` walks the façade scene, hands the current
transforms + resource handles to the Ranger `ThreeWebGLRenderer`, which computes
the matrices (**its own `Object3D`/`Matrix4` — no math duplicated in the façade**)
and draws through the active backend. Per-frame mutation is cheap (interpreted
data), and one reconcile call per frame batches the whole scene — simpler *and*
faster than a per-property native proxy.

**A proxy is only needed** if the Ranger object were the single source of truth
and every property access forwarded to native — that needs interpreter member
get/set interception (deep change, a native call per property, slower for
per-frame mutation). The façade avoids it.

## 5. Portability rules (non-negotiable)

- **No JavaScript in the object model or backend logic.** Layer 2 is pure Ranger
  and compiles with `-l=cpp` (verified) — native / Raspberry Pi / embedded, and
  the same source targets WASM.
- **GPU code lives only in the backend, via Ranger's template system.**
  `three_gl.rgr` gives each GPU op an `es6` (WebGL) *and* a `cpp` (OpenGL/GLES)
  body through `templates { … } + create_polyfill`, so the compiler emits the
  WebGL calls and the OpenGL calls from one Ranger source — no hand-written `.js`.
  Opaque `int` handles bridge WebGL objects (JS arrays) vs `GLuint` (`std::vector`).
- **Shaders are shared GLSL ES 1.00** — one source for WebGL1/2, GLES2 and
  desktop GL compat.
- **The backend is pluggable.** The object model is agnostic to software vs GPU;
  WASM can use the software backend (pure Ranger → WASM) or a WASM-hosted GL
  binding without touching the model.

## 6. Status (built)

Pieces 1–12 of the object model + the GPU backend are done and tested
(`three/src/*_test.rgr`, `run.sh` → ALL PASS; `-l=cpp` clean):

- Math: `ThreeVector3`, `ThreeEuler`, `ThreeQuaternion`, `ThreeMatrix4`.
- Scene: `ThreeObject3D`, `ThreeScene`, `ThreePerspectiveCamera`.
- Geometry/appearance: `ThreeBufferGeometry`, `ThreeBoxGeometry`, `ThreeTexture`,
  `ThreeTextureLoader`, `ThreeMaterial`, `ThreeMeshBasicMaterial`, `ThreeMesh`.
- Renderer: `ThreeWebGLRenderer` + `ThreeRenderBackend` + `ThreeSoftwareBackend`
  (the cube renders; perspective-correct textures).
- GPU backend: `three_gl.rgr` (WebGL + OpenGL/GLES from one source), `ThreeGLBackend`.

**Façade PoC (layer 1) — the 1:1 cube runs in the interpreter.**
`three/tsx/three.tsx` (thin façade) + `three/tsx/cube.tsx` (the canonical Three.js
example, **unmodified**) run headless through the TSX `ComponentEngine`
(`three/tsx/three_facade_poc.rgr`, wired into `run.sh` → `9/9 ALL PASS`). It
proves `new THREE.PerspectiveCamera(...)`, `TextureLoader().load(...)`,
`THREE.SRGBColorSpace`, `new BoxGeometry()`, `MeshBasicMaterial({map})`,
`scene.add`, `renderer.setSize(window.innerWidth, …)` and
`renderer.setAnimationLoop(animate)` all parse and execute, and that the frame
loop mutates `mesh.rotation.{x,y}` and drives `renderer.render` each tick.

Interpreter/parser enablers added for the 1:1 code (all with regression checks):

- TSX parser: `new A.B(args)` (member-expression callee) — the #1 blocker for
  `new THREE.X(...)`.
- TSX parser: multi-declarator `let a, b, c;` (the example's `let camera, scene,
  renderer;`).
- TSX parser: reserved words as class member names (the façade's `Vector3.set(...)`).
- `ComponentEngine`: `'three'` / `@ranger/three` as an **`import` capability hint**
  — recognised and skipped (no file load); `THREE.*` resolves to the façade classes.
- `ComponentEngine`: uninitialised module vars (`let camera;`) get a module-scope
  binding so a later top-level assignment (inside `init()`) is visible to other
  functions (`animate()`, the introspection hooks).
- Host globals: `window` (innerWidth/innerHeight/devicePixelRatio) and the `THREE`
  constants object are injected via `registerGlobal`.

> **Status update:** the "next"/"Pending" items in §7 and §8.2 below (browser
> host, render-to-texture passes, glTF textures) are now **built**. See
> [`THREE.md`](./THREE.md) for the current state and how to run it.

## 7. The render bridge (built) + browser host (built)

**The render bridge works headlessly.** `ThreeTsxBridge` (`three/tsx/three_tsx_bridge.rgr`)
reconciles the interpreted façade scene into the canonical Ranger core and draws
it through the pluggable backend — the `needsUpdate` model of §4:

- reads the façade `scene` + `camera` out of the `ComponentEngine`
  (`getGlobal` + `EvalValue` member reads);
- builds the Ranger objects once (geometry/material/texture cached by index/path
  so the upload happens a single time) and updates the mutable per-frame state
  (camera, position/rotation/scale) every frame;
- calls `ThreeWebGLRenderer.render(scene, camera)`, which draws via the backend.

`three/tsx/three_tsx_bridge_test.rgr` (in `run.sh`, **4/4 PASS**) drives the
*unmodified* `cube.tsx` through the interpreter and rasterises it with the
**software** backend: the cube covers the frame, and ticking the interpreted
`animate()` loop **changes the rendered pixels** — i.e. the 1:1 Three.js code
actually renders, GPU-independent. Swapping in `ThreeGLBackend`
(`renderer.setBackend(gl)`) draws the same scene on the GPU.

The browser host is built: `ThreeGLBackend` runs on a real canvas + WebGL context
(`ThreeGLBackend.init(canvasId)`), host-decoded texture pixels are handed to the
bridge, and the DOM/`requestAnimationFrame` plumbing the examples need is stubbed.
The cube, teapot and Sponza all run 1:1 in the browser gallery **and render on the
GPU** (verified in headless Chromium), while the same object model renders natively
via SDL. One object model, many front-ends and targets. See [`THREE.md`](./THREE.md).

## 8. Further targets: the teapot and the Sponza light-probe volume

Two larger Three.js examples are ported the same way — new object-model classes
(each a `Three*` file + `*_test.rgr`, `run.sh` green, `-l=cpp` clean) plus the
example's scene code run in the interpreter against the façade and reconciled into
the core by a per-example bridge.

### 8.1 Teapot ([`three/IDEAL_TEAPOT.md`](./three/IDEAL_TEAPOT.md), `three/tsx/teapot.tsx`)

The `webgl_geometry_teapot` scene runs 1:1: lighting (`ThreeAmbientLight`,
`ThreeDirectionalLight`), lit materials (`ThreeMeshLambertMaterial`,
`ThreeMeshPhongMaterial` — specular / shininess / flatShading / DoubleSide /
wireframe), `ThreeColor`, the Bézier-patch `ThreeTeapotGeometry`, `ThreeCubeTexture`
env maps, and a lil-gui panel drawn as an EVG overlay. `ThreeTeapotTsxBridge`
reconciles the interpreted scene into the core; `web/web_teapot_tsx_host.rgr` draws
it on the GPU in the browser (verified in headless Chromium). Host hooks
(`setShading` / `setTess` / …) make panel edits hot-reload.

### 8.2 Sponza light-probe volume ([`three/IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md), `three/tsx/sponza.tsx`)

The `light probe volume (Sponza)` example: a glTF scene with an atmospheric sky, a
shadow-casting directional light, ACES tone mapping, first-person controls and a
baked diffuse-GI probe volume. Built as portable, unit-tested pieces:

- `ThreeMathUtils`, `ThreeTimer`, `ThreeBox3` (+ `Object3D.expandBox3` /
  `boundingBox`, `Vector3.setFromSphericalCoords`) — scalar/clock/bounds.
- `ThreeFirstPersonControls`, `ThreeLoadingManager` — input + load tracking.
- `ThreeToneMapping` (ACES Narkowicz + Reinhard) + a fragment tone-map epilogue
  (`uToneMapping` / `uExposure`) + renderer `toneMapping` / `toneMappingExposure`.
- `Matrix4.makeOrthographic`, `ThreeDirectionalLightShadow` (+ `DirectionalLight`
  `shadow` / `target` / `castShadow`, `Mesh.castShadow` / `receiveShadow`) — the
  light-space shadow matrix.
- `ThreeSky` (Preetham uniforms) + the Sky scattering shader (`atmosphereVertexSrc`
  / `atmosphereFragmentSrc`, GLSL ES 1.00).
- `ThreeGLTFLoader` — a glTF binary accessor decoder (IEEE-754 float32 + LE ints →
  `ThreeBufferGeometry`).
- `ThreeSphericalHarmonics3` + `ThreeLightProbeGrid` (+ `ThreeLightProbeGridHelper`)
  — order-2 SH projection/reconstruction, a probe grid with an analytic bake and a
  trilinear irradiance lookup.
- `ThreeSponzaScene` — composes the scene (sky, sun + shadow, model bounds, probe
  volume, controls) from the above; the reconciliation target both hosts share.

The scene runs interpreted with hot reload, like the teapot: `sponza.tsx` is the
scene declaration (the async glTF download, the render loop, first-person controls
and the lil-gui panel are host plumbing, as OrbitControls/GUI are for the teapot);
`three/tsx/three_sponza_tsx_bridge.rgr` reconciles it into `ThreeSponzaScene`; and
`three/tsx/three_sponza_tsx_test.rgr` (in `run.sh`) checks the reconcile and the
hot-reload — editing the interpreted scene moves the sun, rebuilds the probe
volume and toggles GI. `three/sponza_sdl_runner.rgr` + `scripts/build-sponza-sdl.sh`
run the same interpreter + bridge + `ThreeGLBackend` natively on SDL2 + OpenGL,
with a file-watch reload (verified by C++ codegen; the visual run is a local
desktop-GL step, as the teapot's native path is).

Host-side asset loading is done: `http_get_bytes` (`three_http.rgr`, libcurl on
native / Node curl on es6) fetches over HTTPS; `three_json.rgr` is a C++-compiling
JSON parser (since `lib/JSON` is ES6-only); and `three_gltf_file.rgr` splits a
`.glb` (or fetches a multi-file `.gltf` + external buffers) and decodes it into an
`Object3D`. `sponza_sdl_runner` fetches + decodes the model at startup, so the real
Sponza loads on-device with no interpreter async — verified end-to-end (the live
fetch produced Sponza's atrium bounds 29.77 x 12.45 x 18.31).

Built since: the render-to-texture (FBO) shadow-map pass in `ThreeGLBackend` (two-
pass depth render sampled with PCF) and the shadow-map-driven per-probe sun
visibility for the GI bake; glTF baseColor **and tangent-space normal** textures
(decoded natively via Ranger's JPEG/PNG decoders, or in-browser via canvas); and
the browser host + gallery entry for `sponza.tsx` plus a native launcher entry
(`games/sponza`, `render=sponza`). See [`THREE.md`](./THREE.md) for the full state.
Still open: glTF PBR metallic-roughness specular, sRGB baseColor decode, captured
(vs analytic) per-probe GI, `normalScale`, and anti-aliasing / AO.

## 9. Example-section parity — one API across web / macOS / Pi 5

The end goal is to run the **three.js examples section** (`threejs.org/examples`)
1:1 on all three targets: **web** (WebGL), **macOS** (desktop OpenGL via SDL), and
**Raspberry Pi 5** (GLES2 via SDL). Every example is `import * as THREE from
'three'` plus, usually, one or two helpers from `three/examples/jsm` (a control, a
loader, a post pass). Parity therefore has two axes: the **`THREE.*` API surface**
each example touches, and the **backend/shader features** that surface needs on the
GPU. Both must land in a form that compiles to ES6 **and** C++ and runs in **GLSL
ES 1.00** (the shared shader dialect — the ceiling for the whole matrix, since
GLES2 on Pi has no `dFdx`, no MRT-by-default, no compute, no GLSL 3.00 features).

### 9.1 Portability of every new feature (the rule)

A feature is "done for the examples section" only when it is green on all three
targets. Concretely, each addition must: (a) live in the object model (`three/src`,
no JS) so it compiles to ES6 + C++; (b) express any GPU work as a `gpu_*` op with
both an `es6` and a `cpp` template (`three_gl.rgr`); (c) keep new shader code in
**GLSL ES 1.00** — per-vertex attributes instead of screen-space derivatives, and
`#if …&& !defined(__APPLE__)` guards for the GLES2/Pi divergences (float-texture
formats, NPOT mipmaps, depth-target formats) already used by GI/shadows; and
(d) carry a `*_test.rgr` in `run.sh` plus a codegen `-l=cpp` check. The existing
Sponza feature set (FBO shadow pass, float-texture SH GI, Preetham sky, tangent
normal maps) is the proof this path works end-to-end across the matrix.

### 9.2 API parity table

Status: ✅ implemented · ◐ partial · ✗ missing. "Unlocks" names the example
family that becomes reachable once the row is ✅ on all targets.

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

### 9.3 Roadmap to the examples section (priority order)

Ordered by how many example pages each unlocks per unit of work, given the
three-target constraint:

1. **Primitive geometries** — Sphere, Plane, Cylinder, Cone, Torus, TorusKnot,
   Circle, Ring, and the polyhedra. Pure object-model math (no new GPU features),
   so it is portable by construction and immediately lights up most
   `webgl_geometry_*` pages. Highest ratio.
2. **MeshStandardMaterial (PBR) + IBL** — metallic-roughness lighting, an
   environment map prefilter (FBO passes already exist), and sRGB baseColor decode.
   Unlocks the material family and makes glTF render correctly. Must stay ES 1.00
   (analytic BRDF + prefiltered mip chain, no compute).
3. **Point / Spot / Hemisphere lights** (+ point/spot shadows) — extends the
   übershader's light loop; shadow FBO plumbing is reusable. Unlocks the lights and
   shadow families.
4. **Points & Line objects** (`PointsMaterial`, `LineBasicMaterial`) — new draw
   modes (`GL_POINTS`/`GL_LINES`) + tiny shaders; unlocks particles/lines examples,
   cheap on all three targets.
5. **glTF animation + skinning** (`AnimationMixer`, morph + skeletal) — CPU-side
   sampling is fully portable; skinning needs a bone-matrix uniform path in the
   vertex shader (ES 1.00-friendly). Unlocks the animation and animated-loader
   examples.
6. **Raycaster + a couple more controls** (Transform/Trackball) — enables the
   interaction/picking family; pure object model, no GPU work.
7. **More loaders** (OBJ/STL/PLY first — text/binary, no external deps; then
   Draco/KTX2 which need decoders like the JPEG/PNG path already used natively).
8. **Post-processing** (`EffectComposer` + core passes: FXAA, bloom, outline).
   Feasible in ES 1.00 with ping-pong FBOs + the existing float-texture support;
   the main risk item on GLES2/Pi (format/precision limits), so scope passes to
   what the shared dialect allows.
9. **Fog, Sprite, InstancedMesh, DataTexture/CanvasTexture** — smaller families,
   each a modest object-model + shader-uniform addition.

Everything above compiles to ES6 + C++ and runs in GLSL ES 1.00, so each landed
row advances web, macOS, and Pi 5 together — the single-object-model bet from §3
is exactly what makes the examples section reachable on all three targets at once.
