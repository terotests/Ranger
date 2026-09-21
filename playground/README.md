# Ranger Playground

In-browser Ranger compiler, published at [https://terotests.github.io/Ranger/playground/](https://terotests.github.io/Ranger/playground/). The site root is the language's front page, built from [`landing/`](../landing/README.md).

Targets: **JavaScript** (optional TypeScript annotations), **Python**, **Go**, **Rust**,
**C++**, **C#**, **Java**, **Kotlin**, **Swift 6**, **Dart**, **PHP** and **Scala** — every
writer the `VirtualCompiler` bundle carries except LLVM (no lowering for shapes) and
Swift 3 (superseded by the Swift 6 writer). Same pipeline as `rgrc`. The default
example is the cart from the front page (`landing/examples/Cart.rgr`); the rest
come from `tests/fixtures/`.

The examples cover the front-page cart, infix/optionals, the `shape` / `case` / `group` closed variant
families, and the `@process` runtime. A target that genuinely cannot build an example is
disabled in the picker with the reason on hover, rather than dropping compiler errors in
the output pane — Scala, for instance, cannot compile `RangerProcess.rgr`.

The picker state is in the URL: `?example=cart&lang=php`.

## Local development

From the repository root:

```bash
npm run compile
cd playground
npm install
npm run dev
```

Open [http://localhost:5173/Ranger/](http://localhost:5173/Ranger/) (Vite `base` matches GitHub Pages).

## Build

```bash
npm run build
```

Outputs static files to `playground/dist/`. The build:

1. Compiles `compiler/VirtualCompiler.rgr` to `public/ranger-compiler.js` (browser bundle; do not use `-client`)
2. Writes `public/compileEnv.json` (Lang + stdlib in memory)
3. Copies playground examples into `public/examples/` (the cart from
   `landing/examples/Cart.rgr`, the rest from `tests/fixtures/`)

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds the playground (plus `/games/` and
`/docs/`) and publishes the combined artifact.

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

If Source is left on **Deploy from a branch**, GitHub's legacy Jekyll builder
(`pages-build-deployment`) also runs against `master` and fails on Astro
front matter under `docs/site/`. That job is not this workflow; flip Source to
**GitHub Actions** so only `deploy-pages.yml` publishes.
