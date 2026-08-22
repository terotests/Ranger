# A slide editor someone can use without a mouse

How the PPTX editor becomes reachable from the keyboard and legible to a screen
reader, what already exists to build it out of, and what a slide needs that a
spreadsheet did not.

Status: **design**. Nothing here is built. The prompt was concrete — Tab does
not move to the next element — and that turned out to be the visible corner of
a bigger gap: this editor has no notion of focus at all.

Licence policy: as with [`PLAN_EDITOR.md`](PLAN_EDITOR.md), everything here is
clean-room. Behaviour is read off published specifications (WCAG 2.2, WAI-ARIA
1.2, the ARIA Authoring Practices) and off observable behaviour, never off
another editor's source.

---

## 1. Where this actually stands

Not "accessibility is weak". Specifically:

| | DataGrid | PPTX editor |
| --- | --- | --- |
| A semantic tree beside the display list | `GridView.a11yTree()` | — |
| A DOM mirror over the canvas | `gl/evg-a11y.js` | — |
| A focus model the app owns | caret cell | — |
| One tab stop, moving with focus | yes | — |
| Toolbar buttons named and pressed-state published | yes | — |
| A dialog that is `aria-modal` and hides what is behind it | yes | — |
| Keyboard-only operation of the main surface | yes | partly |
| A browser test that presses real keys | `web/editor/keyboard.mjs` | — |

So this is not a research problem. The mechanism exists in this repository,
works, and is tested; the deck simply never grew one. Most of §5–§8 below is
porting, and the genuinely new thinking is §3 and §4.

### What the keyboard does today

Read out of `PptxApp.update`:

- **Page Up / Page Down** turn the slide, always.
- **Arrows** nudge the selected shape, or move the caret while typing.
- **F2 / Enter** put a caret in the selected shape; **Escape** takes it out.
- **Tab / Shift+Tab** indent and outdent a list item, while typing.
- **F5** starts the show; in the show, space, arrows, B, P, L, E, N.
- **Ctrl chords** — z, y, b, i, c, x, v, a, d, g.
- **Home / End** go to the first and last slide.

What is missing is the thing all of those presuppose: something has to be
selected before any of them is useful, and the only way to select a shape is to
click it. A person who cannot use a pointer cannot reach the first shape, so
none of the rest is reachable either. That is the whole bug behind "Tab does not
move to the next element".

---

## 2. Two things Tab has to mean, and the trap between them

Tab is overloaded here, and the overload is already half-built:

1. **Tab moves to the next shape.** What the prompt asks for, and what
   PowerPoint, Keynote and Slides all do.
2. **Tab indents a list item.** Added with list support; also what every
   editor does *while text is being edited*.

These do not conflict as long as the mode decides — caret in a shape means
indent, no caret means next shape — but the first one creates a **keyboard
trap** (WCAG 2.1.2) the moment Tab cycles within the slide and never leaves it.
The DataGrid's code editor hit exactly this and solved it: Escape arms an
escape hatch and the next Tab leaves the component. The same rule applies here,
and the same test should exist, because a trap that is only documented is still
a trap.

The mode rule, stated once:

| Where the focus is | Tab | Shift+Tab |
| --- | --- | --- |
| Caret in a shape's text | indent the list item | outdent it |
| A shape selected, no caret | next shape in z-order | previous shape |
| Nothing selected, slide has focus | first shape | last shape |
| After Escape (hatch armed) | leave the editor | leave backwards |

---

## 3. What a slide needs that a grid did not

A spreadsheet's accessibility tree is easy in one specific way: a grid *is* a
tree. Rows contain cells, cells have addresses, the reading order is the
geometry, and "row 7 of 1,000" is a fact. A slide has none of that.

**There is no natural order.** A slide is a z-ordered list of shapes, and
z-order is a painting order — it says what is on top, not what to read first.
Reading a slide bottom-of-the-stack first gives a background rectangle before
the title. Three candidate orders, and the plan should pick one and say so:

- **Z-order.** What the file states, stable under editing, and what PowerPoint's
  own Tab order uses. Wrong for reading, right for editing.
- **Geometric.** Top-to-bottom, left-to-right, banded into rows so a two-column
  layout reads as two columns rather than zig-zagging. Right for reading, and it
  moves when a shape moves.
- **Placeholder-first.** Title, then body, then everything else in one of the
  above. Closest to what a slide *means*, and the model already knows which
  shapes are placeholders (`isPlaceholder`, `phType`).

**Proposal:** placeholder-first, then geometric, for the reading order the tree
publishes; z-order for the Tab order, because Tab is an editing gesture and has
to be stable while things move. They differ, they are both right, and saying so
explicitly is better than one order that is wrong for half the users.

