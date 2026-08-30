# gallery/ui/bench — WebGL vs Radix/DOM

How fast the EVG controllers paint, next to the same fixtures running as
real [Radix](https://www.radix-ui.com/) / [TanStack Table](https://tanstack.com/table) /
[dnd-kit](https://dndkit.com/) in the same Chromium.

```bash
npm run ui:conformance:install   # once
npm run ui:bench
```

This is not the conformance gate. The gate asks whether the two sides *agree*.
This asks how long each side takes to put N rows on screen, and how the cost
grows.

## Two families of scenes

**`showcase-*`** — the six demos on `/gallery/ui/demo`. Timed through the
same path that page uses: build a display list, serialise it to JSON, parse
it, hand it to `evg-webgl.js`. There is no DOM twin. Those trees are
decorated (icons, badges, overlays) and comparing them to a bare Radix
control would measure clothes, not the engine.

**`kit-*`** — the fair pair. `UiHost` + `buildHost` on the left, the
conformance `App` on the right, one fixture. A table of 200 rows is the same
200 records, the same five columns, the same page size.

Inside `kit-*` the table splits again:

| series | what is on screen | what grows |
| --- | --- | --- |
| `table-visible` | every row (`pageSize = n`) | paint cost |
| `table-model` | one page of 20 | sort / model cost |

Neither side virtualises. A 200-row visible table is 200 rows in the EVG
tree and 200 `<tr>`s in the DOM. That is the comparison people actually
mean when they ask how much data a canvas UI can show.

## What the numbers are

EVG is timed in four pieces, because a slow frame can be any of them:

| column | what |
| --- | --- |
| `layout` | stylesheet + flex layout |
| `dlist` | walk the tree into draw commands |
| `json` / `parse` | `toJson` + `JSON.parse` — the showcase page pays this every frame; a native host does not |
| `webgl` | `renderDisplayList` |
| `engine` | layout + display list, no serialise |
| `showcase` / `evg-all` | the lot, including WebGL |
| `upd-e` / `upd-d` | one interaction (sort a column, open an accordion, toggle a checkbox) then a full paint |

DOM `mount` is `createRoot.render` plus two animation frames — the same
settle the conformance harness waits, so React 18 has committed and the
browser has painted.

Medians, after one warmup. Headless SwiftShader is slower than a laptop
GPU: read the **ratios** and the way cost grows with `n`, not the
milliseconds as a promise about a user's machine.

`dom÷evg` is `mount / showcase`. Greater than one means the DOM commit was
slower than EVG's full paint of the same fixture.

## Reading a result

A canvas UI wins when the tree stays small. `TableCtl` only *builds* the
current page, so a 5 000-row model with `pageSize=20` should paint like a
20-row table on both sides — the extra cost is sorting the records, not
drawing them. An unpaged 200-row table is the honest "how much can you
show" question: EVG still emits one display-list command per box and
glyph; the DOM still has one node per cell.

JSON is a real tax. The demo page serialises the list every frame so the
painter can stay a separate module. A host that already has the
`EVGDisplayList` (SDL, the C++ painter) skips `json` + `parse` entirely;
compare `engine` to `mount` for that story.
