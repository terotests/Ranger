// Ranger2D resource loader — a *separate* WASM worker, written in AssemblyScript,
// spawned by the game guest via env.rg_spawn_worker (PLAN_RANGER2D_STREAMING.md
// §0b). It answers the question "can the loader also be AS code?": yes — the
// RGX/RGLD blocks and the spawn ABI are language-agnostic, so this AS module
// plugs into the exact same wasm3 bridge as the Rust guests.
//
// Role: given a request (cell coords + kind), *generate or load* a resource and
// report it. This PoC generates a deterministic RGBA tile per cell — self
// contained, no host asset on disk — which stands in for the decode/generate
// step; the host would then materialise it (rg_res_* / GL upload). A real
// file-loading loader would add a host file-read import; the shape is identical.

const MAGIC: i32 = 0x444C4752; // 'RGLD' little-endian
const VERSION: i32 = 1;
const SIZE: i32 = 2048;

const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_REVISION: i32 = 12;
// Request (host writes):
const OFF_REQ_KIND: i32 = 16; // 0 none, 1 load, 2 generate
const OFF_REQ_CELLX: i32 = 20;
const OFF_REQ_CELLY: i32 = 24;
const OFF_REQ_ASSET: i32 = 28;
// Result (loader writes):
const OFF_STATUS: i32 = 32; // 0 idle, 1 ready, 2 failed
const OFF_BYTES: i32 = 36;
const OFF_CHECKSUM: i32 = 40;
const OFF_WIDTH: i32 = 44;
const OFF_HEIGHT: i32 = 48;
// Produced resource bytes:
const OFF_DATA: i32 = 128;
const TILE: i32 = 16; // 16x16 RGBA generated tile

const BLOCK = new StaticArray<u8>(SIZE);
function ptr(): usize { return changetype<usize>(BLOCK); }
function rd(off: i32): i32 { return load<i32>(ptr() + <usize>off); }
function wr(off: i32, v: i32): void { store<i32>(ptr() + <usize>off, v); }
function wrb(off: i32, v: u8): void { store<u8>(ptr() + <usize>off, v); }

export function loader_ptr(): i32 { return <i32>ptr(); }
export function loader_size(): i32 { return SIZE; }
export function loader_revision(): i32 { return rd(OFF_REVISION); }

export function loader_init(): void {
  wr(OFF_MAGIC, MAGIC);
  wr(OFF_VERSION, VERSION);
  wr(OFF_SIZE, SIZE);
  wr(OFF_REVISION, 0);
  wr(OFF_REQ_KIND, 0);
  wr(OFF_STATUS, 0);
}

// Consume one request and produce its resource. Deterministic per (cellX,cellY)
// so the host can verify each cell yields a distinct resource (checksum).
export function loader_tick(): void {
  const kind = rd(OFF_REQ_KIND);
  if (kind == 0) {
    wr(OFF_STATUS, 0); // idle
    return;
  }
  const cx = rd(OFF_REQ_CELLX);
  const cy = rd(OFF_REQ_CELLY);
  let checksum: i32 = 0;
  let o = OFF_DATA;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = <u8>((x * 16 + cx * 40) & 0xff);
      const g = <u8>((y * 16 + cy * 40) & 0xff);
      const b = <u8>(((x ^ y) * 8 + cx * 7 + cy * 13) & 0xff);
      wrb(o, r);
      wrb(o + 1, g);
      wrb(o + 2, b);
      wrb(o + 3, 255);
      checksum = (checksum + <i32>r + <i32>g + <i32>b + 255) & 0x7fffffff;
      o += 4;
    }
  }
  wr(OFF_WIDTH, TILE);
  wr(OFF_HEIGHT, TILE);
  wr(OFF_BYTES, TILE * TILE * 4);
  wr(OFF_CHECKSUM, checksum);
  wr(OFF_STATUS, 1); // ready
  wr(OFF_REQ_KIND, 0); // request consumed
  wr(OFF_REVISION, rd(OFF_REVISION) + 1);
}
