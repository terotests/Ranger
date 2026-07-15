//! fps_wasm — a Doom-style walk-around using the shared 3D scene API.
//!
//! The guest owns the level, player physics, and first-person camera.  The
//! `ranger_game::scene` crate owns the RGMB/RGMA/RGCM/RGLT serialization; this
//! game only declares meshes, materials, entities, and the camera.

#![allow(clippy::missing_safety_doc)]

use core::cell::UnsafeCell;
use ranger_game::scene::{Color, MaterialId, MeshAsset, Scene, Vec3};

const FP: f32 = 256.0;
const MAX_C: usize = 64;
const FLOOR_TEXTURE: &str = "floor";
const BRICK_TEXTURE: &str = "brick";
const CRATE_TEXTURE: &str = "crate";
// Keep the floor tiling inside the packed UV range supported by the scene ABI.
const FLOOR_UV_REPEAT_U: f32 = 4.0;
const FLOOR_UV_REPEAT_V: f32 = 3.0;

struct Blk<const N: usize>(UnsafeCell<[u8; N]>);
unsafe impl<const N: usize> Sync for Blk<N> {}
impl<const N: usize> Blk<N> {
    const fn new() -> Self {
        Self(UnsafeCell::new([0; N]))
    }
    fn base(&self) -> *mut u8 {
        self.0.get() as *mut u8
    }
    fn wi(&self, off: usize, v: i32) {
        unsafe {
            core::ptr::copy_nonoverlapping(v.to_le_bytes().as_ptr(), self.base().add(off), 4)
        };
    }
    fn wu(&self, off: usize, v: u32) {
        self.wi(off, v as i32);
    }
}

const CO_SZ: usize = 20 + MAX_C * 28;
static CO: Blk<CO_SZ> = Blk::new();
const CO_MAGIC: u32 = 0x4f43_4752;

#[derive(Clone, Copy)]
struct Aabb {
    min: [f32; 3],
    max: [f32; 3],
    kind: u32,
}
struct World {
    boxes: [Aabb; MAX_C],
    nbox: usize,
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
    boxes: [Aabb {
        min: [0.0; 3],
        max: [0.0; 3],
        kind: 0,
    }; MAX_C],
    nbox: 0,
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

struct SCell(UnsafeCell<Scene>);
unsafe impl Sync for SCell {}
static S: SCell = SCell(UnsafeCell::new(Scene::new()));
fn scene() -> &'static mut Scene {
    unsafe { &mut *S.0.get() }
}

const P_HX: f32 = 0.3;
const P_HY: f32 = 0.9;
const P_HZ: f32 = 0.3;
const EYE_UP: f32 = 0.7;
const K_WALL: u32 = 1;
const K_OBST: u32 = 2;
const K_PLAT: u32 = 3;

fn fx(v: f32) -> i32 {
    (v * FP) as i32
}

fn add_collider(w: &mut World, min: [f32; 3], max: [f32; 3], kind: u32) {
    if w.nbox < MAX_C {
        w.boxes[w.nbox] = Aabb { min, max, kind };
        w.nbox += 1;
    }
}

fn spawn_box(s: &mut Scene, mesh: MeshAsset, material: MaterialId, min: [f32; 3], max: [f32; 3]) {
    if let Some(entity) = s.spawn_mesh(mesh, material) {
        s.node(entity).set_position(Vec3::new(
            (min[0] + max[0]) * 0.5,
            (min[1] + max[1]) * 0.5,
            (min[2] + max[2]) * 0.5,
        ));
        s.node(entity)
            .set_scale(Vec3::new(max[0] - min[0], max[1] - min[1], max[2] - min[2]));
    }
}

fn level_box(
    w: &mut World,
    s: &mut Scene,
    mesh: MeshAsset,
    material: MaterialId,
    min: [f32; 3],
    max: [f32; 3],
    kind: u32,
) {
    add_collider(w, min, max, kind);
    spawn_box(s, mesh, material, min, max);
}

