# Upstream patches this demo is carrying

`gallery/realtrainer/parser/` is a copy (see [`parser/README.md`](parser/README.md)).
When this demo needs a change in the parser, the change is made **in the upstream
source** and re-synced — never edited in the copy, which `rt:parser:sync` would
overwrite without a word.

Upstream is `parser-ranger-v1/src` in the RealTrainer monorepo, which is private.
So a patch made here lives in three places until it lands there: in the vendored
copy, as a diff under [`patches/`](patches/), and on this list. **A patch on this
list is not upstream yet.** Anyone with push access to the monorepo should apply
the diff there (`git apply` from the monorepo root); until then a fresh checkout
plus `rt:parser:sync` will silently revert it, and `rt:compact` is what notices.

---

## 1. Measured durations are typed nodes, not JSON strings

**Diff:** [`patches/0001-measured-durations-as-typed-nodes.patch`](patches/0001-measured-durations-as-typed-nodes.patch)
(apply from the monorepo root).

**Files:** `parser-ranger-v1/src/compact_parser_v1.rgr` — `MeasuredDurationNode` (new),
`ExerciseNode.measuredDurations`, `CompactV1JsonExtra.measuredArray`,
`CompactV1Parser.measuredDuration` / `parseMeasuredDurationItem` /
`tryParseMeasuredSpec`.

**Was:** `ExerciseNode.measuredDurationJsonList:[string]` — the parser built the
JSON text for each measured set during the parse and kept the strings. The only
way to read back what `Lankku|2x25s,24s` measured was to parse the parser's own
output again.

**Now:** `ExerciseNode.measuredDurations:[MeasuredDurationNode]`, with `left`,
`hasRight`, `right` and `unit` as numbers and a string. `toJSONString` builds the
array from the nodes.

**Why:** this demo renders `25s, 24s` from those numbers. It is also
`RANGER_STYLE_REVIEW.md`'s finding 2 — stringly-typed interfaces in the AST layer
— for the one node family that had not been converted yet.

**Compatibility:** the emitted JSON is **byte-identical**. Checked by parsing
`MONSTER.compact`, `MINI_TRAINING_PLAN.compact` and `sample.compact` with the
parser before and after and comparing `DocumentNode.toJSONString()` — the same
`MONSTER.compact` corpus the upstream `compact-parity` suite runs 212 cases
against. Same fields, same order, same nulls.

**Not source-compatible:** the field is renamed, so any reader of
`measuredDurationJsonList` has to change. Inside the monorepo there were none —
only the parser itself and its own generated TypeScript. `realtrainer-compact`
re-exports the AST classes (`parseCompactAst`), so the field is reachable from
the published package and this is an API change there, even though no documented
API mentions it.

**A failed token** is now a node with `unit == ""` rather than an empty string.
Ranger has no `null` literal and no optional-return spelling that survived a
compile here, and a result class for one boolean would be worse than the sentinel
the code already used. The callers drop such a node and fail the whole spec,
exactly as before.

---

## Known gaps, found and not patched

The L0 corpus turned up two rows from `COMPACT_FEATURE_MATRIX.md` that the
parser drops. Both sides of the parity gate agree on them, because both consume
the same parser — which is the limit of what L0 measures. It compares the PORT,
not the parse.

| COMPACT | Matrix | What the parser gives | Should be |
| --- | --- | --- | --- |
| `Exercise Veto\|4x6@60kg/2-3min` | §5.4 recovery range | `recovery: null` | value 2, max 3, unit min |
| `Exercise Vatsarutistus\|3xmax` | §5.2 max reps | `reps: null` | `RepCount = 'max'` |

Neither is fixed here: a recovery range and a max-rep count are the parser's
own grammar and worth a test in its suite rather than a patch carried by a
demo. `fixtures/cases.json` keeps both cases, so the day the parser learns them
the recording has to be refreshed and the gate will say so.

## Fixes that stayed in this repository

These are not parser patches — they are recorded here because they were made in
passing and someone will want to know why.

**`RealTrainerDemo` assigned int literals to `ProgressCtl`'s double fields.**
`bar.maxValue = 100`, six assignments, twelve compile errors: `rt:build` was
failing on main. Fixed to `100.0` and `(int2double doneMoves)`. It survived
because the app had no CI gate at all — `rt:check` and `rt:compact` are in
`scripts/run-gallery-editor-tests.sh` now.
