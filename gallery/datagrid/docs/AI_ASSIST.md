# Asking a model for help — a design, not an implementation

**Status: draft. Nothing described here is built.** This is the shape the
feature would take if it is built, written down first so that the parts that
are hard to change later — where the key lives, what leaves the machine, what
happens when there is no network — are decided before any of it is typed.

## What it is for

The chart heuristics in [`ChartInference.rgr`](../src/ChartInference.rgr) guess
what a selection is a chart of, and they guess from *shape*: a column of
repeated words is something to group by, a column of numbers under a date
format is an axis, a header with "margin" in it is a rate and must be averaged
rather than summed. Those rules are good enough to make a first chart useful
and they will never be good enough to know that `EBITDA` is money, that `CVR`
is a rate, or that a column called `Type` in this particular workbook has six
values worth splitting a bar by and a column called `Ref` does not.

A model is good at exactly that, and bad at arithmetic. So the split is:

> **The model names things. The spreadsheet computes things.**

Two places it earns its keep, and they are the same request with a different
prompt:

| Ask | What comes back | Who checks it |
|---|---|---|
| "What is this selection a chart of?" | a chart PLAN — category, series, measures, aggregation, title | `ChartInference` validates every column index and falls back to its own plan |
| "Finish this formula" | a formula STRING | `FormulaParser` parses it; a formula that does not parse is never written into a cell |

Neither answer is trusted. Both are *proposals* that the existing code either
accepts or discards, which is what keeps a wrong answer from being worse than
no answer.

## What leaves the machine

This is the part to get right, because it cannot be walked back after the fact.

**Metadata, not the sheet.** What a plan needs is what the columns ARE, and
`ColumnFacts` already computes exactly that without keeping any cell in it:

```json
{
  "sheet": "Sales",
  "range": "A1:G201",
  "rows": 200,
  "columns": [
    {"header": "Date",    "role": "date",      "distinct": 108, "blank": 0},
    {"header": "Region",  "role": "dimension", "distinct": 4,   "blank": 0},
    {"header": "Product", "role": "dimension", "distinct": 5,   "blank": 0},
    {"header": "Qty",     "role": "measure",   "min": 3, "max": 60, "mean": 22.4},
    {"header": "Revenue", "role": "measure",   "min": 49, "max": 1443, "mean": 121.0},
    {"header": "Margin",  "role": "measure",   "min": 0.12, "max": 0.20, "mean": 0.16,
     "numberFormat": "0.00%"}
  ]
}
```

Headers and summary statistics go; **cell values do not**, and there is no
"send three example rows to help it" option, because three example rows of a
payroll sheet are three people's salaries. A model that cannot name a column
from its header, its type and its range is not going to be saved by seeing the
data.

Formula completion needs a little more — the formula being typed and the
headers of the columns it refers to — and no more than that.

**Off by default.** No request is made until someone turns it on. The setting
is per workbook and the app says, in the status bar, when a request is in
flight and to whom.

## Where the key lives

Never in the repository, never in a dotfile beside the workbook, never in a
build.

**macOS: the Keychain.** The key is stored as a generic password item and read
by shelling out to the system tool, so the storage, the encryption and the
per-application access prompt are the operating system's rather than ours:

```bash
# stored once, by hand, by the person whose key it is
security add-generic-password -s "ranger-datagrid" -a "openrouter" -w "sk-or-…"

# read at call time; macOS prompts the first time and remembers the answer
security find-generic-password -s "ranger-datagrid" -a "openrouter" -w
```

That command is what the **SDL/native build** runs. The key is held for the
duration of one request and is never written anywhere, never logged, and never
put in a URL.

**Node hosts** (`datagrid:window`, the DOCX and PPTX window hosts) read
`process.env.OPENROUTER_API_KEY`, or run the same `security` command on macOS
when the variable is unset.

**The browser build has no key and never gets one.** `datagrid:web` is a static
page anyone can open; a key shipped to it is a key published. The serverless
build therefore has the feature *absent* rather than broken — the toolbar
button is not there — and a page that wants it is a page served by a host that
holds the key, which is `datagrid:window`.

| Host | Key source | Feature |
|---|---|---|
| SDL / native | macOS Keychain via `security` | yes |
| Node window host | `OPENROUTER_API_KEY`, else Keychain | yes |
| Serverless browser page | none, by design | no |

## The provider

**OpenRouter** first, because one endpoint reaches many models and the account
that pays is the user's own:

```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <key>
```

The request is JSON in and JSON out, which the app can already build and parse —
`EVGCommands.toJson` and the script engine's JSON reader are both here. What is
missing is an HTTPS client in the two hosts that would make the call, and that
is the actual work: Ranger has no networking, so the call belongs in the host
(`serve.mjs` for Node, an `SDL_net`/libcurl op for the native build) and reaches
the app the way a file picker does — the app says what it wants, the host
answers.

That shape matters beyond convenience: **the app never talks to the network.**
It produces a request description and consumes a response, so the same code path
is testable with a recorded answer and no key at all.

A Google (Gemini) or Anthropic endpoint is the same shape with a different URL
and a different envelope; the provider is a strategy, not an architecture.

## The failure cases, which are the design

A feature that only works is not designed. What it does when it does not work
is:

- **No key** → the button is absent. Not disabled with a tooltip about keys;
  absent. Nobody should learn what an API key is from a chart dialog.
- **No network / a timeout** → the heuristic plan is already on screen, because
  it was computed first and the model was asked to *improve* it. The request
  failing changes nothing the user can see except a line in the status bar.
- **A malformed answer** → discarded silently, same as above. The response is
  parsed into a plan and every column index in it is checked against the
  selection; anything out of range fails the whole answer rather than being
  clamped, because a clamped index is a chart of the wrong column.
- **A confident wrong answer** → this is the one that cannot be defended
  against automatically, so it is defended against by never applying an answer
  without showing it: the picker opens on the heuristic plan and the model's
  suggestion arrives as a *second* option with its reason beside it
  ("Revenue by Region, monthly — Region has 4 values and Date spans a year").
  Applying it is a click, and undo takes it back.

## What it is NOT for

- Not for computing values. A model that adds up a column will eventually add
  it up wrong, and a spreadsheet that is sometimes wrong is worthless. Every
  number in a chart comes from `ChartData`.
- Not for writing to cells without being asked. A formula suggestion goes into
  the formula bar as text to accept, never into the sheet.
- Not a chat window. Two named commands (`chart.suggest`, `formula.suggest`)
  on the same command surface everything else uses.

## If it is built, in this order

1. An HTTPS op in the Node host, and a recorded-response fixture so the app
   half is testable with no key and no network.
2. `ChartAdvice` — build the metadata JSON from `ColumnFacts`, parse a plan
   back, validate every index. Testable entirely against the fixture.
3. The picker's second option, with its reason.
4. The Keychain read, and the native host's HTTPS op.
5. `formula.suggest`, which reuses 1–2 with a different prompt and hands its
   answer to `FormulaParser` before anyone sees it.

Steps 1–3 are the whole feature working, with a fixture standing in for the
model. That is the order to build it in for the same reason the app never talks
to the network: the interesting part is the plan, and the plan can be tested
without a provider at all.
