//! fps_wasm — a light Doom-style walk-around compiled to WASM.
//!
//! The guest owns the world and the player physics (`IDEAL.md` §5): it generates
//! a two-room level (perimeter + divider walls with a doorway, pillars, a
//! jump-up platform), runs a **kinematic character controller** (gravity, jump,
//! swept AABB collision vs walls/obstacles/floor), and drives a **first-person
//! camera**. The host only loads textures and renders — no shooting, just
//! movement + physics, which is exactly a Doom player controller (an AABB that
//! slides along walls and stands on boxes, not a rigid-body solver).
//!
//! Blocks it declares (same family as `games/cube3d_wasm`):
//!   MESH 'RGMB' (§18) · MATERIAL 'RGMA' (§17/§18) · CAM 'RGCM' (§19, updated
//!   every frame to the player's eye) · LIGHT 'RGLT' (§20) · COLLIDERS 'RGCO'
//!   (the physics world the guest declares, also read by the host for a map).
//!
//! Input (host → guest): `update(dt_ms, forward, strafe, turn, jump)`, each of
//! forward/strafe/turn ∈ {-1,0,1}, jump ∈ {0,1}. Internal sim is f32; all block
//! values are written as fixed-point (positions `FP`=256, normals/units Q16.16,
//! uv * 4096) so the transport contract matches the proposal.

#![allow(clippy::missing_safety_doc)]

use core::cell::UnsafeCell;

const FP: f32 = 256.0;
const Q16: i32 = 65536;
const UVU: i32 = 4096;

// ------------------------------------------------------------------ block util
struct Blk<const N: usize>(UnsafeCell<[u8; N]>);
unsafe impl<const N: usize> Sync for Blk<N> {}
impl<const N: usize> Blk<N> {
    const fn new() -> Self {
        Blk(UnsafeCell::new([0u8; N]))
    }
    fn base(&self) -> *mut u8 {
        self.0.get() as *mut u8
    }
    fn wi(&self, off: usize, v: i32) {
        unsafe { core::ptr::copy_nonoverlapping(v.to_le_bytes().as_ptr(), self.base().add(off), 4) };
    }
    fn wu(&self, off: usize, v: u32) {
        self.wi(off, v as i32);
    }
    fn wh(&self, off: usize, v: u16) {
        unsafe { core::ptr::copy_nonoverlapping(v.to_le_bytes().as_ptr(), self.base().add(off), 2) };
    }
    fn wb(&self, off: usize, bytes: &[u8]) {
        unsafe { core::ptr::copy_nonoverlapping(bytes.as_ptr(), self.base().add(off), bytes.len()) };
    }
    fn ri(&self, off: usize) -> i32 {
        let mut b = [0u8; 4];
        unsafe { core::ptr::copy_nonoverlapping(self.base().add(off), b.as_mut_ptr(), 4) };
        i32::from_le_bytes(b)
    }
}
fn fx(v: f32) -> i32 {
    (v * FP) as i32
}

// ---------------------------------------------------------------- block sizes
const MAX_V: usize = 2000;
const MAX_I: usize = 3000;
const MAX_S: usize = 600;
const MAX_C: usize = 64;

const MESH_HDR: usize = 64;
const VSZ: usize = 32;
const MESH_IDX0: usize = MESH_HDR + MAX_V * VSZ;
const MESH_SUB0: usize = MESH_IDX0 + MAX_I * 2;
const MESH_SZ: usize = MESH_SUB0 + MAX_S * 12;
static MESH: Blk<MESH_SZ> = Blk::new();
const MESH_MAGIC: u32 = 0x424d_4752;

const MAT_N: usize = 3;
const MAT_SZ: usize = 20 + MAT_N * 16;
static MAT: Blk<MAT_SZ> = Blk::new();
const MAT_MAGIC: u32 = 0x414d_4752;

const CAM_SZ: usize = 72;
static CAM: Blk<CAM_SZ> = Blk::new();
const CAM_MAGIC: u32 = 0x4d43_4752;

const LIT_SZ: usize = 48;
static LIT: Blk<LIT_SZ> = Blk::new();
const LIT_MAGIC: u32 = 0x544c_4752;

