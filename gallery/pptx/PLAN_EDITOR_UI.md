# The editor's chrome, on the gallery's components — plan

The slide editor works. Its **chrome** — the strip, the two panels, the notes
band, the status line — is hand-painted: absolute pixel arithmetic writing
rectangles straight into a display list. `gallery/ui` now holds thirty
controllers built the other way, each measured against a browser, each with an
accessible tree and hover, press, focus and motion for free. Nothing outside
`gallery/ui` uses any of them.

This is the plan for putting the editor on them — which is as much a test of the
components as it is a change to the editor. A palette nobody has built a real
application out of is a palette with unknown holes in it, and the holes this
finds are the point.

The rule from `PLAN_EDITOR.md` still holds here and is not a formality: **no
PPTist source is read, copied, ported or paraphrased.** Where a reference is
needed for behaviour it is PowerPoint or LibreOffice, and the components' own
references are Radix, ReUI and the browser oracles already in
`gallery/ui/conformance/oracle`.

## What is there now

The editor already has one foot in this world and does not know it.
`PptxApp.setChromeCss` parses a real stylesheet, and `defaultChromeCss` declares
the shell — `.slide-panel { width: 150px }`, `.notes { height: 92px }`, media
queries for a tablet, a phone and a coarse pointer. Then `applyChrome` reads
**three numbers** out of the result and throws the rest away:

```ranger
if (panel.width.isPixels())  { panelW = (to_int panel.width.pixels) }
if (panel.height.isPixels()) { panelH = (to_int panel.height.pixels) }
if (notes.height.isPixels()) { notesH = (to_int notes.height.pixels) }
```

Everything after that is arithmetic. `slideOriginX` centres the slide between
two panel widths by hand; `notesRect` subtracts the panel on one side and the
properties band on the other; `buildFrame` paints eight regions at computed
coordinates in a fixed order. The stylesheet is being used as a configuration
file, not as a layout.

So the shape of the work is not "replace the chrome with components". It is
**let the engine that is already parsing that stylesheet lay it out**, and then
fill the boxes it computes with the controllers.

## Two things that are not up for negotiation

**The slide stays the slide.** This project changes the CHROME around the deck
and nothing about the deck. Fidelity to what PowerPoint or LibreOffice would
draw is the whole point of `PptxView` / `PptxToEvg` and is measured by the
visual harness; a slide that renders differently after this work is a
regression, however much better the panel beside it looks. The palette stops at
the edge of the stage.

**The surface must scale to the visible area.** It does not today, and the
numbers say so plainly. The standalone host sizes the canvas like this:

```js
let h = Math.round(box.height) || 0;
// the desktop layout does not state a height
if (h < 200) h = Math.round(w * 0.6);
```

So the editor's height is a GUESS DERIVED FROM ITS WIDTH. In a 1440x900 window
the canvas comes out 1120x681 with dead space below it and to the right; in a
900x640 window, 900x512. The window is never asked how much room there is.

The app side is already right and is not the problem: `ptScale` fits the page
to whatever area it is told it has, through `view.fitScaleFor`, and P0 made the
stage rect that area comes from a laid-out box rather than a subtraction. What
is missing is upstream of it — the host has to measure the visible area and
hand it over, and the page around the canvas has to give the frame a real
height instead of leaving it to an aspect ratio.

Which makes the requirement concrete, and it is two separate things:

- **Fill the visible area.** The frame gets a height from the viewport, the
  host passes it, and the chrome laid out in P0 takes it from there. Nothing in
  `PptxApp` needs to change for this.
- **A zoom the reader controls.** Fitting the page to the stage is one policy
  among several — fit-width, fit-page, 100%, and a number the reader picks are
  all normal in an editor and none of them exist here. `showScale` and
  `fitScaleFor` already carry the arithmetic; what is missing is the control
  and the state behind it, and the status line is where such a control belongs.

## The seam

One idea carries the whole plan, and the dashboard demo already proves it: a
styled element tree with a **hole** in it.

```text
chrome tree ─► EVGStyleSheet ─► EVGLayout ─► rects ─► EVGDisplayList
                                              │
                                   the stage's rect
                                              ▼
                          slide display list, offset into it
```

`DashboardDemo` builds its page as elements, lays it out, and then appends
Vela's chart commands into the rect of `db-chart-box` — clipped by hand,
because the chart is appended after the walk. The editor is the same shape with
a bigger hole: the chrome is elements, the slide is a display list dropped into
the rect the layout computed for it, and the selection chrome goes in after,
exactly as it does today.

Nothing about `PptxEditor` changes. It knows slide points and history and has
never known a pixel; `PptxApp` remains the only place a window pixel becomes a
slide point. What changes is where the numbers on that boundary come from.

## The regions, as they are today

The chrome is already a holy-grail layout — it is just spelled as subtraction:

```text
┌──────────────────────────────────────────────────┐
│ toolbar            tabs 28 + strip 34            │
├─────────┬──────────────────────────┬─────────────┤
│ panel   │ stage                    │ properties  │
│ 150     │                          │ 168         │
│         ├──────────────────────────┤             │
│         │ notes              92    │             │
├─────────┴──────────────────────────┴─────────────┤
│ status                              22           │
└──────────────────────────────────────────────────┘
```

