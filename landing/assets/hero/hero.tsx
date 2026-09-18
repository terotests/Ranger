import { View, Svg } from "./evg_types";

/**
 * The picture behind the first screen of the front page.
 *
 * It is not a background image: landing/tools/hero.mjs lays this out with EVG
 * and writes the display list, and the page draws that list on the GPU through
 * lib/evg/gl/evg-webgl.js, once per frame, with `evg-surface-effect:
 * ripple` bending the finished surface around drops that fall on it.
 *
 * Which is why the composition is rules and a letter rather than a wash: a
 * ripple displaces where the shader samples, so it is only visible where the
 * surface has edges to move.
 */
function render() {
  return (
    <View className="field">
      <View className="rules">
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
        <View className="rule" /><View className="rule" /><View className="rule" />
      </View>
      <View className="cols">
        <View className="col" /><View className="col" /><View className="col" />
        <View className="col" /><View className="col" /><View className="col" />
        <View className="col" /><View className="col" /><View className="col" />
        <View className="col" /><View className="col" /><View className="col" />
        <View className="col" /><View className="col" /><View className="col" />
        <View className="col" /><View className="col" /><View className="col" />
      </View>
      <View className="marks">
        <Svg className="mark" src="../ranger-mark.svg" />
      </View>
    </View>
  );
}
