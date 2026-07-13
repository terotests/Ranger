#ifndef WASM_UI_ABI_H
#define WASM_UI_ABI_H

#include <stdint.h>

/* RGU1 — Ranger Game UI ABI, version 1.
 *
 * A flat, retained-mode "virtual DOM" that a WASM guest builds in its own
 * linear memory and the host reads once per frame, converting it into an
 * abstract UI tree (host maps that to EVGElement + EVGLayout + rasterizer).
 *
 * Design principles (see the RGU1 design notes):
 *   - The guest owns the UI document; the host owns EVG/rendering.
 *   - No host pointers or EVG objects ever cross into the guest.
 *   - The tree stays FLAT: parent_id + child_order fully describe structure.
 *   - Colors are packed 0xRRGGBBAA; strings live in a string table and are
 *     referenced by (offset, length) so no structure holds a pointer.
 *   - The host treats the whole block as UNTRUSTED data and validates it
 *     (magic, version, bounds, unique ids, valid parents, acyclic, utf-8)
 *     before accepting it.
 *   - Snapshot-first: the guest rewrites the whole document; `revision`
 *     changes only when the rendered content changes, so the host can skip
 *     re-reading identical frames and diff by stable node id when it does.
 *
 * This is a SEPARATE, independently-versioned section from the RGW1 world/
 * physics block (wasm_game_abi.h). The guest exports its location:
 *
 *     uint32_t rg_ui_ptr(void);       // base offset in WASM linear memory
 *     uint32_t rg_ui_size(void);      // total bytes of the UI block
 *     uint32_t rg_ui_revision(void);  // bumps when the document changes
 *
 * All offsets in the header are relative to rg_ui_ptr() (the block base).
 */

#define RG_UI_ABI_MAGIC     0x31554752u /* 'RGU1' little-endian */
#define RG_UI_ABI_MAJOR     1u
#define RG_UI_ABI_MINOR     0u

/* ---- Block layout (guest static buffer) -------------------------------- */
/* Fixed capacities keep the guest allocation-free; the header still carries
 * the actual offsets/counts so the host never assumes these constants. */
#define RG_UI_HEADER_SIZE   48u
#define RG_UI_NODE_OFFSET   64u          /* aligned start of node table       */
#define RG_UI_MAX_NODES     64u
#define RG_UI_NODE_SIZE     32u
#define RG_UI_PROP_OFFSET   (RG_UI_NODE_OFFSET + RG_UI_MAX_NODES * RG_UI_NODE_SIZE)   /* 2112 */
#define RG_UI_MAX_PROPS     128u
#define RG_UI_PROP_SIZE     16u
#define RG_UI_STRING_OFFSET (RG_UI_PROP_OFFSET + RG_UI_MAX_PROPS * RG_UI_PROP_SIZE)   /* 4160 */
#define RG_UI_STRING_CAP    1024u
#define RG_UI_SIZE          8192u        /* total block size, with slack      */

/* ---- Header (48 bytes) ------------------------------------------------- */
#define RG_UI_OFF_MAGIC          0   /* u32 'RGU1'                            */
#define RG_UI_OFF_MAJOR          4   /* u16                                   */
#define RG_UI_OFF_MINOR          6   /* u16                                   */
#define RG_UI_OFF_REVISION       8   /* u32 bumps on content change           */
#define RG_UI_OFF_ROOT_ID        12  /* u32 id of the root node               */
#define RG_UI_OFF_NODE_OFFSET    16  /* u32 byte offset of node table         */
#define RG_UI_OFF_NODE_COUNT     20  /* u32 number of nodes                   */
#define RG_UI_OFF_PROP_OFFSET    24  /* u32 byte offset of property table     */
#define RG_UI_OFF_PROP_COUNT     28  /* u32 number of properties              */
#define RG_UI_OFF_STRING_OFFSET  32  /* u32 byte offset of string table       */
#define RG_UI_OFF_STRING_SIZE    36  /* u32 bytes used in the string table    */
#define RG_UI_OFF_FLAGS          40  /* u32 document flags                    */
#define RG_UI_OFF_RESERVED0      44  /* u32                                   */

