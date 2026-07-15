//! cube3d_wasm — a lit, spinning cube compiled to WASM for the Ranger engine.
//!
//! Phase-1 vertical slice of the 3D-graphics proposal (`ABI_V2_PROPOSAL.md`
//! §18–§21). The guest declares, in its own linear memory, three blocks that
//! mirror the proposed layouts:
//!
//!   * MESH  (§18) — 'RGMB': one cube = 24 vertices (position + normal + rgba)
//!                   and 36 u16 indices, plus a streaming model transform.
//!   * CAM   (§19) — 'RGCM': a PERSPECTIVE camera (eye / target / up / fov).
//!   * LIGHT (§20) — 'RGLT': ambient + one directional "sun".
//!
//! It exports `init` / `update` plus a `*_ptr` / `*_size` pair per block, the
//! same idiom the shipped RGU1 guest uses (`rg_ui_ptr`/`rg_ui_size`). The host
//! reads the bytes out of `memory.buffer`, builds the view-projection and
//! rasterises — nothing here does any floating point or trig: the guest only
//! writes fixed-point integers and, per frame, bumps the model rotation.
//!
//! Fixed-point (matches the proposal): positions / intensities / radians use
//! FP = 256; normals and matrix-space unit vectors use Q16.16 (65536).

#![allow(clippy::missing_safety_doc)]

use core::cell::UnsafeCell;

const FP: i32 = 256; // positions, intensities, radians * FP
const Q16: i32 = 65536; // normals / unit vectors (Q16.16)

// ------------------------------------------------------------------ block util
struct Block<const N: usize>(UnsafeCell<[u8; N]>);
unsafe impl<const N: usize> Sync for Block<N> {}
impl<const N: usize> Block<N> {
    const fn new() -> Self {
        Block(UnsafeCell::new([0u8; N]))
    }
    fn base(&self) -> *mut u8 {
        self.0.get() as *mut u8
    }
    fn w_i32(&self, off: usize, v: i32) {
        let b = v.to_le_bytes();
        unsafe { core::ptr::copy_nonoverlapping(b.as_ptr(), self.base().add(off), 4) };
    }
    fn w_u32(&self, off: usize, v: u32) {
        self.w_i32(off, v as i32);
    }
    fn w_u16(&self, off: usize, v: u16) {
        let b = v.to_le_bytes();
        unsafe { core::ptr::copy_nonoverlapping(b.as_ptr(), self.base().add(off), 2) };
    }
}

// ------------------------------------------------------------------ MESH (§18)
// magic,version,size,revision | vtx_count,idx_count | rotX,rotY,rotZ (rad*FP) |
// posX,posY,posZ (world*FP) | flags,_rsv | verts[24]{x,y,z,nx,ny,nz,rgba,uv} |
// indices[36] u16.
const MESH_MAGIC: u32 = 0x424d_4752; // 'RGMB'
const V: usize = 24; // vertices
const I: usize = 36; // indices
const MESH_HDR: usize = 64;
const VTX_SZ: usize = 32;
const MESH_OFF_REV: usize = 12;
const MESH_OFF_ROT: usize = 24; // rotX,rotY,rotZ
const MESH_VTX: usize = MESH_HDR;
const MESH_IDX: usize = MESH_HDR + V * VTX_SZ;
const MESH_SIZE: usize = MESH_IDX + I * 2;
static MESH: Block<MESH_SIZE> = Block::new();

// ------------------------------------------------------------------- CAM (§19)
const CAM_MAGIC: u32 = 0x4d43_4752; // 'RGCM'
const CAM_PERSPECTIVE: u32 = 2;
const CAM_SIZE: usize = 72;
static CAM: Block<CAM_SIZE> = Block::new();

// ----------------------------------------------------------------- LIGHT (§20)
const LIT_MAGIC: u32 = 0x544c_4752; // 'RGLT'
const LIT_SIZE: usize = 48;
static LIT: Block<LIT_SIZE> = Block::new();

// spin state
static REV: Block<8> = Block::new();
static ANG: Block<8> = Block::new();

