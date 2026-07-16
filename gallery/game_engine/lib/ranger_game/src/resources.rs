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

/// The basenames the host preloaded for one resource kind, in host order.
///
/// Yields each name as a `&str`; names are never partial — see [`list`].
pub struct Resources<'a> {
    data: &'a [u8],
    pos: usize,
    /// Byte size the host's *full* list needs. Greater than the buffer passed to
    /// [`list`] means the tail did not fit and is not reported.
    pub needed: usize,
}

impl<'a> Resources<'a> {
    /// True when the buffer was too small to hold every name.
    pub fn truncated(&self) -> bool {
        self.needed > self.data.len()
    }
}

impl<'a> Iterator for Resources<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<&'a str> {
        let start = self.pos;
        if start >= self.data.len() {
            return None;
        }
        let mut i = start;
        while i < self.data.len() && self.data[i] != 0 {
            i += 1;
        }
        // An empty name terminates the written region; an unterminated tail is a
        // partial name we must not hand back.
        if i == start || i >= self.data.len() {
            self.pos = self.data.len();
            return None;
        }
        self.pos = i + 1;
        core::str::from_utf8(&self.data[start..i]).ok()
    }
}

/// Parse a NUL-separated name blob of the shape the host writes. Split out from
/// [`list`] so the same parser can be exercised off-wasm.
pub fn parse(buf: &[u8], needed: usize) -> Resources<'_> {
    let avail = if needed < buf.len() { needed } else { buf.len() };
    Resources {
        data: &buf[..avail],
        pos: 0,
        needed,
    }
}

/// Ask the host which resources it preloaded for `kind` — `"models"` for
/// `<game>/models/*.glb`, `"sprites"` for `<game>/sprites/*.png` — so a guest can
/// discover its assets instead of hardcoding their names.
///
/// The host fills `buf` with NUL-separated basenames, in its own (alphabetical)
/// order. Only names that fit whole are written, so every yielded name is
/// complete; if the list outgrows `buf` the iterator reports
/// [`Resources::truncated`] and `needed`, and you can retry with a larger buffer.
///
/// ```ignore
/// let mut buf = [0u8; 2048];
/// for name in resources::list("models", &mut buf) {
///     let mesh = scene::load_model(name);
/// }
/// ```
pub fn list<'a>(kind: &str, buf: &'a mut [u8]) -> Resources<'a> {
    let needed = imp::list(kind, buf);
    parse(buf, needed)
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
        fn rg_list_resources(kind_ptr: i32, kind_len: i32, out_ptr: i32, out_cap: i32) -> i32;
    }

    pub fn list(kind: &str, buf: &mut [u8]) -> usize {
        let n = unsafe {
            rg_list_resources(
                kind.as_ptr() as i32,
                kind.len() as i32,
                buf.as_mut_ptr() as i32,
                buf.len() as i32,
            )
        };
        if n < 0 {
            0
        } else {
            n as usize
        }
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
    pub fn list(_: &str, _: &mut [u8]) -> usize {
        0
    }
}
