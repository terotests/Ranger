import { View, Label } from "./evg_types";

/**
 * Emoji: clusters, shaping, and a colour of their own.
 *
 * Everything here is set from `Noto_Emoji/NotoEmoji-Regular.ttf` — the same
 * file on every target. The PDF embeds a subset of it as a Type0/Identity-H
 * font, the PNG fills its outlines with the engine's own rasterizer, and the
 * standalone HTML loads the same TTF through @font-face so the browser
 * measures what EVG measured.
 *
 * The sequences below are the point. Each one is several codepoints and one
 * glyph, and it only becomes that glyph if the whole cluster reaches the
 * shaper together — which is why the face is chosen per cluster and not per
 * codepoint. The keycap is the case that proves it: its base is a digit, so a
 * per-codepoint decision left the "1" in the text face and sent only the box
 * to the emoji face, and the ligature never saw all three parts.
 *
 * The tinted rows use `emoji-color`, which exists because there are no inline
 * spans here to hang a second colour on.
 */
function render() {
  return (
    <View className="page">
      <Label className="eyebrow">EVG — one engine, three targets</Label>
      <Label className="title">Emoji</Label>
      <View className="rule" />

      <Label className="subhead">One cluster, one glyph</Label>
      <View className="seqRow">
        <Label className="seqGlyph">👨‍👩‍👧</Label>
        <View className="seqText">
          <Label className="seqName">Joined family</Label>
          <Label className="seqNote">
            Five codepoints joined by U+200D. GSUB substitutes one ligature for
            all five, so it measures one advance and draws one glyph.
          </Label>
        </View>
      </View>
      <View className="seqRow">
        <Label className="seqGlyph">🇫🇮</Label>
        <View className="seqText">
          <Label className="seqName">Flag</Label>
          <Label className="seqNote">
            A pair of regional indicators — and exactly a pair, or two flags in
            a row would fuse into one cluster and neither would resolve.
          </Label>
        </View>
      </View>
      <View className="seqRow">
        <Label className="seqGlyph">1️⃣</Label>
        <View className="seqText">
          <Label className="seqName">Keycap</Label>
          <Label className="seqNote">
            Digit, variation selector, enclosing keycap. The base character is
            in the text face, which is why the face has to be chosen for the
            whole cluster rather than per codepoint.
          </Label>
        </View>
      </View>
      <View className="seqRow">
        <Label className="seqGlyph">👍🏽</Label>
        <View className="seqText">
          <Label className="seqName">Skin tone</Label>
          <Label className="seqNote">
            A modifier attaches to the emoji before it. This face is
            monochrome, so it resolves to the base glyph — one glyph either way.
          </Label>
        </View>
      </View>

      <Label className="subhead">A colour of their own</Label>
      <Label className="tintRose">Rose emoji, dark text 🎉 🚀 ⚠</Label>
      <Label className="tintBlue">Blue emoji, dark text 🎉 🚀 ⚠</Label>
      <Label className="tintGreen">Green emoji, dark text 🎉 🚀 ⚠</Label>
      <Label className="body">
        A monochrome face is outlines, so it takes whatever colour it is filled
        with. The emoji-color property is inherited the way color is, and unset
        it is the text colour — so a page that does not ask for one renders
        byte-identically to before it existed.
      </Label>

      <Label className="subhead">In a sentence</Label>
      <Label className="body">
        Text and emoji share a line and a baseline 😀, the run is cut only where
        the face has to change 🎉, and the PDF still extracts every one of them
        as the codepoints they were written with 🚀.
      </Label>
    </View>
  );
}
