# Inputs: the last three, and why they are the last three

## Where the gap actually is

The Radix inventory answers this without anybody guessing. Twenty-eight of the
thirty-one components are implemented. The three that are not are:

| Radix | what it is |
|---|---|
| `form` | validation and messages |
| `password-toggle-field` | reveal toggle |
| `one-time-password-field` | split code entry |

**All three are inputs.** The parity gap with Radix is not a scattering of odds
and ends — it is the input story, entire, and it is the only thing left.

That is worth pausing on, because it explains a pile of separate-looking bug
reports. The invoice demo hand-built a password field with a reveal toggle,
and its eye walked across the box as you typed; Radix has a component for
exactly that shape, and the demo did not have one to use. Six controls were
reported broken in that form. Two were missing CSS states, one was a disabled
control with no disabled styling, and three were the input model not being
consulted — a `kind` that described the value without constraining it, a click
that focused a field without placing a caret, an eye positioned by flow.

None of those are hard. They happened because there is no input LAYER: there
are input-shaped controllers, and every screen wires them up again.

## What already exists, and is better than the symptoms suggested

Before proposing anything, what is there:

- **`InputCtl`** models `caret`, `anchor`, selection, `wordLeft`/`wordRight`,
  `indexAtX`, `ensureCaretVisible`, `maxLength`, `readOnly`, `disabled`. It is
  a real text-editing model. Two of the reported bugs were things it could
  already do and was never asked to.
- **`SliderCtl`** models a value on a 1D track: `dragTo(frac)`,
  `valueAtFraction`, keyboard steps, `dragBoundsTid`.
- **`SelectCtl`, `RadioGroupCtl`, `CheckboxCtl`, `ToggleCtl`, `SwitchCtl`**
  cover choosing from a set.
- Measurement is now exact: the advance table makes `caretXAt` and `indexAtX`
  agree with the browser to the pixel for unkerned text, which is what makes
  click-to-caret possible at all.

## The three kinds, and the one that is missing

Every input in an application is one of three things:

1. **A typed value** — text, number, hex, a one-time code. Needs parse, format,
   validate, commit/cancel, caret and selection. `InputCtl` is this.
2. **A value on a track** — 1D (slider, hue, alpha, opacity) or 2D
   (saturation/value area, a gradient stop). Needs fraction↔value, pointer
   drag, keyboard step and page. `SliderCtl` is the 1D case. **The 2D case does
   not exist.**
3. **A value from a set** — swatches, options, radios. Covered.

A colour picker — which is what prompted this — is not a fourth kind. It is a
2D track, two 1D tracks, a typed hex value and a set of swatches. Build the
missing primitive and the picker is composition.

## The plan, in the order the dependencies fall

### P1 — `FieldCtl`, the wrapper Radix calls `form`

The thing that turns a control into a form row: label, control, hint, message,
`required`, and a validity state that the message and the control's styling
both read. Today the invoice demo does this by hand in `dress()`, which is why
its error message and its red border are wired separately and its disabled
radio was styled by neither.

Gate: the accessible tree — `aria-describedby` pointing at the message,
`aria-invalid` on the control, and the message announced when it appears. The
a11y harness already checks trees; this adds cases to it.

### P2 — `NumberCtl`, on top of `InputCtl`

`kind = "number"` now filters characters, which stops "hello" reaching an
amount field and is not the same thing as a numeric input. What is missing is
min/max/step, clamping on commit, arrow-key increment, and drag-on-label. Once
it exists the pptx properties panel's hand-drawn `− +` steppers become this,
which is the fifth thing reported about that panel.

Gate: the oracle is `<input type=number>` — the browser has opinions about
what `step` does at the ends and how a partial value commits, and those are
measurable.

