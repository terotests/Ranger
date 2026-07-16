//! High-level, host-managed 3D scene API (the `rg_*` scene imports).
//!
//! This module is the Rust counterpart to the host-managed 3D object model
//! (`IDEAL_3D.md` §2/§4.4, implemented in `runtime/rg_wasm_bridge.c` +
//! `gfx_sdl.rgr`). Ranger owns the scene graph, the entity registry, and every
//! GPU resource; the guest only issues creation/mutation *commands* and holds
//! the opaque [`Entity`] handles they return. There is **no** guest-authored
//! geometry block here — no `RGMB`/`RGMA`/`RGCM`/`RGLT`, no `rg_*_ptr` exports.
//! That legacy "guest publishes a scene block" model is gone from every shipped
//! 3D guest; this facade targets the model they all actually use.
//!
//! ```ignore
//! use ranger_game::scene::{Color, Scene, Vec3};
//!
//! let scene = Scene::new();
//! let crate_tex = scene.texture("crate");
//! let cube = scene.spawn_cube(Vec3::ZERO, 1.0, crate_tex);
//!
//! let cam = scene.camera(0.87, 0.1, 100.0);
//! cam.position(Vec3::new(3.0, 2.5, 4.0)).target(Vec3::ZERO).activate();
//!
//! scene.ambient_light(Color::rgb(150, 170, 210), 0.35);
//! scene
//!     .directional_light(Color::rgb(255, 240, 200), 0.9, Vec3::new(0.4, 0.9, 0.3));
//! ```
//!
//! ## Units (matching the host bridge)
//!
//! The host divides every incoming coordinate/scalar by 256 (`RG3D_FP`) and
//! every quaternion component by 65536 (`RG3D_Q`). This module owns that
//! conversion so guests work in plain `f32` world units:
//!
//! - positions, box extents, camera planes, scale, target, range, intensity →
//!   world units (`fp`, ×256 fixed-point on the wire)
//! - rotations → unit quaternion (`q16`, Q16.16 on the wire)
//! - colours → 8-bit RGBA packed as `0xRRGGBBAA`
//!
//! Layering: like the rest of this crate, `scene` is a TRANSPORT. It mirrors
//! the byte/argument contract of the host imports and stays game-neutral — no
//! game constants, no frozen taxonomies. What the entities *mean* is the game's.

/// Shared fixed-point scale (`RG3D_FP` in the host bridge): world units are
/// multiplied by this before crossing the ABI as integers.
pub const FP: f32 = 256.0;

/// Quaternion fixed-point scale (`RG3D_Q` in the host bridge): Q16.16.
pub const Q16: f32 = 65536.0;

/// Encode a world-unit scalar as the host's ×256 fixed-point integer.
#[inline]
pub fn fp(v: f32) -> i32 {
    (v * FP) as i32
}

/// Encode a quaternion component as the host's Q16.16 fixed-point integer.
#[inline]
pub fn q16(v: f32) -> i32 {
    (v * Q16) as i32
}

/// A three-dimensional vector in world units.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    /// The zero vector / world origin.
    pub const ZERO: Self = Self {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };
    /// Unit vector along +X.
    pub const X: Self = Self::new(1.0, 0.0, 0.0);
    /// Unit vector along +Y.
    pub const Y: Self = Self::new(0.0, 1.0, 0.0);
    /// Unit vector along +Z.
    pub const Z: Self = Self::new(0.0, 0.0, 1.0);

    #[inline]
    pub const fn new(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z }
    }

    /// A uniform vector with every component set to `v`.
    #[inline]
    pub const fn splat(v: f32) -> Self {
        Self { x: v, y: v, z: v }
    }

    #[inline]
    pub fn dot(self, o: Self) -> f32 {
        self.x * o.x + self.y * o.y + self.z * o.z
    }

    #[inline]
    pub fn cross(self, o: Self) -> Self {
        Self {
            x: self.y * o.z - self.z * o.y,
            y: self.z * o.x - self.x * o.z,
            z: self.x * o.y - self.y * o.x,
        }
    }

    #[inline]
    pub fn length(self) -> f32 {
        libm_sqrt(self.dot(self))
    }

    /// Return this vector scaled to unit length. A zero vector is returned
    /// unchanged (there is no meaningful direction to normalise to).
    #[inline]
    pub fn normalized(self) -> Self {
        let len = self.length();
        if len > 0.0 {
            self * (1.0 / len)
        } else {
            self
        }
    }
}

