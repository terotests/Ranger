# Office documentation

This is the Office reference, published at
[`/office/reference/`](https://terotests.github.io/Ranger/office/reference/).
It is an Astro + Starlight site, the same system as the Ranger language
documentation, built here because the pages quote AGPL sources.

The playground stays at [`/office/`](https://terotests.github.io/Ranger/office/).
Guides can iframe it with `?embed=1&preset=…` so a page runs an example and
shows the slide stack it produced. `PptxExample.astro` is that iframe.

```
npm run office:docs:generate          # model + Starlight Markdown from the facades
npm run office:docs:sync-playground   # copy the built playground into the docs site
npm run office:docs:dev               # generate, copy, then a local Starlight server
npm run office:docs                   # generate, copy, then the static site
npm run pptx:playground               # build the playground the embeds load
```

## Why it is not in the language documentation

`docs/site` is the Ranger language documentation and it is MIT. This
documentation is generated from sources under `gallery/`, and the API pages
quote them: every class description, every paragraph under a method and every
sentence in a table row is the comment above that declaration, copied. Those
comments are AGPL-3.0-or-later.

Built into `docs/site`, that text would be assembled into an MIT-licensed site
and published under its footer. This directory puts the generator, the
registry, the guides and the Starlight project under `gallery/`, under the
licence of what they are made from, and deploys the result beside the
playground rather than beside the language documentation.

## The pieces

| File | What it does |
| --- | --- |
| `api-sources.json` | Which facades are published, the URL slug (`page`), and how each Ranger name is spelled in JavaScript. |
| `tools/extract-api.mjs` | Reads the Ranger, writes the model to `.model/<id>-api.json`. |
| `tools/render-starlight.mjs` | Model → Starlight Markdown (`pptx.md`, `vela.md`, …). |
| `tools/check-api-coverage.mjs` | Fails the build when a documented method has no counterpart in the JavaScript wrapper. A Ranger-only API records no wrapper and is skipped. |
| `tools/sync-playground.mjs` | Copies the built playground into `site/public/playground/` so live examples can iframe it. |
| `site/` | The Astro + Starlight project. Guides are written by hand. API pages are generated. Live examples use `site/src/components/PptxExample.astro`. |

A method marked `; @internal` in its Ranger comment stays out of the pages
without being hidden from the source.

The PowerPoint API is at `/office/reference/pptx/` — the same address the old
HTML dump used.

## Adding a facade

1. Put the Ranger API in `gallery/<app>/api/`.
2. Add an entry to `api-sources.json` (`page` is the URL slug).
3. Run `npm run office:docs:generate`.
4. If there is a JavaScript wrapper, record it under `js.wrapper` so coverage
   can check the names.

Word, Excel and diagrams have no facade yet. Their guides name the demos.
