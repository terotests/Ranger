# EVG Layout Engine Known Issues

## Issue #1: Text/Label Elements Don't Auto-Size Width Based on Content

**Status:** Resolved  
**Severity:** Medium  
**Found:** December 19, 2025  
**Resolved:** August 14, 2026  
**Component:** EVGLayout.rgr

### Resolution

Text leaf nodes shrink-wrap to their measured content in `EVGLayout.layoutElement`
and `estimateChildWidth`, so a `<Label>` no longer claims the full parent width
in a `flexDirection="row"`.

Two follow-ups were needed before the fix could be trusted, both landed with the
font-correctness work:

- The measurement passed a hardcoded `"Helvetica"` for every string, so the
  shrink-wrapped width was right in shape but wrong in size for any other face.
  It now measures with the element's own `fontFamily`.
- The measurement itself was a `fontSize * 0.55` guess. Layout now measures with
  the same TTF the output embeds, checked against a browser in
  `gallery/pdf_writer/test/font_parity.js`.

Covered by `evg_test`: "text label shrink-wraps (not full width)",
"sibling stays on the same row", "sibling sits right after the label", and
"layout measured with the element's family". The original report below is kept
for history and no longer describes current behavior.

### Description

Text and Label elements in the EVG layout engine do not calculate their width based on text content. Instead, they default to taking the full parent width, which causes layout problems when using `flexDirection="row"`.

### Problem

When laying out elements horizontally with `flexDirection="row"`, text elements without an explicit width will:

1. Take the full available parent width
2. Push subsequent elements to the next row
3. Ignore their actual text content width

This makes it impossible to have inline layouts like:

```tsx
<View flexDirection="row">
  <Label>Some text</Label> {/* Takes full width */}
  <Image src="icon.jpg" /> {/* Wraps to next line */}
</View>
```

### Root Cause

In `EVGLayout.rgr`, the `layoutElement` function (lines 150-172) only calculates **height** for text elements based on text wrapping and line count. It does not calculate **width** based on text content.

Additionally, in `layoutChildren` (lines 240-245), when an element has:

- No explicit width (`width.isSet == false`)
- No flex value (`flex == 0`)

The layout engine treats it as "taking full width":

```ranger
; No width and no flex - treat as taking full width (will wrap)
fixedWidth = fixedWidth + innerWidth + c.box.marginLeftPx + c.box.marginRightPx
```

This assumption works for block-level elements but fails for inline text.

### Current Workaround

## Issue #2: JSX Tokenizer Creates Separate Tokens for Words

**Status:** Resolved (December 19, 2025)  
**Severity:** High  
**Component:** ts_parser_simple.rgr, ComponentEngine.rgr

### Description

The JSX text tokenizer was splitting multi-word text content into separate tokens (one per word), losing whitespace between words. This caused text like "Showcasing custom fonts" to render as "Showcasingcustomfonts".

### Root Cause

The TypeScript parser's lexer tokenizes based on whitespace, creating separate tokens for each word. When the JSX parser processes text content, each word becomes a separate `JSXText` node without the original spacing.

The `ComponentEngine.evaluateTextContent` function was normalizing and trimming each individual token before concatenating, which removed the information about word boundaries.

### Solution

Modified `ComponentEngine.evaluateTextContent` to:

1. Accumulate all JSXText tokens with spaces between them (since they were originally separated by whitespace)
2. Concatenate raw token values first: `result = result + " " + rawText`
3. Apply normalization and trimming to the **complete** accumulated text
4. This preserves word boundaries while still handling newlines and extra whitespace correctly

**Fixed in:** ComponentEngine.rgr, `evaluateTextContent` function (lines 738-780)

---

## Issue #3: SVG Path Elements Not Implemented

**Status:** Open  
**Severity:** Medium  
**Found:** December 19, 2025 (via test_features.tsx)  
**Component:** ComponentEngine.rgr, EVGElement.rgr, EVGPDFRenderer.rgr

