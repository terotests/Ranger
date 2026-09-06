# Plan: Zstandard in Ranger

## Why

`gallery/figma` reads a real Figma export only on the JavaScript target.
The reason is one step: `canvas.fig`'s message chunk is zstd, and the
`fig_zstd_decompress` operator had an `es6` template and a `*` fallback
returning an empty buffer. Everywhere else the parse produced a document
with no nodes in it and reported success.

The ZIP layer is already Ranger (`gallery/zip`), so this is the last piece
between the Figma reader and every target the compiler emits — and it drops
a vendored MIT JavaScript file from a directory that is otherwise AGPL.

## Stages

- **S0 — bit readers.** Forward LSB-first for table headers, backward
  MSB-first for payloads, both on an absolute bit index so nothing needs a
  64-bit word. *Done.*
- **S1 — FSE.** Normalized counts out of a block header, the table build,
  and a decoder state. *Done.*
- **S2 — Huffman.** Weight lists (raw nibbles and FSE-coded), the table
  build, one stream and four. *Done.*
- **S3 — frames and blocks.** Header shapes, raw/RLE/compressed blocks,
  skippable frames, several frames end to end. *Done.*
- **S4 — sequences.** The three code tables, the bitstream, the recent
  offsets, and the window. *Done.*
- **S5 — corpus.** Fixtures written by Node's zstd across levels and block
  shapes, including the real Figma chunk. *Done.*
- **S6 — the Figma reader on it.** Drop `FigZstd.rgr`'s host hook, the
  vendored `fzstd.mjs` and the page's `zstd.mjs`. *Done.*

## Next, in the order it would pay

1. **A wider bit reader.** The readers walk one bit at a time, which is
   most of the two-to-three-times gap against fzstd. A 32-bit window
   refilled a byte at a time would close it without needing 64-bit ints.
2. **The frame checksum.** XXH64 over the output, checked against the
   frame's trailer. Today the four bytes are stepped over.
3. **Dictionaries.** Refused by name today. Nothing in this repository
   needs them; `.fig` does not use them.
4. **An encoder.** A separate project, and much larger than the decoder:
   match finding, an FSE encoder, and the normalization the tables need.
