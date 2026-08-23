# RangerForms against Enketo's XPath evaluator

```
npm install --no-save openrosa-xpath-evaluator jsdom
npm run rangerforms:xforms
node gallery/rangerforms/bench/xforms.mjs --verbose --case select
```

```
  branching    identical          3 nodes over 5 steps
  calculate    differs by design  empty is not zero
  select       identical          5 nodes over 6 steps
  operators    differs by design  empty is not zero
  constraint   identical          2 nodes over 6 steps
  unsupported  unsupported        child: a repeat group is not read (+3 more)

  identical    3 of 5 scored
  by design    2
  differing    0
  unsupported  1
```

The oracle is `openrosa-xpath-evaluator` — the evaluator Enketo itself runs —
over a real XML instance built from the same answers. For every step of every
case, every `relevant`, `required`, `constraint` and `calculate` in the form is
put to both, and the two answers are compared.

## Why the expressions and not a whole engine

Enketo Core is a browser application: running it headlessly to compare form
state would be comparing our engine against its DOM. Its XPath evaluator is a
library, and the expressions ARE the part the plan called the stress case —
`relevant`, `calculate` and `constraint` are where an XForm keeps its
behaviour.

The oracle has no dependency graph, so the harness keeps its instance the way
an engine would: after each step it re-runs every `calculate`, writes the
result into the instance node, and repeats until nothing changes. That is the
slow way to do what `settle` does in one pass, and the right way for an oracle
that has no graph. Without it the comparison was wrong in our favour — a rule
reading a calculated node saw an empty node on their side and a value on ours.

## The subset

Supported, because this is what ODK forms are written in:

| | |
|---|---|
| paths | `/data/age`, `/data/group/age`, `.`, `../sibling` |
| operators | `= != < <= > >=`, `and or not()`, `+ - *`, `div`, `mod` |
| literals | `true()`, `false()`, strings, numbers |
| functions | `selected`, `count-selected`, `string-length`, `if`, `coalesce`, `concat`, `number`, `boolean-from-string`, `min`, `max`, `round`, `sum` |

Refused, by name, so a form using any of it is scored as unsupported rather
than as agreeing:

| | why |
|---|---|
| `[...]` predicates, `axis::` | they address a TREE |
| `instance()`, `indexed-repeat()`, `position()`, `current()` | the same |
| `count()` over a node set | a different question from `count-selected` |
| `today()`, `now()`, `date()`, `format-date()`, `decimal-date-time()` | calendar arithmetic; an approximation that agreed most of the time would be worse than an absence that is named |
| `regex()` | no regular-expression engine here |
| `repeat` groups | the tree again — and the same gap as the first four rows |

`.` and `../sibling` are resolved by the READER, before the expression is
stored, because `Questionnaire.compile` walks rules without saying which
question it is holding. What reaches `XPathExpr` is context-free, which is
also what makes an error message name something a person can search the form
for.

## The one decision that shows up

`empty is not zero`, the same one the SurveyJS comparison reports. XPath makes
arithmetic over a missing node `NaN`; we make it unanswered. Both are
defensible; ours is the one that does not put `NaN` in front of somebody who
has not answered yet.

The exception, and it agrees with XPath: a COMPARISON against an unanswered
node is false on both sides — `NaN > 25` is false and so is our unanswered
`> 25`. Which is why `branching` and `constraint` are identical rather than
by-design.

## What the corpus is

Six ODK-idiomatic XForms in `bench/xforms/`, each with an answer script. They
are written here rather than taken from ODK's own suite because ODK's is a
test suite for ODK: it exercises the tree model this deliberately does not
have, and a score against it would be a score against the gaps rather than
against the subset. The six cover the constructs a real form is made of, and
the sixth exists to be refused.

`XFormTest` covers the same ground in `npm test`, with no oracle installed —
53 assertions over the rewrite, the reader, the fill, and the refusals.