impl core::ops::Add for Vec3 {
    type Output = Vec3;
    #[inline]
    fn add(self, o: Vec3) -> Vec3 {
        Vec3::new(self.x + o.x, self.y + o.y, self.z + o.z)
    }
}

impl core::ops::Sub for Vec3 {
    type Output = Vec3;
    #[inline]
    fn sub(self, o: Vec3) -> Vec3 {
        Vec3::new(self.x - o.x, self.y - o.y, self.z - o.z)
    }
}

impl core::ops::Mul<f32> for Vec3 {
    type Output = Vec3;
    #[inline]
    fn mul(self, s: f32) -> Vec3 {
        Vec3::new(self.x * s, self.y * s, self.z * s)
    }
}

impl core::ops::Neg for Vec3 {
    type Output = Vec3;
    #[inline]
    fn neg(self) -> Vec3 {
        Vec3::new(-self.x, -self.y, -self.z)
    }
}

/// A unit quaternion. The default is the identity rotation.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Quat {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32,
}

impl Quat {
    /// The identity rotation.
    pub const IDENTITY: Self = Self {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        w: 1.0,
    };

    #[inline]
    pub const fn new(x: f32, y: f32, z: f32, w: f32) -> Self {
        Self { x, y, z, w }
    }

    /// Build a rotation of `angle` radians about `axis` (which need not be
    /// normalised).
    pub fn from_axis_angle(axis: Vec3, angle: f32) -> Self {
        let axis = axis.normalized();
        let half = angle * 0.5;
        let s = libm_sin(half);
        Self {
            x: axis.x * s,
            y: axis.y * s,
            z: axis.z * s,
            w: libm_cos(half),
        }
    }

    /// The Hamilton product `self * rhs` — the rotation that applies `rhs`
    /// first, then `self`.
    #[inline]
    pub fn mul(self, rhs: Quat) -> Quat {
        Quat {
            w: self.w * rhs.w - self.x * rhs.x - self.y * rhs.y - self.z * rhs.z,
            x: self.w * rhs.x + self.x * rhs.w + self.y * rhs.z - self.z * rhs.y,
            y: self.w * rhs.y - self.x * rhs.z + self.y * rhs.w + self.z * rhs.x,
            z: self.w * rhs.z + self.x * rhs.y - self.y * rhs.x + self.z * rhs.w,
        }
    }
}

impl core::ops::Mul for Quat {
    type Output = Quat;
    #[inline]
    fn mul(self, rhs: Quat) -> Quat {
        Quat::mul(self, rhs)
    }
}

impl Default for Quat {
    #[inline]
    fn default() -> Self {
        Self::IDENTITY
    }
}

/// An 8-bit RGBA colour. Alpha defaults to fully opaque via [`Color::rgb`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub const WHITE: Self = Self::rgb(255, 255, 255);
    pub const BLACK: Self = Self::rgb(0, 0, 0);

    /// An opaque colour from 8-bit channels.
    #[inline]
    pub const fn rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 255 }
    }

    /// A colour with an explicit alpha channel.
    #[inline]
    pub const fn rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    /// Pack to the host's `0xRRGGBBAA` word.
    #[inline]
    pub const fn pack(self) -> i32 {
        (((self.r as u32) << 24)
            | ((self.g as u32) << 16)
            | ((self.b as u32) << 8)
            | (self.a as u32)) as i32
    }
}