fn rgba(r: u8, g: u8, b: u8, a: u8) -> u32 {
    ((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | (a as u32)
}

/// Write one interleaved vertex (position * FP, normal Q16.16, colour).
fn put_vertex(i: usize, pos: [i32; 3], nrm: [i32; 3], col: u32) {
    let o = MESH_VTX + i * VTX_SZ;
    MESH.w_i32(o, pos[0]);
    MESH.w_i32(o + 4, pos[1]);
    MESH.w_i32(o + 8, pos[2]);
    MESH.w_i32(o + 12, nrm[0]);
    MESH.w_i32(o + 16, nrm[1]);
    MESH.w_i32(o + 20, nrm[2]);
    MESH.w_u32(o + 24, col);
    MESH.w_u32(o + 28, 0); // uv (unused for vertex-colour)
}

fn build_cube() {
    // 6 faces, CCW from outside; a = 1 unit = FP.
    let a = FP;
    // (positions given as +/-1 units, scaled by `a`)
    let faces: [([[i32; 3]; 4], [i32; 3], u32); 6] = [
        // front +Z
        ([[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [0, 0, Q16], rgba(220, 60, 60, 255)),
        // back -Z
        ([[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [0, 0, -Q16], rgba(60, 200, 200, 255)),
        // right +X
        ([[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [Q16, 0, 0], rgba(80, 200, 80, 255)),
        // left -X
        ([[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [-Q16, 0, 0], rgba(220, 200, 60, 255)),
        // top +Y
        ([[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [0, Q16, 0], rgba(80, 120, 230, 255)),
        // bottom -Y
        ([[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [0, -Q16, 0], rgba(200, 80, 200, 255)),
    ];
    let mut vi = 0usize;
    let mut ii = 0usize;
    for (quad, n, col) in faces.iter() {
        let base = vi as u16;
        for corner in quad.iter() {
            put_vertex(vi, [corner[0] * a, corner[1] * a, corner[2] * a], *n, *col);
            vi += 1;
        }
        // two CCW triangles per quad: (0,1,2) (0,2,3)
        for &k in &[0u16, 1, 2, 0, 2, 3] {
            MESH.w_u16(MESH_IDX + ii * 2, base + k);
            ii += 1;
        }
    }
}

#[no_mangle]
pub extern "C" fn init() {
    // MESH header
    MESH.w_u32(0, MESH_MAGIC);
    MESH.w_i32(4, 1);
    MESH.w_i32(8, MESH_SIZE as i32);
    MESH.w_i32(MESH_OFF_REV, 0);
    MESH.w_u32(16, V as u32);
    MESH.w_u32(20, I as u32);
    MESH.w_i32(MESH_OFF_ROT, 0);
    MESH.w_i32(MESH_OFF_ROT + 4, 0);
    MESH.w_i32(MESH_OFF_ROT + 8, 0);
    MESH.w_i32(36, 0); // pos x
    MESH.w_i32(40, 0); // pos y
    MESH.w_i32(44, 0); // pos z
    MESH.w_u32(48, 0); // flags (0 = lit, vertex colour)
    build_cube();

    // CAM: perspective, eye (3, 2.5, 4), target origin, up +Y, fov 50deg.
    CAM.w_u32(0, CAM_MAGIC);
    CAM.w_i32(4, 1);
    CAM.w_i32(8, CAM_SIZE as i32);
    CAM.w_i32(12, 0);
    CAM.w_u32(16, CAM_PERSPECTIVE);
    CAM.w_i32(20, 3 * FP); // eye x
    CAM.w_i32(24, (5 * FP) / 2); // eye y = 2.5
    CAM.w_i32(28, 4 * FP); // eye z
    CAM.w_i32(32, 0); // target x
    CAM.w_i32(36, 0); // target y
    CAM.w_i32(40, 0); // target z
    CAM.w_i32(44, 0); // up x
    CAM.w_i32(48, Q16); // up y = 1.0
    CAM.w_i32(52, 0); // up z
    CAM.w_i32(56, 223); // fovy ~= 0.873 rad (50deg) * FP
    CAM.w_i32(60, FP / 10); // near 0.1
    CAM.w_i32(64, 100 * FP); // far 100

    // LIGHT: ambient 0.25 white + warm sun from upper-right-front.
    LIT.w_u32(0, LIT_MAGIC);
    LIT.w_i32(4, 1);
    LIT.w_i32(8, LIT_SIZE as i32);
    LIT.w_i32(12, 0);
    LIT.w_u32(16, rgba(255, 255, 255, 255)); // ambient rgb
    LIT.w_i32(20, FP / 4); // ambient intensity 0.25
    // sun direction TO light, ~normalize(0.5, 0.9, 0.4), Q16.16
    LIT.w_i32(24, (Q16 * 5) / 11);
    LIT.w_i32(28, (Q16 * 9) / 11);
    LIT.w_i32(32, (Q16 * 4) / 11);
    LIT.w_u32(36, rgba(255, 244, 214, 255)); // sun rgb (warm)
    LIT.w_i32(40, (FP * 9) / 10); // sun intensity 0.9

    REV.w_i32(0, 0);
    ANG.w_i32(0, 0);
    ANG.w_i32(4, 0);
}

/// Advance the spin. `dt_ms` is accepted for parity with the world ABI; the
/// Phase-1 host steps at a fixed rate so we bump by a constant per frame.
#[no_mangle]
pub extern "C" fn update(_dt_ms: i32, _a: i32, _b: i32, _c: i32, _d: i32) {
    let mut ry = i32::from_le_bytes(unsafe { *(ANG.base() as *const [u8; 4]) });
    let mut rx = i32::from_le_bytes(unsafe { *(ANG.base().add(4) as *const [u8; 4]) });
    ry += 8; // ~0.031 rad / frame
    rx += 4; // ~0.016 rad / frame
    let two_pi = 1608; // 2*pi * FP (256), kept integer
    if ry >= two_pi {
        ry -= two_pi;
    }
    if rx >= two_pi {
        rx -= two_pi;
    }
    ANG.w_i32(0, ry);
    ANG.w_i32(4, rx);

    MESH.w_i32(MESH_OFF_ROT, rx); // rotX
    MESH.w_i32(MESH_OFF_ROT + 4, ry); // rotY
    MESH.w_i32(MESH_OFF_ROT + 8, 0);

    let rev = REV.base();
    let cur = i32::from_le_bytes(unsafe { *(rev as *const [u8; 4]) }) + 1;
    REV.w_i32(0, cur);
    MESH.w_i32(MESH_OFF_REV, cur);
}

// ------------------------------------------------------------------- exports
#[no_mangle]
pub extern "C" fn rg_mesh_ptr() -> i32 {
    MESH.base() as i32
}
#[no_mangle]
pub extern "C" fn rg_mesh_size() -> i32 {
    MESH_SIZE as i32
}
#[no_mangle]
pub extern "C" fn rg_cam_ptr() -> i32 {
    CAM.base() as i32
}
#[no_mangle]
pub extern "C" fn rg_cam_size() -> i32 {
    CAM_SIZE as i32
}
#[no_mangle]
pub extern "C" fn rg_lit_ptr() -> i32 {
    LIT.base() as i32
}
#[no_mangle]
pub extern "C" fn rg_lit_size() -> i32 {
    LIT_SIZE as i32
}
