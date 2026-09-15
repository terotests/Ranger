# `gallery/pkg` — Git pack client and a source-package resolver

Ranger does not need a binary package manager. It needs to know, when a
source file says it needs `evg`, **where those `.rgr` files come from and
which exact revision belongs to this build**. This directory is the first
cut of that: a Git client that reads a pack into memory, and a resolver
that understands `ranger.json`, `ranger.lock`, and `Import "pkg:…"`.

It is **not** a registry, a semver solver, or a symbol namespace. Those
wait. The compiler still sees a pile of `.rgr` files; this only answers
how they got there.

## Why a Git client, and why not Git's C code

Command-line `git checkout` is a process per invocation and a lot of
filesystem chatter. A clone for a package manager wants one HTTP round
trip, a pack, and a tree walk into memory (or a cache directory keyed by
content hash). That is exactly the Git pack protocol.

Git itself is **GPL-2.0**. Copying `packfile.c` / `sha1.c` / `http-backend.c`
into Ranger would put this tree under GPL. libgit2 is GPL-2 with a linking
exception, which still is not a licence for a from-scratch Ranger port,
and it would not compile to JavaScript / Python / the other targets.

What **is** allowed — the same way `gallery/zip` implements PKZIP from a
published layout — is implementing the **documented formats**:

| Document | What we use |
| --- | --- |
| gitformat-pack | `PACK` v2, zlib objects, OFS_DELTA / REF_DELTA |
| gitprotocol-common | pkt-line, flush |
| gitprotocol-http | smart HTTP `info/refs` + `git-upload-pack` |
| FIPS 180-1 | SHA-1 of Git object headers |
| RFC 1950 / 1951 | zlib around the existing DEFLATE inflater |

No Git source is vendored. SHA-1 here is a public algorithm; DEFLATE is
`gallery/zip/Inflate.rgr`. The Node files under `tools/` are an HTTPS
pipe (`GET` / `POST` of bytes). They do not parse Git.

Public clones only: no credentials, no SSH, no `git://`.

## Quick start

```bash
npm run pkg:fixtures    # git pack-objects + Node crypto SHA-1
npm run pkg:test
npm run pkg:tool
```

Unpack a pack without spawning git:

```bash
node gallery/pkg/bin/pkg_tool.js unpack gallery/pkg/fixtures/tiny.pack
node gallery/pkg/bin/pkg_tool.js checkout gallery/pkg/fixtures/tiny.pack \
  $(awk '/^head /{print $2}' gallery/pkg/fixtures/tiny.meta.txt) /tmp/tiny
```

Clone a **public** HTTPS repo (needs the tool built). Node fetches bytes;
Ranger parses the advertisement, builds the want, demuxes side-band, and
checks out the tree:

```bash
npm run pkg:tool
node gallery/pkg/tools/clone.mjs https://github.com/terotests/Ranger.git \
  HEAD /tmp/ranger-src gallery/pkg
```

## What a package is

```text
name
version
source origin          path / git+rev / git+tag
entry point
dependencies
Ranger sources
licence
```

Example `ranger.json`:

```json
{
  "name": "treeni",
  "version": "0.1.0",
  "entry": "src/TreeniWeekDemo.rgr",
  "dependencies": {
    "evg": { "path": "../evg" },
    "ui": {
      "git": "https://github.com/terotests/Ranger.git",
      "rev": "4af82c0123456789abcdef0123456789abcdef01",
      "subdir": "gallery/ui"
    }
  }
}
```

v1 does **not** resolve `"evg": "^1.4.0"`. A lockfile records the commit
(or the path) so a clean checkout rebuilds the same sources:

```json
{
  "lockVersion": 1,
  "packages": {
    "ui": {
      "git": "https://github.com/terotests/Ranger.git",
      "rev": "4af82c…",
      "subdir": "gallery/ui",
      "sha256": "…"
    }
  }
}
```

## Import syntax

```ranger
Import "./MyLocalThing.rgr"          ; same package
Import "pkg:evg"                     ; that package's entry
Import "pkg:evg/EVGElement.rgr"      ; a file inside it
```

Relative `../evg/EVGElement.rgr` is a monorepo accident, not a dependency.
The resolver refuses a `./` import that climbs out of the package.

The compiler is not wired yet. `PackageResolver.resolve` is the component
`cmdImport` should call; until then this suite and `pkg_tool resolve`
exercise the same `ImportRequest → ResolvedSource` shape. Compiler code
must not import `gallery/` (AGENTS.md), so the eventual hook is either a
copy of these types under `compiler/` or the existing `import_loader`
plugin.

## Layout

| File | |
| --- | --- |
| `src/GitSha1.rgr` | SHA-1, hex, big-endian helpers |
| `src/GitZlib.rgr` | RFC 1950 around `gallery/zip` inflate |
| `src/GitPkt.rgr` | pkt-line, advertisement, want, side-band |
| `src/GitPack.rgr` | pack v2 + deltas |
| `src/GitStore.rgr` | tree walk, in-memory / disk checkout |
| `src/PkgJson.rgr` | small JSON reader |
| `src/PkgManifest.rgr` | `ranger.json` / `ranger.lock` |
| `src/PkgResolver.rgr` | `pkg:` and relative imports, lock, vendor |
| `src/pkg_tool.rgr` | CLI |
| `tools/git-http.mjs` | HTTPS GET/POST only |
| `tools/clone.mjs` | advertise → want → pack → checkout |
| `tools/make-fixtures.mjs` | corpus from git / Node crypto |

## Commands

```text
pkg_tool sha1 <file>
pkg_tool refs <advertise.bin>
pkg_tool want <advertise.bin> <rev> <want.bin>
pkg_tool unpack <pack>
pkg_tool checkout <pack> <sha> [subdir] <out-dir>
pkg_tool fetch-checkout <response.bin> <sha> [subdir] <out-dir>
pkg_tool resolve <ranger.json> <import> [importer]
pkg_tool tree <ranger.json>
pkg_tool lock <ranger.json>
pkg_tool vendor <ranger.json> <out-dir>
```

There is no daemon, no login, no `publish`, no registry. A later registry
can be a JSON index of git URLs; the protocol here would not change.

## What this does not do

- Semver ranges (`^1.2`, `>=3 <4`)
- Package namespaces / colliding `class Button`
- Auth, SSH, shallow-from-have, protocol v2
- `rgrc pkg add` as a compiler subcommand (the library is here first)
- Copying `node_modules`-style trees by default — cache + optional `vendor`

## Tests

The SHA-1 and pack corpora are produced by **Node crypto** and **git
pack-objects**, not by this code. A decoder checked only against itself
proves nothing.

```bash
npm run pkg:test
```

**License: AGPL-3.0-or-later** (this directory is under `gallery/`).
