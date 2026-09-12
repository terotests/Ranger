# `gallery/vfs` — one place a document engine gets its bytes

```
npm run vfs:test
```

Four engines in this repository need bytes they do not have. `MdLayout` draws
`![alt](src)` as its alt text because it has none. `MdCss` has no
`background-image`. `PptxWriter` writes a slide background as a solid fill
only. The PDF and HTML writers each have their own idea of where a picture
comes from. Left alone, each grows its own loader — several implementations of
one idea, which [`../PLAN_EDITOR_KERNEL.md`](../PLAN_EDITOR_KERNEL.md) §2 calls
a pattern seam and measures the cost of.

The design is in [`PLAN_VFS.md`](PLAN_VFS.md). The shape is Node's experimental
`node:vfs` — a provider indirection, capability flags, POSIX absolute paths,
and mount — and where it differs it differs for a reason found in this
repository.

## The two decisions that shape the code

**Reads are synchronous.** `D2Flow` already refuses to call `D2Imports` from
itself on the grounds that one file read makes every caller asynchronous on the
web target, "including the editor's own self test". A document layout runs
inside a keystroke and cannot await anything. Loading is a separate, explicit
step that fills the store; reading is synchronous. No callback triad, no
promises.

**A blob is stored once however many names point at it.** A logo on twelve
slides is one blob and twelve names, because OOXML wants exactly that — one
media part, many relationships — and a writer that cannot tell two identical
pictures apart writes the file twice. The index is a CRC32 and a length, and a
hit is CONFIRMED by comparing the bytes: a CRC is a dedupe index, not a digest,
and a collision that silently returned the wrong picture would be worse than
storing it twice.

## What is here

| | |
| --- | --- |
| `VfsBlob` | bytes, content type, and pixel size — so a layout can size a picture without decoding it mid-keystroke |
| `VfsStat` | what is at a path; `found` is false for everything else, rather than a null a caller can forget to check |
| `VfsProvider` | the base every backend is: `exists`, `stat`, `read`, `list`, `put`, `remove`, and `readonly` |
| `VfsMemory` | in memory — what a suite and a browser demo use, and what an upload becomes |
| `Vfs` | mounts, and `resolve` |

Six calls. Every call a document engine does not need is one that cannot be got
wrong on five compilation targets, so there are no symlinks, no watching, no
streams, no permissions and no network.

## One reference, one path

`![](logo.png)` in markdown, `url(logo.png)` in CSS, `r:embed` in OOXML and
`<img src>` in HTML are four syntaxes for one question. Four copies of the
arithmetic would be four different answers to what `../` means, so there is
one:

| reference | answer |
| --- | --- |
| `/logo.png` | from the mount root |
| `logo.png`, `../img/logo.png` | relative to the document's own directory |
| `data:…` | decoded on entry, so nothing downstream sees a data URI |
| `http://…`, `https://…` | **refused**, unless the host grants it |
| `../../etc/passwd` | **refused** — climbing out of the tree is not a path |

A renderer that fetched whatever a pasted document named is the same bug
`D2Render` refuses `@file` imports for. And a document is a thing people send
each other, so `..` above the root is not a question about this process.

The refusal is kept beside the answer rather than inside it: a path that does
not exist and a path that was refused look the same to a renderer and
completely different to a reader.

## Mounts, and why a demo and a reader are the same case

Mounts are searched from the LAST backwards, so a later mount wins. Samples
mounted low, a session's uploads mounted over them, and a dropped file simply
wins — without either side knowing about the other. Writes go to the last mount
that can take them, so a read-only sample mount is skipped rather than failing
the write.

A provider never learns where it is mounted. The mounts suite mounts one
provider twice and reads the same bytes through both paths, because a provider
that had to know where it was would be one you could not do that to.

## What it must not become

Not a general filesystem. No current working directory, no permissions model,
no watching, no locking, no symlinks, no globbing, no `..` above a mount root,
and no network. This list exists to be enforced: every one of these is
something a document engine can be written without, and every one is something
a filesystem grows if nobody writes it down.
