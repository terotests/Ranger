// Ranger2D resource loader — a *separate* WASM worker, written in AssemblyScript,
// spawned by the game guest via env.rg_spawn_worker (PLAN_RANGER2D_STREAMING.md
// §0b). Proves the loader can be AS: it plugs into the same wasm3 bridge and
// shared-block ABI as the Rust guests — nothing here is Rust- or 2D-specific.
//
// It is a bounded resource POOL: it generates (or would load) a resource per
// cell on a load request, and RELEASES it on a free request. Live resources
// stay bounded as a player roams an effectively-infinite world — that boundedness
// is the point of the streaming stress test (games/streaming_world).
//
// All state lives in the single linear BLOCK (one StaticArray) — no other
// mutable globals — so asc emits no start-time global init that this repo's
// wasm3 build rejects.

const MAGIC: i32 = 0x444C4752; // 'RGLD' little-endian
const VERSION: i32 = 2;
const SIZE: i32 = 2816;
const MAX_LIVE: i32 = 64; // pool capacity (live sprites/backgrounds at once)
const TILE: i32 = 16;     // 16x16 RGBA generated tile

// Header
const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_REVISION: i32 = 12;
// Request (host writes)
const OFF_REQ_KIND: i32 = 16; // 0 none, 1 load, 2 generate, 3 free
const OFF_REQ_CELLX: i32 = 20;
const OFF_REQ_CELLY: i32 = 24;
// Result (loader writes)
const OFF_STATUS: i32 = 32; // 0 idle,1 loaded,2 failed/not-found,3 freed,4 already-live
const OFF_BYTES: i32 = 36;
const OFF_CHECKSUM: i32 = 40;
const OFF_WIDTH: i32 = 44;
const OFF_HEIGHT: i32 = 48;
const OFF_SLOT: i32 = 52;
const OFF_LIVE: i32 = 56;      // live resource count (pool occupancy)
const OFF_PEAK: i32 = 60;      // peak live ever
const OFF_TOTAL_GEN: i32 = 64; // cumulative generated
const OFF_TOTAL_FREED: i32 = 68;
const OFF_DATA: i32 = 128;                 // 1024 bytes of last generated tile
const OFF_POOL: i32 = 1200;                // MAX_LIVE * 12 bytes: key, sum, use
const POOL_STRIDE: i32 = 12;

const BLOCK = new StaticArray<u8>(SIZE);
function ptr(): usize { return changetype<usize>(BLOCK); }
function rd(off: i32): i32 { return load<i32>(ptr() + <usize>off); }
function wr(off: i32, v: i32): void { store<i32>(ptr() + <usize>off, v); }
function wrb(off: i32, v: u8): void { store<u8>(ptr() + <usize>off, v); }

// Pool accessors (state kept inside BLOCK).
function slotKey(i: i32): i32 { return rd(OFF_POOL + i * POOL_STRIDE); }
function slotSum(i: i32): i32 { return rd(OFF_POOL + i * POOL_STRIDE + 4); }
function slotUse(i: i32): i32 { return rd(OFF_POOL + i * POOL_STRIDE + 8); }
function setSlot(i: i32, key: i32, sum: i32, use: i32): void {
  wr(OFF_POOL + i * POOL_STRIDE, key);
  wr(OFF_POOL + i * POOL_STRIDE + 4, sum);
  wr(OFF_POOL + i * POOL_STRIDE + 8, use);
}

function keyOf(cx: i32, cy: i32): i32 { return (cx << 16) | (cy & 0xffff); }

function findSlot(key: i32): i32 {
  for (let i = 0; i < MAX_LIVE; i++) {
    if (slotUse(i) != 0 && slotKey(i) == key) return i;
  }
  return -1;
}
function freeSlot(): i32 {
  for (let i = 0; i < MAX_LIVE; i++) {
    if (slotUse(i) == 0) return i;
  }
  return -1;
}

export function loader_ptr(): i32 { return <i32>ptr(); }
export function loader_size(): i32 { return SIZE; }
export function loader_revision(): i32 { return rd(OFF_REVISION); }
export function loader_live(): i32 { return rd(OFF_LIVE); }

export function loader_init(): void {
  wr(OFF_MAGIC, MAGIC);
  wr(OFF_VERSION, VERSION);
  wr(OFF_SIZE, SIZE);
  wr(OFF_REVISION, 0);
  wr(OFF_REQ_KIND, 0);
  wr(OFF_STATUS, 0);
  wr(OFF_LIVE, 0); wr(OFF_PEAK, 0); wr(OFF_TOTAL_GEN, 0); wr(OFF_TOTAL_FREED, 0);
  for (let i = 0; i < MAX_LIVE; i++) setSlot(i, 0, 0, 0);
}

// Generate a deterministic RGBA tile for (cx,cy) into OFF_DATA; return checksum.
function generateTile(cx: i32, cy: i32): i32 {
  let checksum: i32 = 0;
  let o = OFF_DATA;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = <u8>((x * 16 + cx * 40) & 0xff);
      const g = <u8>((y * 16 + cy * 40) & 0xff);
      const b = <u8>(((x ^ y) * 8 + cx * 7 + cy * 13) & 0xff);
      // 4th byte 0 (not 255) so a host reading the tile as a little-endian i32
      // gets a positive value (no sign bit) — simplifies byte extraction in the
      // Ranger renderer. Checksum still folds in a constant to stay distinct.
      wrb(o, r); wrb(o + 1, g); wrb(o + 2, b); wrb(o + 3, 0);
      checksum = (checksum + <i32>r + <i32>g + <i32>b + 255) & 0x7fffffff;
      o += 4;
    }
  }
  return checksum;
}

// Consume one request: load/generate allocates a pool slot, free releases it.
export function loader_tick(): void {
  const kind = rd(OFF_REQ_KIND);
  if (kind == 0) { wr(OFF_STATUS, 0); return; }
  const cx = rd(OFF_REQ_CELLX);
  const cy = rd(OFF_REQ_CELLY);
  const key = keyOf(cx, cy);
  let live = rd(OFF_LIVE);

  if (kind == 3) {
    const s = findSlot(key);
    if (s >= 0) {
      setSlot(s, 0, 0, 0);
      live -= 1;
      wr(OFF_TOTAL_FREED, rd(OFF_TOTAL_FREED) + 1);
      wr(OFF_SLOT, s);
      wr(OFF_STATUS, 3); // freed
    } else {
      wr(OFF_STATUS, 2); // not found
    }
  } else {
    let s = findSlot(key);
    if (s >= 0) {
      wr(OFF_SLOT, s);
      wr(OFF_CHECKSUM, slotSum(s));
      wr(OFF_STATUS, 4); // already live
    } else {
      s = freeSlot();
      if (s < 0) {
        wr(OFF_STATUS, 2); // pool full (should not happen if bounded)
      } else {
        const sum = generateTile(cx, cy);
        setSlot(s, key, sum, 1);
        live += 1;
        wr(OFF_TOTAL_GEN, rd(OFF_TOTAL_GEN) + 1);
        if (live > rd(OFF_PEAK)) wr(OFF_PEAK, live);
        wr(OFF_SLOT, s);
        wr(OFF_BYTES, TILE * TILE * 4);
        wr(OFF_WIDTH, TILE);
        wr(OFF_HEIGHT, TILE);
        wr(OFF_CHECKSUM, sum);
        wr(OFF_STATUS, 1); // loaded
      }
    }
  }

  wr(OFF_LIVE, live);
  wr(OFF_REQ_KIND, 0); // request consumed
  wr(OFF_REVISION, rd(OFF_REVISION) + 1);
}
