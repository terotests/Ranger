//! pyramid_wasm — "Faaraon pyramidi": a 3D floating-platform climber for kids
//! on the host-managed scene (IDEAL_3D Phase H). Several spiralling paths of
//! floating platforms wind up through the air (ylos2 in 3D); pick a route and
//! jump from platform to platform. Hold jump to leap higher. Glowing rescue
//! checkpoints part-way up become your respawn point, so a fall doesn't send you
//! back to the bottom. LPC-sprite skeletons patrol the platforms — bump into one
//! and you're knocked back, but you never die. Grab the gems for points, reach
//! the golden platform at the very top to win.
//!
//! Ownership: the guest owns the world + all physics (a kinematic AABB
//! character controller with step-up and a variable-height jump). The host owns
//! the scene and renders it; the guest issues rg_create_* at init and
//! rg_set_position/rotation/sprite_cell per frame, holding opaque EntityIds.
//! Characters are LPC-walkcycle billboards (camera-facing); platforms are boxes.
//!
//! Input (host → guest): update(dt_ms, forward, strafe, turn, jump).

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

use core::cell::UnsafeCell;

const FP: f32 = 256.0;

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
    unsafe { rg_create_box(fx(min[0]), fx(min[1]), fx(min[2]), fx(max[0]), fx(max[1]), fx(max[2]), tex) }
}
fn create_actor(half: [f32; 3], tex: i32) -> i32 {
    unsafe { rg_create_box(fx(-half[0]), fx(-half[1]), fx(-half[2]), fx(half[0]), fx(half[1]), fx(half[2]), tex) }
}
fn set_yaw(e: i32, a: f32) {
    let (s, c) = (a * 0.5).sin_cos();
    unsafe { rg_set_rotation(e, 0, q16(s), 0, q16(c)) };
}

// LPC walkcycle sheets: 9 cols (0 idle, 1..8 walk), 4 rows (up/left/down/right).
const SPR_COLS: i32 = 9;
const SPR_ROWS: i32 = 4;
const SPR_W: f32 = 2.0;
const SPR_H: f32 = 2.0;
const SPR_FEET_OFF: f32 = 0.84; // sprite centre sits this far above the feet
fn lpc_row(d: i32) -> i32 {
    match d {
        0 => 2, // front -> down
        1 => 1, // left
        2 => 3, // right
        _ => 0, // back -> up
    }
}
fn walk_col(t: f32, moving: bool) -> i32 {
    if moving {
        1 + ((t * 9.0) as i32).rem_euclid(8)
    } else {
        0
    }
}
// which of 4 sprite rows (0 front,1 left,2 right,3 back) to show for a character
// facing (fxv,fzv) at (mx,mz), seen by a camera at (camx,camz).
fn sprite_dir(fxv: f32, fzv: f32, mx: f32, mz: f32, camx: f32, camz: f32) -> i32 {
    let mut tx = camx - mx;
    let mut tz = camz - mz;
    let l = (tx * tx + tz * tz).sqrt();
    if l > 0.0 {
        tx /= l;
        tz /= l;
    }
    let dot_f = fxv * tx + fzv * tz;
    let dot_r = fzv * tx - fxv * tz;
    if dot_f.abs() >= dot_r.abs() {
        if dot_f > 0.0 { 0 } else { 3 }
    } else if dot_r > 0.0 {
        2
    } else {
        1
    }
}

// small LCG for the procedural level (deterministic; no Math.random in wasm)
fn lcg(seed: &mut u32) -> f32 {
    *seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    ((*seed >> 8) & 0xffff) as f32 / 65536.0
}

// ---- world state -----------------------------------------------------------
const MAX_C: usize = 160;
#[derive(Clone, Copy)]
struct Aabb {
    min: [f32; 3],
    max: [f32; 3],
}

