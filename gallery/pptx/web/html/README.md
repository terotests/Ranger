# The PPTX editor, painted as DOM

The [serverless slide editor](../standalone/) with one part replaced. The deck
is still parsed in the page and still laid out by EVG; the display list that
comes out is the one the WebGL page draws. Only the painter differs.

```
OPC/ZIP → PresentationML → theme & layout → EVGDisplayList ─┬─► evg-webgl.js  ─► pixels
                                                            └─► evg-html.js   ─► <svg>
```

```bash
npm run pptx:html:serve     # build and serve on http://localhost:8006
npm run pptx:html:test      # the same page, driven headless
npm run pptx:html:parity    # both painters over the same frames, differenced
npm run pptx:html:parity -- --bench
```

![the editor, drawn as SVG](../../artifacts/pptx-html-dom.png)

There is no `<canvas>` on the page and no GPU behind it. Every shape on the
slide is an element you can inspect in the dev tools, the text is text you can
select, zooming re-renders instead of blurring, and Print sends vectors — which
the WebGL page has to reach by rasterising each slide to a PNG first.

## Why SVG, and not a stack of divs

The list has eight command kinds and SVG answers seven of them natively,
including the two absolutely positioned `<div>`s cannot express at all:

- **PATH / STROKE** are flattened rings in page coordinates. `<path d=…>` takes
  them verbatim, and `fill-rule="evenodd"` is what keeps a hole a hole. The GL
  backend needs a stencil buffer for the same thing.
- **PUSH_CLIP / POP_CLIP is a stack**, and nested `<g clip-path>` intersects by
  construction. The GL backend has one scissor rectangle and has to intersect
  the stack by hand; [`EVGListToElements`](../../../office/export/EVGListToElements.rgr),
  which turns a list into an element tree for the PDF writer, drops clipping
  entirely and says so in its header.

So this is not the degraded backend. It is missing the ripple post-pass, which
is a GPU effect with no DOM equivalent, and its `backdrop-filter` is the CSS
property the display list's field was named after rather than the render target,
separable blur and second shader the GPU needed for it.

## What it is measured against

`parity.mjs` renders every scene twice — once through each painter — and
differences the pixels. Two screenshots side by side are how a claim like this
gets believed and not how it gets checked: the eye forgives a border on the
wrong side of an edge, a baseline a pixel high and a gradient running the wrong
way, and those are exactly the mistakes a second painter makes.

```
  features      37 cmds   0.022% differ
  slide 1..5             0.000% differ
```

**The difference is measured as AREA, not as pixels.** A distance field and a
browser rasteriser put slightly different coverage on every edge in the picture,
so a plain pixel count is dominated by one-pixel fringes along shapes that are
in exactly the right place — and it grows with how much text a scene has, which
made *adding two lines to the fixture* move the number more than a broken border
did. The mask is eroded first: a differing pixel counts only if three of its four
neighbours differ too. That took the floor from 0.286% to 0.022% and left every
known defect above 0.15%.

The residual 0.022% is not this painter's error. It is the GL backend's path
fill, which goes through a stencil with no antialiasing, so the triangle in the
feature sheet has stepped edges where the SVG has smooth ones.

### Fourteen mutations, and what three of them taught

Every number below is a deliberately broken painter, run against the check:

| mutation | worst scene |
| --- | --- |
| clip replaces instead of nesting | 1.925% |
| image stretched, not cover-cropped | 1.868% |
| gradient direction flipped | 1.774% |
| border centred on its edge, not inset | 1.513% |
| baseline drawn without the half-leading | 1.165% |
| rotation origin ignored | 0.996% |
| mirrored image not mirrored | 0.934% |
| even-odd fill rule ignored | 0.735% |
| stroke width forced to 1 | 0.381% |
| `font-style: italic` not written | 0.379% |
| `xml:space="preserve"` dropped | 0.356% |
| `font-weight` not written | 0.269% |
| per-corner radii ignored | 0.207% |
| text pivot back to the line box | 0.154% |

