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
| `measure` | overflow / off-page findings after the last frame |
| `done` | `ok`, step count, command count |

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
| `restyle.mjs` | recipe follow-ups: colour / size / radius from the ask |
| `agents-check.mjs` | orchestrator: recipe, mock workspace, self slot |
| `browser-smoke.mjs` | Chromium: three recipes and a typed prompt |
| `web/index.html` | the page |
| `stream-check.mjs` | parse the CLI stream as JSON |