### Description

SVG `<Path>` elements are not implemented in the EVG component system. When used in TSX files, they are treated as unknown components and rendered as empty `<div>` elements.

### Problem

When attempting to use SVG paths for icons or vector graphics:

```tsx
<Path
  d="M10,6.5c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S12.2,6.5,10,6.5"
  width="80"
  height="80"
  viewBox="0 0 20 20"
  backgroundColor="#27ae60"
/>
```

The system outputs:

- **Warning:** "Unknown component: Path"
- Renders as: `<div>` with no visual output

### Impact

- Cannot render vector icons or SVG graphics
- Must use raster images instead (PNG/JPG)
- Limits design flexibility for scalable icons and shapes

### Required Implementation

1. **Add Path to evg_types.tsx:**

   ```tsx
   export function Path(props: PathProps): JSX.Element;

   interface PathProps extends EVGStyle {
     d: string; // SVG path data
     svgPath?: string; // Alias for d
     viewBox?: string; // ViewBox for scaling
     fill?: Color; // Fill color
     stroke?: Color; // Stroke color
     strokeWidth?: number; // Stroke width
   }
   ```

2. **Update ComponentEngine.rgr:** Add "path" to known element types (currently recognizes: View, Label, Image, Section, Page, Print)

3. **Implement path rendering in EVGPDFRenderer.rgr:** Parse SVG path commands (M, L, C, Z, etc.) and render using PDF drawing primitives

4. **Add path rendering to EVGElement.rgr:** Store path data (d attribute, viewBox) as element properties

### Workaround

Use raster image formats (PNG, JPG) for icons and graphics instead of vector SVG paths.

---

Explicitly set a width percentage or fixed width on text elements in row layouts:

```tsx
<View flexDirection="row">
  <Label width="80%">Some text</Label>
  <Image src="icon.jpg" width={20} height={20} />
</View>
```

Or use flex values:

```tsx
<View flexDirection="row">
  <Label flex={1}>Some text</Label>
  <Image src="icon.jpg" width={20} height={20} />
</View>
```

### Proper Solution

Text/Label elements should calculate their intrinsic width based on:

1. Text content length
2. Font size and family
3. Font metrics from the text measurer

The layout algorithm should:

1. Check if element is a text/label type
2. If no explicit width is set, measure the text content
3. Use the measured width instead of defaulting to parent width
4. Still respect `maxWidth` constraints for wrapping

### Suggested Code Changes

In `EVGLayout.rgr`, around line 290-300, add text width measurement:

```ranger
; Calculate child dimensions
def childWidth:double innerWidth
if child.width.isSet {
    childWidth = child.width.pixels
} {
    ; NEW: For text elements, measure content width
    if ((child.tagName == "text") || (child.tagName == "span")) {
        def fontSize:double child.inheritedFontSize
        if child.fontSize.isSet {
            fontSize = child.fontSize.pixels
        }
        if (fontSize <= 0.0) {
            fontSize = 14.0
        }
        def fontFamily:string child.inheritedFontFamily
        childWidth = (measurer.measureTextWidth(child.textContent fontFamily fontSize))
        ; Add some padding for safety
        childWidth = childWidth + 4.0
    } {
        ; Check if this child has a calculated flex width
        if (child.calculatedFlexWidth > 0.0) {
            childWidth = child.calculatedFlexWidth
        }
    }
}
```

### Impact

- **High**: Affects all horizontal layouts with text
- **Workaround Available**: Yes (explicit width or flex)
- **Breaking Change**: Potentially, as existing layouts may rely on current behavior

### Related Code

- `gallery/evg/EVGLayout.rgr` - Lines 200-400 (layoutChildren function)
- `gallery/evg/EVGTextMeasurer.rgr` - Text measurement utilities
- `gallery/pdf_writer/FontManager.rgr` - Font metrics for accurate measurement

### Test Case

See `gallery/pdf_writer/components/ListItem.tsx` for a component that demonstrates this issue.

