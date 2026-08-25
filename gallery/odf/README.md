# gallery/odf — the OpenDocument container

One reader for `.odt`, `.ods` and `.odp`, the way
[`gallery/ooxml`](../ooxml/README.md) is one reader for `.docx`, `.xlsx` and
`.pptx`.

```bash
npm run odf:package:test   # 52 assertions, JavaScript and C++
```

**It is not OPC**, and the most useful thing this directory does is refuse to
pretend otherwise:

| | OPC (`.docx` / `.xlsx` / `.pptx`) | OCF (`.odt` / `.ods` / `.odp`) |
| --- | --- | --- |
| what a part is | a ZIP member | a ZIP member |
| what declares it | `[Content_Types].xml` | `META-INF/manifest.xml` |
| how it is reached | an `r:id`, through a `_rels` part, resolved against the part that named it | an `xlink:href` — the path itself, and nothing in between |
| what it says it is | nothing | a stored `mimetype` member, first in the archive |

The third row is the one that matters. OPC's relationship graph is an
indirection, and most of `OpcPackage` exists to walk it. ODF has no such layer:
a frame says `xlink:href="Pictures/x.png"` and that **is** the member name. So
this reader is deliberately *smaller* than the one next door, and the
temptation worth naming is the opposite of the usual one — somebody arriving
from `OpcPackage` will want to give this a relationship cache it has no use for.

## `sniffKind`

ODF requires `mimetype` to be the **first** entry, stored, with no extra field.
That puts the media type at a fixed offset, so the format of a file can be read
from its first hundred bytes without a ZIP library at all:

```text
offset 0    PK\3\4            the local file header
offset 30   "mimetype"        the member name
offset 38   application/vnd.oasis.opendocument.presentation
```

That is a better answer than a file extension, and it is the only answer a
dropped buffer has. It is what the viewer asks when it is handed bytes, which
is why opening a `.odp` there needs no branch on the file name.

A `.pptx` is also a ZIP, and its first member is not called `mimetype`, so it
answers `""` — and `openParts`/`openBytes` answer **false** for it rather than
true-but-empty. The shell is asking "is this yours?", and a true there sends a
deck into the wrong reader.

## The invariant

`OdfPackageTest` holds the OPC test's invariant, restated for a container with
no relationships: **walk every `xlink:href` in `content.xml` and `styles.xml`,
resolve it, and require the answer to name a member the ZIP actually
contains.** A relative path left unresolved becomes a member name no ZIP has,
and the picture silently does not appear — which is exactly how the three
hand-written OOXML package readers each went wrong in their own way.

The fixtures are the image-bearing ones on purpose: those are the packages
whose references point sideways.

## Not here

**Writing.** `ZipWriter` writes STORED only and cannot state a first-entry
constraint, so there is no way to produce a conforming ODF package yet, and an
API that implied a round trip would be describing something that does not
exist. See PLAN_FORMATS.md, "Housekeeping".

**Encryption.** As in `OpcPackage`: a password is a separate concern with a
separate failure mode, and the core should not learn what one is.
