# Collaboration, modelled on Yjs

Two people editing one document is not a feature you add to an editor. It is a
constraint on how the document is *named* — and the naming has to be right
before anything else can be. This is where that stands, what was built, and
what the shape of the rest is.

> **Status: this is a design, not an implementation.**
>
> The identity layer was built here and tested on both targets — `OfficeId`,
> `OfficeIdSource`, `OfficeStateVector` — and then **removed again**, because it
> had no callers. A review of the branch made the argument that settled it: an
> unused API is not a foundation, it is surface nobody keeps alive. The same
> branch had just spent a great deal of effort demonstrating that a shared
> module without a second caller is exactly how the old copy survives
> underneath it.
>
> So what is kept is this document, which was the hard part. The primitive is a
> couple of hundred lines and will be better written against the requirement
> below than against a guess at it.

## Why Yjs is the thing to copy

[Yjs](https://github.com/yjs/yjs) is MIT licensed, which is compatible with
this gallery's AGPL — so the question was never legal. It is also not
JavaScript-only, which is what I assumed before checking: the same data model
has a Rust implementation (`y-crdt`) with bindings for Swift (`yswift`), Kotlin
(`ykt`), Python (`pycrdt`), .NET (`ydotnet`), Go (`ygo`), C (`yffi`) and WASM
(`ywasm`), as separate projects. Between them they cover most of what Ranger
compiles to.

So there are two real options, and they are not exclusive:

1. **Copy the model.** Implement the data model in Ranger, so it works
   identically on every target the compiler has — the same argument that made
   `OpcPackage` and the typography core worth writing here rather than binding
   to a library per host.
2. **Bind the engine per host.** Use `yjs` on the browser build, `yffi` from
   the C++ one, `ykt` on Android, and have the Ranger side speak the same
   shapes.

Either way **the document model has to be CRDT-shaped first**, and that part is
the same work. It is what has been done.

## The four ideas worth taking

From Yjs's own `INTERNALS.md`:

### 1. An id is `(client, clock)`

> "Everything inserted in a Yjs document is given a unique ID, formed from a
> _ID(clientID, clock)_ pair (also known as a Lamport Timestamp)."

`client` is a number a session picks once — Yjs draws a random 53-bit integer —
and `clock` counts up within it. Together they are unique **with no
coordination**, which is the property a counter cannot have: two sessions
minting `nextParaId` both produce 7, and 7 stops meaning one paragraph.

This gallery's three editors all name things with counters — `nextParaId` in a
document, `nextId` in a deck, a style index in a workbook — and all three are
correct today because every entry point re-mints and only one session ever
edits. They are the wrong shape for two.

What that needs is `(client, clock)` and a source that mints it — sketched
here, deliberately not committed. See the status note at the top.

### 2. A state vector, so a sync is a delta

> "A state vector defines the known state of each user (a set of tuples
> `(client, clock)`)."

Peers trade vectors, each works out what the other is missing, and only that is
sent. Without it a peer that reconnects after one keystroke has to be sent the
document.

What that needs is a per-client high-water mark and a `missingIn` over two of
them — sketched here, deliberately not committed.
another does not.

### 3. Deletions are a flag, not an operation

> "No data is kept on _when_ an item was deleted, or which user deleted it. The
> struct store does not contain deletion records."

A deleted item stays as a tombstone so that concurrent edits still have
something to point at; only later can it be collected. This is the idea most at
odds with how the editors here work — they remove things — and it is why
"delete" is the operation a merge gets wrong first.

Not built.

### 4. YATA orders concurrent inserts

Each item carries `origin` and `originRight` — the items it was inserted
between — and `Item#integrate()` resolves concurrent inserts at the same place
into the same order on every peer.

Not built, and it is the largest single piece.

## What this codebase already has that fits

| | |
| --- | --- |
| **An op log** | The document and the spreadsheet record edits as operations with enough to replay them in both directions — which is most of what an update is |
| **Transactions** | [`OfficeHistory`](editor/OfficeHistory.rgr) already says what one action is, which is the granularity a peer should receive |
| **Source preservation** | [Phase 2](../ooxml/README.md) keeps the XML a reader does not model, so a merged document does not lose what neither peer's model understood |
| **A stable id in one editor** | `PptxShape.editId` is already the right idea — a name that is not an array index — it is just session-local |

And what it lacks:

- **Durable identity.** `editId` is re-minted on every `attach`, so "shape #5"
  means nothing after a reopen. A merge needs it to mean the same shape
  tomorrow.
- **Tombstones.** Deleting removes.
- **A transportable op.** The ops are Ranger objects with no encoding.
- **One history shape.** The deck's history is whole-deck snapshots rather than
  an op log — structurally shared per slide, so it is not as expensive as it
  sounds, but it is not something you can send to a peer.

## The order this would go in

1. **Durable identity.** Give each document a client id and persist entity ids
   with it. For a `.pptx` this can ride in the `p:extLst` the source-preserving
   work already carries through a save — which is a good test of that machinery
   as much as of this.
2. **Ops as data.** An encoding for the ops that already exist, so one can be
   written down, sent, and replayed. `OfficeHistory` already groups them.
3. **Tombstones, per format.** Deleting a paragraph, a shape, a row.
4. **Merge.** YATA for text; last-writer-wins by id order for a shape's
   geometry — which is where an OOXML editor differs from a text CRDT and where
   copying Yjs stops being enough.

Step 4 is the honest boundary. Yjs is a text CRDT with maps and arrays around
it; a slide is a tree of shapes with geometry, and a sheet is a sparse grid.
"Last writer wins" is right for a shape's `x` and wrong for a paragraph's text,
so the merge is per-type and only the *identity and transport* underneath it are
common. That is exactly the split this directory already makes everywhere else:
**merge the infrastructure, not the document models.**
