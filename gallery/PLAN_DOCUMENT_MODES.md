# Who owns the document — four modes, and two one-way doors

*A plan. Nothing here is built yet; the status line on each stage says so.*

Four observations from a reader using the markdown editor:

1. An edit made on the RIGHT leaks to the left as invalid markdown. Select a
   list, press bold, and the markers land once around the whole selection
   instead of once per line — and then those markers show up in the preview.
   "The left pane is still the source even though I edited on the right."
2. In slides mode a page break cannot be moved, so a heading ends up on one
   slide and its diagram on the next.
3. The preview should be read-only by default; once it IS edited it becomes the
   truth, and then the real Word or PowerPoint editor has to own it — that
   cannot be converted perfectly back to `.md`, so keeping markdown editable
   as well is a promise nobody can keep. A third mode, MD + CSS, is where you
   stay lossless.
4. Backgrounds, fonts and colours should be editable by CSS in the deck and
   document modes too — background IMAGES especially — which needs bytes from
   somewhere other than the host's disk: a virtual filesystem, as its own
   shared project.

These are not four requests. They are one question asked four times: **which
artefact is the truth, and what is a gesture allowed to do to it?**

---

## 1. The bug, precisely — and what is not wrong

`MdSemanticEdit.toggleWrap` wraps the selection `[a, b)` with one marker pair.
`MdSemanticEdit.refusalFor` guards two things: a selection half inside an
inline emphasis, and a selection crossing the edge of a code span. There is
**no block guard at all**. So three selected list items become:

```md
**- Verkkokauppa kasvoi 18 %
- Jälleenmyynti pysyi ennallaan
- Lisenssit laskivat 4 %**
```

A `**` run cannot span a block boundary in CommonMark. That document has no
emphasis in it — it has four literal asterisks.

**Nothing leaked from the right pane to the left.** The left pane *is* the
document; the patch was applied to it; the preview is showing what the
document now says. The asterisks in the preview are the parser being correct
about a document that is wrong. That distinction decides the fix: there is no
feedback loop to break, and no second source of truth to reconcile. There is
one edit that produced markdown which does not mean what the reader asked for.

The correct patch is **one marker pair per block the selection touches** —
three items, three pairs. That is what markdown means by "these three items
are bold", and it is what a reader watching the left pane expects to see.

This is the same failure as the whitespace bug fixed earlier in
`MdSemanticEdit.guardWhitespace`: a space typed at the inside edge of `**bold**`
left `** bold**`, which is not emphasis either, and the markers appeared in the
preview for exactly this reason. Two instances of one family is a missing
invariant, not two bugs.

## 2. The invariant, and the harness that holds it

> **Apply an intent, reparse, and the intended node covers the intended range —
> in every block the selection touched.**

Not "the patch looks right". The tree. Four properties per case:

- the intent is PRESENT after the edit, over the range the reader selected, in
  each block it touched;
- nothing else changed — bytes outside the touched blocks compare equal;
- applying it twice returns the original (it is a toggle);
- undo returns the original byte for byte (`MdEditTest` already holds this one).

The value is in the corpus, not in the assertions: every block kind × every
selection shape. Inside one paragraph, across two paragraphs, across three list
items, a whole block including its marker, half a word, across a fence, across
a table row, across a blockquote's `>`, a selection that starts in a heading
and ends in the paragraph under it. Each case is a triple — document,
selection, intent — and the harness is a loop.

A case the intent cannot honestly serve is not a failure to be papered over: it
is a **named refusal**, and the harness asserts the refusal text as well. The
module already has `refusal()` and the page already shows it, which is why this
is a small amount of new machinery.

## 3. Four modes, and which two are lossless

| mode | the truth | right pane | left pane | lossless |
| --- | --- | --- | --- | --- |
| **MD** | the markdown file | edits, gated | the document | yes, by construction |
| **MD + CSS** | markdown + a stylesheet | edits, gated | the document | yes |
| **DECK** | a `PptxPresentation` | edits, freely | provenance, read-only | no — one-way |
| **DOC** | a `RichDocument` | edits, freely | provenance, read-only | no — one-way |

