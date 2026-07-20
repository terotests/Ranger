// GENERATED from registry/schema by RgWasmRustGen - do not edit by hand.
// The schema is the ABI; regenerate via bridge/wasm/tools/gen_rust_abi.
#![allow(dead_code)]

pub const RGC1_MAGIC: i32 = 1380401969;
pub const RGC1_MAJOR: i32 = 1;
pub const RGC1_FIXED: i32 = 1000;
pub const RGC1_WORDS: usize = 12;
pub const RGC1_HDR: usize = 4;

pub const RGCORE_INPUT_IS_DOWN: i32 = 1000;
pub const RGCORE_INPUT_WAS_PRESSED: i32 = 1001;
pub const RGCORE_INPUT_RUMBLE: i32 = 1002;
pub const RGCORE_SURFACE_SET_LAYOUT: i32 = 1010;
pub const RGCORE_SURFACE_PANE_PLAYER: i32 = 1011;
pub const RGCORE_SURFACE_PANE_VIEW: i32 = 1012;
pub const RGCORE_AUDIO_CLIP_CREATE: i32 = 1020;
pub const RGCORE_AUDIO_SOURCE_CREATE: i32 = 1021;
pub const RGCORE_AUDIO_ONE_SHOT: i32 = 1022;
pub const RGCORE_VOCAL: i32 = 1023;
pub const RGCORE_MUSIC_PLAY: i32 = 1024;
pub const RGCORE_MUSIC_STOP: i32 = 1025;
pub const RGCORE_ASSETS_LOAD_ATLAS: i32 = 1060;
pub const RGCORE_TIME_NOW: i32 = 1030;
pub const RGCORE_LOG: i32 = 1040;
pub const RGCORE_LAUNCH: i32 = 1050;
pub const RGCORE_GRAPHICS_RT_CREATE: i32 = 1070;
pub const RG2D_TEXTURE_CREATE: i32 = 2000;
pub const RG2D_ATLAS_CREATE: i32 = 2010;
pub const RG2D_ATLAS_ADD_REGION: i32 = 2011;
pub const RG2D_ATLAS_ADD_CLIP: i32 = 2012;
pub const RG2D_ATLAS_REGION_INDEX: i32 = 2013;
pub const RG2D_SPRITE_CREATE: i32 = 2020;
pub const RG2D_SPRITE_SET_POS: i32 = 2021;
pub const RG2D_SPRITE_SET_REGION: i32 = 2022;
pub const RG2D_SPRITE_RELEASE: i32 = 2023;
pub const RG2D_SPRITE_SET_SIZE: i32 = 2024;
pub const RG2D_SPRITE_SET_Z: i32 = 2025;
pub const RG2D_SPRITE_SET_FLIP: i32 = 2026;
pub const RG2D_SPRITE_SET_CELL: i32 = 2027;
pub const RG2D_SPRITE_SET_PANE: i32 = 2028;
pub const RG2D_SPRITE_CREATE_TEX: i32 = 2029;
pub const RG2D_LAYER_CREATE: i32 = 2030;
pub const RG2D_LAYER_ADD: i32 = 2031;
pub const RG2D_LAYER_REMOVE: i32 = 2032;
pub const RG2D_CAMERA_CREATE: i32 = 2040;
pub const RG2D_CAMERA_SET: i32 = 2041;
pub const RG2D_RENDER: i32 = 2060;
pub const RG2D_PLAYER_CREATE: i32 = 2050;
pub const RG2D_PLAYER_FRAME_AT: i32 = 2051;
pub const RG2D_BG_BEGIN: i32 = 2070;
pub const RG2D_BG_RECT: i32 = 2071;
pub const RG2D_BG_CIRCLE: i32 = 2072;
pub const RG2D_OV_BEGIN: i32 = 2073;
pub const RG2D_OV_RECT: i32 = 2074;
pub const RG3D_SCENE_CREATE: i32 = 3000;
pub const RG3D_CAMERA_CREATE: i32 = 3001;
pub const RG3D_CAMERA_SET: i32 = 3002;
pub const RG3D_CAMERA_POSE: i32 = 3003;
pub const RG3D_GEOMETRY_BOX: i32 = 3010;
pub const RG3D_GEOMETRY_OCTAHEDRON: i32 = 3011;
pub const RG3D_GEOMETRY_TEAPOT: i32 = 3012;
pub const RG3D_GEOMETRY_PLANE: i32 = 3013;
pub const RG3D_GEOMETRY_SPHERE: i32 = 3014;
pub const RG3D_GEOMETRY_CYLINDER: i32 = 3015;
pub const RG3D_MATERIAL_BASIC: i32 = 3020;
pub const RG3D_MATERIAL_LAMBERT: i32 = 3021;
pub const RG3D_MATERIAL_SET_OPACITY: i32 = 3022;
pub const RG3D_MATERIAL_PHONG: i32 = 3023;
pub const RG3D_MESH_CREATE: i32 = 3030;
pub const RG3D_MESH_TRANSFORM: i32 = 3031;
pub const RG3D_MESH_SET_SCALE: i32 = 3032;
pub const RG3D_ENTITY_SET_PARENT: i32 = 3033;
pub const RG3D_ENTITY_REMOVE: i32 = 3034;
pub const RG3D_GROUP_CREATE: i32 = 3035;
pub const RG3D_RENDER_TO: i32 = 3040;
pub const RG3D_LIGHT_AMBIENT: i32 = 3050;
pub const RG3D_LIGHT_DIRECTIONAL: i32 = 3051;
pub const RG3D_MODEL_LOAD: i32 = 3060;
pub const RG3D_ORBIT_CREATE: i32 = 3070;
pub const RG3D_ORBIT_VIEWPORT: i32 = 3071;
pub const RG3D_ORBIT_TARGET: i32 = 3072;
pub const RG3D_ORBIT_POINTER: i32 = 3073;
pub const RG3D_ORBIT_WHEEL: i32 = 3074;
pub const RG3D_ORBIT_APPLY: i32 = 3075;
pub const CANNON_WORLD_GRAVITY: i32 = 4000;
pub const CANNON_WORLD_STEP: i32 = 4001;
pub const CANNON_BODY_SPHERE: i32 = 4010;
pub const CANNON_BODY_BOX: i32 = 4011;
pub const CANNON_BODY_STATIC_PLANE: i32 = 4012;
pub const CANNON_BODY_SET_VELOCITY: i32 = 4013;
pub const CANNON_BODY_SET_POSITION: i32 = 4017;
pub const CANNON_BODY_POS_X: i32 = 4014;
pub const CANNON_BODY_POS_Y: i32 = 4015;
pub const CANNON_BODY_POS_Z: i32 = 4016;

