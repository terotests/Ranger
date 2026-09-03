# gallery/realtrainer — an app, on the GPU

A four-scene application built from `gallery/ui`'s components and painted by
EVG's WebGL painter: a loading screen with a spinning ring, the sign-in page it
hands over to, a dashboard, and one training session with a countdown dial.

**License: AGPL-3.0-or-later** (Gallery).

```bash
npm run rt:web      # build, serve, print the URL
npm run rt:check    # the app driven with a made-up clock, no browser  (CI)
npm run rt:frame    # the same app in Chromium, checked at the pixels
```

![the loader](web/shots/realtrainer.png)

![the dashboard](web/shots/realtrainer-dashboard.png)

![the session's dial](web/shots/realtrainer-timer.png)

`npm run rt:shots` regenerates every screenshot in `web/shots/` from the page
that is running, so a picture in this file cannot drift from what the app
draws.

## The COMPACT layer

The app's training content is parsed, not typed in. `Exercise Takakyykky|3x5@90kg`
is what a user writes; `3x5` and `x90kg` — two runs, two tones — is what the
screen draws.

```
.compact text
   │  parser/            the Ranger COMPACT v1 parser, vendored (see parser/README.md)
   ▼
AstNode                  subclasses tagged by a `type` STRING, narrowed with `cast`
   │  CompactRowMapper
   ▼
CompactRow               a `shape`: `match` over it is checked for exhaustiveness
   │  CompactStatBuilder
   ▼
[StatPart]               { text, tone, kind } — all formatting already done
```

**Why a shape and not the parser's own nodes.** A string tag is right for a
parser, where a new row family must not break a build, and wrong for a
renderer, where a family nobody drew is a blank line in the app. COMPACT has
thirty-one row families; the bug being designed out is the thirty-second one
rendering as nothing. `match` will not compile until every case has an arm.

Each case lowers to its own class — `__rg_kind` on ES6, a `sealed interface` on
Kotlin, a native `enum` on Swift — so thirty-one families cost neither a wide
record with everything optional nor a class hierarchy.

**Why parts and not a string.** `StatPart` is the three fields the TypeScript
library's `CompactStatPart` has, and `CompactStatBuilder` is a port of its
`formatExerciseSchemeParts` — same branches, same order. That library is this
port's test oracle, and the comparison is only cheap while the two agree on a
structure. A builder that returned `"3x5x90kg"` would pass a text assertion and
lose the distinction the theme actually draws.

```bash
npm run rt:compact         # text in, rows out, the spec line each row draws
npm run rt:parser:sync     # refresh the vendored parser
npm run rt:parser:check    # fail if the copy is stale  (CI)
```

Three families so far — section, text, exercise. Every one that follows makes
`match` demand an arm.

The session screen is built from this and nothing else. `fixtures/session.compact`
names the workout, its exercise rows are the moves, the section headings are shown
above them, and the plan's length is counted rather than assumed. The steppers write
into the ROW — there is no second copy of the numbers for them to disagree with —
and the spec line is rebuilt from it, so a press moves what the document says.

A measured row — `Lankku|2x25s,24s`, what was done rather than what was planned —
prints `25s, 24s`, and a set that measured zero is dropped rather than written as
`0s`. Reading those numbers needed a change in the parser: they used to be JSON
strings built during the parse. The parser is a copy, so the change was made
upstream and re-synced, and it is written down in [PATCHES.md](PATCHES.md) —
which is where every change this demo needs in someone else's source goes.

## What is the library's and what is the app's

The point of this directory is that almost nothing here is a control. Seven of
them are `gallery/ui`'s — the same controllers the conformance harness measures
against Radix, dnd-kit and TanStack — and what this app adds is a theme, a
layout, four screens, and a parser.

| From `gallery/ui` | Doing what here |
| --- | --- |
| `ProgressCtl` | the loading bar, and the session's "0 / 2 liikettä tehty" |
| `CheckboxCtl` | *muista minut tällä laitteella* |
| `CollapsibleCtl` | the tips the sign-in page hides until asked |
| `TabsCtl` | the dashboard's three sections, with its roving focus |
| `TableCtl` | the goals table's sort — three clicks per column |
| `ToggleCtl` | the filter above that table |
| `AccordionCtl` | the training plans, one open at a time |
| `RadioGroupCtl` | the rest between sets: 30 / 60 / 90 / 120 s |

A controller writes class names and never a colour, so dressing one for a dark
product is a stylesheet and not a fork: `web/realtrainer.css` themes every
`ui-*` class in this app's palette. `gallery/ui/theme/base.css` is the
library's own pale default and is not loaded here.

Everything else is layout — flex rows and columns, and one CSS grid for the
calendar.

## The two rings, and why there is no `position: absolute`

The loader's ring is twelve boxes stacked in **one grid cell**, each turned
about a point 54 px below its own top edge. EVG has no absolute positioning,
and grid placement is the layout that lets children share a rectangle.

Only the *container* is turned, once per frame. `EVGDisplayList` composes a
parent's rotation onto every command its subtree emitted, so twelve blades cost
one angle and no per-blade arithmetic.

The session's dial is the same arrangement at 220 px with sixty ticks — and the
angles are computed in Ranger and written inline, because sixty CSS rules that
differ by a number are sixty rules. Both ways are here on purpose.

## The clock is in the app, not in the page

`tick(dtMs)` is the whole animation. The progress, the ring's angle, the
countdown and the scene change are all read off one elapsed-time counter, so
the browser host does nothing but hand over the real time between two frames
and paint what comes back — and the headless check drives the same app with a
made-up clock and asserts on the same picture. An app whose animation lives in
its JavaScript host has two versions of itself.

## What this demo found

**An element's gradient never reached the display list.** `hasGrad`, the
`gd`/`c2` JSON and the shader's two-stop mix have all been there for a long
time, and nothing wrote one from an element: `background: linear-gradient(…)`
came out flat when there was a `background-color` beside it and emitted no
rectangle at all when there was not. `EVGDisplayList.applyGradient` is the walk
that was missing, and `EVGJsonTest` now covers both halves. Two directions and
two stops is what the list can say, so an angle is snapped to the nearer axis
and the stops swapped when it points the other way; a radial gradient is left
flat rather than turned into a lie.

**A class that goes away does not undo what it wrote.** The cascade writes the
properties the *current* classes ask for, so a state rule may only override a
property its base rule also sets — and `background-color` is a different
property from `background`. With only `.ui-tab-state-active` carrying a
gradient, the tab you clicked away from kept it and two tabs looked active at
once; the dial filled up and never emptied for the same reason. Both are one
line of stylesheet discipline, and both are checked now.

**`activate` rebuilds a controller's subtree even when nothing changed.**
Pressing the tab that is *already* open cleared the panel — and because the
value had not changed, the app did not put its content back. The page went
blank under a tab strip that looked right. The rule that falls out: a press
that reached a controller is a press that rebuilt it.

**A controller's semantics do not travel with its elements.** `gallery/ui`
publishes what a control means as `rows()`, because that is what the
conformance harness diffs against Radix; `EVGA11yFromTree` reads the element
tree instead. So a controller dropped into an app's tree paints perfectly and
says *nothing at all* — which is the one thing a canvas app cannot afford, the
pixels being unreadable already. `RealTrainerDemo.adopt` copies one onto the
other by id, and it is the app's job: a controller cannot know it is being used
inside a tree someone will walk.

## The two checks

`web/loader-check.mjs` drives the app in Node with no browser and reads the
display list: the bar's rectangle grows, the twelve blades carry twelve angles
about one pivot, three clicks on a column header return the rows to the order
they arrived in, the dial empties as the clock runs, and a reader is told what
each control is.

`web/frame-check.mjs` loads the page Chromium loads and reads the framebuffer,
because rotation lives in a vertex shader and the gradient in a fragment shader
and the only honest way to check GLSL is to run it. It clicks at the rectangles
the accessibility tree reports — the same path a pointer takes — and it writes
the screenshots in `web/shots/` with `--png`.

## Files

```
src/RealTrainerDemo.rgr   the app: four scenes, the clock, the hit routing
src/CompactRows.rgr       COMPACT text → rows → the parts a row draws
PATCHES.md                what this demo changed in the parser, and why
patches/                  those changes as diffs, to apply upstream
parser/                   the COMPACT v1 parser, vendored from its own repo
fixtures/                 .compact input the checks read
web/compact-check.mjs     the COMPACT layer, with no app around it
web/realtrainer.css       the theme, this app's and the library's classes
web/main.js               the browser host: a clock, a pointer, one canvas
web/loader-check.mjs      the headless gate
web/frame-check.mjs       the browser gate, and the screenshots
web/serve.mjs             a static server rooted at the repository
```
