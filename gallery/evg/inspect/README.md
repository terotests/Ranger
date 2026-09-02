# The EVG inspector

Dev tools for a picture a browser cannot read.

```bash
npm run evg:inspect:demo     # the dashboard, WebGL, with the panel
npm run pptx:html:serve      # the slide editor, SVG — add ?inspect=1
npm run evg:inspect:test     # the gates, no browser
npm run evg:inspect:web      # the panel, in a real browser
npm run evg:inspect:shots    # remake the two pictures below
```

An EVG app in a browser is one `<canvas>`. Open the browser's dev tools on it
and you get exactly that: one element, no children, no styles, no box model.
The DOM painter is not much better — a flat pile of `<rect>` and `<path>` in
paint order, with no names and no nesting. You can see the picture. You cannot
ask it anything.

This is the panel that answers. Add `?inspect=1` to a host that has been wired
to it and you get the element hierarchy, the box model drawn over the real
pixels, the computed style, and the draw commands each element emitted.

![the dashboard, inspected](shots/dashboard.png)

## The fourth channel

Three descriptions already come out of an EVG app, and `gallery/ui/demo/main.js`
names them in its own header:

```
  displayListJson()   what to draw
  hitId(x, y)         what is under the pointer
  a11yJson()          what it MEANS
```

They share the property this design is built on: **each is derived from the
same laid-out tree, on the same pass.** `EVGA11yFromTree` says why in its
header — an app that describes its tree a second time has two descriptions to
keep in step, and the one nobody can see is the one that rots.

`EVGInspect` is the fourth — **what it IS** — and obeys the same rule. Every
rectangle it reports is the one `EVGLayout` computed and `EVGDisplayList` drew,
read off `calculatedX` and its neighbours. Nothing here has a second opinion
about geometry, so the panel cannot disagree with the picture.

```
                    EVGElement tree (laid out)
                             │
        ┌────────────┬───────┴───────┬──────────────┐
        ▼            ▼               ▼              ▼
  EVGDisplayList  EVGHitTest   EVGA11yFromTree   EVGInspect
   what to draw   what is      what it means     WHAT IT IS
                  under here
```

That is also why it works on both painters and off the browser entirely: it is
attached to the tree, not to a canvas. The WebGL page and the SVG page are the
same panel with the same code, and the module compiles to every target
`EVGDisplayList` does.

## Wiring a host to it

The panel knows nothing about any app. It is handed an adapter of small
functions, and everything past `tree` degrades rather than fails — which is
what lets one panel serve a slide editor and a dashboard without either
knowing about the other.

```js
import { attach } from "…/gallery/evg/inspect/evg-inspect.js";

attach({
  surface,                    // the <canvas> or <svg> the app paints into
  app: {
    tree:  () => app.inspectJson(gen),        // REQUIRED
    node:  (path) => app.inspectNodeJson(path),
    hit:   (x, y) => app.inspectHitPath(x, y),
    frame: () => app.inspectFrameJson(),
    transform: () => app.inspectTransform(),  // {x, y, k}, when the tree is
    viewport: () => [w, h],                   // drawn inside a larger surface
  },
});
```

On the Ranger side that is four one-liners, because `EVGInspect` carries the
statics:

```ranger
fn inspectJson:string (gen:int) {
    this.displayListJson()
    def r:EVGElement (unwrap root)
    def w:double (this.widthPx())
    def h:double (this.heightPx())
    return (EVGInspect.treeOf(r "Dashboard demo" gen w h))
}
fn inspectNodeJson:string (path:string) { … EVGInspect.nodeOf(r path) }
fn inspectHitPath:string (px:double py:double) { … EVGInspect.hitOf(r px py) }
fn inspectFrameJson:string () { … EVGInspect.frameOf(r) }
```

`hitOf` and `nodeOf` should be given the layout that is already there
(`laidOut()`), not a fresh render. On the dashboard `hitId` costs 11 ms and
`hitIdCached` costs 0.007 ms, and the whole difference is a page rebuilt to
answer a question about geometry that had not moved.

## Identity is a path

`EVGElement.id` is not an identity: it is optional, it is the app's own test
id, and most elements have none. So a node is named by where it sits:

```
  "0"            the root
  "0/3"          its fourth child
  "0/3/k:share"  a child with `key` set uses the key instead of the index
```

The same trick `EVGComponentHost` plays with `enter`/`leave`: a name unique
among siblings composes into a name unique in the tree, with no registry.

It is **structural**, and the cost is honest — insert an unkeyed row above the
selected one and the path names a different element. Keyed children are immune,
which is the set a list rebuild actually reorders. When a path stops resolving
the panel drops the selection and says so in its footer; re-pointing it at
whatever is now at that index would be a lie.

