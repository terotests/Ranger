# legacy

Directories that were part of the repository root but are not part of the
product. Nothing here is on the compile graph, in an npm script, in a workflow,
or on the documentation site. They are kept in one place rather than deleted
outright so that a directory anyone still wants can be moved back; git history
holds them either way, so deleting this folder costs nothing.

| Directory | What it was | Why it is here |
| --- | --- | --- |
| `adventofcode/` | 99 puzzle solutions | Personal work; no CI, no docs, no imports |
| `fiddle/` | Browser editor (`VirtualCompiler.js`, 776 KB) | Replaced by `playground/` |
| `rust_compiler/` | Four `.rs` files sketching a Rust rewrite of `systemclass` | Never wired to anything |
| `native/` | `httpd/*.clj` HTTP demo | `.clj` era; the HTTP operators live in `compiler/Lang.rgr` |
| `features/` | `any/test_any.clj` and its compiled `bin/` | The `test-any*` npm scripts pointed at `test_any.rgr`, which does not exist — they had been failing |
| `generated/` | 17 `.clj` chess/AI-smoke fixtures | The `gen:*` npm scripts pointed at `.rgr` files that do not exist — same story; its own README already says these are not a tutorial |
| `versions/` | Frozen `compiler.js` per target, 3.2 MB | The git history of `dist/rgrc.js` is the rollback, and README now says so |

The npm scripts that referenced `features/` and `generated/` were removed with
the move. They had been broken for long enough that no one noticed.
