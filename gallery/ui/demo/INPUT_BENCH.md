# The input bench: every text field on every page, against the browser

```bash
npm run ui:input:bench            # score the pages against input-bench-baseline.json
npm run ui:input:bench:record     # rewrite the baseline after a change
node gallery/ui/demo/input-bench.mjs --only=fm-amount,fm-invoice --scenario=caret,drag --verbose
```

The full run takes about twenty minutes: sixteen fields, twenty scenarios,
each starting from a rebuilt demo, each step waited on for the page to paint.
`--only` and `--scenario` narrow it while something is being fixed.

## Why a second instrument

The fields on these pages were reported as not behaving like the fields on a
shadcn page — and every suite was green. That is not a contradiction, it is a
gap in what was being measured:

- `ui:conformance` drives `InputCtl` against a real `<input>` through nine
  specs and passes. It drives the **controller**, by id, headless. It cannot
  see the page that wires the controller up.
- `ui:demo:page` loads the real page in a real browser. It clicks one field on
  one form, types into it, and checks paste, undo, IME and Tab **there**. The
  other fifteen fields on the other four pages were never clicked by anything.

A component that is measured in isolation and wired by hand on every page is
only as good as the page it is on, and there was nothing between "the
controller is right" and "a person says it is wrong".

## What it does

**Rows are discovered, not listed.** The bench loads each demo, reads its
accessibility tree, and takes every node with `role="textbox"`. A field added
to a page is benchmarked without anyone remembering to add it here; a field
that stops publishing itself as a textbox disappears from the matrix, and the
baseline says so.

**Columns are scenarios, and each runs twice.** Once on the drawn field with a
real pointer and a real keyboard on the demo page; once on a bare native
`<input>` on a page of its own, given the field's value, kind, `readonly`,
`maxlength`, placeholder, font and box, and the identical gestures. The click
offsets are measured from where the field's **text** begins — read off the
display list, so a `€` prefix or a leading icon moves the origin the same way
on both sides — and are whole pixels, because a real pointer never reports a
fraction (measured: a backward drag from 56.72 to 22.06 collapses to a caret
in Chromium, and the same drag from 57 to 22 selects `[3,9]`).

After every step both sides report `value`, `selStart`, `selEnd` and
`focused`. A cell is green only if every observation agrees. That is the
conformance harness's rule with the conformance harness's oracle, run through
the page instead of round it.

