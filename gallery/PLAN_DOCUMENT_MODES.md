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

**DECK comes first — decided.** `MdToPptx` exists and is tested, so the switch
can be proved end to end cheaply; `MdToDocx` does not exist at all and is the
larger half of the row. Build the switch where the destination is already
there, then add the Word destination behind the same switch, rather than build
both at once and find out which of the two was wrong. DOC is still what the
reader asked about and is Stage K, not a stage that fell off.

**PDF comes along for most of it.** The PDF writer draws the same display list
the deck is built from, so the layout, the page size, the stylesheet and a
diagram's width already govern both, and work on any of them reaches both. What
PDF does not share is §7: a PDF has no notion of an object a reader selects
later. The HTML exporter shares less again — it cannot draw a scene's paths at
all, which is a known limit rather than a gap this plan closes.

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

## 7. An embedded drawing is an object, not ink

A fenced diagram already arrives in the deck as ONE `p:grpSp`:
`PptxFromEvg.build` makes a group, `fitTo` sizes it to the union of what was
drawn, and `MdToPptx.drawn` pushes it onto the slide. So a reader can already
select it, move it and scale it in PowerPoint — further along than the note the
exporter prints about it, which says only that it "is drawn as shapes, not as
text — it cannot be edited in PowerPoint".

What is missing is everything that makes it an OBJECT rather than a pile of
ink:

- **It has no identity.** Every group is named `Drawing`, whatever notation it
  came from. A reader who finds it in PowerPoint's selection pane learns
  nothing about it.
- **It has no provenance.** The fence's text is not carried, so nothing can
  re-read the diagram later. An editor would have to reconstruct intent from
  strokes, which is not possible — a class diagram and a sequence diagram can
  draw the same rectangles.
- **A resize scales it; it does not re-lay it out.** PowerPoint scales a
  group's child space, so labels stretch with boxes. The markdown side already
  re-lays out at a given width (`{width=360}` → `MdEmbedKinds.widthOf`), and
  the two are genuinely different operations. "At minimum the size can be
  changed" is satisfied today; "it re-flows at its new size" is not, and cannot
  be without something running inside PowerPoint.
- **Nothing can edit it**, which is what carrying the source is for.

Where the source goes is a decision, not an obvious answer:

| carrier | survives other tools | cost |
| --- | --- | --- |
| `p:cNvPr/@descr` (alt text) | yes, widely | it is the ACCESSIBILITY field — a screen reader would read a Mermaid source aloud |
| `a:extLst` / `p:custDataLst` | in PowerPoint; stripped by some converters | invisible, which is also the point |
| a package part plus a relationship | correct OPC; ignored by tools that do not know the rel type | needs a content type and a rel type of its own |

The recommendation: **alt text carries a human description** — that is what the
field is for, and `PptxShape.altText` already reads it — and **a package part
carries the source**, with the group referencing it. That keeps accessibility
honest and keeps the source lossless and arbitrarily long. It is a
recommendation rather than a conclusion because it costs a content type and a
rel type, and Stage D is where that is weighed against putting a short source
in `extLst` and nothing in the package.

**Editing it later is a round trip, not a new editor.** Read the source back
out of the carrier; hand it to the reader that already draws it —
`MermaidRender`, `PlantUmlRender`, `DotRender`, `D2Render` — and to RangerFlow's
own editing surface, which is the tooling the reader asked for by name; then
rebuild the group and replace it on the slide. Everything in that sentence
exists except the carrier and the replace. That is why it is Stage J and not a
research project, and why Stage D — the carrier — is early even though the
editing is late: a deck written without provenance can never be edited, and
decks written this year are the ones a reader will still have next year.

## 8. CSS in the deck and document modes

`MdCss` is the third binding of `gallery/css/CssCore.rgr`, so the cascade is
already shared. What is missing is not machinery but properties:

- `background-image` does not exist in `MdCss` at all — only
  `background-color`, in three places.
- `PptxWriter` writes a slide background as `<p:bg><p:bgPr><a:solidFill>` only.
  It already writes `<p:blipFill>` for a picture shape, so the XML side of a
  background IMAGE is a short reach from what is there.
- Whether a Word section background is expressible at the fidelity a reader
  expects is **not established** and is a question for Stage K, not an
  assumption here.

All of it needs the same thing first: a picture the engine can reach.

## 9. The bytes have to come from somewhere

