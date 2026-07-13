//! Ranger2D streaming worker — culling + asset load/free policy, in WASM.
//!
//! This is the userland worker from PLAN_RANGER2D_STREAMING.md §0b, implemented
//! as a real WASM guest on the same wasm3 bridge as the autopeli RGW1 guest.
//! The host writes an observation (camera + world + entities) into the shared
//! RGX1 block, calls `worker_tick`, and drains the results:
//!
//!   * culling: a per-entity visible flag (1 = draw, 0 = culled) — computed here,
//!     not in the engine, so the same worker serves any dimension.
//!   * loading: cell load / free requests derived from a camera residency ring
//!     with hysteresis (preload radius wakes cells, retire radius frees them).
//!     The host materialises the resources (rg_res_* / GL upload); the *policy*
//!     of what to load and when lives in this module.
//!
//! Layout mirrors RGW1/RGU1: a fixed linear block, magic + version at offset 0,
//! a revision the guest bumps when results change, and `worker_ptr/size` so the
//! host can bulk-read/write it. No opcodes, no command stream.

#![allow(clippy::missing_safety_doc)]

pub const RGX1_MAGIC: i32 = 0x3158_4752; // 'RGX1' little-endian
pub const RGX1_VERSION: i32 = 1;

// ---- Header ---------------------------------------------------------------
pub const OFF_MAGIC: i32 = 0;
pub const OFF_VERSION: i32 = 4;
pub const OFF_SIZE: i32 = 8;
pub const OFF_REVISION: i32 = 12;

// ---- Observation (host writes) --------------------------------------------
pub const OFF_CAM_X: i32 = 16;
pub const OFF_CAM_Y: i32 = 20;
pub const OFF_CAM_ZOOM_M: i32 = 24; // zoom * 1000 (fixed point, unused by v1 math)
pub const OFF_VIEW_W: i32 = 28;
pub const OFF_VIEW_H: i32 = 32;
pub const OFF_WORLD_COLS: i32 = 36;
pub const OFF_WORLD_ROWS: i32 = 40;
pub const OFF_CELL_W: i32 = 44;
pub const OFF_CELL_H: i32 = 48;
pub const OFF_PRELOAD_R: i32 = 52;
pub const OFF_RETIRE_R: i32 = 56;
pub const OFF_CULL_MARGIN: i32 = 60;
pub const OFF_ENT_COUNT: i32 = 64;
pub const OFF_FRAME: i32 = 68;

// ---- Entities (host writes) -----------------------------------------------
pub const OFF_ENTITIES: i32 = 128;
pub const ENT_SIZE: i32 = 20; // id, x, y, w, h
pub const MAX_ENTITIES: i32 = 64;

// ---- Results (guest writes) -----------------------------------------------
pub const OFF_VIS_FLAGS: i32 = 1408; // MAX_ENTITIES * i32
pub const OFF_VISIBLE_CNT: i32 = 1664;
pub const OFF_CULLED_CNT: i32 = 1668;

pub const OFF_LOAD_CNT: i32 = 1680;
pub const OFF_FREE_CNT: i32 = 1684;
pub const OFF_LOAD_REQ: i32 = 1696; // REQ_SIZE * MAX_REQ
pub const OFF_FREE_REQ: i32 = 1952;
pub const REQ_SIZE: i32 = 8; // cx, cy
pub const MAX_REQ: i32 = 32;

pub const RGX1_SIZE: i32 = 2560;

static mut BLOCK: [u8; 2560] = [0u8; 2560];

// Guest-owned residency state: the set of cells currently considered loaded.
// tick() diffs the new preload ring against this to emit load/free requests.
const MAX_LOADED: usize = 256;
static mut LOADED_CX: [i32; MAX_LOADED] = [0; MAX_LOADED];
static mut LOADED_CY: [i32; MAX_LOADED] = [0; MAX_LOADED];
static mut LOADED_N: usize = 0;

#[inline]
unsafe fn rd(off: i32) -> i32 {
    let mut b = [0u8; 4];
    let base = off as usize;
    b.copy_from_slice(&BLOCK[base..base + 4]);
    i32::from_le_bytes(b)
}

#[inline]
unsafe fn wr(off: i32, v: i32) {
    let base = off as usize;
    BLOCK[base..base + 4].copy_from_slice(&v.to_le_bytes());
}

#[inline]
fn maxi(a: i32, b: i32) -> i32 {
    if a > b {
        a
    } else {
        b
    }
}

#[inline]
fn clampi(v: i32, lo: i32, hi: i32) -> i32 {
    if v < lo {
        lo
    } else if v > hi {
        hi
    } else {
        v
    }
}

/// Byte offset of the RGX1 block in linear memory (host reads/writes here).
#[no_mangle]
pub extern "C" fn worker_ptr() -> i32 {
    unsafe { BLOCK.as_ptr() as i32 }
}

#[no_mangle]
pub extern "C" fn worker_size() -> i32 {
    RGX1_SIZE
}

#[no_mangle]
pub extern "C" fn worker_revision() -> i32 {
    unsafe { rd(OFF_REVISION) }
}

