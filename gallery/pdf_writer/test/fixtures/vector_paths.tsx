// Fixture for run_vector.sh — three <Path> elements chosen so that the
// viewBox transform each one needs is different, and can be worked out by hand
// from the SVG rule (PLAN_VECTOR_IR.md §2.1).
//
//  1. star     no viewBox, ink spans 10..40 in both axes, drawn into 60x60.
//              Synthesised viewBox "10 10 30 30" -> scale 2, origin shift -20.
//  2. quad     no viewBox, ink spans 0..50, drawn into a NON-SQUARE 60x30 box.
//              meet takes the smaller scale (0.6) and centres the 30pt of
//              horizontal slack -> "0.6 0 0 0.6 15 0". The old bounding-box fit
//              would have stretched this to 1.2 x 0.6.
//              Its Q segment also pins the quadratic -> cubic elevation.
//  3. check    an explicit 24x24 viewBox drawn into 48x48 -> a clean scale of 2
//              with no offset, and the designed padding kept.
//  4. dashed   a stroked line with a dash pattern, which each target expresses
//              its own way: PDF's dash operator, SVG's attribute, and geometry
//              cut up before stroking in the raster target.
//  5. turned   the same check mark rotated 90 degrees about its own centre,
//              which each target also expresses its own way: a PDF matrix, a
//              CSS transform, and a transform on the shared rasterizer.
//
// The page is tall enough for all four boxes at their declared size. If it is
// not, flex squeezes them and every expected transform below changes with it.
function render() {
  return (
    <View width="300px" height="500px" backgroundColor="#ffffff">
      <View width="80px" height="80px" backgroundColor="#f0f0f0">
        <Path d="M25,10 L30,20 L40,22 L32,30 L35,40 L25,35 L15,40 L18,30 L10,22 L20,20 Z" width="60px" height="60px" fill="#f39c12" />
      </View>
      <View width="80px" height="80px" backgroundColor="#eeeeee">
        <Path d="M0,0 Q50,0 50,50 L0,50 Z" width="60px" height="30px" fill="#3498db" />
      </View>
      <View width="80px" height="80px" backgroundColor="#dddddd">
        <Path viewBox="0 0 24 24" d="M4 12 L10 18 L20 6" width="48px" height="48px" stroke="#000000" strokeWidth="2" />
      </View>
      <View width="80px" height="80px" backgroundColor="#cccccc">
        <Path viewBox="0 0 100 10" d="M0 5 L100 5" width="60px" height="6px" stroke="#000000" strokeWidth="2" strokeDasharray="6 3" />
      </View>
      <View width="80px" height="80px" backgroundColor="#bbbbbb">
        <Path viewBox="0 0 24 24" d="M4 12 L10 18 L20 6" width="48px" height="48px" stroke="#000000" strokeWidth="2" rotate="90" />
      </View>
    </View>
  );
}
