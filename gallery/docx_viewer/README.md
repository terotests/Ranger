# DOCX viewer (Ranger)

WordprocessingML → normalized `RichDocument` → section-aware `DocxLayout` →
SoftCanvas / EVG. Aimed at a **credible multi-page business DOCX viewer**, not
scaffolding.

```text
DocxPackage
     ↓
WordMlParser
     ↓
WordStyleResolver / WordNumbering / relationships
     ↓
RichDocumentModel  (blocks: paragraph | table | pageBreak | sectionBreak)
     ↓
DocumentLayout → Page[]  (resolved geometry)
     ↓
EVG / SoftCanvas
```

EVG never sees `w:pStyle`, `w:numId`, or OOXML inheritance — only resolved
fonts, colors, and placed geometry.

Caret model (future edit): **`paragraphId + textOffset`**, not run indices.
Adjacent equivalent `w:r` are merged into format spans.

## What works

- **Styles**: `docDefaults` → `basedOn` (loop-guarded) → paragraph / character
  style → direct `pPr` / `rPr` → `ResolvedRunStyle` / paragraph metrics
- **Text**: font size, bold/italic/underline, color, alignment (incl. justify
  flag), left/right/first-line/hanging indent, spacing before/after, line
  spacing, wrap to content width
- **Numbering**: `numbering.xml` → `WordNumbering` → `ResolvedListMarker` via
  `%1`/`%2`/`%3` substitution (not baked into paragraph text)
- **Tables**: `w:tbl` / grid / rows / cells / `gridSpan` / fill / borders /
  cell padding; flow layout (not DataGrid)
- **Pagination**: `sectPr` page size & margins, portrait/landscape, explicit
  page breaks, section breaks, paragraph flow across pages, header/footer
  bands, multi-page gap in `presentAll`
- **Header / footer**: relationship parts, default text (architecture allows
  first/odd/even later)
- **Images**: DrawingML → JPEG (`JPEGDecoder`) and PNG (`DocxPng` → SoftCanvas
  `ImageBuffer`), extent / aspect, inline flow

## Fixtures

| File | Covers |
| --- | --- |
| `hello.docx` | Title + mixed runs |
| `styles_demo.docx` | Headings, align, color/size |
| `lists_demo.docx` | Bullets, decimal, multilevel |
| `images_demo.docx` | DrawingML JPEG |
| `05-table-basic.docx` | 3×3 table |
| `06-table-format.docx` | Cell fill + borders |
| `07-table-merged.docx` | `gridSpan` |
| `08-pages.docx` | Multi-page flow |
| `09-page-break.docx` | Explicit page break |
| `10-landscape-section.docx` | Landscape section |
| `11-mixed-sections.docx` | Different margins |
| `12-header-footer.docx` | Header/footer parts |
| `13-images-mixed.docx` | JPEG + PNG |
| `14-styles-indent.docx` | Indent / underline / justify |
| `20-business-report.docx` | Kitchen-sink ~4–7 page report |

Regenerate: `npm run docx_viewer:fixtures` (`ffmpeg` + Pillow).

## Oracles

| Layer | Command | Notes |
| --- | --- | --- |
| A. Ranger tests | `npm run docx_viewer:test` | Hard-fail |
| B. Semantic | `npm run docx_viewer:oracles` | python-docx ↔ `inspectJson` |
| C. Visual | `npm run docx_viewer:oracles:visual` | LibreOffice → PDF → PNG vs Ranger; skips if `soffice`/`pdftoppm` missing |

See `harness/ORACLES.md`.

## Run

```bash
npm run docx_viewer:test
npm run docx_viewer:demo          # PNG snapshots under gallery/docx_viewer/
npm run docx_viewer:oracles
npm run docx_viewer:module
npm run docx_viewer:window        # http://127.0.0.1:8770/
```

## Known limitations

- Not a full Word clone; no lossless DOCX round-trip / edit export yet
- SoftCanvas glyph metrics can clip the last letter(s) of long lines
- Justify is flagged but not full glyph-distributed justification
- Table row vertical merge, nested tables, floating images: out of scope
- Header/footer: default only (no different first / odd-even yet)
- Fields (PAGE) are static text unless authored that way in the fixture
- Visual oracle requires LibreOffice + poppler; advisory unless `--strict-visual`
- Editing proof-of-concept (TextEditCore) not wired in this pass

## Editing (MVP)

`TextEditCore` types (`DocumentPosition` / `DocumentRange` / `DocEditOp`) live in
`gallery/text_editor/src/TextEditCore.rgr`. DOCX binds them via:

```text
DocxEditController → RichDocumentEdit → RichDocument (paragraph + spans)
                 ↘ DocxLayout hit-test / caret geometry
```

Window host: toggle **Edit**, click a body paragraph, type / Backspace / Delete /
Enter / Ctrl+B / Ctrl+Z. Same SoftCanvas layout drives caret placement.

v1 scope: body paragraphs only (not tables/headers yet).
