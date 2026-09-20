# EVG live build

A demo of the case [PLAN_WEB_LOADING.md](../../../docs/plans/PLAN_WEB_LOADING.md) left
open: a screen whose content is not knowable at build time, streamed as EVG
display lists while an agent builds it.

The user asks for a kind of application. On the server, Ranger applies
`EVGPatch` ops to an EVG tree, lays it out, and emits the display list. The
browser never runs the layout engine. It paints whatever arrived, with the
same SVG backend every other EVG page uses, and it shows the thinking tokens
and the Ranger source as they are produced.

```
  prompt ──► server (Ranger)
                │  thinking tokens
                │  EVGPatch ops          ← the delta
                │  EVGDisplayList JSON   ← the picture
                │  App.rgr               ← the code
                ▼
              SSE ──► browser (evg-html.js)
```

This is possible because those three things already exist. The display list
is a documented wire format (`toJson`, `evg-binary.js`). Ops are the only
way an agent is allowed to change a tree. SSE is how the EVG preview server
already talks to a browser. The new work is the session that ties them
together, not a second painter or a second edit language.

The agent in this demo is **local**. The page and the EVG engine run on
this machine. Which *model* they call is a separate question:

```
  browser  ← SSE ←  this process (task orchestrator)
                         │
                         ├── recipe   this process, no network
                         ├── mock     local CLI, writes doc.evg.json
                         ├── self     this cloud agent, EVGPatch on the workspace
                         ├── Cursor   local CLI, your Cursor subscription
                         ├── Codex    local CLI, OpenAI inference
                         ├── Claude   local CLI, Anthropic inference
                         └── Ollama   local model, no cloud
```

`interface Agent { run(task) }` is `gallery/evg/livebuild/agents.mjs`.
Recipe is the default so a clone without API keys still paints. **This agent**
is the Cursor cloud agent in the same container: it edits `doc.evg.json`
with `EVGPatch` while the host streams frames. **Cursor** is the local
Agent CLI (`agent` / `cursor-agent`) on your machine — the same
subscription as the editor. Pick Codex or Claude when those CLIs are on
`PATH`; they get a temp workspace (`doc.evg.json` + `AGENTS.md`). Inference
for Cursor, Codex and Claude is in the cloud — the agent program is local,
the weights are not. Ollama is the fully-offline slot (`localhost:11434`).

Matching a free-text prompt to a recipe is keyword-based when the
adapter is `recipe`. The other adapters receive the prompt as the task.

## Run it

```sh
npm run livebuild:serve
# open http://127.0.0.1:8765
```

The server compiles the Ranger program if needed, then serves the page and
one SSE stream per follow-up. The page **loads a finished phone dashboard
immediately** — **Follow up** stays enabled and **edits that same phone**.
There is no second box: the prompt plus Follow up *is* the follow-up.
Kind chips (Dashboard, Settings, Invoices, Empty) are labelled **Start over**
and swap the seed. Only those chips wipe the screen; Follow up does not.

`?pace=0` on `/stream` turns the token delay off.

To drive it with **local Cursor** (Agent CLI + your subscription):

```sh
curl https://cursor.com/install -fsS | bash   # once
agent login                                  # or CURSOR_API_KEY
npm run livebuild:withcursor
# open http://127.0.0.1:8765/?agent=cursor
```

That checks `agent` / `cursor-agent` is on `PATH` and logged in, compiles
the live-build program, and starts the page with Cursor selected. The phone
already has a dashboard. **Follow up** edits that same `doc.evg.json`
(Cursor `--continue` in the same workspace). Start-over chips
(Dashboard / Empty / …) are what wipe it.

Without a browser:

```sh
npm run livebuild -- run dashboard     # NDJSON on stdout
npm run livebuild:test                 # the three recipes apply, frames grow
node gallery/evg/livebuild/stream-check.mjs
npm run livebuild:agents               # orchestrator: recipe + mock + Cursor slot
npm run livebuild:web                  # Chromium: paint, click chips, type a prompt
```

