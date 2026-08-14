import { View, Label, Image } from "./evg_types";

/**
 * Grid album pages — the layout lives in themes/album.css, not here.
 *
 * Print fixtures (same tree, three compositions):
 *   A4 portrait     -w 595 -h 842  -theme album
 *   Album landscape -w 842 -h 595  -theme album
 *   Contact sheet   -w 595 -h 842  -theme contact   (3x3 instead of 2x2)
 *
 * `.span-2` and `.tall` are placement helpers, so a page can be recomposed by
 * moving a class rather than restructuring the tree. `.story-grid` goes further
 * and names its regions with grid-template-areas.
 *
 * Paths are written out rather than pulled from a const: the JSX front-end
 * resolves literal attributes, not module-level bindings.
 */
function render() {
  return (
    <View className="page">
      <View className="page-grid">
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
      </View>

      <Label className="caption">Plate I — Kaivopuisto</Label>

      <View className="story-grid">
        <Image className="photo story-hero" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo story-tall" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo story-wide" src="../assets/images/Canon_40D.jpg" />
      </View>

      <View className="feature-grid">
        <Image className="photo span-2" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
        <Image className="photo" src="../assets/images/Canon_40D.jpg" />
      </View>
    </View>
  );
}
