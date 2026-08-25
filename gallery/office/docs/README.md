# Office documentation

Two surfaces, both built here, both AGPL:

| URL | What it is |
| --- | --- |
| [`/office/docs/`](https://terotests.github.io/Ranger/office/docs/) | The Office documentation site (Astro + Starlight). Guides for EVG, PowerPoint, charts, Word, Excel and diagrams, plus the generated API pages. |
| [`/office/reference/`](https://terotests.github.io/Ranger/office/reference/) | The same API model as a standalone HTML dump, beside the playground. |

```
npm run office:docs:generate   # model + HTML dump + Starlight Markdown
npm run office:docs:dev        # generate, then a local Starlight server
npm run office:docs            # generate, then the static site in gallery/office/docs/site/dist
bash gallery/office/docs/build.sh --out DIR
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
| `api-sources.json` | Which facades are published, and how each Ranger name is spelled in JavaScript. |
| `tools/extract-api.mjs` | Reads the Ranger, writes the model to `.model/<id>-api.json`. |
| `tools/render-reference.mjs` | Model → standalone HTML (`/office/reference/`). |
| `tools/render-starlight.mjs` | Model → Starlight Markdown (`/office/docs/reference/`). |
| `tools/check-api-coverage.mjs` | Fails the build when a documented method has no counterpart in the JavaScript wrapper. A Ranger-only API records no wrapper and is skipped. |
| `site/` | The Astro + Starlight project. Guides are written by hand. API pages are generated. |

A method marked `; @internal` in its Ranger comment stays out of the pages
without being hidden from the source.

## Adding a facade

1. Put the Ranger API in `gallery/<app>/api/`.
2. Add an entry to `api-sources.json`.
3. Run `npm run office:docs:generate`.
4. If there is a JavaScript wrapper, record it under `js.wrapper` so coverage
   can check the names.

Word, Excel and diagrams have no facade yet. Their guides name the demos.
