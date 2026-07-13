# rust_worker — Ranger2D streaming worker (WASM)

A real WASM guest that implements the userland streaming worker from
[`PLAN_RANGER2D_STREAMING.md`](../../PLAN_RANGER2D_STREAMING.md) §0b: **culling and
asset load/free policy run in WASM**, on the same wasm3 bridge as the autopeli
RGW1 guest. The engine owns *materialisation* (turning load requests into GPU
resources); this module owns *policy* (what to cull, what to load, when).

Because the worker only sees a camera transform + world grid + entity list, the
same module is dimension-agnostic — nothing in it says "2D".

## The RGX1 block

The guest owns a fixed 2560-byte linear block (magic `RGX1`, versioned, with a
`revision` the guest bumps). The host writes an **observation** and reads back
**results** by byte offset — the RGW1/RGU1 pattern (bulk read/write, no opcodes):

| Region | Direction | Contents |
|--------|-----------|----------|
| Header | — | magic, version, size, revision |
| Observation | host → guest | camera (x, y, zoom), view w/h, world cols/rows, cell w/h, preload/retire radius, cull margin, entity count |
| Entities | host → guest | up to 64 × (id, x, y, w, h) in world pixels |
| Visibility | guest → host | per-entity flag (1 = draw, 0 = culled) + visible/culled counts |
| Load/free | guest → host | cell (cx, cy) load requests and free requests |

## Exports

- `worker_ptr()` / `worker_size()` — locate the RGX1 block in linear memory
- `worker_init()` — stamp the header, clear residency state
- `worker_tick()` — cull entities + diff the camera residency ring → load/free
- `worker_revision()` — revision gate

## What `worker_tick` does

1. **Culling** — each entity is rejected only when entirely outside the camera
   view rect expanded by `cullMargin + max(w, h)` (conservative; a large sprite
   whose body could still touch the view is kept).
2. **Loading** — the camera cell (taken at the view centre) drives a residency
   ring: cells within `preloadRadius` that are not yet loaded emit a load
   request; loaded cells beyond `retireRadius` (Chebyshev distance) emit a free
   request. `retire > preload` gives hysteresis, so panning across a cell edge
   does not thrash.

Loaded cells are tracked in guest static state, so the diff is stable frame to
frame.

## Build & run

```bash
npm run engine:wasm:build:worker    # cargo build -> games/streaming_worker/worker.wasm
npm run engine:wasm:demo:worker     # build worker + C host harness, run headless
```

The demo (`host_demo.c`) drives `worker.wasm` over the wasm3 bridge with a camera
panning across a 6×1 world and prints a per-frame trace of culling + cell
load/free, materialising the worker's requests into mock resource handles. It
asserts that entities are culled, cells load ahead of the camera, and cells free
behind it (hysteresis), then prints `WORKER_DEMO_OK`.
