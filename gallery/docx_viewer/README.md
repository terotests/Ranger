# DOCX viewer (Ranger prototype)

Minimal **WordprocessingML → RichDocument → SoftCanvas** pipeline. Goal: show a
few real `.docx` packages with paragraphs, runs, styles, alignment, and lists —
the first step toward a Word-like rich document editor on EVG.

```text
document.docx
      ↓
DocxPackage  (ZIP / OPC via gallery/zip)
      ↓
WordMlParser
      ↓
WordStyleResolver   (defaults → style → direct formatting)
      ↓
RichDocument        (paragraph + text spans — not OOXML run indices)
      ↓
DocxLayout          (flow wrap + page break)
      ↓
DocxView / SoftCanvas / PNG
```

Not a full Word clone. Round-trip fidelity, tables, images, headers/footers,
and editing come later. The text-editor core (`gallery/text_editor`) remains the
caret/selection/IME layer to plug in afterwards.

## Fixtures

Three hand-built packages under `fixtures/`:

| File | Covers |
| --- | --- |
| `hello.docx` | Title style, mixed bold/italic runs |
| `styles_demo.docx` | Heading1/2, center/right align, color + size |
| `lists_demo.docx` | Bullet + numbered paragraphs via `numPr` |

Regenerate: `npm run docx_viewer:fixtures` (or `python3 fixtures/make_fixtures.py`).

## Run

```bash
npm run docx_viewer:test    # parse + layout checks → ALL PASS
npm run docx_viewer:demo    # PNG pages: docx_hello.png, docx_styles.png, docx_lists.png
```

## Model notes

Caret positions (future editor) should use `paragraphId + textOffset`, with
formatting as spans. Import merges adjacent equivalent `w:r` into spans so the
editor is not tied to Word's run fragmentation.
