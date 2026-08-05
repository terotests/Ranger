# Ranger Playground

In-browser Ranger compiler for [https://terotests.github.io/Ranger/](https://terotests.github.io/Ranger/).

Targets: **JavaScript** (optional TypeScript annotations), **Kotlin**, and **Swift 6**. Uses the current `VirtualCompiler` (same pipeline as `rgrc`) with examples from `tests/fixtures/`.

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
3. Copies test fixtures into `public/examples/`

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds the playground (plus `/games/` and
`/docs/`) and publishes the combined artifact.

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

If Source is left on **Deploy from a branch**, GitHub's legacy Jekyll builder
(`pages-build-deployment`) also runs against `master` and fails on Astro
front matter under `docs/site/`. That job is not this workflow; flip Source to
**GitHub Actions** so only `deploy-pages.yml` publishes.
