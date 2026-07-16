# model3d — native 3D asset loading for Ranger

Host-side (no WASM) reading of 3D model assets, built **before** any WASM ABI
integration. This is the `load_model → ModelAsset → Entity hierarchy →
MeshRenderer` path the engine needs so a GLB's node hierarchy, meshes,
materials and textures land as **host-owned** resources — not as a new block
written into WASM guest memory.

The hard part of "GLB support" is not reading the container bytes; it is having
a host object model for models, assets and entities. That model is the bulk of
what lives here, with a static GLB importer on top.

## Pipeline

```
GLB bytes
  → GlbImporter        (container: 12-byte header, JSON chunk, BIN chunk)
      → JsonParser     (compact recursive-descent JSON → JsonValue tree)
      → GltfDocument   (typed glTF view + support gate)
      → accessors      (bufferView + byteStride + BIN → Vec3/Vec2/index arrays)
  → ModelAsset         (NodeAsset / MeshAsset / MaterialAsset / TextureAsset)
  → TextureDecode      (embedded PNG/JPEG bytes → RGBA, reusing native decoders)
  → AssetRegistry      (owns models; hands back a model id)

ModelInstancer.instantiate(model)
  → EntityRegistry     (one EntityId per node, parent/child links)
      → TransformComponent (TRS or matrix → local + world matrix)
      → MeshRenderer   (attached wherever a node references a mesh)
  → root EntityId      (find_child(root, "RightHand") resolves through the host)
```

Public surface is `ModelLoader`:

```
def loader:ModelLoader (new ModelLoader)
def model:int (loader.loadFromFile("models" "robot.glb"))   ; -> model id (-1 on error)
def robot:int (loader.instantiate(model))                   ; -> root EntityId
def hand:int (loader.findChild(robot "RightHand"))          ; -> EntityId
```

On failure `loader.ok` is `false` and `loader.lastError` explains why.

### Presentation size (optional `radius`)

`loadFromFileRadius(dir, file, radius)` / `loadFromBufferRadius(bytes, radius)`
load and then uniformly scale the geometry so the model's farthest vertex from
the origin sits at `radius` units (`radius <= 0` = no scaling). This lets a
fixed-camera viewer show any model at the same size — a 0.5-unit chair and a
165-unit duck alike — via `ModelAsset.scaleToRadius(radius)` /
`boundingRadius()`. In the host runner it is opt-in per game: add
`model_radius=<n>` to the game's `game.info` (absent = models keep their
authored size, so e.g. `pyramid_wasm`'s diamond is unaffected).

## Files

| File | Role |
| --- | --- |
| `GltfJson.rgr` | Self-contained JSON parser → `JsonValue` tree |
| `ByteReader.rgr` | Little-endian byte reads + IEEE-754 float32 decode/encode |
| `GltfMath.rgr` | `Vec2/Vec3/Vec4/Quat/Mat4` (TRS → matrix, matrix multiply) |
| `AssetModel.rgr` | `TextureAsset/MaterialAsset/MeshAsset/NodeAsset/ModelAsset` + `AssetRegistry` |
| `EntityModel.rgr` | `Entity/TransformComponent/MeshRenderer` + `EntityRegistry` + `ModelInstancer` |
| `GltfDocument.rgr` | Typed glTF 2.0 view + **support gate** (rejects unsupported features) |
| `GlbImporter.rgr` | GLB container + accessor reader → `ModelAsset` |
| `TextureDecode.rgr` | Decodes embedded PNG/JPEG bytes to RGBA (reuses repo decoders) |
| `ModelLoader.rgr` | Public `loadFromFile/loadFromBuffer/instantiate/findChild` API |

## First support level

Supported:

- GLB 2.0, one JSON chunk + one BIN chunk
- scenes and nodes; node `matrix` **or** TRS (translation/rotation/scale)
- multiple meshes, multiple primitives per mesh
- `TRIANGLES`; `POSITION`, `NORMAL`, `TEXCOORD_0`, `COLOR_0` (vertex colours)
- **non-indexed** primitives (indices are synthesised)
- **missing `NORMAL`** → smooth normals are generated from the geometry
- `u16` and `u32` (and `u8`) indices
- interleaved `byteStride`
- `baseColorFactor` + `baseColorTexture`, `emissiveFactor`
  (+ `KHR_materials_emissive_strength`), `alphaMode`, `KHR_materials_unlit`,
  multiple materials
- embedded PNG / JPEG textures (decoded to RGBA)

Explicitly rejected (with a clear error, never a silently-wrong model):

- skins, animations, morph targets
- sparse accessors
- Draco / Meshopt / KTX2 (any `extensionsRequired`)
- non-`TRIANGLES` primitive modes

Example rejection message:

```
robot.glb cannot be loaded: unsupported feature EXT_meshopt_compression
```

## Texture decoders (decode-from-buffer)

Embedded glTF images are bytes inside the BIN chunk, not files on disk. The
repo's existing native decoders were extended with an in-memory entry point
(the file-based `decode(dir, file)` API is unchanged and still delegates to it):

- `gallery/game_engine/lpc/src/png_decoder.rgr` → `decodeBytes(bytes:buffer)`
- `gallery/pdf_writer/src/jpeg/JPEGDecoder.rgr` → `decodeBytes(bytes:buffer)`

## Tests

Hermetic — the fixture builds a valid GLB entirely in memory (`tests/GlbFixture.rgr`),
including a real 2×2 RGBA PNG, so no external assets or toolchain are needed.

```sh
bash gallery/game_engine/model3d/tests/run.sh
```

or individually (compile to ES6, run under Node, grep for `ALL PASS`):

```sh
node bin/output.js -es6 gallery/game_engine/model3d/tests/Model3dTest.rgr -d=/tmp -o=m3d.js && node /tmp/m3d.js
node bin/output.js -es6 gallery/game_engine/model3d/tests/TextureDecodeTest.rgr -d=/tmp -o=td.js && node /tmp/td.js
```

- `Model3dTest.rgr` — container, document, accessors, materials, embedded PNG
  bytes, node hierarchy, instantiation (find_child, world transforms), and the
  support gate.
- `TextureDecodeTest.rgr` — end-to-end load + embedded PNG decoded to the
  expected RGBA pixels through `ModelLoader`.

## Not in scope yet

WASM ABI integration; skinning/animation; validating against the Khronos glTF
Sample Assets + glTF Validator (recommended next once real `.glb` inputs land).
