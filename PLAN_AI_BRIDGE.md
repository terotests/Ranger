# Ranger as an AI-agent surface — the plan

Ranger's EVG stack already does, headlessly and deterministically, the three
things an LLM agent cannot do for itself when it edits a visual document:
address a node, change it under validation, and **check the result with
numbers instead of eyesight**. This document plans the thin layer that exposes
that to Claude Code, to MCP hosts, and to the gallery apps themselves.

The premise is not "put an LLM in Ranger". It is: EVG is a renderer and a
measurer that needs no browser, so it is the verification loop an agent is
missing. Everything below is built on one core and four surfaces over it.

---

## 1. The surfaces, and which ones are real

The generic advice for "integrating a custom UI into an AI coding agent" lists
four methods. Mapped onto what Ranger actually has, and onto what each host can
actually render:

| Method | Host that renders it | Applies to Ranger? |
| --- | --- | --- |
| **MCP tools** (text + images) | every MCP host, **including the Claude Code terminal** | **Yes — layer 1.** The base case, and the only one the terminal sees. |
| **MCP Apps** (`ui://` HTML resource, `text/html;profile=mcp-app`) | Claude.ai, Claude Desktop, VS Code / Copilot, Cursor, Goose, M365 Copilot | **Yes — layer 2.** This is the interactive canvas in the chat thread. |
| **CLI wrappers / Electron / web shims** | a window you ship yourself | **No.** We are not building another chat client. The one exception is `ranger-vscode-extension`, which already exists and can host a preview panel for free. |
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

## 6. Layer 2 — the MCP App widget (`ui://ranger/doc`)

The interactive canvas, in the chat thread, on hosts that render one.

- **What it is:** the EVG document drawn by `gallery/evg/gl/evg-webgl.js`
  (111 KB) or the SVG painter, in a pan/zoom canvas, inside the host's
  sandboxed iframe. Self-contained: no CDN, no web fonts, no external fetch,
  so the default widget CSP needs no exceptions.
- **What it sends up:** click a node → the widget posts the selection (path +
  box + role) back through the host's bidirectional channel, so the user can
  say "make *this* bigger" and the model knows what "this" is. This is the
  single biggest quality win in the whole plan: it removes the guess-which-node
  step entirely.
- **What it calls down:** the prompt box and the property panel call
  `ranger_doc_patch` through the host, and the canvas re-renders from the
  returned tree. Accept / revert uses the inverse ops.
- **Where it renders:** Claude.ai, Claude Desktop, Cursor, VS Code / Copilot,
  Goose. In the Claude Code terminal it degrades to layer 1 — text and a PNG —
  with no separate code path.

MIME type `text/html;profile=mcp-app`, resource declared as `ui://ranger/doc`
against the spec's `2026-01-26` revision.

## 7. Layer 3 — gallery app → Claude (`ranger agent serve`)

Only for gallery apps that run standalone (the published `rangerflow`,
`figma` and `markdown` pages), where there is no MCP host to ask.

```
 browser app (EVG/WebGL)
      │  outline(selection) + user prompt
      ▼
 local bridge  →  claude -p --output-format json  (MCP server attached,
      │                                            scoped to this document)
      ▼  patch ops
 EVGPatch validator in the browser → render → diff preview → accept / undo
```

The app never receives code, only ops, and validates them with the same
compiled validator the server uses. For `@process`-based apps the ops arrive as
`proc_send` messages, `markStateDirty()` drives the repaint, and the message log
is the undo stack — no new machinery.

**Zero-infrastructure alternative:** publish the EVG app as an Artifact and use
the artifact runtime's own "ask Claude" capability. No local bridge, no API key
in the page, and a shareable URL. Worth doing first for a demo.

---

## 8. Not building

- **Runtime Ranger code generation.** The compiler is too slow for an edit loop
  and the language's known traps (`return (call())`, one statement per line —
  see `AGENTS.md`) turn a model into an error spiral. Ops, not code.
- **Writing `.fig` back out.** `gallery/figma` is a reader. Output is scene
  JSON, EVG JSON, SVG or PDF.
- **Free-form CSS strings in a patch.** Validated property names only.
- **A chat client.** No Electron shim, no web wrapper. `ranger-vscode-extension`
  gets a preview panel and that is the whole desktop story.
- **A second source of geometry.** `measure()` reads the laid-out tree, exactly
  as `EVGInspect` does. Nothing recomputes a box.

---

## 9. Phasing

| Phase | Deliverable | Rough effort | Unlocks |
| --- | --- | --- | --- |
| **P0** | `EVGPatch.rgr` + `RangerDoc` + `npm run agent` | 3–5 d | Claude Code edits EVG / rangerflow / figma docs in this repo today |
| **P1** | `.claude/skills/` (`evg-edit`, `rangerflow-diagram`, `ranger-lang`) + SessionStart hook | 1 d | Fewer compile-error loops; repo works in Claude Code on the web |
| **P2** | `tools/ranger-mcp/` stdio server | 2 d | Any MCP host, any repo, terminal included |
| **P3** | `ui://ranger/doc` widget | ~1 wk | Click-to-select + prompt box inside the chat thread |
| **P4** | `ranger agent serve` bridge, or the Artifact route | 3 d | Standalone gallery apps ask Claude |

P0 is worth doing whether or not anything after it happens.

## 10. Licensing

All of this lives under `gallery/` (or bridges to it), so it is
**AGPL-3.0-or-later**. `tools/ranger-mcp/` is glue over gallery code and takes
the same license. That is a reasonable place for the dual-licensing offer: the
AI bridge is exactly the component a commercial user wants and the one least
entangled with the MIT compiler core.

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
