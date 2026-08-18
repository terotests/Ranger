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
```

`text_editor:compare` installs the local compare harness deps on first run
(`puppeteer-core` + `@hufe921/canvas-editor`) and needs a system Chrome.
See [`bench/compare/README.md`](bench/compare/README.md).

## What works now

- Multiline buffer (array of lines) with insert / delete / replace
- Undo / redo
- Caret + selection (shift-arrows, drag, Ctrl+A)
- UTF-16 / surrogate-aware caret steps via `EVGCodepoint`
- Scroll, jump-to-line, resize
- SoftCanvas paint: gutter line numbers, selection rects, blinking caret, TTF text
- Headless `UIInput` scripting (same contract as the EVG UI layer)

## Deliberately not in this PR

IME composition (`SDL_TEXTEDITING`), word wrap, syntax highlighting, piece
table / rope, clipboard, GPU/WebGL present, and a live SDL window loop. Those
are follow-up PRs on top of this model.

## Benchmark vs canvas-editor

`bench/compare/` runs the **same ops** on:

1. Ranger `EditorApp` (Node SoftCanvas nodemodule)
2. `@hufe921/canvas-editor` (headless Chromium via `puppeteer-core`)

```bash
npm run text_editor:compare -- --lines 1000
```
