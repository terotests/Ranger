---
name: example
description: Find a worked Ranger example by what it does — a parser, a PDF, a chart, a Figma file, a diagram, an app, a mobile screen — and set it up to run. Use when asked what Ranger can do, for an example of something, or before designing from scratch something the gallery has probably already solved.
---

# Finding an example

The index is `${CLAUDE_PLUGIN_ROOT}/examples/INDEX.json`: every entry says what
it DOES, what it needs on disk, where it lives and how to run it.

```bash
cat "${CLAUDE_PLUGIN_ROOT}/examples/INDEX.json"
```

Asked for a topic ("$ARGUMENTS" when this was invoked as a command), match it
against `does`, `teaches` and `title` — not only `id`. Then:

**`needs: "compiler"`** — the example is bundled here and works in any project
that has `ranger-compiler` installed. Copy it in and run it:

```bash
cp "${CLAUDE_PLUGIN_ROOT}/examples/calc/Calc.rgr" .
rgr run Calc.rgr
```

**`needs: "repo"`** — the example lives in the gallery, which is the Ranger
checkout. If the working directory is already inside one (there is a
`gallery/` and a `compiler/`), run the command in `run` as it stands. If it is
not, say so plainly and offer the clone rather than pretending:

```bash
git clone --depth 1 https://github.com/terotests/Ranger
cd Ranger && npm install
```

Some entries name a `skill` — `evg-edit` for documents, `rave` for
applications. Read it before changing anything in that example; both exist to
stop an edit-and-hope loop that is expensive here.

## What to say back

Name the example, what it demonstrates, the command, and what will appear —
a file, a window, a printed line. If nothing in the index matches, say that
too, and pick the nearest thing that really exists rather than inventing a
command: every `run` in the index is a command that was executed, and an
invented one costs more than an honest "no example for that yet".
