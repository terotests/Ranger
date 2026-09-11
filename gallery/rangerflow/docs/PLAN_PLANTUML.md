# PlantUML in RangerFlow — the plan

Status: **phases 1, 2, 3, half of 4, and 8 are built** · `?scenario=plantuml`
in the web editor, redrawing as you type · `npm run rangerflow:plantuml` ·
`npm run rangerflow:plantuml:parity` → **65/65 checks over 16 examples**,
computed by PlantUML 1.2025.4 · the type sniff, the sequence grammar, the
entity core (class, object, component, deployment, use case, ArchiMate) and the
parity harness are in, with 123 assertions; phases 4-8 are still design. The oracle in §3 was *measured*, not imagined — every command in
this document was run against PlantUML 1.2025.4 on 2026-09-10 and the output is
quoted as it came back.

Mermaid arrived in RangerFlow as 31 readers, 38 recognised diagram types and a
scorecard computed by Mermaid's own parser
([`MERMAID_PARITY.md`](MERMAID_PARITY.md)). PlantUML is the other half of how a
diagram travels through a README, and it is a *bigger* language than Mermaid in
three ways that decide this plan. This is the design for reading it, and for
proving the reading against PlantUML itself rather than against our opinion of
it.

```text
  .puml text
      ↓
  PlantUmlReader        header → type, preprocessor, Creole
      ↓
  PlantUmlEntityModel   entities · links · clusters       ← one model, 8 types
      ↓
  PlantUml*Flow         → FlowGraph
      ↓
  the pipeline that already exists: LayeredLayout · ReadableRouter · EVG
      ↓
  WebGL 2 · SVG · PDF · HTML
```

Nothing below `PlantUml*Flow` learns that PlantUML exists — the same rule the
Mermaid readers follow.

---

## 1. What PlantUML is that Mermaid is not

**It has a preprocessor.** `!include`, `!define`, `!if` / `!else` / `!endif`,
`!procedure`, `!function`, `!$variables`, `%date()`-style builtins — 26
commands, and PlantUML will tell you all 26 (§5). Mermaid has none of this. A
`.puml` file in a real repository is very often three `!include`s and a theme,
and a reader that cannot expand them reads an empty diagram. **This is the
single biggest piece of work in the plan and it is not optional.**

**One grammar covers eight diagram types.** Class, object, component,
deployment, use-case, ArchiMate, and (nearly) state are all *entities*, *links*
and *clusters* with different keywords — `class Foo` and `component Foo` and
`actor Foo` differ in the shape drawn, not in the sentence parsed. PlantUML's
own renderer confirms this: all of them emit the same `class="entity"` /
`class="link"` / `class="cluster"` groups (§3). So feature-complete PlantUML is
*less* work than 20 × Mermaid, not more: one careful entity reader retires the
majority of the surface.

**Labels are Creole, not text.** `**bold**`, `//italic//`, `""monospace""`,
`--strike--`, `__underline__`, `<b>`/`<color:red>`, bullet lists, `|` tables,
`\n`, and `{{...}}` embedded sub-diagrams. Mermaid's whole label story is
`<br/>` and five HTML entities. `FlowText` measures runs with a font table
today; Creole needs it to measure *styled* runs.

**And 479 skinparameters.** Plus `<style>` blocks, `!theme`, and sprites.
No reader will honour all of them; the plan says which ones and why (§6).

---

## 2. What "feature complete" means here

**Twenty diagram types**, confirmed by asking PlantUML to render one of each
and reading the type off its own SVG (§3). Not a list typed from the website —
the Mermaid work learned that lesson the expensive way when five diagram types
hid behind hash-named chunks.

