# Ranger as an AI-agent surface — the plan

Ranger's EVG stack already does, headlessly and deterministically, the three
things an LLM agent cannot do for itself when it edits a visual document:
address a node, change it under validation, and **check the result with
numbers instead of eyesight**. This document plans the thin layer that exposes
that to Claude Code, to MCP hosts, and to the gallery apps themselves.

The premise is not "put an LLM in Ranger". It is: EVG is a renderer and a
measurer that needs no browser, so it is the verification loop an agent is
missing. Everything below is one core, four transports over it, and one
widget that three different windows can host.

---

## 1. The surfaces, and which ones are real

The generic advice for "integrating a custom UI into an AI coding agent" lists
four methods. Mapped onto what Ranger actually has, and onto what each host can
actually render:

| Method | Host that renders it | Applies to Ranger? |
| --- | --- | --- |
| **MCP tools** (text + images) | every MCP host, **including the Claude Code terminal** | **Yes — layer 1.** The base case, and the only one the terminal sees. |
| **MCP Apps** (`ui://` HTML resource, `text/html;profile=mcp-app`) | Claude.ai, Claude Desktop, VS Code / Copilot, Cursor, Goose, M365 Copilot | **Yes — layer 2.** This is the interactive canvas in the chat thread. |
| **Wrappers / Electron / IDE panels** | a window you ship yourself | **Yes, but not as a chat client — layer 2b/3.** A VS Code panel and an Electron shell are two more *hosts for the same widget bundle*, and the Electron one is the simplest way to put an agent inside a gallery editor. Wrapping the Claude Code chat UI itself (Claudeck-style) is what we skip. |
| **Standalone app calling the API** | your own app | **Partly — layer 3.** Only for gallery apps that must run outside any MCP host. |

**Correction worth stating once, because it drives the design:** the Claude
Code *terminal* does not render MCP App widgets. It renders text, images and
published Artifacts. MCP Apps are for Claude.ai / Claude Desktop / Cursor / VS
Code. So the tool surface must be useful **without** a widget — structured text
and a PNG — and the widget is an enhancement on hosts that have one. Designing
widget-first would produce a tool that is useless in the terminal, which is
where most Ranger development actually happens.

---

## 2. Why Ranger specifically

Five properties, none of which a JS charting library or a Figma plugin has all of:

1. **Layout is already computed, so verification is arithmetic.** "Does the
   label overflow its box", "do these two nodes overlap", "is this text below
   4.5:1 contrast" are reads off `calculatedX` and `EVGColor`, not vision. An
   agent that can *measure* stops guessing.
2. **No browser, no network, no external assets.** The same render runs in CI,
   in a sandbox, and inside an MCP App's iframe — where the host's CSP blocks
   external domains by default. EVG carries its own fonts and layout, so it
   passes that CSP with nothing declared.
3. **One validator, every target.** `EVGPatch` compiles from one source to
   Node (CLI + MCP server), to the browser (widget + gallery apps), and to
   Swift/Kotlin (native hosts). Three implementations of an edit language
   cannot drift when there is one source.
4. **Many formats, one tree.** `.fig`, Mermaid, PlantUML, DOT, SQL schemas,
   Markdown, and the Office stack already normalize into an EVG tree. One tool
   surface covers a Figma document, a chart, an ER diagram and a PDF.
5. **Stable addresses already exist.** `EVGInspect` structural paths
   (`0/3/k:share`) plus `EVGStyleSheet` selectors. The agent never has to
   invent an identity for a node.

---

## 3. The core: `RangerDoc` + `EVGPatch`

Everything else is transport. This is the only substantial new code.

```
  .fig / .mmd / .puml / .gv / .sql / .md / .tsx / EVG JSON
                          │
                    RangerDoc.open()          ← format adapters (mostly exist)
                          │
                    EVG tree + stylesheet
                          │
        ┌─────────────────┼──────────────────┬────────────────────┐
     outline()         query()            patch(ops)          render()
   (a11y-shaped,    (selector →        (validate → apply    (png / svg / pdf)
    token-budgeted)   nodes + boxes)     → inverse ops)
                          │
                      measure()          ← the lint pass: overlap, overflow,
                                           off-canvas, contrast, hit-target,
                                           missing a11y name
```

### `gallery/evg/EVGPatch.rgr`

An op list, addressed by structural path or selector, validated against the
real property set, and **invertible**:

```json
{
  "doc": "gallery/rangerflow/out/schema.evg.json",
  "base": "sha256:1f3c…",
  "ops": [
    { "op": "setStyle", "at": "0/3/k:title", "prop": "color", "value": "#1f2933" },
    { "op": "setText",  "at": "sel:.card h1", "value": "Orders" },
    { "op": "insert",   "at": "0/3", "index": 2, "node": { "tag": "div", "class": "row" } },
    { "op": "move",     "at": "0/3/5", "to": "0/2", "index": 0 },
    { "op": "remove",   "at": "0/3/9" }
  ]
}
```

Returns:

