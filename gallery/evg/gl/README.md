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
                                            ├─► SDL2 + GL    (C++ target)
                                            ├─► PDF, PNG, HTML (existing)
                                            └─► framebuffer  (v2 game UI)
```

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

Verified against `showcase/pages/boxmodel.tsx`: 19 commands, 15 rects with
their radii, 4 text runs, rendering to the same geometry as the PDF.

Not done yet: IMAGE commands and a real clip stack (a single scissor rect is
straightforward; nested clips need a stack). Both are marked in the source.

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
