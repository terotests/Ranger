# Who owns the document — three views, and what is behind them

*Every stage below is built. The status line on each says so, and §11 is the
list of assumptions that turned out to be worth writing down.*

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

## 3. Three views, and why not a gate

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

So instead: **three views, each of which is its own document.**

```
   ┌─ Preview ─────────┐  ┌─ PPTX ──────────────┐  ┌─ DOCX ──────────────┐
   │ the .md, laid out │  │ a PptxPresentation  │  │ a RichDocument      │
   │ always follows it │  │ made when you go    │  │ made when you go    │
   │                   │  │ there; its own from │  │ there; its own from │
   │                   │  │ the first edit      │  │ the first edit      │
   └───────────────────┘  └─────────────────────┘  └─────────────────────┘
                                     ▲  ↻ override from .md
                            the ONE thing that discards a view's edits
```

What must be true of the three:

- **Preview always follows the `.md`.** It is the markdown file, laid out. It
  is never a second document and there is nothing to lose in it.
- **PPTX and DOCX are made on the way in, and only while they are untouched.**
  Going there again re-converts the markdown — so a reader who has not edited
  anything always sees their current document — and the FIRST edit ends that
  for good. That needs no confirmation to say, because it is what "editing"
  means.
- **Nothing is confirmed on the way in, because nothing is lost on the way
  in.** An earlier shape of this plan had one explicit, one-way switch with a
  confirmation on it. It was built, and it read as a wizard — "make a deck",
  "edit the preview", "again to confirm" — for three documents that are simply
  three tabs. The confirmation guarded the wrong door: entering a view costs
  nothing, and what actually discards work is `↻ override from .md`, which is
  a button a reader goes and clicks.
- **The markdown pane stays the `.md`'s, whichever view is on screen.** The
  other two are separate documents and are not fed by it; carrying changes
  back into the `.md` is out of scope and always was.
- **Nothing is refused for markdown's sake** inside PPTX or DOCX. That is the
  entire payoff. The rich side does not have to ask whether a gesture
  round-trips, because nothing round-trips.

## 4. Three views and a stylesheet

| view | the truth | left pane | right pane | lossless |
| --- | --- | --- | --- | --- |
| **Preview** | the markdown file | `document.md`, editable | the .md laid out, always | yes, by construction |
| **Preview + `style.css`** | markdown + a stylesheet | `style.css`, editable | re-dressed as you type | yes — both are files |
| **PPTX** | a `PptxPresentation` | the .md, as provenance | the deck editor | no — its own document |
| **DOCX** | a `RichDocument` | the .md, as provenance | the Word editor | no — its own document |

`style.css` is the answer to "I want it to look like that AND stay a `.md` file":
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

> **Superseded by Stage L.** The switch and its warning were built and shipped
> as described here, and then replaced by the three view tabs of §3 after a
> reader met them: the confirmations read as a wizard around what are three
> tabs. What survived is everything below about FOCUS versus OWNERSHIP and
> about the refusal living in `MarkdownWeb` rather than in the page — the view
> is now what decides, and it decides in one place.


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

### Stage C — the slide break a reader can move — ✅ done

`MdLayout` has known `{.slide}` and `{.no-break}` all along; a reader had no
way to say either. `MdSemanticEdit.toggleBlockClass` puts the class on the
block at the caret and takes it off again, as one patch and one undo. Goldmark
attributes attach to the block BEFORE them, so the class goes on a line of its
own after it — one code path for every block kind, headings included. Two
classes share one attribute block, taking one off leaves the other, and taking
the last one off takes the line with it, or the document grows a blank line
every time a reader changes their mind.

`keepWithNext` learned `keepRoom`. One body line is right for PROSE — a
paragraph that starts under its heading and runs on still reads as one thing —
and wrong for a block that cannot be cut. A diagram is laid out whole or not at
all, so a heading with one line of room under it takes the heading and leaves
the diagram on the next slide, which is the reader's complaint in as many
words. The diagram's height is already known: `MdDiagram.prepare` measured it
before layout began, which is the whole reason that pass exists. Capped at the
room a slide has, or a diagram taller than any slide would push every heading
forward for ever and still not fit. A TABLE still gets one line — its height is
not known without laying its rows out, and doing that inside the rule would be
a second table algorithm beside `tableWidths`. Named rather than left as an
oversight.

