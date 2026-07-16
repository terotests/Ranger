//! model_viewer_wasm — a Tests-section 3D model browser on the host-managed
//! scene (IDEAL_3D Phase H). The host preloads every `models/*.glb` (through the
//! model3d loader) and registers each under its basename; this guest **asks the
//! host what it preloaded** (`ranger_game::resources::list`), loads every model
//! it names, places one mesh entity per model at the origin, shows one at a time,
//! and cycles the visible model with the **left / right** arrows. It slowly spins
//! the current model so its facets catch the light, and names the visible one in
//! an RGU1 HUD label the host draws over the scene.
//!
//! The guest owns only which model is shown; the host owns the meshes, textures,
//! camera, lights, and rendering — the guest holds opaque EntityIds.
//!
//! Input (host → guest): update(dt_ms, forward, strafe, turn, jump).
//!   turn = +1 (right arrow) → next model, -1 (left arrow) → previous model.
//!   forward = +1 (up arrow) → dolly the camera closer, -1 (down arrow) → back.

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

use core::cell::UnsafeCell;
use ranger_game::{resources, ui};

const FP: f32 = 256.0;

#[link(wasm_import_module = "env")]
extern "C" {
    fn rg_load_model(name_ptr: *const u8, name_len: u32) -> i32;
    fn rg_create_mesh_entity(mesh: i32, tex: i32) -> i32;
    fn rg_create_camera(fovy: i32, near: i32, far: i32) -> i32;
    fn rg_create_light(kind: i32, color: i32, intensity: i32) -> i32;
    fn rg_set_position(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_target(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_rotation(e: i32, qx: i32, qy: i32, qz: i32, qw: i32);
    fn rg_set_visible(e: i32, on: i32);
    fn rg_set_active_camera(e: i32);
}

const LIGHT_AMBIENT: i32 = 3;
const LIGHT_DIRECTIONAL: i32 = 4;

// Camera dolly: the eye sits along this fixed direction from the origin and the
// up / down arrows slide it in and out, so the framing stays the same while the
// model gets bigger. The direction is the original (0, 0.9, 2.6) eye, normalised.
const EYE_Y: f32 = 0.327;
const EYE_Z: f32 = 0.945;
const DIST_START: f32 = 2.75;
const DIST_MIN: f32 = 0.6;
const DIST_MAX: f32 = 12.0;
/// World units per second while an arrow is held.
const ZOOM_SPEED: f32 = 2.2;

/// Upper bound on models we place; the host may preload more, in which case the
/// extras are ignored rather than overrunning the tables.
const MAX_MODELS: usize = 64;

/// Backing store for the names the host writes back. Kept `static` so the parsed
/// `&str` slices borrow from it for the whole run and need no second copy.
static mut NAMES_RAW: [u8; 2048] = [0; 2048];

fn fx(v: f32) -> i32 {
    (v * FP) as i32
}
fn q16(v: f32) -> i32 {
    (v * 65536.0) as i32
}
fn rgba(r: u8, g: u8, b: u8) -> i32 {
    (((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | 0xff) as i32
}

struct Viewer {
    ents: [i32; MAX_MODELS],
    names: [&'static str; MAX_MODELS],
    n: usize,
    cam: i32,
    cur: usize,
    t: f32,
    dist: f32,
    turn_prev: i32,
    rev: u32,
    ready: bool,
}
struct VCell(UnsafeCell<Viewer>);
unsafe impl Sync for VCell {}
static V: VCell = VCell(UnsafeCell::new(Viewer {
    ents: [0; MAX_MODELS],
    names: [""; MAX_MODELS],
    n: 0,
    cam: 0,
    cur: 0,
    t: 0.0,
    dist: DIST_START,
    turn_prev: 0,
    rev: 0,
    ready: false,
}));
fn viewer() -> &'static mut Viewer {
    unsafe { &mut *V.0.get() }
}

/// Place the eye at the current dolly distance, still looking at the origin.
fn apply_camera(v: &Viewer) {
    if v.cam <= 0 {
        return;
    }
    unsafe {
        rg_set_position(v.cam, fx(0.0), fx(EYE_Y * v.dist), fx(EYE_Z * v.dist));
        rg_set_target(v.cam, fx(0.0), fx(0.0), fx(0.0));
    }
}

fn set_visible(v: &Viewer, i: usize, on: bool) {
    if v.ents[i] > 0 {
        unsafe { rg_set_visible(v.ents[i], if on { 1 } else { 0 }) };
    }
}

fn switch(v: &mut Viewer, dir: i32) {
    if v.n == 0 {
        return;
    }
    set_visible(v, v.cur, false);
    let n = v.n as i32;
    let mut c = v.cur as i32 + dir;
    if c < 0 {
        c += n;
    }
    if c >= n {
        c -= n;
    }
    v.cur = c as usize;
    set_visible(v, v.cur, true);
    build_hud(v);
}

/// Ask the host which models it preloaded. The names borrow from `NAMES_RAW`,
/// which outlives the run, so nothing is copied.
fn discover(v: &mut Viewer) {
    let buf = unsafe { &mut *core::ptr::addr_of_mut!(NAMES_RAW) };
    for name in resources::list("models", buf) {
        if v.n >= MAX_MODELS {
            break;
        }
        v.names[v.n] = name;
        v.n += 1;
    }
}

/// Name the visible model in an RGU1 label the host composites over the scene.
/// The revision only moves when the text changes, so the host re-reads the
/// document just on a model switch.
fn build_hud(v: &mut Viewer) {
    let label = if v.n == 0 { "no models" } else { v.names[v.cur] };
    v.rev += 1;
    ui::reset();
    let mut root = ui::root(1).column().pad(8);
    let mut bar = root.view(2).row().pad(6).radius(4).bg(0, 0, 0, 170);
    bar.label(3, label).font(2).color(255, 255, 255, 255);
    ui::finish(v.rev);
}

#[no_mangle]
pub extern "C" fn init() {
    let v = viewer();
    v.t = 0.0;
    v.cur = 0;
    v.turn_prev = 0;
    v.dist = DIST_START;
    unsafe {
        // camera framing the origin from slightly above and in front
        v.cam = rg_create_camera(fx(0.9), fx(0.1), fx(100.0));
        rg_set_active_camera(v.cam);
        // Three-point-ish rig: ambient floor, a warm key from front-right, a
        // cooler fill from the left to lift the shadow side, and a back light to
        // separate the silhouette from the background. Directional lights point
        // along their position vector, so these are directions, not places.
        rg_create_light(LIGHT_AMBIENT, rgba(150, 160, 190), fx(0.55));
        let key = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 245, 225), fx(0.9));
        rg_set_position(key, fx(0.4), fx(0.9), fx(0.5));
        let fill = rg_create_light(LIGHT_DIRECTIONAL, rgba(170, 195, 255), fx(0.45));
        rg_set_position(fill, fx(-0.7), fx(0.25), fx(0.45));
        let back = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 235, 210), fx(0.55));
        rg_set_position(back, fx(-0.1), fx(0.5), fx(-0.9));
    }
    apply_camera(v);
    // ask the host what it preloaded, then place one entity per model at the
    // origin; only the first is visible
    discover(v);
    unsafe {
        let mut i = 0usize;
        while i < v.n {
            let name = v.names[i];
            let mesh = rg_load_model(name.as_ptr(), name.len() as u32);
            let e = rg_create_mesh_entity(mesh, 0);
            v.ents[i] = e;
            rg_set_position(e, fx(0.0), fx(0.0), fx(0.0));
            rg_set_visible(e, if i == 0 { 1 } else { 0 });
            i += 1;
        }
    }
    build_hud(v);
    v.ready = true;
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, forward: i32, _strafe: i32, turn: i32, _jump: i32) {
    let v = viewer();
    if !v.ready {
        return;
    }
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    v.t += dt;
    // up / down arrow → dolly the camera in / out (held, not edge-triggered)
    if forward != 0 {
        v.dist -= (forward as f32) * ZOOM_SPEED * dt;
        if v.dist < DIST_MIN {
            v.dist = DIST_MIN;
        }
        if v.dist > DIST_MAX {
            v.dist = DIST_MAX;
        }
        apply_camera(v);
    }
    // left/right arrow edge → switch model (one step per press)
    if turn > 0 && v.turn_prev <= 0 {
        switch(v, 1);
    } else if turn < 0 && v.turn_prev >= 0 {
        switch(v, -1);
    }
    v.turn_prev = turn;
    // spin the current model around Y
    let half = v.t * 0.4;
    if v.n > 0 {
        let e = v.ents[v.cur];
        if e > 0 {
            unsafe { rg_set_rotation(e, 0, q16(half.sin()), 0, q16(half.cos())) };
        }
    }
}

/// Index of the currently shown model — lets a headless host/test read the state.
#[no_mangle]
pub extern "C" fn current_index() -> i32 {
    viewer().cur as i32
}

/// Number of models discovered from the host — lets a headless host/test read state.
#[no_mangle]
pub extern "C" fn model_count() -> i32 {
    viewer().n as i32
}

// The exports the host reads for the HUD document (rg_ui_ptr / rg_ui_size /
// rg_ui_revision) are generated by the shared crate.
ranger_game::ui_exports!();
