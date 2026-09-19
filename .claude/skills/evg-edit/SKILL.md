---
name: evg-edit
description: Read, change and check an EVG document — a `.evg.json` file, or a `.tsx` page under lib/evg/showcase — without guessing. Use when asked to change what a page, card, chart, diagram or PDF looks like; to move, restyle, retitle or add an element; to find out why a layout is wrong; or to check whether text overflows, boxes overlap or something is off the page. Also use before editing a `.tsx` showcase page by hand, because converting it first gives addresses and a verifier.
---

# Editing an EVG document

Do not edit an EVG document by rewriting its source and re-rendering to see what
happened. There is a tool surface that gives you addresses, validated edits,
an undo, and a numeric verdict on the result. Full reference:
`lib/evg/agent/README.md`.

## The loop

```bash
npm run agent -- outline <doc.evg.json>          # 1. addresses
npm run agent -- patch   <doc.evg.json> ops.json # 2. change it
npm run agent -- measure <doc.evg.json>          # 3. is it wrong?
```

Then look at it only if the question is about taste:

```bash
node gallery/pdf_writer/bin/evg_png_tool.js <doc.evg.json> out.png
```

## 1. Addresses, not guesses

`outline` prints one line per node: its path, its tag, its class, its text, and
only the properties it actually sets.

```
0/0                     div .card  width=320px  background-color=rgb(255,255,255)
0/0/k:title               span "Orders"  font-size=20px
```

Paths are `EVGInspect` paths — `0` the root, `0/3` its fourth child,
`0/3/k:share` a child with a `key`. **Unkeyed paths shift when a sibling is
inserted above them**, so re-run `outline` after any structural op rather than
reusing an address across edits.

`--depth=N` and `--at=PATH` narrow it. A truncated outline says so; never
describe a document from a truncated one.

Finding something: `npm run agent -- query <doc> .card` (also `#id`, a bare
tag, or a path).

## 2. Ops are the only way to change it

```json
{"ops":[
  {"op":"set-text","at":"0/0/k:title","value":"Invoices"},
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,251,235)"},
  {"op":"insert","at":"0/0","index":2,"tag":"span"},
  {"op":"remove","at":"0/1"},
  {"op":"move","at":"0/0/k:sub","to":"0/1","index":0}
]}
```

Four things to know, because they change how you write ops:

- **A rejected op fails the whole batch and changes nothing.** So a batch is
  safe to attempt — you never have to work out what half-applied.
- **An applied op can leave no trace in the file.** A document carries only what
  differs from a fresh element of that tag, and EVG's defaults are not CSS's —
  a div is `flex-direction: column`, `display: block`. Setting a property to its
  default removes the line instead of adding one, and `outline` stops showing
  it, while the node really did change. `patch` lists those ops under
  `atDefault`. A property you set and then cannot find is that, not a lost
  edit — do not route around it with different markup.
- **Only properties the engine implements are accepted.** `aspect-ratio` and
  friends are rejected with a reason. Do not work around a rejection by writing
  the value somewhere else; report it.
- **`patch` prints the inverse as a runnable ops file.** Save it. To undo, run
  those ops *in reverse order*.

Colours read back as `rgb(r,g,b)`; that is the canonical form, `#rrggbb` is
accepted on the way in. A ramp is `background-gradient`:
`linear-gradient(180deg, rgb(52,120,90), rgb(30,72,55))` — `rgb()`, `rgba()`
and `#hex` stops all work, and `to bottom` / `to right` stand in for the
angle. `background-image` and plain `background` are not patchable names, so a
batch using them is rejected whole.

**Lay out, do not place.** It is a CSS engine: a column of cards is
`display: flex` with a `gap`, not children with computed `top`s, and a grid is
`display: grid` with `grid-template-columns`. Hand-computed positions are
where a screen that does not line up comes from, and `measure` reports it
under `align`. Keep `position: absolute` for what floats over the flow.

## 3. Check with numbers before you look at a picture

```bash
npm run agent -- measure <doc.evg.json> --width=600 --height=400
{"width":600,"height":400,"nodes":12,
 "findings":["0/0 and 0/1 overlap by 100×40",
             "0/0/0 overflows its parent to the right by 200"],
 "count":2,"bottomFree":124,"tight":["0/2 → 0/3: 2 apart"]}
```

It lays the document out and reports text past its box, siblings on top of each
other (with the overlap in px), and nodes off the page. **Use this instead of
rendering a PNG to check correctness** — it is exact and costs a fraction of
the tokens. Render only to judge how something looks.

`bottomFree` is the room left under the content and `tight` is neighbours under
4px apart — neither is a defect, both are what the screen actually is. `patch`
prints the same summary under `layout` without being asked, so an edit answers
with what it did to the layout.

`align` is the one to read twice. A stack whose children share a left edge is
aligned, one whose centres agree is centred, one that agrees on neither was
aligned to nothing — and that defect passes every other check, because nothing
overlaps and nothing leaves the page. An absolute child is the usual offender:
its `left` is resolved from inside the parent's padding, so `padding: 16px`
plus `left: 16px` puts it at 32 while the flow starts at 16.

```json
"align":["0/9 starts at 32, the flow at 16 — that is one padding: an absolute
          left/right is measured from inside the parent's padding, so asking
          for it again adds it twice"]
```

When spacing is the question, ask for the boxes:

```bash
npm run agent -- measure <doc.evg.json> --boxes --at=0/2
{…,"boxes":[{"at":"0/2","x":16,"y":113,"w":358,"h":64,"gapNext":8}]}
```

`gapNext` is the distance the layout produced, not the one the markup asked
for — the number to read before changing a `gap` or a margin.

One exception, and it matters because it is the case you will hit with charts:
on a **diagram** — anything exported from RangerFlow — every node is absolutely
positioned and every shape is a path with no box, so overlap and overflow have
nothing to compare. Off-page is still caught. A label that outgrew the shape
behind it is not. On a diagram, `"count":0` means "nothing left the page", not
"this looks right" — render it and look.

## Getting a real document in

A `.tsx` page is not directly editable this way. Convert it first, resolving its
stylesheet in:

```bash
node gallery/pdf_writer/bin/evg_json_tool.js lib/evg/showcase/pages/cards.tsx \
  lib/evg/showcase/pages/cards.evg.json \
  -css lib/evg/showcase/themes/showcase.css -theme editorial
```

The converter checks itself — it lays out both trees and compares their boxes
and their draw commands — and names anything it had to drop. **Read that
report.** `-strict` makes a lossy conversion a failure.

Two consequences worth knowing: theming is baked in (re-theming means
converting again from the `.tsx`), and the converted file is a *new* document —
editing it does not change the `.tsx` it came from. If the `.tsx` is the file
that must change, use the conversion to find out *what* to change, then make
that edit in the `.tsx` by hand.

## Before you claim it works

```bash
npm run evg:patch:test    # the op language and the format
npm run agent:smoke       # the four verbs
npm run agent:roundtrip   # every showcase page, converted and re-rendered
```

`agent:roundtrip` is the one that catches a property the format cannot carry:
it requires the PNG rendered from a conversion to be byte-identical to the PNG
rendered from the original. If you add a property to `EVGPatch.patchableNames()`,
run it.
