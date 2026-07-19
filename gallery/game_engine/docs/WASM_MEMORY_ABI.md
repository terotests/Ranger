# WASM linear-memory ABI rules

Binding safety and correctness rules for bulk host↔guest copies (geometry
attributes, and any other `span` / ptr+len payload). Referenced from
[`CODE_CLEANUP.md`](../CODE_CLEANUP.md) **D-WASM-MEM**.

These are **ABI requirements**, not optional optimizations.

## Rules

### 1. The host receives offsets, not pointers

`ptr` in a call such as `geometrySetAttribute(geoH, name, ptr, len, …)` is an
integer offset into the guest's linear memory. A buggy or hostile guest can
pass any number.

**Rule:** the host bounds-checks `ptr + len` against the **current** memory size
(and requires appropriate alignment, typically 4-byte for `f32`/`i32`) before
copying, and rejects with a typed error — the same discipline the RGU1
validator already applies to its block.

### 2. Memory growth invalidates host-side views

When guest memory grows (`memory.grow`), a JS `ArrayBuffer` view of it is
detached; a cached view then reads garbage or throws. This is not hypothetical —
current JS harnesses cache such a view (e.g. `render.cjs`:
`const dv = new DataView(exp.memory.buffer)`). The Ranger host's per-word
`wasm_mem_i32` reads are immune but slow.

**Rule:** a bulk copy re-acquires the memory buffer at the start of every
command and never holds a view across calls. The fast path and the safe path
are the same path.

### 3. No guest callbacks during a copy

If the host calls back into the guest mid-copy (an allocation, a logging hook),
the guest may grow memory and the source range moves under the copy.

**Rule:** bulk commands are atomic with respect to guest execution — the host
completes the copy before any guest export runs again.

### 4. Linear memory grows but never shrinks

A guest that stages a large vertex buffer to upload it keeps that memory
forever, even after the host has copied it out — a large model staged
guest-side inflates the instance permanently.

**Rules:**

- Large assets prefer host-side decode (vertices never enter guest memory).
- Guest-built geometry beyond a threshold uploads in **chunks**
  (`geometryAppend` / ranged `geometrySetAttribute`) so peak staging is bounded
  and reusable.

### 5. Uploads double the data temporarily

During `geometrySetAttribute` / bulk fill the vertices exist twice — guest
staging buffer plus host core arrays. On Pi-class targets with large scenes
this peak matters.

**Rule:** chunked upload (rule 4) bounds the peak. The one-copy rule in
`CODE_CLEANUP.md` D-GEO guarantees the doubling is transient, not permanent —
after the command, the authoritative copy is host-only.

### 6. Read-back requires guest-side allocation

`geometryReadPositions` (and similar) write into a buffer the guest must
allocate first, which may force `memory.grow`, which can fail.

**Rules:**

- The guest sizes the buffer from `geometryVertexCount` (or equivalent) before
  reading.
- A failed allocation or an out-of-range window is a typed error status
  (rule 11), never a trap.
- Large read-backs chunk the same way uploads do.

### 7. Fixed-size shared blocks must not carry arbitrary geometry

Existing ABI blocks freeze capacity into the header (`RG_WASM_MAX_BODIES`,
`RG_WASM_MAX_ENTITIES`, `RG_UI_MAX_NODES`, `RG_UI_STRING_CAP`, …). A fixed
geometry block would put `MAX_VERTICES` in a header and cap every game's mesh
size forever — the legacy `rg_mesh_ptr` block had exactly this shape.

**Rule:** vertex payloads go through ptr+len bulk commands only. Fixed blocks
remain for small, fixed-cardinality state (input words, camera), never for
geometry.

### 8. Shared memory across threads can tear

The streaming vertical (`rust_worker`, RGX1 at a fixed offset in linear memory)
has a worker writing while another side reads. A reader can observe a
half-written range. The codebase already has the discipline for this: RGP1's
seqlock `revision` (odd = mid-write, even = stable, `wasm_pose_abi.h`).

**Rule:** any concurrently written buffer carries the same seqlock.
Single-threaded command uploads need none because rule 3 makes them atomic.

### 9. wasm32 addresses top out at 4 GiB

Whole-scene vertex data can approach the guest's address-space ceiling long
before the host's.

**Rule:** the authoritative copy lives host-side; the guest holds handles. Guest
memory scales with what it **stages**, not with what the scene **contains**.

### 10. Spans use one convention, validated with checked arithmetic

Every span parameter is `(offset_bytes, element_count, element_type)` — never
a per-call-site mix of byte counts and element counts.

**Rule:** validation before any copy uses checked arithmetic; unchecked
`ptr + len` can wrap and pass a naive bounds test:

```
byte_length = checked_mul(element_count, sizeof(element_type))   ; overflow → error
end         = checked_add(offset_bytes, byte_length)             ; overflow → error
require end <= current_memory_size
require offset_bytes % alignof(element_type) == 0
```

### 11. Status codes are separate from result counts

`0` must not mean both "success", "zero elements", and "error". Commands
return a **status** (0 = success); counts travel in out-parameters:

```
status = geometryReadPositions(geoH, first, count,
                               dstOffsetBytes, dstCapacityElements,
                               outWrittenElements)
; status == 0 → success; *outWrittenElements may legitimately be 0
; status != 0 → typed error; *outWrittenElements is set to 0
```

**Rule:** every non-zero status maps to a typed guest error
(`ranger_wasm::Error::from_code`) — no silent success, and a legitimate
zero-element result is never conflated with failure.

## Relationship to other contracts

| Topic | Document |
|-------|----------|
| Stable `geoH`, one host vertex copy, bulk crossings | `CODE_CLEANUP.md` D-GEO |
| Import signature versioning | `CODE_CLEANUP.md` D-WASM |
| `span` / buffer types in the schema | `CODE_CLEANUP.md` D-REGISTRY |
| Async completion scheduling (non-reentrant, frame boundary) | `CODE_CLEANUP.md` D-ASYNC |
