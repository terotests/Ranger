import { View, Label } from "./evg_types";

/**
 * Length units. Each bar below is declared in a different unit but they are
 * all the same length on the page, which is the point: an inch is 96px, a
 * point is 96/72px, and a millimetre is 96/25.4px, exactly as CSS defines
 * them. `em` and `rem` differ deliberately — the middle block sets its own
 * font-size, so `em` follows it while `rem` stays with the root.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Mittayksiköt</Label>
      <View className="rule" />

      <Label className="subhead">Sama pituus, viisi yksikköä</Label>
      <View className="bar u-px"><Label className="barLabel">192px</Label></View>
      <View className="bar u-pt"><Label className="barLabel">144pt</Label></View>
      <View className="bar u-in"><Label className="barLabel">2in</Label></View>
      <View className="bar u-mm"><Label className="barLabel">50.8mm</Label></View>
      <View className="bar u-cm"><Label className="barLabel">5.08cm</Label></View>

      <Label className="subhead">em seuraa paikallista kokoa, rem juurta</Label>
      <View className="scope">
        <View className="bar u-em"><Label className="barLabel">8em</Label></View>
        <View className="bar u-rem"><Label className="barLabel">8rem</Label></View>
      </View>

      <Label className="subhead">Prosentti emosta</Label>
      <View className="half">
        <View className="bar u-pct"><Label className="barLabel">100%</Label></View>
      </View>
    </View>
  );
}
