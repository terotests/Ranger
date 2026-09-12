# `gallery/vfs` — one place a document engine gets its bytes

*A plan. Nothing here is built yet.*

Four engines in this repository need bytes they do not have:

- `MdLayout` draws `![alt](src)` as its ALT TEXT in the muted colour, because it
  has no bytes for the picture. Honest, and the blocker under everything below.
- `MdCss` has no `background-image` — only `background-color`, in three places.
- `PptxWriter` writes a slide background as `<p:bg><p:bgPr><a:solidFill>` only,
  though it already writes `<p:blipFill>` for a picture shape.
- the PDF and HTML writers each have their own idea of where a picture comes
  from.

Left alone, each grows its own loader. That is a **pattern seam** in the sense
of [`../PLAN_EDITOR_KERNEL.md`](../PLAN_EDITOR_KERNEL.md) §2 — several
implementations of one idea, where a fix to any of them reaches none of the
others. This project exists so that there is one.

It is a shared project rather than a folder inside `markdown/` because the
consumers are markdown, pptx, docx, odf and pdf, and because a demo that
bootstraps with test data and a reader who uploads a file want the same thing
a suite wants.

## 1. What exists, and why neither is the answer

**The compiler's `InputFileSystem.rgr`** — `InputFSFolder` / `InputFSFile`, a
serialisable tree with an `InputEnv` that switches between it and the real
disk. For SOURCE TEXT that design is right, and the switch is the good idea
worth keeping. But `InputFSFile.data` is a **string** with a `base64bin` flag.
For a 2 MB background that is ~2.7 MB in memory and a decode on every read, and
the entry carries no content type, no pixel size, and no identity — so two
copies of one logo are two files as far as anything downstream can tell.

**`OpcPackage`** — already name → bytes with content types, read-only, over a
`ZipReader`, with `hasPart`, `readBinary` and `readXml`. That is exactly the
shape of a **provider**. It is not the whole answer because a document also
needs uploads, bundled samples and a host disk, composed into one namespace.

So: keep both, wrap both. Neither is replaced.

## 2. The model to borrow — and where to differ, with reasons

Node's experimental `node:vfs` (behind `--experimental-vfs`) is the right shape
to steal from: `vfs.create([provider][, options])` returns a
`VirtualFileSystem` wrapping a `VirtualProvider`; `MemoryProvider` and
`RealFSProvider(rootPath)` ship with it; providers carry capability flags
(`readonly`, `supportsSymlinks`, `supportsWatch`); paths are POSIX and
absolute; mounting redirects calls whose resolved path is under a prefix.

**Borrowed:** the provider indirection, the capability flags, POSIX absolute
paths, and mount.

**Deliberately different, each for a reason found in this repository:**

- **Synchronous only.** `D2Flow.rgr` carries a comment refusing to call
  `D2Imports` from itself, because a file read would make every method that can
  reach it asynchronous on the web target — "including the editor's own self
  test". A document layout runs inside a keystroke and cannot await anything.
  So LOADING is a separate, explicit, possibly-async step that fills the store,
  and READING is synchronous. No callback triad, no `promises` namespace.
- **Six calls, not sixty.** `exists`, `list`, `stat`, `read`, `put`, `remove`.
  No symlinks, no watch, no streams, no `chmod`, no `utimes`, no `rename`, no
  `append`, no file handles. Every call a document engine does not need is one
  that cannot be got wrong on five compilation targets.
- **Bytes are `buffer`** — the type `PptxShape.imageBytes` already is, so a
  picture crosses no conversion on its way into a deck.
- **Content-addressed blobs under the name tree.** A logo on twelve slides is
  one blob and twelve names. OOXML wants exactly that — one media part, many
  relationships — and a writer that cannot tell two identical pictures apart
  writes the file twice. Node has no reason to care; a document package does.
- **The stat carries content type AND pixel size.** A layout must size a
  picture without decoding it mid-keystroke. The decode happens once, on the
  way in, where it can be slow.
- **Writing is a capability, not an assumption** — `readonly` on the provider,
  as Node has it, and `false` by default for anything backed by the host disk.

