//! High-level guest-side 3D scene API.
//!
//! `scene` is deliberately above the byte ABI: games work with handles,
//! transforms, assets, and components while this module owns the RGMB/RGMA/
//! RGCM/RGLT offsets and fixed-point conversion. `publish` produces the
//! snapshot consumed by the existing 3D runner.

use crate::block::Block;

pub const FP: f32 = 256.0;
pub const Q16: f32 = 65536.0;
pub const UV: f32 = 4096.0;
pub const MAX_NODES: usize = 128;
pub const MAX_MESHES: usize = 64;
pub const MAX_MATERIALS: usize = 64;
pub const MAX_VERTICES: usize = 4096;
pub const MAX_INDICES: usize = 8192;
pub const MAX_SUBMESHES: usize = 256;
pub const MAX_POINT_LIGHTS: usize = 4;

const MESH_HDR: usize = 64;
const VERTEX_SIZE: usize = 32;
const INDEX_OFFSET: usize = MESH_HDR + MAX_VERTICES * VERTEX_SIZE;
const SUBMESH_OFFSET: usize = INDEX_OFFSET + MAX_INDICES * 2;
const MESH_SIZE: usize = SUBMESH_OFFSET + MAX_SUBMESHES * 12;
const MAT_SIZE: usize = 20 + MAX_MATERIALS * 16;
const CAM_SIZE: usize = 276;
const LIT_SIZE: usize = 48 + MAX_POINT_LIGHTS * 24;

static MESH: Block<MESH_SIZE> = Block::new();
static MATERIALS: Block<MAT_SIZE> = Block::new();
static CAMERA: Block<CAM_SIZE> = Block::new();
static LIGHTS: Block<LIT_SIZE> = Block::new();

const MESH_MAGIC: u32 = 0x424d_4752;
const MAT_MAGIC: u32 = 0x414d_4752;
const CAM_MAGIC: u32 = 0x4d43_4752;
const LIT_MAGIC: u32 = 0x544c_4752;

/// A three-dimensional vector.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    pub const fn new(x: f32, y: f32, z: f32) -> Self { Self { x, y, z } }
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
    pub const IDENTITY: Self = Self { x: 0.0, y: 0.0, z: 0.0, w: 1.0 };
}

impl Default for Quat {
    fn default() -> Self { Self::IDENTITY }
}

/// RGBA colour used by materials and lights.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Color(pub u8, pub u8, pub u8, pub u8);

impl Color {
    pub const WHITE: Self = Self(255, 255, 255, 255);
    pub const fn rgb(r: u8, g: u8, b: u8) -> Self { Self(r, g, b, 255) }
    fn packed(self) -> u32 {
        ((self.0 as u32) << 24) | ((self.1 as u32) << 16) |
            ((self.2 as u32) << 8) | self.3 as u32
    }
}

/// Stable, generation-checked scene handle.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct Entity {
    pub id: u32,
    pub generation: u32,
}

#[derive(Clone, Copy, Default)]
struct Node {
    generation: u32,
    alive: bool,
    parent: Option<Entity>,
    position: Vec3,
    rotation: Quat,
    scale: Vec3,
    visible: bool,
}

#[derive(Clone, Copy, Default)]
struct Mesh {
    first: usize,
    vertices: usize,
    indices: usize,
}

#[derive(Clone, Copy, Default)]
struct Material {
    texture: u32,
    colour: Color,
    flags: u32,
}

#[derive(Clone, Copy, Default)]
struct Instance {
    node: Entity,
    mesh: u32,
    material: u32,
}

#[derive(Clone, Copy, Default)]
struct PointLight {
    node: Entity,
    colour: Color,
    intensity: f32,
    range: f32,
    enabled: bool,
}

#[derive(Clone, Copy)]
struct Vertex {
    position: Vec3,
    normal: Vec3,
    colour: Color,
    uv: [f32; 2],
}

impl Default for Vertex {
    fn default() -> Self {
        Self { position: Vec3::default(), normal: Vec3::new(0.0, 1.0, 0.0),
            colour: Color::WHITE, uv: [0.0, 0.0] }
    }
}

/// Guest-owned scene declaration and frame snapshot builder.
pub struct Scene {
    nodes: [Node; MAX_NODES],
    meshes: [Mesh; MAX_MESHES],
    materials: [Material; MAX_MATERIALS],
    instances: [Instance; MAX_NODES],
    lights: [PointLight; MAX_POINT_LIGHTS],
    vertices: [Vertex; MAX_VERTICES],
    indices: [u16; MAX_INDICES],
    node_count: usize,
    mesh_count: usize,
    material_count: usize,
    instance_count: usize,
    light_count: usize,
    vertex_count: usize,
    index_count: usize,
    ambient: (Color, f32),
    sun: (Vec3, Color, f32),
    camera: Camera,
}