## A picture with the ask

**Picture** in the header attaches a PNG or JPEG — or paste one from the
clipboard. The host traces it with Ranger's own bitmap tracer
(`EvgBitmapTracer`, the same engine as `npm run evg:trace:web:serve` and
erazer) the moment it arrives, and leaves three things beside the document
in the agent's workspace:

| | |
| --- | --- |
| `attachment.svg` | the picture as flat colour layers — vector, so every painter draws it |
| `attachment.ops.json` | the `EVGPatch` batch that inserts it, already written |
| `attachment.json` | the palette, each colour with its share of the pixels |

The agent never handles a coordinate: it applies the ops file, or themes the
screen from the palette, and the workspace guide says so. The chip in the
header shows the thumbnail and the colours that were read out of it. The tool
is `lib/evg/tools/evg_image_tool.rgr` (`npm run agent:image`), installed into
the workspace as `./evg-image` so the agent can re-trace at another size or
with another preset.

```sh
node lib/evg/bin/evg_image_tool.js photo.png --out=photo --width=180
{"width":320,"height":221,"layers":8,"colors":[{"hex":"#E3C8A6","share":0.223}, …]}
```

## Next: an app, not a picture of one

This page designs ONE screen. [`PLAN_LIVE_APP.md`](PLAN_LIVE_APP.md) is the
next step — several pages, a statechart that owns which one you are on, and a
press that goes back into it — and its first stage is built:

```sh
npm run livebuild:app:build     # compile the tool
npm run livebuild:app           # the fixture app, and a broken one
node gallery/evg/bin/evg_app.js check gallery/evg/livebuild/fixtures/app
```

An app is `machine.json` and one `pages/<state>.evg.json` per state — data,
not code, so the agent changes it with the same `patch` and `measure` it
already uses. An element's `id` is the event its press sends, `{key}` in a
text node is filled from the machine's context, and `check` walks every state
the machine can reach: a state with no page, a page no state renders and an id
that is not an event are the three defects an agent cannot see and this names.

A screen you designed becomes an app by being pressed. Give the tab bar's
entries ids — `{"op":"set-id","at":"0/3/0","value":"nav.map"}` — and **Run**
does the rest: the host reads the `nav.*` ids off the screen, writes a state
for each and copies the document to `pages/<state>.evg.json`, so every state
starts from the screen that is already there. Nothing for the agent to run,
and nothing to install. A document has no navigation in it, so an agent asked
for four tabs will otherwise hunt for a `goto` that does not exist; the
workspace guide says so before the hunt starts, and tells it the ids are the
whole job.

Every page starts as a copy, so the first thing to expect is a press that
moves the machine over an identical screen — a dead button from the outside.
`check` names the states that share a document and the live page says it
under the phone.

**The app runs in the tab.** `EvgAppWeb.rgr` compiles to a browser bundle the
page loads once: the machine and one document per state go over as data, and
from then on a press is a function call — hit test, transition, next page,
about 2ms, no process and no tool on anybody's machine. That matters more
than the speed: an agent on the other side of a network has no shell here,
and a runtime that needed one was a runtime only this laptop could run. A
CODE app is a compiled program the server holds open, so it stays on the
server, and the page says which it is showing.

```sh
npm run livebuild:app:web    # build the browser runtime by hand; the server
                             # builds it on demand
```

## Controls the agent does not have to draw

A switch drawn out of a rounded box and a circle looks right in the
screenshot that prompted it and is not a control: nothing presses it, nothing
reports its state, and a reader is told about a `div`. `gallery/ui` has the
real ones — measured against Radix, behaviour by behaviour — and the
workspace now carries the door to them as `./evg-ui`:

```sh
./evg-ui list                     what exists, one line each
./evg-ui spec switch              props, classes, what it is measured against
./evg-ui add switch --name "Wi-Fi" --checked --into doc.evg.json > add.json
```

