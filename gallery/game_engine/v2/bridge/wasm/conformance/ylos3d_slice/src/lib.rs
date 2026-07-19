//! ylos3d_slice — a Rust->wasm32 conformance guest for the ranger:three surface.
//!
//! Proves the v2 architecture end to end: a guest compiled to wasm32 drives the
//! GENERIC registry bridge (RgRegistryBridge.dispatchRow), not a hand-linked C
//! ABI. The guest builds a minimal 3D scene (scene, camera, box geometry, lambert
//! material, a mesh, parents the mesh to the scene, and transforms it) by writing
//! a command buffer into its own linear memory; the host drains it and replays
//! each record through the bridge, mapping guest-local ids -> host handles
//! (D-IDENTITY). No host-call imports: the command-buffer model mirrors the
//! existing RGU1/RGX1 shared-block guests.
//!
//! Wire format (RGC1): a flat array of fixed 12-i32 records, little-endian:
//!   [op, dst, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9]
//!   op  = opcode (below); dst = guest-local id to bind the created handle (0=none)
//!   doubles are transmitted as fixed-point ints (value * 1000).
//! `frame()` fills the buffer and returns the record count; `cmd_ptr()` returns
//! the buffer's linear-memory offset.

#![no_std]
#[panic_handler]
fn ph(_: &core::panic::PanicInfo) -> ! { loop {} }

const WORDS: usize = 12;
const MAX_REC: usize = 32;
static mut BUF: [i32; WORDS * MAX_REC] = [0; WORDS * MAX_REC];

// opcodes
const OP_SCENE: i32 = 1;      // -> rg3d_scene_create()
const OP_CAMERA: i32 = 2;     // -> rg3d_camera_create()
const OP_GEOM_BOX: i32 = 3;   // a0,a1,a2 = w,h,d (x1000) -> rg3d_geometry_box
const OP_MATERIAL: i32 = 4;   // a0 = colorRGB -> rg3d_material_lambert
const OP_MESH: i32 = 5;       // a0,a1 = geom id, mat id -> rg3d_mesh_create
const OP_ADD: i32 = 6;        // a0,a1 = child id, parent id -> rg3d_entity_set_parent
const OP_TRANSFORM: i32 = 7;  // a0=mesh id, a1..a6 = px,py,pz,rx,ry,rz (x1000)

unsafe fn put(rec: usize, op: i32, dst: i32, args: &[i32]) {
    let base = rec * WORDS;
    BUF[base] = op;
    BUF[base + 1] = dst;
    let mut i = 0;
    while i < args.len() && i < WORDS - 2 {
        BUF[base + 2 + i] = args[i];
        i += 1;
    }
}

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 {
    core::ptr::addr_of!(BUF) as i32
}

#[no_mangle]
pub extern "C" fn frame() -> i32 {
    unsafe {
        put(0, OP_SCENE, 1, &[]);                              // scene        -> id 1
        put(1, OP_CAMERA, 2, &[]);                             // camera       -> id 2
        put(2, OP_GEOM_BOX, 3, &[2000, 2000, 2000]);          // box 2x2x2     -> id 3
        put(3, OP_MATERIAL, 4, &[0x33_aa_ff]);                // lambert color -> id 4
        put(4, OP_MESH, 5, &[3, 4]);                          // mesh(3,4)     -> id 5
        put(5, OP_ADD, 0, &[5, 1]);                           // scene.add(mesh 5 -> scene 1)
        put(6, OP_TRANSFORM, 0, &[5, 1500, 0, -3000, 0, 0, 0]); // mesh 5 pos(1.5,0,-3)
        7
    }
}