/// Camera declaration. The host resolves the view-projection matrix.
#[derive(Clone, Copy, Debug)]
pub struct Camera {
    pub projection: Projection,
    pub eye: Vec3,
    pub target: Vec3,
    pub up: Vec3,
    pub fovy: f32,
    pub ortho_height: f32,
    pub near: f32,
    pub far: f32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Projection { Affine2d, Ortho3d, Perspective }

impl Default for Camera {
    fn default() -> Self {
        Self { projection: Projection::Perspective, eye: Vec3::new(0.0, 0.0, 4.0),
            target: Vec3::default(), up: Vec3::new(0.0, 1.0, 0.0),
            fovy: 1.0472, ortho_height: 10.0, near: 0.1, far: 1000.0 }
    }
}

impl Scene {
    pub const fn new() -> Self {
        Self {
            nodes: [Node { generation: 0, alive: false, parent: None,
                position: Vec3 { x: 0.0, y: 0.0, z: 0.0 }, rotation: Quat::IDENTITY,
                scale: Vec3 { x: 1.0, y: 1.0, z: 1.0 }, visible: false }; MAX_NODES],
            meshes: [Mesh { first: 0, vertices: 0, indices: 0 }; MAX_MESHES],
            materials: [Material { texture: 0, colour: Color::WHITE, flags: 0 }; MAX_MATERIALS],
            instances: [Instance { node: Entity { id: 0, generation: 0 }, mesh: 0, material: 0 }; MAX_NODES],
            lights: [PointLight { node: Entity { id: 0, generation: 0 }, colour: Color::WHITE,
                intensity: 0.0, range: 0.0, enabled: false }; MAX_POINT_LIGHTS],
            vertices: [Vertex { position: Vec3 { x: 0.0, y: 0.0, z: 0.0 }, normal: Vec3 { x: 0.0, y: 1.0, z: 0.0 },
                colour: Color::WHITE, uv: [0.0, 0.0] }; MAX_VERTICES],
            indices: [0; MAX_INDICES], node_count: 0, mesh_count: 0, material_count: 0,
            instance_count: 0, light_count: 0, vertex_count: 0, index_count: 0,
            ambient: (Color::WHITE, 0.2), sun: (Vec3::new(-1.0, -1.0, -1.0), Color::WHITE, 0.9),
            camera: Camera { projection: Projection::Perspective, eye: Vec3::new(0.0, 0.0, 4.0),
                target: Vec3 { x: 0.0, y: 0.0, z: 0.0 }, up: Vec3::new(0.0, 1.0, 0.0), fovy: 1.0472,
                ortho_height: 10.0, near: 0.1, far: 1000.0 },
        }
    }

    pub fn assets(&mut self) -> Assets<'_> { Assets { scene: self } }

    fn entity(&mut self) -> Option<Entity> {
        for i in 0..MAX_NODES {
            if !self.nodes[i].alive {
                self.nodes[i].alive = true;
                self.nodes[i].visible = true;
                self.nodes[i].generation = self.nodes[i].generation.wrapping_add(1).max(1);
                self.node_count = self.node_count.max(i + 1);
                return Some(Entity { id: i as u32 + 1, generation: self.nodes[i].generation });
            }
        }
        None
    }

    fn node_index(&self, e: Entity) -> Option<usize> {
        let i = e.id.checked_sub(1)? as usize;
        (i < MAX_NODES && self.nodes[i].alive && self.nodes[i].generation == e.generation).then_some(i)
    }

    /// Create a mesh instance. The same asset may be used by many entities.
    pub fn spawn_mesh(&mut self, mesh: MeshAsset, material: MaterialId) -> Option<Entity> {
        let e = self.entity()?;
        if self.instance_count == MAX_NODES { return None; }
        self.instances[self.instance_count] = Instance { node: e, mesh: mesh.id, material: material.0 };
        self.instance_count += 1;
        Some(e)
    }

    pub fn node(&mut self, entity: Entity) -> NodeHandle<'_> { NodeHandle { scene: self, entity } }
    pub fn light(&mut self, entity: Entity) -> LightHandle<'_> { LightHandle { scene: self, entity } }
    pub fn camera_mut(&mut self) -> &mut Camera { &mut self.camera }

    pub fn spawn_ambient_light(&mut self, colour: Color, intensity: f32) -> Entity {
        let e = self.entity().unwrap_or_default();
        self.ambient = (colour, intensity);
        e
    }

