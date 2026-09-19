# An app, not a picture of one

The live-build demo streams a screen an agent is designing. It is one screen.
Press a tab on it and nothing happens, because there is nothing behind it —
the phone is the current state of a document, and a document has no states.

The next step is the app: **several pages, a state machine that owns which one
you are on, events from the rendered screen going back into that machine, and
a new page coming out.** The agent designs the views and the transitions; the
program that runs them is Ranger — first as a tool on the host, then compiled
to JavaScript and running in the tab.

This plan is mostly an inventory. Almost every piece exists and is tested; what
is missing is the contract that ties them together and the instructions that
let an agent write against it.

---

## 1. What already exists

| Piece | What it does | Where |
| --- | --- | --- |
| `EVGComponent` | an instance that survives a rebuild — **where `state` lives** | `lib/evg` |
| `EVGReconcile` | what "the same element" is across two builds, by key | `lib/evg` |
| `EVGHostTree` | CREATE / UPDATE / MOVE / REMOVE ops against the tree it described last time, with five `bits` saying what changed | `lib/evg` |
| `evg-dom.js` | a browser host that KEEPS nodes and applies those ops — one DOM node per element, patched | `lib/evg/html` |
| `EVGHitTest.idAt(root,x,y)` | the id under a point: a click, already turned into a name | `lib/evg` |
| `statechart` | a machine as data plus a runner, checked against XState itself (`npm run statechart:parity`) | `gallery/statechart` |
| `EVGMeasure` | is the page right, in numbers | `lib/evg` |
| `EVGA11yFromTree` | roles and names off the same tree | `lib/evg` |
| `rangerdbviewer_web` | **the proof**: a Ranger app compiled to JS, running in a tab with no host, taking pointer events and producing scenes | `gallery/rangerdbviewer/web` |
| `RgLauncherUi` | a two-page UI with a selection and transitions, in Ranger | `gallery/game_engine/v2/menu` |

Read that table twice before writing any code. "An app with its own state,
several pages, events in, a new page out" is four existing files and a
contract, not a runtime to invent.

---

## 2. The shape of an app

An app is a directory the agent owns, beside the document it already edits:

```
app/
  machine.json          the statechart: states, events, transitions, guards
  pages/map.evg.json    one document per state — the screen for that state
  pages/routes.evg.json
  pages/settings.evg.json
```

**The first version has no Ranger in it at all.** A page is an EVG document,
which is the thing the agent already reads with `outline`, changes with
`patch` and checks with `measure`. A machine is JSON, which it can patch the
same way. Nothing is compiled, nothing is sandboxed, and the app is running
the moment the files exist.

Three rules make it small enough for an agent to get right:

- **The machine owns the page.** State `map` renders `pages/map.evg.json`.
  Nothing else decides, and no page changes the page.
- **An id is an event.** `EVGHitTest.idAt` already turns a press into a
  string; the machine says whether that string means anything. Nothing
  registers a handler, so nothing can register the wrong one. A button that
  does nothing is a button with no id — visibly, in the outline.
- **State that is not the page is the machine's context.** A count, a
  selected row, a typed string. `assign` in a transition writes it; a page
  reads it (see §2.1). There is nowhere else to put state, which is the
  point.

### 2.1 Where the text comes from

A page that can only show what was written into it is a slideshow. The
smallest thing that makes it an app instead is one substitution: a text node
may name a context key.

```json
{"tag":"span","text":"{cart.count} items","props":{"font-size":"13px"}}
```

`{key}` is replaced from the machine's context at render, and an unknown key
renders as itself rather than as empty — a missing binding should look wrong,
not look empty. That is the whole templating language, and it is deliberately
too small to compute in: anything that needs arithmetic needs §2.2.

### 2.2 When the app needs code

Lists that come from data, text that needs formatting, anything computed —
that is a Ranger app, and it is stage S4, not stage one:

```ranger
class App {
    def host:EVGComponentHost       ; components that outlive a build
    fn render:EVGElement (state:string ctx:ScVal) { … }
}
```

`EVGComponent` is what makes that possible and what a `.evg.json` page cannot
do: an instance with fields that survives the next build, which is where a
row's own timer or scroll position lives. Until an app needs one, it does not
need one.

### 2.3 The memory

An agent comes back to this app with none of the last pass in its head. It can
read the files — but what it needs first is not a file, it is the shape: which
screens exist, which keys mean what, and what was decided and must not be
undone. Without somewhere to look first it renames a key, adds a fifth screen
the nav does not reach, and stores a total it could have computed.

