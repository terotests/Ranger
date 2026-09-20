# docs/plans

Plans that still describe unfinished work. They used to sit in the repository
root, where seventy-one markdown files made it impossible to tell the product
from the backlog.

A plan belongs here while it is being worked on. When it is finished, it moves
to [`legacy/docs/`](../../legacy/docs/) or is deleted — git history is the
archive. A plan about one gallery project or one library belongs next to that
code instead.

| Area | Files |
| --- | --- |
| Language | `PLAN_LANGUAGE_IMPROVEMENTS.md`, `SPEC_SEMANTICS.md`, `PLAN_OPERATORS.md`, `PLAN_METHOD_CHAINING.md`, `PLAN_TREE_LITERALS.md`, `PLAN_GENERICS.md` |
| Shapes / closed variants | `PLAN_SHAPES.md`, `SHAPES_IS_OPERATOR.md` |
| Ownership and the Rust output | `PLAN_CODEGEN_OWNERSHIP.md`, `PLAN_OWNERSHIP_SOUNDNESS.md`, `PLAN_RUST_OWNERSHIP.md`, `PLAN_RUST_IDIOMATICITY.md`, `RUST_ISSUES.md` |
| Target idiom | `PLAN_CPP_IDIOMS.md`, `PLAN_RUST_SEMANTIC_IDIOMS.md`, `PLAN_TARGET_IDIOMS.md`, `PLAN_SELFHOST_TARGETS.md` |
| LLVM / WASM | `PLAN_LLVM_MEMORY.md`, `PLAN_WASM_BACKEND.md`, `PLAN_WASM_LAMBDAS.md`, `PLAN_WASM_MEMORY.md`, `PLAN_WASM_OPERATORS.md`, `PLAN_WASM_PLUGINS.md` |
| Portable JS stdlib | `PLAN_JS_STDLIB.md`, `PLAN_JS_STDLIB_CRYPTO.md`, `PLAN_JS_STDLIB_DATE_INTL.md`, `PLAN_JS_STDLIB_MATH.md`, `PLAN_JS_STDLIB_TEXT.md` |
| Output and input formats | `PLAN_FORMAT.md`, `PLAN_FORMATS.md` |
| Tooling and docs | `PLAN_STATIC_ANALYSIS.md`, `PLAN_API_DOCS.md`, `PLAN_DOCS.md`, `PLAN_AI_BRIDGE.md`, `PLAN_WEB_LOADING.md` |
| `@process` | [`process/`](process/) |

`PLAN_DOCS.md` describes a pipeline that is implemented; it stays as the record
of how the documentation site is built. `PLAN_WEB_LOADING.md` is design only —
nothing in it is implemented.
