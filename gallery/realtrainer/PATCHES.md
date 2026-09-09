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

## A deliberate deviation from the reference

**`Duration.tsx` draws the value twice.** With no description it renders the
badge — `45min` — and then a `StatChip` beside it whose only part is `45min`
again. With a description the chip is replaced by the description, so the
duplicate only appears on a bare duration.

This port draws it once. The two `duration` cases in `fixtures/cases.json` are
therefore recorded as `oracle: "spec"` with the reason attached, and `rt:l0`
prints them under "deliberate deviations" on every run. A difference that is
not on that list still fails the gate; this one is on it, with its reason, so
it cannot quietly become the thing everyone forgot to look at.

## Home's composer is more of a control here than there

Six scenarios sit between 93% and 97% for one row of three elements — the
quick-entry composer above the Home feed. The reference publishes it as

```
button "Lisää kuva"
text   "Kirjoita merkintä... esim. \"treeni 60min\""
button ""
```

and this port as

```
button  "Lisää kuva"
textbox "Kirjoita merkintä... esim. \"treeni 60min\""
button  "Lähetä" [disabled]
```

Three differences, and the port is on the better side of all three: the field
is a real textbox a reader can find and type into rather than a line of text
with a placeholder read out beside it; the send button has a name; and it says
it is disabled while there is nothing to send, which is what pressing it does.

The reference's own chat page publishes the same control as `button ""
[disabled]`, and this port matches it there — `chat-send` and `chat-tools` are
at 100%. So the difference is not a rule the port applies everywhere; it is one
button that was given a name because a send button with no name is a send
button nobody can reach.

The reading was checked against the app itself, not inferred from the trace.
`record-reference-trace.mjs --yaml "Kirjoita merkintä"` prints the raw
`ariaSnapshot` lines around a match, and on Home they are

```
- button "Lisää harjoitus"
- button "Päivitä suunnitelma"
- button "Lisää kuva"
- text: "Kirjoita merkintä... esim. \"maanantai: juoksu 45min\""
- button
```

— no textbox in the accessibility tree at all, and a send button with neither
a name nor `[disabled]`, though the component that renders it does pass
`disabled` when there is nothing to send.

**Not fixed.** `traces/parity.json` holds those six scenarios where this row
puts them, and this is the note that says why none of them is 100%.

## The reference reads a run's line with an older parser

The app under `frontend/` parses COMPACT with the **TypeScript**
`@realtrainer/compact-parser`; this port uses the **Ranger v1** parser from
`parser-ranger-v1/src`, vendored under `parser/`. They are not the same parser,
and on one line shape they do not agree:

```
Run "rintauinti" 27.15min 800m
Run "rintauinti" 18.05min 250m
Run "rintauinti" 14.7min 500m | Tampere
```

The Ranger parser reads both fields — 27.15 minutes and 800 metres. The
TypeScript parser drops the distance (`distance.value: null`) and misreads the
decimal minutes: `27.15min` comes back as `15`, `14.7min` as `7`, and
`78.3333…min` as `783333333333335`. It is the decimal point it cannot hold.

What that costs is visible in `home-drills`: the Harjoitteet tab totals the
distance of every endurance drill, and over the seed `rintauinti` comes to
16.2 km here against 3.0 km there — the reference is missing every distance
that shares a line with a decimal duration. The best pace goes the same way,
and `uinti` has no pace at all there because none of its moves kept both a
duration and a distance.

The occurrence counts agree exactly (28 of `rintauinti`, 8 of `uinti`), which
is what says the difference is the parse and not the aggregation:
`src/stats/ExerciseStats.rgr` is the monorepo's own file, import path aside.

**Not fixed here, and not a gap to close.** The port is the one reading the
line correctly. `traces/parity.json` holds `home-drills` at the level the
three drill names cost, and this is the note that says why it is not 100%.

## Fixes that stayed in this repository

These are not parser patches — they are recorded here because they were made in
passing and someone will want to know why.

**`RealTrainerDemo` assigned int literals to `ProgressCtl`'s double fields.**
`bar.maxValue = 100`, six assignments, twelve compile errors: `rt:build` was
failing on main. Fixed to `100.0` and `(int2double doneMoves)`. It survived
because the app had no CI gate at all — `rt:check` and `rt:compact` are in
`scripts/run-gallery-editor-tests.sh` now.