**Most shapes have no name.** `Google Shape;117;p20` is not a label. A shape's
accessible name should come, in order: its alt text (`descr` on `cNvPr` — which
the parser does not yet read, and should), then its text content, then its
placeholder role ("title"), then a description of its geometry ("rounded
rectangle"). A decorative shape with no text and no alt text should be
`aria-hidden`, not announced as "graphic".

**A slide is a document, not a control.** The tree wants `role="document"` per
slide, with the deck as a `tablist` of slides down the side — which is what the
thumbnail panel already is, visually.

---

## 4. The focus model

The app has to own focus, because the canvas cannot. Today `PptxEditor` has a
selection and a caret; neither is focus:

- A **selection** can be several shapes. Focus is exactly one thing.
- The **caret** exists only inside text.
- Focus also has to be able to sit on things that are not shapes at all: the
  toolbar, the slide panel, the notes field, a dialog.

So: a `focusId` on `PptxApp`, naming a node in the same id space the tree uses,
with a small number of **focus regions** cycled by F6 (the convention Office
uses and the APG documents for exactly this): slide panel → slide canvas →
notes → toolbar. Within a region, Tab and the arrows move; F6 leaves it. This
is what makes the toolbar reachable at all without a pointer, which it is not
today.

Selection follows focus on the canvas — focusing a shape selects it — so every
existing command keeps working unchanged, which is the property that makes this
affordable.

---

## 5. The tree

One walk, two outputs, exactly as [`../evg/PLAN_ACCESSIBILITY.md`](../evg/PLAN_ACCESSIBILITY.md) §3
argues: `PptxView.a11yTree()` beside `PptxView.buildDisplayList()`, over the
same resolved model, so the two cannot drift.

```
deck ──► resolve ──► walk ──┬─► EVGDisplayList  ──► WebGL / SoftCanvas
                            └─► EVGA11yTree     ──► DOM mirror
```

Shape of it:

```
application "Ranger PPTX"
├── toolbar                      (EVGToolbar.a11y already emits this)
├── tablist  "Slides"            one tab per slide, selected = current
│   └── tab  "Slide 3: Why now?" name from the title placeholder
├── document "Slide 3"           the canvas
│   ├── heading  "Why now?"      the title placeholder
│   ├── list                     a bulleted or numbered body
│   │   └── listitem …
│   ├── image    "…"             alt text, or hidden when decorative
│   ├── table                    rows, columnheaders, cells
│   └── group    "…"             a grouped shape, with its children inside
├── textbox  "Notes"
└── status                       live region: "Slide 3 of 19"
```

The roles all exist in `EVGA11yRole` already; `table`/`row`/`cell` map onto the
grid roles. Nothing new is needed in `EVGA11yTree`.

## 6. The browser half

`gl/evg-a11y.js` is host-agnostic — it mirrors a tree of nodes with rectangles
onto real DOM over a canvas, reusing elements by id. It should need no changes;
the deck page adds the same three lines the DataGrid page has, plus `?a11y=0`
for telling a mirror bug from an app bug.

## 7. Text editing, honestly

The caret in a shape is the same problem the DataGrid's cell editor has and has
not finished solving: a `role="textbox"` carrying the buffer announces itself
and lets keys through, but IME, dictation and braille *entry* need a real
`<input>` with the app still owning the caret. This plan should not pretend
otherwise, and should schedule it as its own step rather than as a footnote —
Finnish, Japanese and dictation users are not an edge case.

## 8. The show

Present mode takes the whole keyboard and draws no chrome. For a reader it
should be a `document` per slide with a live region announcing the slide and its
build steps, and presenter view is a second document with the notes in it. This
is small once §5 exists, and worth doing: a presenter using a screen reader is
reading the notes, which is the one thing present mode already has.

---

## 9. Order of work

Each step is useful on its own and testable on its own.

| # | Step | Test |
| --- | --- | --- |
| 1 | `focusId` and focus regions; **Tab moves between shapes**; F6 between regions; Escape arms the hatch | `pptx:editor:host:test` |
| 2 | `descr` alt text through parser, model, resolver and writer | `pptx:test`, `pptx:writer:verify` |
| 3 | Accessible names: alt text → text → placeholder role → geometry; decorative shapes hidden | new `pptx:a11y:test` |
| 4 | `PptxView.a11yTree()`: slide, headings, lists, tables, images, groups | `pptx:a11y:test` |
| 5 | Toolbar, slide tablist, notes, status region | `pptx:a11y:test` |
| 6 | DOM mirror in the standalone page; one tab stop; activation presses the app where the thing is | `pptx:web:test` |
| 7 | A real keyboard test in a real browser, including the trap | new `pptx:web:keyboard` |
| 8 | A real `<input>` behind the caret, for IME and dictation | `pptx:web:keyboard` |
| 9 | The show and presenter view | `pptx:a11y:test` |

Steps 1 and 2 are worth doing even if the rest waits: step 1 is the reported
bug, and step 2 is a data loss — alt text in a deck we open is thrown away and
not written back, which affects every user of that file and not only ours.

## 10. How this gets checked without owning a screen reader

The same three levels the DataGrid uses, and they caught real bugs there:

1. **The tree, in Ranger.** Roles, names, order, focus, id stability, and the
   lints `EVGA11yTree` already carries (a node with no name, a control that is
   not reachable, a duplicate id).
2. **The DOM, in headless Chrome.** The mirror exists, the canvas is
   `aria-hidden`, there is exactly one tab stop, and it is where the app says
   focus is.
3. **A real keyboard, through Playwright.** Focus, `keydown`, `beforeinput` and
   composition — the part of a canvas editor that is impossible to unit test and
   easiest to get wrong.

And once, by hand, with VoiceOver — `npm run pptx:web:serve`, ⌘F5 — because
none of the three tells you whether the announcement makes sense.

## 11. What this plan does not claim

- It does not make the WebGL renderer accessible. It cannot; §1–§2 of the EVG
  plan explains why, and the answer is the parallel tree.
- It does not cover colour contrast, motion or timing, which are real WCAG
  obligations for a *presentation* tool (transitions, auto-advance, the laser)
  and deserve their own pass.
- It says nothing about the native SDL host, which has the harder version of
  this problem and no bridge on Linux.