Two rules make this safe rather than merely tidy.

**A mode never silently degrades a gesture.** In MD mode a gesture markdown
cannot hold is refused BY NAME — "bold cannot cross a list item; each item
needs its own markers" — and the reader is told. It is never quietly rewritten
into something that parses differently. Today's bug is precisely a silent
degradation.

**Entering DECK or DOC is explicit, and announced as one-way.** There is no
"export and keep editing both". The moment the presentation is the truth,
markdown is where it came from and nothing more. Saying so up front is the
whole reason the mode can then be permissive: nothing in DECK mode has to be
expressible in markdown, so nothing has to be refused for markdown's sake.

MD + CSS is the answer to "but I want it to look like that AND stay a `.md`
file": content in markdown, appearance in a stylesheet, both of them files,
both of them editable, neither of them a round trip through an object graph.
It gets its own command set — a command in that mode edits a markdown block or
a CSS rule, never an in-memory rich model.

## 4. Why the right pane must drive the real editor

The repository already has both editors, each with its own suite:

| | model | editor | suites |
| --- | --- | --- | --- |
| PowerPoint | `PptxModel` | `PptxEdit`, `PptxTextEdit`, `PptxApp` | `pptx:editor:test`, `pptx:text:test`, `pptx:chrome:test`, `pptx:editor:host:test` |
| Word | `RichDocument` | `RichDocumentEdit`, `DocxEditController` | `docx_viewer:test`, `docx_viewer:app:test` |

A second slide editor living inside the markdown page would be a **pattern
seam** in the sense of [`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §2: two
implementations of one idea, where a fix to either does not reach the other.
That plan measures how badly that goes; there is no need to prove it twice.

So the hand-off is a conversion, not a re-implementation:

```
markdown ──► MdToPptx ──► PptxPresentation ──► PptxEdit / PptxApp owns it
         ──► MdToDocx ──► RichDocument      ──► DocxEditController owns it
```

The markdown page keeps the chrome it already has — the canvas, the font
manager, the scroll, the page furniture — and stops owning the model.
`MdToPptx` exists. `MdToDocx` does not and is the larger half of that row.

## 5. Page breaks — the most concrete pain, and it belongs in MD mode

A heading on one slide and its diagram on the next is the failure the reader
actually hits. `MdLayout` already knows about `slideBreakBefore` and
`keepWithNext`; what is missing is any way for a reader to SAY either. And a
slide break IS representable in markdown, which decides where it goes:

- **MD / slides mode** — a break is a marker in the source. What is needed is a
  command ("break here"), a visible break line in the preview, and a drag that
  moves it — each of which writes a marker and is therefore an ordinary patch,
  like every other edit. Because it is representable it must not wait for the
  hand-off in §4.
- **DECK mode** — moving a block between slides is a deck operation and
  `PptxEdit` owns it.

`keepWithNext` on a heading is the other half: a heading whose next block is a
diagram should not be the last thing on a slide. That is a layout rule, not an
edit, and it is the one that stops the reader having to fix this by hand.

## 6. CSS in the deck and document modes

`MdCss` is the third binding of `gallery/css/CssCore.rgr`, so the cascade is
already shared. What is missing is not the machinery but the properties:

- `background-image` does not exist in `MdCss` at all — only
  `background-color`, in three places.
- `PptxWriter` writes a slide background as `<p:bg><p:bgPr><a:solidFill>` only.
  It already writes `<p:blipFill>` for pictures, so the XML side of a background
  IMAGE is a short reach from what is there.
- Whether a Word section background is expressible at the fidelity a reader
  expects is **not yet established** and is a question for Stage G, not an
  assumption here.

All of it needs the same thing first: a picture the engine can actually reach.

## 7. The bytes have to come from somewhere

`![alt](src)` draws as its ALT TEXT today, in the muted colour, because the
markdown layout has no bytes for a picture. That is honest and it is also the
blocker under images, background images, and every CSS `url(...)`. The answer
is a virtual filesystem as its own shared project:
[`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md).

