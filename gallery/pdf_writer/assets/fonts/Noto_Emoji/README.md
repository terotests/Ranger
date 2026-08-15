# Noto Emoji

`NotoEmoji-Regular.ttf`, downloaded from Google Fonts
(`https://fonts.gstatic.com/s/notoemoji/v47/`), licensed under the SIL Open
Font License 1.1 — see `LICENSE.txt`.

This is the **monochrome** cut, and that is deliberate. The colour emoji fonts
carry their glyphs as bitmaps (CBDT/sbix) or layered vectors (COLR/CPAL), none
of which the outline rasterizer or the PDF font path can read. Noto Emoji is
ordinary `glyf` outlines, so every target that can draw a letter can already
draw these:

- **PDF** embeds it like any other face and fills the outlines,
- **PNG** rasterizes it through the same scanline filler as text,
- **HTML** loads the same file through `@font-face`, so the browser measures
  what EVG measured.

It is reached only through per-codepoint fallback: it is loaded last, so it is
never picked as a substitute for a missing *text* face, and a document with no
emoji in it never mentions it.

Known limits:

- No colour. A colour target would need COLR/CPAL layer support (vector, and
  the more tractable of the two) or a PNG decoder for CBDT.
- No grapheme clustering. A ZWJ sequence, a skin-tone modifier or a flag is
  several codepoints and comes out as its parts.
- The PDF embeds the whole 858 KB face, not a subset — one emoji on a page
  costs the same as fifty.
