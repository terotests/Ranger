// =============================================================================
// geo_oracle.mjs — what d3 makes of a handful of points, per projection.
// =============================================================================
// The projections in VlGeo.rgr are checked against this rather than against a
// derivation: a projection is a page of constants and a rotation convention,
// and the only proof that the convention was read right is that the same
// longitude comes out at the same pixel.
//
//   node geo_oracle.mjs                 every projection, the sample points
//   node geo_oracle.mjs equalEarth      one of them
// =============================================================================
const d3 = await import('d3-geo');

const POINTS = [
  [0, 0], [10, 45], [-96, 38.7], [-122.4, 37.8], [24.9, 60.2],
  [-149.9, 61.2], [-157.8, 21.3], [139.7, 35.7], [-58.4, -34.6], [151.2, -33.9]
];

const MAKERS = {
  equirectangular: d3.geoEquirectangular,
  mercator: d3.geoMercator,
  equalEarth: d3.geoEqualEarth,
  albers: d3.geoAlbers,
  albersUsa: d3.geoAlbersUsa,
  naturalEarth1: d3.geoNaturalEarth1,
};

const want = process.argv[2];
for (const [name, make] of Object.entries(MAKERS)) {
  if (want && want !== name) continue;
  // The plain projection at a known scale and translate, so the numbers are
  // the projection's own and not a fit's.
  const p = make().scale(150).translate([0, 0]);
  console.log('##', name);
  for (const q of POINTS) {
    const r = p(q);
    console.log('  ', JSON.stringify(q), '->', r ? r.map(v => +v.toFixed(6)) : null);
  }
  // …and fitted to a box, which is what a chart actually asks for.
  const fitted = make().fitSize([500, 300], {
    type: 'MultiPoint', coordinates: POINTS
  });
  console.log('   fitSize([500,300]) scale=', +fitted.scale().toFixed(6),
              'translate=', fitted.translate().map(v => +v.toFixed(6)));
}
