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

Clone a **public** HTTPS repo. Node fetches bytes; Ranger parses the
advertisement, builds the want, demuxes side-band, and checks out the
tree. `clone.mjs` builds `pkg_tool.js` on first use if `gallery/pkg/bin`
is empty (that directory is gitignored).

```bash
node gallery/pkg/tools/clone.mjs https://github.com/terotests/Ranger.git \
  HEAD /tmp/ranger-evg gallery/evg
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
The gallery resolver refuses a `./` import that climbs out of the package.

The compiler **does** resolve `pkg:` and `./` now: `compiler/PkgImport.rgr`
(MIT) walks up to `ranger.json`, then a path dependency that is actually on
disk, `vendor/ranger/<name>`, or `RANGER_PKG_CACHE` /
`~/.cache/ranger/packages/<sha256>` from `ranger.lock`. It does not fetch Git —
that stays in this directory. `rgrc` reads the nearest `ranger.json`
automatically.

One manifest is not enough once a dependency is fetched. A package in the
cache carries its own repository's `ranger.json`, whose sibling path
dependencies (`"evg": { "path": "../evg" }`) do not exist beside a cache
entry. So resolution walks a **chain**: the manifest of the package the
importing file sits in, then the manifests of the files that imported it,
ending at the project the compile started from — whose lock knows where
every package landed. `gallery/ui` resolves `pkg:evg` through its own
manifest inside the tree, and through the application's lock outside it,
with no change to the source.

Two spellings of the same file — `../../evg/EVGElement.rgr` from inside the
tree and `pkg:evg/EVGElement.rgr` from a package — are one import. The
compiler keys `already_imported` on the folded path as well as the string,
so a tree can move to `pkg:` one file at a time instead of all at once.

A Git dependency with `subdir` is **not** a full clone. Deno never clones for
HTTP imports either: it GETs the files the module graph names. Here the graph
is a Git tree. `clone.mjs` does two smart-HTTP rounds:

1. `deepen 1` + `filter blob:none` — one commit and its trees (~280 KB on Ranger.git)
2. `want` the subtree SHA (`allow-reachable-sha1-in-want`) — blobs under that path (~2.5 MB for `gallery/evg`)

Protocol v2 `command=fetch` with the same deepen/filter is `pkg_tool want-v2`.
GitHub still speaks v1 with `filter` / `shallow`; that is what `clone.mjs` posts
today. Without `subdir`, one `deepen 1` snapshot of the whole tree.

Gallery `PackageResolver` is the same idea for tools (`pkg_tool resolve`,
`install`, `cache-put`, `vendor`).

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
| `src/PkgCache.rgr` | content-addressed checkout cache |
| `src/pkg_tool.rgr` | CLI |
| `tools/git-http.mjs` | HTTPS GET/POST only |
| `tools/clone.mjs` | advertise → want → pack → checkout |
| `tools/install.mjs` | `ranger.json` → fetch every dep → cache → `ranger.lock` |
| `tools/make-fixtures.mjs` | corpus from git / Node crypto |
| `npm/` | the publishable `ranger-pkg` package |

## Commands

```text
pkg_tool sha1 <file>
pkg_tool refs <advertise.bin>
pkg_tool want <advertise.bin> <rev> <want.bin>
pkg_tool want-trees <advertise.bin> <rev> <want.bin>
pkg_tool want-shallow <advertise.bin> <rev> <want.bin>
pkg_tool want-sha <sha> <want.bin>
pkg_tool want-v2 <sha> <want.bin> [filter]
pkg_tool unpack <pack>
pkg_tool checkout <pack> <sha> [subdir] <out-dir>
pkg_tool fetch-checkout <response.bin> <sha> [subdir] <out-dir>
pkg_tool sparse-tree <response.bin> <commit> [subdir]
pkg_tool fetch-merge <trees.bin> <blobs.bin> <commit> [subdir] <out-dir>
pkg_tool resolve <ranger.json> <import> [importer]
pkg_tool tree <ranger.json>
pkg_tool lock <ranger.json>
pkg_tool vendor <ranger.json> <out-dir>
pkg_tool cache-put <pack> <sha> [subdir] <cache-root>
pkg_tool cache-merge <trees.bin> <blobs.bin> <commit> [subdir] <cache-root>
pkg_tool install <ranger.json>
```

`pkg_tool install` dumps a lock of what is **already mounted**; it does not
fetch. The command that walks the graph is `tools/install.mjs`:

```bash
npm run pkg:install -- path/to/ranger.json          # or --vendor, --cache=<dir>
```

For every `git` dependency it sparse-fetches the pinned revision, writes the
checkout into the cache `compiler/PkgImport.rgr` reads (`RANGER_PKG_CACHE`,
else `~/.cache/ranger/packages/<sha256>`), recurses into that package's own
`ranger.json`, and records `rev` + `sha256` in `ranger.lock`. A branch or tag
in `ranger.json` is pinned to the commit it resolved to. After that `rgrc`
compiles `pkg:` imports with no Ranger tree in sight.

There is no daemon, no login, no `publish`, no registry. A later registry
can be a JSON index of git URLs; the protocol here would not change.

## Shipping it

The compiler on npm (`ranger-compiler`, MIT) **resolves** `pkg:` and `./` — it
does not fetch, because the Git client is here, under the gallery's AGPL. A
project that only has `rgrc` therefore cannot get its dependencies onto disk.
That gap closes by publishing this directory as its own package:

```bash
npm run pkg:npm:build     # gallery/pkg/npm/dist: pkg_tool.js + the .mjs pipes
npm run pkg:npm:pack      # a tarball in ./tmp to try before publishing
```

```bash
npx ranger-pkg install            # fetch + lock, from a project's ranger.json
npx ranger-pkg clone <url> HEAD <dir> <subdir>
npx ranger-pkg resolve ranger.json pkg:evg/EVGElement.rgr
```

`ranger-pkg` is AGPL-3.0-or-later, like the rest of `gallery/`. Using it to
fetch sources does not touch the licence of what you compile, the same way
`rgrc` does not.

## What this does not do

- Semver ranges (`^1.2`, `>=3 <4`)
- Package namespaces / colliding `class Button`
- Auth, SSH, incremental `have` against a stored pack
- `rgrc install` / `rgrc pkg add` as compiler subcommands. `rgrc` is MIT and
  this client is AGPL, so the fetch cannot move into the compiler binary as
  things stand — `ranger-pkg` is the separable half. Folding it in means
  either relicensing the client (it is a clean-room read of published
  formats, and `GitZlib` is the only thing tying it to `gallery/zip`) or
  having `rgrc install` shell out to `ranger-pkg` when it is installed.
- Copying `node_modules`-style trees by default — cache + optional `vendor`

## Tests

The SHA-1 and pack corpora are produced by **Node crypto** and **git
pack-objects**, not by this code. A decoder checked only against itself
proves nothing.

```bash
npm run pkg:test
npm run pkg:test:targets   # every Ranger language; run where the toolchain is installed
```

**License: AGPL-3.0-or-later** (this directory is under `gallery/`).
