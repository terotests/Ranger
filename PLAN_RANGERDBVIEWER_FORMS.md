# RangerDBViewer — Query and Forms

*A plan for the two halves of LibreOffice Base that RangerDBViewer does not have yet.*

---

## 0. What this is

Base is four things: a schema browser, a table editor, a **query designer**, and a
**forms engine**. RangerDBViewer now has the first two, and both of them turned out
to be components that already existed — the schema and data panels are
`gallery/datagrid`'s `GridPane`, the diagram is RangerFlow, the strip is
`EVGToolbar`.

This plan covers the other two. They are not equally interesting.

**The query designer is mostly assembly.** Base's is a graph of tables on top and a
criteria grid underneath; the graph is RangerFlow, the grid is `GridPane`, and the
thing they produce is `QuerySpec`, which `gallery/rangerdb` already executes without
building a SQL string. Section 7 is short for that reason.

**The forms engine is the interesting one**, and it is interesting for a reason that
has nothing to do with Base. A questionnaire is not a screen layout. It is a small
declarative program:

```
question age:int {
    required
    min 0  max 120
}
question guardian:string {
    visible_when   age < 18
    required_when  age < 18
}
question bmi:double {
    calculated  weight / (height * height)
}
```

with a dependency graph behind it:

```
height ─┐
        ├──► bmi
weight ─┘
age ────────► guardian.visible
   └────────► guardian.required
```

Parsing that, ordering it, evaluating it, invalidating exactly the part of it that a
changed answer touches, and refusing to run when it has a cycle — that is an
interpreter problem, not a widget problem. It is the kind of problem Ranger exists
for, and unlike a widget it means the same thing in JavaScript, Go, Rust, C++,
Kotlin and Python.

So the engine has **no UI in it at all**, and the benchmark is not "how fast do we
render a thousand inputs".

---

## 1. The thesis, stated as a diagram

```
   questionnaire source                       what we compare against
   (SurveyJS JSON / FHIR / XForms / ours)
             │
             ▼
   ┌───────────────────────┐
   │  Questionnaire AST    │                  SurveyJS   — production engine
   │  Question · Choice    │                  Enketo     — XForms + XPath
   │  Rule · Expression    │                  JSON Forms — architecture reference
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │  Dependency graph     │   ← the part that is actually hard
   │  topological order    │
   │  cycle detection      │
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │  Evaluator            │   visible · enabled · required · calculated
   │  AnswerState          │   validation · incremental invalidation
   └──────────┬────────────┘
              │
   ┌──────────┴───────────────────────────────┐
   ▼          ▼            ▼           ▼      ▼
  EVG        DOM        terminal      test   the other targets
  renderer   renderer   renderer      driver (Go / Rust / C++ / Kotlin / Python)
```

Everything above the dashed line compiles to every Ranger target. That is the claim
the benchmark has to make true, and section 8 says how it is measured.

---

## 2. What already exists

Nothing below is written for this. It is the reason the plan is a plan and not a
research project.

| Need | What we already have | Where |
|---|---|---|
| Evaluate JavaScript expressions | `ComponentEngine` over `ts_parser` — a TS/JS evaluator **written in Ranger**, so it cross-compiles | `gallery/pdf_writer/src/jsx/ComponentEngine.rgr` |
| A rule seam that is not the engine | `CellRuleHost` / `CellScripts` — landed with the spreadsheet panels | `gallery/datagrid/src/CellRuleHost.rgr` |
| Lay out a tree of boxes with text | `EVGElement` + `EVGLayout` (2 100 lines, already used for PDF pagination) | `gallery/evg/` |
| Draw it anywhere | `EVGDisplayList` → WebGL 2 / SVG / PDF / SDL | `gallery/evg/EVGDisplayList.rgr` |
| Tabular sub-forms (a repeat group) | `GridPane` — the spreadsheet as an embeddable component | `gallery/datagrid/src/GridPane.rgr` |
| Per-field validation from a DB column | `SqlColumnRules` | `gallery/datagrid/src/SqlColumnRules.rgr` |
| A node graph, editable, with routing | RangerFlow | `gallery/rangerflow/core/` |
| Structured queries without SQL strings | `QuerySpec` / `DBFilter` / `DBSort` / `DBAggregate` | `gallery/rangerdb/src/DBQuery.rgr` |
| Read and write SQL | RangerSQL parser + generator | `gallery/rangersql/` |
| The strip, dialogs, windows | `EVGToolbar`, `EVGWindow` | `gallery/evg/` |
| A cross-target conformance harness | the JS interpreter's existing one | `gallery/js_parser/`, `gallery/ts_parser/` |

