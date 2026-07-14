#ifndef WASM_INPUT_ABI_H
#define WASM_INPUT_ABI_H

#include <stdint.h>

/* ---------------------------------------------------------------------------
 * RGIN — host->guest typed input for Ranger games (§2.9).
 *
 * Today RGW1 carries only two i32 bitfields (`input`, `input_p2`) — five digital
 * bits x two players — while the host tracks up to 8 players x 12 buttons and has
 * no channel at all for analog sticks, triggers, or a pointer/touch. RGIN is the
 * one typed per-player input surface that closes that gap without re-scattering
 * input across header words.
 *
 * Block: a small header (magic 'RGIN', version, size, player_count) followed by
 * record[player_count], each RG_IN_STRIDE (40) bytes. The host clamps
 * player_count to the negotiated max. The digital bitfield stays the simple
 * default (it maps 1:1 onto RGW1's `input`/`input_p2` as record[0]/record[1]
 * BUTTONS); analog/pointer are ADDITIVE — a guest that only reads BUTTONS is
 * unaffected.
 *
 * Same block discipline as every Ranger ABI: fixed typed layout, no pointers
 * cross, snapshot-first, host validates, seqlock revision for tear-free reads.
 * Direction: host->guest. Cadence: frame.
 * --------------------------------------------------------------------------- */

#define RG_IN_ABI_MAGIC   0x4e494752u /* 'RGIN' little-endian */
#define RG_IN_ABI_VERSION 1u
#define RG_IN_MAX_PLAYERS 8u
#define RG_IN_FP_SCALE    256         /* normalized axes: value * FP (§0.2)     */

/* Header (20 bytes) — carries the standard seqlock REVISION (IDEAL_API §0.3) so
 * a per-frame host->guest write is read tear-free. */
#define RG_IN_OFF_MAGIC        0   /* u32 'RGIN'                                */
#define RG_IN_OFF_VERSION      4   /* u32 ABI version the host wrote            */
#define RG_IN_OFF_SIZE         8   /* u32 total block bytes                     */
#define RG_IN_OFF_REVISION     12  /* u32 seqlock: odd=writing, even=stable     */
#define RG_IN_OFF_PLAYER_COUNT 16  /* u32 players written (host-clamped to MAX) */
#define RG_IN_HEADER_SIZE      20

/* record[p] at RG_IN_OFF_REC0 + p*RG_IN_STRIDE (40 bytes each) */
#define RG_IN_OFF_REC0     20
#define RG_IN_STRIDE       40
#define RG_IN_OFF_BUTTONS   0   /* u32 digital bitfield (D-pad, face, start/select) */
#define RG_IN_OFF_LSTICK_X  4   /* i32 left stick x,  -FP..+FP (normalized * FP)    */
#define RG_IN_OFF_LSTICK_Y  8   /* i32 left stick y                                 */
#define RG_IN_OFF_RSTICK_X  12  /* i32 right stick x                                */
#define RG_IN_OFF_RSTICK_Y  16  /* i32 right stick y                                */
#define RG_IN_OFF_TRIG_L    20  /* i32 left trigger,  0..FP                         */
#define RG_IN_OFF_TRIG_R    24  /* i32 right trigger, 0..FP                         */
#define RG_IN_OFF_POINTER_X 28  /* i32 pointer/touch x in view px (-1 = none)       */
#define RG_IN_OFF_POINTER_Y 32  /* i32 pointer/touch y                              */
#define RG_IN_OFF_FLAGS     36  /* u32 RG_IN_FLAG_* (pointerDown, connected, ...)   */

/* Digital button bits — the shipped base set (mirror RG_WASM_IN_* / RG_SPR_IN_*).
 * Games declare SEMANTIC actions ("jump", "steer") and the host maps physical
 * inputs -> actions through a remappable table the guest (or a settings UI)
 * supplies; these raw bits are the transport, not the game's vocabulary. */
#define RG_IN_BTN_UP     1u
#define RG_IN_BTN_DOWN   2u
#define RG_IN_BTN_LEFT   4u
#define RG_IN_BTN_RIGHT  8u
#define RG_IN_BTN_ACTION 16u
#define RG_IN_BTN_BACK   32u

/* record flags (RG_IN_OFF_FLAGS) */
#define RG_IN_FLAG_CONNECTED    1u /* this player's device is present            */
#define RG_IN_FLAG_POINTER_DOWN 2u /* pointer/touch is pressed this frame        */
#define RG_IN_FLAG_HAS_ANALOG   4u /* sticks/triggers are real (else digital-only) */
#define RG_IN_FLAG_HAS_POINTER  8u /* pointer/touch fields are valid              */

/* Device connect/disconnect (hotplug) and viewport resize are surfaced as
 * lifecycle EVENTS (§2.14), never as silent mid-frame value swaps. */

#endif
