#ifndef WASM_GAME_ABI_H
#define WASM_GAME_ABI_H

#include <stdint.h>

/* Shared linear-memory ABI for Ranger WASM games (Path C).
 * Fixed-point: divide i32 by RG_WASM_FP_SCALE for world units.
 * All offsets relative to abi_base() pointer in WASM linear memory. */

#define RG_WASM_ABI_MAGIC   0x31574752u /* 'RGW1' little-endian */
#define RG_WASM_ABI_VERSION 1u
#define RG_WASM_ABI_SIZE    2560u

#define RG_WASM_FP_SCALE    256
#define RG_WASM_GRIP_SCALE  1000
#define RG_WASM_STEER_SCALE 1000

#define RG_WASM_MAX_BODIES   32u
#define RG_WASM_MAX_IMPULSES 16u
#define RG_WASM_MAX_ENTITIES 64u
#define RG_WASM_MAX_CONTACTS 14u
#define RG_WASM_MAX_EVENTS   12u

#define RG_WASM_BODY_SIZE    24u
#define RG_WASM_CONTROL_SIZE 16u
#define RG_WASM_IMPULSE_SIZE 16u
#define RG_WASM_ENTITY_SIZE  16u
#define RG_WASM_CONTACT_SIZE 32u
#define RG_WASM_EVENT_SIZE   20u

/* Header (64 bytes) */
#define RG_WASM_OFF_MAGIC        0
#define RG_WASM_OFF_VERSION      4
#define RG_WASM_OFF_SIZE         8
#define RG_WASM_OFF_DT_MS        12
#define RG_WASM_OFF_TIME_MS      16
#define RG_WASM_OFF_INPUT        20
#define RG_WASM_OFF_INPUT_P2     24
#define RG_WASM_OFF_BODY_COUNT   28
#define RG_WASM_OFF_IMPULSE_CNT  32
#define RG_WASM_OFF_CONTACT_CNT  36
#define RG_WASM_OFF_SCORE        40
#define RG_WASM_OFF_HITS         44
#define RG_WASM_OFF_CAMERA_Y     48
#define RG_WASM_OFF_EVENT_CNT    52
#define RG_WASM_OFF_AIR_P1       56
#define RG_WASM_OFF_AIR_P2       60
#define RG_WASM_HEADER_SIZE      64

#define RG_WASM_OFF_BODIES       64
#define RG_WASM_OFF_CONTROLS     (RG_WASM_OFF_BODIES + RG_WASM_MAX_BODIES * RG_WASM_BODY_SIZE)
#define RG_WASM_OFF_IMPULSES     (RG_WASM_OFF_CONTROLS + RG_WASM_MAX_BODIES * RG_WASM_CONTROL_SIZE)
#define RG_WASM_OFF_CONTACTS     (RG_WASM_OFF_IMPULSES + RG_WASM_MAX_IMPULSES * RG_WASM_IMPULSE_SIZE)
#define RG_WASM_OFF_EVENTS       2048u

/* contact[i]: bodyA, bodyB, phase, impulseFp, xFp, yFp, nxMilli, nyMilli (32 bytes) */
#define RG_WASM_CONTACT_PHASE_BEGIN 1

/* event[i]: kind, sub, a, b, c (20 bytes) — kind: 1=sound 2=rumble 3=particles */
#define RG_WASM_EVENT_SOUND      1u
#define RG_WASM_EVENT_RUMBLE     2u
#define RG_WASM_EVENT_PARTICLES  3u
#define RG_WASM_SOUND_WALL       1u
#define RG_WASM_SOUND_BOUNCE     2u
#define RG_WASM_SOUND_WIN        3u

/* contact body id encoding (i32) */
#define RG_WASM_ID_WALL_L  1000
#define RG_WASM_ID_WALL_R  1001
#define RG_WASM_ID_CONE0   100
#define RG_WASM_ID_BAR0    200

/* input_flags bits */
#define RG_WASM_IN_UP     1u
#define RG_WASM_IN_DOWN   2u
#define RG_WASM_IN_LEFT   4u
#define RG_WASM_IN_RIGHT  8u
#define RG_WASM_IN_ACTION 16u

/* body.flags bits */
#define RG_WASM_BODY_ACTIVE 1u

/* Standard body indices (autopeli) */
#define RG_WASM_BODY_P1 0
#define RG_WASM_BODY_P2 1
#define RG_WASM_BODY_TRAFFIC0 2
#define RG_WASM_TRAFFIC_COUNT 15