// RESOURCE table (§17): declare texture names; host binds handle = index+1.
// No env import, so the module loads on every host (SDL engine + Node tools).
const RES_MAGIC: u32 = 0x5352_4752; // 'RGRS'
const RES_N: usize = 3;
const RES_NAME: usize = 16;
const RES_SZ: usize = 20 + RES_N * RES_NAME;
static RES: Blk<RES_SZ> = Blk::new();

const CO_SZ: usize = 20 + MAX_C * 28;
static CO: Blk<CO_SZ> = Blk::new();
const CO_MAGIC: u32 = 0x4f43_4752; // 'RGCO'

// ------------------------------------------------------------------ sim state
#[derive(Clone, Copy)]
struct Aabb {
    min: [f32; 3],
    max: [f32; 3],
    kind: u32,
}
struct World {
    boxes: [Aabb; MAX_C],
    nbox: usize,
    // build cursors
    nv: usize,
    ni: usize,
    ns: usize,
    // player
    px: f32,
    py: f32,
    pz: f32,
    vx: f32,
    vy: f32,
    vz: f32,
    yaw: f32,
    on_ground: bool,
}
struct WCell(UnsafeCell<World>);
unsafe impl Sync for WCell {}
static W: WCell = WCell(UnsafeCell::new(World {
    boxes: [Aabb { min: [0.0; 3], max: [0.0; 3], kind: 0 }; MAX_C],
    nbox: 0,
    nv: 0,
    ni: 0,
    ns: 0,
    px: -6.0,
    py: 0.9,
    pz: 0.0,
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    yaw: 0.0,
    on_ground: true,
}));
fn world() -> &'static mut World {
    unsafe { &mut *W.0.get() }
}

const P_HX: f32 = 0.3; // player half extents
const P_HY: f32 = 0.9;
const P_HZ: f32 = 0.3;
const EYE_UP: f32 = 0.7; // eye above centre

// ------------------------------------------------------------------ mesh build
fn rgba(r: u8, g: u8, b: u8) -> u32 {
    ((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | 0xff
}
fn put_v(i: usize, p: [f32; 3], n: [i32; 3], uv: (i32, i32)) {
    let o = MESH_HDR + i * VSZ;
    MESH.wi(o, fx(p[0]));
    MESH.wi(o + 4, fx(p[1]));
    MESH.wi(o + 8, fx(p[2]));
    MESH.wi(o + 12, n[0]);
    MESH.wi(o + 16, n[1]);
    MESH.wi(o + 20, n[2]);
    MESH.wu(o + 24, 0xffff_ffff); // white; texture+light supply colour
    MESH.wu(o + 28, ((uv.1 as u32) << 16) | (uv.0 as u32 & 0xffff));
}
/// Add one textured quad (4 CCW corners) as its own sub-mesh with `material`.
fn add_quad(w: &mut World, c: [[f32; 3]; 4], n: [i32; 3], uv: [(i32, i32); 4], material: u32) {
    if w.nv + 4 > MAX_V || w.ni + 6 > MAX_I || w.ns + 1 > MAX_S {
        return;
    }
    let base = w.nv as u16;
    for k in 0..4 {
        put_v(w.nv, c[k], n, uv[k]);
        w.nv += 1;
    }
    let first = w.ni;
    for &k in &[0u16, 1, 2, 0, 2, 3] {
        MESH.wh(MESH_IDX0 + w.ni * 2, base + k);
        w.ni += 1;
    }
    let so = MESH_SUB0 + w.ns * 12;
    MESH.wu(so, first as u32);
    MESH.wu(so + 4, 6);
    MESH.wu(so + 8, material);
    w.ns += 1;
}
fn uvq(uw: f32, uh: f32) -> [(i32, i32); 4] {
    let (a, b) = ((uw * UVU as f32) as i32, (uh * UVU as f32) as i32);
    [(0, 0), (a, 0), (a, b), (0, b)]
}

/// An axis-aligned box: 4 walls (+ optional top), textured with `material`,
/// UVs scaled by TILE so the texture repeats across large surfaces.
fn add_box(w: &mut World, min: [f32; 3], max: [f32; 3], kind: u32, material: u32, top: bool) {
    if w.nbox < MAX_C {
        w.boxes[w.nbox] = Aabb { min, max, kind };
        w.nbox += 1;
    }
    let tile = 2.0;
    let (x0, y0, z0) = (min[0], min[1], min[2]);
    let (x1, y1, z1) = (max[0], max[1], max[2]);
    let dx = (x1 - x0) / tile;
    let dy = (y1 - y0) / tile;
    let dz = (z1 - z0) / tile;
    // +Z / -Z
    add_quad(w, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, Q16], uvq(dx, dy), material);
    add_quad(w, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -Q16], uvq(dx, dy), material);
    // +X / -X
    add_quad(w, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [Q16, 0, 0], uvq(dz, dy), material);
    add_quad(w, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-Q16, 0, 0], uvq(dz, dy), material);
    if top {
        add_quad(w, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, Q16, 0], uvq(dx, dz), material);
    }
}