// Typed command-buffer builder - one checked method per command.
pub struct RgCmdBuf<'a> { buf: &'a mut [i32], count: usize }
impl<'a> RgCmdBuf<'a> {
    pub fn new(buf: &'a mut [i32]) -> Self { RgCmdBuf { buf, count: 0 } }
    fn put(&mut self, id: i32, dst: i32, args: &[i32]) {
        let base = RGC1_HDR + self.count * RGC1_WORDS;
        self.buf[base] = id; self.buf[base + 1] = dst;
        let mut i = 0; while i < args.len() && i < RGC1_WORDS - 2 { self.buf[base + 2 + i] = args[i]; i += 1; }
        self.count += 1;
    }
    /// Write the RGC1 header; returns the record count.
    pub fn finish(&mut self) -> i32 {
        self.buf[0] = RGC1_MAGIC; self.buf[1] = RGC1_MAJOR;
        self.buf[2] = self.count as i32; self.buf[3] = 0; self.count as i32
    }
    pub fn rgcore_input_is_down(&mut self, a0: i32, a1_ptr: i32, a1_len: i32) {
        self.put(RGCORE_INPUT_IS_DOWN, 0, &[a0, a1_ptr, a1_len]);
    }
    pub fn rgcore_input_was_pressed(&mut self, a0: i32, a1_ptr: i32, a1_len: i32) {
        self.put(RGCORE_INPUT_WAS_PRESSED, 0, &[a0, a1_ptr, a1_len]);
    }
    pub fn rgcore_input_rumble(&mut self, a0: i32, a1: i32, a2: i32) {
        self.put(RGCORE_INPUT_RUMBLE, 0, &[a0, a1, a2]);
    }
    pub fn rgcore_surface_set_layout(&mut self, a0: i32) {
        self.put(RGCORE_SURFACE_SET_LAYOUT, 0, &[a0]);
    }
    pub fn rgcore_surface_pane_player(&mut self, a0: i32, a1: i32) {
        self.put(RGCORE_SURFACE_PANE_PLAYER, 0, &[a0, a1]);
    }
    pub fn rgcore_surface_pane_view(&mut self, a0: i32, a1: i32, a2: i32) {
        self.put(RGCORE_SURFACE_PANE_VIEW, 0, &[a0, a1, a2]);
    }
    pub fn rgcore_audio_clip_create(&mut self, dst: i32, a0: f32, a1: i32, a2: f32, a3: i32) {
        self.put(RGCORE_AUDIO_CLIP_CREATE, dst, &[((a0 * RGC1_FIXED as f32) as i32), a1, ((a2 * RGC1_FIXED as f32) as i32), a3]);
    }
    pub fn rgcore_audio_source_create(&mut self, dst: i32, a0: i32) {
        self.put(RGCORE_AUDIO_SOURCE_CREATE, dst, &[a0]);
    }
    pub fn rgcore_audio_one_shot(&mut self, a0: i32) {
        self.put(RGCORE_AUDIO_ONE_SHOT, 0, &[a0]);
    }
    pub fn rgcore_vocal(&mut self, a0_ptr: i32, a0_len: i32) {
        self.put(RGCORE_VOCAL, 0, &[a0_ptr, a0_len]);
    }
    pub fn rgcore_music_play(&mut self, a0_ptr: i32, a0_len: i32) {
        self.put(RGCORE_MUSIC_PLAY, 0, &[a0_ptr, a0_len]);
    }
    pub fn rgcore_music_stop(&mut self, ) {
        self.put(RGCORE_MUSIC_STOP, 0, &[]);
    }
    pub fn rgcore_assets_load_atlas(&mut self, dst: i32, a0_ptr: i32, a0_len: i32) {
        self.put(RGCORE_ASSETS_LOAD_ATLAS, dst, &[a0_ptr, a0_len]);
    }
    pub fn rgcore_time_now(&mut self, ) {
        self.put(RGCORE_TIME_NOW, 0, &[]);
    }
    pub fn rgcore_log(&mut self, a0_ptr: i32, a0_len: i32) {
        self.put(RGCORE_LOG, 0, &[a0_ptr, a0_len]);
    }
    pub fn rgcore_launch(&mut self, a0_ptr: i32, a0_len: i32) {
        self.put(RGCORE_LAUNCH, 0, &[a0_ptr, a0_len]);
    }
    pub fn rgcore_graphics_rt_create(&mut self, dst: i32, a0: i32, a1: i32) {
        self.put(RGCORE_GRAPHICS_RT_CREATE, dst, &[a0, a1]);
    }
    pub fn rg2d_texture_create(&mut self, dst: i32, a0: i32, a1: i32) {
        self.put(RG2D_TEXTURE_CREATE, dst, &[a0, a1]);
    }
    pub fn rg2d_atlas_create(&mut self, dst: i32, a0: i32) {
        self.put(RG2D_ATLAS_CREATE, dst, &[a0]);
    }
    pub fn rg2d_atlas_add_region(&mut self, a0: i32, a1_ptr: i32, a1_len: i32, a2: i32, a3: i32, a4: i32, a5: i32) {
        self.put(RG2D_ATLAS_ADD_REGION, 0, &[a0, a1_ptr, a1_len, a2, a3, a4, a5]);
    }
    pub fn rg2d_atlas_region_index(&mut self, a0: i32, a1_ptr: i32, a1_len: i32) {
        self.put(RG2D_ATLAS_REGION_INDEX, 0, &[a0, a1_ptr, a1_len]);
    }
    pub fn rg2d_sprite_create(&mut self, dst: i32, a0: i32, a1: i32) {
        self.put(RG2D_SPRITE_CREATE, dst, &[a0, a1]);
    }
    pub fn rg2d_sprite_set_pos(&mut self, a0: i32, a1: f32, a2: f32) {
        self.put(RG2D_SPRITE_SET_POS, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg2d_sprite_set_region(&mut self, a0: i32, a1: i32) {
        self.put(RG2D_SPRITE_SET_REGION, 0, &[a0, a1]);
    }
    pub fn rg2d_sprite_release(&mut self, a0: i32) {
        self.put(RG2D_SPRITE_RELEASE, 0, &[a0]);
    }
    pub fn rg2d_sprite_set_size(&mut self, a0: i32, a1: f32, a2: f32) {
        self.put(RG2D_SPRITE_SET_SIZE, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg2d_sprite_set_z(&mut self, a0: i32, a1: i32) {
        self.put(RG2D_SPRITE_SET_Z, 0, &[a0, a1]);
    }
    pub fn rg2d_sprite_set_flip(&mut self, a0: i32, a1: i32) {
        self.put(RG2D_SPRITE_SET_FLIP, 0, &[a0, a1]);
    }
    pub fn rg2d_sprite_set_cell(&mut self, a0: i32, a1: i32, a2: i32) {
        self.put(RG2D_SPRITE_SET_CELL, 0, &[a0, a1, a2]);
    }
    pub fn rg2d_sprite_set_pane(&mut self, a0: i32, a1: i32) {
        self.put(RG2D_SPRITE_SET_PANE, 0, &[a0, a1]);
    }
    pub fn rg2d_sprite_create_tex(&mut self, dst: i32, a0: i32) {
        self.put(RG2D_SPRITE_CREATE_TEX, dst, &[a0]);
    }
    pub fn rg2d_layer_create(&mut self, dst: i32) {
        self.put(RG2D_LAYER_CREATE, dst, &[]);
    }
    pub fn rg2d_layer_add(&mut self, a0: i32, a1: i32) {
        self.put(RG2D_LAYER_ADD, 0, &[a0, a1]);
    }
    pub fn rg2d_layer_remove(&mut self, a0: i32) {
        self.put(RG2D_LAYER_REMOVE, 0, &[a0]);
    }
    pub fn rg2d_camera_create(&mut self, dst: i32) {
        self.put(RG2D_CAMERA_CREATE, dst, &[]);
    }
    pub fn rg2d_camera_set(&mut self, a0: i32, a1: f32, a2: f32, a3: f32, a4: f32) {
        self.put(RG2D_CAMERA_SET, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg2d_render(&mut self, a0: i32, a1: i32, a2: i32) {
        self.put(RG2D_RENDER, 0, &[a0, a1, a2]);
    }
    pub fn rg2d_player_create(&mut self, dst: i32, a0: i32, a1: i32) {
        self.put(RG2D_PLAYER_CREATE, dst, &[a0, a1]);
    }
    pub fn rg2d_player_frame_at(&mut self, a0: i32, a1: f32) {
        self.put(RG2D_PLAYER_FRAME_AT, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg2d_bg_begin(&mut self, ) {
        self.put(RG2D_BG_BEGIN, 0, &[]);
    }
    pub fn rg2d_bg_rect(&mut self, a0: f32, a1: f32, a2: f32, a3: f32, a4: i32, a5: i32, a6: i32) {
        self.put(RG2D_BG_RECT, 0, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), a4, a5, a6]);
    }
    pub fn rg2d_bg_circle(&mut self, a0: f32, a1: f32, a2: f32, a3: i32, a4: i32, a5: i32) {
        self.put(RG2D_BG_CIRCLE, 0, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), a3, a4, a5]);
    }
    pub fn rg2d_ov_begin(&mut self, ) {
        self.put(RG2D_OV_BEGIN, 0, &[]);
    }
    pub fn rg2d_ov_rect(&mut self, a0: f32, a1: f32, a2: f32, a3: f32, a4: i32, a5: i32, a6: i32, a7: i32) {
        self.put(RG2D_OV_RECT, 0, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), a4, a5, a6, a7]);
    }
    pub fn rg3d_scene_create(&mut self, dst: i32) {
        self.put(RG3D_SCENE_CREATE, dst, &[]);
    }
    pub fn rg3d_camera_create(&mut self, dst: i32) {
        self.put(RG3D_CAMERA_CREATE, dst, &[]);
    }
    pub fn rg3d_camera_set(&mut self, a0: i32, a1: f32, a2: f32, a3: f32, a4: f32) {
        self.put(RG3D_CAMERA_SET, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_camera_pose(&mut self, a0: i32, a1: f32, a2: f32, a3: f32, a4: f32, a5: f32, a6: f32) {
        self.put(RG3D_CAMERA_POSE, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32), ((a5 * RGC1_FIXED as f32) as i32), ((a6 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_geometry_box(&mut self, dst: i32, a0: f32, a1: f32, a2: f32) {
        self.put(RG3D_GEOMETRY_BOX, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_geometry_octahedron(&mut self, dst: i32, a0: f32) {
        self.put(RG3D_GEOMETRY_OCTAHEDRON, dst, &[((a0 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_geometry_teapot(&mut self, dst: i32, a0: f32, a1: i32, a2: i32, a3: i32, a4: i32, a5: i32, a6: i32) {
        self.put(RG3D_GEOMETRY_TEAPOT, dst, &[((a0 * RGC1_FIXED as f32) as i32), a1, a2, a3, a4, a5, a6]);
    }
    pub fn rg3d_geometry_plane(&mut self, dst: i32, a0: f32, a1: f32, a2: i32, a3: i32) {
        self.put(RG3D_GEOMETRY_PLANE, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), a2, a3]);
    }
    pub fn rg3d_geometry_sphere(&mut self, dst: i32, a0: f32, a1: i32, a2: i32) {
        self.put(RG3D_GEOMETRY_SPHERE, dst, &[((a0 * RGC1_FIXED as f32) as i32), a1, a2]);
    }
    pub fn rg3d_geometry_cylinder(&mut self, dst: i32, a0: f32, a1: f32, a2: f32, a3: i32) {
        self.put(RG3D_GEOMETRY_CYLINDER, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), a3]);
    }
    pub fn rg3d_material_basic(&mut self, dst: i32, a0: i32) {
        self.put(RG3D_MATERIAL_BASIC, dst, &[a0]);
    }
    pub fn rg3d_material_lambert(&mut self, dst: i32, a0: i32) {
        self.put(RG3D_MATERIAL_LAMBERT, dst, &[a0]);
    }
    pub fn rg3d_material_set_opacity(&mut self, a0: i32, a1: f32) {
        self.put(RG3D_MATERIAL_SET_OPACITY, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_material_phong(&mut self, dst: i32, a0: i32, a1: i32, a2: f32) {
        self.put(RG3D_MATERIAL_PHONG, dst, &[a0, a1, ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_mesh_create(&mut self, dst: i32, a0: i32, a1: i32) {
        self.put(RG3D_MESH_CREATE, dst, &[a0, a1]);
    }
    pub fn rg3d_mesh_transform(&mut self, a0: i32, a1: f32, a2: f32, a3: f32, a4: f32, a5: f32, a6: f32) {
        self.put(RG3D_MESH_TRANSFORM, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32), ((a5 * RGC1_FIXED as f32) as i32), ((a6 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_mesh_set_scale(&mut self, a0: i32, a1: f32, a2: f32, a3: f32) {
        self.put(RG3D_MESH_SET_SCALE, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_entity_set_parent(&mut self, a0: i32, a1: i32) {
        self.put(RG3D_ENTITY_SET_PARENT, 0, &[a0, a1]);
    }
    pub fn rg3d_entity_remove(&mut self, a0: i32, a1: i32) {
        self.put(RG3D_ENTITY_REMOVE, 0, &[a0, a1]);
    }
    pub fn rg3d_group_create(&mut self, dst: i32) {
        self.put(RG3D_GROUP_CREATE, dst, &[]);
    }
    pub fn rg3d_render_to(&mut self, a0: i32, a1: i32, a2: i32, a3: i32, a4: i32) {
        self.put(RG3D_RENDER_TO, 0, &[a0, a1, a2, a3, a4]);
    }
    pub fn rg3d_light_ambient(&mut self, dst: i32, a0: i32, a1: f32) {
        self.put(RG3D_LIGHT_AMBIENT, dst, &[a0, ((a1 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_light_directional(&mut self, dst: i32, a0: i32, a1: f32, a2: f32, a3: f32, a4: f32) {
        self.put(RG3D_LIGHT_DIRECTIONAL, dst, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_model_load(&mut self, dst: i32, a0_ptr: i32, a0_len: i32) {
        self.put(RG3D_MODEL_LOAD, dst, &[a0_ptr, a0_len]);
    }
    pub fn rg3d_orbit_create(&mut self, dst: i32, a0: i32) {
        self.put(RG3D_ORBIT_CREATE, dst, &[a0]);
    }
    pub fn rg3d_orbit_viewport(&mut self, a0: i32, a1: i32, a2: i32) {
        self.put(RG3D_ORBIT_VIEWPORT, 0, &[a0, a1, a2]);
    }
    pub fn rg3d_orbit_target(&mut self, a0: i32, a1: f32, a2: f32, a3: f32) {
        self.put(RG3D_ORBIT_TARGET, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_orbit_pointer(&mut self, a0: i32, a1: i32, a2: f32, a3: f32, a4: i32) {
        self.put(RG3D_ORBIT_POINTER, 0, &[a0, a1, ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), a4]);
    }
    pub fn rg3d_orbit_wheel(&mut self, a0: i32, a1: f32) {
        self.put(RG3D_ORBIT_WHEEL, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn rg3d_orbit_apply(&mut self, a0: i32) {
        self.put(RG3D_ORBIT_APPLY, 0, &[a0]);
    }
    pub fn cannon_world_gravity(&mut self, a0: f32, a1: f32, a2: f32) {
        self.put(CANNON_WORLD_GRAVITY, 0, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_world_step(&mut self, a0: f32) {
        self.put(CANNON_WORLD_STEP, 0, &[((a0 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_sphere(&mut self, dst: i32, a0: f32, a1: f32, a2: f32, a3: f32, a4: f32) {
        self.put(CANNON_BODY_SPHERE, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_box(&mut self, dst: i32, a0: f32, a1: f32, a2: f32, a3: f32, a4: f32, a5: f32, a6: f32) {
        self.put(CANNON_BODY_BOX, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32), ((a4 * RGC1_FIXED as f32) as i32), ((a5 * RGC1_FIXED as f32) as i32), ((a6 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_static_plane(&mut self, dst: i32, a0: f32, a1: f32, a2: f32) {
        self.put(CANNON_BODY_STATIC_PLANE, dst, &[((a0 * RGC1_FIXED as f32) as i32), ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_set_velocity(&mut self, a0: i32, a1: f32, a2: f32, a3: f32) {
        self.put(CANNON_BODY_SET_VELOCITY, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_set_position(&mut self, a0: i32, a1: f32, a2: f32, a3: f32) {
        self.put(CANNON_BODY_SET_POSITION, 0, &[a0, ((a1 * RGC1_FIXED as f32) as i32), ((a2 * RGC1_FIXED as f32) as i32), ((a3 * RGC1_FIXED as f32) as i32)]);
    }
    pub fn cannon_body_pos_x(&mut self, a0: i32) {
        self.put(CANNON_BODY_POS_X, 0, &[a0]);
    }
    pub fn cannon_body_pos_y(&mut self, a0: i32) {
        self.put(CANNON_BODY_POS_Y, 0, &[a0]);
    }
    pub fn cannon_body_pos_z(&mut self, a0: i32) {
        self.put(CANNON_BODY_POS_Z, 0, &[a0]);
    }
}