const MAX_MON: usize = 12;
#[derive(Clone, Copy)]
struct Monster {
    ent: i32,
    y: f32,   // feet (platform top)
    z: f32,   // fixed z; patrols along x
    lo: f32,
    hi: f32,
    pos: f32, // current x
    dir: f32,
    speed: f32,
    respawn: f32,
}

const MAX_GEM: usize = 12;
#[derive(Clone, Copy)]
struct Gem {
    ent: i32,
    x: f32,
    y: f32,
    z: f32,
    taken: bool,
}

// rescue checkpoints: [cx, top_y, cz, hx, hz]. Standing on one makes it the
// respawn point, so a fall drops you here instead of at the very bottom.
const MAX_CP: usize = 16;

const MODE_PLAY: i32 = 0;
const MODE_WON: i32 = 2;

struct World {
    boxes: [Aabb; MAX_C],
    nbox: usize,
    mons: [Monster; MAX_MON],
    nmon: usize,
    gems: [Gem; MAX_GEM],
    ngem: usize,
    cps: [[f32; 5]; MAX_CP],
    ncp: usize,
    // player
    px: f32,
    py: f32,
    pz: f32,
    vx: f32,
    vy: f32,
    vz: f32,
    yaw: f32,
    on_ground: bool,
    jumping: bool,
    jump_prev: bool,
    turn_prev: i32,
    // game
    score: i32,
    mode: i32,
    knock_t: f32,
    t: f32,
    spawn: [f32; 3],
    goal: [f32; 3],
    player_ent: i32,
    cam: i32,
    lamp: i32,
    cam_x: f32,
    cam_z: f32,
    cam_gy: f32,
    mummy: i32,
    hero: i32,
}

struct WCell(UnsafeCell<World>);
unsafe impl Sync for WCell {}
const ZERO_AABB: Aabb = Aabb { min: [0.0; 3], max: [0.0; 3] };
const ZERO_MON: Monster = Monster { ent: 0, y: 0.0, z: 0.0, lo: 0.0, hi: 0.0, pos: 0.0, dir: 1.0, speed: 0.0, respawn: 0.0 };
const ZERO_GEM: Gem = Gem { ent: 0, x: 0.0, y: 0.0, z: 0.0, taken: false };

const SPAWN: [f32; 3] = [0.0, 1.4, 0.0]; // on the base platform (top 0.75)

static W: WCell = WCell(UnsafeCell::new(World {
    boxes: [ZERO_AABB; MAX_C],
    nbox: 0,
    mons: [ZERO_MON; MAX_MON],
    nmon: 0,
    gems: [ZERO_GEM; MAX_GEM],
    ngem: 0,
    cps: [[0.0; 5]; MAX_CP],
    ncp: 0,
    px: SPAWN[0],
    py: SPAWN[1],
    pz: SPAWN[2],
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    yaw: 0.0,
    on_ground: true,
    jumping: false,
    jump_prev: false,
    turn_prev: 0,
    score: 0,
    mode: MODE_PLAY,
    knock_t: 0.0,
    t: 0.0,
    spawn: SPAWN,
    goal: [0.0; 3],
    player_ent: 0,
    cam: 0,
    lamp: 0,
    cam_x: 0.0,
    cam_z: 0.0,
    cam_gy: SPAWN[1],
    mummy: 0,
    hero: 0,
}));
fn world() -> &'static mut World {
    unsafe { &mut *W.0.get() }
}

// player half extents
const P_HX: f32 = 0.3;
const P_HY: f32 = 0.6;
const P_HZ: f32 = 0.3;
const STEP_UP: f32 = 0.35; // small ledges auto-step; platform gaps need a jump
const GRAV: f32 = 18.0;
const JUMP_V0: f32 = 6.2; // snappy initial jump speed
const JUMP_HOLD_G: f32 = 0.34; // gravity scale while holding jump & rising -> tall leap
const JUMP_CUT: f32 = 0.5; // on release mid-rise, keep this much of the upward speed
const MOVE_SPD: f32 = 4.6;
const KNOCK_TIME: f32 = 0.6;
// fixed-angle camera: a constant world-space offset from the player (a bit
// above and obliquely from the -x,-z side, looking toward the +x,+z goal). It
// only translates with the player — it never rotates with the player's turns.
const CAM_OFF_X: f32 = -8.5; // mostly to the side...
const CAM_OFF_Y: f32 = 5.8; // ...a bit above...
const CAM_OFF_Z: f32 = -4.5; // ...and slightly oblique

