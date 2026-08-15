import { View, Label, Image } from "./evg_types";

/**
 * subgrid: three cards whose captions line up with each other.
 *
 * Each card spans the outer grid's two rows and declares
 * `grid-template-rows: subgrid`, so the photo band and the caption band are
 * shared across all three — even though the captions are different lengths.
 * Without subgrid each card would divide its own height and the captions
 * would sit at three different heights.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Kortit, samalla rivillä</Label>
      <View className="rule" />

      <View className="deck">
        <View className="card">
          <Image className="shot" src="../../../pdf_writer/assets/images/Canon_40D_scaled.jpg" />
          <Label className="cardcap">Lyhyt.</Label>
        </View>
        <View className="card">
          <Image className="shot" src="../../../pdf_writer/assets/images/Example_scaled.jpg" />
          <Label className="cardcap">
            Hieman pidempi kuvateksti, joka kiertää usealle riville.
          </Label>
        </View>
        <View className="card">
          <Image className="shot" src="../../../pdf_writer/assets/images/Canon_40D_scaled.jpg" />
          <Label className="cardcap">Keskimittainen teksti tähän.</Label>
        </View>
      </View>

      <Label className="caption">
        Jokainen kortti perii ulomman ruudukon rivit, joten kuvatekstit
        alkavat samalta korkeudelta.
      </Label>
    </View>
  );
}
