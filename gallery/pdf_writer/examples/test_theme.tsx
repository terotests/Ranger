import { View, Label, Image } from "./evg_types";

/**
 * Theme swap demo — the same tree rendered under two stylesheets.
 *
 *   evg-html test_theme.tsx classic.html -css themes/classic.css -theme classic
 *   evg-html test_theme.tsx minimal.html -css themes/minimal.css -theme minimal
 *
 * Nothing here carries visual styling except `className`. The one exception is
 * deliberate: the middle photo sets marginTop inline to show that an authored
 * attribute outranks the stylesheet in both themes.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Helsinki, 2024</Label>
      <View className="rule" />
      <Label className="caption">
        Twelve days along the shoreline, from the first thaw to midsummer light.
      </Label>

      <View className="row" height="180px">
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
        <Image
          className="photo"
          src="../assets/images/Canon_40D.jpg"
          marginTop="12px"
        />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
      </View>

      <Label className="caption">Kaivopuisto, late May.</Label>
    </View>
  );
}