// ---- level: several spiralling *paths* of floating platforms climb from a
// central base up to a golden goal high above. Platforms vary in shape (square,
// long/narrow, wide); every few steps up a path is a glowing rescue checkpoint
// so a fall doesn't send you all the way back to the bottom ------------------
const NPATHS: usize = 3; // number of routes winding up to the top
const PSTEPS: usize = 14; // platforms per path
const CLIMB_STEP: f32 = 1.1; // height gained per platform up a path
const BASE_Y: f32 = 1.0; // height of the starting base platform
const R_NEAR: f32 = 4.5; // path radius near the base/top (reachable from centre)
const R_FAR: f32 = 11.0; // widest radius mid-climb (paths bow outward)
const ANG_STEP: f32 = 0.48; // spiral angle advance per platform (radians)

fn add_collider(w: &mut World, min: [f32; 3], max: [f32; 3]) {
    if w.nbox < MAX_C {
        w.boxes[w.nbox] = Aabb { min, max };
        w.nbox += 1;
    }
}
// a floating platform (thin box); returns its top-surface y.
fn add_platform(w: &mut World, cx: f32, cy: f32, cz: f32, hx: f32, hz: f32, tex: i32) -> f32 {
    let hh = 0.25;
    let min = [cx - hx, cy - hh, cz - hz];
    let max = [cx + hx, cy + hh, cz + hz];
    create_static_box(min, max, tex);
    add_collider(w, min, max);
    cy + hh
}

fn add_monster(w: &mut World, tex: i32, cx: f32, top: f32, cz: f32, half: f32, speed: f32) {
    if w.nmon >= MAX_MON {
        return;
    }
    let ent = if w.mummy > 0 {
        unsafe { rg_create_sprite(w.mummy, SPR_COLS, SPR_ROWS, fx(SPR_W), fx(SPR_H)) }
    } else {
        create_actor([0.4, 0.6, 0.4], tex)
    };
    w.mons[w.nmon] = Monster { ent, y: top, z: cz, lo: cx - half, hi: cx + half, pos: cx, dir: 1.0, speed, respawn: 0.0 };
    w.nmon += 1;
}

fn add_gem(w: &mut World, tex: i32, mesh: i32, x: f32, top: f32, z: f32) {
    if w.ngem >= MAX_GEM {
        return;
    }
    let ent = if mesh > 0 {
        unsafe { rg_create_mesh_entity(mesh, 0) }
    } else {
        create_actor([0.3, 0.3, 0.3], tex)
    };
    w.gems[w.ngem] = Gem { ent, x, y: top + 0.55, z, taken: false };
    w.ngem += 1;
}