/// The kind of a light source. The values match the host's `RGE_*` light
/// codes; only these three are rendered.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(i32)]
pub enum LightKind {
    Ambient = 3,
    Directional = 4,
    Point = 5,
}

/// A loaded GPU texture (from [`Scene::texture`] or [`Scene::sprite_sheet`]).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Texture(i32);

impl Texture {
    #[inline]
    pub fn id(self) -> i32 {
        self.0
    }
    /// Whether the host resolved the named resource (`> 0`).
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0 > 0
    }
}

/// A loaded mesh asset (from [`Scene::model`]). Instantiate it into the scene
/// with [`Scene::spawn_mesh`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Model(i32);

impl Model {
    #[inline]
    pub fn id(self) -> i32 {
        self.0
    }
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0 > 0
    }
}

/// An opaque, host-issued scene entity handle.
///
/// The guest never constructs or does arithmetic on the underlying id — it is
/// allocated, validated, and recycled by Ranger (`IDEAL_3D.md` §2.2). Store it
/// in your own game state and key gameplay data off it.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Entity(i32);

impl Entity {
    /// The null handle — a placeholder for "no entity yet". Not a valid host
    /// entity; [`Entity::is_valid`] returns `false`. Useful for `static`
    /// initialisers before `init()` runs.
    pub const NONE: Self = Self(0);

    /// The raw host handle. Only useful for logging.
    #[inline]
    pub fn id(self) -> i32 {
        self.0
    }

    /// Whether the host allocated a real entity (`> 0`). Creation can fail if
    /// the host scene is at capacity.
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0 > 0
    }

    /// Set the world-space position.
    #[inline]
    pub fn position(self, p: Vec3) -> Self {
        imp::set_position(self.0, fp(p.x), fp(p.y), fp(p.z));
        self
    }

    /// Set the rotation.
    #[inline]
    pub fn rotation(self, q: Quat) -> Self {
        imp::set_rotation(self.0, q16(q.x), q16(q.y), q16(q.z), q16(q.w));
        self
    }

    /// Set a non-uniform scale.
    #[inline]
    pub fn scale(self, s: Vec3) -> Self {
        imp::set_scale(self.0, fp(s.x), fp(s.y), fp(s.z));
        self
    }

    /// Set a uniform scale.
    #[inline]
    pub fn scale_uniform(self, s: f32) -> Self {
        self.scale(Vec3::splat(s))
    }

    /// Show or hide the entity without destroying it.
    #[inline]
    pub fn set_visible(self, on: bool) -> Self {
        imp::set_visible(self.0, on as i32);
        self
    }

    /// Enable or disable the entity (e.g. a light).
    #[inline]
    pub fn set_enabled(self, on: bool) -> Self {
        imp::set_enabled(self.0, on as i32);
        self
    }
}

/// A camera entity. Wraps an [`Entity`]; adds aiming and activation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Camera(Entity);

impl Camera {
    /// The underlying entity handle (for transforms shared with meshes).
    #[inline]
    pub fn entity(self) -> Entity {
        self.0
    }
    #[inline]
    pub fn id(self) -> i32 {
        self.0 .0
    }
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0.is_valid()
    }

    /// Move the eye to `p`.
    #[inline]
    pub fn position(self, p: Vec3) -> Self {
        self.0.position(p);
        self
    }

    /// Aim the camera at world point `t`.
    #[inline]
    pub fn target(self, t: Vec3) -> Self {
        imp::set_target(self.0 .0, fp(t.x), fp(t.y), fp(t.z));
        self
    }

    /// Make this the scene's active camera.
    #[inline]
    pub fn activate(self) -> Self {
        imp::set_active_camera(self.0 .0);
        self
    }
}

/// A light entity. Wraps an [`Entity`]; adds direction/range helpers.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Light(Entity);