It also answers with the whole PIECE rather than the part — `row`, `card`,
`appbar`, `chips`, `field` — because a row is the unit a screen is built in,
and an agent handed only the switch draws the other four parts by hand every
time:

```sh
./evg-ui add card --row "Share network|Others can connect|switch:on" \
                  --row "Privacy|Use randomized MAC|chevron" --into doc.evg.json
```

`add` answers a batch `./evg-agent patch` applies as it stands: a `set-css`
carrying the rules the document does not have yet, and an `insert` carrying
the control as a **subtree** — `EVGPatch`'s `insert` learned to take one for
this, because a control is a tree and an agent that can only insert one empty
node at a time builds a drawing instead.

The parts keep their own classes (`ui-switch-track`, `ui-switch-thumb`,
`ui-checkbox-box`, `ui-checkbox-mark`), so restyling one is editing rules, not
redrawing boxes. What the kit does not have, the guide tells the agent to say
rather than fake: a drawing of a calendar is worse than an honest "there is
no calendar here yet" — it looks finished and does nothing.

```sh
npm run ui:kit:check    # every catalogued control builds, draws and is styled
npm run livebuild:agents  # …and the workspace really carries the door
```

## CSS, and things CSS cannot draw

A document carries a stylesheet — a `css` block beside the tree — and a node
joins a rule through `class-name`. Four cards that look alike are one rule and
four classes rather than four copies of the same six properties. The sheet is
applied by `EVGLayout`, once per text, so everything that lays a document out
gets the cascade and nothing has to be told about it; an inline property still
outranks it, which is what lets `set-prop` keep meaning what it meant. Class
selectors, the state pseudo-classes and media queries work — `#id` selectors
do not.

`evg-surface-effect` belongs in a rule too. It names a shader that runs over
the element's own box, and the SVG painter has no answer for one — so a screen
that declares a starfield, a ripple or liquid glass is painted by the GPU
painter instead, with the effect driver aging its events every frame. A screen
without effects stays on SVG: cheaper, and its text is selectable.

```css
.sky { evg-surface-effect: starfield; evg-effect-on: always;
       evg-fx-density: 1.6; evg-fx-hue: 228 }
```

```sh
npm run livebuild:fx    # the sheet round-trips, the cascade reaches the list,
                        # the page switches painters, and the picture moves
```

## Keeping one

**Save** writes the session's own files — `doc.evg.json`, and `app/` when the
screen became an app — under `~/.evg-livebuild/saved/<name>/`, with what was
asked for beside them. **Saved…** opens one back into the session: the
document and its app go where the session keeps them, so the page carries on
as if the design had been made just now, still editable and still runnable.

Nothing is derived on the way out, so nothing can drift on the way in. The
folder is outside the repository on purpose — these are one person's designs
on one machine, not source. `EVG_LIVEBUILD_SAVED` moves it, and the two calls
(`saveSession`, `openSaved`) are the seam a database sits behind if this ever
runs on a server.

```sh
npm run livebuild:save    # save, start over, open — byte for byte, app and all
```

Three things that used to throw a design away and no longer do: turning Run
off, reloading the page, and restarting the server. Only the seed chips start
over.

Turning Run off shows the document as it stands. It is not "start over" —
only the seed chips (Dashboard / Empty / …) are, and they rewrite the
session's phone from a fixture and drop the app that was made from it.

**Run** in the header hands the phone to that app: the machine owns which page
is on screen, a click is a point the host turns into an event through
`EVGHitTest`, and the page for wherever it landed comes back. The event trail
is under the phone, and a press on something the state does not answer to says
so rather than doing nothing quietly.

An app may also be **code**: an `App.rgr` beside the machine makes it a
program, compiled to a module the server imports once and holds open. That
buys the two things a document cannot do — a list that comes from the context,
and an instance that outlives a build (`kit.use`) — and it makes a press one
call instead of three processes: ~8ms rather than ~310ms.