struct RgUiHeader {
    uint32_t magic;
    uint16_t major_version;
    uint16_t minor_version;
    uint32_t revision;
    uint32_t root_id;
    uint32_t node_offset;
    uint32_t node_count;
    uint32_t property_offset;
    uint32_t property_count;
    uint32_t string_offset;
    uint32_t string_size;
    uint32_t flags;
    uint32_t reserved0;
};

/* ---- Node (32 bytes) --------------------------------------------------- */
#define RG_UI_NODE_OFF_ID         0   /* u32 unique, stable across frames     */
#define RG_UI_NODE_OFF_PARENT_ID  4   /* u32 0 == root's parent (no parent)   */
#define RG_UI_NODE_OFF_KIND       8   /* u16 RgUiNodeKind                     */
#define RG_UI_NODE_OFF_FLAGS      10  /* u16                                  */
#define RG_UI_NODE_OFF_FIRST_PROP 12  /* u32 index into property table        */
#define RG_UI_NODE_OFF_PROP_COUNT 16  /* u16 contiguous property run length   */
#define RG_UI_NODE_OFF_CHILD_ORDER 18 /* u16 sort key among siblings          */
#define RG_UI_NODE_OFF_EVENT_MASK 20  /* u32 events the node subscribes to    */
#define RG_UI_NODE_OFF_RESERVED0  24  /* u32                                  */
#define RG_UI_NODE_OFF_RESERVED1  28  /* u32                                  */

struct RgUiNode {
    uint32_t id;
    uint32_t parent_id;
    uint16_t kind;
    uint16_t flags;
    uint32_t first_property;
    uint16_t property_count;
    uint16_t child_order;
    uint32_t event_mask;
    uint32_t reserved_0;
    uint32_t reserved_1;
};

enum RgUiNodeKind {
    RG_UI_VIEW         = 1,
    RG_UI_TEXT         = 2,
    RG_UI_IMAGE        = 3,
    RG_UI_PROGRESS_BAR = 4,
    RG_UI_BUTTON       = 5,  /* interactive: focusable + activatable (Phase 3) */
    RG_UI_SPACER       = 6,
    RG_UI_CUSTOM       = 100
};

/* ---- Node flags (node.flags, u16) -------------------------------------- */
/* Interactivity is opt-in per node: the guest tags which nodes the host may
 * select, and the host drives selection with the gamepad/keyboard D-pad (no
 * pointer required). See "Selection & activation" below. */
#define RG_UI_NODEFLAG_SELECTABLE  0x0001u  /* host may move the cursor here   */
#define RG_UI_NODEFLAG_DISABLED    0x0002u  /* skip in navigation, dim it      */
#define RG_UI_NODEFLAG_DEFAULT     0x0004u  /* initial selection on first frame*/

/* ---- Event mask (node.event_mask, u32) --------------------------------- */
/* Which host->guest events a node wants. The host only calls back for nodes
 * that subscribe, so a plain label costs nothing. */
#define RG_UI_EVENT_ACTIVATE  0x0001u  /* action button pressed while selected */
#define RG_UI_EVENT_SELECT    0x0002u  /* selection cursor moved onto the node */
#define RG_UI_EVENT_DESELECT  0x0004u  /* selection cursor left the node       */

/* ---- Selection & activation (host -> guest) ----------------------------
 * The RGU1 document is guest->host (the guest builds it, the host renders it).
 * Selection navigation and "button recognition" flow back the other way via an
 * OPTIONAL guest export the host calls when something happens:
 *
 *     void rg_ui_event(uint32_t node_id, uint32_t event, uint32_t value);
 *
 *   event  = one of RG_UI_EVENT_* (ACTIVATE / SELECT / DESELECT)
 *   value  = event-specific payload (0 for ACTIVATE; reserved otherwise)
 *
 * Flow each frame:
 *   1. Guest builds the document, tagging selectable nodes with
 *      RG_UI_NODEFLAG_SELECTABLE and (optionally) RG_UI_NODEFLAG_DEFAULT, and
 *      subscribing to RG_UI_EVENT_ACTIVATE on the ones that react to a press.
 *   2. Host reads the doc, lays it out, and tracks a selection cursor over the
 *      selectable nodes. The D-pad / arrow keys move it (spatially: nearest
 *      selectable node in the pressed direction); the host draws a highlight
 *      border around the selected node.
 *   3. On the action button, if the selected node subscribed to ACTIVATE, the
 *      host calls rg_ui_event(selected_id, RG_UI_EVENT_ACTIVATE, 0). The guest
 *      reacts (e.g. changes state) and the next document reflects it.
 *
 * If the guest does not export rg_ui_event, the host still navigates and
 * highlights; activation is simply not delivered. Selection state lives on the
 * HOST (keyed by stable node id) so it survives document rebuilds.
 */