fn build_level(w: &mut World, s: &mut Scene) {
    let floor_tex = s.resource(FLOOR_TEXTURE).unwrap();
    let brick_tex = s.resource(BRICK_TEXTURE).unwrap();
    let crate_tex = s.resource(CRATE_TEXTURE).unwrap();
    let (floor_mesh, unit_mesh, floor_mat, wall_mat, crate_mat) = {
        let mut assets = s.assets();
        (
            assets
                .box_mesh_uv(
                    Vec3::new(1.0, 0.05, 1.0),
                    [FLOOR_UV_REPEAT_U, FLOOR_UV_REPEAT_V],
                )
                .unwrap(),
            assets.box_mesh(Vec3::new(1.0, 1.0, 1.0)).unwrap(),
            assets.material(floor_tex, Color::WHITE, 0),
            assets.material(brick_tex, Color::WHITE, 0),
            assets.material(crate_tex, Color::WHITE, 0),
        )
    };
    s.spawn_ambient_light(Color::rgb(180, 185, 200), 0.55);

    spawn_box(
        s,
        floor_mesh,
        floor_mat,
        [-10.5, -0.025, -7.5],
        [10.5, 0.025, 7.5],
    );
    let h = 3.0;
    let t = 0.5;
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [-10.0, 0.0, -7.0 - t],
        [10.0, h, -7.0],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [-10.0, 0.0, 7.0],
        [10.0, h, 7.0 + t],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [-10.0 - t, 0.0, -7.0],
        [-10.0, h, 7.0],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [10.0, 0.0, -7.0],
        [10.0 + t, h, 7.0],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [-t / 2.0, 0.0, -7.0],
        [t / 2.0, h, -1.5],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        wall_mat,
        [-t / 2.0, 0.0, 1.5],
        [t / 2.0, h, 7.0],
        K_WALL,
    );
    level_box(
        w,
        s,
        unit_mesh,
        crate_mat,
        [-6.5, 0.0, -3.5],
        [-5.5, 2.0, -2.5],
        K_OBST,
    );
    level_box(
        w,
        s,
        unit_mesh,
        crate_mat,
        [-4.5, 0.0, 2.5],
        [-3.5, 2.0, 3.5],
        K_OBST,
    );
    level_box(
        w,
        s,
        unit_mesh,
        crate_mat,
        [3.0, 0.0, -2.0],
        [7.0, 1.0, 2.0],
        K_PLAT,
    );
    level_box(
        w,
        s,
        unit_mesh,
        crate_mat,
        [7.5, 0.0, -5.0],
        [8.5, 2.0, -4.0],
        K_OBST,
    );

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

fn write_camera(w: &World, s: &mut Scene) {
    let dir = (w.yaw.sin(), 0.0f32, w.yaw.cos());
    let eye = Vec3::new(w.px, w.py + EYE_UP, w.pz);
    let camera = s.camera_mut();
    camera.eye = eye;
    camera.target = Vec3::new(eye.x + dir.0, eye.y, eye.z + dir.2);
    camera.fovy = 1.309;
    camera.near = 0.1;
    camera.far = 100.0;
}

#[no_mangle]
pub extern "C" fn init() {
    let w = world();
    let s = scene();
    build_level(w, s);
    write_camera(w, s);
    assert!(s.publish());
}

fn overlap(cx: f32, cy: f32, cz: f32, b: &Aabb) -> bool {
    cx - P_HX < b.max[0]
        && cx + P_HX > b.min[0]
        && cy - P_HY < b.max[1]
        && cy + P_HY > b.min[1]
        && cz - P_HZ < b.max[2]
        && cz + P_HZ > b.min[2]
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
pub extern "C" fn update(dt_ms: i32, forward: i32, strafe: i32, turn: i32, jump: i32) {
    let w = world();
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    w.yaw += turn as f32 * 2.2 * dt;
    let (s, c) = (w.yaw.sin(), w.yaw.cos());
    let speed = 4.0;
    let mut mvx = (s * forward as f32 + c * strafe as f32) * speed;
    let mut mvz = (c * forward as f32 - s * strafe as f32) * speed;
    let m = (mvx * mvx + mvz * mvz).sqrt();
    if m > speed {
        mvx *= speed / m;
        mvz *= speed / m;
    }
    w.vx = mvx;
    w.vz = mvz;
    if jump != 0 && w.on_ground {
        w.vy = 7.0;
        w.on_ground = false;
    }
    w.vy -= 20.0 * dt;
    w.on_ground = false;
    w.px += w.vx * dt;
    resolve_axis(w, 0);
    w.pz += w.vz * dt;
    resolve_axis(w, 2);
    w.py += w.vy * dt;
    resolve_axis(w, 1);
    if w.py - P_HY < 0.0 {
        w.py = P_HY;
        w.vy = 0.0;
        w.on_ground = true;
    }
    let s = scene();
    write_camera(w, s);
    assert!(s.publish());
}

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

ranger_game::scene_exports!();

#[no_mangle]
pub extern "C" fn rg_col_ptr() -> i32 {
    CO.base() as i32
}
#[no_mangle]
pub extern "C" fn rg_col_size() -> i32 {
    CO_SZ as i32
}
