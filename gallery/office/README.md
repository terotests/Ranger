# gallery/office — infrastructure the office editors share

There are three OOXML editors in this gallery — [`docx_viewer`](../docx_viewer/README.md),
[`datagrid`](../datagrid/README.md) and [`pptx`](../pptx/README.md) — and they
are three different applications. Word pagination, Excel formulas and
PowerPoint's master/layout inheritance have nothing to say to each other, and a
single `OfficeDocument` that tried to hold all three would be worse at all three.

What they share is the machinery underneath. It goes here.

> **The line this directory draws.** Don't merge Word, Excel and PowerPoint into
> one document model. Merge the infrastructure underneath them.

The container half of that lives next door in [`gallery/ooxml`](../ooxml/README.md):
one OPC package reader, and the XML text rules.

## What is here now

```text
gallery/office/
    text/
        OfficeFont.rgr         which face draws this run
        OfficeTextRun.rgr      a stretch of text drawn in one face
        OfficeTextMetrics.rgr  offset → x, and x → offset
        tests/ tools/
```

```bash
npm run office:font:test       # JavaScript and C++
npm run office:metrics:test    # likewise
```

### `OfficeFont`

"The document says Calibri, bold and italic — what do I draw with?" was
answered three times, differently, and each answer was wrong in its own way:

| | what it did | what that cost |
| --- | --- | --- |
| `.docx` | `applyFace(bold)` — one argument | every italic run drew upright; Ctrl+I did nothing visible; the italic faces were never even loaded |
| `.xlsx` | built `"Family-BoldItalic"`, no space | the loader records `"Bold Italic"`; the misspelt name resolves to the family's **regular** face with a real `unitsPerEm`, so the "did I get a face?" check passed and every bold italic cell drew upright and light |
| `.pptx` | built the right name, never checked it existed | a deck naming a family with no italic measured against a fallback it never named |

One answer now. It knows what a face is called, whether that *exact* face is
loaded — which `FontManager.hasFont` cannot tell you, because it matches the
**family** and says yes to a bold italic as soon as any face of the family is
there — and what to do when it is not:

```text
Family + bold + italic     what the document asked for
Family + bold              lose the slant before the weight: a bold word drawn
Family + italic            upright still reads as emphasis, an italic one that
Family                     loses its weight does not
fallback + the same walk
```

It answers `""` when there is nothing at all, so a caller can tell *"I drew
something else"* from *"there was nothing to draw with"*.

The **family alias map** is here too — `Calibri → Open Sans`,
`Times New Roman → Droid Serif`, and unknown names to distinct families rather
than all to one, because sending every unknown name to the same face makes
choosing a font in a toolbar look like a no-op. It began in the spreadsheet,
the only one of the three that had one. One map means a document opened in two
of these editors looks the same in both.

## What goes here next

The order below is by leverage. See [`gallery/ooxml/README.md`](../ooxml/README.md)
for the full roadmap and what each item is worth.

### `OfficeTextMetrics`

The other half: offset → x and x → offset, over an `OfficeTextRun` — start,
end, family, size, bold, italic and nothing else. A **view**, not a model: a
format turns its own runs into a list of them for one measurement and throws it
away. The two questions must be each other's inverse, and two copies of one
walk is exactly how they stop being.

Two differences between the copies it replaced were not accidents:

- **Per-run rounding.** Word's ink advances x by an *integer* per run, so its
  measurement truncates the same way — summing in full precision and rounding
  once gives a different answer, and the difference is where the caret ends up.
  PowerPoint's painter carries doubles throughout, so rounding per run there
  would be the error instead. The caller says which.
- **Per-run size.** A slide's runs each state a point size; a Word line is laid
  out at one, because `tr.wrap` broke it at one. A run with no size of its own
  takes the caller's.

### The rest of the typography core

- **The `.pptx` layout still keeps its own walk.** Its measurer answers with an
  estimate (0.52em) when no renderer is attached at all — a headless export, a
  test — and giving the shared walk that concept is a design question rather
  than a move. The face decision underneath it is already shared.
- **Per-span size and family in the document reader.** Neither is honoured, for
  one reason: `tr.wrap` breaks a paragraph in a single face at a single size,
  so measuring the pieces in another would put the line ends somewhere the
  breaks are not. Wrapping has to learn about runs before measuring can.
- **Shaping and line breaking.** One pipeline — unicode text → font resolution
  → shaping → glyph runs → measurement → line breaking — with Word's,
  PowerPoint's and Excel's own layout rules on top of it, not merged into it.

### `drawing/` — the DrawingML core

`PptxColor`, gradients, line styles, shadows, transforms and geometry are in
`PptxModel`, but DrawingML is not PowerPoint's: `.xlsx` charts and drawings and
`.docx` floating drawings use it too.

### `core/` — identity, revisions, assets, transactions

Stable `EntityId` (PPTX's `editId` is already this, done right), `Revision`, an
`AssetStore` so one logo on forty slides is one asset, and one transaction and
history framework instead of the three there are now.
