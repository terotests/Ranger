# Documentation site

The Ranger documentation, published at
<https://terotests.github.io/Ranger/docs/>. The playground holds the site root
and the games site holds `/games/`; one GitHub Pages deployment assembles all
three (`.github/workflows/deploy-pages.yml`).

The operator reference is generated. It is not written by hand and it is not a
copy of the sources: the examples are compiled by the compiler of the commit
that publishes the site, so the documentation cannot drift from the release.

## Layout

| Path | Content | In git |
| --- | --- | --- |
| `sources.json` | The files that declare operators. A file in `lib/` with an `operators { }` block must be listed. | yes |
| `examples/` | Example programs. Each one compiles. | yes |
| `descriptions/` | One Markdown file per operator, with the prose. | yes |
| `tools/` | The generator (stages A to D). | yes |
| `style/vale/` | The ASD-STE100 lint rules. | yes |
| `baseline/coverage.json` | The coverage ratchet. | yes |
| `site/` | The Astro + Starlight project. | source only |
| `site/src/data/`, `site/src/content/docs/reference/` | Generated model and pages. | no |
| `.cache/` | The compiler module and the example compilation cache. | no |

## Commands

```sh
npm run docs:extract     # A: read the operator sources -> operators.json
npm run docs:examples    # B: compile the examples for every target -> examples.json
npm run docs:render      # C: write the reference pages
npm run docs:coverage    # D: the coverage report and the gate
npm run docs:generate    # A, B, C and D
npm run docs:dev         # generate, then a local server
npm run docs:build       # generate, then the static site in docs/site/dist
npm run docs:lint        # Vale, needs a Vale installation
```

The generator needs `bin/output.js`. Run `npm run compile` first when the
compiler is not built.

## How the model is read

Two readers give the model:

1. **The Ranger parser** reads each file in `sources.json`. It works on a file
   that no program imports, and it keeps the template text, the comments and
   the line numbers.
2. **The compiler** compiles a probe program per source. The writer context
   then tells which operators the compiler registers.

The line numbers of the parser nodes point into the block that the parser read
last, not to the head of the definition, so `tools/lib/parse.mjs` anchors each
definition with a forward scan of the source text. The test
`tests/docs-tools.test.ts` checks the anchor of every definition of every
source.

## Add content

See
[How to add to the reference](https://terotests.github.io/Ranger/docs/contributing/documentation/)
and
[Writing rules](https://terotests.github.io/Ranger/docs/contributing/writing-rules/).
