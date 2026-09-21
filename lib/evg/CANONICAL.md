# Canonical home of this engine

**EVG 3.0 Storm lives at [github.com/terotests/evg](https://github.com/terotests/evg).**

This directory (`Ranger/lib/evg`) is a **vendor copy** so gallery packages
keep compiling offline:

```json
"evg": { "path": "../../lib/evg" }
```

New engine work — layout, CSS, display list, hosts in `gl/` `html/`
`android/` `apple/` — lands in `terotests/evg` (`storm/` there), not here.
A Ranger application outside this monorepo should depend on that git
repository:

```json
"evg": {
  "git": "https://github.com/terotests/evg.git",
  "rev": "<commit>",
  "subdir": "storm"
}
```

Gallery still path-depends on this vendor copy. Switching those
`ranger.json` files to a `git` + `subdir: "storm"` dependency (then
`rgrc install`) waits until Storm is on `terotests/evg` master — a
clean checkout cannot fetch a package that is only on a PR branch.

Pull a published Storm tree back into this vendor copy:

```bash
scripts/sync-evg-from-canonical.sh [<path-or-url>]
```

`gallery/evg_window` (toolbar, ruler, software-rasteriser measurer) stays
in Ranger; it is AGPL and is not part of the EVG package.

Thunderstruck 2.x (`import { EVG } from "evg"`, XML → PDF) is the
TypeScript face of the same project, still published on NPM from
`terotests/evg`.
