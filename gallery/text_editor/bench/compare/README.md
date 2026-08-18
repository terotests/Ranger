# Side-by-side bench: Ranger EVG editor vs `@hufe921/canvas-editor`

This harness runs the **same corpus and operation list** on both engines and
prints a comparison table.

| Engine | Host | What is measured |
| --- | --- | --- |
| `ranger-evg` | Node SoftCanvas (`EditorApp` nodemodule) | model + layout + CPU text raster |
| `canvas-editor` | headless Chromium (`puppeteer-core` + system Chrome) | model + Canvas paint in a real browser |

Environments differ (CPU SoftCanvas vs browser Canvas). The point of this suite
is a **repeatable shared workload**, not a claim of identical paint pipelines.

## Setup (once)

```bash
# from repo root — ensure the Ranger EditorApp module exists
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 -nodemodule ./gallery/text_editor/src/EditorApp.rgr \
  -d=./gallery/text_editor/bin -o=editor_app_module.cjs

cd gallery/text_editor/bench/compare
npm install
```

Needs a Chrome/Chromium binary (`google-chrome` is fine). Override with
`CHROME_PATH=/path/to/chrome`.

## Run

```bash
# from repo root
npm run text_editor:compare          # default 1000 lines, both engines
npm run text_editor:compare -- --lines 10000
npm run text_editor:compare -- --engine ranger --lines 1000
npm run text_editor:compare -- --engine canvas-editor --lines 1000
```

Or inside this folder:

```bash
npm run compare -- --lines 1000
```

Results: printed table + `last-results.json`.

## Shared operations

`init` · `open_document` · `first_paint` · `scroll_1000_lines` · `insert_char` ·
`insert_1000_chars` · `backspace` · `select_100_lines` · `replace_selection` ·
`select_all` · `resize_window` · `jump_line`
