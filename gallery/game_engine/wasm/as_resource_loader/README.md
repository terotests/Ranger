# as_resource_loader — Ranger2D resource loader (AssemblyScript)

A **separate** WASM worker that a game guest spawns via `env.rg_spawn_worker`
(PLAN_RANGER2D_STREAMING.md §0b) to produce resources on demand. Written in
**AssemblyScript** to show the loader is language-agnostic: it plugs into the
same wasm3 bridge and shared-block ABI as the Rust guests — nothing about the
spawn/observe/produce contract is Rust- or 2D-specific.

## Role

Given a request (cell coords + kind) in its RGLD block, the loader **generates or
loads** a resource and reports it (size, dimensions, checksum) plus the produced
bytes. This PoC *generates* a deterministic 16×16 RGBA tile per cell — self
contained, no host asset on disk — standing in for the decode/generate step. The
host then materialises it (`rg_res_*` / GL upload). A file-loading loader would
add a host file-read import; the block shape is identical.

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