/* ---------------------------------------------------------------------------
 * Forward-compat handshake (old host, newer guest)
 *
 * A guest MAY export these pure, side-effect-free probes. A host calls them
 * BEFORE it trusts the shared block or enters the game loop, so it can reject a
 * guest it cannot run instead of crashing on a moved offset / unknown event /
 * missing host import:
 *
 *   i32 rg_abi_version(void);    // RGW1 version the guest was built against
 *   i32 rg_ui_abi(void);         // (RGU1_major << 16) | RGU1_minor
 *   i32 rg_required_caps(void);  // bitmask of RG_WASM_HOST_CAP_* it needs
 *
 * Backward-compatible by construction: a guest that does NOT export
 * rg_abi_version (legacy builds) is treated as ABI v1, caps 0. Recommended host
 * gate, run right after load and before init():
 *
 *   ver  = has(rg_abi_version)   ? call(rg_abi_version)   : 1;
 *   need = has(rg_required_caps) ? call(rg_required_caps) : 0;
 *   if (ver > RG_WASM_ABI_VERSION) reject("needs newer host");   // major/layout
 *   if (need & ~RG_WASM_HOST_CAPS) reject("missing capability"); // feature gap
 *   // then init(), verify RGW1 magic + size, clamp all counts to the MAX_* below.
 * --------------------------------------------------------------------------- */
#define RG_WASM_HOST_CAP_PHYSICS   0x0001u /* host runs GamePhysics for the guest */
#define RG_WASM_HOST_CAP_RUMBLE    0x0002u /* gamepad rumble events honoured      */
#define RG_WASM_HOST_CAP_PARTICLES 0x0004u /* particle events honoured            */
#define RG_WASM_HOST_CAP_RGU1      0x0008u /* retained-mode HUD (RGU1) parsed      */
/* Bits 0x0010.. are reserved for future host features. Assign additively and
 * never reuse a retired bit. RG_WASM_HOST_CAPS is what a given host advertises;
 * it is defined by the host build, not here. */

/* ---------------------------------------------------------------------------
 * Capability query (RGCQ) — typed key/value negotiation
 *
 * rg_required_caps() is a compact "hard must-haves" bitmask. The query below is
 * the richer, OPEN counterpart: the guest asks the host a *list of string keys*
 * and gets back a *list of typed values* (bool / int / float / string), each
 * with a "present" flag. Keys are convention, not ABI — "physics", "debugmode",
 * "screen.width", "gpu", ... — so new keys need no format change. Version says
 * "can you parse my bytes"; this says "what can this device do", and the guest
 * uses it to ADAPT (narrow screen, no GPU, no gamepad are soft) and only rarely
 * to abort via rg_check_env().
 *
 * The whole exchange lives in the reserved ABI tail (2304..2560), so ABI_SIZE
 * and every offset above are unchanged and a host that ignores it degrades to
 * "nothing answered" (the guest then reads its own defaults). Flow:
 *   1. host calls rg_declare_queries()  -> guest writes its keys to the request
 *   2. host resolves each key, writes a typed value + present, sets ready = 1
 *   3. host calls i32 rg_check_env()    -> guest adapts; 0 = run, !=0 = reason
 * Absence of rg_declare_queries / rg_check_env means the guest doesn't negotiate.
 */
#define RG_WASM_OFF_CAPQ        2304  /* capability-query block base            */
#define RG_WASM_CAPQ_MAGIC      0x51434752u /* 'RGCQ' little-endian             */
#define RG_WASM_CAPQ_OFF_MAGIC  0     /* u32 guest: 'RGCQ' once declared        */
#define RG_WASM_CAPQ_OFF_COUNT  4     /* u32 guest: number of requested keys    */
#define RG_WASM_CAPQ_OFF_READY  8     /* u32 host:  1 when answers are filled   */
#define RG_WASM_CAPQ_OFF_POOL_USED 12 /* u32 guest: key bytes used in the pool  */
#define RG_WASM_CAPQ_ENTRIES    2320  /* entry[] base (RG_WASM_OFF_CAPQ + 16)   */
#define RG_WASM_CAPQ_MAX        6     /* max requested keys                     */
#define RG_WASM_CAPQ_ENTRY_SIZE 20
#define RG_WASM_CAPQ_POOL       2440  /* string pool base ... to ABI_SIZE       */
/* entry: keyOff(u16) keyLen(u16) present(u8) type(u8) _(u16) ival(i32) fval(f32)
 *        sLen(i32) — guest writes keyOff/keyLen; host writes the rest.          */
#define RG_WASM_CAP_NONE   0u
#define RG_WASM_CAP_BOOL   1u
#define RG_WASM_CAP_INT    2u
#define RG_WASM_CAP_FLOAT  3u
#define RG_WASM_CAP_STRING 4u

#endif
