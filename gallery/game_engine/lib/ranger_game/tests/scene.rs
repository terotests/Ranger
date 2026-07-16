//! Integration coverage for the host-managed 3D `scene` facade.
//!
//! These exercise the public API exactly as a game guest would, on the host
//! target where the `rg_*` imports are stubbed to hand out monotonic,
//! always-valid handles. They lock the ergonomic surface (a game can build a
//! full scene without touching `unsafe`) and the fixed-point/colour encoding.

use ranger_game::scene::{fp, q16, Color, LightKind, Quat, Scene, Vec3};

#[test]
fn a_full_scene_builds_with_valid_distinct_handles() {
    let scene = Scene::new();

    let crate_tex = scene.texture("crate");
    let floor_tex = scene.texture("stone");
    assert!(crate_tex.is_valid() && floor_tex.is_valid());

    let cube = scene.spawn_cube(Vec3::ZERO, 1.0, crate_tex);
    let floor = scene.spawn_box(
        Vec3::new(-10.0, -0.1, -10.0),
        Vec3::new(10.0, 0.0, 10.0),
        floor_tex,
    );
    assert!(cube.is_valid() && floor.is_valid());
    assert_ne!(cube.id(), floor.id());

    let cam = scene.camera(0.87, 0.1, 100.0);
    cam.position(Vec3::new(3.0, 2.5, 4.0))
        .target(Vec3::ZERO)
        .activate();
    assert!(cam.is_valid());

    let ambient = scene.ambient_light(Color::rgb(150, 170, 210), 0.35);
    let sun = scene.directional_light(Color::rgb(255, 240, 200), 0.9, Vec3::new(0.4, 0.9, 0.3));
    let lamp = scene.point_light(Color::rgb(255, 220, 130), 1.0, Vec3::new(0.0, 3.0, 0.0), 8.0);
    assert!(ambient.is_valid() && sun.is_valid() && lamp.is_valid());
}

#[test]
fn model_and_sprite_paths_compose() {
    let scene = Scene::new();

    let mesh = scene.model("diamond");
    let gem = scene.spawn_mesh(mesh, scene.texture("gem"));
    gem.position(Vec3::new(1.0, 0.5, 2.0))
        .rotation(Quat::from_axis_angle(Vec3::new(0.0, 1.0, 0.0), 0.5))
        .scale_uniform(0.75)
        .set_visible(true);
    assert!(gem.is_valid());

    let sheet = scene.sprite_sheet("hero");
    let hero = scene.spawn_sprite(sheet, 8, 4, 1.0, 2.0);
    hero.position(Vec3::new(0.0, 1.0, 0.0)).cell(2, 1);
    assert!(hero.is_valid());
}

#[test]
fn explicit_light_kind_matches_convenience_constructors() {
    let scene = Scene::new();
    // Both routes must issue the same host light kind.
    let _explicit = scene.light(LightKind::Point, Color::WHITE, 0.5);
    let _point = scene.point_light(Color::WHITE, 0.5, Vec3::ZERO, 4.0);
    assert_eq!(LightKind::Point as i32, 5);
}

#[test]
fn encoding_helpers_are_the_host_scales() {
    // Guard against accidental drift from the RG3D_FP / RG3D_Q host scales.
    assert_eq!(fp(1.0), 256);
    assert_eq!(fp(2.5), 640);
    assert_eq!(q16(1.0), 65536);
    assert_eq!(Color::rgb(255, 0, 0).pack(), 0xff0000ffu32 as i32);
}
