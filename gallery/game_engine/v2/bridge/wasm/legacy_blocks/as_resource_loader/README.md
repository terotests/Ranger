# as_resource_loader — Ranger2D resource loader (AssemblyScript)

A **separate** WASM worker that a game guest spawns via `env.rg_spawn_worker`
(PLAN_RANGER2D_STREAMING.md §0b) to produce resources on demand. Written in
**AssemblyScript** to show the loader is language-agnostic: it plugs into the
same wasm3 bridge and shared-block ABI as the Rust guests — nothing about the
spawn/observe/produce contract is Rust- or 2D-specific.

## Role

Given a request (cell coords + kind) in its RGLD block, the loader manages a
**bounded resource pool**: a `load`/`generate` request allocates a slot and
produces a resource; a `free` request releases it. Freeing sprites/backgrounds is
the loader's job, so as a player roams an infinite world (see
`../../games/streaming_world`) live use stays bounded. This PoC *generates* a
deterministic 16×16 RGBA tile per cell — self-contained, no host asset on disk —
standing in for the decode/generate step; the host then materialises it
(`rg_res_*` / GL upload). A file-loading loader would add a host file-read import;
the block shape is identical.

It reports `live` / `peak` / `totalGen` / `totalFreed` so the host (and the
stress test) can verify the pool stays bounded and conserved (gen − freed = live).

> Built **without** binaryen `--optimize`: that pass emits a global reference this
> repo's wasm3 build rejects ("global index is too large"). The module is tiny, so
> the optimizer is not needed. All state lives in the single linear block (no
> extra mutable globals), so asc emits no start-time init wasm3 would choke on.

## RGLD block

| Offset | Dir | Field |
|-------|-----|-------|
| 0..12 | — | magic `RGLD`, version, size, revision |
| 16 | host → | request kind (0 none, 1 load, 2 generate) |
| 20, 24, 28 | host → | cellX, cellY, assetId |
| 32 | → host | status (0 idle, 1 ready, 2 failed) |
| 36, 40 | → host | produced bytes, checksum |
| 44, 48 | → host | width, height |
| 128.. | → host | produced resource bytes |

## Exports

`loader_ptr()` / `loader_size()` / `loader_revision()` / `loader_init()` /
`loader_tick()` — the host writes a request, calls `loader_tick()`, reads the
result. Same host-driven shape as the Rust worker's `worker_tick`.

## Build & run

```bash
npm run engine:wasm:build:loader     # asc -> games/streaming_worker/resource_loader.wasm
npm run engine:wasm:demo:loader-poc  # game guest spawns this AS loader, drives it -> LOADER_POC_OK
```

The PoC (`../rust_worker/loader_poc.c`) loads the Rust game guest, has it spawn
**this** AssemblyScript module via `rg_spawn_worker`, then drives the loader to
generate a distinct resource per cell and materialises mock handles.