The genuinely new code is the model, the dependency graph, the evaluator, the
readers, and the benchmark. That is the plan.

---

## 3. The model

`gallery/rangerforms/model/`

```
Questionnaire      pages, questions, a name, a version
Page               a group with a title and its own visibility rule
Question           name, kind, label, choices, rules, default
QuestionKind       text int decimal bool date time choice multichoice
                   file matrix group repeat computed
Choice             value, label, an optional visibility rule of its own
Rule               a named expression with a role
RuleRole           visible enabled required readonly calculated validate
Expression         source text + the parsed AST + the names it reads
AnswerState        name → Answer, plus per-question computed state
Answer             value, whether it was answered, when
QuestionState      visible enabled required valid, and why not
```

Three decisions worth stating now, because they are the ones that are expensive to
change later.

**A question's name is its address.** Not its index and not a path. Repeat groups
address rows as `items[3].price`, which is what XForms, SurveyJS and FHIR all
effectively do, and what makes a dependency edge a string.

**State is separate from the questionnaire.** The `Questionnaire` is immutable once
read; `AnswerState` is the mutable half. Two people filling the same form share one
AST. This is also what makes serialization trivial and what makes the benchmark's
"10 000-question memory" measurement meaningful.

**A rule's role is part of the model, not part of the expression.** `visible_when
age < 18` and `required_when age < 18` are two rules over one expression, and the
evaluator treats them differently — a hidden question is not merely an unrendered
one, its value is withheld from calculations and from the submitted answers. Getting
that wrong is the classic questionnaire bug: a required field nobody can see blocks
a form nobody can submit.

---

## 4. Expressions — three backends behind one seam

The same shape as `CellRuleHost`, for the same reason: most callers want one
backend, and none of them should carry the other two.

```
ExprHost              parse(source) → ExprProgram ; eval(program, state) → Value
                      names(program) → [string]     ← the dependency edges
 ├── NativeExpr       a small expression language, no external parser
 ├── JsExpr           ComponentEngine — SurveyJS-compatible expressions
 └── XPathExpr        the XForms / ODK subset — Enketo compatibility
```

`names()` is the important method and the reason a host cannot be a black box: a
dependency graph is built from what an expression READS, and an evaluator that could
only be asked "what is the answer" would have to re-run every rule on every keystroke.
That is precisely the difference the benchmark's Q3 measures.

**`NativeExpr` is the default**, and it is deliberately small: literals, question
references, `+ - * / %`, comparisons, `and or not`, `in`, and a fixed function set
(`len`, `sum`, `count`, `today`, `age_of`, `matches`). It has no parser dependency,
it is total (no exceptions, only a typed error value), and it produces bit-identical
results on every target — which is what makes cross-target conformance testable
rather than aspirational.

**`JsExpr` exists so a real SurveyJS form runs.** SurveyJS expressions are
JavaScript-ish, and we have a JavaScript evaluator written in Ranger. This is the
cheapest compatibility win available and it is worth taking early, because it turns
"we support SurveyJS" from a claim into a corpus we can run.

**`XPathExpr` is the stress case.** Enketo's `relevant`, `calculate` and `constraint`
are XPath over an instance tree, which is closer to an interpreter than anything on
the SurveyJS side. It goes last, and it may end up covering a documented subset
rather than all of XPath 1.0 — the plan says so up front rather than discovering it
in month three.

---

## 5. The dependency graph and the evaluator

`gallery/rangerforms/engine/`

```
DependencyGraph    node per (question, role); edge per name an expression reads
                   topological order, computed once at load
                   cycle detection — a cyclic form is REFUSED, with the cycle named
Evaluator          evaluateAll(state)          the initial pass
                   invalidate(state, name)     mark the transitive closure dirty
                   settle(state)               re-evaluate only what is dirty