    pub fn spawn_point_light(&mut self, colour: Color, intensity: f32, range: f32) -> Option<Entity> {
        let e = self.entity()?;
        if self.light_count == MAX_POINT_LIGHTS { return None; }
        self.lights[self.light_count] = PointLight { node: e, colour, intensity, range, enabled: true };
        self.light_count += 1;
        Some(e)
    }

    /// Serialize one complete snapshot. Returns false if a scene does not fit.
    pub fn publish(&mut self) -> bool {
        let mut v = 0usize;
        let mut i = 0usize;
        let mut s = 0usize;
        for n in 0..self.instance_count {
            let inst = self.instances[n];
            let Some(ni) = self.node_index(inst.node) else { continue };
            let mesh = self.meshes[inst.mesh as usize];
            let Some(mat) = self.materials.get(inst.material as usize).copied() else { continue };
            if v + mesh.vertices > MAX_VERTICES || i + mesh.indices > MAX_INDICES || s == MAX_SUBMESHES {
                return false;
            }
            for k in 0..mesh.vertices {
                let src = self.vertices[mesh.first + k];
                let p = transform(src.position, self.nodes[ni]);
                write_vertex(v + k, p, src.normal, src.colour, src.uv);
            }
            for k in 0..mesh.indices {
                self_write_index(i + k, self.indices[mesh.first + k] + v as u16);
            }
            MESH.write_u32(SUBMESH_OFFSET + s * 12, i as u32);
            MESH.write_u32(SUBMESH_OFFSET + s * 12 + 4, mesh.indices as u32);
            MESH.write_u32(SUBMESH_OFFSET + s * 12 + 8, inst.material);
            let _ = mat;
            v += mesh.vertices; i += mesh.indices; s += 1;
        }
        self.vertex_count = v; self.index_count = i;
        write_headers(v, i, s);
        write_materials(self);
        write_camera(&self.camera);
        write_lights(self);
        true
    }
}

/// Mesh resource handle.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct MeshAsset { id: u32 }
/// Material resource handle.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct MaterialId(u32);

pub struct Assets<'a> { scene: &'a mut Scene }

impl Assets<'_> {
    pub fn material(&mut self, texture: u32, colour: Color, flags: u32) -> MaterialId {
        let i = self.scene.material_count.min(MAX_MATERIALS - 1);
        self.scene.materials[i] = Material { texture, colour, flags };
        self.scene.material_count = (i + 1).min(MAX_MATERIALS);
        MaterialId(i as u32)
    }

    /// Add a unit box mesh with outward-facing normals.
    pub fn box_mesh(&mut self, size: Vec3) -> Option<MeshAsset> {
        let s = &mut *self.scene;
        if s.mesh_count == MAX_MESHES || s.vertex_count + 24 > MAX_VERTICES ||
            s.index_count + 36 > MAX_INDICES { return None; }
        let first = s.vertex_count;
        let half = Vec3::new(size.x * 0.5, size.y * 0.5, size.z * 0.5);
        let faces = [
            ([Vec3::new(-1.0,-1.0,1.0),Vec3::new(1.0,-1.0,1.0),Vec3::new(1.0,1.0,1.0),Vec3::new(-1.0,1.0,1.0)], Vec3::new(0.0,0.0,1.0)),
            ([Vec3::new(1.0,-1.0,-1.0),Vec3::new(-1.0,-1.0,-1.0),Vec3::new(-1.0,1.0,-1.0),Vec3::new(1.0,1.0,-1.0)], Vec3::new(0.0,0.0,-1.0)),
            ([Vec3::new(1.0,-1.0,1.0),Vec3::new(1.0,-1.0,-1.0),Vec3::new(1.0,1.0,-1.0),Vec3::new(1.0,1.0,1.0)], Vec3::new(1.0,0.0,0.0)),
            ([Vec3::new(-1.0,-1.0,-1.0),Vec3::new(-1.0,-1.0,1.0),Vec3::new(-1.0,1.0,1.0),Vec3::new(-1.0,1.0,-1.0)], Vec3::new(-1.0,0.0,0.0)),
            ([Vec3::new(-1.0,1.0,1.0),Vec3::new(1.0,1.0,1.0),Vec3::new(1.0,1.0,-1.0),Vec3::new(-1.0,1.0,-1.0)], Vec3::new(0.0,1.0,0.0)),
            ([Vec3::new(-1.0,-1.0,-1.0),Vec3::new(1.0,-1.0,-1.0),Vec3::new(1.0,-1.0,1.0),Vec3::new(-1.0,-1.0,1.0)], Vec3::new(0.0,-1.0,0.0)),
        ];
        for (f, (corners, normal)) in faces.iter().enumerate() {
            for k in 0..4 {
                let c = corners[k];
                s.vertices[first + f * 4 + k] = Vertex { position: Vec3::new(c.x*half.x,c.y*half.y,c.z*half.z),
                    normal: *normal, colour: Color::WHITE, uv: [[0.0,0.0],[1.0,0.0],[1.0,1.0],[0.0,1.0]][k] };
            }
            let base = (f * 4) as u16;
            for (k, x) in [0,1,2,0,2,3].iter().enumerate() {
                s.indices[s.index_count + f * 6 + k] = base + *x;
            }
        }
        s.vertex_count += 24; s.index_count += 36;
        let id = s.mesh_count as u32;
        s.meshes[s.mesh_count] = Mesh { first, vertices: 24, indices: 36 };
        s.mesh_count += 1;
        Some(MeshAsset { id })
    }
}

