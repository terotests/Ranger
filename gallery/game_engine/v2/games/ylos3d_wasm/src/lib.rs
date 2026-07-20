//! ylos3d_wasm — the ylos3d gems, compiled to wasm32.
//!
//! games/ylos3d's signature 3D element is its collectible DIAMONDS (faceted gems
//! the player gathers). This is that, as a wasm32 guest: a row of coloured
//! octahedral gems, each spinning, rendered to a render target that a single pane
//! displays — driven by RgWasmGameHost through the ONE generic bridge, so the SAME
//! host arenas render it on the SDL desktop and in the headless gate.
//!
//! Materials are unlit (basic) flat colours: the software 3D host renders by
//! material colour with no dynamic lighting, so a lit/glass diamond.glb would read
//! black — a cluster of bright, faceted, spinning gems is the faithful look this
//! renderer can actually show. Command ids + wire encoding come from the
//! schema-generated rg_abi.rs.

#![no_std]
#[panic_handler]
fn ph(_: &core::panic::PanicInfo) -> ! { loop {} }

mod rg_abi;
use rg_abi::*;

const MAX_REC: usize = 48;
static mut BUF: [i32; RGC1_HDR + RGC1_WORDS * MAX_REC] = [0; RGC1_HDR + RGC1_WORDS * MAX_REC];
const MAX_ID: usize = 64;
static mut RESULT: [i32; MAX_ID] = [0; MAX_ID];

static mut ANGLE: f32 = 0.0;

const RT_W: i32 = 320;
const RT_H: i32 = 320;

// the ylos3d collectible-gem colours (0x00RRGGBB, unlit flat)
const N: i32 = 5;
const COLORS: [i32; 5] = [0x00FF_5A5A, 0x00FF_B74D, 0x00FF_E24B, 0x0066_CC66, 0x004F_A3FF];

const SCENE: i32 = 1;
const CAMERA: i32 = 2;
const TEX: i32 = 3;
const CAM2D: i32 = 4;
const SPRITE: i32 = 5;
const LAYER: i32 = 6;
// per-gem ids (i in 0..N): mesh = 10+i, geometry = 20+i, material = 30+i
fn mesh_id(i: i32) -> i32 { 10 + i }
fn geo_id(i: i32) -> i32 { 20 + i }
fn mat_id(i: i32) -> i32 { 30 + i }
// x position of gem i, spread across the view
fn gem_x(i: i32) -> f32 { ((i - 2) as f32) * 1.5 }
// a gentle arc so the row reads as a cluster, not a flat line
fn gem_y(i: i32) -> f32 { 0.55 - 0.16 * (((i - 2) * (i - 2)) as f32) }

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 { core::ptr::addr_of!(BUF) as i32 }
#[no_mangle]
pub extern "C" fn result_ptr() -> i32 { core::ptr::addr_of!(RESULT) as i32 }

/// Build the gem cluster + the on-screen composition once.
#[no_mangle]
pub extern "C" fn init() -> i32 {
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rg3d_scene_create(SCENE);
    cb.rg3d_camera_create(CAMERA);
    cb.rg3d_camera_set(CAMERA, 42.0, 1.0, 0.5, 40.0);
    cb.rg3d_camera_pose(CAMERA, 0.0, 0.2, 8.5, 0.0, 0.0, 0.0);

    let mut i = 0;
    while i < N {
        cb.rg3d_geometry_octahedron(geo_id(i), 0.62);
        cb.rg3d_material_basic(mat_id(i), COLORS[i as usize]);
        cb.rg3d_mesh_create(mesh_id(i), geo_id(i), mat_id(i));
        cb.rg3d_mesh_transform(mesh_id(i), gem_x(i), gem_y(i), 0.0, 0.3, 0.4, 0.1);
        cb.rg3d_entity_set_parent(mesh_id(i), SCENE);
        i += 1;
    }

    // on-screen composition: render target -> 2D sprite -> single-pane layer
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

/// Per frame: spin each gem about Y (varying rate) so the cluster shimmers.
#[no_mangle]
pub extern "C" fn update(dt_ms: i32) -> i32 {
    let a = unsafe {
        ANGLE += (dt_ms as f32) * 0.0016;
        ANGLE
    };
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    let mut i = 0;
    while i < N {
        let spin = a * (1.0 + 0.14 * (i as f32));
        cb.rg3d_mesh_transform(mesh_id(i), gem_x(i), gem_y(i), 0.0, 0.3, spin, 0.1);
        i += 1;
    }
    cb.rg3d_render_to(SCENE, CAMERA, TEX, RT_W, RT_H);
    cb.rg2d_render(LAYER, CAM2D, 0);
    cb.finish()
}
