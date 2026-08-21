# The same keys, on the same text: Ranger vs CodeMirror 6

```bash
npm run datagrid:editor:compare:setup   # once: codemirror + esbuild, in here
npm run datagrid:editor:compare         # both editors, one browser, one script
npm run datagrid:editor:compare -- --lines 10000 --inserts 500
```

Two questions, and they are not the same question.

## 1. Behaviour — the useful one

CodeMirror 6 is the reference for **what a key is supposed to do**. Both
editors are opened on the same six-line document, given the same key presses
through Playwright — real events, into whatever element each editor puts the
focus on — and asked where the caret ended up.

```text
| step                          | ranger (line:col) | codemirror 6 | verdict |
| Ctrl+ArrowRight               | 0:5               | 0:5          | same    |
| ArrowDown onto a shorter line | 3:1               | 3:1          | same    |
| ArrowUp back to a long line   | 1:16              | 1:16         | same    |
| Shift+ArrowUp                 | 4:0 sel           | 4:0 sel      | same    |
| ArrowRight collapses          | 5:7               | 5:7          | same    |
  19/19 steps agree
```

Every row that says `differs` is either a bug here or a decision worth writing
down. The bench has already earned itself once: **a plain arrow with an open
selection used to collapse it *and* move a character**, where every text field
in every operating system collapses to the edge and stops. Three rows went red
at once, the fix was six lines, and `ScriptEditorTest` now holds it.

## 2. Time — the one to read carefully

Both editors open a large document and apply N single-character inserts through
their own edit path, each followed by whatever that editor does to make the
change visible.

```text
| engine      | open + paint | 100 inserts | per insert | of which re-lex | lines |
| ranger-evg  | 26.6 ms      | 407.9 ms    | 4.079 ms   | 1.600 ms        | 2000  |
| codemirror6 | 36.5 ms      | 350.2 ms    | 3.502 ms   | —               | 2000  |
```

The pipelines below are different **by design** — a display list handed to
WebGL against a DOM the browser lays out — so this is a repeatable shared
workload, not a claim that one renderer beats another.

The column that matters is the fourth. The Ranger editor re-lexes the **whole
document on every edit**, and at 2 000 lines that is 1.6 ms of the 4.1 ms an
insert costs. At 37 lines it was 300 µs. That is the number that decides when
Lezer-style incremental parsing stops being premature — and it is measured
rather than guessed, which was the whole point of putting it in the status bar.

## Keyboard accessibility

The last row of the behaviour run is not about caret positions:

```text
Escape then Tab leaves the editor:  ranger yes   codemirror yes
```

CodeMirror does **not** bind Tab by default, precisely because binding it traps
the keyboard. This bench turns its `indentWithTab` on so the comparison is like
for like — and then checks the thing that makes taking Tab acceptable at all:
that Escape arms an escape hatch and the next Tab releases focus. A failure
there fails the run.

The deeper keyboard suite is beside this one:
[`../keyboard.mjs`](../keyboard.mjs), 43 checks — focus order, ARIA, the hidden
textarea a screen reader actually reads, IME composition, paste, and the trap.

## What is in here

| File | |
| --- | --- |
| `corpus.mjs` | the document and the key script, shared so neither side can use a different workload |
| `src/cm_boot.js` | CodeMirror 6, set up and given the same small API the bench asks both editors for |
| `page/index.html` | its host page; `cm-bundle.js` and `doc.js` are built, not checked in |
| `run.mjs` | serves both pages, drives both, prints both tables |

`node_modules` here is separate from the repository's: CodeMirror and esbuild
are a bench dependency, not a dependency of anything that ships.
