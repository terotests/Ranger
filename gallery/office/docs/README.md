# The Office API reference

The pages published at `/office/reference/`, generated from the Ranger facades
that declare each API — today `gallery/pptx/api/PptxApi.rgr` and
`PptxRenderApi.rgr`, listed in [`api-sources.json`](api-sources.json).

```
npm run office:reference          # into gallery/office/docs/dist
bash gallery/office/docs/build.sh --out DIR
```

## Why it is not in the documentation site

`docs/site` is the Ranger language documentation and it is MIT. This reference
is generated from sources under `gallery/`, and it does not describe them from
the outside — it QUOTES them: every class description, every paragraph under a
method and every sentence in a table row is the comment above that declaration,
copied. Those comments are AGPL-3.0-or-later.

Built into `docs/site`, that text was assembled into an MIT-licensed site and
published under its footer. Moving the generator, the registry and the output
under `gallery/` puts all three under the licence of what they are made from,
and deploys the result beside the playground rather than beside the language
documentation.

What that costs: no Starlight, so no site search over these pages and no
generated sidebar — the renderer builds a small one from the classes it emits.
Both belonged to the site, and neither is worth an incompatible licence.

## The pieces

| File | What it does |
| --- | --- |
| `api-sources.json` | Which facades are published, and how each Ranger name is spelled in the npm package. |
| `tools/extract-api.mjs` | Reads the Ranger, writes the model to `.model/<id>-api.json`. |
| `tools/render-reference.mjs` | Model → standalone HTML. |
| `tools/check-api-coverage.mjs` | Fails the build when the page names something the JavaScript wrapper does not export. |

A method marked `; @internal` in its Ranger comment stays out of the pages
without being hidden from the source.