| PlantUML says | opened by | drawn as | reader |
| --- | --- | --- | --- |
| `SEQUENCE` | `@startuml` + `->` | lifelines, messages, activations | `PlantUmlSequenceReader` |
| `CLASS` | `class` / `object` / `entity` | compartment nodes, UML edges | `PlantUmlEntityReader` |
| `DESCRIPTION` | `component`/`actor`/`node`/`usecase`/`archimate` | shaped nodes, links, clusters | `PlantUmlEntityReader` |
| `STATE` | `state` / `[*] -->` | states, nested regions, transitions | `PlantUmlStateReader` |
| `ACTIVITY` | `start` / `:action;` | the beta activity grammar | `PlantUmlActivityReader` |
| `TIMING` | `robust` / `concise` | a timing chart | `PlantUmlTimingReader` |
| `MINDMAP` | `@startmindmap` | maps onto the existing mindmap layout | `PlantUmlMindMapReader` |
| `WBS` | `@startwbs` | a work-breakdown tree | `PlantUmlWbsReader` |
| `GANTT` | `@startgantt` | onto the existing Gantt axis + bars | `PlantUmlGanttReader` |
| `JSON` | `@startjson` | the JSON tree node | `PlantUmlDataReader` |
| `YAML` | `@startyaml` | the same node, YAML in front | `PlantUmlDataReader` |
| `HCL` | `@starthcl` | the same node again | `PlantUmlDataReader` |
| `SALT` | `@startsalt` | wireframes — a widget tree | `PlantUmlSaltReader` |
| `WIRE` | `@startwire` | salt's sibling | `PlantUmlSaltReader` |
| `EBNF` | `@startebnf` | onto the existing railroad renderer | `PlantUmlEbnfReader` |
| `REGEX` | `@startregex` | railroad again | `PlantUmlEbnfReader` |
| `NWDIAG` | `nwdiag { … }` | networks as lanes, nodes on them | `PlantUmlNwReader` |
| `CHEN_EER` | `@startchen` | onto the ERD domain that exists | `PlantUmlChenReader` |
| `BOARD` | `@startboard` | onto the Kanban layout that exists | `PlantUmlBoardReader` |
| `FILES` | `@startfiles` | a directory tree | `PlantUmlFilesReader` |

Eight of the twenty land on layouts RangerFlow already has (mindmap, Gantt,
kanban, railroad, ERD, tree). Six share `PlantUmlEntityReader`. That is the
whole argument that this is finishable.

**Explicitly out**, and *recognised and refused* rather than misread — the rule
Mermaid taught us, that a Wardley map read as a flowchart is a page of invented
boxes:

