//! pyramid_wasm — "Faaraon pyramidi", a gentle 3D climber for kids on the
//! host-managed scene (IDEAL_3D Phase H). A Donkey-Kong-in-3D: climb a stepped
//! sandstone pyramid ring by ring to the golden summit. Jump up each terrace,
//! or take the stairs on the east face for an easier route. Mummy monsters
//! patrol every side of the terraces, and boulders are hurled off the summit to
//! bounce down the steps — dodge them. Grab a diamond for a few seconds of
//! invincibility and you can bump monsters aside. Reach the top to win.
//!
//! Ownership: the guest owns the world and all player/monster/hazard physics (a
//! kinematic AABB character controller with auto-step). The host owns the scene
//! and renders it — the guest only issues `rg_create_*` at init and
//! `rg_set_position`/`rotation`/`scale`/`visible` per frame, holding opaque
//! `EntityId`s. Static geometry is baked at world coords (identity transform);
//! movable actors are created centred at the origin and moved each frame.
//!
//! Input (host → guest): `update(dt_ms, forward, strafe, turn, jump)`,
//! forward/strafe/turn ∈ {-1,0,1}, jump ∈ {0,1}.

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

use core::cell::UnsafeCell;

const FP: f32 = 256.0;

// Host imports (runtime/rg_wasm_bridge.c; IDEAL_3D §4.4).
extern "C" {
    fn rg_load_texture(name_ptr: *const u8, name_len: u32) -> i32;
    fn rg_load_model(name_ptr: *const u8, name_len: u32) -> i32;
    fn rg_load_sprite(name_ptr: *const u8, name_len: u32) -> i32;
    fn rg_create_box(x0: i32, y0: i32, z0: i32, x1: i32, y1: i32, z1: i32, tex: i32) -> i32;
    fn rg_create_mesh_entity(mesh: i32, tex: i32) -> i32;
    fn rg_create_sprite(tex: i32, cols: i32, rows: i32, w: i32, h: i32) -> i32;
    fn rg_set_sprite_cell(e: i32, col: i32, row: i32);
    fn rg_create_camera(fovy: i32, near: i32, far: i32) -> i32;
    fn rg_create_light(kind: i32, color: i32, intensity: i32) -> i32;
    fn rg_set_position(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_target(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_rotation(e: i32, qx: i32, qy: i32, qz: i32, qw: i32);
    fn rg_set_scale(e: i32, sx: i32, sy: i32, sz: i32);
    fn rg_set_range(e: i32, r: i32);
    fn rg_set_visible(e: i32, on: i32);
    fn rg_set_active_camera(e: i32);
}

const LIGHT_AMBIENT: i32 = 3;
const LIGHT_DIRECTIONAL: i32 = 4;
const LIGHT_POINT: i32 = 5;

fn fx(v: f32) -> i32 {
    (v * FP) as i32
}
fn q16(v: f32) -> i32 {
    (v * 65536.0) as i32
}
fn rgba(r: u8, g: u8, b: u8) -> i32 {
    (((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | 0xff) as i32
}

// ---- host actor helpers ----------------------------------------------------
fn create_static_box(min: [f32; 3], max: [f32; 3], tex: i32) -> i32 {
    unsafe {
        rg_create_box(
            fx(min[0]), fx(min[1]), fx(min[2]),
            fx(max[0]), fx(max[1]), fx(max[2]),
            tex,
        )
    }
}
fn create_actor(half: [f32; 3], tex: i32) -> i32 {
    unsafe {
        rg_create_box(
            fx(-half[0]), fx(-half[1]), fx(-half[2]),
            fx(half[0]), fx(half[1]), fx(half[2]),
            tex,
        )
    }
}
/// Y-axis rotation quaternion by angle a → rg_set_rotation.
fn set_yaw(e: i32, a: f32) {
    let (s, c) = (a * 0.5).sin_cos();
    unsafe { rg_set_rotation(e, 0, q16(s), 0, q16(c)) };
}
/// Tumble quaternion about a diagonal axis by angle a (for rolling boulders).
fn set_tumble(e: i32, a: f32) {
    let inv = 0.577_35_f32; // 1/sqrt(3)
    let (s, c) = (a * 0.5).sin_cos();
    unsafe { rg_set_rotation(e, q16(s * inv), q16(s * inv), q16(s * inv), q16(c)) };
}
fn set_scale_uniform(e: i32, s: f32) {
    unsafe { rg_set_scale(e, fx(s), fx(s), fx(s)) };
}

// ---- level geometry --------------------------------------------------------
const LEVELS: usize = 10; // a tall pyramid
const BASE: f32 = 12.0; // half-size of the bottom slab
const INSET: f32 = 1.15; // per-side shrink per level (top half = 12 - 9*1.15 = 1.65)
const STEP: f32 = 0.9; // terrace height (needs a jump); summit at LEVELS*STEP = 9
const STAIR_H: f32 = 0.44; // half-height helper step on the east face (auto-step)

fn slab_half(i: usize) -> f32 {
    BASE - i as f32 * INSET
}
fn slab_y0(i: usize) -> f32 {
    i as f32 * STEP
}
fn summit_y() -> f32 {
    LEVELS as f32 * STEP // top of the highest slab
}
/// Height of the pyramid surface at (x,z): the top of the smallest slab that
/// still covers this footprint radius, or the sand (0) beyond the base.
fn floor_height(x: f32, z: f32) -> f32 {
    let r = x.abs().max(z.abs());
    let mut top = 0.0;
    for i in 0..LEVELS {
        if r <= slab_half(i) {
            top = slab_y0(i) + STEP;
        }
    }
    top
}

// ---- colliders + sim state -------------------------------------------------
const MAX_C: usize = 64;
#[derive(Clone, Copy)]
struct Aabb {
    min: [f32; 3],
    max: [f32; 3],
}

const MAX_MON: usize = 12;
#[derive(Clone, Copy)]
struct Monster {
    ent: i32,
    r: f32,  // ring radius (Chebyshev: max(|x|,|z|)); walks the square perimeter
    y: f32,
    s: f32,  // perimeter position in [0, 8r)
    speed: f32,
    respawn: f32, // >0 = knocked out, counting down to reappear
}

// Position + facing on a square ring of half-size r at perimeter distance s.
// Returns (x, z, facing_x, facing_z). The 4 edges are each length 2r.
fn ring_pos(r: f32, s: f32) -> (f32, f32, f32, f32) {
    let per = 8.0 * r;
    let mut u = s % per;
    if u < 0.0 {
        u += per;
    }
    let side = 2.0 * r;
    if u < side {
        (-r + u, r, 1.0, 0.0) // top edge (+x)
    } else if u < 2.0 * side {
        (r, r - (u - side), 0.0, -1.0) // right edge (-z)
    } else if u < 3.0 * side {
        (r - (u - 2.0 * side), -r, -1.0, 0.0) // bottom edge (-x)
    } else {
        (-r, -r + (u - 3.0 * side), 0.0, 1.0) // left edge (+z)
    }
}

const MAX_GEM: usize = 5;
#[derive(Clone, Copy)]
struct Gem {
    ent: i32,
    x: f32,
    y: f32,
    z: f32,
    taken: bool,
}

const MAX_BALL: usize = 8;
const BALL_R: f32 = 0.35;
#[derive(Clone, Copy)]
struct Ball {
    ent: i32,
    x: f32,
    y: f32,
    z: f32,
    vx: f32,
    vy: f32,
    vz: f32,
    spin: f32,
    life: f32,
    active: bool,
}

// game modes
const MODE_PLAY: i32 = 0;
const MODE_WON: i32 = 2;

struct World {
    boxes: [Aabb; MAX_C],
    nbox: usize,
    mons: [Monster; MAX_MON],
    nmon: usize,
    gems: [Gem; MAX_GEM],
    ngem: usize,
    balls: [Ball; MAX_BALL],
    // player
    px: f32,
    py: f32,
    pz: f32,
    vx: f32,
    vy: f32,
    vz: f32,
    yaw: f32,
    on_ground: bool,
    // game
    invinc: f32,
    lives: i32,
    mode: i32,
    knock_t: f32, // >0 = knocked back; input ignored while it counts down
    ball_timer: f32,
    rng: u32,
    t: f32,
    player_ent: i32,
    cam: i32,
    lamp: i32,
    cam_x: f32,
    cam_y: f32,
    cam_z: f32,
    mummy: i32, // mummy sprite sheet tex (0 = box fallback)
    hero: i32,  // player sprite sheet tex (0 = box fallback)
}

struct WCell(UnsafeCell<World>);
unsafe impl Sync for WCell {}
const ZERO_AABB: Aabb = Aabb { min: [0.0; 3], max: [0.0; 3] };
const ZERO_MON: Monster = Monster { ent: 0, r: 0.0, y: 0.0, s: 0.0, speed: 0.0, respawn: 0.0 };
const ZERO_GEM: Gem = Gem { ent: 0, x: 0.0, y: 0.0, z: 0.0, taken: false };
const ZERO_BALL: Ball = Ball {
    ent: 0, x: 0.0, y: 0.0, z: 0.0, vx: 0.0, vy: 0.0, vz: 0.0, spin: 0.0, life: 0.0, active: false,
};

const SPAWN: [f32; 3] = [0.0, 0.6, BASE + 3.0];
const SPAWN_YAW: f32 = core::f32::consts::PI;
const START_LIVES: i32 = 5;

static W: WCell = WCell(UnsafeCell::new(World {
    boxes: [ZERO_AABB; MAX_C],
    nbox: 0,
    mons: [ZERO_MON; MAX_MON],
    nmon: 0,
    gems: [ZERO_GEM; MAX_GEM],
    ngem: 0,
    balls: [ZERO_BALL; MAX_BALL],
    px: SPAWN[0],
    py: SPAWN[1],
    pz: SPAWN[2],
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    yaw: SPAWN_YAW,
    on_ground: true,
    invinc: 0.0,
    lives: START_LIVES,
    mode: MODE_PLAY,
    knock_t: 0.0,
    ball_timer: 0.0,
    rng: 0x1234_5678,
    t: 0.0,
    player_ent: 0,
    cam: 0,
    lamp: 0,
    cam_x: 0.0,
    cam_y: 0.0,
    cam_z: 0.0,
    mummy: 0,
    hero: 0,
}));
fn world() -> &'static mut World {
    unsafe { &mut *W.0.get() }
}

fn rng_f(w: &mut World) -> f32 {
    // small LCG; deterministic (no Math.random in the guest sandbox)
    w.rng = w.rng.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    ((w.rng >> 8) & 0xff_ffff) as f32 / 16_777_216.0
}

const P_HX: f32 = 0.3;
const P_HY: f32 = 0.6;
const P_HZ: f32 = 0.3;
const STEP_UP: f32 = 0.55;
const GRAV: f32 = 16.0;
const JUMP_V: f32 = 6.2;
const MOVE_SPD: f32 = 4.2;
const TURN_SPD: f32 = 2.4;
const INVINC_TIME: f32 = 6.0;
const BALL_SPAWN_INT: f32 = 2.2;
const BALL_REST: f32 = 0.6;
const KNOCK_TIME: f32 = 0.7; // input-locked window after a hit

fn add_collider(w: &mut World, min: [f32; 3], max: [f32; 3]) {
    if w.nbox < MAX_C {
        w.boxes[w.nbox] = Aabb { min, max };
        w.nbox += 1;
    }
}

fn build_pyramid(w: &mut World, tex_sand: i32, tex_stone: i32, tex_gold: i32) {
    let g = 30.0;
    create_static_box([-g, -0.3, -g], [g, 0.0, g], tex_sand);
    add_collider(w, [-g, -0.3, -g], [g, 0.0, g]);

    for i in 0..LEVELS {
        let hs = slab_half(i);
        let y0 = slab_y0(i);
        let y1 = y0 + STEP;
        let tex = if i == LEVELS - 1 { tex_gold } else { tex_stone };
        create_static_box([-hs, y0, -hs], [hs, y1, hs], tex);
        add_collider(w, [-hs, y0, -hs], [hs, y1, hs]);
    }

    // east-face stairs: a half-height helper step per level (auto-step route)
    for i in 0..LEVELS {
        let hs = slab_half(i);
        let base = slab_y0(i);
        let min = [hs, base, -0.9];
        let max = [hs + 0.9, base + STAIR_H, 0.9];
        create_static_box(min, max, tex_stone);
        add_collider(w, min, max);
    }
}

// A mummy that walks the full square ring of terrace `terrace` (all four sides),
// starting at perimeter fraction `phase` in [0,1).
fn add_monster(w: &mut World, tex: i32, terrace: usize, phase: f32, speed: f32) {
    if w.nmon >= MAX_MON {
        return;
    }
    let top = slab_y0(terrace) + STEP;
    let outer = slab_half(terrace);
    let inner = slab_half(terrace + 1);
    let r = (outer + inner) * 0.5; // middle of the exposed ring band
    // billboard mummy (centre at feet+0.75) when the sheet is loaded, else a box
    let mhy = if w.mummy > 0 { 0.75 } else { 0.5 };
    let ent = if w.mummy > 0 {
        unsafe { rg_create_sprite(w.mummy, 3, 4, fx(0.95), fx(1.5)) }
    } else {
        create_actor([0.4, 0.5, 0.4], tex)
    };
    w.mons[w.nmon] = Monster { ent, r, y: top + mhy, s: phase * (8.0 * r), speed, respawn: 0.0 };
    w.nmon += 1;
}

// `mesh` > 0 draws the diamond as a real GLB model (rg_create_mesh_entity);
// otherwise it falls back to a textured box.
fn add_gem(w: &mut World, tex: i32, mesh: i32, terrace: usize, x: f32, z: f32) {
    if w.ngem >= MAX_GEM {
        return;
    }
    let top = slab_y0(terrace) + STEP;
    let ent = if mesh > 0 {
        unsafe { rg_create_mesh_entity(mesh, 0) }
    } else {
        create_actor([0.3, 0.3, 0.3], tex)
    };
    w.gems[w.ngem] = Gem { ent, x, y: top + 0.5, z, taken: false };
    w.ngem += 1;
}

// ---- physics ---------------------------------------------------------------
fn overlap(cx: f32, cy: f32, cz: f32, hx: f32, hy: f32, hz: f32, b: &Aabb) -> bool {
    cx - hx < b.max[0] && cx + hx > b.min[0]
        && cy - hy < b.max[1] && cy + hy > b.min[1]
        && cz - hz < b.max[2] && cz + hz > b.min[2]
}
fn overlaps_any(w: &World, cx: f32, cy: f32, cz: f32) -> bool {
    for i in 0..w.nbox {
        if overlap(cx, cy, cz, P_HX, P_HY, P_HZ, &w.boxes[i]) {
            return true;
        }
    }
    false
}
fn resolve_axis(w: &mut World, axis: usize) {
    for i in 0..w.nbox {
        let b = w.boxes[i];
        if !overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &b) {
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
fn move_horizontal(w: &mut World, dx: f32, dz: f32, grounded: bool) {
    let (ox, oz) = (w.px, w.pz);
    w.px += dx;
    resolve_axis(w, 0);
    w.pz += dz;
    resolve_axis(w, 2);
    let ix = ox + dx;
    let iz = oz + dz;
    let blocked = (w.px - ix).abs() > 0.001 || (w.pz - iz).abs() > 0.001;
    if !blocked || !grounded {
        return;
    }
    let feet = w.py - P_HY;
    let mut best = f32::MIN;
    for i in 0..w.nbox {
        let b = w.boxes[i];
        if overlap(ix, w.py, iz, P_HX, P_HY, P_HZ, &b) {
            let top = b.max[1];
            let rise = top - feet;
            if rise > 0.02 && rise <= STEP_UP && top > best {
                best = top;
            }
        }
    }
    if best > f32::MIN {
        let cand_py = best + P_HY;
        if !overlaps_any(w, ix, cand_py, iz) {
            w.px = ix;
            w.pz = iz;
            w.py = cand_py;
            w.vy = 0.0;
            w.on_ground = true;
        }
    }
}

fn respawn_player(w: &mut World) {
    w.px = SPAWN[0];
    w.py = SPAWN[1];
    w.pz = SPAWN[2];
    w.vx = 0.0;
    w.vy = 0.0;
    w.vz = 0.0;
    w.yaw = SPAWN_YAW;
    w.on_ground = true;
    set_scale_uniform(w.player_ent, 1.0);
}

// A physical hit: launch the player away from (fromx,fromz) and upward, harder
// the bigger `strength`. No death — the character controller flies it off the
// terrace and it settles on a lower level. Input is locked for KNOCK_TIME.
fn apply_knockback(w: &mut World, fromx: f32, fromz: f32, strength: f32) {
    let mut dx = w.px - fromx;
    let mut dz = w.pz - fromz;
    let l = (dx * dx + dz * dz).sqrt();
    if l > 0.001 {
        dx /= l;
        dz /= l;
    } else {
        dx = 0.0;
        dz = 1.0;
    }
    w.vx = dx * strength;
    w.vz = dz * strength;
    w.vy = 2.6 + strength * 0.25;
    w.on_ground = false;
    w.knock_t = KNOCK_TIME;
    w.lives -= 1;
    if w.lives < 0 {
        w.lives = START_LIVES;
    }
}

// ---- camera + actor sync ---------------------------------------------------
fn sync_camera(w: &mut World) {
    let (s, c) = w.yaw.sin_cos();
    let dist = 5.5;
    let height = 3.4;
    let ex = w.px - s * dist;
    let ez = w.pz - c * dist;
    let ey = w.py + height;
    w.cam_x = ex;
    w.cam_y = ey;
    w.cam_z = ez;
    unsafe {
        rg_set_position(w.cam, fx(ex), fx(ey), fx(ez));
        rg_set_target(w.cam, fx(w.px), fx(w.py + 0.6), fx(w.pz));
        rg_set_position(w.lamp, fx(w.px), fx(w.py + 1.2), fx(w.pz));
    }
}

// ---- init ------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn init() {
    unsafe {
        let tex_sand = rg_load_texture("sand".as_ptr(), 4);
        let tex_stone = rg_load_texture("stone".as_ptr(), 5);
        let tex_gold = rg_load_texture("gold".as_ptr(), 4);
        let tex_gem = rg_load_texture("gem".as_ptr(), 3);
        let tex_mon = rg_load_texture("monster".as_ptr(), 7);
        let tex_ball = rg_load_texture("ball".as_ptr(), 4);

        let w = world();
        w.nbox = 0;
        w.nmon = 0;
        w.ngem = 0;
        w.lives = START_LIVES;
        w.invinc = 0.0;
        w.mode = MODE_PLAY;
        w.knock_t = 0.0;
        w.ball_timer = BALL_SPAWN_INT;
        w.t = 0.0;
        // billboard sprite sheets (host preloads sprites/*.png); 0 => box fallback
        w.mummy = rg_load_sprite("mummy".as_ptr(), 5);
        w.hero = rg_load_sprite("hero".as_ptr(), 4);

        build_pyramid(w, tex_sand, tex_stone, tex_gold);

        // mummies patrol the full ring of their terrace; spread up the pyramid
        add_monster(w, tex_mon, 0, 0.0, 2.4);
        add_monster(w, tex_mon, 0, 0.5, 2.4);
        add_monster(w, tex_mon, 1, 0.25, 2.7);
        add_monster(w, tex_mon, 2, 0.0, 3.0);
        add_monster(w, tex_mon, 2, 0.55, 3.0);
        add_monster(w, tex_mon, 3, 0.7, 3.2);
        add_monster(w, tex_mon, 4, 0.2, 3.4);
        add_monster(w, tex_mon, 5, 0.6, 3.6);
        add_monster(w, tex_mon, 6, 0.1, 3.8);
        add_monster(w, tex_mon, 7, 0.45, 4.0);

        // diamonds up the pyramid — drawn as a real GLB gem model when the host
        // preloaded models/diamond.glb, else a box.
        let dia = rg_load_model("diamond".as_ptr(), 7);
        add_gem(w, tex_gem, dia, 0, 0.0, slab_half(0) - 0.6);
        add_gem(w, tex_gem, dia, 2, -(slab_half(2) - 0.6), 0.0);
        add_gem(w, tex_gem, dia, 4, 0.0, -(slab_half(4) - 0.6));
        add_gem(w, tex_gem, dia, 6, slab_half(6) - 0.6, 0.0);
        add_gem(w, tex_gem, dia, 8, 0.0, slab_half(8) - 0.6);

        // boulder pool (hidden until thrown)
        for i in 0..MAX_BALL {
            let ent = create_actor([BALL_R, BALL_R, BALL_R], tex_ball);
            rg_set_visible(ent, 0);
            w.balls[i] = Ball { ent, ..ZERO_BALL };
        }

        // player avatar: a billboard hero sprite (else a gold box), third-person
        w.player_ent = if w.hero > 0 {
            rg_create_sprite(w.hero, 4, 4, fx(0.9), fx(1.5))
        } else {
            create_actor([P_HX, P_HY, P_HZ], tex_gold)
        };
        respawn_player(w);

        // camera + player lamp
        w.cam = rg_create_camera(fx(1.0), fx(0.1), fx(200.0));
        rg_set_active_camera(w.cam);
        w.lamp = rg_create_light(LIGHT_POINT, rgba(255, 236, 200), fx(0.7));
        rg_set_range(w.lamp, fx(10.0));

        // world lighting
        rg_create_light(LIGHT_AMBIENT, rgba(200, 190, 170), fx(0.5));
        let sun = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 240, 205), fx(0.75));
        rg_set_position(sun, fx(0.4), fx(0.85), fx(0.3));
        let glow = rg_create_light(LIGHT_POINT, rgba(255, 215, 120), fx(0.9));
        rg_set_position(glow, fx(0.0), fx(summit_y() + 1.2), fx(0.0));
        rg_set_range(glow, fx(7.0));

        // place actors for frame 0
        rg_set_position(w.player_ent, fx(w.px), fx(w.py), fx(w.pz));
        set_yaw(w.player_ent, w.yaw);
        for gi in 0..w.ngem {
            let gm = w.gems[gi];
            rg_set_position(gm.ent, fx(gm.x), fx(gm.y), fx(gm.z));
        }
        for mi in 0..w.nmon {
            let m = w.mons[mi];
            let (mx, mz, _, _) = ring_pos(m.r, m.s);
            rg_set_position(m.ent, fx(mx), fx(m.y), fx(mz));
        }
        sync_camera(w);
    }
}

// ---- per-frame subsystems --------------------------------------------------
// Which of the 4 sprite rows (0 front, 1 left, 2 right, 3 back) to show for a
// character facing (fxv,fzv) at (mx,mz), seen by a camera at (camx,camz).
fn sprite_dir(fxv: f32, fzv: f32, mx: f32, mz: f32, camx: f32, camz: f32) -> i32 {
    let mut tx = camx - mx;
    let mut tz = camz - mz;
    let l = (tx * tx + tz * tz).sqrt();
    if l > 0.0 {
        tx /= l;
        tz /= l;
    }
    let dot_f = fxv * tx + fzv * tz; // facing · toCamera
    let dot_r = fzv * tx - fxv * tz; // right(fz,-fx) · toCamera
    if dot_f.abs() >= dot_r.abs() {
        if dot_f > 0.0 { 0 } else { 3 }
    } else if dot_r > 0.0 {
        2
    } else {
        1
    }
}

fn update_monsters(w: &mut World, dt: f32) {
    for i in 0..w.nmon {
        let mut m = w.mons[i];
        if m.respawn > 0.0 {
            m.respawn -= dt;
            if m.respawn <= 0.0 {
                m.respawn = 0.0;
                unsafe { rg_set_visible(m.ent, 1) };
            }
            w.mons[i] = m;
            continue;
        }
        m.s += m.speed * dt;
        let (mx, mz, fxv, fzv) = ring_pos(m.r, m.s);
        unsafe { rg_set_position(m.ent, fx(mx), fx(m.y), fx(mz)) };
        if w.mummy > 0 {
            let d = sprite_dir(fxv, fzv, mx, mz, w.cam_x, w.cam_z);
            let frame = (((w.t * 6.0) as i32) + i as i32).rem_euclid(3);
            unsafe { rg_set_sprite_cell(m.ent, frame, d) };
        } else {
            set_yaw(m.ent, fxv.atan2(fzv));
        }
        w.mons[i] = m;
    }
}

fn check_monster_hits(w: &mut World) {
    if w.knock_t > 0.0 {
        return; // already flying; don't chain hits
    }
    for i in 0..w.nmon {
        let m = w.mons[i];
        if m.respawn > 0.0 {
            continue;
        }
        let (mx, mz, _, _) = ring_pos(m.r, m.s);
        let mb = Aabb { min: [mx - 0.4, m.y - 0.5, mz - 0.4], max: [mx + 0.4, m.y + 0.5, mz + 0.4] };
        if overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &mb) {
            if w.invinc > 0.0 {
                let mut mm = w.mons[i];
                mm.respawn = 5.0;
                w.mons[i] = mm;
                unsafe { rg_set_visible(mm.ent, 0) };
            } else {
                apply_knockback(w, mx, mz, 4.5 + m.speed);
                return;
            }
        }
    }
}

fn spawn_ball(w: &mut World) {
    // find a free slot
    let mut slot = usize::MAX;
    for i in 0..MAX_BALL {
        if !w.balls[i].active {
            slot = i;
            break;
        }
    }
    if slot == usize::MAX {
        return;
    }
    // hurl outward from just above the summit in a random direction
    let ang = rng_f(w) * core::f32::consts::TAU;
    let (s, c) = ang.sin_cos();
    let spd = 3.0 + rng_f(w) * 2.0;
    let mut b = w.balls[slot];
    b.x = c * 0.4;
    b.z = s * 0.4;
    b.y = summit_y() + 1.0;
    b.vx = c * spd;
    b.vz = s * spd;
    b.vy = 1.5;
    b.spin = 0.0;
    b.life = 9.0;
    b.active = true;
    w.balls[slot] = b;
    unsafe { rg_set_visible(b.ent, 1) };
}

fn update_balls(w: &mut World, dt: f32) {
    for i in 0..MAX_BALL {
        let mut b = w.balls[i];
        if !b.active {
            continue;
        }
        b.life -= dt;
        b.vy -= GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        // bounce on the pyramid surface / sand
        let fh = floor_height(b.x, b.z) + BALL_R;
        if b.y <= fh && b.vy < 0.0 {
            b.y = fh;
            b.vy = -b.vy * BALL_REST;
            if b.vy < 1.2 {
                b.vy = 1.2; // keep it lively so it keeps bounding down the steps
            }
        }
        b.spin += (b.vx * b.vx + b.vz * b.vz).sqrt() * dt * 2.0;
        // retire when it rolls off the sand or its life ends
        let r = b.x.abs().max(b.z.abs());
        if b.life <= 0.0 || r > 20.0 {
            b.active = false;
            unsafe { rg_set_visible(b.ent, 0) };
        } else {
            unsafe {
                rg_set_position(b.ent, fx(b.x), fx(b.y), fx(b.z));
                set_tumble(b.ent, b.spin);
            }
        }
        w.balls[i] = b;
    }
}

fn check_ball_hits(w: &mut World) {
    if w.invinc > 0.0 || w.knock_t > 0.0 {
        return;
    }
    for i in 0..MAX_BALL {
        let b = w.balls[i];
        if !b.active {
            continue;
        }
        let bb = Aabb {
            min: [b.x - BALL_R, b.y - BALL_R, b.z - BALL_R],
            max: [b.x + BALL_R, b.y + BALL_R, b.z + BALL_R],
        };
        if overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &bb) {
            // harder boulders throw the player further
            let speed = (b.vx * b.vx + b.vy * b.vy + b.vz * b.vz).sqrt();
            let strength = (3.0 + speed).min(11.0);
            apply_knockback(w, b.x, b.z, strength);
            let mut bb2 = w.balls[i];
            bb2.active = false;
            w.balls[i] = bb2;
            unsafe { rg_set_visible(bb2.ent, 0) };
            return;
        }
    }
}

