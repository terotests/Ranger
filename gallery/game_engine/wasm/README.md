# Ranger WASM ABI — block index

The shared linear-memory contracts between the **host** (the Ranger engine,
`scripting/`) and a **guest** (a game compiled to WASM, or the interpreted `.as`
path).

> **Where guest sources live:** each WASM game's source crate/package sits next
> to the game itself as `games/<game>/src/` (e.g. `games/sprite_char/src/`,
> `games/rust_pong/src/`, `games/autopeli_wasm/src/`, `games/autopeli_as/src/`,
> `games/ui_menu/src/`, `games/ui_effects/src/`). This directory keeps only the
> shared ABI headers plus engine-side workers/POCs that are not games
> (`rust_worker/`, `as_resource_loader/`). Every block is a *transport*: it defines **bytes and structure**; the guest
assigns **meaning** (channel names, world, sound/character ids). No game name,
sound id, character kind, or control label belongs in a shared header — see
[`../IDEAL.md`](../IDEAL.md) §2.1 and [`../AGENTS.md`](../AGENTS.md).

Design and rationale live in [`../IDEAL.md`](../IDEAL.md); the consolidated API
surface in [`../IDEAL_API.md`](../IDEAL_API.md); the migration plan in
[`../IDEAL_TODO.md`](../IDEAL_TODO.md).

## Blocks

| Block | Header | Magic | Ver | Size | Direction | Cadence | Status |
|-------|--------|-------|-----|------|-----------|---------|--------|
| **RGW1** world / physics | [`wasm_game_abi.h`](./wasm_game_abi.h) | `'RGW1'` `0x31574752` | 1 | 2560 B | mostly guest→host (host→guest: `dt_ms`, `time_ms`, `input`, `input_p2`) | frame | shipped |
| **RGSP1** ready-character sprites | [`wasm_sprite_abi.h`](./wasm_sprite_abi.h) | `'RGSP'` `0x50534752` | 1 | 2560 B | host writes catalog+input, guest writes slots | frame | shipped |
| **RGU1** retained-mode UI | [`wasm_ui_abi.h`](./wasm_ui_abi.h) | `'RGU1'` `0x31554752` | 1.0 | 8192 B | guest→host (+ optional `rg_ui_event` back) | frame | shipped |
| **RGP1** pose / body tracking | [`wasm_pose_abi.h`](./wasm_pose_abi.h) | `'RGP1'` `0x31504752` | 2 | 856 B (read `OFF_SIZE`) | host→guest | frame | header landed (§2.4) |
| **RGIN** typed input | [`wasm_input_abi.h`](./wasm_input_abi.h) | `'RGIN'` `0x4e494752` | 1 | 20 + 40·players | host→guest | frame | header landed (§2.9) |
| **RGCQ** capability query | tail of `wasm_game_abi.h` | `'RGCQ'` `0x51434752` | — | RGW1 tail 2304..2560 | guest asks / host answers | setup | shipped |
| **RGO1** observation snapshot | *proposed* | — | — | — | host→worker | frame | planned (§2.7) |
| **RGX1** streaming worker | *proposed* | `'RGX1'` | — | 2560 B | host↔worker | frame | proven (mock handles) (§2.7) |
| **RGLD** resource loader | *proposed* | `'RGLD'` | — | — | host↔worker | frame | planned (§2.7) |
| **RG_CAM** camera + view matrix | *proposed* | — | — | — | guest→host (+ matrix back) | frame | planned (§2.17) |
| **RGMO** device motion / orientation | *proposed* | `'RGMO'` `0x4f4d4752` | — | header + sensors | host→guest | frame | planned (§2.19) |

Networking (`rg_net_*`, §2.20), in-app purchases (`rg_iap_*`, §2.21), and the mobile
host packaging model (§2.22) are **host imports + completion-event channels**, not
fixed byte blocks; their proposed shapes live in [`../ABI_V2_PROPOSAL.md`](../ABI_V2_PROPOSAL.md)
`V2 §19`–`§20`.

## Discipline every block copies (the RGU1 rule, §2.3 / IDEAL_API §0.3)

- **Fixed, typed layout** at documented byte offsets; no pointers ever cross.
- **Snapshot-first**: the writer publishes a complete, self-consistent block.
- **Host validates** the block as untrusted data (magic, version, size, counts
  clamped to their `MAX_*`, utf-8 where applicable).
- **Tear-free** cross-thread reads use a seqlock `revision` (odd = writing,
  even = stable) or a monotonic revision bump.

Standard header words a new block should carry:

```c
#define RG_*_OFF_MAGIC     0   /* u32 four-char block id, little-endian */
#define RG_*_OFF_VERSION   4   /* u32 ABI version the writer wrote      */
#define RG_*_OFF_SIZE      8   /* u32 total block bytes                 */
#define RG_*_OFF_REVISION  12  /* u32 seqlock: odd=writing, even=stable */
```

## Fixed-point (IDEAL_API §0.2)

| Constant | Value | Used for |
|----------|-------|----------|
| `FP_SCALE` | `256` | world/screen positions, normalized `[0,1]`, gain/pan/pitch ratios |
| `FP_VEL` | `65536` (Q16.16) | velocities and speeds, per second |

## Host capability bits (`RG_WASM_HOST_CAP_*`, IDEAL_API §8)

A guest ORs the bits it requires into `rg_required_caps()`; the host advertises the
OR of its providers' `capBit()`s and rejects an unsatisfiable guest at load.

| Bit | Value | Gates |
|-----|-------|-------|
| `PHYSICS` | `0x0001` | host runs `GamePhysics` for the guest |
| `RUMBLE` | `0x0002` | gamepad rumble events honoured (dual-motor target) |
| `PARTICLES` | `0x0004` | particle events honoured |
| `RGU1` | `0x0008` | retained-mode HUD (RGU1) parsed |
| `POSE_INPUT` | `0x0010` | RGP1 pose streaming + motion/speed |
| `UI_DYNAMIC` | `0x0020` | handle-based dynamic EVG UI (`rg_evg_*`) — reserved |
| `RES_STREAM` | `0x0040` | `rg_res_*` streaming resources / workers — reserved |
| `MOTION` | `0x0080` | RGMO device motion / orientation sensors (§2.19) — reserved |
| `NET` | `0x0100` | `rg_net_*` online services / multiplayer (§2.20) — reserved |
| `IAP` | `0x0200` | `rg_iap_*` in-app purchases / entitlements (§2.21) — reserved |

Mobile **haptics** reuses `RUMBLE` (`0x0002`), generalised from "gamepad rumble" to
"haptics" (Taptic Engine / Core Haptics / Android `VibrationEffect`, §2.9). Bits
`0x0400` and up are reserved; assign additively, never reuse a retired bit.

## Guest paths

The compiled-WASM path ([`../scripting/wasm_abi_io.rgr`](../scripting/wasm_abi_io.rgr))
and the interpreted `.as` path
([`../scripting/as_abi_bridge.rgr`](../scripting/as_abi_bridge.rgr)) must expose the
**same** capabilities against the **same** offsets. A game written once must behave
identically on both backends (IDEAL.md "Parity across guest paths").
