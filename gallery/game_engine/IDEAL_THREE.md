# IDEAL_THREE — a Ranger clone of Three.js, one object model for every target

> Status: **active design + build** (see [`three/`](./three) and
> [`three/README.md`](./three/README.md)). Companion to [`IDEAL_3D.md`](./IDEAL_3D.md)
> (the WASM host-owned-scene model) — this document covers the **portable Ranger
> 3D object model** and the **Three.js-compatible API** on top of it.
>
> This document is the **API / design** reference: the layering, the object model,
> the façade contract, the render-backend interface, and the implemented API
> surface (§6). The **demos** — the catalog, which platform each runs on, the
> API-coverage table and the roadmap to the three.js examples section — live in
> [`THREE.md`](./THREE.md), together with per-example notes in
> [`IDEAL_TEAPOT.md`](./three/IDEAL_TEAPOT.md) and
> [`IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md).

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
- **There is exactly ONE reconciler, and it is generic. Never write a per-demo
  scene bridge.** `three/tsx/three_tsx_bridge.rgr` (`ThreeTsxBridge`) maps each
  interpreted façade object to its **canonical Ranger counterpart by type** —
  geometry (Box/Teapot/…), material (Basic/Lambert/Phong, colour/map/side/…), light
  (Ambient/Directional + shadow), **sky**, camera (position **and** orientation),
  `scene.background`, and `renderer` tone-mapping / shadow toggle — producing a real
  `ThreeScene` / `ThreeObject3D` graph the renderer walks (`updateMatrixWorld`,
  `walkLights`, `renderObject`). It anything it cannot reconcile is **counted and
  warned** (`unsupportedCount` / `fallbackTextureCount`), never silently faked.

  ### The one way to add a feature
  A new capability is added by making the interpreted TSX drive the **real object
  model**, in this order — not by branching per demo:
  1. Add/extend the **object-model** class in `three/src` (pure Ranger, `-l=cpp`
     clean, a `*_test.rgr`).
  2. If it needs the GPU, add the `gpu_*` op (es6 **and** cpp templates) and any
     GLSL ES 1.00 shader work.
  3. Teach **`ThreeTsxBridge`** to reconcile that node/property **by type**, and add
     a bridge test that asserts the interpreted scene produced the real object
     (see `three_tsx_bridge_{lit,driven,features}_test`).
  4. Only genuinely non-scene concerns become a **host plumbing module** — input
     controllers (Orbit/first-person), async asset fetch/decode, GPU passes the host
     orchestrates (e.g. the light-probe **GI bake** + per-probe visibility), and
     render policy (e.g. exposure compensation). Plumbing *drives* the one
     reconciler; it never forks it. This mirrors three.js, where controls and
     loaders live in `examples/jsm`, not in the core.

  A bridge that hard-codes one geometry + one material — or a second `*_tsx_bridge`
  per demo — is **forbidden**: adding an example must not add a reconciler.

  > **The teapot bridge is gone.** `three_teapot_tsx_bridge.rgr` has been **deleted**:
  > the `webgl_geometry_teapot` scene now runs on the generic `ThreeTsxBridge`, with
  > `WebTeapotTsxHost` reduced to pure plumbing (OrbitControls + the lil-gui panel +
  > the procedural env cube map / UV texture / grey background the example loads from
  > image files). Reflections, the six shading modes and GUI re-tessellation all work
  > through the generic reconciler (verified headless; `three_teapot_tsx_test` asserts
  > reconcile + rebuild-on-change). This required only *general* additions to
  > `ThreeTsxBridge` — envMap → reflective material, and rebuild-on-signature-change
  > (the needsUpdate model) — plus a real `scene.remove` in the façade.
  >
  > **`three/tsx/three_sponza_tsx_bridge.rgr` is the last transitional bridge** and is
  > *not* the pattern to copy. The generic bridge already reconciles the Sponza scene
  > *content* (sky, shadow-casting sun, lit meshes — `three_tsx_bridge_features_test`);
  > its remaining job is plumbing (FPC, async glTF, the GI bake, exposure policy),
  > which moves to a host module as it is retired in favour of `render=tsx`.

## 6. The implemented API surface

The object model + the GPU backend below are built and tested
(`three/src/*_test.rgr`, `run.sh` → ALL PASS; `-l=cpp` clean). This is the
canonical list of classes the façade/Ranger/WASM front-ends drive; for which
demos exercise them and what is still missing per module, see the coverage table
in [`THREE.md §8`](./THREE.md#8-demos--parity).

- **Math:** `ThreeVector3`, `ThreeEuler`, `ThreeQuaternion`, `ThreeMatrix4`
  (incl. `makeOrthographic`, `transformPoint`), `ThreeBox3`, `ThreeColor`,
  `ThreeMathUtils`, `ThreeTimer`.
- **Scene graph:** `ThreeObject3D` (transforms, world matrices, bounds),
  `ThreeScene`, `ThreePerspectiveCamera`.
- **Geometry:** `ThreeBufferGeometry` (positions/normals/uvs/tangents/index),
  `ThreeBoxGeometry`, `ThreeTeapotGeometry` (Bézier patches).
- **Materials / textures:** `ThreeMaterial`, `ThreeMeshBasicMaterial`,
  `ThreeMeshLambertMaterial`, `ThreeMeshPhongMaterial` (map + normalMap + envMap),
  `ThreeTexture`, `ThreeTextureLoader`, `ThreeCubeTexture`.
- **Lights / GI / sky:** `ThreeAmbientLight`, `ThreeDirectionalLight`
  (`castShadow`/`target`/`shadow`), `ThreeDirectionalLightShadow`,
  `ThreeSphericalHarmonics3`, `ThreeLightProbeGrid` (+ helper), `ThreeSky`
  (Preetham), `ThreeToneMapping` (ACES / Reinhard).
- **Controls:** `ThreeOrbitControls`, `ThreeFirstPersonControls`,
  `ThreeLoadingManager`.
- **Asset loading:** `ThreeGLTFLoader` / `ThreeGLTFFile` (glTF/`.glb` accessors +
  TRS nodes + baseColor/normal textures), `ThreeJsonParser`/`ThreeJsonValue`
  (C++-compiling JSON), `three_http.rgr` (`http_get_bytes`),
  `ThreeGLTFTextures` (native JPEG/PNG decode).
- **Renderer:** `ThreeWebGLRenderer` (scene walk, light collection, tone-map +
  shadow + GI orchestration) + `ThreeRenderBackend` + `ThreeSoftwareBackend`
  (pure-Ranger rasteriser; perspective-correct textures).
- **GPU backend:** `three_gl.rgr` (WebGL + OpenGL/GLES from one source) +
  `ThreeGLBackend` + the shared übershader (`three_gl_shaders.rgr`, GLSL ES 1.00):
  unlit/Lambert/Phong, HDR tone mapping, FBO shadow mapping (PCF), per-fragment SH
  probe GI, Preetham sky, tangent-space normal mapping, cube-map skybox/reflection.

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

## 7. The render bridge + browser host

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
An interpreted `.tsx` scene runs 1:1 in the browser **and renders on the GPU**,
while the same object model renders natively via SDL — one object model, many
front-ends and targets. Which scenes run where is catalogued in
[`THREE.md §8`](./THREE.md#8-demos--parity).

## 8. Demos, coverage, and the examples-section roadmap

Moved to [`THREE.md`](./THREE.md) so this file stays a pure API/design reference.
`THREE.md` holds the demo catalog (Cube, Cubes, Teapot, Sponza), the
where-does-it-run support matrix (web / macOS / Raspberry Pi 5), the per-module
API-coverage table (what is implemented vs missing), and the priority-ordered
roadmap toward running the full three.js examples section on all three targets.
Per-example design notes remain in
[`three/IDEAL_TEAPOT.md`](./three/IDEAL_TEAPOT.md) and
[`three/IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md).