const MAT_FLOOR: u32 = 0;
const MAT_WALL: u32 = 1;
const MAT_CRATE: u32 = 2;
const K_WALL: u32 = 1;
const K_OBST: u32 = 2;
const K_PLAT: u32 = 3;

fn build_level(w: &mut World) {
    // Floor quad spanning the whole level (render only; y=0 plane is the ground).
    let fx0 = -10.5;
    let fx1 = 10.5;
    let fz0 = -7.5;
    let fz1 = 7.5;
    let fu = ((fx1 - fx0) / 2.0 * UVU as f32) as i32;
    let fv = ((fz1 - fz0) / 2.0 * UVU as f32) as i32;
    add_quad(
        w,
        [[fx0, 0.0, fz1], [fx1, 0.0, fz1], [fx1, 0.0, fz0], [fx0, 0.0, fz0]],
        [0, Q16, 0],
        [(0, 0), (fu, 0), (fu, fv), (0, fv)],
        MAT_FLOOR,
    );
    // Perimeter walls (thickness 0.5, height 3), room x∈[-10,10] z∈[-7,7].
    let h = 3.0;
    let t = 0.5;
    add_box(w, [-10.0, 0.0, -7.0 - t], [10.0, h, -7.0], K_WALL, MAT_WALL, false); // south
    add_box(w, [-10.0, 0.0, 7.0], [10.0, h, 7.0 + t], K_WALL, MAT_WALL, false); // north
    add_box(w, [-10.0 - t, 0.0, -7.0], [-10.0, h, 7.0], K_WALL, MAT_WALL, false); // west
    add_box(w, [10.0, 0.0, -7.0], [10.0 + t, h, 7.0], K_WALL, MAT_WALL, false); // east
    // Divider wall at x=0 with a doorway gap at z∈[-1.5,1.5].
    add_box(w, [-t / 2.0, 0.0, -7.0], [t / 2.0, h, -1.5], K_WALL, MAT_WALL, false);
    add_box(w, [-t / 2.0, 0.0, 1.5], [t / 2.0, h, 7.0], K_WALL, MAT_WALL, false);
    // Left room obstacles: two crate pillars.
    add_box(w, [-6.5, 0.0, -3.5], [-5.5, 2.0, -2.5], K_OBST, MAT_CRATE, true);
    add_box(w, [-4.5, 0.0, 2.5], [-3.5, 2.0, 3.5], K_OBST, MAT_CRATE, true);
    // Right room: a low platform to jump onto + a pillar.
    add_box(w, [3.0, 0.0, -2.0], [7.0, 1.0, 2.0], K_PLAT, MAT_CRATE, true);
    add_box(w, [7.5, 0.0, -5.0], [8.5, 2.0, -4.0], K_OBST, MAT_CRATE, true);
    // publish colliders block for the host map
    CO.wu(0, CO_MAGIC);
    CO.wi(4, 1);
    CO.wi(8, CO_SZ as i32);
    CO.wi(12, 0);
    CO.wu(16, w.nbox as u32);
    for i in 0..w.nbox {
        let b = w.boxes[i];
        let o = 20 + i * 28;
        CO.wi(o, fx(b.min[0]));
        CO.wi(o + 4, fx(b.min[1]));
        CO.wi(o + 8, fx(b.min[2]));
        CO.wi(o + 12, fx(b.max[0]));
        CO.wi(o + 16, fx(b.max[1]));
        CO.wi(o + 20, fx(b.max[2]));
        CO.wu(o + 24, b.kind);
    }
}