impl Light {
    #[inline]
    pub fn entity(self) -> Entity {
        self.0
    }
    #[inline]
    pub fn id(self) -> i32 {
        self.0 .0
    }
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0.is_valid()
    }

    /// Set a directional light's direction (stored in the host as the light's
    /// position vector).
    #[inline]
    pub fn direction(self, dir: Vec3) -> Self {
        self.0.position(dir);
        self
    }

    /// Set a point light's world position.
    #[inline]
    pub fn position(self, p: Vec3) -> Self {
        self.0.position(p);
        self
    }

    /// Set a point light's falloff range in world units.
    #[inline]
    pub fn range(self, r: f32) -> Self {
        imp::set_range(self.0 .0, fp(r));
        self
    }

    #[inline]
    pub fn set_enabled(self, on: bool) -> Self {
        self.0.set_enabled(on);
        self
    }
}

/// A billboard sprite entity (a camera-facing quad from a sprite sheet).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Sprite(Entity);

impl Sprite {
    #[inline]
    pub fn entity(self) -> Entity {
        self.0
    }
    #[inline]
    pub fn id(self) -> i32 {
        self.0 .0
    }
    #[inline]
    pub fn is_valid(self) -> bool {
        self.0.is_valid()
    }

    /// Move the sprite to `p`.
    #[inline]
    pub fn position(self, p: Vec3) -> Self {
        self.0.position(p);
        self
    }

    /// Show or hide the sprite.
    #[inline]
    pub fn set_visible(self, on: bool) -> Self {
        self.0.set_visible(on);
        self
    }

    /// Choose which cell of the sprite sheet to display.
    #[inline]
    pub fn cell(self, col: i32, row: i32) -> Self {
        imp::set_sprite_cell(self.0 .0, col, row);
        self
    }
}

/// The host-managed 3D scene facade.
///
/// A zero-sized handle: every method issues a host command immediately, so a
/// `Scene` is just an ergonomic namespace over the `rg_*` imports. Create one
/// with [`Scene::new`] and keep it wherever convenient.
#[derive(Clone, Copy, Debug, Default)]
pub struct Scene {
    _priv: (),
}

impl Scene {
    /// Obtain the scene facade.
    #[inline]
    pub const fn new() -> Self {
        Self { _priv: () }
    }

    // ---- resources -------------------------------------------------------

    /// Resolve a preloaded texture by name (as declared in the game manifest /
    /// enumerated via [`crate::resources`]).
    #[inline]
    pub fn texture(&self, name: &str) -> Texture {
        Texture(imp::load_texture(name))
    }

    /// Resolve a preloaded GLB mesh asset by name.
    #[inline]
    pub fn model(&self, name: &str) -> Model {
        Model(imp::load_model(name))
    }

    /// Resolve a preloaded sprite sheet by name, returning its texture handle.
    #[inline]
    pub fn sprite_sheet(&self, name: &str) -> Texture {
        Texture(imp::load_sprite(name))
    }

    // ---- geometry --------------------------------------------------------

    /// Spawn an axis-aligned box spanning `min..max`, textured with `tex`.
    #[inline]
    pub fn spawn_box(&self, min: Vec3, max: Vec3, tex: Texture) -> Entity {
        Entity(imp::create_box(
            fp(min.x),
            fp(min.y),
            fp(min.z),
            fp(max.x),
            fp(max.y),
            fp(max.z),
            tex.0,
        ))
    }

    /// Spawn a cube of side `2 * half` centred on `center`.
    #[inline]
    pub fn spawn_cube(&self, center: Vec3, half: f32, tex: Texture) -> Entity {
        let h = Vec3::splat(half);
        self.spawn_box(center - h, center + h, tex)
    }

    /// Instantiate a loaded [`Model`] as a scene entity, overriding its texture
    /// with `tex` (pass a zero/invalid [`Texture`] to keep the model's own
    /// materials).
    #[inline]
    pub fn spawn_mesh(&self, model: Model, tex: Texture) -> Entity {
        Entity(imp::create_mesh_entity(model.0, tex.0))
    }