| column | what a shadcn field does, and this one has to |
|---|---|
| `focus` | a click focuses it |
| `caret` | a click puts the caret at the nearer character boundary — inside six glyphs at 30% and 70% of their advance, past the text's end, and in the padding before it |
| `type` | printable keys insert at the caret (digits into a digits field) |
| `arrow` | Home, End, Arrow, Shift+Arrow, Shift+Home |
| `word` | Ctrl+Arrow and Ctrl+Shift+Arrow move by a word, punctuation included |
| `delet` | Backspace behind, Delete ahead, either over a selection, Ctrl+A then Delete |
| `dblcl` | a double-click takes the run under the pointer |
| `drag` | a drag selects, backwards too, and keeps selecting past the box's edge |
| `shift` | Shift+click extends from the anchor |
| `clipb` | Ctrl+C, Ctrl+V, Ctrl+X, with the platform's clipboard |
| `undo` | Ctrl+Z reverses typing back to where the field started (granularity is the browser's and is not asserted) |
| `maxle` | the value never grows past `maxlength` |
| `graph` | one Backspace removes a whole ZWJ family; ArrowLeft over a decomposed é steps 2 where Backspace removes 1 |
| `ime` | a live composition through the DevTools protocol, then its commit |

And seven things a native `<input>` has no answer for, or answers where the
comparison cannot see, asserted on the page alone:

| column | what is asserted |
|---|---|
| `proxy` | a focused field hands the keyboard to a real hidden `<input>` of the right `type` and `maxlength`; the cursor over the text is the I-beam |
| `ring` | a focused field is drawn as one: the box's border command changes colour when the field takes focus |
| `place` | when the field is emptied the placeholder is drawn, the value is `""` and the mirror says so; when a key is typed the placeholder is gone |
| `mask` | a password draws one bullet per character and never the text; the tree carries no value; the eye is a `button` with `aria-pressed`, pressing it reveals the text and pressing again masks it |
| `mirro` | the mirror is a native `<input>` with the field's label, value, `aria-required`, `aria-invalid`, `aria-readonly` and `aria-description`, and its value agrees with the model's |
| `tab` | Tab leaves for the next stop and the editing session follows it (or ends, if the stop is not a field); Shift+Tab comes back |
| `kind` | `12ab3` typed into a digits field leaves `123`; into a text field, `12ab3` |

A cell reads `–` when the scenario does not apply (IME into a digits field,
the mask column on a text field), and `?` when the page publishes no selection
to compare against. Neither is an exemption: `?` is a finding about the page.

## The denominator

[`input-catalogue.json`](input-catalogue.json) lists the variants a
shadcn-family input page shows — reui.io's Input and its neighbours, shadcn's
Input, Textarea, Date Picker and Input OTP — and which field on these pages
stands for each. The bench prints the list with each variant's fields and
their scores, and prints **MISSING** where there is no field. reui.io is
refused by this environment's egress proxy, so the list is from the family's
published demos rather than a fresh read of that page: reviewable data, not a
measurement, and the place to add a variant when one turns up.

Missing, as of this writing, and each for a stated reason in the file: a
disabled text field, an input group, a clearable input, sizes, a file input,
**every textarea variant**, the date picker in a popover, a typed date, a date
and time, a time picker, a segmented date field, **OTP**, and a tag input.
The textarea and the date picker are the two the request named, and the
honest answer is that neither exists as a component yet: `InputCtl` is
single-line, and the calendar fills a field it does not let you type into.
Writing them is the next work; this file is where they will be scored.

## What the first run found

Sixteen fields on five pages, twenty scenarios, and a matrix that split
cleanly into three kinds of row.

**Rows that were green already** — `fm-name`, `fm-email`, `fm-secret`,
`fm-search`, `pf-name`, `pf-birth`, `pf-available`, `pf-company`, `pf-phone`.
Every gesture agrees with the browser, the password masks and reveals, the
mirror says the right things, Tab walks. That is nine of sixteen, and it is
the part the controller's own specs had already earned.

**Rows that were red for a reason in the wiring**, all fixed, each in the
place the fault was:

- **`fm-amount` lost its decimal point the moment the form appeared.**
  `filterText` checked "does the value already hold a separator" against the
  field's *current* value while filtering the *new* one — right for a typed
  character, wrong for a session that hands over the whole string. Focusing
  the field made the proxy echo `1250.00` back, the filter saw the dot it
  already had and refused the one it was given, and the amount read `125000`
  with no key pressed. The filter now asks the string it is building.
- **A click into `fm-amount` or `pf-dismissal` landed characters to the
  right of the pointer.** The `€` prefix and the clock icon are laid out
  before the text run, the demos position the caret and the selection band
  from that lead — and `indexAtPageX` did not, mapping the pointer from the
  box's padding edge. It now reads the origin from the run the painter drew.
- **The readonly `fm-invoice` refused the pointer.** `input_readonly`
  measured the keyboard — a readonly field has no caret for Home or an arrow
  to move — and `moveTo` refused everything on the strength of it. Measured
  with a pointer: a click at 44px puts the caret at 7, a drag selects
  `[4,10]`, Ctrl+A selects all, and Home afterwards still leaves 7. So the
  pointer has its own door, `placeCaret`, and `selectAll` no longer asks.
- **Ctrl+Z could reach into the previous field's history.** One hidden proxy
  `<input>` served every field, and Chromium keeps an input's undo stack
  across a programmatic `value` write made while it is not focused. The bench
  saw it as the third Ctrl+Z in Full Name — after two had taken back `zz` —
  jumping the caret to 0; a fourth would have written another field's text
  into this one. Each session now gets a fresh proxy element.
- **A double-click on `1250.00` or `17.30` took half the number.** The
  class-run rule that the pointer oracle measured on `"beta,gamma"` breaks at
  punctuation, and Chromium's double-click does too — except between digits,
  where a `.` or `,` is UAX #29's MidNum and does not break. Ctrl+Arrow in
  the same browser still stops at the point, so the join is in
  `selectWordAt` alone. Letters are not joined: `ada.example.com`
  double-clicks as `ada`, measured.
- **Ctrl+A did nothing in the readonly field.** The session reported the
  selection and the demos' `applyEdit` refused the whole report because the
  field was readonly. A readonly `<input>` selects; it does not change.
  `InputCtl.applyEdit` now keeps the selection and drops the value.
- **The password's eye was invisible to a screen reader.** The mirror renders
  a textbox as a native `<input>`, a void element, and the eye's `<button>`
  was appended inside it — rendered nowhere, 0×0, out of the accessibility
  tree. `ui:demo:page` had been failing on exactly this row. Children of a
  textbox now go to the nearest ancestor that can hold them, positioned
  relative to it.

**Rows that are red because the field is a picture.** `cd-box` on the
calendar, `cx-num` on the controls page, `dlg-input-name` and
`dlg-input-username` in the dialog: each is published as a textbox, and none
opens an editing session. A click does not focus, typing goes nowhere, and
there is no selection to report. `cx-num` is the closest to real — its
`NumberCtl` is measured against Base UI and its `−`/`+` and arrow keys work —
but a person who clicks in it and types is told nothing. These stay red in
the baseline. They are the shape of the complaint, and the bench is the
instrument that shows it per field rather than as a feeling.

**A second round, from a person at the page.** Tab from Find a customer
"did nothing": it moved the focus to the readonly Invoice number, which draws
no caret, and `form.css` had no `:focus` rule for anything — so a Tab into it,
and every Tab after it through the radios and the buttons, changed the model
and changed nothing on screen. The arrows on the radios did nothing because
no key was routed to `RadioGroupCtl`. The profile page and the calendar had
the same omission: the calendar's arrows moved the focused day, as the hint
under the grid says, and no rule drew the day they had reached. All three
sheets now draw focus, the radios take the arrows and Space, and the `ring`
column above is the bench's way of never missing it again: a field whose
border does not change when it takes focus is red.

## The score, first run and now

| | cells agree | cells diverge | observation parity |
|---|---|---|---|
| first run, before any fix | 158 | 69 | 3074 / 3864 (79.6%) |
| recorded baseline, after the fixes above | 202 | 28 | 3555 / 4064 (87.5%) |
| with the `ring` column, after the focus work | 217 | 29 | 3555 / 4064 (87.5%) |

The 29 that remain are the four fields that open no editing session, seven
scenarios each, plus the calendar's date box with no focus ring. The observation count rose because the fixes made the
`placeholder` column applicable to the fields that publish one.

## The baseline

Three of the twenty columns needed a second look at the *bench* rather than
the page, and each is written into the scenario that needed it: click points
are chosen inside glyphs at least 6px wide, at 30% and 70% of the advance,
because a fraction of the text width lands on a boundary's midpoint by chance
and the two sides round a tie apart; pointer coordinates are whole pixels,
because Chromium collapses a backward drag between fractional coordinates;
and no scenario presses inside an existing selection, because that starts a
text drag rather than a click.

`input-bench-baseline.json` records every cell. A cell that goes red fails the
run. A cell that goes **green also fails the run** until the file is
re-recorded, for the same reason `layout-baseline.json` works that way: the
file must say what the pages do, not what they did when someone last looked.

## What the bench does not claim

- **Pixel positions.** It never compares a caret x. Where a click LANDS in the
  string is compared, and that is independent of how the bar is drawn.
- **Undo granularity.** The browser coalesces differently for an input whose
  value has been written to; both sides are undone until they stop changing
  and the end states are compared.
- **Drag-and-drop of selected text.** A press inside a selection starts a text
  drag in the browser; the scenarios collapse the selection between drags
  rather than assert a behaviour this side does not have.
- **Textarea, date picker, OTP.** Nothing here measures a component that does
  not exist; the catalogue says they are missing and the matrix will grow a
  row the day one publishes itself as a textbox.
