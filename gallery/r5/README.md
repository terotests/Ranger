# r5 — the markdown page as a Ranger app

The markdown viewer at [`/markdown/`](https://terotests.github.io/Ranger/markdown/)
is an HTML form: two rows of selects and buttons over a textarea and a canvas.
This is the same engine under a chrome that is **itself a Ranger program**,
drawn by EVG, and it is live at
[`https://terotests.github.io/Ranger/r5/`](https://terotests.github.io/Ranger/r5/).

**License: AGPL-3.0-or-later** — see [`../LICENSE`](../LICENSE).

```
┌ rail (≥768px) ┐┌──────────── side ──────────────────────────────┐
│ Preview       ││ head: name · document.md | style.css · ‹ 1/3 › │
│ Slides        │├───────────────────┬────────────────────────────┤
│ Word          ││ ScriptEditor      │ the document, drawn by     │
│ Source        ││ (markdown, with   │ MarkdownWeb — preview,     │
│ …             ││  its tokens)      │ the deck or the Word page  │
│ Open, Layout  │├───────────────────┴────────────────────────────┤
│ Format, Export││ bottom bar (<768px): Edit Preview Slides Word ⋯ │
└───────────────┘└────────────────────────────────────────────────┘
```

- **One tree, one stylesheet, one breakpoint.** The rail and the bottom bar
  are both in [`web/r5.css`](web/r5.css); `@media (max-width: 767px)` hides
  the rail and `@media (min-width: 768px)` hides the bar. On a phone the
  editor and the document are full-screen tabs; on a desk they are panes
  side by side, and *Source* on the rail folds the editor away.
- **The choices are behind sheets.** *Open* (the samples, or a `.md` from
  the device), *Layout* (template, mode, paper), *Format* (bold, headings,
  lists, slide breaks, undo) and *Export* (PDF, HTML, PPTX) each open a sheet
  over the page — from the rail on a desk, from *More* on a phone. The
  header's status line is gone; the build stamp is in the *More* sheet.
- **The source is typed into the code editor.** `ScriptEditor` from
  [`gallery/datagrid`](../datagrid/src/script/ScriptEditor.rgr), with a
  markdown tokenizer of its own ([`src/R5MdLanguage.rgr`](src/R5MdLanguage.rgr)):
  headings, fences, list markers, emphasis, links and `{.attributes}` each in
  a colour, on a light theme. The tab *style.css* puts the template in the
  same editor.
- **Two views of one source.** `MdEditController` (in the markdown module)
  owns the text; the editor's buffer is a view of it. An edit on either side
  becomes a *patch* on the other — a common prefix and a common suffix — so
  both keep their own undo. The preview still takes the keyboard: click into
  it and type, and the editor follows.
- **The slides and the Word page follow the markdown.** While either is on
  screen, a new document, a keystroke in the editor, a template or a paper
  size reaches it. A *presentation* edit made there — a chart resized, a
  heading recoloured, a paragraph spaced, a font changed — survives that:
  the view is built again from the markdown and the reader's look is put
  back on the shapes and paragraphs that still say the same thing, or on the
  same block where only the words moved ([`src/R5Merge.rgr`](src/R5Merge.rgr)).
  An *invasive* edit — words retyped on the slide, a shape or a paragraph
  added or removed — keeps the view as the reader left it, and the head
  offers "↻ from .md" to build it from the markdown again.
- **PDF of what is on screen.** *Export → PDF* prints the sheets of the
  markdown, the slides as the reader left them, or the Word pages as the
  reader left them; the slide and Word editors' own *Print* do the same.
- **One canvas.** The document is drawn first, through the camera
  `MarkdownWeb` already keeps, moved to where the layout put the pane; the
  chrome is drawn over it with the canvas kept. The slide and Word editors
  draw in the same pane through their own host modules, exactly as they do
  on the pptx and docx pages.

## Files

| File | What it is |
| --- | --- |
| [`src/R5App.rgr`](src/R5App.rgr) | The app: the tree, the sheets, the editor, the pointer, the keyboard, the two-way patch, the host's JSON seam |
| [`src/R5MdLanguage.rgr`](src/R5MdLanguage.rgr) | Markdown as an `EditorLanguage` plugin for the code editor |
| [`src/R5Merge.rgr`](src/R5Merge.rgr) | A reader's presentation edits on the slides or the Word page, carried across a rebuild from the markdown |
| [`web/r5.css`](web/r5.css) | The chrome's EVG stylesheet, light, with the breakpoint |
| [`web/main.js`](web/main.js) | The browser host: WebGL frame, pointer, hidden text field, fetches, downloads |
| [`web/index.html`](web/index.html) | The page — a canvas, the pane's input surface, the text field |
| [`web/build.sh`](web/build.sh) | Compiles the app and assembles `web/dist/` |
| [`web/smoke.mjs`](web/smoke.mjs) | Opens the build in headless Chrome and lets the page check itself |

## Building and running

```bash
npm run r5:web            # compile + assemble gallery/r5/web/dist
npm run r5:web:serve      # …and serve it on http://localhost:8009
npm run r5:web:test       # …and check it in headless Chrome
```

`?sample=deck`, `?view=deck|doc|edit|preview`, `?mode=paged|slides`,
`?theme=corporate` open the page in a state; `?page=390x800` lays it out for
a phone in a desk's window, for a screenshot; `?selftest=1` runs the page's
own checks and writes the verdict into the DOM.

## The host's seam

`R5App` is what the browser holds. It takes calls (`setPageSize`, `press`,
`pointerDown`, `key`, `text`, `chord`, `attachFont`, `setSource`, …) and
hands back JSON (`chromeJson`, `paneRectJson`, `docFrame`, `docViewFrame`,
`a11yJson`) plus a cheap `revision()` the host paints on. What it wants the
browser to do — open the file picker, download a PDF, fetch a sample or a
template — leaves as a request string through `takeRequest()`, so the same
class runs unchanged under Node in a check.
