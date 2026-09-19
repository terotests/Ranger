# legacy/docs

Plans and TODO lists that finished. Each one either says so in its own first
lines, or still describes the `.clj` source extension the language dropped.
They are kept because they record why the compiler works the way it does, and
they are out of the root because the root should list what the project is, not
what it used to be planning.

| File | Why it is done |
| --- | --- |
| `PLAN.md` | Two plans in one file. The first section is headed “Go test environment — COMPLETED”; the rest asks for a Python target via `ng_RangerPythonClassWriter.clj`. Python ships. |
| `PLAN_3.md` | Opens with **Status: historical.** Its checklist targets release 3.3.0; npm is at 3.5.1. |
| `INCREMENTAL_PLAN.md` | Every file it links is `compiler/*.clj`. |
| `PLAN_DART.md` | The Dart target exists and the self-host runs it. |
| `PLAN_RGRC_NPM.md`, `TODO_RGRC_NPM.md` | The npm package shipped. The TODO still asks for `CLIProgress.rgr`, which is in `compiler/`. |
| `PLAN_HTTP.md`, `TODO_HTTP.md` | The HTTP operators are in `compiler/Lang.rgr`. Anything still open belongs in `ISSUES.md`. |
| `PLAN_INLINE_STATICS.md` | Status: implemented, verified correct, and **not worth turning on**. |
| `TODO_JPEG.md` | An investigation log. The live JPEG work is `lib/image` and `gallery/pdf_writer`. |
| `RUST_TODO.md` | A status snapshot from December 2025. Open Rust bugs are ISSUES #74, #79, #84, #86 and `TARGET_NOTES.md`. |
| `PROCESS_UI_VIEW_MODELS.md` | Status: **FIXED** in the compiler, v3.0.5+. |

Design notes for `@process` that are still current are in
[`docs/plans/process/`](../../docs/plans/process/).
