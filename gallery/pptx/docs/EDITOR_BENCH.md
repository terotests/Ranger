# What a deck costs to edit

`npm run pptx:bench` builds a deck in memory — a title, a wrapping paragraph
and three shapes per slide, about what a real deck carries — and times the six
things an editor does between one frame and the next. `npm run pptx:bench --
500` picks the size.

The numbers below are from one machine and are only useful against each other:
what matters is not the absolute milliseconds but **which of them follow the
size of the deck**. Phase E7 is the phase about that, and this file is what it
was decided from.

## Before E7 — a step copied the whole deck

| per operation | 100 slides | 500 slides |
| --- | --- | --- |
| idle frame | 1.68 ms | 2.13 ms |
| drag frame | 4.42 ms | **25.17 ms** |
| keystroke | 2.32 ms | **30.02 ms** |
| undo | 2.03 ms | **29.26 ms** |

Frames were flat, which is the slide panel doing its job: it has only ever
built the thumbnails that are on screen. Everything else was linear in the
deck, and for one reason — `pushSnapshot` copied every slide to record a change
to one. At five hundred slides a keystroke cost thirty milliseconds. That is
three dropped frames per character.

## After E7 — a step copies what changed

| per operation | 100 slides | 500 slides | 1000 slides |
| --- | --- | --- | --- |
| idle frame | 0.81 ms | 1.04 ms | 1.01 ms |
| idle frame, no panel | 0.23 ms | 0.32 ms | 0.19 ms |
| drag frame | 0.65 ms | 0.59 ms | 0.73 ms |
| keystroke | 0.04 ms | 0.06 ms | 0.04 ms |
| undo | 0.06 ms | 0.14 ms | 0.22 ms |
| turn the page + frame | 0.82 ms | 0.82 ms | 0.90 ms |
| thumbnails built per idle frame | 0 | 0 | 0 |

Nothing an editor does between frames follows the size of the deck any more. A
keystroke is **500x cheaper** at five hundred slides, an undo **200x**, a drag
frame **43x**.

## Where the time went

**The history shares the slides that did not change.** The plan's own word for
this phase was an operation log with inverses, and the argument against writing
one was recorded in phase E1: a shape is a tree, one operation touches several
levels of it, and copying the deck is the cheap correct thing *while the
operation set is still moving*. It has stopped moving now — but an op log is
still a rewrite of every operation, and there is a cheaper way to the same
number. A step copies only the slides whose **revision** has changed and shares
the rest, in both directions: a capture asks a cache for each slide and pays
only for the ones that moved on, and a restore keeps the live slide where it
stands when it is already the state the snapshot holds.

The whole thing rests on one invariant — **a slide's revision changes whenever
its content does** — so the revision is bumped *before* the capture rather than
after it, and the two operations that rewrite EVERY slide rather than the one
in front of you (`remergeChrome` and `retheme`) say so explicitly. That is a
small, auditable set, and it is what `testSharedHistory` and `testDeckWideUndo`
in `pptx:editor:test` are for: a shared copy that goes stale is a silent bug,
an undo that restores the wrong thing with nothing else noticing.

**The panel keeps its thumbnails.** A thumbnail is the slide's own scene at a
small scale, which is what made the panel cost nothing to invent and everything
to draw: at a hundred slides it was seven eighths of every frame, because the
ten thumbnails on screen were converted again for each one. They are kept now,
tagged with the revision, the place and the width they were built at — a slide
that has not changed and has not moved is the same picture. An idle frame
builds **none**; editing a slide builds **one**; scrolling builds the ones that
moved.

## What is deliberately not here

`save the deck` is linear and stays linear — 72 ms at five hundred slides, 172
ms at a thousand — because writing a deck writes every slide of it. `saveOver`
is the one that does not: it rewrites only the parts that are dirty, which is
the same idea one layer down, and it is measured by the writer suite rather
than here.