// ------------------------------------------------------------------ physics
fn overlap(cx: f32, cy: f32, cz: f32, b: &Aabb) -> bool {
    cx - P_HX < b.max[0] && cx + P_HX > b.min[0]
        && cy - P_HY < b.max[1] && cy + P_HY > b.min[1]
        && cz - P_HZ < b.max[2] && cz + P_HZ > b.min[2]
}
fn resolve_axis(w: &mut World, axis: usize) {
    for i in 0..w.nbox {
        let b = w.boxes[i];
        if !overlap(w.px, w.py, w.pz, &b) {
            continue;
        }
        let (c, hh, bmin, bmax) = match axis {
            0 => (w.px, P_HX, b.min[0], b.max[0]),
            1 => (w.py, P_HY, b.min[1], b.max[1]),
            _ => (w.pz, P_HZ, b.min[2], b.max[2]),
        };
        let bc = (bmin + bmax) * 0.5;
        let bh = (bmax - bmin) * 0.5;
        let pen = (hh + bh) - (c - bc).abs();
        if pen <= 0.0 {
            continue;
        }
        let dir = if c >= bc { 1.0 } else { -1.0 };
        match axis {
            0 => {
                w.px += dir * pen;
                w.vx = 0.0;
            }
            1 => {
                w.py += dir * pen;
                if dir > 0.0 {
                    w.on_ground = true;
                }
                w.vy = 0.0;
            }
            _ => {
                w.pz += dir * pen;
                w.vz = 0.0;
            }
        }
    }
}

#[no_mangle]
pub extern "C" fn init() {
    // RESOURCE table: name the textures; host loads <assets>/<name>.ppm and
    // binds handle = index+1. floor=1, brick=2, crate=3.
    RES.wu(0, RES_MAGIC);
    RES.wi(4, 1);
    RES.wi(8, RES_SZ as i32);
    RES.wi(12, 0);
    RES.wu(16, RES_N as u32);
    RES.wb(20, b"floor");
    RES.wb(20 + RES_NAME, b"brick");
    RES.wb(20 + 2 * RES_NAME, b"crate");

    // MATERIAL table (tex handles: floor=1, brick=2, crate=3)
    MAT.wu(0, MAT_MAGIC);
    MAT.wi(4, 1);
    MAT.wi(8, MAT_SZ as i32);
    MAT.wi(12, 0);
    MAT.wu(16, MAT_N as u32);
    let set = |i: usize, tex: u32| {
        let o = 20 + i * 16;
        MAT.wu(o, tex);
        MAT.wu(o + 4, rgba(255, 255, 255));
        MAT.wu(o + 8, 0);
        MAT.wu(o + 12, 0);
    };
    set(MAT_FLOOR as usize, 1);
    set(MAT_WALL as usize, 2);
    set(MAT_CRATE as usize, 3);

    let w = world();
    w.nv = 0;
    w.ni = 0;
    w.ns = 0;
    w.nbox = 0;
    build_level(w);

    // MESH header (model transform identity; the camera moves, not the world)
    MESH.wu(0, MESH_MAGIC);
    MESH.wi(4, 1);
    MESH.wi(8, MESH_SZ as i32);
    MESH.wi(12, 0);
    MESH.wu(16, w.nv as u32);
    MESH.wu(20, w.ni as u32);
    MESH.wu(24, w.ns as u32);
    // Pool byte-offsets from the mesh base. The vertex pool is packed at 64,
    // but the index and sub-mesh pools sit after the *fixed-capacity* vertex
    // pool, so publish their offsets rather than let the host guess from counts.
    MESH.wu(52, MESH_IDX0 as u32);
    MESH.wu(56, MESH_SUB0 as u32);
    // model transform (rot 28.., pos 40..) left identity/zero

    // CAM: perspective; eye/target filled per frame by update().
    CAM.wu(0, CAM_MAGIC);
    CAM.wi(4, 1);
    CAM.wi(8, CAM_SZ as i32);
    CAM.wi(12, 0);
    CAM.wu(16, 2); // PERSPECTIVE
    CAM.wi(44, 0);
    CAM.wi(48, Q16); // up +Y
    CAM.wi(52, 0);
    CAM.wi(56, (1.309 * FP) as i32); // fov ~75deg (Doom-ish wide)
    CAM.wi(60, (0.1 * FP) as i32);
    CAM.wi(64, (100.0 * FP) as i32);
    write_camera(w);

    // LIGHT: strong ambient (indoors) + soft overhead sun for shape.
    LIT.wu(0, LIT_MAGIC);
    LIT.wi(4, 1);
    LIT.wi(8, LIT_SZ as i32);
    LIT.wi(12, 0);
    LIT.wu(16, rgba(180, 185, 200));
    LIT.wi(20, (0.55 * FP) as i32); // ambient 0.55
    LIT.wi(24, (Q16 as f32 * 0.25) as i32); // sun dir ~ from above, slightly angled
    LIT.wi(28, (Q16 as f32 * 0.93) as i32);
    LIT.wi(32, (Q16 as f32 * 0.26) as i32);
    LIT.wu(36, rgba(255, 246, 220));
    LIT.wi(40, (0.6 * FP) as i32);
}