with three rules that are not obvious from the picture and have to survive:

- **The properties band disappears below 820px** (`propsWidth`), and the slide
  re-centres between what is left rather than in the whole window.
- **The panel becomes a strip across the top on a phone.** A width of zero and
  a height turns the column into a band — a breakpoint changing orientation
  without the stylesheet needing a word for it.
- **A coarse pointer makes the strip taller**, independently of width, because
  a laptop with a touchscreen is wide and coarse at once.

## Phases

### P0 — the shell, laid out rather than computed (done)

`PptxChrome.rgr`: build the shell as an element tree, style it with the
stylesheet that already exists, lay it out with `EVGLayout`, and hand back the
same six rects the arithmetic hands back today.

**The gate is that the numbers do not move.** Every rect the layout computes is
asserted equal to what `panelWidth` / `propsRect` / `notesRect` / `slideOrigin*`
compute, at four window sizes and both pointer kinds. A layout engine that
reproduces the hand-written arithmetic exactly is a layout engine that can
replace it without a single picture changing — and `pptx:editor:shots` is the
proof, since those PNGs must come out identical.

That is the whole of P0. It buys nothing visible and it is the only step that
makes the rest safe.

**Done, and wired in.** `panelWidth`, `panelHeight`, `propsWidth`, `propsRect`,
`notesHeight` and `notesRect` read off the layout now; `W < 820` is a media
query rather than a line of code, so a host can move it. All fifteen snapshots
are byte-identical and the browser's 127 selftests pass, breakpoints included.

Two things the wiring taught, both worth keeping:

- **A host's sheet REPLACES the app's, and that is a contract**
  (`PptxFrameTest`: "with no breakpoints, a phone gets what it asked for").
  Laying the app's sizes underneath a host's broke it in a way no host would
  have guessed: the phone breakpoint gives the panel a HEIGHT, a height turns
  the panel into a strip, and a host that asked only for `width: 210px` got a
  strip it never asked for. So the sheet is split — `structureCss` is the
  arrangement and is always underneath, `sizesCss` is the app's numbers and is
  what a host replaces. The properties band lives in the structure because its
  width and its breakpoint were hard-coded fields that no host could ever
  change.
- **A layout has to be told when its inputs change.** `view.panel` flips
  `panelVisible` and read the width in the same breath, off a layout computed
  when the panel was still hidden. Five call sites, five `syncChrome`s.

### P1 — the strip

`EVGToolbarView` (1,105 lines, shared with the spreadsheet and the document)
draws the tabs and buttons by hand. The tab row becomes `TabsCtl`, the button
band becomes `ToolbarCtl`, and the command table behind them — `EVGCommands`,
`registerCommands`, the ids — does not move. Only the view changes, so the
keyboard, the command palette and the other two office apps keep working.

The font dropdown becomes `SelectCtl`, which it has wanted to be since it was
written.

### P2 — the left panel

Today: a hand-painted column of thumbnails with hand-computed scroll
(`settlePanelScroll`) and a hand-drawn Slides/Outline tab pair.

- The pair becomes `TabsCtl`.
- The thumbnails go inside a `ScrollAreaCtl`, which brings a real scrollbar and
  drops `settlePanelScroll`.
- **Outline becomes `TreeCtl`** — it is a tree of slides and their text and has
  been drawn as an indented list.
- Reordering slides by dragging becomes `SortableCtl`, which is measured
  against dnd-kit.

### P3 — the properties panel, which is where the editor gains

Today it says "Nothing selected. Click a shape to change how it looks." and,
with a shape selected, draws a few rows. This is the phase that makes the
editor better rather than merely newer: a real inspector, built out of the
label-left form the Profile demo already established —

- fill and outline colour, opacity on `SliderCtl`
- position and size on numeric `InputCtl` fields
- text: family on `SelectCtl`, bold/italic on `ToggleCtl`, alignment on a
  `RadioGroupCtl`
- collapsible sections on `AccordionCtl`

**A colour swatch and picker do not exist in the palette** and will have to be
built in the same style, with an oracle. That is the first hole this exercise
is expected to find; there will be others.

### P4 — the rest of the shell

Notes band, status line, and the shape picker and slide dialog onto
`WindowCtl` / `DialogCtl`. Panel and notes edges become `ResizeCtl` splitters,
which is a feature the editor has never had.

### P5 — what the components bring that the chrome never had

The accessible tree. Every controller publishes one; the hand-painted chrome
publishes nothing, so a screen reader sees a canvas. `PptxA11y.rgr` covers the
SLIDE. Once the chrome is elements, `EVGA11yFromTree` covers the chrome too,
and the axe gate that runs over the gallery's demos can run over the editor.

## What this must not break

- `pptx:editor:test`, `pptx:editor:host:test`, `pptx:frame:test`,
  `pptx:css:test`, `pptx:web:test`, `pptx:web:touch:test`, `pptx:harness`.
- The other hosts. `PptxApp` is host-agnostic and SDL, Android, WASM and the
  browser all drive it; a change that assumes a browser breaks three of them.
- The other two office apps, which share `EVGToolbarView` and `EVGWindow`.
  P1 replaces the pptx view; it does not delete the shared one until the
  spreadsheet and the document have moved too.
