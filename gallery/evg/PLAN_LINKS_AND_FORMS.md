# Links, and the question of forms

Two asks, arriving together and answered separately, because only one of them
belongs in the renderer.

1. **A hyperlink.** A destination on a rectangle: clickable in a PDF, and — in
   an EVG application — a click the host is told about so it can navigate.
2. **`<input>` and `<form>`.** Named values and a submit, with the familiar
   HTML shape, so a form can be built out of EVG the way one is built out of
   HTML.

Status: **design**. Nothing here is built. §2 is small and the recommendation
is to build it; §4 is the answer to "does application logic leak into the
renderer here", and the answer is *for the link no, for the form yes — unless
one thing is dropped*.

---

## 1. What is actually missing today

Not "the link renders badly". There is no link.

- `EVGElement` has no `href` and no destination of any kind. Nothing between
  the tree and the paint carries one.
- `EVGDrawCmd` has no field for it, so the display list cannot carry one
  either — a link and a blue word are the same seven draw commands.
- `EVGPDFRenderer` emits no `/Annots`. A PDF page carries its link targets in
  an annotation array beside the content stream; without one, a link is ink.
- `MdLayout` DOES know: every `MdSeg` and every `MdBox` carries `link`, filled
  from the markdown. `MdToEvg` then drops it on the floor, both roads out.

So the markdown viewer colours links blue, and both the canvas and the PDF get
a blue word that does nothing. The information exists at the top of the pipe
and there is no pipe.

## 2. The link: one string, three consumers

A destination is not application logic. It is a string attached to a
rectangle, and every format EVG already targets has the concept natively: PDF
has `/Annots` with `/Subtype /Link`, SVG has `<a>`, HTML has `<a>`. A renderer
that cannot express what PDF, SVG and HTML all express is the one that is
missing something.

**The element.** `EVGElement.href:string`, settable through `setAttribute`
like every other attribute, inherited by nothing — a link is on the box that
was clicked, not on its children's behalf.

**The display list.** One more string slot on the text/rect command, interned
into the same pool as `text` and `fontFamily`, written as `link` by `toJson`
and as one more record slot by the binary encoder. The record format is
already grow-only by design — "each reader reads the slots it knows", which is
how radii were added without disturbing the pptx decoder that reads 23 — so
this costs nothing anybody else has to know about.

**The PDF.** Per page, an `/Annots` array; per link, a `/Rect` in PDF user
space, `/Border [0 0 0]` so the viewer draws nothing of its own over the
styling the layout already chose, and `/A << /S /URI /URI (…) >>` for an
external target or `/Dest` for an internal one. Internal is worth having on
day one: a markdown table of contents whose entries jump to their sections is
the same feature, and the layout already knows the page each heading landed
on.

**The canvas, and any other interactive host.** NOT a callback registered with
the painter. A hit test: `linkAt(doc, x, y) → string | null`, a pure function
over the display list the host already holds. The host owns the click, the
cursor and the decision — including refusing to follow it. A callback inside
the renderer would put the renderer in charge of when navigation happens,
which is the thing to avoid; a hit test hands back a fact and stops.

Adjacent, and free once the field exists: the same lookup gives the pointer
cursor on hover, and the a11y tree (`PLAN_ACCESSIBILITY.md`) gets `role: link`
with the destination as its description instead of an unnamed run of text.

## 3. Order of work, and what each step is checked by

| # | step | evidence |
|---|---|---|
| 1 | `href` on the element; carried into both roads of the display list | a test asserting the same link on the tree-built and directly-built lists — `MarkdownTest.presized` is the shape |
| 2 | `/Annots` out of `EVGPDFRenderer` | count the `/Link` annotations in the emitted bytes and check one `/Rect` against the laid-out box |
| 3 | `MdToEvg` stops dropping `MdBox.link` | the markdown PDF has as many link annotations as the document has links |
| 4 | `linkAt` over the display list; the standalone page follows one | the page's self-test clicks a known link and reads back the destination |
| 5 | internal destinations, and the table of contents jumping | a `/Dest` per contents entry, page number checked against the layout |

## 4. Forms: keep the shape, drop the verb

The honest answer to "is EVG the right place for this abstraction, or does
application logic leak through into the renderer?" is: **it depends entirely on
whether `action` and `method` come along.**

`<form action="/subscribe" method="post">` is HTTP in a renderer. EVG has no
business knowing what a URL is, what POST means, what an encoding is, or that
a network exists. Copy HTML literally and the leak is real and permanent.

But take the *shape* rather than the verb and nothing leaks:

- a **named, focusable box that carries a value** — which is an accessibility
  node with an editable value, and `EVGA11yNode` already has `id`, `name`,
  `value`, `role` and a rectangle, and `EVGFocus` already has tab order;
- a **group** those boxes belong to;
- one **event**: this group was submitted, here are its `name = value` pairs;
- one **flag**: this group is busy, and no second submit is emitted while it
  is set.

That is the whole of what a renderer can honestly own. Where the values go,
what they mean, whether it is a network call, a file write or a state
transition, and what to do when it fails — none of that reaches EVG. The busy
flag answers the double-post concern without EVG knowing that submission is
asynchronous: the host sets it before it starts and clears it when it is done,
and EVG's only obligation is to refuse to emit a second submit event in
between and to let the styling show it. Async never enters the renderer; it is
one boolean.

## 5. Where the widgets already live

This should not be built in EVG, and mostly does not need to be built at all.

`gallery/ui` already has the input layer: `InputCtl` models caret, anchor,
selection, word motion, `indexAtX`, `maxLength`, `readOnly` and `disabled`,
measured against a real `<input type="text">` through the conformance harness;
`SelectCtl`, `RadioGroupCtl`, `CheckboxCtl`, `ToggleCtl`, `SwitchCtl` and
`SliderCtl` cover the rest. `gallery/ui/PLAN_INPUTS.md` names `form` —
validation and messages — as one of the three Radix components still missing,
which is to say the form is already scoped as UI-library work by the people
who own the input story. `gallery/realtrainer` has its own controls, and
`gallery/text_editor` has the caret model for a multi-line field.

So the division is:

| layer | owns |
|---|---|
| **EVG** | the named value on a box, the group, the submit event, the busy flag — and nothing else |
| **`gallery/ui`** | the widgets: caret, selection, validation, messages, tab order, the `form` component itself |
| **the application** | what a submit means |

Building the form component in `gallery/ui` on top of controllers that already
exist, with EVG contributing only the four things above, keeps every part
where its tests already are.

## 6. Recommendation

Build §2 — it is small, it is a real defect (a PDF whose links do nothing),
and the information is already sitting in `MdLayout` waiting for somewhere to
go.

Take §4 as far as the four primitives and no further, and only when something
is actually being built on it. Put the `form` component in `gallery/ui`, where
`PLAN_INPUTS.md` already has it scoped, and let it be the first caller. A
renderer-side abstraction with no caller is how `action=` and `method=` end up
in EVG "for completeness" a year later.
