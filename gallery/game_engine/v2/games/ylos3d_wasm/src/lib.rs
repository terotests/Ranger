//! ylos3d_wasm — a v2 game compiled to wasm32, run by RgWasmGameHost the same way
//! RgGameHost runs a .tsx game. It drives the ONE generic bridge via an RGC1
//! command buffer (the generated wasm32 profile), so the SAME host arenas +
//! presenter + framebuffer render it — on the SDL desktop and in the headless
//! gate alike.
//!
//! Lifecycle: `init()` builds the scene once; `update(dt_ms)` emits this frame's
//! commands (here: spin the mesh). Command ids + wire encoding come from the
//! schema-generated `rg_abi.rs` (regenerate via bridge/wasm/tools/gen_rust_abi).

#![no_std]
#[panic_handler]
fn ph(_: &core::panic::PanicInfo) -> ! { loop {} }

mod rg_abi;
use rg_abi::*;

const MAX_REC: usize = 32;
static mut BUF: [i32; RGC1_HDR + RGC1_WORDS * MAX_REC] = [0; RGC1_HDR + RGC1_WORDS * MAX_REC];
const MAX_ID: usize = 64;
static mut RESULT: [i32; MAX_ID] = [0; MAX_ID];

// accumulated rotation (radians), advanced each frame from dt
static mut ANGLE: f32 = 0.0;

// guest-local ids
const SCENE: i32 = 1;
const CAMERA: i32 = 2;
const GEOM: i32 = 3;
const MAT: i32 = 4;
const MESH: i32 = 5;

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 { core::ptr::addr_of!(BUF) as i32 }
#[no_mangle]
pub extern "C" fn result_ptr() -> i32 { core::ptr::addr_of!(RESULT) as i32 }

/// Build the scene once: a lit box mesh parented under the scene, plus a camera.
#[no_mangle]
pub extern "C" fn init() -> i32 {
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rg3d_scene_create(SCENE);
    cb.rg3d_camera_create(CAMERA);
    cb.rg3d_geometry_box(GEOM, 1.2, 1.2, 1.2);
    cb.rg3d_material_lambert(MAT, 0x0066_ccff);
    cb.rg3d_mesh_create(MESH, GEOM, MAT);
    cb.rg3d_entity_set_parent(MESH, SCENE);
    cb.finish()
}

/// Per frame: spin the mesh about Y, proportional to elapsed time.
#[no_mangle]
pub extern "C" fn update(dt_ms: i32) -> i32 {
    let a = unsafe {
        ANGLE += (dt_ms as f32) * 0.0015;
        ANGLE
    };
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rg3d_mesh_transform(MESH, 0.0, 0.0, -4.0, 0.0, a, 0.0);
    cb.finish()
}