/* ---- Property (16 bytes) ----------------------------------------------- */
#define RG_UI_PROP_OFF_KEY      0   /* u16 RgUiPropertyKey                    */
#define RG_UI_PROP_OFF_TYPE     2   /* u8  RgUiPropertyType                   */
#define RG_UI_PROP_OFF_FLAGS    3   /* u8                                     */
#define RG_UI_PROP_OFF_VALUE_A  4   /* u32                                    */
#define RG_UI_PROP_OFF_VALUE_B  8   /* u32                                    */
#define RG_UI_PROP_OFF_VALUE_C  12  /* u32                                    */

struct RgUiProperty {
    uint16_t key;
    uint8_t  type;
    uint8_t  flags;
    uint32_t value_a;
    uint32_t value_b;
    uint32_t value_c;
};

enum RgUiPropertyType {
    RG_UI_PROP_I32    = 1,
    RG_UI_PROP_F32    = 2,  /* value_a is the f32 bit pattern                 */
    RG_UI_PROP_COLOR  = 3,  /* value_a is 0xRRGGBBAA                          */
    RG_UI_PROP_STRING = 4,  /* value_a = byte offset into string table,      */
                            /* value_b = length in bytes                     */
    RG_UI_PROP_VEC2   = 5,  /* value_a, value_b are two i32/f32              */
    RG_UI_PROP_RECT   = 6,  /* value_a..value_c + one implied = x,y,w,h      */
    RG_UI_PROP_ENUM   = 7,  /* value_a is an enum member                     */
    RG_UI_PROP_BOOL   = 8   /* value_a is 0 or 1                             */
};

enum RgUiPropertyKey {
    RG_UI_KEY_TEXT           = 1,   /* string                                 */
    RG_UI_KEY_BACKGROUND     = 2,   /* color                                  */
    RG_UI_KEY_COLOR          = 3,   /* color (text/foreground)                */
    RG_UI_KEY_FONT_SIZE      = 4,   /* i32 px                                 */
    RG_UI_KEY_FONT_FAMILY    = 5,   /* string                                 */

    RG_UI_KEY_WIDTH          = 10,  /* i32 px                                 */
    RG_UI_KEY_HEIGHT         = 11,  /* i32 px                                 */
    RG_UI_KEY_PADDING        = 12,  /* i32 px (all sides)                     */
    RG_UI_KEY_MARGIN         = 13,  /* i32 px (all sides)                     */

    RG_UI_KEY_FLEX           = 20,  /* i32 (flex-grow)                        */
    RG_UI_KEY_FLEX_DIRECTION = 21,  /* enum RgUiFlexDirection                 */
    RG_UI_KEY_ALIGN_ITEMS    = 22,  /* enum RgUiAlign                         */
    RG_UI_KEY_JUSTIFY        = 23,  /* enum RgUiAlign                         */

    RG_UI_KEY_IMAGE_RESOURCE = 30,  /* string (host resource id)              */

    RG_UI_KEY_VALUE          = 40,  /* i32 (progress bar current)             */
    RG_UI_KEY_MAX_VALUE      = 41   /* i32 (progress bar max)                 */
};

enum RgUiFlexDirection {
    RG_UI_DIR_ROW    = 0,
    RG_UI_DIR_COLUMN = 1
};

enum RgUiAlign {
    RG_UI_ALIGN_START         = 0,
    RG_UI_ALIGN_CENTER        = 1,
    RG_UI_ALIGN_END           = 2,
    RG_UI_ALIGN_SPACE_BETWEEN = 3
};

/* ---- Document flags ---------------------------------------------------- */
#define RG_UI_FLAG_VALID  1u  /* guest sets once the document is fully built  */

#endif /* WASM_UI_ABI_H */