`![alt](src)` draws as its ALT TEXT today, in the muted colour, because the
markdown layout has no bytes for a picture. That is honest, and it is the
blocker under images, background images and every CSS `url(...)`. The answer is
a virtual filesystem as its own shared project:
[`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md).

---

## 10. The stages

Ordered by value ÷ risk, with the live bug first. Each stage names the check
that would catch its failure, because a stage without one gets reported as done
twice.

### Stage A — the invariant, and the bug it catches — ✅ done

`toggleWrap` splits at block boundaries: one marker pair per block the
selection touches, by way of `collectBlocks` and `clipsOf`. A block already
carrying the emphasis is left alone rather than wrapped again, and turning it
off works across blocks too — every block on means turn them off, anything else
means turn them all on, which is what a word processor does with a mixed
selection.

`refusalFor` moved to the same clips. Asked over the whole selection it refused
the ordinary case: a selection covering three bolded items half-straddles the
first item's `**` run, because that run stops at the end of its block, which is
all a run can do. Half in and half out is a fact about ONE BLOCK, and the clip
is the range in which it is a fact. Both the edit and the refusal read the same
`clipsOf`, because a refusal computed over different ranges from the edit is a
refusal that does not describe the edit.

*The check:* the corpus in `MdSemanticTest.corpus` — eleven selection SHAPES,
each asking the reparsed tree three questions. The cheapest of the three turned
out to be the strongest: **adding or removing emphasis must not change the
document's plain text**, because a marker that lands where it is not a
delimiter stops being markup and becomes a character, and a character shows up
there and nowhere else. Plus the page's own check driving `app.run` — the
toolbar a reader actually presses — asserting three BOLD RUNS on the page and
no asterisk drawn as a character, since four literal asterisks would draw too.

### Stage B — the switch, with markdown still behind it — ✅ done

The preview becomes read-only by default. "Edit the preview" is an explicit
choice; throwing it makes the source pane read-only and the preview the truth,
with the warning of §3 shown first.

At this stage what is behind the switch is still the markdown-backed editor
that exists today — and that is honest rather than a placeholder, because the
truth really has moved: the document is what the preview shows, markdown is its
hidden serialization, and the reader can no longer edit it behind the preview's
back. What is limited at this stage is the CAPABILITY of that truth, and the
switch says which gestures are not yet there. Stage H replaces the backing
model and the limitation lifts without the reader's mental model changing.

This is also the stage that makes today's bug unreachable from the preview:
with the source pane read-only, there is no second writer.

Two questions lived in one variable and are now separate. FOCUS is which pane
the keyboard points at; it changes on every click. OWNERSHIP is which artefact
IS the document; it is chosen once. Clicking the markdown pane used to hand it
the keyboard and make it writable again — which, after the switch, would give
the document two writers, the exact bug the switch exists to remove.

The refusal lives in `MarkdownWeb`, not in the page's event handlers: the page
can forget to check and the document cannot. `typeText` and the writing keys go
through `mayWriteInPreview`, `applyPatch` through `mayWriteInSource`, and
`refusal()` carries the reason. Moving and selecting are not writing, so a
read-only preview is still one a reader can navigate and copy out of — which is
what the source map was built for.

*The check:* the page's own switch, driven end to end, in both directions —
because a read-only pane that still accepts input is the failure worth catching
and the one a screenshot cannot see: the document changes and the pane looks
exactly as it did. The markdown pane's write is refused again much later in the
run, on purpose: an ownership that lapses after a few operations is worse than
one that was never claimed.

### Stage C — the slide break a reader can move — not started

"Break here", a drawn break line, and a drag that moves it. `keepWithNext` for
a heading whose next block is a diagram or a table. MD mode, because a break is
representable.

*The check:* a deck whose heading and diagram are split, then the break moved,
asserting which slide each block landed on — by counting the BLOCKS per slide,
not by counting slides.

### Stage D1 — a drawing says what it is — ✅ done

The group is named for its notation (`Graphviz diagram 1`) rather than
`Drawing`, and carries a description built from the labels it actually drew.
`PptxFromEvg` cannot do either — it is handed a display list and nothing else —
so `MdToPptx` does it, which is the only place that knows the notation.

**This needed no change in the pptx module at all**, which is the useful
finding. `descr` already round-trips through `PptxWriter.descrAttr` and the
parser, and `PptxA11y.shapeName` already prefers it over every other way of
naming a shape. The seam was right; there was simply nothing being put into it,
so a drawing reached a screen reader as the word "Drawing" at best. Every deck
this exporter has written is affected, and every one it writes from now on
carries the description.

The exporter's note changed with it: a drawing "can be moved and resized, and
not yet edited" is a different sentence from "it cannot be edited in
PowerPoint", and the first one is true.

*The check:* the deck written, re-opened through `PptxParser`, and the name and
description read back off the FILE — plus `PptxA11y.shapeName` on the recovered
group returning the description, which is where it lands for the reader it is
for.

### Stage D2 — and carries its source — not started

The carrier §7 weighs. A survey of the writer says the honest cost: a new part
type touches `contentTypesXml`, the per-slide relationships, both save paths
(the fresh write and the edit-and-save), the parser, and the re-association
from a shape back to its part — roughly what `notesSlide` costs, which is
threaded through ten places. That is a stage, not an afternoon, and it is the
half that makes Stage J possible: a deck written without provenance can never
be edited afterwards.

*The check:* a deck written, re-opened, and the recovered SOURCE compared byte
for byte with the fence it came from. Counting the group would pass with the
source missing, which is the whole failure.

### Stage E — `gallery/vfs`, in memory — not started

The new project, memory provider only, with the fixture tree a suite and a demo
bootstrap from. See [`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md) stages V1–V3.

