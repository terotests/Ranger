# EVG text editor (Ranger prototype)

A **100% Ranger** multiline text editor that owns its render pipeline through the
existing **EVG / SoftCanvas** stack — the same conceptual architecture as
[Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor), not a
`contenteditable` wrapper.

```text
canvas-editor                     this prototype
JS/TS editor model         →      EditorBuffer + EditorSelection
layout / typography        →      EditorLayout
HTML Canvas                →      SoftCanvas + UITextRenderer (EVG fonts)
browser                    →      Node (tests) / SDL2 host (future)
```

First feature-parity target is the
[grassator canvas text-editor tutorial](https://github.com/grassator/canvas-text-editor-tutorial)
(data → input → metrics → render → caret → edit → selection → scroll). Ace is
the later performance reference.

## Layout

```text
gallery/text_editor/
  src/           EditorBuffer, Selection, Layout, View, App, demo
  tests/         EditorTest.rgr  → compile to JS, run under Node
  bench/         editor_bench.rgr — shared-corpus timings
  docs/PLAN.md   design notes
```

## Run (JavaScript target)

From the repo root:

```bash
npm run text_editor:test       # validation suite → ALL PASS
npm run text_editor:demo       # PNG snapshots in gallery/text_editor/
npm run text_editor:bench      # Ranger-only SoftCanvas timings (default 1k lines)
npm run text_editor:bench -- 10000
npm run text_editor:compare    # side-by-side vs @hufe921/canvas-editor (Chromium)
npm run text_editor:compare -- --lines 10000
npm run text_editor:window     # interactive Chrome window (EVGDisplayList → WebGL)
npm run text_editor:window:smoke
```

### Interactive window (WebGL)

`npm run text_editor:window` starts a present host and opens Chrome with a
**separated input / render stack**:

```text
INPUT   browser events → POST /input → UIInput → EditorApp (Node)
RENDER  EditorApp.sceneJson() → EVGDisplayList → evg-webgl.js (WebGL 2)
```

SoftCanvas remains the CPU path for tests (`/frame.bin` still works). The web
demo never blits framebuffer bytes — it draws the same display-list seam as
`gallery/evg/gl/`.

## What works now

- Multiline buffer (array of lines) with insert / delete / replace
- Undo / redo
- Caret + selection (shift-arrows, drag, double-click word, triple-click line, Ctrl+A)
- Rich runs / blocks: Bold (Ctrl+B), Font, Align, bullet & numbered lists
- UTF-16 / surrogate-aware caret steps via `EVGCodepoint`
- Scroll, jump-to-line, resize
- SoftCanvas paint: gutter line numbers, selection rects, blinking caret, TTF text
- Web demo: `EVGDisplayList` → WebGL 2 + Canvas2D selection/caret overlay
- Headless `UIInput` scripting (same contract as the EVG UI layer)

## Deliberately not in this PR

IME composition (`SDL_TEXTEDITING`), word wrap, syntax highlighting, piece
table / rope, clipboard, and a live SDL/OpenGL window loop. Those are
follow-up PRs on top of this model. Browser WebGL present is already wired.

## Benchmark vs canvas-editor

`bench/compare/` runs the **same ops** on:

1. Ranger `EditorApp` (Node SoftCanvas nodemodule)
2. `@hufe921/canvas-editor` (headless Chromium via `puppeteer-core`)

```bash
npm run text_editor:compare -- --lines 1000
```
