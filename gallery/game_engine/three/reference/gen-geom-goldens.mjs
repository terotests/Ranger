// ============================================================================
// gen-geom-goldens.mjs — geometry golden data from the REAL three.js.
//
//   node gen-geom-goldens.mjs > geom_goldens.json
//
// Geometry is pure data (positions/normals/uvs/indices), so it is fully testable
// WITHOUT rendering. For each primitive + a couple of complex shapes we capture,
// from the real library:
//   - vertexCount / indexCount (exact tessellation parity)
//   - bounding box (min/max xyz)
//   - a few EXACT sample vertices (first / middle / last) — because the Ranger
//     port replicates three.js's vertex order 1:1, vertex i must match vertex i.
// The Ranger suite three_primitive_geometries_test.rgr builds the same geometry
// and asserts against these. Keep the parameter sets in lock-step with the .rgr.
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

const r5 = (n) => Math.round(n * 1e5) / 1e5;

function capture(g) {
  const pos = g.getAttribute('position');
  const vc = pos.count;
  const idx = g.getIndex();
  const ic = idx ? idx.count : 0;
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const sampleIdx = [0, Math.floor(vc / 2), vc - 1];
  const samples = sampleIdx.map((i) => ({
    i,
    x: r5(pos.getX(i)),
    y: r5(pos.getY(i)),
    z: r5(pos.getZ(i)),
  }));
  return {
    vertexCount: vc,
    indexCount: ic,
    bbox: {
      minx: r5(bb.min.x), miny: r5(bb.min.y), minz: r5(bb.min.z),
      maxx: r5(bb.max.x), maxy: r5(bb.max.y), maxz: r5(bb.max.z),
    },
    samples,
  };
}

const G = {};

// --- primitives ------------------------------------------------------------
G.plane      = capture(new THREE.PlaneGeometry(2, 3, 2, 2));
G.circle     = capture(new THREE.CircleGeometry(1, 8));
G.ring       = capture(new THREE.RingGeometry(0.5, 1, 8, 1));
G.sphere     = capture(new THREE.SphereGeometry(1, 8, 6));
G.cylinder   = capture(new THREE.CylinderGeometry(1, 1, 2, 8, 1));
G.cone       = capture(new THREE.ConeGeometry(1, 2, 8));           // == Cylinder(0,1,2,8,1)
G.torus      = capture(new THREE.TorusGeometry(1, 0.4, 6, 12));

// --- more complex ----------------------------------------------------------
G.torusknot  = capture(new THREE.TorusKnotGeometry(1, 0.4, 32, 6, 2, 3));
G.box        = capture(new THREE.BoxGeometry(1, 1, 1));            // existing core class

process.stdout.write(JSON.stringify(G, null, 2) + '\n');
