import { View, Label } from "./evg_types";

/**
 * Flex: grow, shrink and basis; wrapping; and how a row distributes what is
 * left over. Every arrangement here is a class in the stylesheet, so the same
 * tree lays out differently under each theme.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Flex</Label>
      <View className="rule" />

      <Label className="subhead">flex: 1 / 2 / 1</Label>
      <View className="row">
        <View className="box grow1"><Label className="boxLabel">1</Label></View>
        <View className="box grow2"><Label className="boxLabel">2</Label></View>
        <View className="box grow1"><Label className="boxLabel">1</Label></View>
      </View>

      <Label className="subhead">flex-shrink: 0 pitää mittansa</Label>
      <View className="row">
        <View className="box noshrink"><Label className="boxLabel">kiinteä</Label></View>
        <View className="box grow1"><Label className="boxLabel">joustaa</Label></View>
        <View className="box grow1"><Label className="boxLabel">joustaa</Label></View>
      </View>

      <Label className="subhead">justify-content: space-between</Label>
      <View className="row between">
        <View className="chip"><Label className="boxLabel">yksi</Label></View>
        <View className="chip"><Label className="boxLabel">kaksi</Label></View>
        <View className="chip"><Label className="boxLabel">kolme</Label></View>
      </View>

      <Label className="subhead">flex-wrap: wrap</Label>
      <View className="row wrapping">
        <View className="tile"><Label className="boxLabel">1</Label></View>
        <View className="tile"><Label className="boxLabel">2</Label></View>
        <View className="tile"><Label className="boxLabel">3</Label></View>
        <View className="tile"><Label className="boxLabel">4</Label></View>
        <View className="tile"><Label className="boxLabel">5</Label></View>
        <View className="tile"><Label className="boxLabel">6</Label></View>
      </View>
    </View>
  );
}