## 3. The shape

```
VfsBlob      bytes:buffer + contentType + pixelW/pixelH + digest
VfsStat      name + isFolder + size + contentType + pixelW/pixelH
VfsProvider  exists / list / stat / read   (+ readonly, + put / remove)
  VfsMemory    in memory — what a suite and a browser demo use
  VfsOpc       an OpcPackage — a .pptx's own media, mounted as a folder
  VfsReal      the host's disk, where there is one (the node CLI tools)
  VfsOverlay   several providers, first hit wins — uploads over samples
Vfs          mount(prefix provider) + resolve(ref base) + the six reads
```

`VfsOverlay` is what makes a demo and a reader the same case: samples mounted
low, the session's uploads mounted over them, and a dropped file simply wins.

## 4. Resolution — one function, four syntaxes

`![](logo.png)` in markdown, `url(logo.png)` in CSS, `r:embed` in OOXML and
`<img src>` in HTML all go through one `Vfs.resolve(ref base)`:

- `/logo.png` — from the mount root.
- `logo.png`, `../img/logo.png` — relative to the document's own directory.
- `data:image/png;base64,…` — decoded on entry and stored as a blob, so the
  rest of the system never sees a data URI.
- `http://…`, `https://…` — **refused by default.** A renderer that fetched
  whatever a pasted document named is the same bug `D2Render` refuses `@file`
  imports for. Allowed only by a capability the host grants explicitly, and the
  refusal says so rather than drawing a blank box.

One function, because four copies of this arithmetic is four different answers
to "what does `../` mean here".

## 5. Bootstrapping a suite and a demo

A fixture tree in the repository becomes a `VfsMemory` at build time — the way
`build.sh` already copies samples and themes into `dist/`. Then:

- a suite needs no disk and no server;
- the browser demo starts with test data already in it;
- an upload is `put` into the same memory provider, so the upload path and the
  bootstrap path are one path;
- the CLI tools mount `VfsReal` instead, and nothing above notices.

That last line is the test of the whole design: if a consumer has to know which
provider it is talking to, the provider indirection has failed.

## 6. Stages

### Stage V1 — the store, in memory — not started

`VfsBlob`, `VfsStat`, `VfsProvider`, `VfsMemory`, `Vfs` with mount and the six
reads. No consumers.

*The check:* content addressing counted as BLOBS, not as names — put the same
bytes under two names and assert one blob; and a `readonly` provider refusing a
`put` by name rather than silently dropping it.

### Stage V2 — resolution — not started

`Vfs.resolve`, all four syntaxes, with the http refusal.

*The check:* a table of (ref, base) → resolved path, including the ones that
must fail; `../` escaping the mount root is a refusal, not a host path.

### Stage V3 — the fixture tree, and a demo that boots from it — not started

The build step, and an upload through `put`.

*The check:* the browser demo reading a fixture picture with no server — the
existing `smoke.mjs` pattern, because the page proving it itself is the only
evidence that survives a different machine.

### Stage V4 — `VfsOpc` and `VfsOverlay` — not started

A `.pptx`'s own media mounted as a folder; uploads over samples.

*The check:* a picture read out of a real deck through the VFS and compared
byte for byte with `OpcPackage.readBinary` on the same part.

### Stage V5 — `VfsReal`, and the CLI tools mounting it — not started

*The check:* one tool run twice, once over `VfsReal` and once over a
`VfsMemory` loaded with the same files, asserting identical output.

## 7. Who consumes it, and in what order

The consumers are staged in
[`../PLAN_DOCUMENT_MODES.md`](../PLAN_DOCUMENT_MODES.md) §8: pictures in
markdown at its Stage E, backgrounds and CSS `url(...)` at Stage F. Nothing in
this project waits on those, and nothing in those can start without V1–V3.

## 8. What it must not become

Not a general filesystem. No current working directory, no permissions model,
no watching, no locking, no symlinks, no globbing, no `..` above a mount root,
and no network. This list exists to be enforced: every one of these is
something a document engine can be written without, and every one of them is
something a filesystem grows if nobody writes it down.
