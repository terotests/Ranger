# A geometry engine, not 153 shapes

`ST_ShapeType` enumerates 187 preset geometries. `PptxGeom.presetPath` draws
34 of them. The other 153 reach the painter as `rect`, which fails quietly —
a shape we do not know is a filled box in the shape's own colour, not an
error and not a gap. That is why `star7` read as a deliberate red square.

The inventory, per shape, is in `PRESET_SHAPE_COVERAGE.md`.

## Why this is not a list of 153 tasks

A preset is not a polygon. It is a list of *guides* — named values computed
from the shape's box and its adjustment handles — followed by a path written
in terms of those guides. A rounded rectangle's corner is `*/ ss adj 100000`,
not a constant; `star7` states three adjustments, thirty-odd guides and one
path. Transcribing that by hand is transcribing an evaluator 153 times,
badly, and it is why shape fixes arrive one deck at a time and never stop.

ECMA-376 states all 186 of them as data, in the same guide-and-path language
a `custGeom` is written in. So the two can share one route:

    prstGeom ─┐
              ├─→ guides ─→ path walker ─→ points
    custGeom ─┘

## What already exists

The path half. `PptxParser.parseCustGeomPath` walks `moveTo`, `lnTo`,
`cubicBezTo`, `quadBezTo`, `arcTo` and `close`, converts DrawingML's
centre-and-sweep arcs into SVG endpoint arcs, and flattens the result. Those
six commands are the *entire* path vocabulary the preset definitions use —
nothing else appears in the file. `EVGDisplayList` has carried `ringEnds` and
`evenOdd` for multi-ring fills all along.

What is missing is the guide evaluator: seventeen formula operators, and the
wiring that feeds a preset's definition through the walker a `custGeom`
already goes through.

Two measurements decide the order below. Of the 153 missing shapes, **98 need
only five operators** (`val`, `*/`, `+-`, `+/`, `pin`), and **94 are a single
path**; the rest layer several, some stroke-only or fill-only.

## Phases

Ordered by dependency. Each lands with tests on both targets and leaves the
renderer working.

### 1. The guide evaluator, five operators — unlocks 98 of 153

A shared module, `OfficeGeomFormula`: the built-in variables (`w`, `h`, `ss`,
`hc`, `vc`, `wd2`, `hd2`, `l t r b`), then each named guide in order, with
`val`, `*/`, `+-`, `+/` and `pin`. Numbers in, a name-to-number map out — no
rendering and no PowerPoint types in it.

Shared rather than pptx-local for the reason every other shared module is:
`custGeom` in Word and Excel carries the same `gdLst`, and a second evaluator
is a second set of bugs.

*Proved by* the spec's worked examples, and by guides whose geometry is known
independently — a `roundRect` at `adj 25000` has a corner of exactly a
quarter of its shorter side.

### 2. Presets as data, through the existing walker — 98 shapes drawn

Ship the preset definitions as an asset and resolve `prstGeom` through them:
look the preset up, evaluate its guides, substitute them into the `pathLst`,
hand that to the existing walker. One code path from two sources.

The hand table stays ahead of the new route for this phase, so nothing
regresses while the new route is narrow. A shape needing an operator we do
not have yet falls through to it, and then to `rect`, exactly as today.

*Proved by* drawing every shape in the hand table both ways and comparing —
the new route must agree with the shapes we already draw before it is trusted
with the ones we do not.

### 3. The remaining twelve operators — unlocks all 153

`sin` `cos` `tan` `at2` `cat2` `sat2` `mod` `sqrt` `abs` `min` `max` `?:`,
with DrawingML's angle unit of 1/60000 of a degree — the detail that quietly
ruins a shape when it is missed. Stars, arcs, gears and every circular arrow
are written in these.

*Proved by* operator-level checks on both targets, then `star7` end to end.

### 4. Several paths per shape, each with its own fill and stroke — corrects 59

A `pathLst` may hold more than one path, and each carries `fill="none"`,
`stroke="false"` or `fill="darken"`/`darkenLess`. That is how a cube gets a
shaded side and a donut gets its hole. Flattening them into one ring, as the
parser does now, draws a cube as a hexagon.

*Proved by* `donut` — a hole that is genuinely empty, checked by sampling the
middle of the drawn shape rather than by counting commands.

### 5. Adjustment handles — the yellow diamonds

Today one adjustment is read, `adj` as a bare `val`, and it reaches only
`roundRect`. A preset declares its own defaults in `avLst`, a file overrides
any of them by name, and the callouts have four. Reading them per name,
defaulting from the definition, is what makes a deck's arrows the width its
author drew them.

*Proved by* the same preset at three adjustment values giving three
measurably different paths, and a file that states none giving the
definition's own.

### 6. Retire the hand table — no new shapes, one code path

With 1–5 in, the 34 hand-written presets are 34 opportunities to disagree
with the specification. Delete them; keep `rect` and `roundRect` on the
rounded-rectangle primitive, which knows about gradients and shadows in a way
a polygon does not.

This is the phase that pays the plan back: from here a missing shape is a
data question, not a code change.

## Out of scope, and two exceptions

Geometry only. The shape tree is already read — `sp`, `cxnSp`, `pic`, `grpSp`
and `graphicFrame` all reach the model — and nested group transforms,
gradient and pattern fills, joins and caps, arrowheads, shadow and glow, and
the text engine are each their own piece of work.

Two are worth naming here because they are geometry and fall out of phase 1
nearly for free — both are guides, evaluated by the same evaluator:

- **The text rectangle.** A preset states where its text goes, in guides, via
  `<a:rect>`. We inset by a constant, so a callout's words sit outside its
  bubble.
- **Connection sites.** `cxnLst` is where a connector attaches. Without it
  every connector meets a bounding box rather than the shape.