**Done, against a different reference — and the difference is the point.**
`NumberCtl.rgr` is measured against `@base-ui/react/number-field`
(`conformance/oracle/numberfield.json`, 58 assertions in
`numberfield_check.mjs`), not against `<input type=number>`. The swap is not a
convenience: shadcn's `components/base/…` registry IS Base UI, so that is the
component a shadcn-family number input actually wraps — and the two references
**disagree about the most basic question in the component**. A native
`<input type=number>` is a `spinbutton` with `aria-valuenow`, `aria-valuemin`
and `aria-valuemax`; Base UI publishes *none* of those. It renders
`type="text"` with `inputmode="numeric"` and `aria-roledescription="Number
field"`, which is what a person on a phone actually wants and what WAI-ARIA's
spinbutton pattern would have talked us out of.

Four more things the capture settled that neither guessing nor the native
input would have given:

- the large step is on **Shift+Arrow**, not PageUp — PageUp and PageDown do
  nothing at all, measured on three fields including one with an explicit
  `largeStep`;
- the default large step is **10, absolute** — with `step: 0.25`, Shift+Up
  goes 0 → 10, not 0 → 2.5;
- the minus key is **rejected when the range holds no negative**, so `-99`
  typed into a `min: 0` field leaves `99` and clamps to the max;
- typed text is reconciled **on blur**, and blur also *formats*: `12abc34`
  reads `1234` while focused and `1,234` once focus leaves.

### P3 — `Track2DCtl`, the primitive that does not exist

A value pair on an area: press, drag, arrow keys, page keys, clamped to the
box, reporting a fraction in each axis. Shares its shape with `SliderCtl`
deliberately, so the two read alike.

No browser oracle — there is no HTML 2D input. Its correctness is arithmetic
and it must be asserted as arithmetic, not dressed up as measured.

### P4 — `ColorCtl`

2D track + hue track + alpha track + hex `InputCtl` + swatch set. The colour
maths underneath is already measured against the browser and already found
three bugs doing it — truncated channels, `#RGBA` not parsing, and the wheel's
seams off by one.

Still needed: `rgbToHsv`, which has **no browser oracle** because CSS has no
HSV notation. Asserted by round-trip identity and anchor values, and labelled
as arithmetic.

### P4b — `CalendarCtl` — **done**

Not on the original list, because Radix has no calendar and the inventory
therefore could not see the hole. shadcn's Calendar is `react-day-picker` with
a class map over it, so that is the oracle, and the whole point of an oracle is
that it contradicts you: three of the rules here are not what a careful person
would write.

- Home and End move within the displayed **week**, not the month. From Friday
  the 1st, Home is the previous month's 26th and the caption follows.
- PageUp and PageDown carry the day number and clamp it to the target month's
  length. The 31st of May pages up to the 30th of April.
- The tab stop at rest is **today**, not the 1st.
- A disabled day **stops** an arrow key rather than being stepped over.
- `mode="single"` **toggles**: choosing the chosen day clears it.

Two behaviours are recorded as divergences rather than copied, and the parity
counter scores them as divergences rather than as passes:

- The reference's roving tabindex follows the first click but not the second,
  and jumps to the 1st of the new month when focus crosses a boundary. Under
  WAI-ARIA's grid pattern the tabbable cell is the one that will receive focus;
  here it demonstrably is not. Ours stays with focus.
- The reference emits no `aria-selected` at all — it appends ", selected" to
  the day's label instead, and prefixes "Today, ". Both affixes are copied
  exactly, and `aria-selected` is added on top.

Gates: `ui:calendar:test` (125 assertions, offline, seven mutations tried and
all seven caught), `ui:calendar:check` (108/108 against the library's own
recorded answers, plus the two divergences), `ui:calendar:demo` (the drawn
half), and a state in `ui:demo:a11y` so axe sees the grid.

The date arithmetic is `UiDate.rgr` and not `datagrid/src/DateSerial.rgr`:
that one deliberately carries Excel's 1900 leap-year bug, and a calendar you
pick a date in must not have a phantom day in it. Noted there as a refactor to
do if a third caller ever appears.

### P1b — the pointer half — **done**

Feedback, verified against the code: the pointer half of the text field had
**no conformance spec at all**, and that is why it was the half that got
written and never wired. Nine specs drive the keyboard against a real
`<input>`; nothing drove a click.

