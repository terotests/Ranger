//! cube3d_wasm — a lit, **textured** spinning cube compiled to WASM.
//!
//! Phase-1 slice of the 3D-graphics proposal (`ABI_V2_PROPOSAL.md` §18–§21) plus
//! the material/resource step (§17 resources, §18 mesh `material`). The guest
//! declares four blocks in its own linear memory and drives them:
//!
//!   * MESH     (§18) 'RGMB' — 24 vertices (position + normal + rgba + uv), 36
//!               u16 indices, and 6 sub-meshes (one per cube face) each naming a
//!               material; plus a per-frame model rotation.
//!   * MATERIAL (§17/§18) 'RGMA' — a small material table: each material names a
//!               texture handle + a base colour + flags (lit / unlit).
//!   * CAM      (§19) 'RGCM' — a PERSPECTIVE camera.
//!   * LIGHT    (§20) 'RGLT' — ambient + one directional sun.
//!
//! The **resource loader** is the host import `rg_res_load(name, len) -> handle`
//! (§17): at init the guest asks the host to load named textures, gets opaque
//! handles back, stores them in materials, and assigns a material to each face.
//! The host owns the pixels; the guest only ever holds a handle — the §17
//! "no guest pointer is retained, handles are opaque" discipline. Later a
//! material can grow shaders / mipmaps / LOD with no guest-side change.
//!
//! The guest does no float: it writes fixed-point ints (positions `FP`=256,
//! normals/units Q16.16, uv * 4096) and bumps the model rotation per frame.

#![allow(clippy::missing_safety_doc)]

use core::cell::UnsafeCell;

const FP: i32 = 256;
const Q16: i32 = 65536;
const UV: i32 = 4096; // uv fixed-point unit ([0,1) -> u16)

extern "C" {
    /// Host resource loader (§17). Returns an opaque texture handle (0 = fail).
    /// The host copies the name out of guest memory; no pointer is retained.
    fn rg_res_load(name_ptr: *const u8, name_len: u32) -> u32;
}

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
    fn r_i32(&self, off: usize) -> i32 {
        let mut b = [0u8; 4];
        unsafe { core::ptr::copy_nonoverlapping(self.base().add(off), b.as_mut_ptr(), 4) };
        i32::from_le_bytes(b)
    }
}

// ------------------------------------------------------------------ MESH (§18)
const MESH_MAGIC: u32 = 0x424d_4752; // 'RGMB'
const V: usize = 24;
const I: usize = 36;
const S: usize = 6; // sub-meshes (one per face)
const MESH_HDR: usize = 64;
const VTX_SZ: usize = 32;
const MESH_OFF_ROT: usize = 28; // rotX,rotY,rotZ
const MESH_OFF_REV: usize = 12;
const MESH_VTX: usize = MESH_HDR;
const MESH_IDX: usize = MESH_VTX + V * VTX_SZ;
const MESH_SUB: usize = (MESH_IDX + I * 2 + 3) & !3; // 4-byte align
const MESH_SIZE: usize = MESH_SUB + S * 12;
static MESH: Block<MESH_SIZE> = Block::new();

// --------------------------------------------------------------- MATERIAL (§17)
const MAT_MAGIC: u32 = 0x414d_4752; // 'RGMA'
const MAT_COUNT: usize = 2;
const MAT_SIZE: usize = 20 + MAT_COUNT * 16;
static MAT: Block<MAT_SIZE> = Block::new();

// ------------------------------------------------------------------- CAM (§19)
const CAM_MAGIC: u32 = 0x4d43_4752; // 'RGCM'
const CAM_PERSPECTIVE: u32 = 2;
const CAM_SIZE: usize = 72;
static CAM: Block<CAM_SIZE> = Block::new();

// ----------------------------------------------------------------- LIGHT (§20)
const LIT_MAGIC: u32 = 0x544c_4752; // 'RGLT'
const LIT_SIZE: usize = 48;
static LIT: Block<LIT_SIZE> = Block::new();

static ANG: Block<8> = Block::new();

