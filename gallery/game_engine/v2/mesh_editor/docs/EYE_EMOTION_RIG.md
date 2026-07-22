# Eye emotion rig — design

How eye textures become a small **animatable vector rig** with tagged
emotion poses that morph A → B when topology matches.

Authoring lives in the mesh editor (`kind: "eye"`). Runtime compiles poses to
sampled geometry / GPU buffers (see § Runtime). This doc is the contract for
tags, topology, and pose data.

## Goals

1. Tag each eye pose with a clear **emotion** (`angry`, `sad`, …).
2. Morph only between poses that share the same **topology** (same knot counts /
   closedness / clip graph per layer role).
3. Keep `partClass: "eye"` so later body parts (`mouth`, `brow`, …) can use the
   same library machinery with their own tag vocabularies and topology keys.
4. Separate **authoring JSON** (knots, ids, clipTo) from **runtime buffers**.

## Asset layers (already authored)

| Role | Shape | Default knots |
|------|--------|----------------|
| `eyeball` | closed Bézier | 4 |
| `iris` | closed, clip → eyeball | 4 |
| `pupil` | closed, clip → iris | 4 |
| `reflection` | closed, clip → eyeball | 4 |
| `eyelid` | open, fill above/below, clip → eyeball | 3 (2 segments) |

Left/right pair: one rig, right eye mirrored when `eyePair.linked` (no separate
pose stack required for morph).

## Topology vs pose

**Topology** (stable within a morph family):

- layer roles + draw order
- knot count and order per role
- closed / open, `fillSide`, `clipTo`
- materials / colours (not morphed by default)

**Pose** (animatable):

- knot `{ x, y, hx, hy }` per stable index
- optional `opacity` / `enabled`

Knot correspondence is by **role + index**, never by random knot ids:

```text
angry.eyeball[i]  ↔  sad.eyeball[i]
```

Handles (`hx`, `hy`) interpolate with positions so curvature does not pop.

## Tags

### Part class

```text
partClass: "eye" | "mouth" | "brow" | …
```

Only assets with the same `partClass` are candidates for a shared picker /
morph family. Mouth/brow will define their own roles and emotion (or phoneme)
lists later.

### Emotion tags (`partClass: "eye"`)

Canonical set (extensible; custom strings allowed):

| Tag | Intent |
|-----|--------|
| `neutral` | Rest / idle |
| `happy` | Raised lids, soft curves |
| `sad` | Inner brows down, lids heavy |
| `angry` | Outer lids down, sharper shape |
| `surprised` | Wide open |
| `sleepy` | Heavy lids |
| `wink` | One side override later |
| `fear` | Wide + tense |
| `disgust` | Squint / squeeze |

Project / library list tags (search):

```text
part:eye
emotion:<tag>
topo:<topologyKey>
```

Example: `["part:eye", "emotion:angry", "topo:eye:v1/…"]`.

### Topology key

Computed from layer roles (see `eyeTopologyKey()` in
`app/src/lib/texture/eyeEmotion.js`):

```text
eye:v1/eyeball:4c/iris:4c:clip=eyeball/pupil:4c:clip=iris/reflection:4c:clip=eyeball/eyelid:3o:fill=above:clip=eyeball
```

Two eye textures are **morph-compatible** iff their topology keys are equal.
Colours and emotion tags may differ.

## Authoring document shape (schema v12+)

On each `textureAssets[*]` with `kind: "eye"`:

```js
{
  kind: "eye",
  partClass: "eye",
  topologyKey: "eye:v1/…",   // derived on normalize/save
  emotion: "neutral",        // tag of the working layers / active pose
  layers: [ /* editable working copy */ ],
  eyePair: { distance, linked, editSide },
  poses: [
    {
      id: "pose_…",
      name: "Angry",
      emotion: "angry",
      tags: ["angry"],         // optional extras
      layers: {
        eyeball: { knots: [/* length = topology */], opacity: 1 },
        iris: { knots: […] },
        pupil: { knots: […] },
        reflection: { knots: […] },
        eyelid: { knots: [/* 3 */], opacity: 1, enabled: true }
      }
    }
  ],
  activePoseId: "pose_…" | null
}
```

Working `layers` remain the editor source of truth for the current pose.
Capturing a pose snapshots knot poses from those layers; applying a pose
writes knots back (ids / segments preserved).

## Morph pipeline (authoring → runtime)

```text
Eye texture JSON
  ├── poses (emotion-tagged, same topology)
  └── working layers
          │
          ▼ compileEyeRig()
  topology check → sample Bézier at fixed t → triangulate once
          │
          ▼
  CompiledEyeRig { indices, poses: Float32Array per emotion, clip graph }
          │
          ▼ EyeAnimator (from, to, uMorph)
          ▼ GPU mix(from, to, eased t)
```

Recommended runtime (later): fixed sampling (~16/segment), vertex-shader morph,
stencil/clip from `clipTo`, left/right as mirrored instances. Do not push Vue-
reactive knot trees or WASM bindings every frame.

## Editor constraints (to keep morphs valid)

- Adding/removing knots on a layer regenerates `topologyKey` and marks
  poses with a different key as incompatible (drop or re-capture).
- Prefer editing within a locked topology once a pose set exists.
- Do not author self-intersecting or inverted eye outlines for poses in the
  same family.

## Compatibility helpers

| Helper | Role |
|--------|------|
| `eyeTopologyKey(tex)` | Fingerprint for morph family |
| `areEyeTexturesCompatible(a, b)` | Same partClass + topologyKey |
| `listCompatibleEyeTextures(lib, ref)` | Library filter |
| `captureEyePose(tex, { emotion, name })` | Snapshot working layers |
| `applyEyePose(tex, pose)` | Write pose into working layers |
| `interpolateEyePose(a, b, t)` | CPU morph (preview / bake) |
| `compileEyeRig(tex, opts)` | Sampled buffers for runtime |

## Out of scope (follow-ups)

- UI for pose list / emotion picker in the Texture sector
- GPU offscreen eye framebuffer → mesh UV
- Per-eye blink / gaze overrides on top of shared emotion
- Asymmetric in/out handles (`inHandle` / `outHandle`) if C1 symmetry is too limiting
