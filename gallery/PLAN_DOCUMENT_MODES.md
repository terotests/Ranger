# Who owns the document — the switch, and what is behind it

*A plan. Nothing here is built yet; the status line on each stage says so.*

The rule this plan exists to implement, as the reader stated it:

> The preview is READ-ONLY by default. A reader who wants to edit it turns that
> on **explicitly**. From that moment the preview is the truth, the markdown
> pane goes read-only, and there is no way back — because markdown cannot
> express what editing on that side can do.

Everything below follows from that one sentence. The four things reported —
bold leaking into the source as invalid markdown, an unmovable slide break, the
preview having no clear ownership, and backgrounds needing bytes — are that
sentence not yet being true, plus one file-access problem.

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
document today; the patch was applied to it; the preview is showing what the
document now says. The asterisks in the preview are the parser being correct
about a document that is wrong.

That distinction decides two things. First, there is no feedback loop to break
and no second source of truth to reconcile — there is one edit whose output
does not mean what the reader asked for, the same family as the whitespace bug
`MdSemanticEdit.guardWhitespace` already fixes. Second, and less obviously:
**this bug does not go away when the preview stops being markdown-backed.** The
same command is on the toolbar over a SOURCE selection, where markdown is and
remains the truth. Per-block markers are what markdown means by "these three
items are bold", in every mode below where markdown is the truth at all. So
§3's architecture does not excuse Stage A; it only explains why Stage A is not
the whole answer.

## 2. The invariant, and the harness that holds it

> **Apply an intent, reparse, and the intended node covers the intended range —
> in every block the selection touched.**

Not "the patch looks right". The tree. Four properties per case:

- the intent is PRESENT after the edit, over the range the reader selected, in
  each block it touched;
- nothing else changed — bytes outside the touched blocks compare equal;
- applying it twice returns the original (it is a toggle);
- undo returns the original byte for byte (`MdEditTest` already holds this one).

The value is in the corpus, not the assertions: every block kind × every
selection shape. Inside one paragraph, across two paragraphs, across three list
items, a whole block including its marker, half a word, across a fence, across
a table row, across a blockquote's `>`, a selection starting in a heading and
ending in the paragraph under it.

Where an intent cannot honestly be served the answer is a **named refusal**,
and the harness asserts the refusal text too. `refusal()` exists and the page
already shows it.

## 3. The switch, and why it is a switch rather than a gate

The design that is NOT being built is the obvious one: keep markdown as the
truth forever, let the preview be edited, and translate each gesture into a
markdown patch — refusing the ones that will not survive.

That design fails for a reason no amount of care fixes. Markdown cannot express
most of what editing a document means: a text box, a background, a colour, a
shape, a run of 14pt semibold in the middle of a sentence, a picture at a size,
a slide. A gate over that is a rich editor that refuses nearly everything a
reader reaches for, which is a markdown editor with extra steps. And the gate
has to be exhaustively RIGHT: today's bug is a gate with one hole in it, and
the hole was invisible until a reader found it. The next hole will be found the
same way.

So instead: **one explicit switch, one direction.**

```
        markdown is the truth                 the document is the truth
        preview is a read-only view   ──────► preview is the editor
        source pane is editable        switch  source pane is read-only
                                               — provenance, not input
```

What must be true of the switch:

- **It is chosen, never fallen into.** No gesture in the preview turns it on by
  accident. Clicking, selecting and copying in a read-only preview stay
  available — the source map already supports all three — and none of them is
  an edit.
- **It says what it costs before it is thrown**, not after. "From here the
  markdown is a record of where this came from. Changes will not go back into
  it." A reader who wants to keep editing markdown answers no.
- **It is one-way.** There is no "and also keep the `.md` in step". That promise
  is the thing nobody can keep, and offering it is how the four bugs above got
  written.
- **After it, nothing is refused for markdown's sake.** That is the entire
  payoff. The rich side does not have to ask whether a gesture round-trips,
  because nothing round-trips.

## 4. Four modes

| mode | the truth | source pane | preview | lossless |
| --- | --- | --- | --- | --- |
| **MD** | the markdown file | editable | read-only view | yes, by construction |
| **MD + CSS** | markdown + a stylesheet | editable | read-only view | yes |
| **DOC** | a `RichDocument` | read-only provenance | the editor | no — one-way |
| **DECK** | a `PptxPresentation` | read-only provenance | the editor | no — one-way |

