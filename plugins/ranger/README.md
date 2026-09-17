# The Ranger plugin for Claude Code

What a Claude session needs to write Ranger, in any directory — including an
empty one.

```
/plugin marketplace add terotests/Ranger
/plugin install ranger@ranger
```

Then, in a folder with nothing in it:

```
npm init -y && npm i -D ranger-compiler
```

…and ask for a program. The first one compiles and runs in about a second.

Starting something new rather than adding Ranger to an existing tree?
[RangerStarter](https://github.com/terotests/RangerStarter) is a clone-and-go
version of the same thing — these skills already in `.claude/skills/`, plus the
parts a plugin cannot put in your repository: `scripts/rgr`, a test that exits
non-zero, a matrix over all fourteen targets, `ranger.json`, ecosystem
packaging, CI, and an opt-in script for the AGPL gallery. MIT.

## What is in it

| | |
| --- | --- |
| **`rgr`** | on the PATH while the plugin is enabled: compile and run, and **fail when the compile fails**. Compilers through 3.5.1 print `[FAIL]` and exit 0, so `rgrc … && node bin/Main.js` runs the PREVIOUS build and the edit looks applied when it is not. A failed compile now exits non-zero; `rgr` reads the log as well, so it is right on either compiler. |
| **`ranger-start`** | from an empty folder to a running program: the install, the first two programs, the loop, and what to read next. |
| **`ranger-lang`** | the syntax traps whose error messages point at the wrong line — a returned call that needs its own parentheses, two statements on a line, the reserved method names that fail at every CALL SITE, arithmetic on a call result. Hours each, once. |
| **`evg-edit`** | reading, changing and CHECKING an EVG document — a page, a chart, a diagram, a PDF — by address, with a measure that says whether the text overflowed rather than a guess. |
| **`rave`** | designing a Rave application from files: routed, responsive, accessible, checked without a browser. |
| **`/ranger:example`** | worked examples by what they DO — a parser, a PDF, a chart, a Figma file, a mobile screen — with the command for each. Two of them are bundled here and run with nothing but the compiler. |

## The examples that need nothing

```bash
cp "$CLAUDE_PLUGIN_ROOT/examples/calc/Calc.rgr" .
rgr run Calc.rgr
rgr run Calc.rgr -l=python
rgr run Calc.rgr -l=go
```

A recursive-descent parser and evaluator, the same source three times. The rest
of the index — EVG documents, Figma files, decks, diagrams, applications, iOS
and Android — lives in the [Ranger repository](https://github.com/terotests/Ranger),
because that is where the gallery is.

## Keeping it honest

`.claude/skills/` in the repository is the source for the three shared skills;
`scripts/plugin-sync.sh` copies them here and `--check` fails when they drift.
Two copies edited by hand would diverge, and the one you are not reading is
always the wrong one.

`npm run plugin:check` runs the drift check and both manifest validations.

The language and compiler are MIT; the gallery — EVG, Rave, the document stack
— is AGPL-3.0-or-later. See [`LICENSING.md`](../../LICENSING.md).