### Notes

- The current behavior may be intentional for some use cases (e.g., full-width text blocks)
- A proper fix should distinguish between "inline" and "block" text elements
- Consider adding a `display: inline` or similar property to control this behavior
- Text measurement requires access to font metrics (FontManager in PDF writer context)

---

## Issue #4: The scene binary's record width was agreed in advance, not published

**Status:** Resolved
**Severity:** High — every field after the first command read from the wrong offset
**Found:** August 30, 2026 (in CI, on master)
**Resolved:** August 30, 2026
**Component:** `EVGDisplayList.rgr`, `gallery/pptx/web/host/pptx-host.mjs`

### What happened

`EVGDisplayList` publishes a frame as three `Int32Array`s: one fixed-size record
per draw command, then the ring coordinates and the strings those records index
into. It is the fast path — the JSON one costs 1.5 MB of text a frame — and it
is POSITIONAL. Nothing in it says how wide a record is.

The record grew from 24 ints to 26 when `transform: rotate()` needed an origin
to turn about. `EVGDisplayList.stride()` was updated, and its comment even says
"read it through this function and never inline the number". The decoder on the
other side of the bridge had inlined it:

```js
export const SCENE_STRIDE = 24;   //  pptx-host.mjs
const b = i * SCENE_STRIDE;
```

So from the second command on, every field was read two ints early. Colours
became coordinates, coordinates became flags, and the frame was nonsense that
still *looked* like numbers. Nothing threw until a ring count read out of
somebody's colour reached `new Array(eCount)`:

```
RangeError: Invalid array length
    at decodeScene (pptx-host.mjs:104)
```

— in the WebAssembly parity job, which needs an Emscripten toolchain, runs late
in the deploy workflow, and points a hundred fields downstream of the mistake.

### Resolution

**The shape is derived from the bytes, not agreed in advance.** `cmds` is
allocated as exactly `count * stride`, so `sceneStride(bin)` recovers the number
the writer used by dividing. That answer cannot drift, and it needs no new
export — which matters, because three producers publish this frame by three
different routes (the Ranger engine, the Emscripten build and the Rust one) and
only one of them is in a position to export a constant.

What the decoder now names is the FLOOR: `SCENE_FIELDS_READ = 23`, the number
of fields it actually reads. A record wider than that is fine — the extra
fields are not its business — and one narrower throws with both numbers in the
message.

### Why it was not caught sooner

The claim that the two paths agree was written in a comment and checked
nowhere. `gallery/pptx/web/host/scene-binary-check.mjs` now asks the engine for
both the JSON and the binary, for every slide of every fixture, and compares
them field by field: 37 decks, 45 slides, 8,658 commands, no browser, no
toolchain, one second. It is in `scripts/run-gallery-editor-tests.sh` and runs
in CI *before* the WebAssembly build rather than after it.

Two other checks would also have caught this and neither was wired up: the
standalone smoke test (`npm run pptx:web:test`) fails outright, and the frame
is visibly empty in the playground. Both were reachable the whole time.

### The general lesson

A positional binary format needs its shape carried with it or derivable from
it. "Both sides know the layout" is not a property anything enforces, and the
failure mode is not a crash at the boundary — it is plausible-looking garbage
that surfaces somewhere unrecognisable.


---

## Issue #5: `backdrop-filter` sampled the page, not the element

**Status:** Resolved
**Severity:** Medium — a scrim showed the page bleeding through its own border
**Found:** August 30, 2026, while implementing it
**Resolved:** the same day
**Component:** `gallery/evg/gl/evg-webgl.js`

### What happened

The first implementation grew the copied region by the kernel's reach and
blurred that, on the reading that `backdrop-filter` samples past the element's
edge. The evidence for it was a flat grey behind a pane coming out flat to the
border, with no rim.

That is not evidence. **A uniform field is uniform under either rule** — edge
clamping and sampling-past give the same answer when there is nothing outside
worth sampling. The observation ruled out only a third possibility, that edge
samples read transparent and the border fades.

