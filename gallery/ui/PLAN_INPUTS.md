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