`app/APP.md` is that somewhere, and the split is the whole design:

| half | who writes it | what it holds |
| --- | --- | --- |
| generated | `evg_app memo`, from the files | every state, its page, the events it takes, the ids on it; every context key and who writes and reads it |
| written | the agent | what the app is for; the decisions a later pass must not undo |

Neither half works alone. All hand-written, it drifts and is then worse than
nothing, because the next pass believes it. All generated, it has no intent in
it — nothing says *why* a key is stored rather than computed.

So the generated half is rewritten from the files on every `memo`, and `check`
compares what is in the file with what would be written now: **a memory that
has stopped matching the app is a finding.** The guide makes reading it the
first move and refreshing it the last one.

## 3. The loop

```
  press (x,y) ──► EVGHitTest.idAt ──► id
                                       │
                                       ▼
                              Statechart runner          ← the only state
                                       │  new state + context
                                       ▼
                              App.render()  ──► EVGElement tree
                                       │
                              EVGLayout + EVGReconcile
                                       │
                              EVGHostTree.build()  ──► ops
                                       │
                                       ▼
                              evg-dom.js: patch the nodes that changed
```

Every arrow in that diagram is a function that already exists. The loop is
what is new, and it is about thirty lines.

**Why ops and not a new display list.** The live-build wire sends a whole
display list per frame, which is right for *designing*: each frame is a new
document. An app is not — pressing a tab changes a fill and a label, and a
host that keeps its nodes can be told exactly that. `EVGHostTree` is that
seam and `evg-dom.js` is a host that speaks it, so a CSS transition, a focus
ring and a real text field have something to attach to. This is the same
distinction as an SSR page versus a re-render: the frontend is dumb, but it
keeps what it has.

---

## 4. Where the compiler runs

**On the host, not in the browser.** This is the part worth being blunt about,
because "incremental compilation in the tab" is the interesting-sounding
answer and the wrong one:

- The host already has the compiler. `bin/output.js -es6 App.rgr -o=app.js` is
  the same command `rangerdbviewer:web` uses to put a whole database in a tab.
- Compiling in the tab means shipping the compiler to the tab — and then a
  compile takes the memory and the seconds of the process that is also
  rendering. That is the container risk in the original question, and it is
  real.
- What people mean by "incremental" here is **fast**, not **in-browser**. One
  file recompiled is one file: `App.rgr` imports the engine, the engine does
  not change, and a compile of the app alone is seconds.

So: the agent writes `App.rgr`, asks for a build, and gets an ES module. If
the compile fails, the errors come back as text — the same errors it gets from
the CLI today, which the `ranger-lang` skill already explains.

**The app runs in its own sandbox.** A Worker, with the app module on one side
and the DOM host on the other:

```
  tab (page)                          Worker (the app)
  ─────────────────────────           ─────────────────────────
  evg-dom.js keeps the nodes    ◄───  ops (JSON)
  a press → {id}                ───►  App.press(id) → render → ops
```

An app that loops forever hangs its worker and the page says so; it does not
take the tab with it. A Worker cannot touch the DOM, which is the property
that makes this safe rather than merely tidy — and it costs nothing, because
the app was never going to touch the DOM anyway: it emits ops.

---

## 5. What the agent is told

The workspace guide gains a section the same shape as the ones it already has
— what exists, what the loop is, and what the numbers say afterwards:

```
## This is an app

`app/machine.json` is the state machine and `app/pages/<state>.evg.json`
is the screen for each state. The machine decides which page is on
screen; a page never changes the page. An element's `id` is the event
its press sends. `{context.key}` in a text node is filled from the
machine's context.

  ./evg-app states           every state, its page, and the events it takes
  ./evg-app press map.tab    send events, print the state each one lands in
  ./evg-app check            every page, measured, and every id checked
                             against the machine
```

`check` is the one that matters and it is why this design is worth the
trouble: **an app has more than one screen, so it has more than one screen to
get wrong.** An agent that can only see the page it just edited will leave the
other four broken. Walking every state the machine can reach, laying each one
out and measuring it is a thing a machine can do and a person will not.

Three failure modes get named explicitly, because all three are invisible
otherwise:

- **A state with no page.** A machine that can reach a screen that does not
  exist is a crash in a demo.
- **A page no state renders.** Work that went nowhere, or a state that was
  renamed.
