# as_ui_menu — AssemblyScript selectable-menu WASM guest

A minimal **WASM text example** for the RGU1 UI bridge: an AssemblyScript guest
that builds a **selectable menu** the host navigates with the **gamepad /
keyboard** (no pointer) and highlights, and that reacts to the **action button**.

It reuses the shared RGU1 builder in
[`../as_autopeli/assembly/ui.ts`](../as_autopeli/assembly/ui.ts) — including the
interactivity helpers added for this feature:

```ts
ui.reset();
ui.view(1, 0, 0).column().padding(12);
ui.label(10, 1, 0, "WASM UI - Main Menu", 0xffffffff, 20);
ui.button(20, 1, 1, "New Game", C_ITEM, 16).onActivate().defaultSelected();
ui.button(21, 1, 2, "Continue", C_ITEM, 16).onActivate();
ui.label(90, 1, 5, "plays: " + PLAYS.toString(), C_STATUS, 13); // not selectable
ui.finish(revision);
```

* `.selectable()` — the host's D-pad/keyboard cursor may land here.
* `.onActivate()` — selectable **and** subscribes to the ACTIVATE callback.
* `.defaultSelected()` — the host highlights this node first.

## Selection & activation (host ↔ guest)

The document is guest→host. Selection and "button recognition" flow back via an
optional export the host calls:

```ts
export function rg_ui_event(nodeId: u32, event: u32, value: u32): void { … }
```

Each frame: the host reads the doc, tracks a selection cursor over the selectable
nodes, moves it with the D-pad (nearest selectable node in the pressed
direction), and on the action button calls `rg_ui_event(selectedId, ACTIVATE, 0)`.
This guest bumps a counter and rebuilds, so the next document shows `plays: N`.
See the ABI contract in [`../wasm_ui_abi.h`](../wasm_ui_abi.h) and the host side
in [`../../ui/WasmUiSelect.rgr`](../../ui/WasmUiSelect.rgr).

## Build & verify

```bash
bash gallery/game_engine/games/ui_menu/src/build.sh     # -> build/logic.wasm
node gallery/game_engine/games/ui_menu/src/tools/parity.cjs   # instantiates it, checks the bytes
# or, from the repo root:
npm run engine:ui:wasm-guest
```

`parity.cjs` instantiates the real `.wasm`, reads the RGU1 block out of linear
memory, asserts the selectable/default/activate flags, then calls
`rg_ui_event(20, ACTIVATE, 0)` and checks the guest reacted (`plays()` → 1,
`rg_ui_revision()` bumped).

The **host** counterpart (Ranger, renders + navigates + highlights) is
`gallery/game_engine/ui/wasm_ui_select_demo.rgr` — run `npm run engine:ui:wasm-select`.
