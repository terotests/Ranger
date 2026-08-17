// Fixture for run_vector.sh — an imported SVG document, end to end.
//
// imported.svg declares viewBox="0 0 24 24" and is drawn into a 48x48 element
// box, so the transform every target must resolve is a clean scale of 2 with no
// offset. Inside it:
//
//   - the frame path inherits its fill from the group around it, so it must
//     come out blue and not black
//   - the dot is a circle inside translate(6,6), so its geometry must arrive
//     already translated: the outline of r=3 about (0,0) starts at (3,0), which
//     translated is (9,6)
//   - the pip is a <use> offset to (16,16), so a definition drawn nowhere has
//     to appear exactly where it is referenced
//   - the <text> is outside the profile and has to be reported, not silently
//     dropped
//
// The second element is the same file at a different size, which is the whole
// point of importing vector art rather than an image: 24x24 into 96x96 is a
// scale of 4 and nothing else changes.
function render() {
  return (
    <View width="300px" height="300px" backgroundColor="#ffffff">
      <View width="120px" height="120px" backgroundColor="#f0f0f0">
        <Svg src="imported.svg" width="48px" height="48px" />
      </View>
      <View width="120px" height="120px" backgroundColor="#eeeeee">
        <Svg src="imported.svg" width="96px" height="96px" />
      </View>
    </View>
  );
}