The case that decides is a feature that straddles the border. White page, black
stripe starting exactly at the pane's left edge:

```
x:      95  96  97  98  99 | 100 101 102 ...
browser 255 255 255 255 255|   0   0   0
```

No ramp at the border at all — while the same black/white boundary a hundred
pixels further in, inside the pane, gets the full smooth curve. Outside content
does not enter.

### Resolution

Copy exactly the element's box and let `CLAMP_TO_EDGE` do the rest, which is
the measured rule expressed in one place.

### The general lesson

Three checks passed against the wrong implementation, and all three were scenes
where the backdrop did not change across the element's border. A test that
cannot distinguish the two candidate rules is not weak evidence for one of
them; it is no evidence at all. Before trusting a case, ask what the WRONG
implementation would print — and if the answer is "the same thing", the case is
not about the question.

---

## Issue #6: a text run's reported width changes between the first frame and the rest

**Status:** open, pre-existing, cosmetic in the display list only.

Found while proving that moving `TreeDemo`'s rows onto component instances
changed nothing observable. It did not — but the display list on frame 7 is not
the display list on frame 1, and that is true with or without the change.

Two text commands in the tree demo differ between the first paint and any later
one:

```
frame 1  {"k":3,"x":105.14,"y":261,"w":58.1,  …,"text":"Jane Doe"}
frame 7  {"k":3,"x":105.57,"y":261,"w":340,   …,"text":"Jane Doe"}
```

`w` goes from the MEASURED run width (58.1) to the label's declared box width
(340), and `x` shifts by 0.43px. Only the deepest rows are affected — the ones
whose label sits after an indent spacer whose width is set on the element
rather than by the sheet.

Nothing on screen moves: `k:3` is a text draw and the painter positions the run
from `x` and the glyphs, not from `w`. So this is a display-list fidelity bug
rather than a rendering one, and it was invisible until something compared two
frames of the same state.

### Why it is recorded rather than fixed here

It is not the component work's to fix, and it was verified as pre-existing by
running the identical probe on both sides of that change — same two commands,
same numbers. Fixing it means understanding why a second layout pass over the
same tree resolves the label's width differently, which is `EVGLayout`'s
business and wants its own measurement.

### The general lesson

"Nothing changed" is only checkable if the thing you compare is stable to begin
with. A baseline captured on frame 1 and a candidate settled over six frames
are not the same experiment, and the first version of that comparison reported a
difference my change had not caused. Compare like with like, and when a
comparison fails, check the baseline before the change.

## Issue #7: shrink-to-fit text can wrap inside the box its own width produced

**Status:** Resolved (September 5, 2026)
**Severity:** Low (cosmetic; a label that fits is drawn on two lines)
**Found:** September 2, 2026
**Component:** `EVGLayout.rgr` / `EVGTextEngine.rgr`

### Resolution

`EVGTextEngine.breakLines` allows a line `EVGTextEngine.fitEpsilon()` — a
millionth of a pixel — over the width it is breaking into. The error a
shrink-wrap round trip introduces is about seven parts in a quadrillion, so
the tolerance is a hundred million times it and a millionth of the smallest
thing anyone can see: it cannot change a wrap a person asked for, and it can
only undo a round trip that should have been the identity.

Covered by `evg:textbox:check` — "the round trip a shrink-wrapped box makes",
which sweeps twenty-one strings across eight sizes, eight paddings and four
border widths, asserts that some of those round trips really do come back
short (or the check would be proving nothing), and that not one of the 5632
labels breaks inside its own box. Before the fix, 310 of them did.

The report below is kept for history.

### What happens

A text element with no stated width shrink-wraps: layout measures the run, adds
the padding and border, and that sum is the box. The line breaker then works
with the content width, which is that sum *minus* the same padding — and for
some strings the round trip does not land back on the number it started from,
so the breaker sees a width a fraction narrower than the text and breaks it.