Validation         per-question, plus form-level rules
Submission         the answers a hidden or disabled question does NOT contribute
```

`settle` is the whole game. Changing one answer in a 10 000-question form must touch
the questions that depend on it and nothing else, and it must reach a fixed point in
one pass because the order is topological. A form that needed iteration to settle is
a form with a cycle, which is refused at load.

Cycles are refused rather than broken. Every engine that "handles" them picks an
arbitrary evaluation order and then behaves differently from the next engine, which
is exactly the kind of thing a cross-target conformance suite would catch and nobody
could fix.

---

## 6. Rendering, which is not the engine's problem

`gallery/rangerforms/render/`

```
FormLayout    Questionnaire + AnswerState → EVGElement tree
FormView      EVGElement → EVGLayout → EVGDisplayList
FormApp       the section: an EVGToolbar strip, the form, a status line
```

`EVGLayout` already lays out a box tree with text, measured by the same measurer the
PDF renderer uses — so a form is printable for free, which is a thing questionnaires
actually need.

Three widget kinds are not new drawing:

- a **repeat group** is a `GridPane` — a repeat is a table of answers, and we now
  have a spreadsheet that embeds anywhere;
- a **choice** question is the value picker `GridPane` already opens (`EVGWindow`);
- a **matrix** question is a `GridPane` with a locked header row, which is the thing
  `lockRange` was added for.

A DOM renderer and a terminal renderer are listed in the diagram because the engine
allows them, not because this plan builds them.

---

## 7. The query designer

`gallery/rangerdbviewer/query/`

Base's query designer is a graph of tables over a criteria grid. We have both halves.

```
   ┌─ RangerFlow ────────────────────────┐
   │  customers ──< orders ──< items     │   drag a table in, drag a join
   ├─────────────────────────────────────┤
   │ field   table   sort  show  criteria│   ← GridPane, columns as validated cells
   │ name    cust    asc    ✓            │
   │ total   orders         ✓    > 100   │
   └─────────────────────────────────────┘
                   │
                   ▼
             QueryModel  ──►  QuerySpec  ──►  the engine
                   └────────►  RangerSQL  ──►  SQL, for reading
```

Two things this must get right:

- **The model is `QuerySpec`, not SQL text.** The SQL view is generated by
  `SchemaToDdl`/RangerSQL for a person to read, and typing into it parses back
  through RangerSQL into a `QuerySpec` — the same round trip the schema panel
  already has, with the same test discipline (parse ours, parse theirs, compare).
- **A query that cannot be expressed structurally says so.** Base silently switches
  to "native SQL mode"; we name what could not be represented, the way
  `DBIntrospector` names its gaps.

Joins are the one genuinely new piece: `QuerySpec` has no join today. It needs
`DBJoin { leftTable, rightTable, leftColumns, rightColumns, kind }` and pushdown
support in the backends, with the capability-fallback engine doing the join locally
when a backend cannot.

---

## 8. The benchmark

This is the part that makes the exercise worth doing, and it has two independent
scoreboards.

### 8a. Against the JavaScript engines

Comparison group, deliberately three:

| Engine | Why |
|---|---|
| **SurveyJS** (MIT) | the production questionnaire engine — branching, calculated fields, validation, pages, quizzes |
| **Enketo Core** | expression- and dependency-heavy; XForms/XPath is the stress case |
| **Ranger forms engine** | the same problem, multiplatform |

JSON Forms and Form.io are read as architecture references, not run as competitors.

The measurements, all on generated questionnaires of stated size so the corpus is
reproducible:

```
Q1  Parse                1 000 / 10 000 nodes, schema text → AST
Q2  Initial evaluation   every visible / required / calculated rule, once
Q3  Incremental update   change ONE answer; settle
                         ← the measurement that matters; a naive engine is O(n) here
