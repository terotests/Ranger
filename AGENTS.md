# Agent guidelines

Notes for AI agents (Claude Code, Cursor, …) working in this repository.

## Language docs (start here)

Prefer the published docs over the old `ai/` guides:

| Resource | Use for |
| --- | --- |
| [Questions and answers (FAQ)](https://terotests.github.io/Ranger/docs/faq/) | Arrays, `!`, singletons, JSON/`@serialize`, memory annotations, **why a call does not compile**, operator lookup |
| [Documentation site](https://terotests.github.io/Ranger/docs/) | Install, types, optionals, ownership, generated operator reference |
| [`ai/QUICKREF.md`](ai/QUICKREF.md) | Offline syntax card |
| [`ai/README.md`](ai/README.md) | Index of the remaining local AI notes |

Source files use the **`.rgr`** extension (not `.clj`). Entry point: `sfn main:void ()`.

## Licenses

- Ranger-authored code outside `gallery/`: **MIT** unless a file says otherwise (`LICENSE-MIT`). That includes `lib/evg` (the EVG layout engine) and `lib/image` (JPEG / PNG codecs); both moved out of `gallery/` and to MIT in September 2026.
- Ranger-authored code under `gallery/`: **AGPL-3.0-or-later** unless a file says otherwise (`gallery/LICENSE`, `LICENSE-AGPL-3.0`).
- Third-party files keep their own licenses. Do not treat a path as a relicensing of vendor code.
- Generated output follows the source license, not the compiler. Compiled gallery programs stay AGPL. Runtime helpers the compiler writes are MIT.
- Root [`LICENSE`](LICENSE) is the mixed-license overview, not a single license text.
- Gallery may import `lib/` and `compiler/`. **Never** import `gallery/` from `lib/` or `compiler/`. `lib/evg` imports `pkg:image`, nothing from the gallery; the pieces that need the gallery's rasteriser and fonts (`EVGWindow`, `EVGTextFit`, `EVGContextMeasurer`, the ruler and toolbar views) are the AGPL package `gallery/evg_window`.
- Gallery code imports EVG as a package: `Import "pkg:evg/EVGElement.rgr"` with `"evg": { "path": "../../lib/evg" }` in that package's `ranger.json` (same for `pkg:image/…` and `pkg:evg_window/…`). Do not write `../../lib/evg/…`.
- Details: [`LICENSING.md`](LICENSING.md).

## Git & pull-request workflow

These rules exist because work has been lost or landed in the wrong place before —
follow them exactly.

1. **Never push again to a PR that is already closed or merged.** A merged/closed
   PR is finished; it cannot track new work and must not be reused. For any
   follow-up, cut a **new branch** and open a new PR. If you have unmerged commits
   on a branch whose PR was already merged, move them onto a fresh branch based on
   the latest `master` rather than pushing more onto the old one.

2. **Open pull requests against `master`.** In this repo the integration branch is
   `master`. Do **not** target another feature branch as the PR base — a PR merged
   into a side branch does not reach `master` (this has happened). When you (or a
   UI) create the PR, confirm the base is `master` before merging.

3. **Always rebase onto the latest `master` before starting a new PR.** Fetch and
   rebase (or branch fresh) from `origin/master` so the branch is up to date and
   the PR diff contains only your changes:

   ```bash
   git fetch origin master
   git checkout -B <your-branch> origin/master   # fresh branch on latest master
   # …or, to update an existing branch: git rebase origin/master
   ```

### Quick checklist before opening a PR

- [ ] Branch is freshly based on / rebased onto `origin/master`.
- [ ] The PR base is `master` (not a feature branch).
- [ ] It is a **new** branch/PR, not a push to an already-merged one.
- [ ] `git log origin/master..HEAD` shows only the commits you intend to land.

## Building and running the compiler

- The compiler is **`dist/rgrc.js`**, and it is committed. `npm run compile`
  builds it from `compiler/*.rgr` with the current `dist/rgrc.js` and copies
  `Lang.rgr` / `stdops.rgr` next to it. Nothing is written to `bin/output.js`
  any more. `git checkout dist/rgrc.js` restores the last good build.
- `RANGER_LIB` is not needed. `dist/rgrc.js` finds `Lang.rgr`, `stdops.rgr`
  and `lib/` beside itself and in `../compiler/` and `../lib/`. The native
  self-host builds (`npm run selfhost:build:*`) copy the library beside the
  binary. Just run `node dist/rgrc.js -l=<target> file.rgr -d=<dir> -o=<name>`.
- A user program compiled without `-d` is written to `bin/<name>.js` under the
  current directory. That is program output, not the compiler; `bin/output.js`
  is ignored and must not be committed.
- `npm run selfhost:check:<target>` compiles the compiler for a target and
  runs that target's compiler or syntax check over it (`cpp`, `go`, `java`,
  `python`, `rust`, `llvm`, …).

## Optionals

- `if (!null? x) { … }` narrows `x` in the then block: `x.field` and
  `x.method()` need no `unwrap` there, also under `-strict`. `&&` of `!null?`
  checks narrows each one, and a path (`a.friend`) is narrowed as a whole.
- Not narrowed yet: `||`, the code after an early
  `if (null? x) { return … }`, the else branch, and optional `int` / `double`
  values (`(unwrap n)` is still needed for arithmetic). `def q:T x` keeps `q`
  optional. Extending narrowing to early returns and else branches is planned.
- Without `-strict` the compiler unwraps optionals automatically wherever
  they are read, so a missing check is not reported. Use `-strict` to find
  them.
- On C++ every `@(optional)` is a `std::optional<T>` (objects are
  `std::optional<std::shared_ptr<T>>`). There is no `r_optional_primitive` any
  more. Tests and docs that expect `NULL` checks or `r_optional_primitive`
  describe the old output.

## Ranger language gotchas

Ranger is **LISP / S-expression based**. Full answers with compiled output are in
the [FAQ](https://terotests.github.io/Ranger/docs/faq/#why-does-my-call-not-compile).
Short form:

- **A call on a dotted receiver may be written bare.** `return this.helper()`,
  `return P.staticHelper()`, `return a.b().c()` and `def v:int (this.helper() + 1)`
  all parse: the parser folds a `(` that touches a dotted name onto that name.
  `return (this.helper())` still works and is what older code says. A callee
  that is **not** dotted — a lambda held in a local — still needs its own
  parentheses: `return (fn1(3))`. See ISSUES.md #63.
- **One statement per line.** `{ def c:int 5 return c }` is a parse error.
- **Never start a statement with a parenthesised receiver.** Bind first:
  `def recv:T (expr)` then `recv.method()`. Inside an expression it is fine,
  including as an operand of an infix operator: `((unwrap x).v == 1)` and
  `(1 + (f()).v)` work (ISSUES.md #87). A method CALL on a parenthesised
  receiver inside an infix expression -- `((unwrap x).m() + 1)` -- still
  needs the receiver bound first, and so does one in a loop condition, which
  the compiler refuses with a message. See ISSUES.md #65.
- **Import each file via one consistent path form.** Mixed bare vs path imports
  of the same file used to break inherited-method resolution (ISSUES.md #64).
- **Typed array literals need a parenthesised group:** `([] _:T ( a b c ))`,
  not `([] _:T a b c)` (ISSUES.md #67). Untyped: `([] a b c)`.
- **Integer division is `idiv`**, not `/` (real division).
- **Elvis is prefix:** `(?? value fallback)`, not `(value ?? fallback)`.
- **Do not name a method `toString`** — it can crash the compiler; use
  `asString` / `getSymbol` instead (ISSUES.md).
- **Some method names are reserved.** Defining `contains`, `startsWith`,
  `endsWith`, `trim`, `first`, `last`, `remove`, `insert`, `write`, `read`,
  `normalize`, `has` or `sqrt` on your own class compiles, but every call site
  fails with `Class X does not have method …` — the compiler resolves those
  names elsewhere. Rename (`hasSub`, `beginsWith`, `finishesWith`, `trimWs`,
  `lowest`, `highest`, `removeNode`, `insertNode`, `toText`, `fromText`,
  `collapse`, `mentions`, `squareRoot`). They were found one compile at a time
  while writing `lib/evg/EVGPatch.rgr` and the Vega chart door; the list is
  what has been hit, not what exists.
- **Arithmetic on a call result works** when the receiver is dotted:
  `(w - (Foo.bar() + 8))` parses. `(obj.method()).field` still does not — bind
  the object, then read the field.
- No `abs` builtin; inline the absolute value. Prefer flattening over relying on
  the TSX interpreter's limited `extends` / `super`.

## Designing a screen, an app, or reading a Figma file

`gallery/rave` is an application you can check rather than a picture of one:
routes, layouts, pages and a stylesheet with real breakpoints, written as
HTML-shaped markup. When the task is "design a dashboard / a settings page / a
screen" — or "what is in this .fig" — use it rather than hand-written HTML.

    npm run rave -- spec                       the format, once
    npm run rave -- new app.rave --start crud
    npm run rave -- check app.rave             THE LOOP: never finish on RAVE FAIL
    npm run rave -- shot app.rave --width 390  paint a route; includes MEASURE
    npm run rave -- measure app.rave --width 390   overflow, overlap, off the page
    npm run rave -- outline app.rave --width 390   the laid-out tree
    npm run rave -- serve app.rave             the editor, bound to the file
    npm run figma -- check app.fig             a .fig, read the whole way

The same behind MCP as `ranger-design` (`.mcp.json`, `.cursor/mcp.json`), and
written down for an agent in `.claude/skills/rave/SKILL.md` and
`.cursor/rules/rave.mdc`.