Reproduced in `gallery/evg/web/responsive`, whose sidebar is six labels in a
column. Five sit on one line and `Display list` does not:

```
measure 'Display list' = 62.12453   'Text engine' = 67.93241
item 'Display list' w=86.12453 h=47.9     <- 24px padding, two lines
item 'Text engine'  w=91.93241 h=32.95    <- 24px padding, one line
```

Both boxes are exactly `measured + 24`. Both are therefore exactly on the
threshold. One wraps and the other does not, which is what says this is a
floating-point artifact of `(w + pad) - pad` and not a measurement disagreement:
the run measurement and the sum of the per-word measurements agree to the last
digit for both strings.

### Why it is recorded rather than fixed here

The fix belongs in the line breaker — a shrink-wrapped box should not be able to
break its own content, so the comparison there wants an epsilon (or the content
width wants to be carried alongside the box width rather than recomputed from
it). Either is a change to how every EVG document breaks lines, and it needs
its own measurement against the conformance oracles before it lands.

### Workaround

State a `min-width`, which takes the box off the threshold. The responsive
demo's `.nav-item` does exactly that, and says so.

## Issue #8: a flex row wrapped because of its own arithmetic

**Status:** Resolved
**Severity:** High (visible flicker while a window is resized)
**Found:** September 2, 2026
**Resolved:** September 2, 2026
**Component:** `EVGLayout.rgr`

### Resolution

The row-wrap test in `EVGLayout.layoutFlexChildren` compares the child's total
width against the space left on the line. It now allows a hundredth of a pixel
of overflow before it wraps. `gallery/evg/EVGFlexWrapTest.rgr`
(`npm run evg:flexwrap:test`) sweeps a 240px sidebar beside a `flex: 1` panel
across every width from 400 to 1800 in quarter-pixel steps and asserts the two
stay on one line — and, in the same file, that a row which genuinely does not
fit still wraps and that `flex-wrap: nowrap` still means nowrap. Without the
tolerance the first two of those five checks fail.

`gallery/evg/web/responsive` carries the same sweep for the page the defect was
found on.

### What happened

The commonest two-column layout there is:

```css
.body { display: flex; gap: 24px }   /* wrap allowed — EVG's default */
.side { width: 240px }
.main { flex: 1 }
```

`.main`'s width is computed **by the layout** out of the same line it is then
measured against: the flex pass takes the inner width, subtracts the sidebar and
the gap, and hands back the remainder. Adding those three back up is not
guaranteed to return the number they were subtracted from — in binary floating
point `(a - b - c) + b + c` can land one ulp above `a` — and a bare `>` then
reads the row as too wide for itself.

At a window width of 823px: `4vw` padding either side leaves an inner width of
757.16, the sidebar is 240, the gap 24, and `.main` came out 493.15999999999997.
The three sum to 757.1600000000001.

### Why it mattered more than one pixel

The failing widths are **scattered**, not a band. Of the 680 integer widths
between 821 and 1500, 127 wrapped — 823, 826, 836, 842, 845, 848, 851, 861 …
So dragging a window edge did not cross a threshold once; it dropped the content
below the sidebar and pulled it back up again every few pixels, which reads as a
flickering page rather than as a layout decision.

### The general lesson

Same root as issue #7, one stage further up: a number this engine **derived from
a bound** must not then be tested against that bound with an exact comparison.
Subtraction and addition do not cancel in floating point, so any "does what I
just computed still fit in what I computed it from" test needs a tolerance —
sized below what a painter can draw and above the error being cancelled.

## Issue #9: `line-height` written as a length was read as a multiplier

**Status:** Resolved (September 5, 2026)
**Severity:** High (text drawn far outside its own box)
**Found:** September 5, 2026 — reported as "vertical align sometimes goes to
the bottom", from a phone screenshot of a duration pill
**Component:** `EVGElement.rgr` / `EVGLayout.rgr` / `EVGDisplayList.rgr`

### What happened

