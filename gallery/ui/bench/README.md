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
| `build` | `ctl.build()` / `buildHost` — creating the EVG tree |
| `layout` | stylesheet + flex layout |
| `dlist` | walk the tree into draw commands |
| `json` / `parse` | `toJson` + `JSON.parse` — the showcase page pays this every frame; a native host does not |
| `webgl` | `renderDisplayList` |
| `engine` | build + layout + display list, no serialise |
| `showcase` / `evg-all` | the lot, including WebGL |
| `upd-e` / `upd-d` | one interaction (sort a column, open an accordion, toggle a checkbox) then a full paint |

DOM `commit` is `flushSync(render)` — React 18 has written the tree, no
frame wait. `mount` adds one animation frame so the browser has painted.
The first version of this bench waited two frames and every DOM number
came back as 33 ms, which was the scheduler, not React.

Medians, after one warmup. Headless SwiftShader is slower than a laptop
GPU: read the **ratios** and the way cost grows with `n`, not the
milliseconds as a promise about a user's machine.

`dom÷evg` is `mount / evg-all`. Greater than one means the DOM mount
(commit + one frame) was slower than EVG's full paint of the same fixture.

## Reading a result

A canvas UI wins when the tree stays small. `TableCtl` only *builds* the
current page, so a 5 000-row model with `pageSize=20` should paint like a
20-row table on both sides — the extra cost is sorting the records, not
drawing them. An unpaged 200-row table is the honest "how much can you
show" question: EVG still emits one display-list command per box and
glyph; the DOM still has one node per cell.

JSON is a real tax on the showcase path, but on these scenes it is small
next to build and layout. A host that already has the `EVGDisplayList`
(SDL, the C++ painter) skips `json` + `parse` entirely.

## What a run said

Headless Chromium, SwiftShader, this environment. Medians. `dom` still
contains one animation frame (~16 ms at 60 Hz), so for anything that
finishes inside a frame **read `commit`**, not `mount`.

**The six showcase demos** are small. Closed dropdown is 6 commands /
0.3 ms; the motion page is the heaviest at 115 commands / 3.6 ms. WebGL
itself is 0.1–0.4 ms. The page is not a stress test.

**Same fixture, both sides** (the `kit-*` series):

| scene | EVG all | DOM commit | EVG cmds | DOM nodes |
| --- | ---: | ---: | ---: | ---: |
| table, 20 rows on screen | 5.9 | 1.2 | 177 | 175 |
| table, 100 rows on screen | 16.9 | 2.6 | 817 | 815 |
| table, 200 rows on screen | 33.2 | 4.3 | 1617 | 1615 |
| table, 5 000 records / page of 20 | 4.9 | 26.1 | 177 | 175 |
| sortable, 100 items | 5.2 | 1.8 | 301 | 104 |
| accordion, 100 sections | 8.4 | 6.3 | 304 | 402 |
| 500 checkboxes | 30.6 | 25.6 | 1501 | 501 |

Three things that are actually true, as opposed to "canvas is faster":

1. **The GPU is not the story.** At 1 617 commands a 200-row table spends
   0.9 ms in WebGL and 1.3 ms on JSON. Build (17.6) and layout (13.1)
   are the rest. React's commit of the same table is 4.3 ms.
2. **How much you *show* matters; how much you *hold* does not, until
   you sort.** 5 000 records with a 20-row page paint like 20 rows
   (4.9 ms, 177 commands). Sorting those 5 000 in `TableCtl` then
   rebuilding the page is 197 ms. TanStack's sort of the same data
   stays inside a frame.
3. **Command count tracks DOM nodes** on the table (~8 per row on both
   sides). A canvas does not magically show more *visible* cells; it
   just does not put them in the document. Paging — which both sides
   already do — is what lets the model grow.

So: the showcase is cheap; an unvirtualised 200-row table is past 16 ms
on EVG and still comfortable as a React commit; a paged table can hold
thousands of records on either side; EVG's next win is a cheaper
`build()` / layout, not a faster painter.

## Stress — how far Ranger render goes

The comparison above stops at 200 rows. That never asked the painter
how many commands it can draw, because build and layout answered first.

```bash
npm run ui:bench:stress
```

Ranger only. Three paths, N rising until a sample is past 800 ms:

| path | what is timed |
| --- | --- |
| `paint` | list already in memory; `renderDisplayList` + `gl.finish` |
| `retained` | kept tree; layout + display list + paint (a hover frame) |
| `rebuild` | `buildHost` + the lot (a sort, a tree literal starting over) |

Synthetic rect and text lists sit beside real `TableCtl` / checkbox
trees so the painter can be asked about command count without the
controller sitting on the answer. The scorecard marks `60` / `30` /
`·` against 16.7 ms and 33.3 ms, and prints the largest N that still
held each budget.
