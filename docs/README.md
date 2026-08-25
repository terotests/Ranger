# Documentation site

The Ranger documentation, published at
<https://terotests.github.io/Ranger/docs/>. The playground holds the site root
and the games site holds `/games/`; one GitHub Pages deployment assembles
them (`.github/workflows/deploy-pages.yml`).

The Office applications (EVG, Word, Excel, PowerPoint, charts, diagrams) have
their own site at [`/office/docs/`](https://terotests.github.io/Ranger/office/docs/),
built from `gallery/office/docs/` because those pages quote AGPL sources. See
[`gallery/office/docs/README.md`](../gallery/office/docs/README.md).

Pages **Source** must be **GitHub Actions**. A branch/Jekyll source makes
`pages-build-deployment` parse Astro `---` front matter as YAML and fail.

The operator reference is generated. It is not written by hand and it is not a
copy of the sources: the examples are compiled by the compiler of the commit
that publishes the site, so the documentation cannot drift from the release.

## Layout

| Path | Content | In git |
| --- | --- | --- |
| `sources.json` | The files that declare operators, and the status of each: `stable` (documented) or `legacy` (listed on the not-covered page, no reference pages). A file in `lib/` with an `operators { }` block or an `operator type:` block must be listed. | yes |
| `examples/` | Example programs. Each one compiles. A header `id:` binds it to operators; a header `topic:` binds it to a guide page. | yes |
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

## The two operator mechanisms

| Mechanism | Where | Portability |
| --- | --- | --- |
| Template operator | `operators { }` / `commands { }` blocks. One emission string per target. | Manual. A target with no template and no `*` fallback writes no code. |
| Type method | `operator type:<T> <scope> { fn … }` blocks. Ordinary Ranger code. | Every target that compiles the library. |

The reference covers both. A type method has a page under
`reference/methods/`, states its target scope and shows its Ranger body.

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

Source links in the reference pin to the commit that built the site
(`RANGER_COMMIT`), not to the `master` branch. A line number is only valid for
the tree it was measured in; a `master` link goes to the wrong place as soon as
`compiler/Lang.rgr` moves.

## Add content

See
[How to add to the reference](https://terotests.github.io/Ranger/docs/contributing/documentation/)
and
[Writing rules](https://terotests.github.io/Ranger/docs/contributing/writing-rules/).