## Which commands did this element draw

![a slide, inspected](shots/pptx-slide.png)

`EVGDrawCmd` carries the element that emitted it, as an index into the inspect
walk, and writes it into the JSON as `"n"` — **only while attribution is on**.
Off, the list is byte-identical to the one built before the field existed, and
that is a gate rather than a hope (`inspect-check.mjs`, gate 5).

It is stamped in one place. `EVGDisplayList.walk` sets `curNode` for the
element it is walking and puts back what was there on the way out; `addCmd` is
the only thing that reads it, and every one of the twenty append sites in that
file goes through `addCmd`. A child cannot leave its slot behind for the
commands its parent emits afterwards.

This is worth more than the highlight it was added for. "Which element drew
these three commands" is the question behind the class of bug
[`gl/README.md`](../gl/README.md) describes: five painters each deciding again
what a box means, and border-radius working in PDF and silently not in PNG
because one painter read `box.borderRadius` and another a stale
`el.borderRadius`. With attribution the command that is wrong names the element
that is wrong.

In the picture above, the ellipse on slide 4 is selected and the commands pane
says it became a `RECT` and a `BORDER` at 456,288, 288×192, radius 96 — which
is how a preset ellipse is drawn.

## A tree drawn inside a larger surface

The dashboard's tree *is* the page: the boxes are in the surface's own
coordinates and the transform is the identity. A slide is not — the editor
draws it fitted and centred inside a window with a toolbar, a thumbnail strip
and a properties panel around it.

So the adapter can hand the panel a `transform` (`{x, y, k}`, where the tree's
coordinates land on the surface and how big they are drawn) and a `viewport`
(how big the surface is in its own units). The panel applies both to the
overlay and inverts both for the picker, so an adapter never has to know where
on the page its picture ended up. `PptxWeb.inspectTransform` derives `k` from
the two widths rather than assembling it from `ptScale` and the converter's
scale factor: one number instead of two that have to agree.

## The overlay is DOM, not draw commands

The four rings are absolutely positioned `<div>`s over the surface, in the four
colours a browser uses. They are **not** pushed into the display list, and that
is deliberate twice over: a screenshot taken while the panel is open is still a
screenshot of the app, and one implementation then serves both painters,
because the WebGL canvas and the SVG one are the same rectangle on the page.

## What is gated

`npm run evg:inspect:test` runs five differences against a real app in Node —
a second description of something is only worth having if it is differenced
against the first, which is the habit the painters already keep:

| | |
| --- | --- |
| the tree is a tree | one root, every parent present, no path twice |
| the box model closes | content + padding + borders is the border box, on all 470 nodes |
| attribution lands inside | a command is inside the box of the element that emitted it — with two exceptions that are real and asserted as such: a text run may overhang by the font's side bearings, a shadow by its blur |
| the hit test agrees | when it answers, the answer contains the point |
| off costs nothing | a list built without attribution carries none |

The hit-test gate is deliberately one-sided, and the first version of it was
wrong in a way worth recording: it expected every node to be reachable. The
dashboard's table is 552px tall inside a 414px scroll box, so half its rows sit
at coordinates the page does not show, and `EVGHitTest` drops a clipping box's
whole subtree when the point is outside it — its header says why, and it is
right: a row scrolled out of view that is still clickable is the worst of both.
"Nothing is there" is the correct answer, so the gate asserts the other half —
nothing may be named under a pointer that is not over it — plus that most of
the page does answer, so it cannot pass by never being asked.

`npm run evg:inspect:web` gates the part that only exists in a page: that
`?inspect=1` attaches, that the tree it read has rows, and that the panes
filled. It runs against the SVG editor because that needs no GPU.

## What is not built yet

[`../PLAN_INSPECTOR.md`](../PLAN_INSPECTOR.md) is the whole design; this is
phases 1 and 3 of it. Not here yet, in the order they are worth doing:

* **the cascade** — which rule set each value, and which rules lost. The panel
  shows the computed style and marks what the authoring layer set inline
  (`EVGElement.inlineProps`, the cascade's own record), but not the provenance.
  That needs `planRules` in `EVGStyleSheet`, recorded in `buildPlan` where the
  rule is still in hand — per plan, not per element.
* **editing** — overrides keyed on the path, so a value survives the rebuild
  that a tree-literal app does on every keystroke.
* **component debug notes** — a component saying *why*, which no channel
  carries today.
* **the offline bundle** — one frame in a file, openable with no app running,
  and attachable to a failing CI gate.
