# RangerForms against SurveyJS

```
npm install --no-save survey-core
npm run rangerforms:bench            # the table
node gallery/rangerforms/bench/bench.mjs --verbose   # every differing line
node gallery/rangerforms/bench/bench.mjs --case text
```

Both engines are given the same SurveyJS form definition and the same script
of answers. After the initial pass and after every step, each is asked what it
believes about every question — showing, required, and the value — and the two
answers are compared line by line.

`survey-core` is not a dependency of this repository and this is not part of
`npm test`: a comparison needs the thing being compared against, and the
repository does not carry it.

## What the buckets mean

| bucket | what it means |
|---|---|
| **identical** | every line agreed, at every step |
| **differs by design** | the only differences are ones the case NAMES, in `knownDifferences`, with the question and the reason |
| **differing** | a difference nobody claimed. A failure. |
| **unsupported** | `SurveyReader` could not fully represent the form and said so. Not counted as agreement. |

Three of those buckets exist to stop the headline number from being a lie.

**Unsupported is not a pass.** A reader that quietly dropped `validators`
would agree with SurveyJS on every case that did not use them. So every
property the reader does not understand goes into `Questionnaire.gaps`, and a
form with any gap is scored apart from the ones that were really run.

**By design is not a pass either**, and it is not a failure. Some divergences
are decisions, and a benchmark that scored them as defects would be pressure to
give the decision up. So a case names its own, out loud, and anything *not*
named there is a failure — adding to the list is a visible act in the diff.

## The one decision that shows up here

`empty is not zero`. A calculation over an unanswered question is unanswered:

```
weight / (height * height)     nothing answered → unanswered, not 0
sum(a, b, c)                   b unanswered     → a + c
first + ' ' + last             nothing answered → nothing, not " "
```

SurveyJS reads a blank as `0` (or `""`) and computes. Both are defensible; ours
is the one that does not fill a fresh form with zeroes and does not tell
somebody their BMI is 0 before they have said anything. See
`model/FormValue.rgr`.

The exception, also deliberate: a COMPARISON against an unanswered question is
`false`, not unanswered, because a rule has to decide something and hiding a
follow-up is the safe direction. That one agrees with SurveyJS, which is why
`branching` is identical.

## The corpus

One file per case: a SurveyJS `survey`, a `script` of answers applied in order,
and optionally `knownDifferences`.

| case | what it is for |
|---|---|
| `01-branching` | a follow-up that appears and becomes required together |
| `02-calculated` | a calculation, and a question that reads the calculation |
| `03-choices` | `contains`, `anyof`, `allof` over single and multiple choice |
| `04-logic` | `&&`, `\|\|`, `<>`, postfix `empty` / `notempty`, `iif` |
| `05-enable-readonly` | shown but switched off, and a required question that is hidden |
| `06-pages` | a page whose condition hides everything on it |
| `07-numbers` | `sum`, `min`, `max`, `avg`, `round` |
| `08-text` | text comparison, containment and joining |
| `09-unsupported` | a form the reader must REFUSE to score |

`06-pages` is worth a note. SurveyJS keeps a question's own visibility apart
from its page's, and `q.isVisible` reports 1 for a question on a hidden page.
We fold the page's condition into every question on it, because what a person
can see is one fact and not two. The harness therefore asks both sides the
question that matters — is it on screen — rather than comparing a flag that
means different things.

## The other two comparisons

| | what it is | needs |
|---|---|---|
| `BENCHMARK.md` | the eight timings, beside SurveyJS | `survey-core` |
| `XFORMS.md` | ODK XForms against Enketo's own XPath evaluator | `openrosa-xpath-evaluator`, `jsdom` |
| `CONFORMANCE.md` | the same engine on es6 / python / go / cpp | nothing but the repository |

## What is not measured yet

The eight timings from `PLAN_RANGERDBVIEWER_FORMS.md` (parse, initial
evaluation, incremental update, cascades, validation, serialization, memory,
cold start). This harness answers "does it agree", which has to come first:
being faster than an engine you disagree with is not a result.

The one number it does report is `rule evaluations` for the cases that agree —
a count, not a time, and the same on every target.
