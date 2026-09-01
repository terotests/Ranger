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

### P5 — `PasswordCtl` and `OtpCtl`

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
