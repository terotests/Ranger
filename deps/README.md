# EVG lives in its own repository

**[terotests/evg](https://github.com/terotests/evg)** is the canonical home
of EVG 3.0 Storm (Ranger package `pkg:evg`) and of Thunderstruck 2.x
(`import { EVG } from "evg"`).

This Ranger tree does **not** keep engine sources in git. `scripts/fetch-evg.sh`
checks out the ref in [`evg.ref`](evg.ref) to `deps/evg/` (gitignored) and
copies `storm/` to `lib/evg` so existing `/lib/evg/gl/…` URLs and Node
imports keep working.

```bash
scripts/fetch-evg.sh
```

`npm install` runs that script from `prepare`. CI jobs that compile gallery
code use `.github/actions/fetch-evg`.

Gallery packages name the checkout, not `lib/evg`:

```json
"evg": { "path": "../../deps/evg/storm" }
```

Outside this monorepo:

```json
"evg": {
  "git": "https://github.com/terotests/evg.git",
  "rev": "<commit>",
  "subdir": "storm"
}
```

Engine unit tests (`EVGJsonTest`, overlay, focus, …) run in the EVG
repository (`npm run storm:test`). Ranger CI keeps gallery-side checks:
`evg_window` toolbar / a11y, and UI conformance that needs Chromium and
the pages in this repo.

`gallery/evg_window` stays here. It is AGPL.
