# ADR-0001 — `ThreeSceneHost` owns authoritative Three state

> Status: **proposed** (planning). Context: `CODE_CLEANUP.md` Part II, step 0.
> Supersedes the conflicting architecture statements in `IDEAL_THREE.md`,
> `THREE_BRIDGE.md`, and `THREE.md`.

## Context

The design docs describe **two** incompatible architectures:

- `IDEAL_THREE.md` — the Ranger, C++, and (future) WASM paths use the Three
  **object model directly**, each holding its own object graph.
- `THREE_BRIDGE.md` — every front-end issues integer-handle **commands** to one
  **host-owned** registry (`ThreeSceneHost`); nobody owns Three objects
  privately.

The second is what is actually built (`three/src/three_scene_host.rgr` is the
single registry; `three/tsx/three_native_bridge.rgr` and the TSX reconciler both
drive it). But the first is still in the docs, and `THREE.md` still names the
Teapot/Sponza demos through per-demo bridges that the same doc elsewhere says are
removed. This ambiguity is the source of drift (e.g. the command-ABI surface gap:
the host exposes 10 geometry constructors, the native bridge exposes 2).

## Decision

**`ThreeSceneHost` is the single owner of authoritative Three state.** Every
front-end — the TSX interpreter reconciler, a Ranger program, a C++/WASM guest —
holds only **opaque handles** and issues **commands** against that one host
instance. No front-end keeps its own Three object graph; no host pointer or GPU
resource ever crosses into a guest.

Corollaries:
- Resources (geometry / material / texture) and instances (entities) are host
  registries; a mesh references resources by handle (already the shape in
  `three_scene_host.rgr`).
- The host is the only place the renderer and GPU resources live.
- A front-end's "scene" is a projection it reconciles *into* the host, not a
  parallel source of truth.

## Consequences

- `IDEAL_THREE.md`'s "front-ends use the object model directly" model is
  **retired**; that document is either rewritten to the command/handle model or
  marked historical.
- `THREE.md`'s demo table is corrected to describe Teapot/Sponza through the
  reconciler + host, not removed per-demo bridges.
- This ADR is the premise the rest of `CODE_CLEANUP.md` Part II builds on:
  because the host owns identity of *host* objects, and the interpreter (after
  step 1) owns identity of *interpreter* objects, the reconciler (step 3) can be
  a clean keyed diff between the two identity spaces instead of an index cache.
- The native-object adapter (Line B, step 2) does **not** change this: the
  adapter's backing objects (`Vec3`/`Mat4`/`ThreeObject3D`) are the host's
  canonical types, so "value parity" and "host state" are the same objects, not
  two mirrors.

## Non-goals

- This ADR does not decide the interpreter identity representation (step 1) or
  the adapter API (step 2) — it only fixes *who owns state*.
- It does not remove `ranger_games/` or any native path; those front-ends still
  drive the same host through the same command surface.
