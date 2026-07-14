#ifndef WASM_POSE_ABI_H
#define WASM_POSE_ABI_H

#include <stdint.h>

/* ---------------------------------------------------------------------------
 * RGP1 — host->guest streaming pose input for Ranger games (§2.4).
 *
 * A camera + AI model (MediaPipe on the web, TFLite natively) produces a
 * skeleton each frame; the game reacts to where the body is and HOW IT IS
 * MOVING. This is the engine's first host->guest streaming-input block, and it
 * copies the RGU1 discipline every block should: a fixed typed layout, no
 * pointers ever cross, the host validates it as untrusted data, and a seqlock
 * `revision` (odd = mid-write, even = stable) keeps cross-thread reads tear-free.
 *
 * It replaces three DRIFTING per-host layouts (native rg_pose.h, MediaPipe
 * rgp1.mjs, the .as bridge) with ONE shared header so a guest carried between
 * hosts reads pose from the same offsets everywhere.
 *
 * Transport, not taxonomy: the block defines POSITION, VELOCITY, SPEED, timing,
 * and confidence as bytes. What a `gesture` MEANS, and which landmark drives the
 * game, stay the guest's decision (§2.1).
 *
 * Coordinates are NORMALIZED and view-independent: positions are stored as
 * [0,1] * RG_POSE_FP_SCALE, never multiplied by a screen size. The guest scales
 * into its own world (x_world = xFp/FP_SCALE * worldW), so pose stops depending
 * on a view constant (the pose analog of the world-encoded-twice leak, §5).
 *
 * Read the total size from RG_POSE_OFF_SIZE — never assume it; the block grew
 * past the old 128 B precisely to carry motion.
 * --------------------------------------------------------------------------- */

#define RG_POSE_ABI_MAGIC   0x31504752u /* 'RGP1' little-endian            */
#define RG_POSE_ABI_VERSION 2u
#define RG_POSE_MAX_LM      33u          /* BlazePose skeleton              */
#define RG_POSE_FP_SCALE    256          /* positions: normalized[0,1]*256  */
#define RG_POSE_FP_VEL      65536        /* velocity/speed: Q16.16 per sec  */

/* Header (64 bytes) */
#define RG_POSE_OFF_MAGIC      0   /* u32 'RGP1'                                   */
#define RG_POSE_OFF_VERSION    4   /* u32 ABI version the host wrote               */
#define RG_POSE_OFF_SIZE       8   /* u32 total block bytes                        */
#define RG_POSE_OFF_REVISION   12  /* u32 seqlock: odd=writing, even=stable        */
#define RG_POSE_OFF_PRESENT    16  /* u32 1 if a pose was detected this sample     */
#define RG_POSE_OFF_GESTURE    20  /* i32 guest-defined gesture id (0 = none)      */
#define RG_POSE_OFF_LM_COUNT   24  /* u32 landmarks written this sample            */
#define RG_POSE_OFF_TIME_MS    28  /* i32 capture timestamp, monotonic ms          */
#define RG_POSE_OFF_DT_MS      32  /* i32 ms since the previous published sample    */
#define RG_POSE_OFF_FLAGS      36  /* u32 RG_POSE_FLAG_*                            */
#define RG_POSE_OFF_BODY_VX    40  /* i32 aggregate body velocity x (FP_VEL)       */
#define RG_POSE_OFF_BODY_VY    44  /* i32 aggregate body velocity y (FP_VEL)       */
#define RG_POSE_OFF_BODY_SPEED 48  /* i32 aggregate body speed |v| (FP_VEL)        */
/* 52..63 reserved */
#define RG_POSE_HEADER_SIZE    64

/* landmark[i] at RG_POSE_OFF_LM0 + i*RG_POSE_LM_SIZE */
#define RG_POSE_OFF_LM0        64
#define RG_POSE_LM_SIZE        24
#define RG_POSE_LM_OFF_X       0   /* i32 normalized x * FP_SCALE  (+x = right)     */
#define RG_POSE_LM_OFF_Y       4   /* i32 normalized y * FP_SCALE  (+y = down)      */
#define RG_POSE_LM_OFF_VX      8   /* i32 velocity x, normalized/sec * FP_VEL      */
#define RG_POSE_LM_OFF_VY      12  /* i32 velocity y, normalized/sec * FP_VEL      */
#define RG_POSE_LM_OFF_SPEED   16  /* i32 |velocity|, normalized/sec * FP_VEL      */
#define RG_POSE_LM_OFF_CONF    20  /* i32 visibility/confidence, 0..FP_SCALE       */
/* total size = RG_POSE_HEADER_SIZE + RG_POSE_MAX_LM*RG_POSE_LM_SIZE = 856 bytes;
 * always read it from RG_POSE_OFF_SIZE, never assume it.                          */
#define RG_POSE_ABI_SIZE  (RG_POSE_HEADER_SIZE + RG_POSE_MAX_LM * RG_POSE_LM_SIZE)

/* flags (RG_POSE_OFF_FLAGS) */
#define RG_POSE_FLAG_VALID         1u /* host finished a full frame                */
#define RG_POSE_FLAG_HAS_VEL       2u /* velocity/speed are host-provided          */
#define RG_POSE_FLAG_SMOOTHED      4u /* landmarks passed the host filter          */
#define RG_POSE_FLAG_JUST_APPEARED 8u /* present flipped 0->1; velocity zeroed      */

/* host capability bit (mirrors game_pose_provider.rgr and wasm_game_abi.h) */
#define RG_WASM_HOST_CAP_POSE_INPUT 0x0010u

/* ---------------------------------------------------------------------------
 * Motion and speed, defined precisely (so every host computes and every guest
 * reads the same thing):
 *
 * - Velocity of landmark i is v = (dx/dt, dy/dt) in normalized units per second,
 *   where dx, dy are the change in the *smoothed* normalized position between
 *   this sample and the previous, and dt = DT_MS/1000. Computed from the filtered
 *   signal, never the raw detector output. Sign matches coords: +x right, +y down.
 * - Speed of landmark i is the scalar |v| = sqrt(vx^2 + vy^2), same units,
 *   precomputed so a guest never needs a square root on the hot path.
 * - Body velocity / body speed are the aggregate of a stable central set (hip
 *   midpoint, falling back to the mean of visible landmarks): "how much is the
 *   player moving overall", independent of which joint a game cares about.
 * - Guest scaling to world units: vx_world = vxFp/FP_VEL * worldW, likewise vy.
 *   Because ABI speed is normalized it doubles as a resolution-independent
 *   "effort" measure that behaves the same on a 480x270 PoC and a 1080p camera.
 * - Fallback when HAS_VEL is 0: the host leaves velocity/speed zero; the guest
 *   differences positions across REVISION using DT_MS, and honours
 *   RG_POSE_FLAG_JUST_APPEARED to reset instead of registering a huge spurious
 *   jump when a body (re)enters frame.
 *
 * RGP1 plugs in as a GameProvider (direction host->guest, cadence per-frame,
 * capBit = RG_WASM_HOST_CAP_POSE_INPUT). A host without a camera advertises the
 * bit off; a guest that REQUIRES pose is rejected at load (§6), not fed zeros.
 * --------------------------------------------------------------------------- */

#endif