    /// Spawn a billboard sprite from a sheet: `cols`×`rows` cells, quad size
    /// `w`×`h` world units.
    #[inline]
    pub fn spawn_sprite(&self, tex: Texture, cols: i32, rows: i32, w: f32, h: f32) -> Sprite {
        Sprite(Entity(imp::create_sprite(tex.0, cols, rows, fp(w), fp(h))))
    }

    // ---- camera ----------------------------------------------------------

    /// Create a perspective camera (`fovy` in radians, `near`/`far` planes in
    /// world units). It is not active until you call [`Camera::activate`].
    #[inline]
    pub fn camera(&self, fovy: f32, near: f32, far: f32) -> Camera {
        Camera(Entity(imp::create_camera(fp(fovy), fp(near), fp(far))))
    }

    /// Make `cam` the active camera (equivalent to [`Camera::activate`]).
    #[inline]
    pub fn set_active_camera(&self, cam: Camera) {
        imp::set_active_camera(cam.0 .0);
    }

    // ---- lights ----------------------------------------------------------

    /// Add uniform ambient fill light.
    #[inline]
    pub fn ambient_light(&self, color: Color, intensity: f32) -> Light {
        self.light(LightKind::Ambient, color, intensity)
    }

    /// Add a directional (sun) light shining along `dir`.
    #[inline]
    pub fn directional_light(&self, color: Color, intensity: f32, dir: Vec3) -> Light {
        let l = self.light(LightKind::Directional, color, intensity);
        l.direction(dir);
        l
    }

    /// Add a point light at `pos` with falloff `range`.
    #[inline]
    pub fn point_light(&self, color: Color, intensity: f32, pos: Vec3, range: f32) -> Light {
        let l = self.light(LightKind::Point, color, intensity);
        l.position(pos).range(range);
        l
    }

    /// Create a light of an explicit [`LightKind`] without positioning it.
    #[inline]
    pub fn light(&self, kind: LightKind, color: Color, intensity: f32) -> Light {
        Light(Entity(imp::create_light(
            kind as i32,
            color.pack(),
            fp(intensity),
        )))
    }
}

// ---------------------------------------------------------------------------
// Tiny no_std math helpers. These wrap the platform intrinsics on wasm and fall
// back to a small polynomial/Newton implementation elsewhere so host `cargo
// test` needs no `libm` dependency.
// ---------------------------------------------------------------------------

/// Square root without libm. `f32::sqrt` lives in `std`, not `core`, so a
/// `no_std` crate cannot call it on any target; Newton–Raphson keeps this
/// dependency-free and is more than precise enough for direction vectors.
#[inline]
fn libm_sqrt(v: f32) -> f32 {
    if v <= 0.0 {
        return 0.0;
    }
    // Seed at least 1.0 so the iteration converges quickly for small inputs.
    let mut x = if v > 1.0 { v } else { 1.0 };
    let mut i = 0;
    while i < 24 {
        x = 0.5 * (x + v / x);
        i += 1;
    }
    x
}

#[inline]
fn libm_sin(a: f32) -> f32 {
    let (s, _) = sin_cos(a);
    s
}

#[inline]
fn libm_cos(a: f32) -> f32 {
    let (_, c) = sin_cos(a);
    c
}

/// Minimal `sin`/`cos` via range reduction + Taylor series (no_std, no libm).
/// Accurate to well within what the ×65536 quaternion quantisation preserves.
fn sin_cos(a: f32) -> (f32, f32) {
    const PI: f32 = core::f32::consts::PI;
    const TWO_PI: f32 = 2.0 * PI;
    // Reduce to [-pi, pi].
    let mut x = a % TWO_PI;
    if x > PI {
        x -= TWO_PI;
    } else if x < -PI {
        x += TWO_PI;
    }
    let x2 = x * x;
    // sin: x - x^3/6 + x^5/120 - x^7/5040 + x^9/362880
    let sin = x
        * (1.0 - x2 / 6.0 + x2 * x2 / 120.0 - x2 * x2 * x2 / 5040.0
            + x2 * x2 * x2 * x2 / 362880.0);
    // cos: 1 - x^2/2 + x^4/24 - x^6/720 + x^8/40320
    let cos = 1.0 - x2 / 2.0 + x2 * x2 / 24.0 - x2 * x2 * x2 / 720.0
        + x2 * x2 * x2 * x2 / 40320.0;
    (sin, cos)
}

