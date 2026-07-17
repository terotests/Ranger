# three — a Ranger clone of Three.js

A port of the [Three.js](https://threejs.org) API to the **Ranger language**,
built the same way as the [`physics/`](../physics) Cannon.js port: **one class
per file, ported faithfully, each with a matching `*_test.rgr`**, added **piece
by piece**. No three.js JavaScript is imported into the browser — this is Ranger
code, so it compiles to the same targets as the rest of the engine (browser JS,
native) and reuses the engine's existing 3D pieces (`model3d/`, `SoftRenderer3D`,
and the WebGL export in `web/`).

The API mirrors Three.js so the familiar code shape carries over. Target — the
canonical rotating textured cube:

```js
// three.js
const camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
camera.position.z = 2;
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
function animate() { mesh.rotation.x += 0.005; mesh.rotation.y += 0.01; renderer.render(scene, camera); }
```

In Ranger the classes are `Three*` and construct empty then configure (the same
convention the Cannon port uses, e.g. `new CannonVec3` + `.set(...)`); fluent
methods return `this` so calls chain just like three.js.

## Layout

```
three/src/
  three_vector3.rgr        + three_vector3_test.rgr
  … (more per class, added piece by piece)
  run.sh                    # compile every *_test.rgr to ES6 and run under Node
```

Run the tests:

```sh
bash gallery/game_engine/three/src/run.sh    # prints ALL PASS per suite
```

## Roadmap (piece by piece)

| # | Piece | Three.js source | Status |
|---|-------|-----------------|--------|
| 1 | `ThreeVector3` | `math/Vector3.js` | ✅ done (25 checks) |
| 2 | `ThreeEuler` | `math/Euler.js` | ✅ done (9 checks) |
| 3 | `ThreeQuaternion` (incl. `setFromEuler`, all 6 orders) | `math/Quaternion.js` | ✅ done (14 checks) |
| 4 | `ThreeMatrix4` (incl. `makePerspective`, `compose`, `invert`) | `math/Matrix4.js` | ✅ done (20 checks) |
| 5 | `ThreeObject3D` (position/rotation/scale, `add`, `updateMatrixWorld`) | `core/Object3D.js` | ✅ done (11 checks) |
| 6 | `ThreeScene` | `scenes/Scene.js` | ✅ done |
| 7 | `ThreePerspectiveCamera` | `cameras/PerspectiveCamera.js` | ✅ done (9 checks) |
| 8 | `ThreeBufferGeometry` + `ThreeBoxGeometry` | `core/BufferGeometry.js`, `geometries/BoxGeometry.js` | ✅ done (7 checks) |
| 9 | `ThreeTexture` + `ThreeTextureLoader` | `textures/Texture.js`, `loaders/TextureLoader.js` | ✅ done |
| 10 | `ThreeMaterial` + `ThreeMeshBasicMaterial` | `materials/*` | ✅ done |
| 11 | `ThreeMesh` | `objects/Mesh.js` | ✅ done (14 checks incl. 9–11) |
| 12 | `ThreeWebGLRenderer` + `ThreeRenderBackend` + `ThreeSoftwareBackend` | `renderers/WebGLRenderer.js` | ✅ done (cube renders) |

**All 12 pieces done — the cube renders.** `ThreeWebGLRenderer.render(scene, camera)`
walks the scene and draws each mesh through a **pluggable backend** (`ThreeRenderBackend`),
so there is no GPU code in the core:

- `ThreeSoftwareBackend` — a pure-Ranger z-buffered, textured triangle rasteriser
  (the default). Works headless / on a Raspberry Pi; compiles to C++.
- `ThreeGLBackend` — a **GPU backend written in Ranger** (below): WebGL in the
  browser, OpenGL/GLES on desktop — the same Ranger source for both.

`three_cube_demo_test.rgr` builds the canonical cube in the Three.js API shape and
renders it with the software backend (writes `/tmp/three_cube.ppm`).

## GPU backend — one Ranger source, WebGL + OpenGL/GLES

`ThreeGLBackend` draws through `three_gl.rgr`, a GPU-operator layer where **each
operator carries both an es6 (WebGL) and a cpp (OpenGL/GLES) body** via Ranger's
`templates { es6(...) cpp(...) }` + `create_polyfill` mechanism (the same one the
native `gfx_sdl.rgr` shim uses). So the compiler emits the WebGL calls **and** the
OpenGL calls from one source — **no hand-written `.js`**. This is what keeps
Ranger's "same code, many targets" promise on the GPU side.

```
ThreeGLBackend (Ranger)  →  three_gl operators
   gpu_program / gpu_make_mesh / gpu_make_texture / gpu_draw
        ├─ es6 → gl.createProgram / bufferData / drawElements / uniformMatrix4fv …  (WebGL)
        └─ cpp → glCreateProgram / glBufferData / glDrawElements / glUniformMatrix4fv …  (GLES2)
```

- Opaque **int handles** bridge the representation gap (WebGL objects in JS arrays
  ↔ `GLuint` in a `std::vector`); Ranger only sees 1-based ints.
- Shaders (`three_gl_shaders.rgr`) are **GLSL ES 1.00** — one source runs on WebGL1/2,
  GLES2 (Raspberry Pi) and desktop GL compat.
- The WebGL context is created on a canvas (es6); the native path takes the host's
  current GL context (cpp). Use it via `renderer.setBackend(glBackend)`.

Verified with `-l=cpp` and `-es6`: the generated JS contains the real `gl.*` WebGL
calls and the generated C++ the `gl*` OpenGL calls. (GPU output itself is a local
browser / desktop-GL step — it can't run in a headless container.) This supersedes
the earlier stop-gap hand-written `web/webgl3d.js`.

## Portability

Everything here is **pure Ranger with no JavaScript in the core** — it compiles to
**C++** as well as ES6, so the same code builds for native / Raspberry Pi /
embedded targets. Verified with `-l=cpp` on the whole chain (including the
decoder-backed `ThreeTextureLoader`). GPU rendering stays in per-platform backends
(WebGL in the browser, native GL on desktop), kept out of the portable core.
