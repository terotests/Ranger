class SplineVec2  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
  }
}
SplineVec2.of = function(x, y) {
  const v = new SplineVec2();
  v.x = x;
  v.y = y;
  return v;
};
class SplineKnot  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
    this.hx = 0.0;
    this.hy = 0.0;
  }
}
SplineKnot.of = function(x, y, hx, hy) {
  const k = new SplineKnot();
  k.x = x;
  k.y = y;
  k.hx = hx;
  k.hy = hy;
  return k;
};
class SplineMesh  {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.profileX = [];
    this.profileY = [];
  }
}
class SplineLathe  {
  constructor() {
  }
}
SplineLathe.bezierPoint = function(p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y, t) {
  const u = 1.0 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;
  const x = (((uuu * p0x) + (((3.0 * uu) * t) * c0x)) + (((3.0 * u) * tt) * c1x)) + (ttt * p1x);
  const y = (((uuu * p0y) + (((3.0 * uu) * t) * c0y)) + (((3.0 * u) * tt) * c1y)) + (ttt * p1y);
  return SplineVec2.of(x, y);
};
SplineLathe.bezierTangent = function(p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y, t) {
  const u = 1.0 - t;
  const ax = c0x - p0x;
  const ay = c0y - p0y;
  const bx = c1x - c0x;
  const by = c1y - c0y;
  const cx = p1x - c1x;
  const cy = p1y - c1y;
  const x = ((((3.0 * u) * u) * ax) + (((6.0 * u) * t) * bx)) + (((3.0 * t) * t) * cx);
  const y = ((((3.0 * u) * u) * ay) + (((6.0 * u) * t) * by)) + (((3.0 * t) * t) * cy);
  return SplineVec2.of(x, y);
};
SplineLathe.catmullPoint = function(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const a1x = 2.0 * p1x;
  const a1y = 2.0 * p1y;
  const b1x = (0.0 - p0x) + p2x;
  const b1y = (0.0 - p0y) + p2y;
  const c1x = (((2.0 * p0x) - (5.0 * p1x)) + (4.0 * p2x)) - p3x;
  const c1y = (((2.0 * p0y) - (5.0 * p1y)) + (4.0 * p2y)) - p3y;
  const d1x = (((0.0 - p0x) + (3.0 * p1x)) - (3.0 * p2x)) + p3x;
  const d1y = (((0.0 - p0y) + (3.0 * p1y)) - (3.0 * p2y)) + p3y;
  const x = 0.5 * (((a1x + (b1x * t)) + (c1x * t2)) + (d1x * t3));
  const y = 0.5 * (((a1y + (b1y * t)) + (c1y * t2)) + (d1y * t3));
  return SplineVec2.of(x, y);
};
SplineLathe.catmullTangent = function(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
  const t2 = t * t;
  const b1x = (0.0 - p0x) + p2x;
  const b1y = (0.0 - p0y) + p2y;
  const c1x = (((2.0 * p0x) - (5.0 * p1x)) + (4.0 * p2x)) - p3x;
  const c1y = (((2.0 * p0y) - (5.0 * p1y)) + (4.0 * p2y)) - p3y;
  const d1x = (((0.0 - p0x) + (3.0 * p1x)) - (3.0 * p2x)) + p3x;
  const d1y = (((0.0 - p0y) + (3.0 * p1y)) - (3.0 * p2y)) + p3y;
  const x = 0.5 * ((b1x + ((2.0 * c1x) * t)) + ((3.0 * d1x) * t2));
  const y = 0.5 * ((b1y + ((2.0 * c1y) * t)) + ((3.0 * d1y) * t2));
  return SplineVec2.of(x, y);
};
SplineLathe.clampRadius = function(x) {
  if ( x < 0.0 ) {
    return 0.0;
  }
  return x;
};
SplineLathe.sampleProfile = function(knots, curveType, segmentsPerSpan) {
  const out = new SplineMesh();
  const n = knots.length;
  if ( n < 2 ) {
    return out;
  }
  let seg = segmentsPerSpan;
  if ( seg < 1 ) {
    seg = 1;
  }
  let i = 0;
  while (i < (n - 1)) {
    const a = knots[i];
    const b = knots[(i + 1)];
    let s = 0;
    let last = seg;
    if ( i < (n - 2) ) {
      last = seg - 1;
    }
    while (s <= last) {
      const t = (s) / (seg);
      let p = new SplineVec2();
      let tan = new SplineVec2();
      if ( curveType == 0 ) {
        const c0x = a.x + a.hx;
        const c0y = a.y + a.hy;
        const c1x = b.x - b.hx;
        const c1y = b.y - b.hy;
        p = SplineLathe.bezierPoint(a.x, a.y, c0x, c0y, c1x, c1y, b.x, b.y, t);
        tan = SplineLathe.bezierTangent(a.x, a.y, c0x, c0y, c1x, c1y, b.x, b.y, t);
      } else {
        let i0 = i - 1;
        if ( i0 < 0 ) {
          i0 = 0;
        }
        let i3 = i + 2;
        if ( i3 >= n ) {
          i3 = n - 1;
        }
        const p0 = knots[i0];
        const p3 = knots[i3];
        p = SplineLathe.catmullPoint(p0.x, p0.y, a.x, a.y, b.x, b.y, p3.x, p3.y, t);
        tan = SplineLathe.catmullTangent(p0.x, p0.y, a.x, a.y, b.x, b.y, p3.x, p3.y, t);
      }
      out.profileX.push(SplineLathe.clampRadius(p.x));
      out.profileY.push(p.y);
      s = s + 1;
    };
    i = i + 1;
  };
  return out;
};
SplineLathe.sampleAndLathe = function(knots, curveType, pathSegments, angularSteps) {
  return SplineLathe.sampleAndLatheEx(knots, curveType, pathSegments, angularSteps, 6.283185307179586, true);
};
SplineLathe.sampleAndLatheEx = function(knots, curveType, pathSegments, angularSteps, phiLength, closed) {
  const mesh = new SplineMesh();
  const n = knots.length;
  if ( n < 2 ) {
    return mesh;
  }
  let steps = angularSteps;
  if ( steps < 3 ) {
    steps = 3;
  }
  let seg = pathSegments;
  if ( seg < 1 ) {
    seg = 1;
  }
  let phi = phiLength;
  if ( phi < 0.0001 ) {
    phi = 6.283185307179586;
  }
  let px = [];
  let py = [];
  let tx = [];
  let ty = [];
  let i = 0;
  while (i < (n - 1)) {
    const a = knots[i];
    const b = knots[(i + 1)];
    let s = 0;
    let last = seg;
    if ( i < (n - 2) ) {
      last = seg - 1;
    }
    while (s <= last) {
      const t = (s) / (seg);
      let p = new SplineVec2();
      let tan = new SplineVec2();
      if ( curveType == 0 ) {
        const c0x = a.x + a.hx;
        const c0y = a.y + a.hy;
        const c1x = b.x - b.hx;
        const c1y = b.y - b.hy;
        p = SplineLathe.bezierPoint(a.x, a.y, c0x, c0y, c1x, c1y, b.x, b.y, t);
        tan = SplineLathe.bezierTangent(a.x, a.y, c0x, c0y, c1x, c1y, b.x, b.y, t);
      } else {
        let i0 = i - 1;
        if ( i0 < 0 ) {
          i0 = 0;
        }
        let i3 = i + 2;
        if ( i3 >= n ) {
          i3 = n - 1;
        }
        const p0 = knots[i0];
        const p3 = knots[i3];
        p = SplineLathe.catmullPoint(p0.x, p0.y, a.x, a.y, b.x, b.y, p3.x, p3.y, t);
        tan = SplineLathe.catmullTangent(p0.x, p0.y, a.x, a.y, b.x, b.y, p3.x, p3.y, t);
      }
      px.push(SplineLathe.clampRadius(p.x));
      py.push(p.y);
      tx.push(tan.x);
      ty.push(tan.y);
      s = s + 1;
    };
    i = i + 1;
  };
  const rows = px.length;
  if ( rows < 2 ) {
    return mesh;
  }
  mesh.profileX = px;
  mesh.profileY = py;
  let row = 0;
  while (row < rows) {
    const radius = px[row];
    const yy = py[row];
    const tdx = tx[row];
    const tdy = ty[row];
    let pnx = tdy;
    let pny = 0.0 - tdx;
    let pnl = Math.sqrt(((pnx * pnx) + (pny * pny)));
    if ( pnl < 1e-9 ) {
      pnx = 1.0;
      pny = 0.0;
      pnl = 1.0;
    }
    pnx = pnx / pnl;
    pny = pny / pnl;
    if ( pnx < 0.0 ) {
      pnx = 0.0 - pnx;
      pny = 0.0 - pny;
    }
    let col = 0;
    while (col < steps) {
      const u = (col) / (steps);
      const theta = u * phi;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);
      mesh.positions.push(radius * ct);
      mesh.positions.push(yy);
      mesh.positions.push(radius * st);
      mesh.normals.push(pnx * ct);
      mesh.normals.push(pny);
      mesh.normals.push(pnx * st);
      mesh.uvs.push(u);
      mesh.uvs.push((row) / ((rows - 1)));
      col = col + 1;
    };
    row = row + 1;
  };
  let r2 = 0;
  while (r2 < (rows - 1)) {
    let c2 = 0;
    let colMax = steps;
    if ( closed == false ) {
      colMax = steps - 1;
    }
    while (c2 < colMax) {
      const a2 = (r2 * steps) + c2;
      let cNext = c2 + 1;
      if ( cNext >= steps ) {
        cNext = 0;
      }
      const b2 = (r2 * steps) + cNext;
      const c3 = ((r2 + 1) * steps) + cNext;
      const d3 = ((r2 + 1) * steps) + c2;
      mesh.indices.push(a2);
      mesh.indices.push(d3);
      mesh.indices.push(b2);
      mesh.indices.push(b2);
      mesh.indices.push(d3);
      mesh.indices.push(c3);
      c2 = c2 + 1;
    };
    r2 = r2 + 1;
  };
  return mesh;
};
SplineLathe.defaultKnots = function() {
  let knots = [];
  knots.push(SplineKnot.of(0.0, (0.0 - 1.0), 0.22, 0.0));
  knots.push(SplineKnot.of(0.5, 0.0, 0.0, 0.28));
  knots.push(SplineKnot.of(0.0, 1.0, (0.0 - 0.22), 0.0));
  return knots;
};

export { SplineVec2, SplineKnot, SplineMesh, SplineLathe };
export default SplineLathe;