CSS gives `line-height` three ways to be written and keeps them apart:
`normal` is the face's own line box, a NUMBER is that many times the font
size, and a LENGTH is itself. `EVGElement` held one double and put every
value through `to_double`, which stops at the first character it cannot use —
so `24px` came back `24` and was used as a multiplier.

Measured, on a 12px pill with `height: 20px` and `line-height: 16px`:

```
before   line box 192px   baseline 102.2   — the text drawn 82px BELOW the pill
after    line box  16px   baseline  14.2   — inside it
```

A line box twelve times too tall does not look twelve times too tall, because
the painter puts the baseline a half-leading below its top: it looks like a
line that has fallen to the bottom of everything near it, and only in the
places whose stylesheet writes a length. Which is what "sometimes" meant.

### The fix

`EVGElement.lineHeightUnit` holds a stated LENGTH as an `EVGUnit`, beside the
number; `EVGElement.lineBoxFor` is the single place that tells the three
apart, and both the layout (which reserves the height) and the display list
(which steps the lines) call it rather than each computing their own. A
percentage resolves against the element's own font size — CSS 2.1 §10.8.1,
the one percentage in the box model that does not look at the containing
block — `em` against its own size and `rem` against the root's.

Covered by `evg:textbox:check`, "line-height as a number, a length and a
percentage": eight cases across `normal`, unset, `1.5`, `150%`, `24px`,
`2em`, `1.5rem` and `0.8`.

## Issue #10: a text element drew its text on top of its own border

**Status:** Resolved (September 5, 2026)
**Severity:** Medium
**Found:** September 5, 2026, while measuring the above
**Component:** `EVGDisplayList.rgr` / `EVGLayout.rgr`

### What happened

`EVGDisplayList` started a text run at `x + paddingLeft`, `y + paddingTop` —
the border was missing from both. But the width it broke the run into is
`EVGBox.getInnerWidth`, which takes the border off, and the layout's own
`calculatedBaseline` is measured from the border edge and adds border AND
padding. So a text element with a border drew its text one border-width high
and one left, over its own top border, and measured against a width that
assumed it started inside it.

EVG disagreeing with EVG, in three places that each looked right alone. The
layout's wrap width had the mirror-image of the same slip: it subtracted the
paddings and not the border, so a bordered element counted its lines at one
width and was broken at another — the height reserved for a wrap the layout
imagined, and the painter drawing a different one.

Covered by `evg:textbox:check`, "a border on a text element", which asserts
the run starts inside both and — the one that matters — that the layout's
baseline and the painter's are the same point.

## Issue #11: a flex container's own text ignored `align-items`

