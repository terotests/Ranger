# spec — one data-driven runner for several no-render features

## What is tested

Several features that need **no rendering**, all in **one compiled runner** driven
by **one description file** of expected values for the internal Ranger objects
(`../../reference/spec_goldens.json`, computed from the real three.js):

| Feature | What's checked | Internal object |
|---|---|---|
| **camera** | the perspective **projection matrix** from `fov/aspect/near/far` (all 16 elements) | `ThreePerspectiveCamera.projectionMatrix` (`ThreeMatrix4.makePerspective`) |
| **matrix** | a transformed mesh's **world matrix** from position/rotation/scale (all 16 elements) | `ThreeMatrix4.compose(T,R,S)` + Euler→Quaternion |
| **colors** | material **colour families** + the scene **background** (r/g/b) | `ThreeMaterial.colorR/G/B`, `ThreeScene.backgroundR/G/B` |
| **culling** | **view-frustum** containment of points + spheres | `ThreeFrustum` (new, ported from three.js `Frustum`) |

All four are driven through the interpreter: `spec_scene.tsx` (a camera + coloured
meshes + a transformed mesh) is interpreted, reconciled into the Ranger host, and
the host objects are read back and diffed against the goldens.

Colour note: the object-model `Color` stores raw `hex/255` (no sRGB decode — a
documented limitation, THREE.md §7). The goldens are generated with three.js color
management **off**, so it's a like-for-like comparison; the sRGB-linearization gap
itself is tracked in `../value_parity/`.

## Why one runner (the speed answer)

Each `.rgr` suite costs ~8 s of Ranger→ES6 **compilation**; running the compiled JS
is sub-second. So the cost is per-*compile*, not per-*check*. This runner is
compiled **once** and reads its expected values from `spec_goldens.json` at run
time, so:

- adding expected values / cases → **edit the JSON** (no recompile),
- adding a whole feature → a check function + a JSON section (one recompile).

Four features here = one compile instead of four. Current result: **57/57 PASS**.

## Files

| File | Role |
|---|---|
| `spec_scene.tsx` | The interpreted scene (camera, coloured meshes, one transformed mesh). |
| `three_spec_runner.rgr` | The single runner: interprets the scene, reconciles into the host, checks camera/matrix/colors/culling vs the goldens. |
| `../../reference/gen-spec-goldens.mjs` → `spec_goldens.json` | Generates the expected values from the real three.js. |
| `../../src/three_frustum.rgr` | The `ThreeFrustum` object (new) exercised by the culling checks. |

## Add a check / feature

- **More cases** for an existing feature: add them in `gen-spec-goldens.mjs`,
  regenerate `spec_goldens.json`. (Extend the scene if new objects are needed.)
- **A new feature**: add a `checkXxx` function to `three_spec_runner.rgr` and a
  section to the goldens; extend `spec_scene.tsx` if it needs new scene objects.

## Not yet here (need engine/façade wiring first)

These were requested but are gated on object-model / façade work, not on the test
rig — each becomes a spec section once the wiring lands:

- **object hierarchy** — the façade `Mesh.add` is a no-op and there is no
  `Group`/`Object3D` façade class, so nested parent→child transforms aren't
  reconcilable through the interpreter yet. Needs a façade `Group` + the bridge
  recursing into `child.children` and composing world transforms.
- **animation** — no object model (`AnimationMixer`/`AnimationClip`/`KeyframeTrack`)
  and no façade. A minimal linear/slerp `KeyframeTrack` sampler is the first step;
  it is pure math and fully no-render testable.
- **model loading** — the `ThreeGLTFFile` parser exists and is unit-tested
  (`../../src/three_gltf_file_test.rgr`), but loading is async + host-side and the
  façade `GLTFLoader` is a stub, so it isn't interpreter-driven yet. Needs the
  façade loader + host decode seam wired to a scene node.