```sh
npm run livebuild:codeapp    # the fixture code app, and a broken one
EVG_LIVEBUILD_APP=gallery/evg/livebuild/fixtures/codeapp npm run livebuild:serve
```

`app/APP.md` is the app's memory — half generated from the files (every state
and event, every context key and who writes and reads it), half written by the
agent (what the app is for, and the decisions a later pass must not undo).
`memo` refreshes the generated half without touching a line anybody wrote, and
`check` reports a memory that has stopped matching the app, because the next
pass will believe it.

## The wire

One JSON object per line. The HTTP door copies each line onto an SSE event
named for `t`.

| `t` | What it is |
| --- | --- |
| `session` | kind, prompt, page size |
| `think` | the current thought, whole |
| `token` | one word of that thought |
| `ops` | the `EVGPatch` batch that just applied |
| `code` | `App.rgr` so far |
| `frame` | `{width,height,ncmds,added,nodes,list}` — `list` is `EVGDisplayList.toJson()` |
| `measure` | the layout in numbers after the last frame — findings with amounts, `bottomFree`, `tight` |
| `done` | `ok`, step count, command count |

The page shows `measure` under the phone: **layout ok** or the number of
findings, then what they are. The same answer is written into a workspace
agent's folder as `layout.json` after every save, because an agent that edits
`doc.evg.json` by hand is otherwise writing markup at a screen it cannot see.
The checks are `EVGMeasure` in `lib/evg`, shared with `npm run agent --
measure`, so the page and the agent cannot disagree about whether a screen is
right — the server used to carry a smaller copy that only tested the page
edges, and it reported a clean screen while the cards sat on each other.

`ops` comes from the recipe, and from a workspace agent whenever it edits
through `./evg-agent patch` — the shim in the workspace records each applied
batch and the host streams it. An agent that rewrites `doc.evg.json` by hand
still repaints, and the panel stays empty: that is the honest answer to "was
this an EVGPatch edit", not a lost event.

`think` is one whole thought and `token` is one whole word, however the agent
produced them. A CLI told to stream partial output (Cursor) sends half-words
and then repeats the finished message; `agents.mjs` joins the pieces, holds
back a tail that is not a word yet, and drops the repeat, so the page is not
left rendering "tekst ip ino" down three lines. The thought boundary arrives
before the words from the recipe and after them from a streaming CLI, and the
page takes the paragraph break at the next word either way.

A frame is a full list, not a command-level diff. A phone screen is a few
kilobytes gzipped; sending the list is cheaper than inventing a patch
format the painters do not read. The *semantic* delta is the ops event.
`added` on the frame is how many draw commands appeared since the previous
one, so the UI can say "+12" without walking the list.

## Files

| | |
| --- | --- |
| `EvgLiveBuild.rgr` | session, recipes, NDJSON emitter |
| `EvgLiveBuildMain.rgr` | `run` / `kinds` CLI |
| `EvgLiveBuildTest.rgr` | the three recipes, in process |
| `serve.mjs` | HTTP + SSE |
| `agents.mjs` | `Agent` interface: recipe, mock, self, Cursor, Codex, Claude, Ollama |
| `mock-agent.mjs` | a local CLI that writes `doc.evg.json` — no model |
| `self-agent.mjs` | stays open while this cloud agent patches the tree |
| `withcursor.mjs` | `npm run livebuild:withcursor` — local Agent CLI + login check |
| `/attach` in `serve.mjs` | a picture in, traced; `lib/evg/tools/evg_image_tool.rgr` does the tracing |
| `restyle.mjs` | recipe follow-ups: colour / size / radius from the ask |
| `agents-check.mjs` | orchestrator: recipe, mock workspace, self slot |
| `browser-smoke.mjs` | Chromium: three recipes and a typed prompt |
| `web/index.html` | the page |
| `stream-check.mjs` | parse the CLI stream as JSON |