fn build_level(w: &mut World, tex_sand: i32, tex_stone: i32, tex_gold: i32, tex_gem: i32, mesh_gem: i32) {
    // wide sand floor far below (fall-safety; a fall respawns at last checkpoint)
    let g = 40.0;
    create_static_box([-g, -0.4, -g], [g, 0.0, g], tex_sand);
    add_collider(w, [-g, -0.4, -g], [g, 0.0, g]);

    let mut seed: u32 = 0x51ED_2A3B;

    // central base platform (the start)
    let base_top = add_platform(w, 0.0, BASE_Y, 0.0, 3.2, 3.2, tex_stone);
    w.spawn = [0.0, base_top + P_HY + 0.05, 0.0];

    let goal_y = BASE_Y + PSTEPS as f32 * CLIMB_STEP;

    // Several spiralling paths climb from the base up to a shared golden goal.
    // Each path bows outward (widest in the middle) and winds around, so the
    // platforms are spread across the whole area yet always a jump apart, giving
    // multiple routes up. Platform shapes vary; every 5th step is a checkpoint.
    for p in 0..NPATHS {
        let base_ang = p as f32 * (core::f32::consts::TAU / NPATHS as f32);
        for step in 1..=PSTEPS {
            let frac = step as f32 / PSTEPS as f32;
            let radius = R_NEAR + (R_FAR - R_NEAR) * (frac * core::f32::consts::PI).sin();
            let ang = base_ang + step as f32 * ANG_STEP;
            let jx = (lcg(&mut seed) - 0.5) * 1.2;
            let jz = (lcg(&mut seed) - 0.5) * 1.2;
            let cx = radius * ang.cos() + jx;
            let cz = radius * ang.sin() + jz;
            let cy = BASE_Y + step as f32 * CLIMB_STEP + (lcg(&mut seed) - 0.5) * 0.3;

            // varied platform footprints: square / long-x / long-z / wide
            let shape = (lcg(&mut seed) * 4.0) as i32;
            let (hx, hz) = match shape {
                1 => (2.8 + lcg(&mut seed) * 0.8, 1.0 + lcg(&mut seed) * 0.3),
                2 => (1.0 + lcg(&mut seed) * 0.3, 2.8 + lcg(&mut seed) * 0.8),
                3 => (2.4 + lcg(&mut seed) * 0.6, 2.4 + lcg(&mut seed) * 0.6),
                _ => (1.6 + lcg(&mut seed) * 0.5, 1.6 + lcg(&mut seed) * 0.5),
            };

            let is_cp = step % 5 == 0 && step != PSTEPS;
            let tex = if is_cp { tex_gem } else { tex_stone };
            let top = add_platform(w, cx, cy, cz, hx, hz, tex);
            if is_cp && w.ncp < MAX_CP {
                w.cps[w.ncp] = [cx, top, cz, hx, hz];
                w.ncp += 1;
            }

            let gemr = lcg(&mut seed);
            if !is_cp && gemr < 0.24 && w.ngem < MAX_GEM {
                add_gem(w, tex_gem, mesh_gem, cx, top, cz);
            }
            let monr = lcg(&mut seed);
            if !is_cp && hx > 2.2 && monr < 0.35 {
                add_monster(w, tex_stone, cx, top, cz, hx - 0.6, 1.5 + lcg(&mut seed) * 1.3);
            }
        }
    }

    // golden goal platform at the very top, above the centre
    let gtop = add_platform(w, 0.0, goal_y, 0.0, 2.6, 2.6, tex_gold);
    w.goal = [0.0, gtop, 0.0];
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
// Horizontal collision on one axis (0=x, 2=z). A box only blocks if its top is
// more than STEP_UP above the feet (a real wall); a low ledge is stepped onto;
// a box at/below the feet is passed over (so you can jump above a platform and
// land on it instead of bonking its side).
fn resolve_h(w: &mut World, axis: usize) {
    for i in 0..w.nbox {
        let b = w.boxes[i];
        if !overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &b) {
            continue;
        }
        let feet = w.py - P_HY;
        let top = b.max[1];
        if top <= feet + 0.02 {
            continue; // player is above this box; not a wall
        }
        if top <= feet + STEP_UP {
            let cand = top + P_HY;
            if !overlaps_any(w, w.px, cand, w.pz) {
                w.py = cand;
                w.vy = 0.0;
                w.on_ground = true;
            }
            continue;
        }
        // genuine wall: push out on this axis
        let (c, hh, bmin, bmax) = if axis == 0 {
            (w.px, P_HX, b.min[0], b.max[0])
        } else {
            (w.pz, P_HZ, b.min[2], b.max[2])
        };
        let bc = (bmin + bmax) * 0.5;
        let bh = (bmax - bmin) * 0.5;
        let pen = (hh + bh) - (c - bc).abs();
        if pen <= 0.0 {
            continue;
        }
        let dir = if c >= bc { 1.0 } else { -1.0 };
        if axis == 0 {
            w.px += dir * pen;
            w.vx = 0.0;
        } else {
            w.pz += dir * pen;
            w.vz = 0.0;
        }
    }
}
fn resolve_vertical(w: &mut World) {
    for i in 0..w.nbox {
        let b = w.boxes[i];
        if !overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &b) {
            continue;
        }
        let bc = (b.min[1] + b.max[1]) * 0.5;
        let bh = (b.max[1] - b.min[1]) * 0.5;
        let pen = (P_HY + bh) - (w.py - bc).abs();
        if pen <= 0.0 {
            continue;
        }
        if w.py >= bc {
            w.py += pen;
            w.on_ground = true;
        } else {
            w.py -= pen;
        }
        w.vy = 0.0;
    }
}

