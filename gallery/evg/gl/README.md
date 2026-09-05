# EVG on the GPU

Running the CSS palette — flex, grid, the stylesheet layer, real TTF metrics
and kerning — on a GPU, without a browser doing the layout.

```
npm run evg:displaylist -- page.tsx out.json -css sheet.css -theme editorial
```

## The seam

`EVGDisplayList` walks a laid-out tree once and emits flat draw commands:
filled rect, border, image quad, text run, push/pop clip. Absolute pixels,
colours resolved to 0–255 + alpha, no tree and no units left.

```
JSX + CSS ──► EVG layout ──► display list ──┬─► WebGL 2      (evg-webgl.js)
                                            ├─► SVG / DOM    (../html/evg-html.js)
                                            ├─► SDL2 + GL    (C++ target)
                                            ├─► PDF, PNG, HTML (existing)
                                            └─► framebuffer  (v2 game UI)
```

The SVG backend is the second consumer of this seam and the evidence that the
seam is one: it is 500 lines, it shares no code with this file, and the two are
differenced pixel for pixel over the same frames — 0.022% on a sheet built to
exercise every command kind, 0.000% on every slide of the .pptx deck. See
[`gallery/pptx/web/html/`](../../pptx/web/html/README.md), which is the slide
editor with this painter swapped out for that one and nothing else changed.

Everything above the seam is the code the PDF is made with. Everything below
knows only about quads, glyph runs and scissor rectangles.

This matters for more than tidiness: five painters already walk the tree
themselves, and each decides again what a box means. That is how border-radius
came to work in PDF and silently not in PNG — one painter read
`box.borderRadius`, another a stale `el.borderRadius` that nothing wrote. A
GPU backend should not become a sixth copy of that walk.

## WebGL 2 — working

```
python3 -m http.server 8000 --directory <repo root>
# open /gallery/evg/gl/demo.html?list=boxmodel.json
```

One quad per command, drawn instanced. Rounded corners and borders come from a
signed distance function in the fragment shader, so a rounded rect costs the
same two triangles as a square one and needs no tessellation:

```glsl
sdRoundedBox(p, b, r) = length(max(|p| - b + r, 0)) + min(max(qx, qy), 0) - r
```

Antialiasing is one `fwidth()` smoothstep. It is **clamped** — on a very large
quad the derivative jumps across the triangle strip's diagonal and drew a
visible hairline across the page.

Text: the list carries the run, the face and the size, and the position is
EVG's — measured from the same TTF the PDF is set in, kerning included. Only
the glyph *images* come from the platform. Here a 2D canvas rasterizes each run
into an atlas, one slot per run rather than per glyph, which keeps the run
intact and therefore keeps EVG's kerning exactly.

## Images

`object-fit: cover` is the only fit the raster and PDF targets implement, and
it is done here the same way they do it — by cropping, not by squashing. The
crop is a UV rectangle computed from the source and box aspect ratios, so the
GPU samples only the covered region and the quad stays two triangles. A radius
on the element clips the photo through the same distance field the rectangles
use.

A photo needs its own texture bound, which a single instanced draw cannot do,
so the list is split into **runs**: consecutive quads that share the atlas are
one draw, and an image breaks the run and is drawn on its own. Runs read the
same instance buffers offset to their first instance, because WebGL 2 has no
base-instance parameter. That keeps paint order exactly as the list has it —
`boxmodel` is one run, `album` is six.

The published gallery copies the referenced photos next to the viewer and
rewrites the list to point at the copies. Without that the `src` was the path
the author wrote — relative to the page source — which resolves in the
repository and nowhere else, so the deployed viewer fetched four 404s and drew
a page with holes in it. The PDF and PNG targets never hit this: they read the
file at render time and embed the pixels.

Verified against `showcase/pages/boxmodel.tsx`: 20 commands, 15 rects with
their radii, one border, 4 text runs, rendering to the same geometry as the
PDF — and against `album`, whose four photos now draw.

Not done yet: a real clip stack. A single scissor rect is straightforward;
nested clips need a stack. It is marked in the source.

## SDL2 + OpenGL — the portable half is ready

The display list module compiles to **C++, Rust and Go** as well as ES6, which
is the whole reason this shape was chosen — the same list can drive WebGL in a
browser and SDL2 on a Raspberry Pi or a Mac.

What is already in the repo:

- `EVGDisplayList` compiles cleanly to the C++ target (checked).
- `ranger_games/sprite_char_sdl.rgr` is an existing Ranger → C++ → SDL2
  front-end with a real window and gamepad, so the platform pattern is
  established rather than hypothetical.
- `imaging/raster/RasterText` already rasterizes glyph outlines — including
  composite glyphs, so `ä`/`ö` work — which is the atlas source on a platform
  with no canvas.

What is missing is the platform shim: create an SDL2 window with a GL context,
upload the same vertex data, and use the same shader source. The shaders are
plain GLSL ES 3.00 and need no change for desktop GL 3.3 beyond the `#version`
line.

The honest gap: none of that is compiled or run here, because this container
has neither SDL2 nor a GPU. Treat the C++ compile as evidence that the
portable half holds, not that the app runs.

## Nobody can read it — so there is a second list

A GPU frame is invisible to a screen reader: NVDA asks the platform for a tree
of roles and names, and this file produces quads. So the app emits a second list
beside the display list — `EVGA11yTree`, meaning where this one carries geometry
— and `evg-a11y.js` mirrors it as real DOM over the canvas, positioned at the
rectangles that were painted.

```
GridApp ─┬─ sceneJson()  ─► evg-webgl.js  ─► pixels
         └─ a11yJson()   ─► evg-a11y.js   ─► DOM ─► VoiceOver / NVDA / Orca
```

The canvas becomes `aria-hidden`. The sheet is a `role="grid"` that claims all
ten thousand rows and emits the forty on screen; the caret cell is the one tab
stop in the application; a dialog is modal and hides the sheet behind it. The
mirror never tells the app where focus is — the app tells the mirror, or the two
chase each other.

Checked in a real browser by `npm run datagrid:web:test`, which asks the DOM
what a reader would be handed. Turn it off with `?a11y=0`.

Design, state and how to try it with VoiceOver:
[../PLAN_ACCESSIBILITY.md](../PLAN_ACCESSIBILITY.md).
