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

// The command ids + RGC1 wire constants are GENERATED from the schema — this
// guest does not hand-copy them. Regenerate rg_abi.rs via
// bridge/wasm/tools/gen_rust_abi (freshness gated by wasm_abi_binding_test).
mod rg_abi;
use rg_abi::*;

const MAX_REC: usize = 32;
static mut BUF: [i32; RGC1_HDR + RGC1_WORDS * MAX_REC] = [0; RGC1_HDR + RGC1_WORDS * MAX_REC];

// Result region: the host writes the minted host id of each created object here,
// indexed by the guest-local id it was created with (the return-value round-trip).
const MAX_ID: usize = 64;
static mut RESULT: [i32; MAX_ID] = [0; MAX_ID];

// String/asset args live in the guest's own memory; a record carries a (ptr,len)
// into them. These are ASCII byte literals in the guest's rodata.
static VOCAL_CUE: &[u8] = b"cue-42";
static MODEL_PATH: &[u8] = b"models/diamond.glb";

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 {
    core::ptr::addr_of!(BUF) as i32
}

#[no_mangle]
pub extern "C" fn result_ptr() -> i32 {
    core::ptr::addr_of!(RESULT) as i32
}

#[no_mangle]
pub extern "C" fn frame() -> i32 {
    // Typed, schema-generated builder — the guest can't mis-order or mis-encode
    // args (geometry_box takes f32s, fixed-point is applied for us, etc.).
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rg3d_scene_create(1); //                             scene        -> id 1
    cb.rg3d_camera_create(2); //                            camera       -> id 2
    cb.rg3d_geometry_box(3, 2.0, 2.0, 2.0); //              box 2x2x2    -> id 3
    cb.rg3d_material_lambert(4, 0x33_aa_ff); //             lambert      -> id 4
    cb.rg3d_mesh_create(5, 3, 4); //                        mesh(3,4)    -> id 5
    cb.rg3d_entity_set_parent(5, 1); //                     scene.add(mesh 5 -> scene 1)
    cb.rg3d_mesh_transform(5, 1.5, 0.0, -3.0, 0.0, 0.0, 0.0); // mesh 5 pos(1.5,0,-3)
    cb.finish()
}

/// A second frame that depends on the return-value round-trip: the guest reads
/// back the HOST id the host wrote into RESULT[5] for its mesh, and only if it
/// received a valid handle does it emit a follow-up transform (re-using guest-
/// local id 5, which the host's persistent id map still resolves). Proves the
/// guest observed the host-written handle and conditioned behaviour on it.
/// Returns the number of records emitted (0 if no handle came back).
#[no_mangle]
pub extern "C" fn frame2() -> i32 {
    let mesh_host = unsafe { RESULT[5] };
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    if mesh_host == 0 {
        return cb.finish(); // no round-trip -> 0 records
    }
    cb.rg3d_mesh_transform(5, 0.5, 0.5, -2.0, 0.0, 0.0, 0.0); // move mesh 5
    cb.finish()
}

/// String / asset args: send a vocal-cue string (echoed by the host) and load a
/// real GLB by path. Both args are (ptr,len) into the guest's own memory; the
/// model handle is bound to guest-local id 6.
#[no_mangle]
pub extern "C" fn frame_model() -> i32 {
    let vp = VOCAL_CUE.as_ptr() as i32;
    let vl = VOCAL_CUE.len() as i32;
    let mp = MODEL_PATH.as_ptr() as i32;
    let ml = MODEL_PATH.len() as i32;
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    cb.rgcore_vocal(vp, vl); //          string arg -> host vocal cues (verbatim)
    cb.rg3d_model_load(6, mp, ml); //    load a real GLB via the path string -> id 6
    cb.finish()
}
