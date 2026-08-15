# AI notes for Ranger

Local material for assistants working in this repository. The **authoritative
language documentation** is the published site — do not treat this folder as a
full language manual.

## Prefer these first

1. [Questions and answers (FAQ)](https://terotests.github.io/Ranger/docs/faq/) —
   common “how do I…?” answers with real compiler output per target
2. [Documentation site](https://terotests.github.io/Ranger/docs/) — install,
   guides, and the **generated operator reference**
3. Repo-root [`AGENTS.md`](../AGENTS.md) — git/PR rules and syntax gotchas

## Deferred structural work

| File | Role |
| --- | --- |
| [`PLAN_REPO_REORG.md`](../PLAN_REPO_REORG.md) | **Deferred** plan: make compiler / language / packages / runtime responsibilities visible. No file moves until active feature work quietens. |

## What remains here

| File | Role |
| --- | --- |
| [`QUICKREF.md`](QUICKREF.md) | Offline syntax card (types, control flow, common ops) |
| [`GRAMMAR.md`](GRAMMAR.md) | Simplified BNF and operator-template notation |
| [`INTROSPECTION.md`](INTROSPECTION.md) | Compiler introspection API for IDE / AI tooling |
| [`ADDING_NEW_LANGUAGE.md`](ADDING_NEW_LANGUAGE.md) | Checklist for adding a compilation target |
| [`ISO_DATE.md`](ISO_DATE.md) | Portable ISO calendar stdlib |
| [`REGEX.md`](REGEX.md) | String-pattern matching without `/regex/` literals |

The old long guides (`INSTRUCTIONS.md`, `EXAMPLES.md`) were removed: they
drifted (`.clj` extensions, obsolete operators) and duplicated the docs site.