MD + CSS is the answer to "I want it to look like that AND stay a `.md` file":
content in markdown, appearance in a stylesheet, both of them files. Its
editing surface is an **allowlist, not a gate** — an enumerated command set in
which every command names the file it writes, markdown or CSS. That is the
difference from the design rejected in §3: not "anything, minus what we thought
to refuse", but "these, each of which writes a file".

Both MD modes keep a read-only preview that can be clicked, selected and
copied. That is not a consolation prize: click-to-offset, the caret and the
line table are what the source map was built for, and they are how a reader
navigates a long document from the rendered side.

## 5. What is behind the switch — and which destination comes first

The repository already has both rich editors, each with its own suite:

| | model | editor | suites |
| --- | --- | --- | --- |
| PowerPoint | `PptxModel` | `PptxEdit`, `PptxTextEdit`, `PptxApp` | `pptx:editor:test`, `pptx:text:test`, `pptx:chrome:test`, `pptx:editor:host:test` |
| Word | `RichDocument` | `RichDocumentEdit`, `DocxEditController` | `docx_viewer:test`, `docx_viewer:app:test` |

A second slide editor inside the markdown page would be a **pattern seam** in
the sense of [`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §2 — two
implementations of one idea, where a fix to either reaches neither. That plan
measures how badly that goes; there is no need to prove it twice. So the switch
is a conversion followed by a hand-off, not a re-implementation:

```
markdown ──► MdToPptx ──► PptxPresentation ──► PptxEdit / PptxApp owns it
         ──► MdToDocx ──► RichDocument      ──► DocxEditController owns it
```

The markdown page keeps the chrome it already has — the canvas, the font
manager, the scroll, the page furniture — and stops owning the model.

**DECK comes first, and DOC is what the reader asked about.** That tension is
real and worth naming rather than resolving quietly: `MdToPptx` exists and is
tested, so the switch can be proved end to end cheaply on the deck; `MdToDocx`
does not exist at all and is the larger half of the row. The recommendation is
to build the SWITCH on the deck, where the destination is already there, and
then add the Word destination behind the same switch — rather than build the
switch and the Word converter at once and find out which of the two is wrong.

## 6. Page breaks — and why they stay on the markdown side

A heading on one slide and its diagram on the next is the failure the reader
actually hits. `MdLayout` already knows `slideBreakBefore` and `keepWithNext`;
what is missing is any way for a reader to SAY either.

A slide break is one of the few things markdown CAN hold. So it belongs in MD
mode, as a command that writes a marker and is therefore an ordinary patch —
and it must not wait for the switch, because a reader who only wants to move a
break should not have to give up their `.md` file to do it. `keepWithNext` on a
heading whose next block is a diagram or a table is the other half, and it is a
layout rule rather than an edit: it stops the reader having to fix this by hand
at all.

After the switch, moving a block between slides is a deck operation and
`PptxEdit` owns it. Both answers exist because both modes exist.

## 7. CSS in the deck and document modes

`MdCss` is the third binding of `gallery/css/CssCore.rgr`, so the cascade is
already shared. What is missing is not machinery but properties:

- `background-image` does not exist in `MdCss` at all — only
  `background-color`, in three places.
- `PptxWriter` writes a slide background as `<p:bg><p:bgPr><a:solidFill>` only.
  It already writes `<p:blipFill>` for a picture shape, so the XML side of a
  background IMAGE is a short reach from what is there.
- Whether a Word section background is expressible at the fidelity a reader
  expects is **not established** and is a question for Stage G, not an
  assumption here.

All of it needs the same thing first: a picture the engine can reach.

## 8. The bytes have to come from somewhere

`![alt](src)` draws as its ALT TEXT today, in the muted colour, because the
markdown layout has no bytes for a picture. That is honest, and it is the
blocker under images, background images and every CSS `url(...)`. The answer is
a virtual filesystem as its own shared project:
[`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md).

---

## 9. The stages

Ordered by value ÷ risk, with the live bug first. Each stage names the check
that would catch its failure, because a stage without one gets reported as done
twice.

### Stage A — the invariant, and the bug it catches — not started

`toggleWrap` splits at block boundaries: one marker pair per block the
selection touches. The corpus harness of §2 lands with it, because the fix
without the harness is the third instance of this family waiting to happen.
Needed whatever §3 does, because the same command runs over a source selection.

