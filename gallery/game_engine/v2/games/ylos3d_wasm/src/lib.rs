//! ylos3d_wasm — a v2 game compiled to wasm32, run by RgWasmGameHost the same way
//! RgGameHost runs a .tsx game. It drives the ONE generic bridge via an RGC1
//! command buffer (the generated wasm32 profile), so the SAME host arenas +
//! presenter + framebuffer render it — on the SDL desktop and in the headless
//! gate alike.
//!
//! Lifecycle: `init()` builds the scene AND the on-screen composition once;
//! `update(dt_ms)` emits this frame's commands (spin the mesh, re-render the 3D
//! into the render target, draw that render target into the pane).
//!
//! Presentation mirrors the .tsx ylos3d: the 3D scene renders to a render target
//! (rgcore_graphics_rt_create + rg3d_render_to), a 2D sprite samples that target
//! (rg2d_sprite_create_tex), and a single-pane layer draws the sprite (rg2d_render)
//! so Rg2DPresenter composites it into the framebuffer. No engine changes — every
//! command id + wire encoding comes from the schema-generated `rg_abi.rs`
//! (regenerate via bridge/wasm/tools/gen_rust_abi).

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

// render-target (== on-screen sprite) pixel size
const RT_W: i32 = 200;
const RT_H: i32 = 200;

// guest-local ids
const SCENE: i32 = 1;
const CAMERA: i32 = 2; // 3D camera
const GEOM: i32 = 3;
const MAT: i32 = 4;
const MESH: i32 = 5;
const TEX: i32 = 6; // render target
const CAM2D: i32 = 7; // 2D camera for the pane
const SPRITE: i32 = 8; // 2D sprite sampling the render target
const LAYER: i32 = 9; // 2D layer holding the sprite

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 { core::ptr::addr_of!(BUF) as i32 }
#[no_mangle]
pub extern "C" fn result_ptr() -> i32 { core::ptr::addr_of!(RESULT) as i32 }

/// Build the scene and the on-screen composition once.
#[no_mangle]
pub extern "C" fn init() -> i32 {
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    // 3D scene: a spinning octahedron ("diamond"), unlit flat colour so it is
    // visible without a light (which keeps the scene to a single entity).
    cb.rg3d_scene_create(SCENE);
    cb.rg3d_camera_create(CAMERA);
    cb.rg3d_camera_set(CAMERA, 35.0, 1.0, 0.1, 20.0);
    cb.rg3d_camera_pose(CAMERA, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0);
    cb.rg3d_geometry_octahedron(GEOM, 1.0);
    cb.rg3d_material_basic(MAT, 0x0033_CCFF);
    cb.rg3d_mesh_create(MESH, GEOM, MAT);
    cb.rg3d_entity_set_parent(MESH, SCENE);
    // On-screen composition: render target -> 2D sprite -> single-pane layer.
    cb.rgcore_graphics_rt_create(TEX, RT_W, RT_H);
    cb.rg2d_sprite_create_tex(SPRITE, TEX);
    cb.rg2d_sprite_set_size(SPRITE, RT_W as f32, RT_H as f32);
    cb.rg2d_sprite_set_pos(SPRITE, 0.0, 0.0);
    cb.rg2d_sprite_set_z(SPRITE, 5);
    cb.rg2d_camera_create(CAM2D);
    cb.rg2d_camera_set(CAM2D, 0.0, 0.0, 1.0, 0.0);
    cb.rg2d_layer_create(LAYER);
    cb.rg2d_layer_add(SPRITE, LAYER); // rg2d_layer_add(sprite, layer)
    cb.rgcore_surface_set_layout(0); // single full pane
    cb.finish()
}

/// Per frame: spin the mesh, re-render the 3D into the target, draw it to the pane.
#[no_mangle]
pub extern "C" fn update(dt_ms: i32) -> i32 {
    let a = unsafe {
        ANGLE += (dt_ms as f32) * 0.0015;
        ANGLE
    };
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rg3d_mesh_transform(MESH, 0.0, 0.0, 0.0, a * 0.5, a, 0.0);
    cb.rg3d_render_to(SCENE, CAMERA, TEX, RT_W, RT_H);
    cb.rg2d_render(LAYER, CAM2D, 0);
    cb.finish()
}
