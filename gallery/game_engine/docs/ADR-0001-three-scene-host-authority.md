# ADR-0001 — `ThreeSceneHost` owns authoritative Three state

> Status: **proposed** (planning). Context: `CODE_CLEANUP.md` §III.2.
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
- Premise for `CODE_CLEANUP.md` II–III: host owns host-object identity; after
  II.A the interpreter owns script-object identity; the reconciler (III.3) diffs
  those two identity spaces instead of using child-index caches.
- The native-object adapter (V.2) does **not** change ownership: adapter backing
  objects are the host's canonical types, so value parity and host state are the
  same objects, not two mirrors.

## Non-goals

- This ADR does not decide the interpreter identity representation (II.A) or
  the adapter API (V.2) — it only fixes *who owns state*.
- It does not remove `ranger_games/` or any native path; those front-ends still
  drive the same host through the same command surface.