// ---------------------------------------------------------------------------
// Host-import seam. On wasm32 these are the real `env.rg_*` scene commands; on
// every other target they are no-op stubs returning monotonically increasing
// handles so the crate builds and `cargo test` can exercise the full API.
// ---------------------------------------------------------------------------

#[cfg(target_arch = "wasm32")]
mod imp {
    #[link(wasm_import_module = "env")]
    extern "C" {
        fn rg_load_texture(name_ptr: *const u8, name_len: u32) -> i32;
        fn rg_load_model(name_ptr: *const u8, name_len: u32) -> i32;
        fn rg_load_sprite(name_ptr: *const u8, name_len: u32) -> i32;
        fn rg_create_box(
            x0: i32,
            y0: i32,
            z0: i32,
            x1: i32,
            y1: i32,
            z1: i32,
            tex: i32,
        ) -> i32;
        fn rg_create_mesh_entity(mesh: i32, tex: i32) -> i32;
        fn rg_create_sprite(tex: i32, cols: i32, rows: i32, w: i32, h: i32) -> i32;
        fn rg_set_sprite_cell(e: i32, col: i32, row: i32);
        fn rg_create_camera(fovy: i32, near: i32, far: i32) -> i32;
        fn rg_create_light(kind: i32, color: i32, intensity: i32) -> i32;
        fn rg_set_position(e: i32, x: i32, y: i32, z: i32);
        fn rg_set_rotation(e: i32, qx: i32, qy: i32, qz: i32, qw: i32);
        fn rg_set_scale(e: i32, sx: i32, sy: i32, sz: i32);
        fn rg_set_target(e: i32, x: i32, y: i32, z: i32);
        fn rg_set_range(e: i32, r: i32);
        fn rg_set_enabled(e: i32, on: i32);
        fn rg_set_visible(e: i32, on: i32);
        fn rg_set_active_camera(e: i32);
    }

