import { View, Label, Image } from "./evg_types";

/**
 * Grid: a photo-book spread drawn as a picture of named areas.
 *
 * Every rule lives in the stylesheet — this file says WHAT is on the page,
 * never how it looks. `grid-template-areas` is in the CSS too, so a theme can
 * rearrange the whole spread without touching the tree.
 */
function render() {
  return (
    <View className="page">
      <Label className="eyebrow">Kaivopuisto</Label>
      <Label className="title">Ensimmäinen sulaminen</Label>
      <View className="rule" />

      <View className="spread">
        <Image className="cell hero" src="../../../pdf_writer/assets/images/Canon_40D_scaled.jpg" />
        <Image className="cell" src="../../../pdf_writer/assets/images/Example_scaled.jpg" />
        <Image className="cell" src="../../../pdf_writer/assets/images/Canon_40D_scaled.jpg" />
        <Image className="cell wide" src="../../../pdf_writer/assets/images/Example_scaled.jpg" />
      </View>

      <Label className="caption">
        Kaksitoista päivää rantaviivaa pitkin — ensimmäisestä sulamisesta
        juhannuksen valoon.
      </Label>
    </View>
  );
}
