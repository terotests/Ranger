//! model_viewer_wasm — a Tests-section 3D model browser on the host-managed
//! scene (IDEAL_3D Phase H). The host preloads every `models/*.glb` (through the
//! model3d loader) and registers each under its basename; this guest loads them
//! by name, places one mesh entity per model at the origin, shows one at a time,
//! and cycles the visible model with the **left / right** arrows. It slowly spins
//! the current model so its facets catch the light.
//!
//! The guest owns only which model is shown; the host owns the meshes, textures,
//! camera, lights, and rendering — the guest holds opaque EntityIds.
//!
//! Input (host → guest): update(dt_ms, forward, strafe, turn, jump).
//!   turn = +1 (right arrow) → next model, -1 (left arrow) → previous model.

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

use core::cell::UnsafeCell;

const FP: f32 = 256.0;

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

fn fx(v: f32) -> i32 {
    (v * FP) as i32
}
fn q16(v: f32) -> i32 {
    (v * 65536.0) as i32
}
fn rgba(r: u8, g: u8, b: u8) -> i32 {
    (((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | 0xff) as i32
}

const N: usize = 4;
// model basenames — must match models/*.glb minus the extension.
const NAMES: [&str; N] = ["Box", "BoxTextured", "BoxVertexColors", "Duck"];

struct Viewer {
    ents: [i32; N],
    cam: i32,
    cur: usize,
    t: f32,
    turn_prev: i32,
    ready: bool,
}
struct VCell(UnsafeCell<Viewer>);
unsafe impl Sync for VCell {}
static V: VCell = VCell(UnsafeCell::new(Viewer {
    ents: [0; N],
    cam: 0,
    cur: 0,
    t: 0.0,
    turn_prev: 0,
    ready: false,
}));
fn viewer() -> &'static mut Viewer {
    unsafe { &mut *V.0.get() }
}

fn set_visible(v: &Viewer, i: usize, on: bool) {
    if v.ents[i] > 0 {
        unsafe { rg_set_visible(v.ents[i], if on { 1 } else { 0 }) };
    }
}

fn switch(v: &mut Viewer, dir: i32) {
    set_visible(v, v.cur, false);
    let n = N as i32;
    let mut c = v.cur as i32 + dir;
    if c < 0 {
        c += n;
    }
    if c >= n {
        c -= n;
    }
    v.cur = c as usize;
    set_visible(v, v.cur, true);
}

#[no_mangle]
pub extern "C" fn init() {
    let v = viewer();
    v.t = 0.0;
    v.cur = 0;
    v.turn_prev = 0;
    unsafe {
        // camera framing the origin from slightly above and in front
        v.cam = rg_create_camera(fx(0.9), fx(0.1), fx(100.0));
        rg_set_position(v.cam, fx(0.0), fx(0.9), fx(2.6));
        rg_set_target(v.cam, fx(0.0), fx(0.0), fx(0.0));
        rg_set_active_camera(v.cam);
        // ambient fill + a key directional light
        rg_create_light(LIGHT_AMBIENT, rgba(150, 160, 190), fx(0.55));
        let sun = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 245, 225), fx(0.9));
        rg_set_position(sun, fx(0.4), fx(0.9), fx(0.5));
        // one entity per model at the origin; only the first is visible
        let mut i = 0usize;
        while i < N {
            let name = NAMES[i];
            let mesh = rg_load_model(name.as_ptr(), name.len() as u32);
            let e = rg_create_mesh_entity(mesh, 0);
            v.ents[i] = e;
            rg_set_position(e, fx(0.0), fx(0.0), fx(0.0));
            rg_set_visible(e, if i == 0 { 1 } else { 0 });
            i += 1;
        }
    }
    v.ready = true;
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, _forward: i32, _strafe: i32, turn: i32, _jump: i32) {
    let v = viewer();
    if !v.ready {
        return;
    }
    let dt = (dt_ms.max(1) as f32) / 1000.0;
    v.t += dt;
    // left/right arrow edge → switch model (one step per press)
    if turn > 0 && v.turn_prev <= 0 {
        switch(v, 1);
    } else if turn < 0 && v.turn_prev >= 0 {
        switch(v, -1);
    }
    v.turn_prev = turn;
    // spin the current model around Y
    let half = v.t * 0.4;
    let e = v.ents[v.cur];
    if e > 0 {
        unsafe { rg_set_rotation(e, 0, q16(half.sin()), 0, q16(half.cos())) };
    }
}

/// Index of the currently shown model — lets a headless host/test read the state.
#[no_mangle]
pub extern "C" fn current_index() -> i32 {
    viewer().cur as i32
}
