//! cube3d_wasm — a lit, textured, spinning cube using the **host-managed 3D
//! scene** (IDEAL_3D Phase H). The guest owns no geometry/camera/light memory:
//! it calls host imports that create host entities and return opaque handles,
//! then per frame sends a rotation. The host owns the scene and renders it.
//!
//! This is the target ownership model (`IDEAL_3D.md` §2, §10): no exported
//! MESH/CAM/LIGHT blocks, no `rg_*_ptr` — only high-level commands + EntityIds.

#![allow(clippy::missing_safety_doc)]
#![allow(static_mut_refs)]

const FP: f32 = 256.0;

// Host imports (provided in-engine by runtime/rg_wasm_bridge.c; IDEAL_3D §4.4).
// Positions are fixed-point * 256; rotation is a quaternion in Q16.16.
#[link(wasm_import_module = "env")]
extern "C" {
    fn rg_load_texture(name_ptr: *const u8, name_len: u32) -> i32;
    fn rg_create_box(x0: i32, y0: i32, z0: i32, x1: i32, y1: i32, z1: i32, tex: i32) -> i32;
    fn rg_create_camera(fovy: i32, near: i32, far: i32) -> i32;
    fn rg_create_light(kind: i32, color: i32, intensity: i32) -> i32;
    fn rg_set_position(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_target(e: i32, x: i32, y: i32, z: i32);
    fn rg_set_rotation(e: i32, qx: i32, qy: i32, qz: i32, qw: i32);
    fn rg_set_active_camera(e: i32);
}

// light kinds (match RGE_* in gfx_sdl.rgr)
const LIGHT_AMBIENT: i32 = 3;
const LIGHT_DIRECTIONAL: i32 = 4;

fn fp(v: f32) -> i32 {
    (v * FP) as i32
}
fn q16(v: f32) -> i32 {
    (v * 65536.0) as i32
}
fn rgba(r: u8, g: u8, b: u8) -> i32 {
    (((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | 0xff) as i32
}

static mut CUBE: i32 = 0;
static mut ANG: f32 = 0.0;

#[no_mangle]
pub extern "C" fn init() {
    unsafe {
        let tex = rg_load_texture("crate".as_ptr(), 5);
        // a 2x2x2 box centred at the origin, textured with the crate
        CUBE = rg_create_box(fp(-1.0), fp(-1.0), fp(-1.0), fp(1.0), fp(1.0), fp(1.0), tex);
        // perspective camera looking at the origin from (3, 2.5, 4)
        let cam = rg_create_camera(fp(0.87), fp(0.1), fp(100.0));
        rg_set_position(cam, fp(3.0), fp(2.5), fp(4.0));
        rg_set_target(cam, 0, 0, 0);
        rg_set_active_camera(cam);
        // cool ambient fill + warm directional sun (dir = position toward light)
        rg_create_light(LIGHT_AMBIENT, rgba(150, 170, 210), fp(0.35));
        let sun = rg_create_light(LIGHT_DIRECTIONAL, rgba(255, 240, 200), fp(0.9));
        rg_set_position(sun, fp(0.4), fp(0.9), fp(0.3));
    }
}

#[no_mangle]
pub extern "C" fn update(_dt_ms: i32, _a: i32, _b: i32, _c: i32, _d: i32) {
    unsafe {
        ANG += 0.02;
        // tumble: rotate about Y by ANG and about X by ANG/2, as a quaternion
        let (sx, cx) = (ANG * 0.25).sin_cos();
        let (sy, cy) = (ANG * 0.5).sin_cos();
        // q = qx(rx) * qy(ry) = (sx*cy, cx*sy, sx*sy, cx*cy)
        rg_set_rotation(CUBE, q16(sx * cy), q16(cx * sy), q16(sx * sy), q16(cx * cy));
    }
}
