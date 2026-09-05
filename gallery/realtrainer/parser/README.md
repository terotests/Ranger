# `gallery/realtrainer/parser` — vendored COMPACT v1 parser

**This directory is a copy. Do not edit it.**

Upstream: `parser-ranger-v1/src` in the RealTrainer monorepo, the same Ranger
sources that back the [`realtrainer-compact`](https://github.com/RealTrainer/realtrainer-compact)
npm package (3.0.0 and later). Refresh with:

```bash
npm run rt:parser:sync            # copy from a sibling checkout
npm run rt:parser:check           # fail if the copy is stale
```

`rt:parser:check` is **not** in the CI suite, and deliberately: it compares the
copy against a source CI does not have, so there it would either fail every run
or pass without looking at anything. It is a gate for a machine that has the
monorepo checked out, and it says so and exits 0 on one that does not.

Only the entry file's transitive import closure is copied — 46 files. The
upstream tree also carries the NG detector track, JSON adapters and test
runners, none of which this demo compiles.

## Why a copy and not a checkout

`rt:check` runs in CI, and the monorepo is private. A demo that resolved the
parser through a sibling checkout would pass on a developer machine and fail in
CI, which is the worst of the two outcomes.

## License

These files are **GPL-3.0-or-later**, from a project under that license, and
they keep it. The rest of `gallery/` is AGPL-3.0-or-later; combining GPLv3
sources into an AGPLv3 work is permitted (AGPL-3.0 §13). Nothing here is
relicensed by being copied.