fn rgba(r: u8, g: u8, b: u8, a: u8) -> u32 {
    ((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | (a as u32)
}
fn uv_pack(u: i32, v: i32) -> u32 {
    ((v as u32) << 16) | (u as u32 & 0xffff)
}

fn put_vertex(i: usize, pos: [i32; 3], nrm: [i32; 3], col: u32, uv: u32) {
    let o = MESH_VTX + i * VTX_SZ;
    MESH.w_i32(o, pos[0]);
    MESH.w_i32(o + 4, pos[1]);
    MESH.w_i32(o + 8, pos[2]);
    MESH.w_i32(o + 12, nrm[0]);
    MESH.w_i32(o + 16, nrm[1]);
    MESH.w_i32(o + 20, nrm[2]);
    MESH.w_u32(o + 24, col);
    MESH.w_u32(o + 28, uv);
}

fn build_cube() {
    let a = FP;
    let w = rgba(255, 255, 255, 255); // white: let texture + light supply colour
    // per face: 4 CCW corners, face normal, material id
    let faces: [([[i32; 3]; 4], [i32; 3], u32); 6] = [
        ([[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [0, 0, Q16], 0), // front +Z
        ([[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [0, 0, -Q16], 0), // back -Z
        ([[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [Q16, 0, 0], 0), // right +X
        ([[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [-Q16, 0, 0], 0), // left -X
        ([[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [0, Q16, 0], 1), // top +Y
        ([[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [0, -Q16, 0], 1), // bottom -Y
    ];
    // uv per corner: (0,0)(1,0)(1,1)(0,1)
    let uvs = [uv_pack(0, 0), uv_pack(UV, 0), uv_pack(UV, UV), uv_pack(0, UV)];
    let mut vi = 0usize;
    let mut ii = 0usize;
    for (f, (quad, n, mat)) in faces.iter().enumerate() {
        let base = vi as u16;
        for (k, corner) in quad.iter().enumerate() {
            put_vertex(vi, [corner[0] * a, corner[1] * a, corner[2] * a], *n, w, uvs[k]);
            vi += 1;
        }
        for &k in &[0u16, 1, 2, 0, 2, 3] {
            MESH.w_u16(MESH_IDX + ii * 2, base + k);
            ii += 1;
        }
        // sub-mesh f: 6 indices starting at f*6, using material `mat`
        let so = MESH_SUB + f * 12;
        MESH.w_u32(so, (f * 6) as u32); // first_index
        MESH.w_u32(so + 4, 6); // index_count
        MESH.w_u32(so + 8, *mat); // material_id
    }
}

fn set_material(i: usize, tex: u32, base: u32, flags: u32) {
    let o = 20 + i * 16;
    MAT.w_u32(o, tex);
    MAT.w_u32(o + 4, base);
    MAT.w_u32(o + 8, flags);
    MAT.w_u32(o + 12, 0);
}

#[no_mangle]
pub extern "C" fn init() {
    // --- load textures through the host resource loader (§17) ---
    let crate_tex = unsafe { rg_res_load("crate".as_ptr(), 5) };
    let tiles_tex = unsafe { rg_res_load("tiles".as_ptr(), 5) };

    // --- MATERIAL table ---
    MAT.w_u32(0, MAT_MAGIC);
    MAT.w_i32(4, 1);
    MAT.w_i32(8, MAT_SIZE as i32);
    MAT.w_i32(12, 0);
    MAT.w_u32(16, MAT_COUNT as u32);
    set_material(0, crate_tex, rgba(255, 255, 255, 255), 0); // sides: wooden crate, lit
    set_material(1, tiles_tex, rgba(255, 255, 255, 255), 0); // top/bottom: tiles, lit

    // --- MESH ---
    MESH.w_u32(0, MESH_MAGIC);
    MESH.w_i32(4, 1);
    MESH.w_i32(8, MESH_SIZE as i32);
    MESH.w_i32(MESH_OFF_REV, 0);
    MESH.w_u32(16, V as u32);
    MESH.w_u32(20, I as u32);
    MESH.w_u32(24, S as u32);
    MESH.w_i32(MESH_OFF_ROT, 0);
    MESH.w_i32(MESH_OFF_ROT + 4, 0);
    MESH.w_i32(MESH_OFF_ROT + 8, 0);
    MESH.w_i32(40, 0);
    MESH.w_i32(44, 0);
    MESH.w_i32(48, 0);
    build_cube();

    // --- CAM: perspective, eye (3, 2.5, 4), target origin, up +Y, fov ~50deg ---
    CAM.w_u32(0, CAM_MAGIC);
    CAM.w_i32(4, 1);
    CAM.w_i32(8, CAM_SIZE as i32);
    CAM.w_i32(12, 0);
    CAM.w_u32(16, CAM_PERSPECTIVE);
    CAM.w_i32(20, 3 * FP);
    CAM.w_i32(24, (5 * FP) / 2);
    CAM.w_i32(28, 4 * FP);
    CAM.w_i32(32, 0);
    CAM.w_i32(36, 0);
    CAM.w_i32(40, 0);
    CAM.w_i32(44, 0);
    CAM.w_i32(48, Q16);
    CAM.w_i32(52, 0);
    CAM.w_i32(56, 223); // fovy ~0.87 rad
    CAM.w_i32(60, FP / 10);
    CAM.w_i32(64, 100 * FP);

    // --- LIGHT: low ambient so the directional sun is clearly visible ---
    LIT.w_u32(0, LIT_MAGIC);
    LIT.w_i32(4, 1);
    LIT.w_i32(8, LIT_SIZE as i32);
    LIT.w_i32(12, 0);
    LIT.w_u32(16, rgba(150, 170, 210, 255)); // cool ambient (sky bounce)
    LIT.w_i32(20, (FP * 3) / 10); // ambient 0.30 of a cool tint -> soft fill
    LIT.w_i32(24, (Q16 * 5) / 11); // sun dir ~normalize(0.5,0.9,0.4)
    LIT.w_i32(28, (Q16 * 9) / 11);
    LIT.w_i32(32, (Q16 * 4) / 11);
    LIT.w_u32(36, rgba(255, 240, 200, 255)); // warm sun
    LIT.w_i32(40, FP); // sun intensity 1.0 -> strong directional term

    ANG.w_i32(0, 0);
    ANG.w_i32(4, 0);
}

#[no_mangle]
pub extern "C" fn update(_dt_ms: i32, _a: i32, _b: i32, _c: i32, _d: i32) {
    let mut ry = ANG.r_i32(0);
    let mut rx = ANG.r_i32(4);
    ry += 8;
    rx += 4;
    let two_pi = 1608; // 2*pi * FP
    if ry >= two_pi {
        ry -= two_pi;
    }
    if rx >= two_pi {
        rx -= two_pi;
    }
    ANG.w_i32(0, ry);
    ANG.w_i32(4, rx);
    MESH.w_i32(MESH_OFF_ROT, rx);
    MESH.w_i32(MESH_OFF_ROT + 4, ry);
    let rev = MESH.r_i32(MESH_OFF_REV) + 1;
    MESH.w_i32(MESH_OFF_REV, rev);
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
pub extern "C" fn rg_mat_ptr() -> i32 {
    MAT.base() as i32
}
#[no_mangle]
pub extern "C" fn rg_mat_size() -> i32 {
    MAT_SIZE as i32
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
