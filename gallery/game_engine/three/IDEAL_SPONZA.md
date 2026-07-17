# IDEAL_SPONZA — running the Three.js light-probe-volume (Sponza) example 1:1

> Goal: run the [`light probe volume (Sponza)`](https://threejs.org) example
> **1:1, unmodified**, as `.tsx` in the interpreter, rendered with WebGL by the
> Ranger Three clone — a real glTF scene (Sponza), an atmospheric `Sky`, a
> shadow-casting `DirectionalLight`, ACES tone mapping, `FirstPersonControls`,
> and a **baked light-probe volume** for diffuse global illumination, all driven
> by a **lil-gui** panel. Companion to [`../IDEAL_THREE.md`](../IDEAL_THREE.md)
> and [`IDEAL_TEAPOT.md`](IDEAL_TEAPOT.md). Built piece by piece, each with a
> `*_test.rgr`, like the cube and the teapot. Then it runs on the **SDL** host,
> the same source, same as the teapot.

This is the deep end. Where the teapot exercised lighting + materials + one
procedural geometry, this example exercises the *whole pipeline*: asset loading,
an environment/sky pass, shadow mapping, HDR tone mapping, first-person input,
and a bake step that renders the scene into a grid of probes and reconstructs
indirect light from them. It is deliberately an order of magnitude past the
teapot, so it is planned as **many small verifiable slices**, not one commit.

The target script (verbatim, dropped in as [`tsx/sponza.tsx`](tsx/sponza.tsx)):

```js
import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { LightProbeGrid } from 'three/addons/lighting/LightProbeGrid.js';
import { LightProbeGridHelper } from 'three/addons/helpers/LightProbeGridHelper.js';
// … Sky + dirLight + shadow camera + LightProbeGrid.bake(renderer, scene, {...})
```

## 1. What the example needs vs. what exists today

| Feature | Status | Where |
|---|---|---|
| `PerspectiveCamera`, `Scene`, `Mesh`, `WebGLRenderer`, `DirectionalLight`, `Color`, `Vector3` | ✅ have | `three/src` |
| Lit materials (Lambert/Phong), textures, cube textures | ✅ have (teapot) | `three/src` |
| `OrbitControls` + lil-gui overlay (`GUI`) | ✅ have (teapot) | `three_orbit_controls.rgr`, `three_gui_overlay.rgr` |
| **`THREE.Timer`** (delta/elapsed clock) | ✅ **slice 1** | `three_timer.rgr` |
| **`THREE.MathUtils`** (`degToRad`, `clamp`, `lerp`) | ✅ **slice 1** | `three_math_utils.rgr` |
| **`THREE.Box3`** (`setFromObject`, `getSize`, `getCenter`) — model bounds | ✅ **slice 1** | `three_box3.rgr` |
| `Vector3.setFromSphericalCoords` (sun direction) | ✅ **slice 1** | `three_vector3.rgr` |
| **`FirstPersonControls`** (WASD + mouse-look) | ❌ slice 2 | — |
| **`LoadingManager`** + progress | ❌ slice 2 | — |
| **`ACESFilmicToneMapping`** + `toneMappingExposure` | ❌ slice 3 | shaders + renderer |
| **`DirectionalLight` shadows** (`castShadow`, `shadow.mapSize`, ortho shadow camera) | ❌ slice 4 | shadow-map pass |
| **`Sky`** (Preetham atmospheric scattering shader) | ❌ slice 5 | `three_sky.rgr` + shader |
| **`GLTFLoader`** (`.glb`/`.gltf` → meshes + PBR materials) | ❌ slice 6 (large) | `three_gltf_loader.rgr` |
| **`LightProbeGrid`** (`.bake()` → probe volume, SH9 per probe, bounces) | ❌ slice 7 (large) | `three_light_probe_grid.rgr` |
| **`LightProbeGridHelper`** (probe sphere gizmos) | ❌ slice 8 | — |
| Diffuse-GI lookup in the übershader (sample nearest probes, trilinear) | ❌ slice 7 | `three_gl_shaders.rgr` |

The two big rocks are **GLTFLoader** (parse a real binary glTF, its buffers,
accessors, PBR materials, node hierarchy) and **LightProbeGrid** (render the
scene into each probe as a cubemap, project to spherical harmonics, optionally
feed prior passes back in for bounces, then reconstruct irradiance in the
fragment shader). Everything else is comparatively small.

## 2. Architecture decisions

- **Sky = its own shader pass, not a material.** Port `Sky.js` (Preetham) as a
  `ThreeSky` object drawing a large inverted box/sphere with a dedicated GLSL ES
  1.00 program fed `turbidity/rayleigh/mie*/sunPosition` uniforms. It renders
  first (behind everything), like the teapot's skybox pass.
- **Shadows = one directional shadow map.** A depth-only pass from the light's
  ortho camera into a depth texture, sampled in the übershader with a normal-bias
  PCF tap. `renderer.shadowMap.enabled` + `light.castShadow` gate it. GLES2 needs
  `WEBGL_depth_texture` (browser) / a depth renderbuffer + `GL_OES_depth_texture`
  path (native) — the backend abstracts which.
- **Tone mapping = a fragment epilogue.** ACES filmic + exposure applied in the
  übershader's final color, matching `ACESFilmicToneMapping`. One `uToneMapping`
  + `uExposure` uniform pair; keeps a single program.
- **GLTFLoader — parse in portable Ranger, upload in the backend.** The parser
  (JSON chunk + BIN chunk → typed accessors → `ThreeBufferGeometry` + materials +
  node tree) is pure Ranger so it compiles to native too. It reuses the existing
  `ThreeBufferGeometry` interleaving. PBR metallic-roughness maps onto the
  existing Phong übershader approximately at first (flagged), full PBR later.
  **Verification caveat:** downloading Sponza from the network and GPU upload are
  local browser/native steps; headless tests parse a small embedded `.gltf`/`.glb`
  fixture and assert node/mesh/accessor counts, not pixels.
- **LightProbeGrid — bake into an SH atlas.** For each probe: render the scene to
  a small cubemap (`cubemapSize`, e.g. 32), project the 6 faces onto 9 spherical
  harmonic coefficients (RGB), store into a coefficient texture atlas indexed by
  grid cell. `bounces > 0` re-runs the bake with the previous atlas sampled as
  ambient, so light bounces. At shade time the übershader finds the probe cell
  around the fragment and trilinearly blends the reconstructed irradiance. The SH
  projection + reconstruction math (`ThreeSphericalHarmonics3`) is pure Ranger and
  **is** unit-testable headless (project a known directional radiance, assert the
  reconstructed irradiance) even though the cubemap capture is a GPU step.
- **FirstPersonControls.** WASD + drag-look. Small; mirrors `OrbitControls`'s
  input surface (`pointerdown/move/up`, `keydown/up`, `update(delta)`), driven by
  the same host event plumbing. Uses the new `ThreeTimer` delta.
- **On every-frame render.** Unlike the teapot (on-demand), this drives
  `setAnimationLoop(animate)` with FirstPersonControls integrating over `delta`,
  so the host runs a continuous loop (as the cube does).

## 3. Slices (dependency order; each is `Three*` class + `*_test.rgr`, run.sh green)

- **Slice 1 — math & clock foundation** ✅: `ThreeMathUtils`
  (`degToRad`/`radToDeg`/`clamp`/`lerp`), `ThreeTimer`, `ThreeBox3`
  (`min/max`, `expandByPoint`, `setFromPoints`, `union`, `getSize`, `getCenter`,
  `getBoundingSphere`, `setFromObject` via `Object3D.boundingBox`/`expandBox3`
  over meshes), and `Vector3.setFromSphericalCoords`. All headless-tested.
- **Slice 2 — input & loading** ✅: `ThreeFirstPersonControls` (WASD/arrows/RF +
  mouse-look), `ThreeLoadingManager` (batch progress).
- **Slice 3 — HDR** ✅ core: `ThreeToneMapping` (ACES Narkowicz + Reinhard,
  exposure), the übershader tone-map epilogue (`uToneMapping`/`uExposure`), and
  renderer `toneMapping`/`toneMappingExposure`/`shadowMapEnabled` fields.
- **Slice 4 — shadows** ✅ core: `Matrix4.makeOrthographic`,
  `ThreeDirectionalLightShadow` (ortho frustum + light-space view-projection),
  `DirectionalLight.castShadow`/`target`/`shadow`, `Mesh.castShadow`/`receiveShadow`.
- **Slice 5 — Sky** ✅ core: `ThreeSky` (Preetham uniforms) + the Sky daylight
  scattering shader (`atmosphereVertexSrc`/`atmosphereFragmentSrc`, GLSL ES 1.00).
- **Slice 6 — GLTFLoader** ✅ core: `ThreeGLTFAccessor` + `ThreeGLTFLoader` binary
  decoder (IEEE-754 float32 + LE ints → `ThreeBufferGeometry`).
- **Slice 7 — LightProbeGrid** ✅ core: `ThreeSphericalHarmonics3` (SH9
  project/reconstruct) + `ThreeLightProbeGrid` (grid model, analytic bake,
  trilinear irradiance sampling).
- **Slice 8 — LightProbeGridHelper** ✅ core: `ThreeLightProbeGridHelper` (gizmo
  positions + colours).

**All eight slices' portable cores are built and headless-tested** (`bash
three/src/run.sh` green — the pre-existing cube/teapot/façade suites included).

**Remaining — GPU + host integration** (browser/SDL only, not headless-verifiable):
the `sponza.tsx` façade bridge into the Ranger core (mirroring
`three_teapot_tsx_bridge`), the GL-backend uniform feeds for tone mapping /
shadow-map depth pass / probe-SH GI lookup, the Sky + shadow + probe render
passes, and the loader's host layer (JSON structure parse via `lib/JSON`, `.glb`
JSON+BIN chunk split, and the network fetch of Sponza). The final rendered result
is a local browser / desktop-GL step, then SDL — same source, like the teapot.
