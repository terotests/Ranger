# ADR-0001 — `ThreeSceneHost` owns authoritative Three state

> Status: **proposed** (planning). Context: `CODE_CLEANUP.md` (D-SYNC).
> Supersedes the conflicting architecture statements in `IDEAL_THREE.md`,
> `THREE_BRIDGE.md`, and `THREE.md`.
> Exploratory notes that used to live beside these decisions:
> [`CODE_CLEANUP_OLD.md`](../CODE_CLEANUP_OLD.md).

## Context

The design docs describe **two** incompatible architectures:

- `IDEAL_THREE.md` — the Ranger, C++, and (future) WASM paths use the Three
  **object model directly**, each holding its own object graph.
- `THREE_BRIDGE.md` — every front-end issues integer-handle **commands** to one
  **host-owned** registry (`ThreeSceneHost`); nobody owns Three objects
  privately.

The second is what is actually built (`three/src/three_scene_host.rgr` is the
single registry; `three/tsx/three_native_bridge.rgr` and the transitional TSX
reconciler both drive it). But the first is still in the docs, and `THREE.md`
still names the Teapot/Sponza demos through per-demo bridges that the same doc
elsewhere says are removed. This ambiguity is the source of drift (e.g. the
command-ABI surface gap: the host exposes 10 geometry constructors, the native
bridge exposes 2).

A second ambiguity in planning drafts: **snapshot reconciliation** (façade tree
diffed into the host each frame) versus **live host-backed objects** (`new Mesh`
/ `scene.add` / property writes hit the host immediately). Those are different
sync models and must not both be treated as the final architecture.

## Decision

**`ThreeSceneHost` is the single owner of authoritative Three state.** Every
front-end — the TSX live native adapter (target), the transitional reconciler
(temporary), a Ranger program, a C++/WASM guest — holds only **opaque handles**
and issues **commands** against that one host instance. No front-end keeps its
own Three object graph; no host pointer or GPU resource ever crosses into a
guest.

**Sync model (see `CODE_CLEANUP.md` D-SYNC):** the target is the **live-object**
path. `new THREE.Mesh(...)` creates a host object once; `scene.add` reparents
immediately; property writes update the host immediately or through explicitly
documented batching. Structural reconciliation in `three_tsx_bridge.rgr` is a
compatibility adapter with a stated retirement milestone (`RETIRE-RECONCILE`),
not the long-term design.

Corollaries:
- Resources (geometry / material / texture) and instances (entities) are host
  registries with **typed arenas** (not heterogeneous base-type arrays plus
  pretend downcasts); a mesh references resources by handle.
- The host is the only place the renderer and GPU resources live.
- **Object identity ≠ scene membership ≠ GPU resource lifetime** (D-LIFE):
  `dispose()` disposes backend resources; it does not release the object handle.
- A front-end's script objects are NativeRefs to host handles, not a parallel
  source of truth.

## Consequences

- `IDEAL_THREE.md`'s "front-ends use the object model directly" model is
  **retired**; that document is rewritten to the command/handle + live-adapter
  model or marked historical.
- `THREE.md`'s demo table is corrected to describe Teapot/Sponza through the
  host (live adapter; reconciler only while still temporary).
- Premise for `CODE_CLEANUP.md` (D-SYNC / D-TYPE / D-LIFE): host owns host-object
  identity; script values hold NativeRefs to those handles; the live adapter
  binds them at construct time. The reconciler must not create a second host
  object for an already-constructed live instance.
- The native-object adapter does **not** change ownership: adapter backing
  objects are the host's canonical types, so value parity and host state are the
  same objects, not two mirrors.

## Non-goals

- This ADR does not decide the interpreter identity representation (II.A), the
  exact handle bit layout (D-HANDLE), or the class-registry file format — it
  fixes *who owns state* and which sync model is authoritative.
- It does not remove `ranger_games/` or any native path; those front-ends still
  drive the same host through the same command surface.