fn respawn_player(w: &mut World) {
    w.px = w.spawn[0];
    w.py = w.spawn[1];
    w.pz = w.spawn[2];
    w.vx = 0.0;
    w.vy = 0.0;
    w.vz = 0.0;
}

// Standing on a rescue checkpoint makes it the new respawn point, so falling to
// the sand drops you back here instead of at the very bottom.
fn update_checkpoints(w: &mut World) {
    if !w.on_ground {
        return;
    }
    let feet = w.py - P_HY;
    for i in 0..w.ncp {
        let cp = w.cps[i];
        if (w.px - cp[0]).abs() < cp[3] && (w.pz - cp[2]).abs() < cp[4] && (feet - cp[1]).abs() < 0.3 {
            w.spawn = [cp[0], cp[1] + P_HY + 0.05, cp[2]];
        }
    }
}

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
    w.vy = 2.4 + strength * 0.2;
    w.on_ground = false;
    w.jumping = false;
    w.knock_t = KNOCK_TIME;
}

// ---- camera ----------------------------------------------------------------
// Fixed-angle camera: sits at a constant world-space offset from the player and
// only translates to follow. It never rotates with the player's turns, so the
// discrete 90° facings read cleanly. Height eases with the settled ground level
// so jumps don't bob it.
fn sync_camera(w: &mut World, dt: f32) {
    let target_gy = if w.on_ground { w.py } else { w.cam_gy };
    w.cam_gy += (target_gy - w.cam_gy) * (dt * 3.0).min(1.0);

    let ex = w.px + CAM_OFF_X;
    let ey = w.cam_gy + CAM_OFF_Y;
    let ez = w.pz + CAM_OFF_Z;
    w.cam_x = ex;
    w.cam_z = ez;
    unsafe {
        rg_set_position(w.cam, fx(ex), fx(ey), fx(ez));
        rg_set_target(w.cam, fx(w.px), fx(w.cam_gy + 0.7), fx(w.pz));
        rg_set_position(w.lamp, fx(w.px), fx(w.py + 1.4), fx(w.pz));
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

        let w = world();
        w.nbox = 0;
        w.nmon = 0;
        w.ngem = 0;
        w.ncp = 0;
        w.score = 0;
        w.mode = MODE_PLAY;
        w.knock_t = 0.0;
        w.jumping = false;
        w.jump_prev = false;
        w.t = 0.0;
        w.mummy = rg_load_sprite("mummy".as_ptr(), 5);
        w.hero = rg_load_sprite("hero".as_ptr(), 4);
        let mesh_gem = rg_load_model("diamond".as_ptr(), 7);

        build_level(w, tex_sand, tex_stone, tex_gold, tex_gem, mesh_gem);
        respawn_player(w); // spawn is set by build_level

        // player avatar (LPC hero billboard, else a gold box)
        w.player_ent = if w.hero > 0 {
            rg_create_sprite(w.hero, SPR_COLS, SPR_ROWS, fx(SPR_W), fx(SPR_H))
        } else {
            create_actor([P_HX, P_HY, P_HZ], tex_gold)
        };

        // camera + lights
        w.cam = rg_create_camera(fx(1.0), fx(0.1), fx(300.0));
        rg_set_active_camera(w.cam);
        w.lamp = rg_create_light(LIGHT_POINT, rgba(255, 240, 210), fx(0.7));
        rg_set_range(w.lamp, fx(11.0));
        rg_create_light(LIGHT_AMBIENT, rgba(150, 165, 200), fx(0.55));
        let sun = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 245, 220), fx(0.8));
        rg_set_position(sun, fx(0.4), fx(0.9), fx(0.35));
        let glow = rg_create_light(LIGHT_POINT, rgba(255, 220, 130), fx(1.0));
        rg_set_position(glow, fx(w.goal[0]), fx(w.goal[1] + 1.5), fx(w.goal[2]));
        rg_set_range(glow, fx(8.0));

        // frame-0 placement
        let psy = if w.hero > 0 { (w.py - P_HY) + SPR_FEET_OFF } else { w.py };
        rg_set_position(w.player_ent, fx(w.px), fx(psy), fx(w.pz));
        for gi in 0..w.ngem {
            let gm = w.gems[gi];
            rg_set_position(gm.ent, fx(gm.x), fx(gm.y), fx(gm.z));
        }
        for mi in 0..w.nmon {
            let m = w.mons[mi];
            let cy = if w.mummy > 0 { m.y + SPR_FEET_OFF } else { m.y + 0.6 };
            rg_set_position(m.ent, fx(m.pos), fx(cy), fx(m.z));
        }
        sync_camera(w, 1.0);
    }
}