So it was measured first — `conformance/oracle/pointer.json`, from a real
`<input>` over `"alpha  beta,gamma delta"` — and three things came back that
were not what the code did:

- **A click snaps to the nearer character boundary.** The first probe clicked
  exact midpoints and got `3→4, 5→6, 6→6, 12→12` back, which reads as a rule
  and is not one: the midpoint is the tie. Re-measured at a quarter and three
  quarters across each glyph, the rule is clean and unanimous.
- **Word motion stops at punctuation.** Ctrl+ArrowRight from 0 stops at
  5, 11, 12, 17, 23 — before the comma, then across it alone. `isSpaceAt`
  made `"beta,gamma"` one word and landed on 17. The nine keyboard specs all
  use `"alpha  beta gamma"`, which has no punctuation in it, so a corpus
  could not find a rule it contained no instance of.
- **A double-click takes the run of one character CLASS**, not "a word":
  the comma alone in `"beta,gamma"`, and the whole run of spaces on a space.

`InputCtl` now classifies into whitespace / word / punctuation, and both
Ctrl+Arrow and double-click read that one rule. `ui:pointer:check` scores
26/26 against the capture.

Three defects surfaced in the wiring, all of the same shape — something that
worked in isolation and was never connected:

1. **`main.js` dropped the coordinate.** `press: (id) => form.press(id)`, under
   a comment that said "the reason the press carries an x". `FormDemo.pressAt`
   worked, `form-check.mjs` called it directly and passed. A check that calls
   the API cannot see that nothing calls the API.
2. **Clicking a field's own letters did nothing.** The hit lands on the glyph
   run, `fm-name-text`, not the box — so only the empty part of the box to the
   right of the text ever focused a field. Exactly backwards, and invisible in
   a screenshot. Hits now resolve to the owning field by containment.
3. **The box inset was the literal `10.0`, in three places** — the controller,
   the demo and the round-trip test — while the real inset is 11 (1px border +
   10px padding). All three agreed with each other and none with the
   stylesheet, so the caret sat a pixel off the pointer and the test approved.
   One `InputCtl.indexAtPageX` now reads the resolved border and padding.

Also: `EVGA11yNode` never carried a text field's VALUE. The tree said "Full
name, text box" and stopped; the DOM mirror asked for `node.value` and the
producer never filled it. `a11yValue` now flows from the element through
`EVGA11yFromTree`, empty for a password, as a browser does.

The gate for all of it is `page-check.mjs`, which clicks the real canvas in a
real browser and types — because that is the only place the three wiring
defects were visible.

Still not wired, and not pretended otherwise: **Shift+click** is implemented
and reachable but has no end-to-end gate, and **triple-click** is not bound.

### P2 — the web text bridge — **done**

The architectural change, and the one that makes the rest cheap: `InputCtl`
stops being a thing that handles keys and becomes an editor's **state model**,
around which the platform opens its own text-input session.

Measured first, in `conformance/oracle/textinput.json`, from a real `<input>`
driven through the DevTools protocol — IME composition included, so the events
are the ones a Japanese keyboard produces rather than a simulation:

- **`beforeinput` carries the OLD value, `input` the new one.** So the bridge
  is a plain mirror — read `value`, `selectionStart`, `selectionEnd` on
  `input` — and never diffs or replays an `inputType`. That single fact is the
  whole design.
- **Composition is readable.** At `beforeinput:insertCompositionText` the
  selection is the range about to be replaced and `data` is the replacement,
  so the composing range is `selectionStart .. selectionStart + data.length`.
  That is the one thing a hidden proxy cannot draw for us.
- **Copy, cut, paste and undo need no code**: they arrive as
  `insertFromPaste`, `deleteByCut`, `historyUndo`, `historyRedo`.
- **One Backspace removes 1 code unit from "abc", 2 from an emoji, 4 from a
  flag and 11 from a ZWJ family** — while ArrowLeft over a decomposed "é"
  skips 2 where Backspace removes 1. Chromium's own delete and its own caret
  motion disagree about that cluster. A hand-written grapheme walker would
  have to reproduce an inconsistency, not a standard.

