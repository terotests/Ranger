# object_hierarchy — PLANNED (not runnable yet)

> Status: **blocked on façade + bridge wiring.** This folder documents what the
> test should check; there is no runner here yet. Once the wiring below lands,
> this becomes a `spec/`-style data-driven suite validated against real three.js.

## What should be tested

Nested scene-graph transforms — the thing every non-trivial scene relies on — with
**no rendering**, by reading the internal Ranger `ThreeObject3D.matrixWorld` after
reconcile:

- **world position of a child** — parent at `(10,0,0)`, child at `(0,5,0)` →
  child world position `(10,5,0)`.
- **compounded transforms** — parent with rotation + scale, child offset →
  child world matrix equals `parentWorld · childLocal` (all 16 elements vs
  three.js).
- **deep nesting** — grandparent → parent → child, each with its own TRS →
  grandchild world matrix.
- **traversal** — `traverse` visits `group + N descendants` (count + order).
- **add/remove reparenting** — moving a child sets `.parent`, updates
  `children.length` on both old and new parent, and changes the child's world
  matrix accordingly.
- **getObjectByName** — returns the right descendant.

Internal objects to read back: `ThreeObject3D.matrixWorld` (via `eGet(i)`),
`childCount()`, `getChild(i)`, `.parent`.

## Why it can't run yet

The interpreter path can't express a hierarchy today:

- the façade `Mesh.add` is a **no-op** (`add(o){ return this; }`), and there is no
  `Group` / `Object3D` façade class, so a nested child never reaches the bridge;
- the bridge's reconcile walks `scene.children` **flat** — it does not recurse
  into `child.children` or compose parent→child world transforms;
- the host `meshNew` attaches every mesh directly under the scene (no parent
  handle), so `matrixWorld` is only ever `local`.

(The object model itself is ready: `ThreeObject3D` already has `add/remove`,
`updateMatrixWorld`, `updateWorld(parentWorld)`, `matrixWorld`, and is unit-tested
at the object-model level in `../../src/three_object3d_test.rgr`. The gap is
purely the interpreter→host path.)

## Plan to unblock

1. Add a thin façade `Group` (and make `Object3D`/`Mesh.add` actually push to a
   `children` array) in `../../tsx/three.tsx`.
2. Teach the bridge to recurse: for each reconciled node, walk its `children`,
   create host entities with a **parent handle**, and compose world transforms
   (`host.entityParent(childH, parentH)` + `updateMatrixWorld` from the root).
3. Add `gen-*-goldens.mjs` computing the world matrices from real three.js, a
   `hierarchy_scene.tsx`, and a runner (or fold into `spec/`).

## Files (planned)

| File | Role |
|---|---|
| `hierarchy_scene.tsx` | JS scene building a nested group/mesh tree. |
| `three_hierarchy_test.rgr` | Reconcile + read `matrixWorld` of each node vs goldens. |
| `../../reference/gen-hierarchy-goldens.mjs` → `hierarchy_goldens.json` | Expected world matrices from real three.js. |
