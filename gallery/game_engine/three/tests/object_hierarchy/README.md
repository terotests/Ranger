# object_hierarchy — nested world transforms through the interpreter

## What is tested

Nested scene-graph transforms — with **no rendering** — by reading the internal
Ranger `ThreeObject3D.matrixWorld` after reconcile. `hierarchy_scene.tsx` builds:

```
group      pos(10,0,0) rot(0,0.5,0)     → handle 1
  meshA    pos(0,5,0)                    → handle 2
  subgroup pos(0,0,3) scale(2,2,2)       → handle 3
    meshB  pos(1,0,0)                    → handle 4
loneMesh   pos(-4,0,0)  (flat sibling)   → handle 5
```

and the test checks, against real three.js (`../../reference/hierarchy_goldens.json`):

- each node's **world matrix** (all 16 elements) — so `meshB`'s world transform is
  the full `group · subgroup · local` composition (translation + rotation + the
  parent's scale);
- each node's **world position**;
- the **tree structure** — child counts of the scene, the group, and the subgroup.

## How it works — args from the interpreter, tree built in Ranger

`new THREE.Group()` / `mesh.add(child)` in the scene only record the parent→child
*intent*; the real objects are built in the Ranger host:

```
hierarchy_scene.tsx  →  ComponentEngine interprets
   →  ThreeTsxBridge  walks each node's `children`, building every child as a host
      entity PARENTED under its parent (host.groupNew / host.meshNewUnder)
   →  ThreeSceneHost   holds the real ThreeObject3D tree
   →  core updateMatrixWorld composes parent → child world matrices
   →  three_hierarchy_test.rgr reads entityAt(h).matrixWorld and diffs vs goldens
```

Handles are assigned in the host's DFS build order (matching the goldens).

## What changed to close this gap

- **façade** (`../../tsx/three.tsx`): `Mesh.add` now really pushes to a `children`
  array, and new `Group` / `Object3D` transform-only nodes were added.
- **bridge** (`../../tsx/three_tsx_bridge.rgr`): `syncChildren` recurses into each
  node's `children`, `ensureSub` builds/reuses nested handles in a stable DFS order,
  and a top-level `Group`/`Object3D` becomes a host group. Flat scenes (no children)
  are untouched — fully backward compatible.
- **host** (`../../src/three_scene_host.rgr`): `groupNew(sceneH,parentH)` and
  `meshNewUnder(parentH,…)` place entities under a parent; `updateWorldMatrices`
  composes the tree.

## Result

**13/13 PASS.** The object model itself (`ThreeObject3D` transforms, `updateWorld`)
was already correct and unit-tested in `../../src/three_object3d_test.rgr`; this
suite proves the whole interpreter→bridge→host→world-matrix path.

## Files

| File | Role |
|---|---|
| `hierarchy_scene.tsx` | The JS scene the interpreter runs (a nested Group/mesh tree). |
| `three_hierarchy_test.rgr` | Reconcile + read each node's world matrix / structure vs goldens. |
| `../../reference/gen-hierarchy-goldens.mjs` → `hierarchy_goldens.json` | Expected world matrices from real three.js. |

## Not yet covered (next steps in this area)

- **reparenting / remove** at runtime (the DFS-ordinal handle cache assumes a
  stable tree shape, as the flat cache does);
- **getObjectByName / traverse** exposed through the façade;
- deep-copy **clone** of a subtree.