// ---- per-frame -------------------------------------------------------------
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
        m.pos += m.dir * m.speed * dt;
        if m.pos > m.hi {
            m.pos = m.hi;
            m.dir = -1.0;
        } else if m.pos < m.lo {
            m.pos = m.lo;
            m.dir = 1.0;
        }
        let cy = if w.mummy > 0 { m.y + SPR_FEET_OFF } else { m.y + 0.6 };
        unsafe { rg_set_position(m.ent, fx(m.pos), fx(cy), fx(m.z)) };
        if w.mummy > 0 {
            let d = sprite_dir(m.dir, 0.0, m.pos, m.z, w.cam_x, w.cam_z);
            unsafe { rg_set_sprite_cell(m.ent, walk_col(w.t + i as f32, true), lpc_row(d)) };
        } else {
            set_yaw(m.ent, if m.dir > 0.0 { core::f32::consts::FRAC_PI_2 } else { -core::f32::consts::FRAC_PI_2 });
        }
        w.mons[i] = m;
    }
}

fn check_monster_hits(w: &mut World) {
    if w.knock_t > 0.0 {
        return;
    }
    for i in 0..w.nmon {
        let m = w.mons[i];
        if m.respawn > 0.0 {
            continue;
        }
        let mb = Aabb { min: [m.pos - 0.4, m.y, m.z - 0.4], max: [m.pos + 0.4, m.y + 1.3, m.z + 0.4] };
        if overlap(w.px, w.py, w.pz, P_HX, P_HY, P_HZ, &mb) {
            apply_knockback(w, m.pos, m.z, 4.5 + m.speed);
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
            w.score += 1;
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
    let dx = w.px - w.goal[0];
    let dz = w.pz - w.goal[2];
    if w.on_ground && feet >= w.goal[1] - 0.3 && (dx * dx + dz * dz).sqrt() < 1.3 {
        w.mode = MODE_WON;
    }
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, forward: i32, strafe: i32, turn: i32, jump: i32) {
    let w = world();
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    w.t += dt;
    let held = jump != 0;
    let jump_pressed = held && !w.jump_prev;
    let jump_released = !held && w.jump_prev;
    w.jump_prev = held;

    if w.mode == MODE_WON {
        if w.hero > 0 {
            let sy = (w.py - P_HY) + SPR_FEET_OFF;
            unsafe {
                rg_set_position(w.player_ent, fx(w.px), fx(sy), fx(w.pz));
                rg_set_sprite_cell(w.player_ent, walk_col(w.t, true), 2);
            }
        }
        spin_gems(w);
        sync_camera(w, dt);
        return;
    }

    // discrete 90° turn: one snap per left/right press (edge-triggered)
    if turn != 0 && w.turn_prev == 0 {
        w.yaw += (turn as f32) * core::f32::consts::FRAC_PI_2;
    }
    w.turn_prev = turn;

    // horizontal velocity: input, or knockback momentum with friction
    if w.knock_t > 0.0 {
        w.knock_t -= dt;
        let fr = if w.on_ground { 8.0 } else { 0.6 };
        let decay = (1.0 - fr * dt).max(0.0);
        w.vx *= decay;
        w.vz *= decay;
    } else {
        // facing vector from yaw; up-arrow (forward) drives along it, into the
        // scene. strafe moves along the right-hand perpendicular.
        let (s, c) = w.yaw.sin_cos();
        let fwx = -s;
        let fwz = -c;
        let rgx = -fwz; // right = facing rotated -90°
        let rgz = fwx;
        let fwd = forward as f32;
        let stf = strafe as f32;
        let mut mvx = (fwx * fwd + rgx * stf) * MOVE_SPD;
        let mut mvz = (fwz * fwd + rgz * stf) * MOVE_SPD;
        let mag = (mvx * mvx + mvz * mvz).sqrt();
        if mag > MOVE_SPD {
            mvx *= MOVE_SPD / mag;
            mvz *= MOVE_SPD / mag;
        }
        w.vx = mvx;
        w.vz = mvz;
        if jump_pressed && w.on_ground {
            w.vy = JUMP_V0;
            w.jumping = true;
            w.on_ground = false;
        }
    }

    // variable jump: releasing the button mid-rise cuts the jump short; holding
    // keeps it floaty (reduced gravity while ascending) for a taller leap.
    if jump_released && w.vy > 0.0 {
        w.vy *= JUMP_CUT;
        w.jumping = false;
    }
    let g = if w.jumping && held && w.vy > 0.0 { GRAV * JUMP_HOLD_G } else { GRAV };
    if w.vy <= 0.0 {
        w.jumping = false;
    }
    w.vy -= g * dt;
    w.on_ground = false;

    // integrate: horizontal (with step-up), then vertical (landing)
    w.px += w.vx * dt;
    resolve_h(w, 0);
    w.pz += w.vz * dt;
    resolve_h(w, 2);
    w.py += w.vy * dt;
    resolve_vertical(w);
    update_checkpoints(w);
    // fell off the platforms onto the sand -> rescue at the last checkpoint
    if w.py - P_HY < 0.5 {
        respawn_player(w);
    }
    let moving = (w.vx * w.vx + w.vz * w.vz).sqrt() > 0.4;

    update_monsters(w, dt);
    check_monster_hits(w);
    check_gem_pickups(w);
    spin_gems(w);
    check_win(w);

    // player avatar
    if w.hero > 0 {
        let sy = (w.py - P_HY) + SPR_FEET_OFF;
        let (s, c) = w.yaw.sin_cos();
        let d = sprite_dir(-s, -c, w.px, w.pz, w.cam_x, w.cam_z);
        let col = if !w.on_ground { 2 } else { walk_col(w.t, moving) };
        unsafe {
            rg_set_position(w.player_ent, fx(w.px), fx(sy), fx(w.pz));
            rg_set_sprite_cell(w.player_ent, col, lpc_row(d));
        }
    } else {
        unsafe {
            rg_set_position(w.player_ent, fx(w.px), fx(w.py), fx(w.pz));
            set_yaw(w.player_ent, w.yaw);
        }
    }
    sync_camera(w, dt);
}