pub struct NodeHandle<'a> { scene: &'a mut Scene, entity: Entity }
impl NodeHandle<'_> {
    pub fn set_position(&mut self, p: Vec3) { if let Some(i)=self.scene.node_index(self.entity) { self.scene.nodes[i].position=p; } }
    pub fn set_rotation(&mut self, q: Quat) { if let Some(i)=self.scene.node_index(self.entity) { self.scene.nodes[i].rotation=q; } }
    pub fn set_scale(&mut self, s: Vec3) { if let Some(i)=self.scene.node_index(self.entity) { self.scene.nodes[i].scale=s; } }
    pub fn set_visible(&mut self, visible: bool) { if let Some(i)=self.scene.node_index(self.entity) { self.scene.nodes[i].visible=visible; } }
}

pub struct LightHandle<'a> { scene: &'a mut Scene, entity: Entity }
impl LightHandle<'_> {
    pub fn set_enabled(&mut self, enabled: bool) {
        for l in self.scene.lights.iter_mut() { if l.node == self.entity { l.enabled = enabled; } }
    }
    pub fn set_position(&mut self, p: Vec3) {
        if let Some(i)=self.scene.node_index(self.entity) { self.scene.nodes[i].position=p; }
    }
    pub fn set_intensity(&mut self, value: f32) {
        for l in self.scene.lights.iter_mut() { if l.node == self.entity { l.intensity=value; } }
    }
    pub fn set_range(&mut self, value: f32) {
        for l in self.scene.lights.iter_mut() { if l.node == self.entity { l.range=value; } }
    }
}

