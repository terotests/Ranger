#ifndef WASM_SPRITE_ABI_H
#define WASM_SPRITE_ABI_H

#include <stdint.h>

/* ---------------------------------------------------------------------------
 * RGSP1 — Ready-character sprite ABI for Ranger WASM guests.
 *
 * This is the sprite counterpart of the fixed SOUND set in wasm_game_abi.h. A
 * guest does NOT ship character art or animation code: it picks a character
 * from a host-provided catalog by numeric id — exactly like it plays a sound by
 * writing RG_WASM_SOUND_* — sets an animation + direction + world position, and
 * the host resolves id -> spritesheet + animation rows and draws + animates it.
 *
 * The whole exchange is one shared linear-memory block, same shape as the other
 * Ranger WASM ABIs (RGW1 game, RGX1 streaming, RGLD loader):
 *
 *   host each tick:   writes dt_ms, time_ms, char_count (catalog size), input
 *   guest each tick:  writes slot_count and, per slot, {charId, anim, dir,
 *                     flags, xFp, yFp, animClockMs, frame}
 *   host after tick:  reads active slots, draws each character, and MAY write
 *                     the resolved frame back into slot.frame for inspection
 *
 * Fixed-point: divide i32 world coords by RG_SPR_FP_SCALE for pixels/units.
 * All offsets are relative to the guest's exported block pointer.
 * --------------------------------------------------------------------------- */

#define RG_SPR_ABI_MAGIC   0x50534752u /* 'RGSP' little-endian */
#define RG_SPR_ABI_VERSION 1u
#define RG_SPR_ABI_SIZE    2560u

#define RG_SPR_FP_SCALE    256

#define RG_SPR_MAX_SLOTS   64u
#define RG_SPR_SLOT_SIZE   32u

/* Header (64 bytes) */
#define RG_SPR_OFF_MAGIC       0   /* u32 guest: 'RGSP' once init'd            */
#define RG_SPR_OFF_VERSION     4   /* u32 guest: ABI version it built against  */
#define RG_SPR_OFF_SIZE        8   /* u32 guest: RG_SPR_ABI_SIZE               */
#define RG_SPR_OFF_DT_MS       12  /* i32 host:  ms since last tick            */
#define RG_SPR_OFF_TIME_MS     16  /* i32 host:  monotonic ms (optional clock) */
#define RG_SPR_OFF_CHAR_COUNT  20  /* i32 host:  characters available (catalog)*/
#define RG_SPR_OFF_SLOT_COUNT  24  /* i32 guest: slots to draw this tick       */
#define RG_SPR_OFF_INPUT       28  /* i32 host:  input flags (RG_SPR_IN_*)     */
#define RG_SPR_OFF_INPUT_P2    32  /* i32 host:  second player input flags     */
#define RG_SPR_OFF_VIEW_W      36  /* i32 host:  view width in px (layout)     */
#define RG_SPR_OFF_VIEW_H      40  /* i32 host:  view height in px (layout)    */
#define RG_SPR_OFF_MODE        44  /* i32 guest: 0 = menu (select), 1 = play   */
#define RG_SPR_HEADER_SIZE     64

/* guest mode values (RG_SPR_OFF_MODE) */
#define RG_SPR_MODE_MENU       0
#define RG_SPR_MODE_PLAY       1

/* Slot array (guest writes; host reads). slot i lives at OFF_SLOTS + i*SLOT_SIZE. */
#define RG_SPR_OFF_SLOTS       64
#define RG_SPR_SLOT_OFF_CHARID 0   /* i32 catalog id, 0 = empty slot (skipped) */
#define RG_SPR_SLOT_OFF_ANIM   4   /* i32 RG_SPR_ANIM_*                        */
#define RG_SPR_SLOT_OFF_DIR    8   /* i32 RG_SPR_DIR_*                         */
#define RG_SPR_SLOT_OFF_FLAGS  12  /* i32 RG_SPR_SLOT_* bits                   */
#define RG_SPR_SLOT_OFF_XFP    16  /* i32 world x * FP_SCALE                   */
#define RG_SPR_SLOT_OFF_YFP    20  /* i32 world y * FP_SCALE (ground/feet y)   */
#define RG_SPR_SLOT_OFF_CLOCK  24  /* i32 per-slot animation clock, ms         */
#define RG_SPR_SLOT_OFF_FRAME  28  /* i32 explicit frame (with FRAMEOVERRIDE), */
                                   /*     else host writes the resolved frame  */

/* Catalog id table (host writes) — lets a guest enumerate the ready set for
 * forward-compat, rather than hard-coding 1..char_count. count is CHAR_COUNT. */
#define RG_SPR_OFF_CAT_IDS     2112 /* i32[RG_SPR_MAX_CAT] available char ids  */
#define RG_SPR_MAX_CAT         32u

/* --- Character ids (mirror lpc_char_catalog.rgr + pack/characters/catalog.json) */
#define RG_SPR_CHAR_HERO    1
#define RG_SPR_CHAR_KNIGHT  2
#define RG_SPR_CHAR_MAGE    3
#define RG_SPR_CHAR_ROGUE   4
#define RG_SPR_CHAR_COUNT   4

/* --- Animation ids (atlas rows). run/jump reserve their real LPC rows and the
 * host falls back to walk (+ a synthesised hop for jump) until expanded art is
 * baked into the pack. A guest can therefore already target them today. */
#define RG_SPR_ANIM_WALK    0
#define RG_SPR_ANIM_RUN     1
#define RG_SPR_ANIM_JUMP    2

/* --- Directions (walk-sheet row order) */
#define RG_SPR_DIR_UP       0
#define RG_SPR_DIR_LEFT     1
#define RG_SPR_DIR_DOWN     2
#define RG_SPR_DIR_RIGHT    3

/* --- slot.flags bits */
#define RG_SPR_SLOT_ACTIVE        1u /* draw this slot                         */
#define RG_SPR_SLOT_FRAMEOVERRIDE 2u /* use slot.frame instead of host timing  */
#define RG_SPR_SLOT_FLIP_X        4u /* mirror horizontally (e.g. reuse LEFT)  */

/* --- input_flags bits (host convenience, same layout as RGW1) */
#define RG_SPR_IN_UP     1u
#define RG_SPR_IN_DOWN   2u
#define RG_SPR_IN_LEFT   4u
#define RG_SPR_IN_RIGHT  8u
#define RG_SPR_IN_ACTION 16u
#define RG_SPR_IN_BACK   32u  /* host feeds this in play mode -> guest to menu  */

/* ---------------------------------------------------------------------------
 * Exports a guest SHOULD provide (host-driven, same shape as the other ABIs):
 *   i32 sprite_ptr(void);      // pointer to the RGSP1 block in linear memory
 *   i32 sprite_size(void);     // RG_SPR_ABI_SIZE
 *   void sprite_init(void);    // write magic/version/size, initial slots
 *   void sprite_tick(void);    // read host header, (re)write slot_count + slots
 * A guest MAY also export i32 rg_abi_version(void) returning RG_SPR_ABI_VERSION
 * so an older host can reject a newer guest instead of misreading slots.
 * --------------------------------------------------------------------------- */

#endif