/// Stamp the header and clear residency state. Called once after load.
#[no_mangle]
pub extern "C" fn worker_init() {
    unsafe {
        wr(OFF_MAGIC, RGX1_MAGIC);
        wr(OFF_VERSION, RGX1_VERSION);
        wr(OFF_SIZE, RGX1_SIZE);
        wr(OFF_REVISION, 0);
        LOADED_N = 0;
    }
}

unsafe fn loaded_has(cx: i32, cy: i32) -> bool {
    let mut i = 0usize;
    while i < LOADED_N {
        if LOADED_CX[i] == cx && LOADED_CY[i] == cy {
            return true;
        }
        i += 1;
    }
    false
}

unsafe fn loaded_add(cx: i32, cy: i32) {
    if LOADED_N < MAX_LOADED {
        LOADED_CX[LOADED_N] = cx;
        LOADED_CY[LOADED_N] = cy;
        LOADED_N += 1;
    }
}

unsafe fn loaded_remove_at(i: usize) {
    // swap-remove: order does not matter for a residency set.
    LOADED_N -= 1;
    LOADED_CX[i] = LOADED_CX[LOADED_N];
    LOADED_CY[i] = LOADED_CY[LOADED_N];
}

/// Read the observation, cull the entities, and diff the camera residency ring
/// against the loaded set to emit load/free requests. Bumps the revision when
/// anything changed so the host can skip an identical frame (RGU1-style gate).
#[no_mangle]
pub extern "C" fn worker_tick() {
    unsafe {
        let cam_x = rd(OFF_CAM_X);
        let cam_y = rd(OFF_CAM_Y);
        let view_w = rd(OFF_VIEW_W);
        let view_h = rd(OFF_VIEW_H);
        let cols = maxi(rd(OFF_WORLD_COLS), 1);
        let rows = maxi(rd(OFF_WORLD_ROWS), 1);
        let cell_w = maxi(rd(OFF_CELL_W), 1);
        let cell_h = maxi(rd(OFF_CELL_H), 1);
        let preload_r = rd(OFF_PRELOAD_R);
        let retire_r = maxi(rd(OFF_RETIRE_R), preload_r);
        let margin = rd(OFF_CULL_MARGIN);
        let ent_count = clampi(rd(OFF_ENT_COUNT), 0, MAX_ENTITIES);

        // --- Culling: per-entity AABB vs camera view (+ margin + half-extent) ---
        let mut visible = 0i32;
        let mut culled = 0i32;
        let left = cam_x;
        let right = cam_x + view_w;
        let top = cam_y;
        let bottom = cam_y + view_h;
        let mut i = 0i32;
        while i < ent_count {
            let e = OFF_ENTITIES + i * ENT_SIZE;
            let ex = rd(e + 4);
            let ey = rd(e + 8);
            let ew = rd(e + 12);
            let eh = rd(e + 16);
            let ext = margin + maxi(ew, eh);
            let out = ex < left - ext || ex > right + ext || ey < top - ext || ey > bottom + ext;
            if out {
                wr(OFF_VIS_FLAGS + i * 4, 0);
                culled += 1;
            } else {
                wr(OFF_VIS_FLAGS + i * 4, 1);
                visible += 1;
            }
            i += 1;
        }
        wr(OFF_VISIBLE_CNT, visible);
        wr(OFF_CULLED_CNT, culled);

        // --- Loading: camera residency ring with hysteresis ---
        // Camera cell is taken at the view centre so panning feels centred.
        let ccx = clampi((cam_x + view_w / 2) / cell_w, 0, cols - 1);
        let ccy = clampi((cam_y + view_h / 2) / cell_h, 0, rows - 1);

        // Emit load requests for cells within the preload ring not yet loaded.
        let mut load_n = 0i32;
        let mut dy = -preload_r;
        while dy <= preload_r {
            let mut dx = -preload_r;
            while dx <= preload_r {
                let cx = ccx + dx;
                let cy = ccy + dy;
                let in_grid = cx >= 0 && cx < cols && cy >= 0 && cy < rows;
                if in_grid && !loaded_has(cx, cy) && load_n < MAX_REQ {
                    let r = OFF_LOAD_REQ + load_n * REQ_SIZE;
                    wr(r, cx);
                    wr(r + 4, cy);
                    loaded_add(cx, cy);
                    load_n += 1;
                }
                dx += 1;
            }
            dy += 1;
        }

        // Emit free requests for loaded cells now outside the retire ring
        // (Chebyshev distance > retire_r). Retire > preload => hysteresis.
        let mut free_n = 0i32;
        let mut k = 0usize;
        while k < LOADED_N {
            let cx = LOADED_CX[k];
            let cy = LOADED_CY[k];
            let dist = maxi((cx - ccx).abs(), (cy - ccy).abs());
            if dist > retire_r && free_n < MAX_REQ {
                let r = OFF_FREE_REQ + free_n * REQ_SIZE;
                wr(r, cx);
                wr(r + 4, cy);
                free_n += 1;
                loaded_remove_at(k);
                // do not advance k: a swapped-in element now sits at k.
            } else {
                k += 1;
            }
        }
        wr(OFF_LOAD_CNT, load_n);
        wr(OFF_FREE_CNT, free_n);

        // Revision bump when this tick produced any change worth reading.
        if load_n > 0 || free_n > 0 || culled > 0 || visible > 0 {
            let rev = rd(OFF_REVISION);
            wr(OFF_REVISION, rev + 1);
        }
    }
}
