# `image` — the codecs

The JPEG and PNG decoders, the PNG encoder, and the byte and pixel buffers
they read and write. EVG decodes `<img>` sources through them, the PDF
tools embed images through them, and the raster painters draw into
`RasterBuffer`.

| File | |
| --- | --- |
| `Buffer.rgr` | growable byte buffer with the readers the decoders need |
| `ImageBuffer.rgr` | RGBA pixels with width and height |
| `RasterBuffer.rgr` | the raster target the painters write, over `ImageBuffer` |
| `JPEGDecoder.rgr`, `ProgressiveJPEGDecoder.rgr` | baseline and progressive JPEG, with `BitReader`, `HuffmanDecoder`, `DCT` |
| `PNGDecoder.rgr` | PNG, over `pkg:zip/Inflate.rgr` |
| `PNGEncoder.rgr`, `Deflate.rgr` | PNG out, with its own DEFLATE compressor |
| `PPMImage.rgr` | PPM, for the decoder tests |

Import from another package as `Import "pkg:image/JPEGDecoder.rgr"` with
`"image": { "path": "…/lib/image" }` in `ranger.json`; the `zip` package it
needs is a sibling path dependency and comes along.

**License: MIT.** These are published formats and generic utilities —
the same rule that put `lib/zip` on the MIT side. See
[LICENSING.md](../../LICENSING.md).