*The check:* a deck sized so the rule must fire AND can — a 200pt diagram in a
slide with 260pt of room. Without `keepRoom` the heading lands on slide 0 and
the diagram on slide 1; with it, both are on slide 1. Verified by disabling the
fix and watching the check fail, because a case where the pair happens to fit
anyway counts nothing. Plus the page's own checks driving `app.run` for both
commands, asserting a slide MORE than there was rather than only the bytes: an
attribute the parser folds onto the wrong block writes exactly the same bytes.

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

### Stage D2 — and carries its source — ✅ done

The carrier turned out to be neither of the two §7 weighed. A package part
costs what `notesSlide` costs — a content type, the per-slide relationships,
both save paths, the parser, and the re-association from a shape back to its
part, threaded through ten places. Alt text costs a blind reader having a
Mermaid source read aloud to them. `p:cNvPr/a:extLst` costs neither: it is the
place OOXML sets aside for an application's own data, and a consumer that does
not know the URI is **required to preserve** the extension rather than
understand it. PowerPoint round-trips it untouched.

Two details that are not style choices. The source is element CONTENT and not
an attribute, because XML attribute-value normalisation turns every newline
into a space and a Mermaid diagram written into an attribute comes back as one
line and no longer parses. And `xml:space="preserve"`, because a reader that
trims the content gives back a diagram whose first line lost its indentation —
a source that is nearly right is worse than one that is missing.

`PptxEdit`'s shape copier carries the fields too: a copy that dropped them
would turn an editable diagram into ink the first time a reader duplicated a
slide.

*The check:* the deck written, re-opened through `PptxParser`, and the source
compared BYTE FOR BYTE with the fence it came from — the only form of it worth
carrying. Counting the group would pass with the source missing, which is the
whole failure.

### Stage E — `gallery/vfs`, in memory — ✅ done

