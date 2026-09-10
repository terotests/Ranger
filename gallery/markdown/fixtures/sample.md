---
title: A first version
---

# Markdown, drawn by EVG

This paragraph has **bold words**, *italic ones*, some `inline code`, and a
[link to the docs](https://terotests.github.io/Ranger/docs/). It is one line
of text broken across **four different faces**, which is the thing EVG could
not do before this module.

## What is in it

- A CommonMark parser, written in Ranger
- Tables, task lists and strikethrough from GFM
- [x] a checked task
- [ ] an unchecked one

1. Blocks first
2. Inlines second
3. Then the layout

> A block quote, with its own bar down the left.
> It flows like any other text.

### A table

| Stage | Reads | Writes |
| --- | --- | ---: |
| `MdBlock` | text | a tree |
| `MdLayout` | a tree | boxes |
| `MdToEvg` | boxes | `EVGElement` |

### And some code

```ranger
fn breakRuns:[MdLine] (runs:[MdRun] maxWidth:double) {
    def lines:[MdLine]
    return lines
}
```

---

That rule above is a thematic break.
