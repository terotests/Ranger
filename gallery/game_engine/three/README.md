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
| 6 | `ThreeScene` | `scenes/Scene.js` | ⬜ |
| 7 | `ThreePerspectiveCamera` | `cameras/PerspectiveCamera.js` | ⬜ |
| 8 | `ThreeBufferGeometry` + `ThreeBoxGeometry` | `core/BufferGeometry.js`, `geometries/BoxGeometry.js` | ⬜ |
| 9 | `ThreeTexture` + `ThreeTextureLoader` | `textures/Texture.js`, `loaders/TextureLoader.js` | ⬜ |
| 10 | `ThreeMaterial` + `ThreeMeshBasicMaterial` | `materials/*` | ⬜ |
| 11 | `ThreeMesh` | `objects/Mesh.js` | ⬜ |
| 12 | `ThreeWebGLRenderer` (`render(scene, camera)` → the engine's WebGL/software backend) | `renderers/WebGLRenderer.js` | ⬜ |

Once the math + scene-graph pieces (1–8) land, `ThreeWebGLRenderer` wires the
scene into the existing browser renderer (`web/webgl3d.js` for GPU, `SoftRenderer3D`
for the software fallback), and the cube example runs as Ranger code.