The new project, memory provider only, with the fixture tree a suite and a demo
bootstrap from. See [`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md) stages V1–V3.

*The check:* that plan's own suite; plus every existing markdown and pptx suite
still passing, because a VFS nobody reads yet must change nothing.

### Stage F — a picture is bytes — ✅ done

`![alt](src)` on a paragraph of its own resolves through the VFS and becomes a
picture: sized from the stat, drawn in the preview, carried into the deck.
Anywhere else it stays ALT TEXT, and that split is deliberate rather than a
first step — a picture in the middle of a sentence has to sit on a text
baseline, a different question markdown almost never asks.

ONE store answers for all of it. The preview, the deck exporter and the PDF
each build their own layout, and each is handed the store the editor holds, so
they cannot be missing different pictures. A picture nobody has is alt text in
all of them, and the export says which it carried and which it did not — a deck
quietly short of a picture the document names is what that accounting exists to
prevent.

The bug worth recording: the page does not draw through the element tree. It
paints straight from the boxes — "the canvas never wanted an element tree, and
building one only to walk it back was 133 ms of a 342 ms document". So a
picture added to `MdToEvg.element` alone appeared in the tests and nowhere on
the page. Both roads now paint it, which is what `MarkdownTest.presized`
exists to hold.

*The check:* the layout's picture BOX and the display list's picture COMMAND,
because a box no command comes out of is a picture that is on the page in the
model and nowhere on the page. Then the deck, re-opened through `PptxParser`,
with the bytes and the alt text read back off the file — and, in one document,
a picture the store does not have still drawing as its alt text.

### Stage G — backgrounds, and CSS that reaches them — ✅ done

`page { background-color; background-image: url(...) }` in `MdCss`, painted in
the preview, written as `<p:bg><p:bgPr><a:blipFill>` on every slide, and read
back. `MdStyle` had `background-color` three times — for code, for a table
head, for a blockquote — and none for the PAGE, which is the one a reader
notices first and the one a company template is mostly made of.

`url(...)` goes through `Vfs.resolve`, the same function that answers for
`![](x)` and `r:embed`, because four copies of that arithmetic would be four
answers to what `../` means. A gradient or a `none` is left alone: not a
picture, and better ignored than half-understood. A background the store does
not have is simply not drawn — never a reason for a page to have nothing on it.

Two bugs found by writing the file and reading it back. `PptxWriter` needed the
same `noteMediaUse` every picture makes, or the relationship is never written
and the part is invalid. And `PptxParser` read `attr("embed")` where the
attribute is `r:embed` — the picture parser beside it had it right, which is
how it was found.

*The check:* the deck written, re-opened through `PptxParser`, and the
background's BYTES compared with what went in — the black-on-black theme bug is
the reason to check the file rather than the preview. Plus the page's own
check, on the colour the command carries and on the picture command behind it.

### Stage H — DECK: the real editor behind the switch — ✅ done

The switch turned out to want two steps, and they are two different promises.
Handing the preview the document says *the markdown is no longer where you
edit*. Making a deck says *this is a presentation now, and what it can hold is
what PowerPoint can hold*. A page that did both on one press could not tell a
reader which one it had done, and a reader may want the first without the
second.

After `convertToDeck` the model is a `PptxPresentation`, the operations are
`PptxEditor`'s — hit testing, selection, move, resize, undo — and the drawing
is `PptxToEvg`'s. This page keeps the chrome it already had: the canvas, the
font manager, the scroll. It does not know how a slide is laid out and must not
learn: `PptxEditor` carries 342 checks of its own, and a second answer to "what
did I just click" in this file is the pattern seam
[`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §2 exists to warn about.

`pptx()` now saves what the EDITOR holds rather than converting the markdown
again — converting a second time would throw the reader's work away by the act
of saving it.

*The check:* the page's own commands, last in the run because the step is
one-way: convert, assert the canvas is drawing the DECK (a title only a slide
has), click a shape and assert the editor selected one, move it, undo it, and
save. The click goes through `screenCmds` — canvas coordinates, because that is
what a click arrives in.

### Stage I — a drawing, moved and resized on the slide — ✅ done

Most of it was `PptxEditor` already working on a group, and the stage is the
check that it does — through the editor, so a drawing is handled by the same
code every other shape is. A resize SCALES: PowerPoint scales a group's child
space, and re-laying a diagram out at its new size would need something running
inside PowerPoint. `{width=360}` on the markdown side is the way to re-flow one.

*The check:* selected by a click in the middle of the group, moved, undone,
resized — then out through the writer and back, with the extent and the
identity read off the FILE. And that it is STILL ONE GROUP afterwards: a move
that flattened a drawing into loose shapes would look identical on the slide
and be unusable the next time a reader touched it.

### Stage J — editing a drawing, through RangerFlow — ✅ done

`MdDeckDiagram`: the group's source out of `p:cNvPr/a:extLst`, through the
reader that already draws that notation, and back onto the slide IN PLACE —
same position, same identity, new geometry. No new editor; the only new thing
is the replace.

Text that does not read as a diagram is refused and the old drawing is left
exactly as it was. A reader halfway through typing a node has a source that
does not parse, and blanking their slide at every keystroke would be worse than
useless.

One bug worth recording: a deck edit does not make the MARKDOWN stale, so
`sync` never rebuilt the list and a redrawn diagram stayed on the canvas
exactly as it was. The model changed and the page did not, which is the worst
shape a bug can take — the reader is told it worked.

*The check:* a node ADDED to the source appearing as a label on the slide.
Asserting only that the group changed would pass on a redraw that lost
everything. Driven from the page's own commands as well as the model's, and
followed through the file.

### Stage K — DOC: `MdToDocx`, then `DocxEditController` — ✅ done

`MdToDocx` builds a `RichDocument` — the model `DocxEditController` edits and
`DocxView` draws. Smaller than `MdToPptx`, because a Word document is a stream
of paragraphs rather than a canvas: one road, and the only question is which
paragraph a block becomes. Lossier in a different place for the same reason — a
diagram is a paragraph with its name in it, because a `RichDocument` has no
shapes — and the costs are counted the way the deck's are.

Two things that only showed up by drawing it. `DocxView.init` loads faces from
a DIRECTORY, which a browser does not have; `BookApp` had solved the same
problem the same way, so the host hands the bytes it already fetched. And
`DocxLayout.layoutIfNeeded` compares its own `laidRevision` against the
document's, so a document built and never touched sits at revision zero — which
a fresh layout also does, so it decided it had already laid the document out and
produced NO PAGES. A blank canvas from a model that was entirely correct.

**The two destinations are exclusive**, and that is not a limitation to fix: a
document that became a deck is no longer the markdown, and the conversion is
from the markdown. Both doors say so by name.

*Not done:* writing a `.docx` FILE. This repository reads Word documents and has
no WordprocessingML writer — `DocxPackage` is read-only. The model is editable
and drawable; saving it as a file is its own piece of work.

*The check:* the model's SHAPE, because "it produced something" is not the
claim — paragraphs with spans, the list kinds Word understands, a hyperlink
where the document had a link, and a bold span covering the WORD that was bold
rather than the sentence. Then `DocxView.buildDisplayList`, the function the
page calls, producing a page of TEXT RUNS. And on the page: that taking one
door closes the other, by name.

### Stage L — MD + CSS as its own command set — ✅ done

Fourteen style commands, each naming the file it writes, and two questions a
caller can answer without trying anything: `styleCommands` says what may be
done, `commandTarget` says which file each one touches. A command that is not on
the list does not exist — which is the whole difference from a gate: there is
nothing to have forgotten to refuse.

`MdCssEdit` rewrites the sheet as TEXT. Not by parsing and printing: `CssCore`
could serialise a sheet back, and a round trip through rules renormalises the
comments, the blank lines and the alignment a reader arranged by hand. That is
the same argument [`markdown/PLAN_WYSIWYG.md`](markdown/PLAN_WYSIWYG.md) §1
makes about markdown and it is true of CSS for the same reason. So every check
is a byte comparison, and "it parses to the same rules" is exactly the claim
that is not being made.

Braces and colons inside comments and inside quoted strings are not structure.
`/* } */` and `url("a{b}")` both used to be able to end a rule, and a rule
written after a leading comment could not be found at all, because the comment
was read as part of the selector.

*The check:* the bytes, including a reader's comment surviving an edit, a
declaration removed taking the separator on whichever side it is on, and set-
then-unset giving back the file that went in — the same promise every markdown
intent makes. Then the cascade READING what was written, because a text edit
that produced something `MdCss` could not parse would pass every byte
comparison and break the document. And on the page: the enumerated list, a
command that is on no list answering "", and the page drawn in the colour the
command wrote.

*Recorded for the next reader:* `property` is a name the compiler treats as its
own, and a parameter called that fails with an internal error rather than a
message.

### Stage M — three views instead of a switch — ✅ done

The switch of Stage B, met by a reader, read as a wizard: "make a deck", "edit
the preview", "again to confirm", for what are three tabs. Replaced by the
shape §3 now describes — **Preview / PPTX / DOCX**, edited independently, with
one `↻ override from .md` as the only thing that discards a view's work.

`view` is the single variable that says which document is on screen; `deckOn`
and `docOn` now say only that a view EXISTS and keeps its edits while the
reader is elsewhere. Drawing off the second alone was a bug of exactly the kind
this plan is about: clicking back to Preview showed the Preview tab selected
with the Word page still painted under it, because the Word document was still
there. `showsDeck` / `showsDoc` are the two questions kept apart, and `listFor`
records which view the display list on the canvas was built for — `built` says
the list is up to date with the DOCUMENT, which is not the same as it being the
right document.

*The check:* the page's own, driving the tabs. Edit the deck, go to Preview,
change the markdown, come back: the edited deck is still there and the new
markdown did not touch it; `↻ override from .md` rebuilds it. And in both
directions, the canvas — leaving DOCX draws the markdown again, and coming back
draws the Word document that never heard about it. Asserting the TAB alone
passed with the bug in.

Two things that came out of looking at it on screen:

- **A picture is bytes in the Word document too.** `MdToDocx` drew
  `![alt](src)` as italic alt text, so the same markdown lost its picture
  depending on which tab the reader was on. It now carries a `DocImage` from
  the same `Vfs` the layout and the deck read — 240pt in the preview is 320 CSS
  px on a page `DocxLayout` measures in px, which is the same fraction of the
  page, the thing a reader compares. A picture nobody has is alt text in all
  three, and counted.
- **`body` is `document`.** A sheet that says `body { color: … }` changed
  nothing and said nothing, which is the worst kind of refusal. It is now the
  same selector under the name a CSS author reaches for first.

### Stage N — the editors themselves, not pieces of them — ✅ done

Stage H said the deck would be `PptxEditor`'s and the page would keep only
its chrome, and Stage K said the same of `DocxEditController`. What was built
took the MODEL and the OPERATIONS from each editor and left the rest here:
the page drew a slide through `PptxToEvg.slideToEvg`, the element-tree road,
which cannot draw a custom path — so every diagram on the deck came out as
the bounding boxes of its edges, at the top-left of an A4-shaped list, with a
click that selected and nothing that could drag, resize, type or undo. The
Word tab drew a bare page with no strip, no ruler, and — through a call to a
`docAddFace` that did not exist, swallowed by a `try` — no fonts. A reader
comparing either tab with the pptx and docx pages found two different
programs, and every fix to those pages missed these. That is the pattern seam
[`PLAN_EDITOR_KERNEL.md`](PLAN_EDITOR_KERNEL.md) §2 describes, arrived at by
taking too little rather than by writing too much.

So the page holds `PptxWeb` and `DocxWeb` — the seams the two pages run on —
and attaches a presentation and a document to them (`attachPresentation`,
`attachDocument`) rather than a file. The frames are theirs: strip, slide
panel, properties, notes, selection handles, caret, ruler, status line. The
pointer and the keyboard go through the same browser modules those pages
attach, `pptx-host.mjs` and a `docx-host.mjs` extracted from the docx page for
the purpose, so a press means one thing on every page that has a slide. The
markdown page keeps the canvas, the fonts, the tabs and a page pill that asks
each editor for its own page or slide.

Three things came with it, each the same shape — one road, and the one the
editors already take:

- **A diagram is geometry in the Word document.** `RichDocument` grew a
  `DocDrawing` — the diagram's own element tree with its notation and source
  — laid out whole like a chart and painted by `DocxView` through
  `EVGDisplayList.scaleBy` and `offsetBy`, so `MdToDocx` carries a fence the
  way `MdToPptx` does instead of writing its name.
- **The deck's drawing is the size it was laid out at.** `PptxFromEvg`
  defaults to 0.75 points per unit, right for a CSS-pixel list and wrong for
  this deck, which is placed in the layout's own units 1:1; every diagram was
  three quarters of its column.
- **A page keeps its labels.** RangerFlow does not draw a word under five
  SCREEN pixels, and applied that to a page fit: a gantt fitted into an A4
  column lost every label, in the PDF and on the slide. `labelFloorPx` is
  now a screen rule that `buildForPage` and `buildForExport` turn off.

*The check:* the page's own, driving the tabs — the deck frame has PATHS in
it and its title sits in from the corner; a press through the host module
selects a shape; the Word frame has the strip in it, draws a diagram's edges
as paths and its labels as text, takes a typed word, and an edited document
does not follow the `.md` until `↻ override from .md`. Plus `MdDocxTest` on
the drawing block, the laid-out line and the marks inside its box;
`MdPptxTest` on the group's size against the scene's own; and
`MarkdownTest.narrowLabels` on a gantt at a width that forces the fit under
the old floor.

### Stage O — what a reader met on the two tabs — ✅ done

Nine things from the first hour with Stage N on screen, each small and each
the kind that only shows up in use:

- **A caret a word away from its keys.** The page registered its faces by
  the layout's names — `Open Sans-Bold` — and the editors ask the browser
  for `Open Sans` at weight 700, which it had not got, so it synthesised a
  bold from the regular face, wider than the one Ranger measured. The same
  bytes are registered under the plain family with a weight and a style too.
- **Pages that end where a reader can see them.** `DocxApp` has a
  `continuous` frame: every page down it with a gap, `docScroll` for where
  the window looks, the caret followed into the stack, a press mapped to the
  page under it. The docx page keeps one page that turns; the markdown page
  stacks. And `zoom`: a pinch on the canvas (two fingers, in
  `docx-host.mjs`) or Ctrl+wheel, the paper drawn bigger through the same
  `scaleBy` the drawing uses.
- **A strip that reads.** The Text Box button's picture was painted stacked
  over a word the tree strip had laid beside it; `EVGToolbarView.largeInline`
  says which layout the strip made. Bold, italic, size and colour moved to
  Home beside the font, where a reader on a slide reaches for them, with
  `text.size.up` / `text.size.down` as two-point steps on the selection.
- **A deck that is a deck.** `MarkdownWeb.deckDefaults`: an A4 landscape
  sheet and a 20-point body under whatever the template and the front
  matter say — and NOT the page's sheet dropdown, which is the markdown's
  paper. Its own `⬇ PDF`, every slide a page, through the road
  `PptxRenderApi.toPdfDeck` takes; and the strip's Save and Print reach the
  page through `onFileRequest`, which the page had not passed.
- **Override, always offered, asked first.** The button is live on an
  untouched view — a reader may want the deck the markdown makes NOW — and
  confirms only when it would cost edits.
- **A drawing is an object on the Word page too.** Click selects it, the
  size buttons scale it, and its source opens in the left pane's `diagram`
  tab on either tab — `MdDeckDiagram.redraw` for the deck,
  `DocxViewer.replaceDrawing` for the page — so a fence is edited where it
  is drawn. Not RangerFlow's own surface yet: that editor runs on this same
  engine and the round trip is the same source in and the same tree out, so
  it is a pane away rather than a project away.

*The check:* the page's own, again — a landscape slide, a title set at 40pt
made 42 by one press, a `%PDF` from the deck, `save` back from the strip,
an override refused and then taken, a drawing selected by a click with its
source in the pane, drawn again with a node added and refused half-typed,
grown by a press, a sixty-paragraph document whose last page is what the
frame shows after the pill, and letters twice the size at zoom 2.

### Stage P — the strips, in the order every suite settled on — ✅ done

Stage O put the text buttons on Home; the row was still a wall. Both strips
are now grouped the way Docs and Syncfusion draw theirs, and the way a
reader scans a formatting row: undo, face, size, weight, colour, paragraph.

- **The deck.** *File* is what you do to the deck — Open, Save, Print, Show.
  *Home* is one row that fits a pane: undo and redo; Font, A−, A+; B, I and
  a colour dropdown of six inks; alignment and list as two dropdowns rather
  than seven buttons; the editing switch; and Previous and Next at the tail,
  where a pane too narrow clips a pair the page has another way to do.
  *Insert* keeps the large Text Box beside the shapes and the picture.
  *Arrange* is what is done to shapes — copy, paste, duplicate, delete, the
  format painter, front and back, group, lock, flip, line up — and the
  Format tab is gone, because it was the same text buttons a second time.
  *Slides* is the deck: add, duplicate, delete, First and Last, notes,
  properties, outline, palette, direction.
- **The page.** *File* is Save and Print. *Home* is undo and redo; the face
  in a text field, A−, the size, A+; B, I, U as toggles and the colour;
  outdent and indent, which `DocxApp` now has as `text.outdent` and
  `text.indent` (the Tab the viewer already answered, given a button); and
  the Editing switch, labelled. *View* is the two page buttons and the
  direction. Nothing was invented for it: the Word model has no paragraph
  alignment or list commands yet, so the strip does not show them.
- **The strip itself.** `EVGToolbar.addUnderMenu` inserted a dropdown's
  entries into the list without moving the tab ranges after them, so a
  font list filled in later took the last button off Home. Fixed where it
  was wrong, and `PptxFrameTest` asks of the blank deck only that the panel
  is its own list — the Home strip alone is now half that frame.

*The check:* every pptx and docx suite, the toolbar suite, and both pages'
smoke runs; and the row itself at the markdown page's pane width, where
the tail button is inside the pane rather than cut by it.

---

## 11. What is left

- **A `.docx` FILE.** The model is built, editable and drawable; this
  repository has no WordprocessingML writer. Stage K says so.
- **`VfsOpc` and `VfsReal`** — [`vfs/PLAN_VFS.md`](vfs/PLAN_VFS.md) V4 and V5.
  Neither has a consumer yet, and a provider written before its consumer is a
  provider written against a guess.
- **An inline picture.** `![](x)` on a paragraph of its own is a picture;
  anywhere else it is alt text, because a picture on a text baseline is a
  different question and one markdown almost never asks.
- **A heading colour.** `h1 { color: … }` is refused by name: `MdStyle` has one
  text colour and headings take it. A dark template wants a second, and it
  wants it in the layout, the deck and the Word document at once.
- **`style.css` in the three views.** The stylesheet dresses the Preview and
  the documents CONVERTED from it; editing the sheet after a view is its own
  document does not re-dress that view, because nothing feeds it any more.
  Whether a sheet should be a live thing on the rich side is a separate
  question from whether markdown can express it.
- **A table in a Word document.** `RichDocument` has tables; `MdToDocx` writes
  the rows as tab-separated paragraphs and says so.
- **The Word page's size.** `MdToDocx` states the section in twips from the
  layout's units, which are CSS pixels read as points, so the Word page is
  four thirds of the markdown's and wider than the pane it is shown in. The
  deck has the same reading in the other direction. Consistent, and named.
- **Deleting a drawing.** A `DocDrawing` lays out, paints and reads aloud;
  the edit controller does not yet delete one the way it deletes a chart.
- **Font embedding in a deck** — `p:embeddedFontLst` and an `fntdata` part.
  Named in `MdToPptx` as the cost it is: a deck names its faces and carries
  none, so a reader without them substitutes and the text reflows inside its
  boxes.

## 12. The riskiest assumptions

- ~~**That a read-only preview is acceptable in MD mode.**~~ **Settled by
  Stage M, the other way.** It was built and it was wrong: the Preview view
  follows the `.md` and takes keystrokes, and the two rich views are separate
  documents with their own editors, so there is no second writer to guard
  against and nothing to make read-only. The machinery is not wasted — the
  layout, the caret, click-to-offset and the selection are what the rich
  editors sit on.
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