`gallery/evg/gl/evg-textinput.js` puts a transparent, `pointer-events: none`,
`aria-hidden` `<input>` over the focused field. `InputCtl.applyEdit(value,
selStart, selEnd)` takes the whole state at once. Gated end to end in
`page-check.mjs`: paste, undo, a ZWJ family, a live IME composition, Tab
staying with the application, a password proxy, and the number field still
refusing letters.

Two things this got wrong on the way, both kept as notes rather than quietly
fixed:

- The proxy sat **on top of** the field and swallowed the pointer, so the
  I-beam stopped appearing the moment a field was focused. `pointer-events:
  none`.
- The page focuses its canvas on every `pointerdown`, which ended the session
  on the second click of a double-click — the word was selected in Ranger, the
  proxy still read a collapsed caret, and the keystroke went round the old
  path and inserted instead of replacing. `sync` now takes the focus back.

And one regression it introduced and then closed: routing edits through
`applyEdit` bypassed `insertText`, which is where the number field's filter
lives, so Amount took letters again. The filter moved into `applyEdit`, and
the corrected value is pushed back into the session — only when it differs,
because writing to the proxy's `value` disturbs the browser's undo history.

`ui:demo:page` now runs in CI. It did not before, which is precisely why the
P1b wiring defects survived: the only gate that could see them never ran.

Undo GRANULARITY is deliberately not asserted — the oracle coalesced "XYZ"
into one undo and the page undoes per keystroke. Coalescing is the browser's
business; the gate asserts that undo reverses typing and gets back to the
start, which is the claim being made.

### P3 — Android text bridge — **blocked, and not faked**

There is nothing to attach it to. Searched the whole repository: no
`InputConnection`, no `EditText`, no `showSoftInput`, no `InputMethodManager`
anywhere; no native host consumes `InputCtl` or `UiHost`; and no
`DashboardView` exists under that name. The Android EVG host that does exist
is `gallery/pptx/android/` — a pptx viewer with gestures, commands and a
handful of named keys, with no text entry at all.

An `InputConnection` for a host that renders no text field would be a bridge
to nowhere, and untestable here besides: there is no Android CI in this repo,
so it would be Kotlin nothing runs. Left blocked on a host with a field,
rather than written and called done.

### P4 — Unicode: half solved, half measured — **partly done**

The WEB half fell out of P2: the browser owns grapheme deletion, and the gate
proves it (one Backspace over a ZWJ family removes eleven code units).

The other half was an untested claim in `InputCtl` — that a C++ backend counts
bytes — and it is now measured. `ui:offset:check` compiles one probe to both
backends and diffs them:

| string | JS `strlen` | C++ `strlen` |
|---|---|---|
| `abc` | 3 | 3 |
| `héllo` | 5 | **6** |
| `aä` | 2 | **3** |
| `a🙂b` | 4 | **6** |

`charAt` returns UTF-16 code units on JS (surrogate halves included) and raw
UTF-8 bytes on C++. The expectations in the gate are computed from the
definitions — `s.length` and `Buffer.byteLength` — so there is no transcribed
table to drift.

The divergence bites at exactly two seams, which is narrower and more useful
than "non-ASCII breaks": `selStart`/`selEnd` are pinned to UTF-16 by the DOM,
and `caretXAt(i)` measures `substring(0, i)`, which on C++ can cut a
multi-byte character in half. A conversion layer is deliberately NOT written:
it would be untested code for a host that does not exist. The gate is there so
that the day one does, this is a known quantity.

### P5 — input semantics and a11y — **done**

Scoped by measurement first, and it was smaller and stranger than the report
said. Three of the four pieces were already there in some form:

- **`pressed` was wired end to end and simply unused.** The node had it, it
  serialised, `EVGElement.a11yPressed` existed and `EVGA11yFromTree` copied
  it — and `FormDemo` spelled the state into the button's NAME instead, under
  a comment saying "EVGElement has no aria-pressed to set from a demo-built
  tree". That was true once and stopped being true without the comment
  noticing. A recorded limit nobody rechecks is worse than no note at all.