- `DITAA` (ASCII art → bitmap: a different program), `DOT` (that is Graphviz's
  language, not PlantUML's), `MATH` / `LATEX` (AsciiMath and TikZ),
  `JCCKIT`, `CHRONOLOGY`, `BPM`, `FLOW`, `PROJECT`, `DEFINITION`
- the easter eggs — `sudoku`, `oregon`, `charlie`, `dedication`, `RIP` — which
  PlantUML ships and nobody diagrams with

A header this reader does not know must **not** fall through to the entity
parser. That failure mode is the one a reader of somebody else's file may not
have, and it is a scored check (§4).

---

## 3. The oracle — and it is a good one

> A scorecard we write from imagination measures our imagination.
> — `harness/README.md`

PlantUML has no `getVertices()` to ask, the way Mermaid's parse database has.
It has something better, and the discovery below is what makes this plan worth
starting.

### 3.1 PlantUML annotates its own SVG

Rendered with the **pure-Java layout engine** (`-Playout=smetana`, no Graphviz
needed), PlantUML's SVG carries a complete structural description of what it
understood. Measured, not quoted from a manual:

```bash
$ java -jar plantuml-1.2025.4.jar -Playout=smetana -tsvg component.puml
$ grep -oE '<g [^>]*>' component.svg
<g class="cluster" data-entity="core"  data-source-line="2" data-uid="ent0005" id="cluster_core">
<g class="entity"  data-entity="Web"   data-source-line="1" data-uid="ent0002" id="entity_Web">
<g class="entity"  data-entity="API"   data-source-line="1" data-uid="ent0003" id="entity_API">
<g class="entity"  data-entity="DB"    data-source-line="3" data-uid="ent0006" id="entity_DB">
<g class="link" data-entity-1="Web" data-entity-2="API" data-uid="lnk4" id="link_Web_API">
<g class="link" data-entity-1="API" data-entity-2="DB"  data-uid="lnk7" id="link_API_DB">
```

Every node, every edge, every package — **and `data-source-line`**, which is a
line-level mapping Mermaid's oracle never offered. The `<svg>` element itself
carries `data-diagram-type="DESCRIPTION"`, which is how §2's table was built.

The same annotation appears for `CLASS`, `STATE` and `DESCRIPTION`.
`SEQUENCE` uses its own vocabulary, and gives the two things a sequence reader
can be wrong about:

```
<g class="participant participant-head" data-participant="User">
<g class="message" data-participant-1="User" data-participant-2="API">
```

**Why smetana matters.** Without it, class/component/state/use-case do not
render at all on a machine with no Graphviz — PlantUML draws a *"Cannot find
Graphviz"* error image, which parses as a diagram with zero entities and would
silently score 0. The harness must pass `-Playout=smetana`, and the parity tool
must fail loudly if `Cannot find Graphviz` appears in any oracle SVG.

### 3.2 Two model exports, for free

| | |
| --- | --- |
| `-txmi` on a class diagram | `<UML:Class name="Order"><UML:Attribute name="id: int" visibility="public"/>` — attributes and visibility, which the SVG does not name |
| `-tscxml` on a state diagram | `<state id="Idle"><transition event="go" target="Busy"/>` — transitions with their events |

Both run without Graphviz. They cover exactly the two types where the SVG
annotation is thinnest on *detail*, which is a convenient accident.

### 3.3 Acceptance, for everything

`-checkonly` exits `0` on a file PlantUML parses and `200` on one it does not.
That is a scoreable answer for all twenty types including the twelve with no
annotated groups, and it is the check that catches the failure that matters
most: **a fixture RangerFlow reads happily and PlantUML rejects** means we
invented syntax.

### 3.4 What that gives us, by tier

| tier | types | what is compared |
| --- | --- | --- |
| **A** structural | `CLASS`, `DESCRIPTION`, `STATE` | entity ids, cluster membership, link endpoints, source lines — node by node, edge by edge |
| **A′** detail | class, state | XMI attributes/operations/visibility; SCXML transitions and events |
| **B** semantic | `SEQUENCE` | participants in order, message endpoints in order |
| **C** shallow | the other 12 | the type is read as the type it is, and the `<text>` runs PlantUML drew are all accounted for — enough to catch "read as the wrong thing" and "lost half the nodes" |
| **D** acceptance | all 20 | PlantUML's own verdict on every fixture, and ours on it |

Tier C is honest about being shallow. It is the same bargain
`MERMAID_PARITY.md` struck for the types Mermaid's flowchart database does not
answer for, and it is written in the doc rather than glossed.

### 3.5 Licence hygiene

**PlantUML is GPL-2.0-or-later.** RangerFlow is AGPL-3.0-or-later, so
compatibility is not the issue; *arm's length* is, and it is free here:

- the jar is **run as a subprocess**, never linked, never imported, never
  vendored — the harness shells out to `java -jar`, exactly as it shells out to
  nothing else
- it is **fetched on demand** into `harness/vendor/` (gitignored, like
  `harness/node_modules/`) from Maven Central, and the version is pinned
- **no PlantUML source is copied** into this repository. Not a grammar, not a
  keyword table, not a shape. Everything PlantUML-shaped in the reader is
  derived from its *observable behaviour* or from its own `-language` dump

An oracle you cannot regenerate is a number you have to trust, and one you had
to copy code to build is a licence you have to explain.

### 3.6 The no-Java path

`plantuml-parser` (npm, **Apache-2.0**, 0.4.0) is a pure-JS PlantUML parser.
Verified: it installs and returns structured relations —

```json
[{"left":"User","right":"API","rightArrowHead":">","label":"Request"}, …]
```

It is weaker than the jar (it reports `leftType: "Unknown"`, has no participant
list, and does not model most diagram types), so it is **not** the primary
oracle. It is the degraded path: on a machine with no JVM, the harness scores
the relation-level checks against it and says so in the doc, rather than
pretending the structure was checked. This mirrors the offline path
`rangerflow:parity` already has.

---

## 4. What gets scored

`docs/PLANTUML_PARITY.md`, regenerated by `npm run rangerflow:plantuml:parity`,
never hand-edited. Per fixture:

| check | tiers | fails when |
| --- | --- | --- |
| type | all | PlantUML says `STATE`, we say something else |
| accepted | all | PlantUML rejects a file we read, or rejects one we also reject *for a different reason* |
| entities | A | an id missing, invented, or attached to the wrong cluster |
| links | A | an endpoint pair missing or invented |
| clusters | A | a package's membership differs |
| source lines | A | an entity's `data-source-line` and ours disagree |
| members | A′ | XMI attribute/operation names or visibility differ |
| transitions | A′ | SCXML `event`/`target` differs |
| participants | B | order or set differs |
| messages | B | endpoint pair or order differs |
| text | C | a label PlantUML drew that we did not read, or vice versa |

Plus the two lists `MERMAID_PARITY.md` carries and this one must too:

- **Read anyway** — files PlantUML rejects and RangerFlow reads. Not scored,
  and not a licence to invent syntax: each one is a file somebody wrote.
- **Refused on purpose** — the out-of-scope headers from §2, each of which must
  come back as *nothing* rather than as a misread entity diagram.

**The vocabularies meet in `tools/plantuml-parity.mjs` and nowhere else.**
PlantUML says `ent0002`, `lnk4`, `DESCRIPTION`; RangerFlow says its own names.
The translation lives in the meter, so neither model carries the other's
spelling — the rule `mermaid-parity.mjs` set.

---

## 5. The registry, read off the jar

`java -jar plantuml.jar -language` prints PlantUML's own vocabulary as a
machine-readable dump. Measured:

```
;type            43      class, actor, component, node, usecase, queue, …
;keyword        164      as, hide, skinparam, note, together, namespace, …
;preprocessor    26      !include, !define, !if, !procedure, !$…, …
;skinparameter  479
;color          154
```

That is the coverage matrix, and like the Mermaid detector registry it is
**read, never typed**: a keyword PlantUML adds next release shows up as an
unhandled row the next time the harness is installed, instead of hiding. The
matrix reports four states per row — *read* · *read and dropped on purpose* ·
*unknown* · *n/a for this reader* — and "unknown" is the number the work drives
to zero.

154 colours also removes a whole category of guessing from the style layer.

---

## 6. Scope inside a diagram

**Honoured**: `skinparam` for the ~30 that change geometry or colour we can
actually draw (`monochrome`, `shadowing`, `*BackgroundColor`, `*BorderColor`,
`*FontColor`, `*FontSize`, `linetype ortho|polyline`, `Nodesep`, `Ranksep`,
`handwritten`), `<style>` blocks for the same properties, `!theme` for the
bundled themes, `skinparam style strictuml`.

**Read and dropped, on purpose** — the same category the Mermaid reader has for
`click`: sprites and icon fonts (`<&icon>`, `<$sprite>`), `!pragma` other than
layout, `hide footbox` variants that only move whitespace, and the remaining
~450 skinparameters. Dropped is not the same as an error: a diagram that
renders in PlantUML renders here, minus what a printed page cannot do.

**Refused**: `!include` of a URL, and `!include` that escapes the diagram's
directory. The preprocessor is a file-reading, network-reaching feature and
this reader runs on files people paste into a text box. Local includes are
resolved against an explicit root with the path normalised and checked;
anything else is an error the user sees, not a fetch. **This is a security
boundary, not a limitation, and it gets its own tests.**

---

## 7. Build order

Each phase ends green — tests passing, parity regenerated, a number that went
up. Phase 1 is the one that decides whether the rest is real.

**Phase 1 — the oracle and the corpus.** ✅ **Done**, and it went last rather
than first: the sequence and entity readers were built against the oracle run
by hand, and the harness is what turned those one-off checks into a standing
number. `harness/oracles/plantuml_oracle.mjs` fetches and pins the jar, runs
`-checkonly`, `-Playout=smetana -tsvg` and `-language`, and writes one JSON;
`tests/PlantUmlParityDump.rgr` writes RangerFlow's; `tools/plantuml-parity.mjs`
scores them into `docs/PLANTUML_PARITY.md`. Sixteen fixtures so far, not sixty.

Two things the plan got right and one it did not. Right: `-Playout=smetana` is
load-bearing, and the harness fails loudly on the Graphviz error image rather
than scoring it as an empty diagram. Right: `-checkonly` is the check that
catches invented syntax. Not foreseen: **PlantUML counts a note as an entity**
and gives it an id it made up (`GMN9`), so an entity whose id appears nowhere in
the file the author wrote is flagged as generated and counted rather than named.

Still to do here: `-txmi` and `-tscxml` are not yet read (they are the A′ tier —
class members and state transitions), and the corpus wants the other diagram
types and the awkward corners.

**Phase 2 — the entity core.** ✅ **Done.** `PlantUmlReader` (header
detection, the `@start*` family, multi-diagram files, both comment spellings)
and `PlantUmlEntityReader` covering `CLASS` and `DESCRIPTION`: all 43
declaration keywords, aliases in both directions, quoted names, stereotypes,
the bracket notations, members with visibility and `{static}`/`{abstract}`, the
full link grammar with lengths, direction hints, decorations, cardinalities and
labels, and `package`/`namespace`/`together` plus every container keyword that
opens a brace.

One thing had to be built that the plan did not foresee: **a package is a band,
not a bounding box.** A frame drawn round wherever the layout happened to leave
the members will swallow a class that belongs to no package, and a package that
claims a class it never declared is a diagram that says something false. Each
root package now gets a column of its own and keeps it in every layer. Ranking
inside a cluster the way Graphviz does is still not done, and is what a diagram
with many packages would want.

Still open here: notes are recognised and dropped rather than drawn, and the
`note "x" as N1` / `N1 .. Class` pair with it.

**Phase 3 — sequence.** ✅ **Done**, and done first rather than third: it is
the diagram in the request that started this, and it proved the whole path
before any of the harness existed. `PlantUmlSequenceReader` translates into
`SeqDiagram` — the model and the placer that moved to `core/` so Mermaid and
PlantUML could share them — and from there the drawing, the router, the four
backends and the GPU scene were already written. Participants in all eight
shapes, `activate`/`deactivate`/`destroy`, `alt`/`else`/`opt`/`loop`/`par`/
`break`/`critical`/`group`, `==` dividers, `ref over`, `box`, autonumber,
`create`, self-messages, `->o`, `->x`, the `\` and `/` half-heads and
`-[#red]>` colours. On `fixtures/plantuml/` it agrees with PlantUML's own
renderer participant for participant and message for message.

**Phase 4 — state, activity, timing.** **Activity is done**, and it went before
state because somebody pasted a real one from `real-world-plantuml.com` into the
editor and got told RangerFlow does not draw those yet. The beta grammar —
`start`, `:action;` over as many lines as it likes, `if/then/elseif/else/endif`,
`while/endwhile`, `repeat`/`repeat while`, `fork`/`fork again`/`end fork`,
`split`, `partition { }`, `|swimlanes|`, `-> label;`, `detach` — read into
`ActivityDiagram`, which already had every shape it needs.

The reader carries two pieces of state and needs no more: the open ends the next
statement joins to, and a stack of the structures still open. That is what makes
an `endif` with two live branches converge on the next statement without a merge
node being written anywhere, and what makes an `if` with no `else` leave the
diamond itself open.

One thing the real file taught: **a page is a fixed size and a diagram is not.**
Squeezed onto a landscape sheet, a 2254-unit-tall activity diagram scaled to
0.35, 13-point type became 4.5, and `FlowView.paintShapeLabel` — which gives up
below five points, rightly, because four-point type is a smudge — dropped every
label. The export was a page of empty boxes. `writeAll` now measures first and
grows the sheet to the drawing when the words would not survive the page.

Still open here: state, timing, and swimlanes as columns rather than as a
recorded name.

**Phase 5 — the preprocessor and Creole.** Variables, `!define`/`!definelong`,
`!if`/`!ifdef`/`!else`/`!endif`, `!while`, `!procedure`/`!function`/`!return`,
`!include`/`!includesub` under the §6 sandbox, and the builtin functions.
Creole in `FlowText` as styled runs. **Deliberately late**: it is the phase
whose value is invisible until there is something for it to expand, and the
phase most likely to need a second week.

**Phase 6 — the eight that ride existing layouts.** Mindmap, WBS, Gantt,
JSON/YAML/HCL, EBNF/regex, Chen, board, files, nwdiag, salt. Small readers
onto layouts that exist; several are a day each.

**Phase 7 — style.** Skinparam, `<style>`, `!theme`, the 154 colours.

**Phase 8 — the way in.** ✅ **Done for the part that matters.**
`?scenario=plantuml` in the web demo, sharing one source panel with Mermaid —
the demo dropdown decides which reader gets the text, and each format brings a
gallery of examples. The panel moved to the left of the canvas rather than
above it: a textarea across the whole window costs the drawing the height it
needs, and the drawing is the part you are looking at. Driven by
`rangerflow:web:test` like every other scenario.

One thing that fell out of it: the PlantUML scenario opens on the **class**
example, not the sequence one. A sequence diagram is placed — who across, when
down — so its parts are not draggable, and the page's own self-test starts by
dragging something. A demo whose first move is a drag should open on something
that moves.

Still open here: the benchmark of §8 is not wired up as a command.

---

## 8. The benchmark

Parity is the correctness axis. The second axis is throughput, and PlantUML is
a fair opponent on it because both sides do the same job on the same file.

Measured baseline, 20 diagrams, this machine, JVM warm:

| | wall | per diagram |
| --- | --- | --- |
| `java -jar plantuml.jar -version` (JVM startup alone) | 0.19 s | — |
| `-checkonly` × 20 (parse only) | 0.85 s | **≈ 33 ms** |
| `-Playout=smetana -tsvg` × 20 (parse + layout + render) | 1.58 s | **≈ 70 ms** |

RangerFlow is compared **parse-to-model against `-checkonly`**, which is the
only comparison where both sides are doing the same work; the render number is
reported beside it as context, clearly labelled, and JVM startup is subtracted
and *also* reported, because a fair benchmark does not hide a rival's fixed
cost and does not charge it twice either. A 500-diagram corpus, five runs,
median — the shape `rangerflow:bench` already uses.

The honest framing, which goes in the doc: PlantUML is a mature Java program
doing more than we do (it also lays out and rasterises), and we are a compiled
Ranger reader doing less. Any number that flatters us for skipping work will
say so on the same line.

---

## 9. What will hurt

| | |
| --- | --- |
| **The preprocessor** | A Turing-ish macro language inside a diagram format. It has recursion, and it reads files. Budget a phase, sandbox it, and test the sandbox harder than the feature. |
| **Creole** | Styled runs break the assumption that a label is a string `FlowText` can measure once. Tables and embedded diagrams inside a node are where a reasonable scope line gets drawn. |
| **Twelve types with a shallow oracle** | Tier C cannot prove much. Mitigation: `-checkonly` on every fixture, plus text-run accounting, plus fixtures written to *break* on a misread. Say the tier in the doc; never let a C-tier ✓ read like an A-tier one. |
| **Graphviz** | Four of the biggest types render an error image without it. `-Playout=smetana` fixes it; the harness must *detect* the error image, not score it. |
| **Ambiguous grammar** | PlantUML resolves `a -- b` differently depending on which diagram it thinks it is in. The reader has to commit to a type before it parses a line — the same trap the Mermaid header detection was built to avoid. |
| **The temptation to read the source** | It is GPL and it is on disk. §3.5 exists because the cheap shortcut here is the expensive one. |

---

## 10. What lands where

```text
domains/plantuml/PlantUmlReader.rgr          header, preprocessor, Creole
                 PlantUmlEntityReader.rgr    CLASS + DESCRIPTION (8 types)
                 PlantUmlSequenceReader.rgr
                 PlantUmlStateReader.rgr
                 PlantUmlActivityReader.rgr
                 PlantUml{Timing,MindMap,Wbs,Gantt,Data,Salt,Ebnf,Nw,Chen,Board,Files}Reader.rgr
                 PlantUmlStyle.rgr           skinparam · <style> · !theme
fixtures/plantuml/                           ~60 files, all 20 types
harness/oracles/plantuml_oracle.mjs          PlantUML → out/plantuml.json
tests/PlantUmlParityDump.rgr                 RangerFlow → out/rangerflow_plantuml.json
tools/plantuml-parity.mjs                    → docs/PLANTUML_PARITY.md
docs/PLANTUML_PARITY.md                      generated, never hand-edited
```

New scripts, named after the Mermaid ones so they read the same:

```
rangerflow:plantuml            render fixtures/plantuml/order_flow.puml
rangerflow:plantuml:oracle     build harness/out/plantuml.json
rangerflow:plantuml:dump       build harness/out/rangerflow_plantuml.json
rangerflow:plantuml:parity     score, and rewrite docs/PLANTUML_PARITY.md
rangerflow:plantuml:bench      §8
```

`harness/vendor/` joins `harness/node_modules/` and `harness/out/` in
`.gitignore`.

---

## 11. Done means

- twenty types **drawn**, and every other header **recognised and refused**
- Tier A/A′/B checks at **100%** on `fixtures/plantuml/`, computed by
  PlantUML — or every gap named in the doc with the reason
- every fixture PlantUML accepts, RangerFlow reads; every file RangerFlow reads
  that PlantUML rejects, listed under *Read anyway*
- `!include` outside the diagram root and over the network **refused**, tested
- `?scenario=plantuml` in the web demo, driven by `rangerflow:web:test` like
  every other scenario, so it cannot rot behind the default
- the benchmark published with the rival's startup cost shown, not hidden
- `PLANTUML_PARITY.md` regenerated, with no number in it that a human typed

---

### Reproducing §3 and §8

```bash
mvn -q dependency:get -Dartifact=net.sourceforge.plantuml:plantuml:1.2025.4 -Dtransitive=false
JAR=~/.m2/repository/net/sourceforge/plantuml/plantuml/1.2025.4/plantuml-1.2025.4.jar
java -jar $JAR -language | grep '^;'                     # the registry
java -jar $JAR -Playout=smetana -tsvg diagram.puml       # the annotated SVG
java -jar $JAR -txmi class.puml ; java -jar $JAR -tscxml state.puml
java -jar $JAR -checkonly *.puml ; echo $?               # 0 or 200
```
