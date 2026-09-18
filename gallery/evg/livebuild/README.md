# EVG live build

A demo of the case [PLAN_WEB_LOADING.md](../../../PLAN_WEB_LOADING.md) left
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

**Inspect** opens the same EVG inspector as the gallery dashboard
(`npm run evg:inspect:demo` → `?inspect=1&demo=dashboard`). Pick an
element on the phone (or a row in the tree) and Follow up is addressed at
that path: `The user selected 0/2/0 (span "Orders this month") …`. That is
the address `EVGPatch` already uses. `?inspect=1` on the live-build URL
opens the panel on load.

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