```json
{ "applied": 5, "inverse": [ … ], "warnings": [], "rejected": [] }
```

Four design rules, each earning its keep:

- **`base` is a content hash.** A patch computed against a stale tree is
  rejected, not merged blindly. The agent re-reads and retries. This is what
  makes an editor safe to share with a human who is editing at the same time.
- **Unknown property is a rejection, not a silent no-op.** Otherwise the agent
  writes browser CSS that EVG does not implement, sees no error, and reports
  success.
- **Every op carries its inverse.** Undo, "show me what the AI changed" as a
  diff, and replay all fall out of the log. No separate undo system.
- **Ops are the only write channel.** No free-form code, no string of CSS, no
  generated Ranger compiled at runtime. The blast radius of a bad model output
  is "a rejected op".

### `measure()` — the part that is genuinely new

A lint pass over the laid-out tree, returning findings with node paths:

| Check | Why an agent needs it |
| --- | --- |
| text overflow / clipped run | The most common LLM layout error; invisible in a thumbnail |
| node overlap | Ditto, and numeric |
| outside viewport / page | Catches "it moved off the artboard" |
| contrast below threshold | `EVGColor` already computes it |
| hit target below minimum | Real accessibility, checked before a human looks |
| missing accessible name | `EVGA11yFromTree` already builds the tree |

One `measure()` call replaces a screenshot round trip and is ~50× cheaper in
tokens. **The agent looks at a PNG to judge taste; it calls `measure()` to
judge correctness.**

---

## 4. Layer 0 — the CLI (`npm run agent`)

The first thing to build, and useful on its own: Claude Code in this repo can
drive it with `Bash`, and read the PNG with `Read`. No protocol, no server.

```
npm run agent -- outline  <doc> [--depth=3] [--at=0/3]
npm run agent -- query    <doc> ".card h1"
npm run agent -- patch    <doc> ops.json        # → inverse ops on stdout
npm run agent -- render   <doc> out.png [--w=1200 --scale=2]
npm run agent -- measure  <doc> [--checks=overflow,overlap,contrast]
npm run agent -- diff     <doc>@a <doc>@b       # structural, not pixel
```

Everything after this is the same six verbs behind a different transport.

## 5. Layer 1 — the MCP server (`tools/ranger-mcp/`)

A thin Node wrapper over the compiled Ranger JS, `stdio` for local use, so it
also works in the terminal where the widget does not:

`ranger_doc_outline` · `ranger_doc_query` · `ranger_doc_patch` ·
`ranger_doc_render` · `ranger_doc_measure` · `ranger_doc_undo`

`render` returns an image content block. `measure` returns findings. `patch`
returns the inverse list. Tool input schemas are generated from the Ranger
`@serialize` class definitions rather than hand-written, so the schema and the
validator cannot disagree.

## 6. Layer 2 — one widget, three hosts

The interactive canvas. Written **once** and given a thin adapter per host,
because all three hosts want the same thing: self-contained HTML in a sandbox
that talks to its container over `postMessage`.

- **What it is:** the EVG document drawn by `gallery/evg/gl/evg-webgl.js`
  (111 KB) or the SVG painter, in a pan/zoom canvas. Self-contained: no CDN,
  no web fonts, no external fetch — so it passes an MCP App iframe's default
  CSP with no exceptions declared, and needs no `localResourceRoots` gymnastics
  in a VS Code webview.
- **What it sends up:** click a node → the widget posts the selection (path +
  box + role) to its host, so the user can say "make *this* bigger" and the
  model knows what "this" is. The single biggest quality win in the plan: it
  removes the guess-which-node step entirely.
- **What it calls down:** the prompt box and the property panel call
  `patch`, and the canvas re-renders from the returned tree. Accept / revert
  uses the inverse ops.

The whole per-host difference is one file:

```js
// host.js — the only thing that varies
export const host = {
  callTool(name, args),   // → Promise<result>
  postSelection(sel),     // widget → host
  onDocUpdate(cb),        // host → widget
};
```

| Host | `callTool` goes to | What this host uniquely gives |
| --- | --- | --- |
| **2a. MCP App** (`ui://ranger/doc`, `text/html;profile=mcp-app`) | the MCP host, over the spec's JSON-RPC bridge | The canvas lives in the chat thread, on Claude.ai / Desktop / Cursor / VS Code / Goose |
| **2b. VS Code webview** (`ranger-vscode-extension`) | the extension, which runs the layer-0 CLI | **Live preview beside the terminal Claude Code is running in** — watch the file, re-render on save, see the agent's edits land as they happen |
| **2c. Electron renderer** (layer 3) | the main process, in-process | No host required at all; the agent is embedded in the app |

In the Claude Code terminal, 2a degrades to layer 1 — text and a PNG — with no
separate code path. 2b is what covers the terminal properly: the panel is a
second window next to it, not a replacement for it.