The first version of this check ran over the deck alone, at a budget picked out
of the air, and **passed under the first three mutations it was given**. Two
different failures were hiding in that, and only one of them was the budget:

- 3% was fourteen times the noise floor, so it forgave everything. Fixed by
  measuring the floor and setting the budget from it.
- The gradient mutation moved the number by **nothing at all**, and no threshold
  can fix that: the deck has no gradient-filled rect in it, so that branch was
  never executed. The check was not weak about it, it was blind to it.

Hence `featureScene` — a display list written by hand to touch every kind and
every flag — with the deck kept as the second scene, because a hand-written list
only exercises what its author remembered. Three defects then escaped the first
version of *that*, each for the same reason, and each is now a comment beside
the fixture it corrected:

- **object-fit.** The image probe was four quadrants, and a centred crop and a
  squash both leave the boundary in the middle of the box — the two produce the
  same picture. Eight stripes instead.
- **Nested clips.** The inner clip was wholly inside the outer one, where the
  intersection *is* the inner clip and replacing gives the identical result. It
  hangs out to the right now.
- **Italic.** Two renderings of one short word overlap almost entirely once the
  mask is eroded. A full line at 28px is the same defect made measurable.

## What it costs

`--bench` times both painters over the same frames, with the SVG attached to the
document and a forced layout after each one, so handing the browser the elements
is inside the measurement.

```
  scene       cmds     DOM         GPU        ratio   nodes
  features      37     0.98 ms     0.32 ms    3.1x      49
  stress      8448   166.68 ms    36.39 ms    4.6x   10241
  slide 4      335     2.02 ms     5.65 ms    0.4x     335
```

Read that carefully in both directions. **A slide is free** — 2 ms at 335
commands, and the editor is indistinguishable from the WebGL one to use.
**A chart-heavy frame is not**: 8 448 commands is 167 ms, which is six frames a
second. And the GPU column is SwiftShader, a software rasteriser, so it flatters
the DOM side; on real hardware the ratio is worse than it looks here.

That number is the design, not a bug to optimise away. **A draw command carries
no id** — `EVGDrawCmd` has geometry and paint and nothing else — so every frame
rebuilds every node. It is the same property that stops a CSS transition, a
focus ring or a native `<input>` from having anything to attach to.

## What a version with element identity would buy

This is a painter. The interesting backend is the one above it, and the single
change that unlocks it is an `id` on `EVGDrawCmd`: the producer has the element
in hand when it emits the command, and a backend that ignores the field behaves
exactly as it does today. With stable identity:

- nodes are patched instead of rebuilt, so the stress frame stops being a
  full-document parse;
- transitions run on the browser's compositor rather than on EVG's clock;
- a text field can be a real `<input>` — IME, mobile keyboards, autofill, the
  clipboard, none of which `InputCtl` has or claims to;
- `overflow: hidden` can become a real scroll container.

Until then, the honest description of this directory is: the same picture,
drawn as documents, at a cost that is invisible on a slide and real on a chart.

## Files

| File | Role |
| --- | --- |
| [`../../../evg/html/evg-html.js`](../../../evg/html/evg-html.js) | The painter. Not this page's — any EVG app can import it |
| `index.html` · `html.mjs` | The page: boot, draw, input, SVG export, vector print |
| `build.sh` | Compiles `pptx_web.rgr` and stages the static output |
| `smoke.mjs` | The page driven headless; the assertions are about the DOM, because the DOM is the picture |
| `parity.mjs` · `parity-page.html` | Both painters, differenced |

The engine, the pointer and the keyboard are shared verbatim with the WebGL
page — `pptx_web.rgr` and [`host/pptx-host.mjs`](../host/pptx-host.mjs). Nothing
about the editor is written twice, which is the claim the page exists to make.
