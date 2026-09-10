---
title: Code, coloured
---

# Code, coloured

A small lexer per language: a comment marker, a block-comment pair, the quote
characters and a keyword list. Five colours.

```ranger
; the greedy fill, one atom at a time
fn breakRuns:[MdLine] (runs:[MdRun] maxWidth:double) {
    def lines:[MdLine]
    def usedWidth:double 0.0
    while (ai < an) {
        def t:string (itemAt aText ai)   ; a word, or a run of spaces
        ai = (ai + 1)
    }
    return lines
}
```

```js
/* A block comment
   that runs across lines. */
export function renderDisplayList(gl, doc, opts = {}) {
  const frame = buildFrame(gl, doc, opts);   // one pass
  const stats = frame.draw(opts.shifts);
  if (stats.commands > 0x10) return `drew ${stats.commands}`;
  return null;
}
```

```python
def measure(text, family, size):
    """Widths, from the face the page will print with."""
    if not text:          # nothing to measure
        return 0.0
    return sum(advance(c) for c in text) * size / 1000.0
```

```sql
SELECT id, name, created_at
  FROM orders
 WHERE total > 100.0 AND status = 'open'   -- open orders only
 ORDER BY created_at DESC
 LIMIT 20;
```

```
A fence with no language: strings and numbers only.
"still a string", 42
```
