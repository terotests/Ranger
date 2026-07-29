# Agent guidelines

Notes for AI agents (Claude Code, Cursor, …) working in this repository.

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

## Ranger language gotchas (save yourself hours)

Ranger is **LISP / S-expression based**, so a function or method call passed as an
argument needs its own parentheses. A few consequences bite repeatedly:

- **`return` a call → parenthesize it.** Write `return (this.helper())`, never
  `return this.helper()`. The bare form fails analysis on **all** targets with two
  *misleading* errors — `Could not match argument types for return` +
  `Function does not return any values!` — and the second error often points at an
  **unrelated inherited method** in another file (e.g. a phantom
  `function variable not found updateMatrixWorld`). If you see that, look for a
  bare `return call()` first, not an inheritance/import problem. The call must be
  the *direct* `( )` operand: `return (this.helper() + 0)` still fails — bind to a
  local: `def v:int (this.helper()) return (v + 0)`. See ISSUES.md Issue #63.
- **One statement per line.** `{ def c:int 5 return c }` on a single line is a
  parse error; put each statement on its own line.
- **Never start a statement with a parenthesised receiver.** `(expr).method()`
  at statement level used to silently delete every remaining statement in the
  block — no error, plausible-looking output (ISSUES.md #65; it made four
  `game_provider.rgr` loops infinite). The compiler now rejects it, so bind
  first: `def recv:T (expr)` then `recv.method()`. Inside an *expression*
  (`return ((unwrap x).f())`, `def q:int ((a.b()).c())`) it is fine.
- **Import each file via one consistent path form.** Importing the same file via
  two different strings (a bare name on a library path vs. an explicit
  `dir/x.rgr`) used to double-collect its classes and break inherited-method
  resolution in a subclass — surfacing as a *phantom* `function variable not
  found <inheritedMethod>` at an unrelated file. Fixed (ISSUES.md #64), but
  consistent import paths remain good hygiene.
- **Static array literals: mind the group parentheses.** `([] a b c)` (untyped)
  and `([] _:T ( a b c ))` (typed, elements in a **parenthesised group**) are a
  readable replacement for a run of `push` statements. `([] _:T a b c)` — type
  marker, *no* group — used to compile silently and emit the `_` marker as a
  literal element while degrading the element type to Any; it is now a parse
  error naming the right spelling (ISSUES.md #67).
- **Integer division is `idiv`,** not `/` (which is real division).
- **No `abs` / `=== undefined` builtins;** inline the absolute value, and avoid
  `x === undefined` checks (the TSX interpreter's `extends`/`super` are also
  limited — flatten instead of relying on them).