**Why 2b is cheap and worth doing:** `ranger-vscode-extension` already exists
(LSP client, grammar, snippets) and has no webview yet, so this is additive —
a `createWebviewPanel`, the same bundle, and a host adapter that shells out to
`npm run agent`. It is the only surface here that gives a *live* preview rather
than a per-turn snapshot.

**Licensing seam:** the extension is MIT and the widget bundle is gallery
(AGPL). The panel therefore ships as a gallery-licensed component the extension
loads, or the extension grows an AGPL feature directory — decide before writing
it, not after.

## 7. Layer 3 — an agent inside the app (Electron + Agent SDK)

For gallery apps that must run standalone — the `rangerflow` editor, the
`figma` viewer, the markdown editor — with no MCP host to ask.

The generic advice here is "wrap the CLI in Electron". The better shape is the
opposite: **an app that happens to contain an agent**, not a chat client that
happens to show a document.

```
  Electron main process
    ├── @anthropic-ai/claude-agent-sdk   query(prompt, options)
    ├── EVGPatch validator + RangerDoc   (compiled Ranger, in-process)
    └── the patch tools as in-process SDK MCP servers
                  │ IPC (contextBridge preload)
                  ▼
  renderer = the existing EVG web app + host.js (2c)
```

Why this beats the local-HTTP-bridge sketch it replaces: no port, no CORS, no
second process to supervise, no API key in a page, and the Agent SDK gives
permission hooks and session resume for free. Tools are registered in-process,
so the same `EVGPatch` object the renderer validates against is the one the
agent calls. `claude -p --output-format json` stays as the zero-dependency
fallback for a plain browser page.

For `@process`-based apps the ops arrive as `proc_send` messages,
`markStateDirty()` drives the repaint, and the message log is the undo stack.

**Zero-infrastructure alternative, worth doing first for a demo:** publish the
EVG app as an Artifact and use the artifact runtime's own "ask Claude"
capability. No Electron, no key, and a shareable URL.

---

## 8. Not building

- **Runtime Ranger code generation.** The compiler is too slow for an edit loop
  and the language's known traps (`return (call())`, one statement per line —
  see `AGENTS.md`) turn a model into an error spiral. Ops, not code.
- **Writing `.fig` back out.** `gallery/figma` is a reader. Output is scene
  JSON, EVG JSON, SVG or PDF.
- **Free-form CSS strings in a patch.** Validated property names only.
- **A chat client.** Electron and the VS Code panel are hosts for the *document*
  widget, never a reimplementation of the Claude Code chat UI. Claudeck-style
  wrappers solve someone else's problem: Ranger's value is the document
  surface, and the chat clients that exist are better than one we would write.
- **A second source of geometry.** `measure()` reads the laid-out tree, exactly
  as `EVGInspect` does. Nothing recomputes a box.

---

## 9. Phasing

| Phase | Deliverable | Rough effort | Unlocks |
| --- | --- | --- | --- |
| **P0** | `EVGPatch.rgr` + `RangerDoc` + `npm run agent` | 3–5 d | Claude Code edits EVG / rangerflow / figma docs in this repo today |
| **P1** | `.claude/skills/` (`evg-edit`, `rangerflow-diagram`, `ranger-lang`) + SessionStart hook | 1 d | Fewer compile-error loops; repo works in Claude Code on the web |
| **P2** | `tools/ranger-mcp/` stdio server | 2 d | Any MCP host, any repo, terminal included |
| **P3** | the widget bundle + `host.js` + MCP App adapter (2a) | ~1 wk | Click-to-select + prompt box inside the chat thread |
| **P3b** | VS Code webview adapter (2b) | 1–2 d | Live preview beside the terminal, on the same bundle |
| **P4** | Electron shell + Agent SDK (2c/3), or the Artifact route | 3–5 d | Standalone gallery apps with an agent inside |

P0 is worth doing whether or not anything after it happens.

## 10. Licensing

All of this lives under `gallery/` (or bridges to it), so it is
**AGPL-3.0-or-later**. `tools/ranger-mcp/` is glue over gallery code and takes
the same license. That is a reasonable place for the dual-licensing offer: the
AI bridge is exactly the component a commercial user wants and the one least
entangled with the MIT compiler core.

One seam needs deciding before code, not after: `ranger-vscode-extension` is
**MIT** and the widget bundle it would load is gallery/AGPL. Either the panel
ships as a separate gallery-licensed component the extension loads, or the
extension grows an explicitly AGPL feature directory. The Electron shell has no
such problem — it is a gallery app end to end.

## 11. Open questions

1. **Selector vs. path as the primary address.** Paths are exact but break on
   unkeyed insertion; selectors are stable but can match several nodes. Current
   lean: accept both, have `query()` return the path, make `patch` prefer paths
   and reject an ambiguous selector.
2. **How much of a document belongs in an outline.** A large `.fig` will not
   fit a context window. Needs a depth/viewport-scoped outline with an explicit
   "N children not shown" marker rather than silent truncation.
3. **Whether `measure()` thresholds are per-document.** A print PDF and a watch
   face disagree about minimum hit target. Probably a profile argument.
