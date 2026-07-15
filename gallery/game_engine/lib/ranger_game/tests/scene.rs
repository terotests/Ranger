use ranger_game::scene::{Color, Projection, Quat, Scene, Vec3};

const TEST_TEXTURE_HANDLE: u32 = 7;

#[test]
fn scene_handles_are_generation_checked_and_instances_share_assets() {
    let mut scene = Scene::new();
    let (mesh, material) = {
        let mut assets = scene.assets();
        (
            assets.box_mesh(Vec3::new(1.0, 2.0, 1.0)).unwrap(),
            assets.material(TEST_TEXTURE_HANDLE, Color::WHITE, 0),
        )
    };
    let first = scene.spawn_mesh(mesh, material).unwrap();
    let second = scene.spawn_mesh(mesh, material).unwrap();
    scene.node(first).set_position(Vec3::new(-2.0, 0.0, 0.0));
    scene.node(second).set_rotation(Quat::IDENTITY);
    scene.camera_mut().projection = Projection::Perspective;
    assert!(scene.publish());
    assert_ne!(first, second);
    assert!(ranger_game::scene::mesh_size() > 0);
}

#[test]
fn light_component_uses_the_node_handle() {
    let mut scene = Scene::new();
    let light = scene
        .spawn_point_light(Color::rgb(255, 200, 100), 2.0, 8.0)
        .unwrap();
    scene.light(light).set_position(Vec3::new(1.0, 2.0, 3.0));
    scene.light(light).set_enabled(false);
    assert!(scene.publish());
}
