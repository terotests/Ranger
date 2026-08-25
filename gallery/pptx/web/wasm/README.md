# The PPTX editor, as WebAssembly

The same editor as [`/pptx/`](../standalone/), compiled the other way.

    npm run pptx:wasm          # build it
    npm run pptx:wasm:test     # the standalone page's own 98 assertions, in a browser
    npm run pptx:wasm:parity   # does it draw the same picture as the JavaScript build?
    npm run pptx:wasm:serve    # look at it

Published by `.github/workflows/deploy-pages.yml` to **`/pptx-wasm/`**, beside
the JavaScript build at `/pptx/`. It is a path in that workflow's artifact
rather than a workflow of its own because GitHub Pages allows one deployment
per repository — a second deployer would clobber the site, not sit beside it.

## What is compiled, and what is written

One source file, two backends:

    gallery/pptx/web/pptx_web.rgr
        ├── -es6  → pptx_web.js    → /pptx/
        └── -l=cpp → pptx_web.cpp  → em++ → pptx_wasm.wasm → /pptx-wasm/

Everything else is shared. `standalone.mjs` — the whole page: chrome, pointer,
keyboard, the show, printing, saving — is the same file in both, byte for byte,
and so are the fonts, the shaders, the preset geometry and the sample deck.

Two files here are hand-written and they are the only ones:

* **`bind.cpp`** (~220 lines) says which methods a page may call and how values
  cross the WebAssembly boundary.
* **`wasm-host.mjs`** presents that as the same `PptxWeb` class the JavaScript
  build exports, so the page cannot tell the difference.

A page rewritten for WebAssembly would have measured the rewrite. This one
measures the backend.

## Why Ranger → C++ → WASM and not the other two routes

| Route | State |
| --- | --- |
| Ranger → LLVM/WAT → WASM | Freestanding: primitives and exported functions, no strings, no maps, no objects. Not a program this size. |
| Ranger → Rust → WASM | Gets through the Ranger frontend now, but the emitted Rust does not compile — 396 rustc errors, 275 of them one emitter bug. See [RUST_ISSUES.md](../../../../RUST_ISSUES.md). |
| **Ranger → C++ → Emscripten → WASM** | **Compiles clean.** 76 743 lines of C++, no source changes. |

## The two flags that are not optional

Both were found the hard way and both are documented at the point of use in
`build.sh`:

* **`-fwasm-exceptions`.** Emscripten compiles with exceptions off by default.
  The Ranger C++ runtime's `to_int(string)` is `std::stoll` inside a
  `try { … } catch (...) {}` — the catch is how a string that is not a number
  answers nothing instead of throwing, on every target. With exceptions off
  that catch is inert, and `25-table.pptx` opened fine natively but aborted in
  WebAssembly with an empty `Aborted()`.
* **`-s EXPORTED_RUNTIME_METHODS=HEAPU8,HEAP32`.** The frame crosses as
  typed-array views onto exactly those. Without the flag the page loads, gets
  a WebGL context, and dies on `Cannot read properties of undefined (reading
  'buffer')` the first time it asks for a slide.

## What it cost and what it bought

Measured by `parity.mjs`, both engines in one process, same decks:

| | JavaScript | WebAssembly | |
| --- | --- | --- | --- |
| engine, chart slide (10 084 commands) | 5.5 ms | 5.3 ms | **1.03× faster** |
| engine, business deck (572 commands) | 0.4 ms | 0.4 ms | 1.18× faster |
| engine download, gzipped | 362 KB | 1 007 KB | **2.8× bigger** |

So: not faster in any way worth having, and nearly three times the download.
V8 compiles this code about as well as clang does.

That is the answer to the question this build was made to ask, and it is worth
having in a form anyone can re-run rather than as an opinion. It also sets the
price on the Rust route: the reward at the end of those 396 errors is the
right-hand column above.

The frame itself was never the argument — see
[`bridge.mjs`](../bridge.mjs). Handing a picture over as JSON cost 62 ms where
building it cost 10; replacing that bridge with typed arrays took the handover
to 7 ms with no port at all. That was the win. This was the check.

## Is it the same picture?

`parity.mjs` walks every fixture and the chart deck, every slide, and compares
the two engines' display lists command by command and field by field:
**36 decks, 49 slides, 61 236 commands identical**. The browser page then runs
the standalone editor's own 98 assertions — opening a deck, editing it, saving
a `.pptx` and reopening what it wrote — and passes 98/98, the same as the
JavaScript build.