*The check:* that plan's own suite; plus every existing markdown and pptx suite
still passing, because a VFS nobody reads yet must change nothing.

### Stage F — a picture is bytes — not started

`![alt](src)` resolves through the VFS and becomes a real picture: sized at
layout time from the stat, drawn in the preview, carried into the PDF, the HTML
and the deck. Closes [`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) Stage B0
for markdown and removes the "the deck carries no pictures" note from
`MdToPptx`.

*The check:* one document, four outputs, the same picture in all four — counted
as bytes present in each, not as a box of the right size.

### Stage G — backgrounds, and CSS that reaches them — not started

`background-image: url(...)` in `MdCss`; a slide background as
`<p:bg><p:bgPr><a:blipFill>`; the same rect in the preview and in the PDF.

*The check:* a themed deck opened back through `PptxParser`, asserting the
background part is present and referenced — the black-on-black theme bug is the
reason to check the FILE rather than the preview.

### Stage H — DECK: the real editor behind the switch — not started

`PptxApp` owns the model. The markdown page keeps the canvas and stops owning
the document. The largest stage, and the one that pays for §3.

*The check:* a wiring test that drives the page's own command rather than
`PptxEdit` directly — the mechanism
[`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §4 says is the only one that
has worked here — plus a gesture markdown cannot express (a coloured text box)
surviving a save and a reopen.

### Stage I — a drawing, moved and resized on the slide — not started

With the deck editable, a diagram is an object the reader handles like any
other shape: select, move, resize. Most of this is `PptxEdit` already working
on a group; what needs deciding is what a resize MEANS — §7's scale-versus-
re-layout — and the honest first answer is that it scales, with the width
attribute on the markdown side remaining the way to re-flow.

*The check:* a group moved and resized, saved, reopened, and its position and
extent asserted from the FILE — plus the drawing still being one group
afterwards rather than a loose pile of shapes.

### Stage J — editing a drawing, through RangerFlow — not started

Read the source back out of the carrier Stage D wrote, edit it with RangerFlow's
own editing surface, redraw, and replace the group on the slide. The round trip
the reader asked for by name. Needs D for the source and H for the app.

*The check:* open a deck, add one node to a diagram's source through that
surface, and assert the redrawn group contains the NEW NODE's label — a node
added is a node drawn. Asserting only that the group changed would pass on a
redraw that lost everything.

### Stage K — DOC: `MdToDocx`, then `DocxEditController` — not started

The destination the reader actually asked about. Needs a converter that does
not exist. Behind the switch built in Stage B and proved in Stage H.

### Stage L — MD + CSS as its own command set — not started

The lossless mode. An enumerated allowlist in which every command names the
file it writes. Nothing here may touch an in-memory rich model, which is the
whole reason it can promise a byte-for-byte `.md` on the way out.

---

## 11. The riskiest assumptions

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
  with those blocks already lossy. Stage H has to decide whether that is a
  starting point or a reason to improve the conversion first.
- **That the VFS stays small.** Every filesystem grows. §8 of the VFS plan is
  the list of things it must not become, and it exists to be enforced.