    #[inline]
    pub fn load_texture(name: &str) -> i32 {
        unsafe { rg_load_texture(name.as_ptr(), name.len() as u32) }
    }
    #[inline]
    pub fn load_model(name: &str) -> i32 {
        unsafe { rg_load_model(name.as_ptr(), name.len() as u32) }
    }
    #[inline]
    pub fn load_sprite(name: &str) -> i32 {
        unsafe { rg_load_sprite(name.as_ptr(), name.len() as u32) }
    }
    #[inline]
    #[allow(clippy::too_many_arguments)]
    pub fn create_box(x0: i32, y0: i32, z0: i32, x1: i32, y1: i32, z1: i32, tex: i32) -> i32 {
        unsafe { rg_create_box(x0, y0, z0, x1, y1, z1, tex) }
    }
    #[inline]
    pub fn create_mesh_entity(mesh: i32, tex: i32) -> i32 {
        unsafe { rg_create_mesh_entity(mesh, tex) }
    }
    #[inline]
    pub fn create_sprite(tex: i32, cols: i32, rows: i32, w: i32, h: i32) -> i32 {
        unsafe { rg_create_sprite(tex, cols, rows, w, h) }
    }
    #[inline]
    pub fn set_sprite_cell(e: i32, col: i32, row: i32) {
        unsafe { rg_set_sprite_cell(e, col, row) }
    }
    #[inline]
    pub fn create_camera(fovy: i32, near: i32, far: i32) -> i32 {
        unsafe { rg_create_camera(fovy, near, far) }
    }
    #[inline]
    pub fn create_light(kind: i32, color: i32, intensity: i32) -> i32 {
        unsafe { rg_create_light(kind, color, intensity) }
    }
    #[inline]
    pub fn set_position(e: i32, x: i32, y: i32, z: i32) {
        unsafe { rg_set_position(e, x, y, z) }
    }
    #[inline]
    pub fn set_rotation(e: i32, qx: i32, qy: i32, qz: i32, qw: i32) {
        unsafe { rg_set_rotation(e, qx, qy, qz, qw) }
    }
    #[inline]
    pub fn set_scale(e: i32, sx: i32, sy: i32, sz: i32) {
        unsafe { rg_set_scale(e, sx, sy, sz) }
    }
    #[inline]
    pub fn set_target(e: i32, x: i32, y: i32, z: i32) {
        unsafe { rg_set_target(e, x, y, z) }
    }
    #[inline]
    pub fn set_range(e: i32, r: i32) {
        unsafe { rg_set_range(e, r) }
    }
    #[inline]
    pub fn set_enabled(e: i32, on: i32) {
        unsafe { rg_set_enabled(e, on) }
    }
    #[inline]
    pub fn set_visible(e: i32, on: i32) {
        unsafe { rg_set_visible(e, on) }
    }
    #[inline]
    pub fn set_active_camera(e: i32) {
        unsafe { rg_set_active_camera(e) }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod imp {
    use core::sync::atomic::{AtomicI32, Ordering};

    // Monotonic handle source so host tests see distinct, valid entities.
    static NEXT: AtomicI32 = AtomicI32::new(1);

    #[inline]
    fn alloc() -> i32 {
        NEXT.fetch_add(1, Ordering::Relaxed)
    }

    #[inline]
    pub fn load_texture(_: &str) -> i32 {
        alloc()
    }
    #[inline]
    pub fn load_model(_: &str) -> i32 {
        alloc()
    }
    #[inline]
    pub fn load_sprite(_: &str) -> i32 {
        alloc()
    }
    #[inline]
    #[allow(clippy::too_many_arguments)]
    pub fn create_box(_: i32, _: i32, _: i32, _: i32, _: i32, _: i32, _: i32) -> i32 {
        alloc()
    }
    #[inline]
    pub fn create_mesh_entity(_: i32, _: i32) -> i32 {
        alloc()
    }
    #[inline]
    pub fn create_sprite(_: i32, _: i32, _: i32, _: i32, _: i32) -> i32 {
        alloc()
    }
    #[inline]
    pub fn set_sprite_cell(_: i32, _: i32, _: i32) {}
    #[inline]
    pub fn create_camera(_: i32, _: i32, _: i32) -> i32 {
        alloc()
    }
    #[inline]
    pub fn create_light(_: i32, _: i32, _: i32) -> i32 {
        alloc()
    }
    #[inline]
    pub fn set_position(_: i32, _: i32, _: i32, _: i32) {}
    #[inline]
    pub fn set_rotation(_: i32, _: i32, _: i32, _: i32, _: i32) {}
    #[inline]
    pub fn set_scale(_: i32, _: i32, _: i32, _: i32) {}
    #[inline]
    pub fn set_target(_: i32, _: i32, _: i32, _: i32) {}
    #[inline]
    pub fn set_range(_: i32, _: i32) {}
    #[inline]
    pub fn set_enabled(_: i32, _: i32) {}
    #[inline]
    pub fn set_visible(_: i32, _: i32) {}
    #[inline]
    pub fn set_active_camera(_: i32) {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixed_point_encoding_matches_host_scale() {
        assert_eq!(fp(1.0), 256);
        assert_eq!(fp(-1.0), -256);
        assert_eq!(fp(0.5), 128);
        assert_eq!(fp(100.0), 25600);
        assert_eq!(q16(1.0), 65536);
        assert_eq!(q16(0.0), 0);
        assert_eq!(q16(-1.0), -65536);
    }

    #[test]
    fn color_packs_rrggbbaa() {
        assert_eq!(Color::rgb(255, 0, 0).pack(), 0xff0000ffu32 as i32);
        assert_eq!(Color::WHITE.pack(), 0xffffffffu32 as i32);
        assert_eq!(Color::rgba(0x12, 0x34, 0x56, 0x78).pack(), 0x12345678);
    }

    #[test]
    fn light_kinds_match_host_codes() {
        assert_eq!(LightKind::Ambient as i32, 3);
        assert_eq!(LightKind::Directional as i32, 4);
        assert_eq!(LightKind::Point as i32, 5);
    }

    #[test]
    fn vec3_ops() {
        let a = Vec3::new(1.0, 2.0, 3.0);
        let b = Vec3::new(4.0, 5.0, 6.0);
        assert_eq!(a + b, Vec3::new(5.0, 7.0, 9.0));
        assert_eq!(b - a, Vec3::new(3.0, 3.0, 3.0));
        assert_eq!(a * 2.0, Vec3::new(2.0, 4.0, 6.0));
        assert_eq!(a.dot(b), 32.0);
        assert_eq!(Vec3::new(1.0, 0.0, 0.0).cross(Vec3::new(0.0, 1.0, 0.0)), Vec3::new(0.0, 0.0, 1.0));
    }

    #[test]
    fn vec3_length_and_normalize() {
        let v = Vec3::new(3.0, 4.0, 0.0);
        assert!((v.length() - 5.0).abs() < 1e-4);
        let n = v.normalized();
        assert!((n.length() - 1.0).abs() < 1e-4);
        // zero vector normalises to itself, no NaN
        assert_eq!(Vec3::ZERO.normalized(), Vec3::ZERO);
    }

    #[test]
    fn quat_axis_angle_identity_and_quarter_turn() {
        let q = Quat::from_axis_angle(Vec3::new(0.0, 1.0, 0.0), 0.0);
        assert!((q.w - 1.0).abs() < 1e-4);
        // 90° about Y → (0, sin45, 0, cos45)
        let q = Quat::from_axis_angle(Vec3::new(0.0, 1.0, 0.0), core::f32::consts::FRAC_PI_2);
        let s = (core::f32::consts::FRAC_PI_4).sin();
        assert!((q.y - s).abs() < 1e-3);
        assert!((q.w - s).abs() < 1e-3);
    }

    #[test]
    fn quat_mul_reproduces_cube3d_tumble() {
        // cube3d built its tumble by hand as q = qx(rx) * qy(ry) with the
        // closed form (sx*cy, cx*sy, sx*sy, cx*cy). The facade must match.
        let ang = 0.7f32;
        let rx = ang * 0.5;
        let ry = ang;
        let (sx, cx) = (rx * 0.5).sin_cos();
        let (sy, cy) = (ry * 0.5).sin_cos();
        let expected = Quat::new(sx * cy, cx * sy, sx * sy, cx * cy);

        let got = Quat::from_axis_angle(Vec3::X, rx) * Quat::from_axis_angle(Vec3::Y, ry);
        assert!((got.x - expected.x).abs() < 1e-3, "x {} vs {}", got.x, expected.x);
        assert!((got.y - expected.y).abs() < 1e-3, "y {} vs {}", got.y, expected.y);
        assert!((got.z - expected.z).abs() < 1e-3, "z {} vs {}", got.z, expected.z);
        assert!((got.w - expected.w).abs() < 1e-3, "w {} vs {}", got.w, expected.w);
    }

    #[test]
    fn scene_api_yields_valid_distinct_handles() {
        let scene = Scene::new();
        let tex = scene.texture("crate");
        assert!(tex.is_valid());
        let cube = scene.spawn_cube(Vec3::ZERO, 1.0, tex);
        assert!(cube.is_valid());
        let cam = scene.camera(0.87, 0.1, 100.0);
        cam.position(Vec3::new(3.0, 2.5, 4.0)).target(Vec3::ZERO).activate();
        assert!(cam.is_valid());
        assert_ne!(cube.id(), cam.id());
        let sun = scene.directional_light(Color::rgb(255, 240, 200), 0.9, Vec3::new(0.4, 0.9, 0.3));
        assert!(sun.is_valid());
    }
}
