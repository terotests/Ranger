import { View, Label } from "./evg_types";

/**
 * Box model: padding, per-side padding, margins, borders and nesting — all
 * checked against a browser by gallery/pdf_writer/test/run_layout.sh, which
 * is where the numbers behind this page come from.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Laatikkomalli</Label>
      <View className="rule" />

      <Label className="subhead">Täyte ja reunus</Label>
      <View className="row">
        <View className="demo padded"><View className="inner" /></View>
        <View className="demo padSides"><View className="inner" /></View>
        <View className="demo bordered"><View className="inner" /></View>
      </View>

      <Label className="subhead">Sisäkkäiset laatikot</Label>
      <View className="nest l1">
        <View className="nest l2">
          <View className="nest l3">
            <View className="nest l4" />
          </View>
        </View>
      </View>

      <Label className="subhead">Marginaalit erikseen</Label>
      <View className="demo padded">
        <View className="inner marA" />
        <View className="inner marB" />
      </View>
    </View>
  );
}
