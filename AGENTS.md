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

- Outside `gallery/`: **MIT** unless a file says otherwise (`LICENSE-MIT`).
- Under `gallery/`: **AGPL-3.0-or-later** unless a file says otherwise (`gallery/LICENSE`, `LICENSE-AGPL-3.0`).
- Root [`LICENSE`](LICENSE) is the mixed-license overview, not a single license text.
- Gallery may import `lib/` and `compiler/`. **Never** import `gallery/` from `lib/` or `compiler/`.
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

## Ranger language gotchas

Ranger is **LISP / S-expression based**. Full answers with compiled output are in
the [FAQ](https://terotests.github.io/Ranger/docs/faq/#why-does-my-call-not-compile).
Short form:

- **`return` a call → parenthesize it.** `return (this.helper())`, never
  `return this.helper()`. The bare form fails on all targets with misleading
  errors (often a phantom `function variable not found …` elsewhere). The call
  must be the *direct* `( )` operand — bind first if you need arithmetic:
  `def v:int (this.helper())` then `return (v + 0)`. See ISSUES.md #63.
- **One statement per line.** `{ def c:int 5 return c }` is a parse error.
- **Never start a statement with a parenthesised receiver.** Bind first:
  `def recv:T (expr)` then `recv.method()`. Inside an expression it is fine.
  See ISSUES.md #65.
- **Import each file via one consistent path form.** Mixed bare vs path imports
  of the same file used to break inherited-method resolution (ISSUES.md #64).
- **Typed array literals need a parenthesised group:** `([] _:T ( a b c ))`,
  not `([] _:T a b c)` (ISSUES.md #67). Untyped: `([] a b c)`.
- **Integer division is `idiv`**, not `/` (real division).
- **Elvis is prefix:** `(?? value fallback)`, not `(value ?? fallback)`.
- **Do not name a method `toString`** — it can crash the compiler; use
  `asString` / `getSymbol` instead (ISSUES.md).
- **Some method names are reserved.** Defining `contains`, `startsWith`,
  `endsWith`, `trim`, `first` or `last` on your own class compiles, but every
  call site fails with `Class X does not have method …` — the compiler resolves
  those names elsewhere. Rename (`hasSub`, `beginsWith`, `finishesWith`,
  `trimWs`, `lowest`, `highest`).
- **Arithmetic on a call result needs a variable.** `(w - (Foo.bar() + 8))`
  fails to parse the `+`; bind the call first (`def b:int (Foo.bar())`) and do
  the arithmetic on the name. The same applies to `(obj.method()).field` —
  bind the object, then read the field.
- No `abs` builtin; inline the absolute value. Prefer flattening over relying on
  the TSX interpreter's limited `extends` / `super`.