- **`readOnly` was a BOOLEAN on the element path** where the controller path
  uses a three-state string — so it could not express the distinction the
  `input_required` spec was written to record: absent and "false" are
  different claims.
- **`required` and `invalid` were genuinely absent**, so the invoice form's
  red ring and its "That address is missing an @." reached a person and
  reached nobody else.

All three now use the DOM's own three states through element, node,
`fromTree`, `toJson` and the DOM mirror. Two bugs surfaced on the way:

- `setAttr(el, "aria-readonly", node.readonly ? "true" : null)` was correct
  while the field was a boolean and became wrong the moment it became a
  string — `"false"` is truthy, so a field that had been asked and answered
  *no* would have been mirrored as *yes*. Caused by this change, caught by
  the gate written before it.
- `aria-pressed` was only ever derived from `checked`, so a control that set
  `pressed` honestly got nothing out of the mirror.

And one bug from P1b that only this gate could find: `fieldOwning` mapped
*every* descendant of a field's box to the field, so clicking the password's
eye — a button living inside the password's box — focused the field instead
of toggling it. A descendant with a role of its own is its own target.

Gates: `ui:semantics:check` (11 assertions on the tree) and six more in
`page-check.mjs` reading the real mirror attributes a screen reader walks,
including the toggle flipping when clicked.

### P5c — the bench: every field on every page — **done**

The complaint that prompted it was that the fields on the pages do not behave
like the fields on a shadcn page, while every suite was green. Both true. The
controller is measured by id and headless; the page gate clicks one field on
one form. Nothing had ever clicked the other fifteen.

`npm run ui:input:bench` discovers every `textbox` from each page's
accessibility tree, runs twenty scenarios on it with a real pointer and a real
keyboard — caret placement, drag, word motion, clipboard, undo, IME, Tab, the
mirror, masking — and runs the same gestures against a native `<input>` seeded
with the same value, kind, attributes and font. The matrix, the shadcn/reui
variant catalogue and the first run's findings are in
[`demo/INPUT_BENCH.md`](demo/INPUT_BENCH.md).

Five wiring defects on the first run, all of the P1b shape — right in the
controller, wrong on the page: the number filter dropped `1250.00`'s point the
moment the field was focused; a click after a `€` prefix or a leading icon
landed characters to the right of the pointer; the readonly field refused the
pointer as well as the keyboard; one shared proxy `<input>` let Ctrl+Z reach
the previous field's history; and the password's eye, a child of a textbox,
was mirrored inside a void `<input>` and reached no reader. Four fields stay
red honestly: the calendar's date box, the controls page's quantity, and the
dialog's two inputs are drawn as textboxes and open no editing session.

Textarea, date picker and OTP are in the catalogue as MISSING. That is the
list for P5b and Phase 4, and the bench is where they will be scored.

### P5b — `PasswordCtl` and `OtpCtl`

The two remaining Radix components. `PasswordCtl` is `InputCtl` plus a reveal
toggle whose position does not depend on the value — the demo has now done
this by hand twice and should stop. `OtpCtl` is split code entry: N boxes, one
value, paste spreading across them, backspace walking back.

### P6 — the editor consumes them

The pptx properties panel stops drawing steppers and swatch rows by hand. This
is the point of the whole exercise: a palette nobody has built an application
out of has unknown holes, and these six are the holes that building one found.

## What this does not include

- **Multiline.** `InputCtl` is single-line — `scrollX`, one `indexAtX`. The
  editor's shape text is a different code path with its own editing, and
  "cannot move the caret up" was reported against that, not against this. It
  wants its own plan.
- **Kerning.** The advance table sums single characters; a browser kerns pairs,
  worst case 3.9px on all-caps. Bounded, asserted, and not worth a shaping
  engine yet.
- **IME and composition.** Nothing here handles it. Worth saying out loud
  rather than discovering it with a keyboard that needs it.