fn write_camera(w: &World) {
    let dir = (w.yaw.sin(), 0.0f32, w.yaw.cos());
    let eye = (w.px, w.py + EYE_UP, w.pz);
    CAM.wi(20, fx(eye.0));
    CAM.wi(24, fx(eye.1));
    CAM.wi(28, fx(eye.2));
    CAM.wi(32, fx(eye.0 + dir.0));
    CAM.wi(36, fx(eye.1 + dir.1));
    CAM.wi(40, fx(eye.2 + dir.2));
    CAM.wi(12, CAM.ri(12) + 1);
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, forward: i32, strafe: i32, turn: i32, jump: i32) {
    let w = world();
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    // turn
    w.yaw += (turn as f32) * 2.2 * dt;
    // horizontal move relative to facing
    let (s, c) = (w.yaw.sin(), w.yaw.cos());
    let fwd = forward as f32;
    let stf = strafe as f32;
    let speed = 4.0;
    let mut mvx = (s * fwd + c * stf) * speed;
    let mut mvz = (c * fwd - s * stf) * speed;
    // normalise diagonal
    let m = (mvx * mvx + mvz * mvz).sqrt();
    if m > speed {
        mvx *= speed / m;
        mvz *= speed / m;
    }
    w.vx = mvx;
    w.vz = mvz;
    // jump + gravity
    if jump != 0 && w.on_ground {
        w.vy = 7.0;
        w.on_ground = false;
    }
    w.vy -= 20.0 * dt;
    w.on_ground = false;

    // integrate + resolve per axis (swept enough for slow character speeds)
    w.px += w.vx * dt;
    resolve_axis(w, 0);
    w.pz += w.vz * dt;
    resolve_axis(w, 2);
    w.py += w.vy * dt;
    resolve_axis(w, 1);
    // ground plane at y=0 (feet)
    if w.py - P_HY < 0.0 {
        w.py = P_HY;
        w.vy = 0.0;
        w.on_ground = true;
    }
    write_camera(w);
}

// player state export (host reads for the top-down map/path)
#[no_mangle]
pub extern "C" fn player_x() -> i32 {
    fx(world().px)
}
#[no_mangle]
pub extern "C" fn player_z() -> i32 {
    fx(world().pz)
}
#[no_mangle]
pub extern "C" fn player_y() -> i32 {
    fx(world().py)
}
#[no_mangle]
pub extern "C" fn player_on_ground() -> i32 {
    world().on_ground as i32
}

macro_rules! ptr_size {
    ($p:ident, $s:ident, $blk:ident, $sz:ident) => {
        #[no_mangle]
        pub extern "C" fn $p() -> i32 {
            $blk.base() as i32
        }
        #[no_mangle]
        pub extern "C" fn $s() -> i32 {
            $sz as i32
        }
    };
}
ptr_size!(rg_mesh_ptr, rg_mesh_size, MESH, MESH_SZ);
ptr_size!(rg_mat_ptr, rg_mat_size, MAT, MAT_SZ);
ptr_size!(rg_res_ptr, rg_res_size, RES, RES_SZ);
ptr_size!(rg_cam_ptr, rg_cam_size, CAM, CAM_SZ);
ptr_size!(rg_lit_ptr, rg_lit_size, LIT, LIT_SZ);
ptr_size!(rg_col_ptr, rg_col_size, CO, CO_SZ);
