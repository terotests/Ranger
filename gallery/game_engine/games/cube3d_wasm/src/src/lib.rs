//! cube3d_wasm — a lit, textured, spinning cube on the **host-managed 3D
//! scene** (IDEAL_3D Phase H). The guest owns no geometry/camera/light memory:
//! it asks the host to create entities and holds the opaque handles, then per
//! frame sends a rotation. The host owns the scene and renders it.
//!
//! This is the target ownership model (`IDEAL_3D.md` §2, §10): no exported
//! MESH/CAM/LIGHT blocks, no `rg_*_ptr` — only high-level commands + EntityIds.
//! All of the byte plumbing (fixed-point conversion, the `rg_*` imports, the
//! opaque handles) lives once in [`ranger_game::scene`]; this guest is just the
//! scene it wants.

#![allow(static_mut_refs)]

use ranger_game::scene::{Color, Entity, Quat, Scene, Vec3};

static mut CUBE: Entity = Entity::NONE;
static mut ANG: f32 = 0.0;

#[no_mangle]
pub extern "C" fn init() {
    let scene = Scene::new();

    // a 2x2x2 box centred at the origin, textured with the crate
    let tex = scene.texture("crate");
    let cube = scene.spawn_cube(Vec3::ZERO, 1.0, tex);

    // perspective camera looking at the origin from (3, 2.5, 4)
    scene
        .camera(0.87, 0.1, 100.0)
        .position(Vec3::new(3.0, 2.5, 4.0))
        .target(Vec3::ZERO)
        .activate();

    // cool ambient fill + warm directional sun (dir points toward the light)
    scene.ambient_light(Color::rgb(150, 170, 210), 0.35);
    scene.directional_light(Color::rgb(255, 240, 200), 0.9, Vec3::new(0.4, 0.9, 0.3));

    unsafe {
        CUBE = cube;
    }
}

#[no_mangle]
pub extern "C" fn update(_dt_ms: i32, _a: i32, _b: i32, _c: i32, _d: i32) {
    unsafe {
        ANG += 0.02;
        // tumble: rotate about Y by ANG, then about X by ANG/2
        let tumble =
            Quat::from_axis_angle(Vec3::X, ANG * 0.5) * Quat::from_axis_angle(Vec3::Y, ANG);
        CUBE.rotation(tumble);
    }
}