Q4  Cascading rules      A → B → C → … → Z, depth 1 000
Q5  Validation           1 000 answers against their rules
Q6  Serialization        state → JSON → state, round trip
Q7  Memory               10 000-question questionnaire, resident
Q8  Cold start           schema text → ready to answer
```

Reported as a table with the JS engines' numbers beside ours on the same machine and
the same corpus, with the harness in the repository. A benchmark whose corpus lives
in a blog post is not a benchmark.

### 8b. Cross-target conformance — the one only Ranger can run

The same engine, from the same source, on every target:

```
Ranger source
   ├── ES6     → Node
   ├── Go      → native
   ├── Rust    → native
   ├── C++     → native
   ├── Kotlin  → JVM
   └── Python
```

For each questionnaire in the corpus and each scripted sequence of answers, every
target must produce the **same answer state, the same visibility set, the same
validation messages, in the same order**. Divergence is a bug in the transpiler or
in the engine, and either way it is worth finding — which is the same argument the
existing JS-interpreter conformance harness already makes.

Semantic identity is the primary scoreboard. Speed on each target is the secondary
one.

### 8c. Compatibility corpora

- **SurveyJS**: their own example forms and expression tests (MIT). Scoreboard: how
  many run to the same answer state as SurveyJS does.
- **FHIR Questionnaire**: the published examples, via LHC-Forms' corpus.
- **ODK/XForms**: the ODK test forms, for `XPathExpr`.

Each reported the way the SQL work reports SQLGlot identity: *N of M identical*, with
the failures named rather than rounded away.

---

## 9. Phases

Each phase ends with something measurable, and no phase ends with "the UI looks
right".

| # | Phase | Exit criterion |
|---|---|---|
| **F0** | Model + `NativeExpr` + dependency graph | A hand-written 20-question form with visibility, requirement and one calculation evaluates correctly; a cyclic form is refused and the cycle is named |
| **F1** | Evaluator with incremental settle | Q3: changing one answer in a 10 000-question form touches only its dependents — asserted by counting rule evaluations, not by timing |
| **F2** | Validation + submission semantics | A hidden required question does not block submission; a hidden question's value is withheld from the submitted answers and from calculations |
| **F3** | `JsExpr` over ComponentEngine + SurveyJS reader | N of M SurveyJS example forms reach the same answer state as SurveyJS on the same answer script |
| **F4** | Renderer: `FormLayout` + `FormView` + the Forms section in RangerDBViewer | The demo form fills in, in the browser, in the serverless page, with the page's own checks reading answers back |
| **F5** | Database binding | A form bound to a table reads a row, writes changes back as an addressed `DBMutation`, and refuses a row no key can name — the same discipline `DataSheet.changes()` already has |
| **F6** | The benchmark harness, Q1–Q8, against SurveyJS and Enketo | A table in the repository, reproducible with one command |
| **F7** | Cross-target conformance | The corpus runs identically on ES6 / Go / Rust / C++ / Kotlin / Python, or the divergences are named |
| **F8** | `XPathExpr` + XForms reader | A documented subset of ODK's test forms, scored |
| **Q1–Q3** | The query designer (section 7), in parallel from F4 | A join built in the graph runs on SQLite, DuckDB and RangerDB, and round-trips through RangerSQL |

F0–F2 are the engine and are worth doing even if nothing else here happens. F3 is the
first phase that produces a number somebody outside the project would care about.

---

## 10. What this is deliberately not

- **Not a form builder.** Editing a questionnaire graphically is a later, separate
  thing. Reading one, evaluating one and filling one in come first, because a builder
  for an engine nobody has measured is a builder for the wrong engine.
- **Not a React/Angular/Vue integration.** Those are renderer bindings for engines
  that live in a browser. Ours does not.
- **Not full XPath.** Section 4 says a subset, and F8 says which one.
- **Not a claim that we are faster than SurveyJS.** The benchmark exists to find out.
  If the honest answer is that a mature JS engine beats us at Q1 and we beat it at
  Q3, that is a useful and publishable result, and it is the result the architecture
  predicts.

---

## 11. First commit

`gallery/rangerforms/model/` + `gallery/rangerforms/expr/NativeExpr.rgr` +
`gallery/rangerforms/engine/DependencyGraph.rgr`, with a test that builds the
`age / guardian / bmi` form from the top of this document, asserts the topological
order, asserts that setting `age = 17` makes exactly `guardian.visible` and
`guardian.required` dirty and nothing else, and asserts that a form with
`a visible_when b` and `b visible_when a` is refused with both names in the message.