fn check_gem_pickups(w: &mut World) {
    for i in 0..w.ngem {
        let gm = w.gems[i];
        if gm.taken {
            continue;
        }
        let gb = Aabb { min: [gm.x - 0.5, gm.y - 0.6, gm.z - 0.5], max: [gm.x + 0.5, gm.y + 0.6, gm.z + 0.5] };
        if overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &gb) {
            let mut g2 = gm;
            g2.taken = true;
            w.gems[i] = g2;
            w.invinc = INVINC_TIME;
            unsafe { rg_set_visible(g2.ent, 0) };
        }
    }
}

fn spin_gems(w: &World) {
    for i in 0..w.ngem {
        let gm = w.gems[i];
        if gm.taken {
            continue;
        }
        set_yaw(gm.ent, w.t * 2.0 + i as f32);
    }
}

fn check_win(w: &mut World) {
    if w.mode != MODE_PLAY {
        return;
    }
    let feet = w.py - P_HY;
    let top = summit_y();
    let hs = slab_half(LEVELS - 1);
    if feet >= top - 0.2 && w.px.abs() <= hs && w.pz.abs() <= hs {
        w.mode = MODE_WON;
    }
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, forward: i32, strafe: i32, turn: i32, jump: i32) {
    let w = world();
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    w.t += dt;
    if w.invinc > 0.0 {
        w.invinc -= dt;
        if w.invinc < 0.0 {
            w.invinc = 0.0;
        }
    }

    if w.mode == MODE_WON {
        w.yaw += 2.5 * dt;
        unsafe {
            rg_set_position(w.player_ent, fx(w.px), fx(w.py), fx(w.pz));
            set_yaw(w.player_ent, w.yaw);
        }
        spin_gems(w);
        sync_camera(w);
        return;
    }
    let grounded = w.on_ground;
    // turning is always allowed; negated so left turns left, right turns right
    w.yaw -= (turn as f32) * TURN_SPD * dt;
    if w.knock_t > 0.0 {
        // knocked back: input locked, momentum carries with friction
        w.knock_t -= dt;
        let fr = if w.on_ground { 8.0 } else { 0.6 };
        let decay = (1.0 - fr * dt).max(0.0);
        w.vx *= decay;
        w.vz *= decay;
    } else {
        let (s, c) = w.yaw.sin_cos();
        let fwd = forward as f32;
        let stf = strafe as f32;
        let mut mvx = (s * fwd + c * stf) * MOVE_SPD;
        let mut mvz = (c * fwd - s * stf) * MOVE_SPD;
        let mag = (mvx * mvx + mvz * mvz).sqrt();
        if mag > MOVE_SPD {
            mvx *= MOVE_SPD / mag;
            mvz *= MOVE_SPD / mag;
        }
        w.vx = mvx;
        w.vz = mvz;
        if jump != 0 && w.on_ground {
            w.vy = JUMP_V;
            w.on_ground = false;
        }
    }
    w.vy -= GRAV * dt;
    w.on_ground = false;

    move_horizontal(w, w.vx * dt, w.vz * dt, grounded);
    w.py += w.vy * dt;
    resolve_axis(w, 1);
    if w.py - P_HY < 0.0 {
        w.py = P_HY;
        w.vy = 0.0;
        w.on_ground = true;
    }
    let moving = (w.vx * w.vx + w.vz * w.vz).sqrt() > 0.4;

    update_monsters(w, dt);

    // boulders hurled off the summit
    w.ball_timer -= dt;
    if w.ball_timer <= 0.0 {
        w.ball_timer = BALL_SPAWN_INT;
        spawn_ball(w);
    }
    update_balls(w, dt);

    check_monster_hits(w);
    check_ball_hits(w);
    check_gem_pickups(w);
    spin_gems(w);
    check_win(w);

    // player avatar: billboard hero sprite (facing vs camera + walk/jump), or box
    if w.hero > 0 {
        let sy = w.py + (0.75 - P_HY); // sprite centre so the feet sit on the ground
        let (s, c) = w.yaw.sin_cos();
        let d = sprite_dir(s, c, w.px, w.pz, w.cam_x, w.cam_z);
        let col = if !w.on_ground {
            3 // jump frame
        } else if moving {
            ((w.t * 7.0) as i32).rem_euclid(3)
        } else {
            1 // idle
        };
        unsafe {
            rg_set_position(w.player_ent, fx(w.px), fx(sy), fx(w.pz));
            rg_set_sprite_cell(w.player_ent, col, d);
        }
    } else {
        let pulse = if w.invinc > 0.0 { 1.0 + 0.15 * (w.t * 12.0).sin() } else { 1.0 };
        unsafe {
            rg_set_position(w.player_ent, fx(w.px), fx(w.py), fx(w.pz));
            set_yaw(w.player_ent, w.yaw);
            rg_set_scale(w.player_ent, fx(pulse), fx(pulse), fx(pulse));
        }
    }
    sync_camera(w);
}
