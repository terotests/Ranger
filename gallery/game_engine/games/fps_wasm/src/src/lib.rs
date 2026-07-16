//! fps_wasm — a light Doom-style walk-around, on the **host-managed 3D scene**
//! (IDEAL_3D Phase H.5). The guest still owns the world layout and all player
//! physics (`IDEAL.md` §5, §8): it generates a two-room level, runs a kinematic
//! character controller (gravity, jump, swept AABB collision vs walls/obstacles/
//! floor), and computes the first-person eye each frame. What changed vs the
//! block model: the guest no longer builds meshes or exports MESH/CAM/LIGHT
//! blocks. Instead `init()` issues host commands — `rg_create_box` per wall/
//! obstacle/floor slab, `rg_create_camera`, `rg_create_light` — and holds only
//! opaque `EntityId`s. `update()` drives the camera and the player's lamp with
//! `rg_set_position`/`rg_set_target`. The host owns the scene and renders it.
//!
//! Input (host → guest): `update(dt_ms, forward, strafe, turn, jump)`, each of
//! forward/strafe/turn ∈ {-1,0,1}, jump ∈ {0,1}.

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

// All the host plumbing (the `rg_*` scene commands, fixed-point conversion,
// opaque handles) lives once in `ranger_game::scene`; this guest just describes
// the scene it wants and keeps the physics/level layout that make it a game.
use core::cell::UnsafeCell;
use ranger_game::scene::{Camera, Color, Light, Scene, Texture, Vec3};

// ------------------------------------------------------------------ sim state
const MAX_C: usize = 64;

#[derive(Clone, Copy)]
struct Aabb {
    min: [f32; 3],
    max: [f32; 3],
    #[allow(dead_code)] // collider class (wall/obstacle/platform); reserved for surface-specific behaviour
    kind: u32,
}
struct World {
    boxes: [Aabb; MAX_C],
    nbox: usize,
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

// entity handles (host-owned)
static mut CAM: Camera = Camera::NONE;
static mut LAMP: Light = Light::NONE;

const P_HX: f32 = 0.3; // player half extents
const P_HY: f32 = 0.9;
const P_HZ: f32 = 0.3;
const EYE_UP: f32 = 0.7; // eye above centre

const K_WALL: u32 = 1;
const K_OBST: u32 = 2;
const K_PLAT: u32 = 3;

// ------------------------------------------------------------------ level build
/// Register one axis-aligned box: a host render entity at world coords + a
/// collider for the guest-side physics. (Boxes are baked at absolute position,
/// so the host entity transform stays identity — no per-box set_position.)
fn add_box(w: &mut World, min: [f32; 3], max: [f32; 3], kind: u32, tex: Texture) {
    if w.nbox < MAX_C {
        w.boxes[w.nbox] = Aabb { min, max, kind };
        w.nbox += 1;
    }
    Scene::new().spawn_box(
        Vec3::new(min[0], min[1], min[2]),
        Vec3::new(max[0], max[1], max[2]),
        tex,
    );
}

fn build_level(w: &mut World, tex_floor: Texture, tex_wall: Texture, tex_crate: Texture) {
    // Floor as a thin slab just below y=0 (top face is the ground plane).
    add_box(w, [-10.5, -0.1, -7.5], [10.5, 0.0, 7.5], 0, tex_floor);
    // Perimeter walls (thickness 0.5, height 3), room x∈[-10,10] z∈[-7,7].
    let h = 3.0;
    let t = 0.5;
    add_box(w, [-10.0, 0.0, -7.0 - t], [10.0, h, -7.0], K_WALL, tex_wall); // south
    add_box(w, [-10.0, 0.0, 7.0], [10.0, h, 7.0 + t], K_WALL, tex_wall); // north
    add_box(w, [-10.0 - t, 0.0, -7.0], [-10.0, h, 7.0], K_WALL, tex_wall); // west
    add_box(w, [10.0, 0.0, -7.0], [10.0 + t, h, 7.0], K_WALL, tex_wall); // east
    // Divider wall at x=0 with a doorway gap at z∈[-1.5,1.5].
    add_box(w, [-t / 2.0, 0.0, -7.0], [t / 2.0, h, -1.5], K_WALL, tex_wall);
    add_box(w, [-t / 2.0, 0.0, 1.5], [t / 2.0, h, 7.0], K_WALL, tex_wall);
    // Left room obstacles: two crate pillars.
    add_box(w, [-6.5, 0.0, -3.5], [-5.5, 2.0, -2.5], K_OBST, tex_crate);
    add_box(w, [-4.5, 0.0, 2.5], [-3.5, 2.0, 3.5], K_OBST, tex_crate);
    // Right room: a low platform to jump onto + a pillar.
    add_box(w, [3.0, 0.0, -2.0], [7.0, 1.0, 2.0], K_PLAT, tex_crate);
    add_box(w, [7.5, 0.0, -5.0], [8.5, 2.0, -4.0], K_OBST, tex_crate);
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

fn eye(w: &World) -> (f32, f32, f32) {
    (w.px, w.py + EYE_UP, w.pz)
}

fn write_camera(w: &World) {
    let (ex, ey, ez) = eye(w);
    let (s, c) = (w.yaw.sin(), w.yaw.cos());
    let eye_pos = Vec3::new(ex, ey, ez);
    unsafe {
        CAM.position(eye_pos).target(Vec3::new(ex + s, ey, ez + c));
        // player lamp rides at the eye
        LAMP.position(eye_pos);
    }
}

#[no_mangle]
pub extern "C" fn init() {
    let scene = Scene::new();
    let tex_floor = scene.texture("floor");
    let tex_wall = scene.texture("brick");
    let tex_crate = scene.texture("crate");

    let w = world();
    w.nbox = 0;
    build_level(w, tex_floor, tex_wall, tex_crate);

    // perspective camera (~75° wide, Doom-ish); eye/target set per frame
    let cam = scene.camera(1.309, 0.1, 100.0).activate();

    // strong ambient (indoors) + soft overhead sun for shape
    scene.ambient_light(Color::rgb(180, 185, 200), 0.55);
    scene.directional_light(Color::rgb(255, 246, 220), 0.6, Vec3::new(0.25, 0.93, 0.26));

    // static point lights — one warm lamp in each room
    scene.point_light(Color::rgb(255, 210, 150), 0.8, Vec3::new(-6.0, 2.6, 0.0), 9.0);
    scene.point_light(Color::rgb(180, 210, 255), 0.8, Vec3::new(6.0, 2.6, 0.0), 9.0);

    // player lamp: a point light that rides the eye (set each frame)
    let lamp = scene.point_light(Color::rgb(255, 240, 210), 0.9, Vec3::ZERO, 6.0);

    unsafe {
        CAM = cam;
        LAMP = lamp;
    }
    write_camera(w);
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
