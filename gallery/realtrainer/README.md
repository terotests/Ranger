# gallery/realtrainer — an app, on the GPU

A five-scene application built from `gallery/ui`'s components and painted by
EVG's WebGL painter: a loading screen with a spinning ring, the sign-in page it
hands over to, a dashboard, one training session with a countdown dial, and the
parsed document behind all of it.

**License: AGPL-3.0-or-later** (Gallery).

```bash
npm run rt:web      # build, serve, print the URL
npm run rt:check    # the app driven with a made-up clock, no browser  (CI)
npm run rt:frame    # the same app in Chromium, checked at the pixels
```

![the loader](web/shots/realtrainer.png)

![the dashboard](web/shots/realtrainer-dashboard.png)

![the session's dial](web/shots/realtrainer-timer.png)

![the document](web/shots/realtrainer-document.png)

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
npm run rt:l0              # the same rows against the TypeScript library  (CI)
npm run rt:l0:record       # re-record that reference
npm run rt:parser:sync     # refresh the vendored parser
npm run rt:parser:check    # fail if the copy is stale
```

## A ported state machine, and how it is checked

`src/AddWorkoutDialog.rgr` is a port of `addWorkoutDialogMachine.ts` from the
RealTrainer monorepo — an XState v5 machine of three states and seven events,
the smallest the app has, which is why it went first.

`npm run rt:machine` drives it through **all twenty-one cells** of the
transition table transcribed in `fixtures/machines/`. Thirteen of them are
IGNORES, and they are the point: `OPEN` while already open must not re-blank
what someone typed, `ERROR` out of `saving` must keep the input rather than
throw it away, and `START_SAVING` while saving must do nothing. A port tested
only on its happy path passes while being wrong about every one of them.

One deliberate difference, and it is the reason this is testable at all: the
machine calls `new Date()` inside its own reducer, so its reset depends on when
it ran. Here "today" is handed in by the host — a clock belongs outside a state
machine for the same reason it belongs outside a workout controller.

The table is run through **two** implementations: the hand-written port, and
the same machine as DATA on [`gallery/statechart`](../statechart/README.md)'s
generic runner. Two independent readings of one specification either agree with
it or one of them is wrong, which is what makes transcribing the table worth
doing — a single implementation checked against itself could never show that.

![the ported dialog](web/shots/realtrainer-dialog.png)

The dialog is drawn from the machine's state and nothing else: no local "is it
open" flag, no second copy of the text.

## Traces: the app itself as the oracle

A machine that passes its transition table can still be wired to the wrong
screen. The benchmark for that is the app as it really runs — `frontend --mode
test` on 5175 with the Firebase emulators — driven through the same scenario
and compared frame for frame.

```bash
npm run rt:trace          # replay the scenarios on this side  (CI)
npm run rt:trace:record   # re-record this side
# and, on a machine with the monorepo and the emulators:
node gallery/realtrainer/scripts/record-reference-trace.mjs
```

Steps are clicked **by role and name**, not by test id: the views in scope
carry zero `data-testid` attributes, so ids would mean changing the private
repository for every node measured. Roles and names are already there, and they
are what the EVG side publishes through `UiCtl.rows()` anyway — the same key
`gallery/ui` diffs against Radix.

The reference recorder is here and says plainly that it cannot run here. The
Ranger trace is committed for the reason the L0 oracle is: this repository's CI
has neither the emulators nor the private frontend.

## The coverage table, measured

[`COVERAGE.md`](COVERAGE.md) is what this demo does with each of COMPACT's row
families — generated, not maintained. `COMPACT_FEATURE_MATRIX.md` upstream
lists the same families against seven columns and every cell in it is `❓`,
because it is a checklist someone has to remember to update. This one runs
every family's line through the parser and the row layer on the way to being
printed.

```bash
npm run rt:coverage         # regenerate it
npm run rt:coverage:check   # fail if it is stale  (CI)
```

Reaching `text` is not scored as a gap: the reference gives a row type of its
own only to what it draws specially. The column that shows real work left is
**Drawn** — the families the demo's own document does not yet contain.

## Saving, and why it does not serialise the rows

A view model is lossy on purpose: fourteen life families come out as a line of
text with their structure thrown away, because that is what the reference
draws. Writing the rows back would rewrite `Sleep 7h` as `Text Sleep 7h` and
quietly change someone's training log.

So the document keeps the text it was read from, and an edit **patches the one
line it touched**. `CompactDocument.rowLines` is how a row finds that line: the
parser hands back content in order and each node came from exactly one line, so
the lines are handed out in the same walk that builds the rows — including a
circuit's `>` children.

`CompactWrite` writes back only what it can write, and `rt:compact` pins the
guarantee that makes this safe: an editable row, written back with nothing
changed, gives the SAME LINE it was read from. A form that arrives and does not
round-trip fails there instead. A measured row answers with "" — it records
what happened, and the caller does not save what it cannot write.

The backend is `RtBackendSim`: no network and no cloud, because this demo has
neither and wants neither. What a screen still needs is the SHAPE of one — a
wait with a state on it and a failure that can be reached on purpose, since a
demo that cannot be made to fail is a demo whose error state nobody has looked
at. It runs off the app's clock, so a save takes the same milliseconds in the
browser and in the headless check, and no test sleeps.

## Measured against the library it is a port of

`realtrainer-compact/ui/react` renders COMPACT in React, and this renders it on
the GPU. The two agree or one of them is wrong, so `rt:l0` says which: every
case in `fixtures/cases.json` goes through both sides and the parts are diffed.

Parts, not strings. `3x5` and `x80kg` print as `3x5x80kg` either way, and a port
that returned the one string would pass every text assertion while having lost
the only distinction a theme draws. Tone and kind are compared too.

The reference is RECORDED — `oracle/record.mjs` bundles the library's own
`parsedRowMapping`, `formatters` and row utils, runs the corpus through them and
writes `oracle/expected.json`, which is committed. That is what lets the gate run
in CI, where the library is not checked out, instead of quietly passing because
the oracle went missing. What the recorder imports and what it transcribes from
the components is written at the top of that file, because move, pyramid and
split build their parts inside JSX and there is no function to call.

Fifty-five cases, matching part for part. Two more are deliberate deviations —
recorded in the corpus with their reason and printed on every run — and one is
an `interval`, which that library has no renderer for at all. Both are listed
rather than left out: a family with no reference is a gap and not a pass, and a
deviation nobody prints is a difference nobody remembers.

Thirteen row types, and every family COMPACT has reaches one of them. That is the
reference's own arrangement and worth knowing before reading the shape: it gives
a row type of its own only to what it draws specially — section, text, exercise,
move, pyramid, split, summary, phase, custom, duration, circuit, unknown — and
turns the
fourteen life families into a line of TEXT with a fixed shape (`Sleep 7h`,
`Expense 45EUR | sali`). So `Sleep` is not a case here either; it is a text row
whose wording is a port of `fallbackTextForEntry`, family by family, because a
port that invented its own wording would look right and compare wrong.

Tags, emojis and derived values are deliberately NOT rows. The reference lifts
them onto the workout and filters them out of the row list, so a renderer
walking rows never meets one, and this does the same.

A life row is drawn the way `Text.tsx` draws it: `Weight 78.5kg tänään` is three
parts — the label, the number, and the words after it — because a reader looking
for the number should not have to find it inside a sentence.

**The document screen** (the rail's third button) is the row library with
nothing on top of it: every row the parser produced, drawn by its family. It is
where a family that renders as a blank line would be obvious, which is the
reason to have it.

It scrolls, and how far is the LAYOUT's answer rather than the app's: the
viewport is a clipped box with a `scrollTop` on it, `EVGLayout` clamps that
offset against the content it measured and translates the subtree, and the app
reads back what it got. There is no scrollbar — a canvas app that draws one has
to make it work, and this needs none to be readable.

Whether two runs touch is a property of the family and not a choice the renderer
makes. `3x5` and `x80kg` are one reading and must not be prised apart; a phase
marker and its name, a duration and its description, and a split's fields are
separate words, and the reference spaces them. So the gap is a class the row
picks by family.

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
