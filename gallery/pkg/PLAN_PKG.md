# Plan: packages as source, Git as the fetch

## Why this, and why not a package manager first

Treeni can run from a previously generated `.mjs` that already has EVG
inside it. The runtime then needs no Ranger sources. The **build** is not
reproducible: a clean checkout cannot rebuild that `.mjs`, and CodeGraph
cannot analyse files that are not there. Ranger's `Import` is still a
filesystem path, and the compiler already has a virtual `InputFS` and
`-copysrc`.

A source package is the fit:

```text
when the source says it needs evg,
where do those .rgr files come from,
and which exact version belongs to this build?
```

Order, smallest first:

1. Git pack / smart HTTP client (in memory or onto disk)
2. `ranger.json`
3. `ranger.lock`
4. Git + path resolver + cache
5. `pkg:` imports
6. `vendor`
7. Compiler `cmdImport` resolves `pkg:` via `compiler/PkgImport.rgr` (MIT)
8. Registry / semver / namespaces — **not now**

## Licensing

Git's C implementation is GPL-2.0. This client is a clean-room reading of
the published pack and HTTP documents, plus FIPS 180-1 SHA-1 and the
zlib wrapper around `gallery/zip`. `tools/*.mjs` only move bytes on HTTPS.
That is the same stance as ZIP and Zstandard in this gallery.

## Stages

- **S0 — SHA-1 and zlib-at-offset.** Pack objects are zlib, not raw
  DEFLATE, and their compressed size is not stored. Inflate gained
  `decompressFrom` / `inputPos` so the next object can start where the
  last stream ended. *Done in this change.*
- **S1 — pack v2 + deltas.** `GitPackIO.parse`, OFS_DELTA / REF_DELTA.
  Fixtures from `git pack-objects`.
- **S2 — tree checkout.** `GitStore` walks a commit/tree into `GitMem`
  and optionally writes a directory. `subdir` is how a git dependency
  names `gallery/evg` inside Ranger.git.
- **S3 — pkt-line + smart HTTP.** Advertisement, want/done,
  side-band-64k. Node `git-http.mjs` is the pipe.
- **S4 — manifest / lock / resolver.** `pkg:name`, `pkg:name/path`,
  `./relative`. Path deps. Lock dump. Vendor copy.
- **S5 — compiler hook.** `cmdImport` resolves `pkg:` and `./` through `compiler/PkgImport.rgr` (MIT): walk up to `ranger.json`, path deps, `vendor/ranger/<name>`, lockfile sha256 cache. Fetching still lives in `gallery/pkg`.
- **S6 — cache keyed by lock sha256.** `PkgCache.put` writes a Git checkout under `<cacheRoot>/<sha256>/`. `pkg_tool cache-put` / `install`.

## Non-goals (still)

- Semver solver
- Symbol isolation / namespaces (a collision warning is enough)
- A Ranger-operated registry
- Binary artifacts / ABI

## CodeGraph

Once every source is present, the graph is too big. Store on each node
`package`, `packageVersion`, `sourcePath`, `isWorkspaceSource` so the UI
can show application-only / direct deps / all. Not in S0–S4.