---

## 8. The stages

Ordered by value ÷ risk, with the live bug first. Each stage names the check
that would catch its failure, because a stage without one is a stage that will
be reported as done twice.

### Stage A — the invariant, and the bug it catches — not started

`toggleWrap` splits at block boundaries: one marker pair per block the
selection touches. The corpus harness of §2 lands with it, because the fix
without the harness is the third instance of this family waiting to happen.

*The check:* the corpus, asserting the TREE after a reparse — and a case whose
selection spans three list items asserting three emphasis nodes, not one.

### Stage B — a mode is a contract — not started

Name the four modes. Make MD mode's right pane a GATED editor: a gesture it
cannot represent is refused by name, never rewritten. Mark DECK and DOC as
one-way doors in the UI before either is built, so the promise is made before
it can be broken. No new editors in this stage.

*The check:* every intent × every mode, asserting either the edit or the
refusal text — and asserting that no combination produces a document that
reparses differently from what was asked.

### Stage C — the slide break a reader can move — not started

"Break here", a drawn break line, and a drag that moves it. `keepWithNext` for
a heading whose next block is a diagram or a table.

*The check:* a deck whose heading and diagram are split, then the break moved,
asserting which slide each block landed on — by counting the BLOCKS per slide,
not by counting slides.

### Stage D — `gallery/vfs`, in memory — not started

The new project, memory provider only, with the fixture tree a test and a demo
bootstrap from. See [`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md) stages V1–V3.

*The check:* that plan's own suite; plus every existing markdown and pptx suite
still passing, because a VFS nobody reads yet must change nothing.

### Stage E — a picture is bytes — not started

`![alt](src)` resolves through the VFS and becomes a real picture: sized at
layout time from the stat, drawn in the preview, carried into the PDF, the HTML
and the deck. Closes [`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) Stage B0
for markdown and removes the last "the deck carries no pictures" note from
`MdToPptx`.

*The check:* one document, four outputs, the same picture in all four — counted
as bytes present in each, not as a box of the right size.

### Stage F — backgrounds, and CSS that reaches them — not started

`background-image: url(...)` in `MdCss`; a slide background as
`<p:bg><p:bgPr><a:blipFill>`; the same rect in the preview. Fonts and colours
already cascade; this is the property the reader asked for by name.

*The check:* a themed deck opened back through `PptxParser`, asserting the
background part is present and referenced — the black-on-black theme bug is the
reason to check the FILE and not the preview.

### Stage G — DECK mode drives `PptxApp` — not started

The hand-off of §4 for PowerPoint. The largest stage, and the one that pays for
§3's honesty.

*The check:* a wiring test that drives the real call site — the page's own
command, not `PptxEdit` directly — because that is the mechanism
[`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §4 says is the only one that
has worked here.

### Stage H — DOC mode drives `DocxEditController` — not started

Needs `MdToDocx`, which does not exist. Deliberately last: the deck is where
the reader's pain is.

### Stage I — MD + CSS as its own command set — not started

The lossless mode. A command edits a markdown block or a CSS rule. Nothing in
this mode may touch an in-memory rich model, which is the whole reason it can
promise a byte-for-byte `.md` on the way out.

---

## 9. The riskiest assumptions

- **That per-block emphasis is what a reader wants.** It is what markdown
  means. If a reader selects half of one item and half of the next, three
  pairs is arguably wrong and a refusal is right. Stage A has to decide that
  case explicitly rather than let the loop decide it by accident.
- **That the one-way door is acceptable.** It is what the reader asked for. It
  is still the assumption most likely to be regretted, and the mitigation is
  §3's second rule: say it before the door, not after it.
- **That `MdToPptx` is a good enough conversion to hand off from.** It reports
  what it had to draw rather than write; a deck entered through it starts with
  those blocks already lossy. Stage G has to decide whether that is a starting
  point or a reason to improve the conversion first.
- **That the VFS stays small.** Every filesystem grows. §8 of the VFS plan is
  the list of things it must not become, and it exists to be enforced.
