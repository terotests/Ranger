//! Host resource declaration imports (`rg_host_register_*`).
//!
//! A guest ships no art: inside `declare_resources()` (see
//! [`crate::world::WorldGame::declare_resources`]) it names the spritesheets /
//! rects it wants the host to load and how to slice them. The string ids are
//! the game's own convention — the host maps them to draw calls through the
//! game's scene provider.
//!
//! On non-wasm targets (the crate's own unit tests) these become no-ops so the
//! test binary links without a host.

/// Register a spritesheet: `id` (game convention), asset `path`, frame size,
/// integer downscale, feet/anchor y within the frame, and draw layer.
pub fn sheet(
    id: &str,
    path: &str,
    frame_w: i32,
    frame_h: i32,
    scale: i32,
    feet_y: i32,
    layer: i32,
) {
    imp::sheet(id, path, frame_w, frame_h, scale, feet_y, layer);
}

/// Register a solid rectangle "sprite": `id`, size, RGB color and draw layer.
pub fn rect(id: &str, w: i32, h: i32, r: i32, g: i32, b: i32, layer: i32) {
    imp::rect(id, w, h, r, g, b, layer);
}

#[cfg(target_arch = "wasm32")]
mod imp {
    #[link(wasm_import_module = "env")]
    extern "C" {
        fn rg_host_register_sheet(
            id_ptr: i32,
            id_len: i32,
            path_ptr: i32,
            path_len: i32,
            fw: i32,
            fh: i32,
            scale: i32,
            feet: i32,
            draw_layer: i32,
        );
        fn rg_host_register_rect(
            id_ptr: i32,
            id_len: i32,
            w: i32,
            h: i32,
            r: i32,
            g: i32,
            b: i32,
            draw_layer: i32,
        );
    }

    pub fn sheet(id: &str, path: &str, fw: i32, fh: i32, scale: i32, feet: i32, layer: i32) {
        unsafe {
            rg_host_register_sheet(
                id.as_ptr() as i32,
                id.len() as i32,
                path.as_ptr() as i32,
                path.len() as i32,
                fw,
                fh,
                scale,
                feet,
                layer,
            );
        }
    }

    pub fn rect(id: &str, w: i32, h: i32, r: i32, g: i32, b: i32, layer: i32) {
        unsafe {
            rg_host_register_rect(id.as_ptr() as i32, id.len() as i32, w, h, r, g, b, layer);
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod imp {
    pub fn sheet(_: &str, _: &str, _: i32, _: i32, _: i32, _: i32, _: i32) {}
    pub fn rect(_: &str, _: i32, _: i32, _: i32, _: i32, _: i32, _: i32) {}
}
