# IDEAL_THREE — a Ranger clone of Three.js, one object model for every target

> Status: **active design + build** (see [`three/`](./three) and
> [`three/README.md`](./three/README.md)). Companion to [`IDEAL_3D.md`](./IDEAL_3D.md)
> (the WASM host-owned-scene model) — this document covers the **portable Ranger
> 3D object model** and the **Three.js-compatible API** on top of it.

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

## 7. The render bridge (built) + browser host (next)

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

Remaining — the browser host:

1. Wire `ThreeGLBackend` into a browser host: a real canvas + WebGL context for
   `ThreeGLBackend.init(canvasId)`, host-decoded texture pixels handed to the
   bridge (`setTexture(path, rgba, w, h)`), and the DOM stubs the example's web
   plumbing needs (`document.body.appendChild`, `renderer.domElement`,
   `addEventListener` for resize).
2. Drive `setAnimationLoop(fn)` from the host `requestAnimationFrame` loop.
3. Land the canonical cube running 1:1 **and rendering on the GPU** in the browser.

The measure of success: the Three.js cube script runs **unchanged** (✅ executes
on the façade, ✅ renders through the core headlessly) and, once the browser host
lands, renders GPU-accelerated — while the same scene, built from Ranger, renders
natively. One object model, many front-ends and targets.