*The check:* the corpus, asserting the TREE after a reparse — and a case whose
selection spans three list items asserting three emphasis nodes, not one.

### Stage B — the switch, with markdown still behind it — not started

The preview becomes read-only by default. "Edit the preview" is an explicit
choice; throwing it makes the source pane read-only and the preview the truth,
with the warning of §3 shown first.

At this stage what is behind the switch is still the markdown-backed editor
that exists today — and that is honest rather than a placeholder, because the
truth really has moved: the document is what the preview shows, markdown is its
hidden serialization, and the reader can no longer edit it behind the preview's
back. What is limited at this stage is the CAPABILITY of that truth, and the
switch says which gestures are not yet there. Stage G replaces the backing
model and the limitation lifts without the reader's mental model changing.

This is also the stage that makes today's bug unreachable from the preview:
with the source pane read-only, there is no second writer.

*The check:* a wiring test that drives the page's own switch, asserting that a
keystroke into the source pane after the switch changes nothing, and that a
preview edit before the switch changes nothing. Both directions, because a
read-only pane that still accepts input is the failure worth catching.

### Stage C — the slide break a reader can move — not started

"Break here", a drawn break line, and a drag that moves it. `keepWithNext` for
a heading whose next block is a diagram or a table. MD mode, because a break is
representable.

*The check:* a deck whose heading and diagram are split, then the break moved,
asserting which slide each block landed on — by counting the BLOCKS per slide,
not by counting slides.

### Stage D — `gallery/vfs`, in memory — not started

The new project, memory provider only, with the fixture tree a suite and a demo
bootstrap from. See [`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md) stages V1–V3.

*The check:* that plan's own suite; plus every existing markdown and pptx suite
still passing, because a VFS nobody reads yet must change nothing.

### Stage E — a picture is bytes — not started

`![alt](src)` resolves through the VFS and becomes a real picture: sized at
layout time from the stat, drawn in the preview, carried into the PDF, the HTML
and the deck. Closes [`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) Stage B0
for markdown and removes the "the deck carries no pictures" note from
`MdToPptx`.

*The check:* one document, four outputs, the same picture in all four — counted
as bytes present in each, not as a box of the right size.

### Stage F — backgrounds, and CSS that reaches them — not started

`background-image: url(...)` in `MdCss`; a slide background as
`<p:bg><p:bgPr><a:blipFill>`; the same rect in the preview.

*The check:* a themed deck opened back through `PptxParser`, asserting the
background part is present and referenced — the black-on-black theme bug is the
reason to check the FILE rather than the preview.

### Stage G — DECK: the real editor behind the switch — not started

`PptxApp` owns the model. The markdown page keeps the canvas and stops owning
the document. The largest stage, and the one that pays for §3.

*The check:* a wiring test that drives the page's own command rather than
`PptxEdit` directly — the mechanism
[`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §4 says is the only one that
has worked here — plus a gesture markdown cannot express (a coloured text box)
surviving a save and a reopen.

### Stage H — DOC: `MdToDocx`, then `DocxEditController` — not started

The destination the reader actually asked about. Needs a converter that does
not exist. Behind the switch built in Stage B and proved in Stage G.

### Stage I — MD + CSS as its own command set — not started

The lossless mode. An enumerated allowlist in which every command names the
file it writes. Nothing here may touch an in-memory rich model, which is the
whole reason it can promise a byte-for-byte `.md` on the way out.

---

## 10. The riskiest assumptions

- **That a read-only preview is acceptable in MD mode.** It is what was asked
  for, and it is the largest visible change: the preview stops taking
  keystrokes until the switch is thrown. The machinery built for those
  keystrokes is not wasted — the layout, the caret, click-to-offset and the
  selection are what the rich editor will sit on, and `MdSemanticEdit` becomes
  the toolbar over the source pane — but a reader will notice on day one.
- **That per-block emphasis is what a reader wants.** It is what markdown
  means. For a selection covering half of one item and half of the next, three
  pairs is arguably wrong and a refusal is right; Stage A must decide that case
  explicitly rather than let the loop decide it by accident.
- **That `MdToPptx` is a good enough conversion to hand off from.** It reports
  what it had to DRAW rather than write, so a deck entered through it starts
  with those blocks already lossy. Stage G has to decide whether that is a
  starting point or a reason to improve the conversion first.
- **That the VFS stays small.** Every filesystem grows. §8 of the VFS plan is
  the list of things it must not become, and it exists to be enforced.
