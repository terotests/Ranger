# Zstandard, in Ranger

A Zstandard **decoder** (RFC 8878) written in Ranger, so a `.zst` stream can
be read on every target the compiler emits rather than only where a host
library happens to exist.

This exists because `gallery/figma` could not read a real Figma export
anywhere but JavaScript. A `.fig` is a ZIP whose `canvas.fig` holds a
DEFLATE'd schema chunk and a **zstd**'d message chunk. `gallery/zip` covers
DEFLATE, but zstd is a different algorithm, not a mode of it — so the Figma
reader delegated that one step to a vendored JavaScript library and returned
an empty buffer everywhere else.

## Quick start

```bash
npm run zstd:fixtures    # rebuild the corpus (needs Node 22+ for zstd)
npm run zstd:test        # the decoder against that corpus
npm run zstd:bench       # against fzstd and Node's own zstd
npm run zstd:tool -- info gallery/zstd/fixtures/figma-message.zst
```

From Ranger:

```
Import "gallery/zstd/src/ZstdDecoder.rgr"

def z (new Zstd())
def out:buffer (z.decompress(packed))
if (z.ok == false) {
    print z.err
}
```

`decompress` returns every frame in the input, concatenated. It never
throws: `ok` and `err` carry the reason, and a partial result comes back
with them so a caller can say how far it got.

## What is here

| File | |
| --- | --- |
| `src/ZstdBits.rgr` | the forward and backward bit readers |
| `src/ZstdFSE.rgr` | FSE tables: normalized counts, table build, decoder state |
| `src/ZstdHuff.rgr` | Huffman tables for literals, and the weight list |
| `src/ZstdTables.rgr` | the three predefined distributions and the code tables |
| `src/ZstdDecoder.rgr` | frames, blocks, literals, sequences, the window |
| `src/zstd_tool.rgr` | the command line front end |
| `tests/ZstdTest.rgr` | the suite |
| `tools/make-fixtures.mjs` | builds the corpus with Node's zstd |
| `fixtures/manifest.txt` | what each case has to decode to |
| `bench/compare.mjs` | Ranger vs fzstd vs Node |

## The two bit orders

Getting this wrong is the first way a zstd decoder fails, and it fails
without looking wrong:

- **Forward, LSB first** — the FSE table headers. Bits fill each byte from
  its low bit up and bytes are read in address order, the way DEFLATE does
  it.
- **Backward, MSB first** — every FSE and Huffman payload. The stream is
  read from its *last* byte toward its first. The final byte's highest set
  bit is not data: it marks where the data ends, so a payload whose last
  byte is zero is corrupt.

Both readers keep an absolute bit index instead of a shift register. That
is slower than a 64-bit container and it is why the decoder compiles to
targets whose `int` is 32 bits.

## FSE, and the thing that bit

FSE (tANS) is what `gallery/zip` has no equivalent of. A table maps a state
to a symbol, a number of bits to read, and a base for the next state.

A block may send its own tables or use one of three **predefined**
distributions. Those are constants, and one of them is a trap: the match
length default is

```
1, 4, 3, 2, 2, 2, 2, 2, 2, then 37 ones, then 7 of -1
```

Thirty-seven and seven. Writing it as thirty-nine and five still sums to 64,
still builds a table the code accepts, still decodes short matches
correctly — and puts the wrong symbol on the states that code long matches,
so only inputs with a long match fail. `tests/ZstdTest.rgr` covers this from
both ends: a 5,000-byte run, and a state-by-state comparison of all three
predefined tables.

## What it does not do

- **Dictionaries.** A frame with a dictionary ID is refused by name rather
  than decoded into nonsense.
- **The frame checksum** is stepped over, not verified. A corrupt frame is
  caught by the structure around it, not by XXH64.
- **Compression.** Decoding is what reading a `.fig`, a `.zst` or a
  Zstandard-compressed archive needs; an encoder is a separate project.

## Testing

The corpus is written by **Node's own zstd**, not by anything here — a
decoder tested against its own encoder proves nothing. What each case has
to decode to is recorded in `fixtures/manifest.txt` as a length and an
Adler-32 (Adler rather than CRC because every intermediate stays inside a
signed 32-bit int, so the number means the same thing on every target).
Cases small enough to read also keep a `name.raw`, so a failure there names
a byte rather than a checksum; keeping one for every case would be two
megabytes of fixtures.

The cases cover the paths that differ from each other rather than inputs
that differ in size: raw blocks (incompressible bytes), RLE blocks, runs
whose match offset is smaller than the match length (the overlapping copy),
Huffman literals in one stream and in four, blocks that re-send their tables
and blocks that repeat the previous ones, matches reaching into earlier
blocks, a frame with a checksum, a header with no content size, two frames
end to end, a skippable frame, and the message chunk of a real Figma export.
Each is run at three compression levels, because the encoder picks different
block shapes at each.

## Speed

Against `fzstd`, the JavaScript library this replaces, and Node's native
zstd, on the JavaScript target (`npm run zstd:bench`):

| input | in | out | Ranger | fzstd | Node |
| --- | --- | --- | --- | --- | --- |
| a real Figma message chunk | 82,963 | 231,228 | 5.2 ms | 2.8 ms | 0.7 ms |
| prose, level 19 | 5,886 | 60,000 | 1.0 ms | 0.7 ms | 0.1 ms |
| 321 KB across blocks | 29,558 | 321,000 | 3.1 ms | 1.1 ms | 0.5 ms |
| long runs | 30 | 67,001 | 0.35 ms | 0.87 ms | 0.2 ms |

Roughly two to three times fzstd's time, and quicker than it on long runs.
The bit-at-a-time readers are where the difference is; a 32-bit window
would close most of it and is the obvious next step if anything needs it.
For the case this was written for it is around 2 ms against a `.fig` parse
of about 65 ms.

**License: AGPL-3.0-or-later** (this directory is under `gallery/`).