**Status:** Resolved (September 5, 2026)
**Severity:** Medium (a pill's label sits against its top edge)
**Found:** September 5, 2026 — reported as "the minute still shows wrong",
from a phone screenshot of a `10min` pill
**Component:** `EVGLayout.rgr` / `EVGElement.rgr` / `EVGDisplayList.rgr`

### What happened

An element that is a flex container and carries text of its OWN does not lay
that text out as a block. CSS wraps it in an ANONYMOUS FLEX ITEM, and from
then on `align-items` and `justify-content` place it like any other item.

That is the pill idiom, and it is written that way everywhere:

```css
.pill { display: flex; align-items: center; height: 34px; padding: 0 12px }
```

with the label as the element's own text. EVG placed the line box at the top
of the content box and never consulted `align-items`. Measured on that pill,
the space above and below the digits:

```
before   above  3.0   below 20.2      the label against the top edge
after    above 11.4   below 11.8      where the same text in a child sits
```

`gallery/realtrainer`'s stylesheet has a hundred and nine rules with
`align-items: center`, so the shape is not rare.

### The fix

`EVGLayout` writes `EVGElement.textShiftY` once the box's height is final —
the offset is a share of the slack and there is no slack until then — and the
display list adds it to every line. `calculatedBaseline` includes it too, or
an `align-items: baseline` row around the pill would line the pill up by a
baseline the painter does not draw at.

`align-items` across a row, `justify-content` along a column, and a BLOCK is
untouched: its line boxes still start at the top of its content box whatever
`align-items` says.

### The check

`evg:textbox:check`, "a flex container's own text", asserts the EQUIVALENCE
rather than any number: the element's own text has to land exactly where the
same text in a child of the same container lands. A browser cannot tell those
two apart and neither may EVG. Six alignments, plus that the slack really is
there to be shared, that the layout's baseline is still the painter's, and
that a block ignores `align-items`.

## Issue #12: the accessibility mirror does not hide the page behind a dialog

Open, and NOT fixed here. The drawn half is fixed — see `EVGFocus`, the focus
trap — and this is the other half, recorded so it is not rediscovered.

### What happens

`evg-a11y.js` already knows how: `applyModal` looks for a node in the
accessibility tree that carries `modal` (`aria-modal`), walks up to the
top-level region holding it, and puts `aria-hidden="true"` on every other
top-level region. That is the right mechanism and it is written.

It never fires in realtrainer, because there is no such node. The element that
declares `a11yModal` is the overlay — the scrim, which is what covers the page
— and an element with no role and no name is not published to the tree at all.
So `tree.nodes.find(n => n.modal)` finds nothing, nothing is hidden, and a
screen reader walks straight out of an open dialog into the page behind it,
even though a sighted keyboard user can no longer do that.

### Why it is not a one-line fix

The node has to exist, which means the overlay or the sheet has to carry a
role — `dialog` is the right one — and that adds a node to the accessibility
tree of every screen that has a sheet on it. Those trees are recorded:
`gallery/realtrainer/traces/*.json` is the Ranger side's own transcript, and
`traces/reference/*.json` is the app being ported. Adding the role is very
likely a step TOWARDS the reference — a real dialog there is a
`<div role="dialog" aria-modal="true">` — but "very likely" is not "checked",
and the check needs the private frontend the reference recorder runs against.

So the shape of the fix is known and the cost is a re-record plus a look at
the reference diff, which is a machine this repository's CI does not have.

### What holds in the meantime

The keyboard is trapped (`EVGFocus`, `rt:keys`), Escape closes the topmost
dialog, and the mirror still reports the dialog's own controls correctly — it
just also reports the page behind them.

---

## Issue #13: a kept frame moved the page and left the focus ring behind

Fixed. Recorded because the first half of the fix was not enough and the
second half was in a place nobody would look.

### What happened

The ring is drawn LAST and outside every clip, so that a button inside a panel
is not half-ringed by the panel's edge. Outside every clip is also outside
every scroll LAYER — and a host does not re-read the display list for a frame
that only scrolled. It moves the kept frame by a per-layer offset: `uShift` in
the WebGL painter, the same arithmetic on the worker page. The ring belonged to
no layer, so it got no offset: the page moved and the ring stayed.

### Why the first fix did not show it

`EVGDisplayList.refreshRing` (Issue #12's neighbour, landed earlier) puts the
ring back against its own box whenever the kept LIST is refreshed, and every
check that reads `displayListJson()` therefore passes — the list was right all
along. What was wrong was the FRAME, which is built from the list once and
then moved by uniforms. A check that reads the list cannot see it; a
screenshot can.

### The fix

`ringAround` marks the ring command with the layer its element scrolls in
(`layerAround`, the innermost layer container that holds it, 1-based as the
painter numbers them), and the painter reads `layer` off a command that
carries one instead of taking it from the clip nesting alone. A control that
scrolls with nothing — a header button — is in layer 0 and stays put, which is
also checked.

### What holds it

`rt:keys` — "the ring is round its element, whatever the page is doing": the
invariant across wheels, a throw moved by the clock, a rebuild under the ring
and a page turn, plus the two assertions on the layer the ring declares. The
invariant is what was missing: a delta test ("it moved by 160") passes for a
ring that lags a frame and for one that leads one.

