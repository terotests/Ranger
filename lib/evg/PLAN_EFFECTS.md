# Surface effects: declared on an element, drawn by a plugin

`evg-surface-effect: ripple` shipped as one effect, over one surface, driven by
hand. This is what it became, why, and what is still missing.

## What it was

```
EVGElement            surfaceEffect + fourteen evg-ripple-* fields + three drop arrays
EVGDisplayList        readEffect: the FIRST element that names one wins, whole page
evg-webgl.js          one hard-wired program, one fullscreen post-pass
the application       pushes drops, ages them, retires them, stamps them on the root
```

Three things follow from that shape, and all three were the reason to change it:

* **Which element has it is not a question the document can answer.** The
  property is read off the first element that carries it and applied to the
  whole surface. A card cannot ripple; a page can.
* **What starts it is in the app's code.** `gallery/ui/demo/main.js` calls
  `dashboard.ripple(ev.offsetX, ev.offsetY)` on every `pointerdown`, anywhere on
  the canvas, and `DashboardDemo.rgr` keeps three arrays and four methods to
  hold the result. None of that is about a dashboard.
* **A second effect cannot exist.** Its parameters would have to be fields on
  `EVGElement` — every element in every document carrying a starfield's density
  — and its shader would have to be another branch in the painter.

## What it is now

Three properties, and a box the layout already knew:

```css
.hero-sky {
  evg-surface-effect: starfield;   /* WHAT runs — a name, nothing more */
  evg-effect-on: always;           /* WHAT starts it: press drag hover always */
  evg-fx-density: 1.6;             /* PARAMETERS the engine never reads */
  evg-fx-hue: 228;
}

.pool {
  evg-surface-effect: ripple;
  evg-effect-on: press drag;       /* and nothing else on the page reacts */
  evg-ripple-speed: 240;           /* the ripple's own properties still work */
}
```

WHERE is the element's own border box. That is the whole of the idea: the
layout has already worked out where every box is, so an effect that names an
element needs no geometry of its own, and it moves, wraps and reflows with the
element for free.

### The path

```
EVGElement        surfaceEffect, effectTrigger, fxNames/fxValues   (CSS)
EVGLayout         paintHasEffect — does this subtree carry one at all
EVGDisplayList    collectEffects → one instance per element:
                    id, kind, trigger, box, radius, parameters
                  and `efx` on the rectangle where the element paints
JSON / evg-list   "effects": [...] on the envelope, "efx" on the command
evg-fx.js         the driver: pointer → events, per instance, aged per frame
evg-webgl.js      the registry: name → { layer, params, GLSL }, and two passes
```

Nothing between the stylesheet and the painter knows what an effect *is*.
`starfield` is a string, `density` is a number under a name, and the first
thing that attaches meaning to either is the plugin.

### Sources and filters

A plugin declares which it is, and the difference decides when it is drawn:

| | drawn | reads | example |
| --- | --- | --- | --- |
| `source` | in paint order, at the element's own background | nothing | `starfield` |
| `filter` | after the frame, over the box's region | the finished surface | `ripple` |

A source is under the element's content, which is what makes a starfield a
background rather than a sticker over the text. A filter runs when there are
pixels to bend, which is why it can distort text, charts and images it knows
nothing about.

Both get the same things without asking: `uBox`, `uRadius`, `uRes`, `uTime`,
and `uEvents[]` with `uEventCount`. Both write one function:

```glsl
vec4 fxColor(vec2 p, vec2 local)   // p in page pixels, y down
```

The box mask — rounded corners included — is applied in the shared `main`, so
a plugin **cannot** paint outside the element that declared it. That is checked
against pixels, not asserted: `lib/evg/gl/fx-check.mjs`.

### Registering one

```js
import { registerSurfaceEffect } from "./evg-webgl.js";

registerSurfaceEffect({
  name: "scanlines",
  layer: "filter",
  params: { period: 4, depth: 0.15 },
  frag: `vec4 fxColor(vec2 p, vec2 local) {
    float k = 1.0 - p_depth * step(0.5, fract(p.y / p_period));
    return vec4(texture(uSrc, vUV).rgb * k, 1.0);
  }`,
});
```

and then `evg-surface-effect: scanlines; evg-fx-period: 3` in any stylesheet.
No engine change, no display list change, no painter change.

### The driver

`lib/evg/gl/evg-fx.js` is the part that turns a pointer into events:

```js
const fx = createEffectDriver();
attachEffectPointer(canvas, fx, schedule);
// per frame:
fx.tick(dtMs, doc.list);     // ages events, stamps the clock on each instance
frame.draw();
```

It hit-tests the boxes the display list carries, topmost first, and gives the
event to the instance whose trigger list mentions what happened. An element
with no `evg-effect-on` is not adopted: that is an effect the application
drives, which is exactly the old behaviour and still works.

`fx.busy()` is false when nothing is in flight and no effect says `always`, so
a page stops drawing when the water stills.

## What this deliberately did not touch

* **`list.effect`, the whole-surface effect, is untouched** — its own field on
  the list, its own program in the painter, its own drops from the application.
  `landing/`, `gallery/ui/demo` and their gates draw exactly what they drew
  before. The two coexist: the whole-surface pass runs first, then the
  element-scoped filters.
* The ripple's math is **not** duplicated. `RIPPLE_CORE` is one string; the
  whole-surface program and the plugin are two entry points into it.

## What is still missing

* **The binary list** (`toBinary` / `evg-binary.js`) does not carry effects, so
  an app served through `evg-engine.js` in a Worker loses them. The JSON and the
  in-process object path (`evg-list.js`) both carry them. Adding it means a
  field in the command record and the instances in the envelope.
* **Scroll.** An effect's box is recorded pre-shift. Inside a scrolling layer
  the painter is handed the layer's shift and applies it, but the driver
  hit-tests the unshifted box — so an effect on a scrolled element takes its
  press in the wrong place. The fix is for the driver to be told the shifts,
  which is the same list the painter already gets.
* **Id selectors.** `EVGStyleSheet` matches classes, not `#id`, so an effect is
  styled by class and named by id. That is a stylesheet limitation rather than
  an effect one.
* **A page that declares an element-scoped effect still emits the legacy
  `effect` block** as well, with no drops in it, because `readEffect` predates
  all of this and nothing should change under the pages that rely on it. It is
  inert: the painter skips a whole-surface pass with no drops.
* **Other painters.** SoftCanvas, PDF and SVG draw the page and drop the
  effect, which is the right failure — `evg-html.js` now reports which kinds it
  dropped. A Skia/AGSL host could implement the same plugin ABI; see
  `PLAN_NATIVE_HOSTS.md`.
* **WebGPU.** The plugin declaration is a name, a parameter list and a shader
  string. Nothing in the display list or in a stylesheet says GLSL, so the same
  registry with WGSL bodies would need no change above the painter.

## Running it

```
npm run evg:fx:test      the document side: CSS → instances, without a GPU
npm run evg:fx:check     the pixels: scoped, layered, moving, and not leaking
npm run evg:fx:doc       rebuild the demo document from lib/evg/FxDemoDoc.rgr
npm run evg:fx:demo      serve it — http://localhost:8099/fx-demo.html
```