fn fixed(v: f32) -> i32 { (v * FP) as i32 }
fn unit(v: f32) -> i32 { (v * Q16) as i32 }
fn transform(p: Vec3, n: Node) -> Vec3 {
    let q=n.rotation; let x=p.x*n.scale.x; let y=p.y*n.scale.y; let z=p.z*n.scale.z;
    let ix=q.w*x+q.y*z-q.z*y; let iy=q.w*y+q.z*x-q.x*z; let iz=q.w*z+q.x*y-q.y*x; let iw=-q.x*x-q.y*y-q.z*z;
    Vec3::new(ix*q.w+iw*-q.x+iy*-q.z-iz*-q.y+n.position.x,
        iy*q.w+iw*-q.y+iz*-q.x-ix*-q.z+n.position.y,
        iz*q.w+iw*-q.z+ix*-q.y-iy*-q.x+n.position.z)
}
fn write_vertex(i: usize,p:Vec3,n:Vec3,c:Color,uv:[f32;2]) {
    let o=MESH_HDR+i*VERTEX_SIZE; MESH.write_i32(o,fixed(p.x)); MESH.write_i32(o+4,fixed(p.y)); MESH.write_i32(o+8,fixed(p.z));
    MESH.write_i32(o+12,unit(n.x)); MESH.write_i32(o+16,unit(n.y)); MESH.write_i32(o+20,unit(n.z)); MESH.write_u32(o+24,c.packed());
    MESH.write_u32(o+28,((uv[1]*UV) as u32)<<16 | ((uv[0]*UV) as u32 & 0xffff));
}
fn self_write_index(i:usize,v:u16){MESH.write_u16(INDEX_OFFSET+i*2,v);}
fn write_headers(v:usize,i:usize,s:usize){MESH.write_u32(0,MESH_MAGIC);MESH.write_u32(4,1);MESH.write_u32(8,MESH_SIZE as u32);MESH.write_u32(12,0);MESH.write_u32(16,v as u32);MESH.write_u32(20,i as u32);MESH.write_u32(24,s as u32);MESH.write_u32(52,INDEX_OFFSET as u32);MESH.write_u32(56,SUBMESH_OFFSET as u32);}
fn write_materials(s:&Scene){MATERIALS.write_u32(0,MAT_MAGIC);MATERIALS.write_u32(4,1);MATERIALS.write_u32(8,MAT_SIZE as u32);MATERIALS.write_u32(16,s.material_count as u32);for i in 0..s.material_count{let o=20+i*16;let m=s.materials[i];MATERIALS.write_u32(o,m.texture);MATERIALS.write_u32(o+4,m.colour.packed());MATERIALS.write_u32(o+8,m.flags);}}
fn write_camera(c:&Camera){CAMERA.write_u32(0,CAM_MAGIC);CAMERA.write_u32(4,2);CAMERA.write_u32(8,CAM_SIZE as u32);CAMERA.write_u32(16,match c.projection{Projection::Affine2d=>0,Projection::Ortho3d=>1,Projection::Perspective=>2});for (o,v) in [(20,c.eye.x),(24,c.eye.y),(28,c.eye.z),(32,c.target.x),(36,c.target.y),(40,c.target.z),(44,c.up.x),(48,c.up.y),(52,c.up.z)]{CAMERA.write_i32(o,if o<44{fixed(v)}else{unit(v)});}CAMERA.write_i32(56,fixed(c.fovy));CAMERA.write_i32(60,fixed(c.near));CAMERA.write_i32(64,fixed(c.far));CAMERA.write_i32(136,fixed(c.ortho_height));}
fn write_lights(s:&Scene){LIGHTS.write_u32(0,LIT_MAGIC);LIGHTS.write_u32(4,1);LIGHTS.write_u32(8,LIT_SIZE as u32);LIGHTS.write_u32(16,s.ambient.0.packed());LIGHTS.write_i32(20,fixed(s.ambient.1));LIGHTS.write_i32(24,unit(s.sun.0.x));LIGHTS.write_i32(28,unit(s.sun.0.y));LIGHTS.write_i32(32,unit(s.sun.0.z));LIGHTS.write_u32(36,s.sun.1.packed());LIGHTS.write_i32(40,fixed(s.sun.2));let mut n=0;for l in s.lights.iter().take(s.light_count){if !l.enabled{continue}let Some(i)=s.node_index(l.node) else{continue};let o=48+n*24;LIGHTS.write_i32(o,fixed(s.nodes[i].position.x));LIGHTS.write_i32(o+4,fixed(s.nodes[i].position.y));LIGHTS.write_i32(o+8,fixed(s.nodes[i].position.z));LIGHTS.write_u32(o+12,l.colour.packed());LIGHTS.write_i32(o+16,fixed(l.intensity));LIGHTS.write_i32(o+20,fixed(l.range));n+=1;}LIGHTS.write_u32(44,n as u32);}

/// Generate the exports consumed by `wasm3d_runner`.
#[macro_export]
macro_rules! scene_exports {
    () => {
        #[no_mangle] pub extern "C" fn rg_mesh_ptr() -> i32 { $crate::scene::mesh_ptr() }
        #[no_mangle] pub extern "C" fn rg_mesh_size() -> i32 { $crate::scene::mesh_size() }
        #[no_mangle] pub extern "C" fn rg_mat_ptr() -> i32 { $crate::scene::mat_ptr() }
        #[no_mangle] pub extern "C" fn rg_cam_ptr() -> i32 { $crate::scene::cam_ptr() }
        #[no_mangle] pub extern "C" fn rg_cam_size() -> i32 { $crate::scene::cam_size() }
        #[no_mangle] pub extern "C" fn rg_lit_ptr() -> i32 { $crate::scene::lit_ptr() }
        #[no_mangle] pub extern "C" fn rg_lit_size() -> i32 { $crate::scene::lit_size() }
    };
}

#[cfg(target_arch="wasm32")] fn ptr<T>(x:&T)->i32{x as *const T as usize as i32}
#[cfg(not(target_arch="wasm32"))] fn ptr<T>(x:&T)->i32{x as *const T as usize as i32}
pub fn mesh_ptr()->i32{ptr(&MESH)} pub fn mesh_size()->i32{MESH_SIZE as i32}
pub fn mat_ptr()->i32{ptr(&MATERIALS)} pub fn cam_ptr()->i32{ptr(&CAMERA)} pub fn cam_size()->i32{CAM_SIZE as i32}
pub fn lit_ptr()->i32{ptr(&LIGHTS)} pub fn lit_size()->i32{LIT_SIZE as i32}
