import { View, Label } from "./evg_types";

/**
 * Fonts: real TTF metrics, kerning, baseline alignment and UTF-8.
 *
 * Every specimen below is measured from the same font file the page is
 * painted with, so the boxes and the ink agree. The pairs at the bottom are
 * ones that kern hard — the engine reads GPOS pair adjustments and applies
 * them in measurement and in paint alike.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Kirjasinnäytteet</Label>
      <View className="rule" />

      <View className="specimen">
        <Label className="specLabel">Cinzel</Label>
        <Label className="specText faceDisplay">Helsinki, 2024</Label>
      </View>
      <View className="specimen">
        <Label className="specLabel">Josefin Sans</Label>
        <Label className="specText faceAlt">Hyvää yötä — Kaivopuisto</Label>
      </View>
      <View className="specimen">
        <Label className="specLabel">Noto Sans</Label>
        <Label className="specText faceBody">Löytöretki rantaviivalle</Label>
      </View>

      <Label className="subhead">Merkistö</Label>
      <Label className="body">
        Ääkköset ja typografia: “lainausmerkit”, ellipsi…, ajatusviiva —,
        yhdysviiva -, luetelmamerkki •, euro €, promille ‰.
      </Label>

      <Label className="subhead">Perusviiva</Label>
      <View className="baseline">
        <Label className="big">30</Label>
        <Label className="small">pistettä ja pieni teksti samalla viivalla</Label>
      </View>
    </View>
  );
}
