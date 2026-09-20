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
evg-webgl.js      the registry: name → { layer, params, GLSL }, and the passes
```

Nothing between the stylesheet and the painter knows what an effect *is*.
`starfield` is a string, `density` is a number under a name, and the first
thing that attaches meaning to either is the plugin.

### Sources, backdrops and filters

A plugin declares which it is, and the difference decides when it is drawn:

| | drawn | reads | example |
| --- | --- | --- | --- |
| `source` | in paint order, at the element's own background | nothing | `starfield`, `plasma-wave`, `ambient-light`, `smoke` |
| `backdrop` | in paint order, at the same point | the surface so far | `liquid-glass`, `raindrop` |
| `filter` | after the frame, over the box's region | the finished surface | `ripple` |

A source is under the element's content, which is what makes a starfield a
background rather than a sticker over the text. A filter runs when there are
pixels to bend, which is why it can distort text, charts and images it knows
nothing about. A backdrop is the third case and the one `backdrop-filter:
blur()` has always been: it reads what is *behind* the element and nothing in
front of it, so a pane of glass refracts the page and leaves its own label
sharp. It costs one copy of the canvas and one full-screen pass per instance
per frame — the copy is `copyTexSubImage2D` into a kept texture, and the pass
writes back what is outside the box unchanged.

All three get the same things without asking: `uBox`, `uRadius`, `uRes`,
`uTime`, and `uEvents[]` with `uEventCount`, plus `fxBoxDistance(p)` — the
element's rounded box as a signed distance, which is what lets a plugin shape
itself to a box it has never been told the size of. All three write one
function:

```glsl
vec4 fxColor(vec2 p, vec2 local)   // p in page pixels, y down
```

The box mask — rounded corners included — is applied in the shared `main`, so
a plugin **cannot** paint outside the element that declared it. That is checked
against pixels, not asserted: `lib/evg/gl/fx-check.mjs`.

### Liquid glass, as an example of what the layer buys

Frosted glass has been one declaration for years and reads as a fogged sheet
rather than an object. What is missing from it is refraction: a real pane is
thicker in the middle than at its edge, so the edge is a curved surface, and
light through a curve bends. `liquid-glass` is that band — the page behind
dragged toward the rim, compressed, split slightly into colour, with a
specular arc inset from the very edge so it reads as a bevel rather than as a
border somebody drew.

It needs nothing of its own to know the shape: the bend follows
`fxBoxDistance`, the rounded-box signed distance the preamble hands every
plugin, and its gradient is the surface normal. So the pane is a lens at
whatever size the flex row gave it and whatever `border-radius` the sheet
asked for, and `thickness`, `strength`, `power`, `disperse`, `shine`, `angle`
and `tint` are the seven numbers that shape it — every parameter of every
effect is listed below.

**The sweep** is the second half of it: a bar of light crossing the pane,
`evg-fx-sweep` and its five siblings. Two of those decide whether it reads as
a shine or as a line somebody drew:

* `sweep-rim` weights the bar toward the bevel. Real glass catches a moving
  light at its EDGES, where the surface is turned; the flat middle only
  flashes as the light goes by. At 1 the middle is left exactly as it was.
* `sweep-duty` is the fraction of each cycle the pass takes. The rest of the
  cycle the bar is parked off the pane, so the pane is clean glass most of the
  time and the glint is an event.

Both are checked against pixels: a rim-weighted bar leaves the flat middle
byte-for-byte unchanged, and between passes nothing on the pane is brighter
than the pane without a sweep at all.

### The quieter four

A starfield and a pane of glass are both loud: they are the effect, and the
page is arranged around them. Four more are the other kind — a background you
can put text on and still read it.

* **`plasma-wave`** (source). Ribbons of light drifting across the box: a few
  sine paths through a value-noise field, each one drawn as a thin core with a
  wide glow, plus a `sheet` of colour behind them and sub-cell `grain` motes in
  it.
* **`raindrop`** (backdrop). One drop per cell of a hash grid, mostly small and
  a few large, each a sphere's lens over what is behind: strongest bend at the
  rim and none in the middle, so the page stays legible through the centre and
  smears at the edge, with a transmitted crescent, a small specular dot and a
  darkened rim. It is the ripple's opposite number: a ripple is a lens that travels and dies,
  a drop is a lens that stays.
* **`ambient-light`** (source). A slow wash — two-tone fbm, desaturated by
  `sat` — with a handful of bokeh discs floating through it. Nothing in it is
  sharp, which is the point: it is the background under a dashboard, not the
  subject.

* **`smoke`** (source). A bank of smoke rising through the box: fbm evaluated
  at a point two other fbms have already moved — a DOMAIN WARP, which is the
  cheapest way to get a turbulent flow out of a function that has none. One
  warp gives the billows, the second gives the tendrils that come off their
  edges. What it has to clear rises with height, so the floor is full and the
  top is single wisps in the black; `height` is how far up that goes, and at 3
  or more it is a cloud filling the box instead. The light is the field
  compared with itself one step toward `angle`: where the smoke is thinning
  that way the step is lower and the pixel is a lit face, where it is
  thickening the pixel is in shadow — a gradient, which is what gives a cloud
  its volume.

They take their box from the layout like the others, and each is in
`effect-presets.css` two or three times, with different numbers.

### Every parameter

`evg-fx-<name>: <number>` — and nothing else takes one. A name left out takes
the default below; a name the plugin does not know reaches the shader and is
ignored. This list IS the registry in `evg-webgl.js` — `surfaceEffect(name).params`
is the same object, and `fx-check` holds this table to it: a parameter added to
a plugin and not written down here fails a check, and so does a default changed
in one place and not the other.

Values are clamped where a shader needs them to be, so one outside the range is
not an error, it just stops changing anything: `sweep-duty` is held to 0.02…1
and `sweep-rim` to 0…1, which is why `sweep-duty: 1.1` behaves as 1 (the bar
never leaves the pane) and `sweep-rim: 0.004` as 0 (the bar is as bright across
the flat middle as it is at the bevel).

**`ripple`** (filter) — rings from a press or a drag.

| | default | |
| --- | --- | --- |
| `speed` | 220 | how fast a ring travels, px/s |
| `width` | 28 | the ring's thickness, px |
| `strength` | 7 | how far the surface is displaced |
| `decay` | 1.8 | how quickly a drop dies |
| `highlight` | 0.08 | brightening along the crest |
| `rings` | 3 | rings per drop |
| `stagger` | 0.09 | the delay between them |
| `falloff` | 0.62 | how much dimmer each following ring is |
| `shine` / `gloss` / `bump` | 0.45 / 120 / 70 | the specular lift on the wave |
| `lightX` / `lightY` / `lightZ` | -0.45 / -0.65 / 0.62 | where that light is |

**`starfield`** (source) — stars and dust.

| | default | |
| --- | --- | --- |
| `density` | 1 | stars per cell; the grid follows it |
| `speed` | 6 | drift, px/s |
| `angle` | 200 | the direction of that drift, degrees |
| `twinkle` | 1 | how much a star's brightness wanders |
| `glow` | 1 | the halo around one |
| `nebula` | 0.6 | how much dust there is |
| `hue` / `hue2` | 225 / 300 | the two ends of the cloud's colour |
| `seed` | 1 | a different sky at the same settings |

**`liquid-glass`** (backdrop) — refraction at the rim, and a light crossing it.

| | default | |
| --- | --- | --- |
| `thickness` | 24 | how far in from the edge the pane is curved, px |
| `strength` | 32 | how far the bend drags what is behind it |
| `power` | 2.2 | how sharply that falls off toward the middle |
| `disperse` | 0.07 | how far the colour channels are split |
| `shine` | 0.6 | the specular arc inset from the edge |
| `angle` | -60 | where its light comes from, degrees |
| `tint` | 0.05 | a flat lift over the pane |
| `sweep` | 0 | the bar's brightness — 0 is no sweep at all |
| `sweep-angle` | -62 | the direction it crosses in, degrees |
| `sweep-width` | 0.06 | the bar's width, as a fraction of the pane |
| `sweep-speed` | 0 | passes per second; 0 parks it at `sweep-at` |
| `sweep-at` | 0.5 | where it is parked, 0…1 across the pane |
| `sweep-edge` | 2.2 | extra brightness where it meets the bevel |
| `sweep-rim` | 0.55 | how much it keeps to the bevel; 1 leaves the flat middle alone |
| `sweep-duty` | 0.35 | the fraction of each cycle the pass takes; the rest of it the bar is off the pane |

**`plasma-wave`** (source) — ribbons of light.

| | default | |
| --- | --- | --- |
| `ribbons` | 5 | how many, 1…8 |
| `speed` | 0.35 | how fast they travel |
| `amp` | 0.22 | how far they swing, as a fraction of the height |
| `freq` | 1.7 | how many waves across the box |
| `width` | 2.2 | the bright core's thickness, px |
| `glow` | 26 | the halo around a ribbon, px |
| `sheet` | 0.16 | the wide colour behind them; 0 is ribbons on black |
| `hue` / `hue2` | 225 / 285 | the two ends of their colour |
| `grain` | 0.35 | the motes in the sheet |
| `seed` | 1 | a different set of paths |

**`raindrop`** (backdrop) — drops on the pane.

| | default | |
| --- | --- | --- |
| `density` | 1 | how close the drops are; cells are `46 / density` px apart |
| `size` | 0.5 | how big a drop is within its cell |
| `refract` | 14 | how far it bends what is behind it, px |
| `shine` | 0.85 | the transmitted crescent and the specular dot |
| `angle` | -55 | where the light is, degrees |
| `rim` | 0.55 | how dark the drop's edge is |
| `speed` | 0 | how fast the field drifts down; 0 is still |
| `seed` | 1 | a different scatter |

**`smoke`** (source) — a bank of it rising through the box.

| | default | |
| --- | --- | --- |
| `density` | 1.2 | how much of the field shows as smoke |
| `rise` | 0.05 | how fast it climbs |
| `wind` | 0 | sideways drift |
| `swirl` | 2.6 | how hard the warp curls it; 0 is clouds of plain noise |
| `scale` | 190 | the size of a billow, px |
| `detail` | 5 | octaves, 1…6 — the last two are the tendrils and most of the cost |
| `height` | 0.9 | how far up the box it reaches; 3 or more fills it |
| `softness` | 0.55 | how gradually an edge gives out |
| `shade` | 0.6 | how much the light sculpts it; 0 is flat grey |
| `angle` | -60 | where that light is, degrees |
| `hue` | 205 | the colour it is lit by |
| `tint` | 0.1 | how much of that colour it takes |
| `seed` | 1 | a different roll of it |

**`ambient-light`** (source) — a slow wash.

| | default | |
| --- | --- | --- |
| `hue` / `hue2` | 190 / 268 | the two ends of the wash |
| `sat` | 0.5 | how far from grey those are |
| `tilt` | 25 | the direction the wash runs, degrees |
| `depth` | 0.5 | how bright it is overall |
| `orbs` | 7 | the bokeh discs in it, 0…10 |
| `size` | 0.55 | how big one is, against the shorter side |
| `softness` | 1.6 | how far its edge is blurred |
| `speed` | 0.06 | how fast they drift |
| `glow` | 0.45 | how bright they are |
| `seed` | 1 | a different arrangement |

### Presets

`lib/evg/gl/effect-presets.css` is fourteen blocks of ordinary CSS, one
element's worth each: five skies, two plasma fields, two rains, two washes and
three of smoke. They exist to
be pasted — into the live editor under the gallery's effects demo, or into a
stylesheet — and nothing but numbers comes with them.

```
npm run evg:fx:shots                       every preset, one picture
npm run evg:fx:shots -- out.png --only raindrop --tile 520x300
```

The gallery's effects demo has them in its rail: picking one types the block
into the live stylesheet under the canvas, and which element it lands on is the
plugin's layer — a source effect is the sky, a backdrop effect is the pane over
it, because a backdrop draws what is behind an element and an opaque sky would
paint over it.

The file is read twice and written once: `effect-shots.mjs` paints it, and
`fx-check.mjs` parses it with the ENGINE's own `EVGStyleSheet` and compares
every declaration against what the picture used — so a preset the cascade
refuses fails a check instead of quietly drawing the plugin's defaults. The
pixel half then renders all eleven on a page of their own size and holds each
to changing its tile against the same tile with the effect off. The tiles under
a backdrop preset carry a mock page — a headline bar and three lines — because
a lens over a flat colour is invisible by construction.

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

### Switching one off

`inst.off = true` on an instance, and the painter skips the run, the filter is
not live, nothing is compiled or copied, and the driver stops giving it events
or reporting it busy. The frame is **not** rebuilt: not one buffer is
re-uploaded to stop drawing one shader. `fx-demo.html` puts a switch on each
effect the document declares and remembers the choice per browser.

### The trap under a backdrop effect

A backdrop reads the surface mid-frame, and the one surface it may never read
is the canvas. A WebGL2 context asked for `antialias: true` — the default, and
what every page here asks for — has a MULTISAMPLED default framebuffer, and
copying out of one is `INVALID_OPERATION`: the copy leaves the texture black
and the pass writes that black over everything painted before the element. So
a frame with a live backdrop in it is rendered into the offscreen target and
presented at the end.

This shipped broken for an afternoon and every check passed, because the checks
rendered with `preserveDrawingBuffer: true`, which on this driver hands out a
single-sampled buffer. `fx-check.mjs` now asks for the attributes a page asks
for and reads the pixels back through a 2-D canvas, which is what a screenshot
does — and it fails three ways if the routing is removed.

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
npm run evg:fx:shots     paint every preset in effect-presets.css
```
