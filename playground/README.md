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

`.github/workflows/deploy-playground.yml` runs on push to `main` or `master`, builds the playground, and publishes `playground/dist`.

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