- **An id that is not an event.** A dead button looks exactly like a live one,
  and a live one whose event the machine ignores in this state looks like a
  bug in the app.

## 6. Stages

Each ends in something that runs. No stage is a refactor.

**S1 — the app as data, no browser, no compiler. ✅ built.**
`machine.json` + `pages/*.evg.json`, walked by `EvgAppTool.rgr`:

```
npm run livebuild:app:build         # compile it once
node gallery/evg/bin/evg_app.js states gallery/evg/livebuild/fixtures/app
node gallery/evg/bin/evg_app.js press  <app> nav.routes route.add
node gallery/evg/bin/evg_app.js check  <app>
node gallery/evg/bin/evg_app.js render <app> nav.routes --out=page.evg.json
npm run livebuild:app               # the fixture app, and a broken one
```

Statechart + EVGTreeJson + EVGMeasure, tied together and nothing else. The
fixture in `fixtures/app` is three screens with a working bottom nav and a
counter only a transition can change; `check` walks all three, measures each,
reads every `id` back against the machine, checks the data model, and refuses
a memory that no longer matches the app.

`model` and `memo` are the other two verbs: the first says who writes and who
reads each context key, the second refreshes `app/APP.md` without touching a
line anybody wrote into it.

Two things this stage already taught, which is what a stage is for:

- **The active tab is the first thing `check` catches.** A nav that
  highlights the page you are on has an id for that page — and the machine,
  written the obvious way, does not take it there. Either the tab has no id
  (and is honestly dead) or the state accepts its own event and ignores it.
  The fixture does the second; the tool refuses to let it be neither.
- **`render` is the verb a browser host wants**, and it fell out of `press`
  plus the binding: send the events, fill `{key}` from the context, hand over
  one document. S2 is that call over HTTP.

**S2 — the loop in the tab.** *(next)*
The host serves the page for the current state; `evg-dom.js` keeps the nodes;
a press goes through `EVGHitTest.idAt` back to the machine, and the ops for
the new page come back. The live-build page gains a **Run** toggle beside
Follow up — design mode streams display lists as it does today, run mode
hands over to the app.

**S3 — the agent's door.**
`./evg-app` in the workspace, the guide section, and `check` in the
orchestrator's test. Only now does an agent get told any of this.

**S4 — code, when data runs out.**
`App.rgr` compiled on the host to an ES module, running in a Worker, emitting
the same ops. `EVGComponent` for instances that outlive a build. Nothing about
the machine or the pages changes, which is the test that the seam was drawn in
the right place.

**S5 — the native host.**
`EVGHostTree` was written for exactly this (`PLAN_NATIVE_HOSTS.md`), and the
ops a Worker posts to `evg-dom.js` are the ops a native host would apply.
Compiling `App.rgr` to C++ or Rust instead of JavaScript is then a target
flag, not a port. **This stage is not scheduled here** — it is the reason the
seam is where it is.

---

## 7. What this is not

- **Not a framework.** There are no lifecycle hooks, no render props and no
  context providers. There is a machine, a render function and an id.
- **Not a second layout engine.** Pages are EVG trees. Everything the agent
  already knows — flex, grid, `measure`, the patchable set — is unchanged.
- **Not a replacement for design mode.** Streaming a whole display list while
  a screen is being drawn is right; ops are right once it runs. The page will
  do both, and the toggle says which.

---

## 8. Open questions

1. **Does the machine live in JSON or in Ranger?** JSON is data an agent can
   patch and a picture can be drawn from (`statechart:viz` already draws one).
   Ranger is typed and refuses nonsense at compile time. The plan above says
   JSON; the argument for Ranger gets stronger the moment guards need real
   expressions.
2. **What is a page's identity across a transition?** Two pages that share a
   header should keep its DOM node. That is `EVGReconcile` keys, and it means
   the header must be keyed the same in both pages — a rule the agent has to
   be told, or `check` has to catch.
3. **Where does async live?** A fetch, a timer, a stream. XState's answer is
   invoked services; the statechart runner does not have them yet. S1–S4 have
   no async at all, deliberately, and the answer can be designed against a
   real app rather than guessed at now.
4. **How much of the app can the agent see at once?** `states` and `check`
   print per-state summaries, which is the token-cheap view. Whether a whole
   app needs an outline of its own — states, pages, ids, transitions, in one
   screen — will be obvious after the first real app is built and not before.
