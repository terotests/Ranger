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
    this.orbitX = [];
    this.orbitY = [];
    this.rowSeg = [];
    this.colSeg = [];
    this.rows = 0;
    this.steps = 0;
    this.vertCols = 0;
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
  return [SplineKnot.of(0.0, (0.0 - 1.0), 0.22, 0.0), SplineKnot.of(0.5, 0.0, 0.0, 0.28), SplineKnot.of(0.0, 1.0, (0.0 - 0.22), 0.0)];
};
SplineLathe.defaultOrbitKnots = function() {
  const k = 0.5522847498307936;
  return [SplineKnot.of(1.0, 0.0, 0.0, k), SplineKnot.of(0.0, 1.0, (0.0 - k), 0.0), SplineKnot.of((0.0 - 1.0), 0.0, 0.0, (0.0 - k)), SplineKnot.of(0.0, (0.0 - 1.0), k, 0.0)];
};
SplineLathe.sampleClosedOrbit = function(knots, curveType, segmentsPerSpan) {
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
  while (i < n) {
    const a = knots[i];
    let ni = i + 1;
    if ( ni >= n ) {
      ni = 0;
    }
    const b = knots[ni];
    let s = 0;
    while (s < seg) {
      const t = (s) / (seg);
      let p = new SplineVec2();
      if ( curveType == 0 ) {
        const c0x = a.x + a.hx;
        const c0y = a.y + a.hy;
        const c1x = b.x - b.hx;
        const c1y = b.y - b.hy;
        p = SplineLathe.bezierPoint(a.x, a.y, c0x, c0y, c1x, c1y, b.x, b.y, t);
      } else {
        let i0 = i - 1;
        if ( i0 < 0 ) {
          i0 = n - 1;
        }
        let i3 = ni + 1;
        if ( i3 >= n ) {
          i3 = 0;
        }
        const p0 = knots[i0];
        const p3 = knots[i3];
        p = SplineLathe.catmullPoint(p0.x, p0.y, a.x, a.y, b.x, b.y, p3.x, p3.y, t);
      }
      out.orbitX.push(p.x);
      out.orbitY.push(p.y);
      out.profileX.push(i);
      s = s + 1;
    };
    i = i + 1;
  };
  return out;
};
SplineLathe.sampleAndLatheOrbit = function(knots, curveType, pathSegments, orbitX, orbitY, colStart, colCount, closed) {
  const mesh = new SplineMesh();
  const n = knots.length;
  const oLen = orbitX.length;
  if ( (n < 2) || (oLen < 3) ) {
    return mesh;
  }
  let steps = colCount;
  if ( steps < 1 ) {
    steps = 1;
  }
  if ( (colStart + steps) > oLen ) {
    steps = oLen - colStart;
  }
  if ( steps < 1 ) {
    return mesh;
  }
  let seg = pathSegments;
  if ( seg < 1 ) {
    seg = 1;
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
      const oi = colStart + col;
      const ct = orbitX[oi];
      const st = orbitY[oi];
      const olen = Math.sqrt(((ct * ct) + (st * st)));
      let nct = ct;
      let nst = st;
      if ( olen < 1e-9 ) {
        nct = 1.0;
        nst = 0.0;
      } else {
        nct = ct / olen;
        nst = st / olen;
      }
      const u = (oi) / (oLen);
      mesh.positions.push(radius * ct);
      mesh.positions.push(yy);
      mesh.positions.push(radius * st);
      mesh.normals.push(pnx * nct);
      mesh.normals.push(pny);
      mesh.normals.push(pnx * nst);
      mesh.uvs.push(u);
      mesh.uvs.push((row) / ((rows - 1)));
      col = col + 1;
    };
    row = row + 1;
  };
  let oi2 = 0;
  while (oi2 < oLen) {
    mesh.orbitX.push(orbitX[oi2]);
    mesh.orbitY.push(orbitY[oi2]);
    oi2 = oi2 + 1;
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
SplineLathe.buildSpineFrames = function(cx, cy, cz) {
  let out = [];
  const n = cx.length;
  if ( n < 1 ) {
    return out;
  }
  let nx = 1.0;
  let ny = 0.0;
  let nz = 0.0;
  let i = 0;
  while (i < n) {
    let tx = 0.0;
    let ty = 1.0;
    let tz = 0.0;
    if ( n > 1 ) {
      if ( i == 0 ) {
        tx = (cx[1]) - (cx[0]);
        ty = (cy[1]) - (cy[0]);
        tz = (cz[1]) - (cz[0]);
      } else {
        if ( i == (n - 1) ) {
          tx = (cx[(n - 1)]) - (cx[(n - 2)]);
          ty = (cy[(n - 1)]) - (cy[(n - 2)]);
          tz = (cz[(n - 1)]) - (cz[(n - 2)]);
        } else {
          tx = (cx[(i + 1)]) - (cx[(i - 1)]);
          ty = (cy[(i + 1)]) - (cy[(i - 1)]);
          tz = (cz[(i + 1)]) - (cz[(i - 1)]);
        }
      }
    }
    let tl = Math.sqrt((((tx * tx) + (ty * ty)) + (tz * tz)));
    if ( tl < 1e-9 ) {
      tx = 0.0;
      ty = 1.0;
      tz = 0.0;
      tl = 1.0;
    }
    tx = tx / tl;
    ty = ty / tl;
    tz = tz / tl;
    const dt = ((nx * tx) + (ny * ty)) + (nz * tz);
    nx = nx - (tx * dt);
    ny = ny - (ty * dt);
    nz = nz - (tz * dt);
    const nl = Math.sqrt((((nx * nx) + (ny * ny)) + (nz * nz)));
    if ( nl < 0.000001 ) {
      let aty = ty;
      if ( aty < 0.0 ) {
        aty = 0.0 - aty;
      }
      const rx = 0.0;
      let ry = 0.0;
      let rz = 1.0;
      if ( aty < 0.9 ) {
        ry = 1.0;
        rz = 0.0;
      }
      nx = (ry * tz) - (rz * ty);
      ny = (rz * tx) - (rx * tz);
      nz = (rx * ty) - (ry * tx);
      const nl2 = Math.sqrt((((nx * nx) + (ny * ny)) + (nz * nz)));
      if ( nl2 < 0.000001 ) {
        nx = 1.0;
        ny = 0.0;
        nz = 0.0;
      } else {
        nx = nx / nl2;
        ny = ny / nl2;
        nz = nz / nl2;
      }
    } else {
      nx = nx / nl;
      ny = ny / nl;
      nz = nz / nl;
    }
    let bx = (ty * nz) - (tz * ny);
    let by = (tz * nx) - (tx * nz);
    let bz = (tx * ny) - (ty * nx);
    let bl = Math.sqrt((((bx * bx) + (by * by)) + (bz * bz)));
    if ( bl < 1e-9 ) {
      bl = 1.0;
    }
    bx = bx / bl;
    by = by / bl;
    bz = bz / bl;
    const rnx = (by * tz) - (bz * ty);
    const rny = (bz * tx) - (bx * tz);
    const rnz = (bx * ty) - (by * tx);
    let rnl = Math.sqrt((((rnx * rnx) + (rny * rny)) + (rnz * rnz)));
    if ( rnl < 1e-9 ) {
      rnl = 1.0;
    }
    nx = rnx / rnl;
    ny = rny / rnl;
    nz = rnz / rnl;
    out.push(tx);
    out.push(ty);
    out.push(tz);
    out.push(nx);
    out.push(ny);
    out.push(nz);
    out.push(bx);
    out.push(by);
    out.push(bz);
    out.push(cx[i]);
    out.push(cy[i]);
    out.push(cz[i]);
    i = i + 1;
  };
  return out;
};
SplineLathe.latheOnSpine = function(profX, profY, profTx, profTy, profSeg, orbX, orbY, orbSeg, cenX, cenY, cenZ, closed) {
  const mesh = new SplineMesh();
  const rows = profX.length;
  const steps = orbX.length;
  if ( (rows < 1) || (steps < 1) ) {
    return mesh;
  }
  let vertCols = steps;
  if ( closed ) {
    vertCols = steps + 1;
  }
  const frames = SplineLathe.buildSpineFrames(cenX, cenY, cenZ);
  const nFrames = (((frames.length) / 12) | 0);
  let row = 0;
  while (row < rows) {
    let radius = profX[row];
    if ( radius < 0.0 ) {
      radius = 0.0;
    }
    let pnx = profTy[row];
    let pny = 0.0 - (profTx[row]);
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
    let ftx = 0.0;
    let fty = 1.0;
    let ftz = 0.0;
    let fnx = 1.0;
    let fny = 0.0;
    let fnz = 0.0;
    let fbx = 0.0;
    let fby = 0.0;
    let fbz = 1.0;
    let fcx = 0.0;
    let fcy = profY[row];
    let fcz = 0.0;
    if ( row < nFrames ) {
      const o = row * 12;
      ftx = frames[o];
      fty = frames[(o + 1)];
      ftz = frames[(o + 2)];
      fnx = frames[(o + 3)];
      fny = frames[(o + 4)];
      fnz = frames[(o + 5)];
      fbx = frames[(o + 6)];
      fby = frames[(o + 7)];
      fbz = frames[(o + 8)];
      fcx = frames[(o + 9)];
      fcy = frames[(o + 10)];
      fcz = frames[(o + 11)];
    }
    let v = 0.0;
    if ( rows > 1 ) {
      v = (row) / ((rows - 1));
    }
    let col = 0;
    while (col < steps) {
      const ct = orbX[col];
      const st = orbY[col];
      const olen = Math.sqrt(((ct * ct) + (st * st)));
      let nct = 1.0;
      let nst = 0.0;
      if ( olen >= 1e-9 ) {
        nct = ct / olen;
        nst = st / olen;
      }
      const ox = (fnx * (radius * ct)) + (fbx * (radius * st));
      const oy = (fny * (radius * ct)) + (fby * (radius * st));
      const oz = (fnz * (radius * ct)) + (fbz * (radius * st));
      mesh.positions.push(fcx + ox);
      mesh.positions.push(fcy + oy);
      mesh.positions.push(fcz + oz);
      const vnx = ((fnx * (pnx * nct)) + (ftx * pny)) + (fbx * (pnx * nst));
      const vny = ((fny * (pnx * nct)) + (fty * pny)) + (fby * (pnx * nst));
      const vnz = ((fnz * (pnx * nct)) + (ftz * pny)) + (fbz * (pnx * nst));
      let vnl = Math.sqrt((((vnx * vnx) + (vny * vny)) + (vnz * vnz)));
      if ( vnl < 1e-9 ) {
        vnl = 1.0;
      }
      mesh.normals.push(vnx / vnl);
      mesh.normals.push(vny / vnl);
      mesh.normals.push(vnz / vnl);
      mesh.uvs.push((col) / (steps));
      mesh.uvs.push(v);
      col = col + 1;
    };
    if ( closed ) {
      const base = (mesh.positions.length) - (steps * 3);
      mesh.positions.push(mesh.positions[base]);
      mesh.positions.push(mesh.positions[(base + 1)]);
      mesh.positions.push(mesh.positions[(base + 2)]);
      const nbase = (mesh.normals.length) - (steps * 3);
      mesh.normals.push(mesh.normals[nbase]);
      mesh.normals.push(mesh.normals[(nbase + 1)]);
      mesh.normals.push(mesh.normals[(nbase + 2)]);
      mesh.uvs.push(1.0);
      mesh.uvs.push(v);
    }
    row = row + 1;
  };
  let r = 0;
  while (r < (rows - 1)) {
    let colMax = steps - 1;
    if ( closed ) {
      colMax = steps;
    }
    let c = 0;
    while (c < colMax) {
      const cn = c + 1;
      const ia = (r * vertCols) + c;
      const ib = (r * vertCols) + cn;
      const ic = ((r + 1) * vertCols) + cn;
      const id = ((r + 1) * vertCols) + c;
      mesh.indices.push(ia);
      mesh.indices.push(id);
      mesh.indices.push(ib);
      mesh.indices.push(ib);
      mesh.indices.push(id);
      mesh.indices.push(ic);
      c = c + 1;
    };
    r = r + 1;
  };
  mesh.profileX = profX;
  mesh.profileY = profY;
  mesh.orbitX = orbX;
  mesh.orbitY = orbY;
  mesh.rowSeg = profSeg;
  mesh.colSeg = orbSeg;
  mesh.rows = rows;
  mesh.steps = steps;
  mesh.vertCols = vertCols;
  return mesh;
};
SplineLathe.torusUnitFitScale = function(profX, profY, orbX, orbY) {
  let rr = 0.0;
  let cnt = 0;
  const oLen = orbX.length;
  let i = 0;
  while (i < oLen) {
    const ox = orbX[i];
    const oy = orbY[i];
    const l = Math.sqrt(((ox * ox) + (oy * oy)));
    if ( l > 1e-9 ) {
      rr = rr + l;
      cnt = cnt + 1;
    }
    i = i + 1;
  };
  let majorR = 1.0;
  if ( cnt > 0 ) {
    majorR = rr / (cnt);
  }
  let tubeR = 0.0;
  const pLen = profX.length;
  let j = 0;
  while (j < pLen) {
    let px = profX[j];
    if ( px < 0.0 ) {
      px = 0.0;
    }
    const py = profY[j];
    const l2 = Math.sqrt(((px * px) + (py * py)));
    if ( l2 > tubeR ) {
      tubeR = l2;
    }
    j = j + 1;
  };
  if ( tubeR < 1e-9 ) {
    tubeR = 0.25;
  }
  return 1.0 / (majorR + tubeR);
};
SplineLathe.torusOnSpine = function(profX, profY, profTx, profTy, profSeg, orbX, orbY, orbSeg, cenX, cenY, cenZ, fit, closed) {
  const mesh = new SplineMesh();
  const rows = profX.length;
  const steps = orbX.length;
  if ( (rows < 1) || (steps < 1) ) {
    return mesh;
  }
  let vertCols = steps;
  if ( closed ) {
    vertCols = steps + 1;
  }
  const frames = SplineLathe.buildSpineFrames(cenX, cenY, cenZ);
  const nFrames = (((frames.length) / 12) | 0);
  let row = 0;
  while (row < rows) {
    let px = profX[row];
    if ( px < 0.0 ) {
      px = 0.0;
    }
    px = px * fit;
    const py = (profY[row]) * fit;
    let pnx = profTy[row];
    let pny = 0.0 - (profTx[row]);
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
    let v = 0.0;
    if ( rows > 1 ) {
      v = (row) / ((rows - 1));
    }
    let col = 0;
    while (col < steps) {
      let fnx = 1.0;
      let fny = 0.0;
      let fnz = 0.0;
      let fbx = 0.0;
      let fby = 1.0;
      let fbz = 0.0;
      let fcx = 0.0;
      let fcy = 0.0;
      let fcz = 0.0;
      if ( col < (cenX.length) ) {
        fcx = cenX[col];
        fcy = cenY[col];
        fcz = cenZ[col];
      }
      if ( col < nFrames ) {
        const o = col * 12;
        fnx = frames[(o + 3)];
        fny = frames[(o + 4)];
        fnz = frames[(o + 5)];
        fbx = frames[(o + 6)];
        fby = frames[(o + 7)];
        fbz = frames[(o + 8)];
        fcx = frames[(o + 9)];
        fcy = frames[(o + 10)];
        fcz = frames[(o + 11)];
      }
      mesh.positions.push(fcx + ((fnx * px) + (fbx * py)));
      mesh.positions.push(fcy + ((fny * px) + (fby * py)));
      mesh.positions.push(fcz + ((fnz * px) + (fbz * py)));
      const vnx = (fnx * pnx) + (fbx * pny);
      const vny = (fny * pnx) + (fby * pny);
      const vnz = (fnz * pnx) + (fbz * pny);
      let vnl = Math.sqrt((((vnx * vnx) + (vny * vny)) + (vnz * vnz)));
      if ( vnl < 1e-9 ) {
        vnl = 1.0;
      }
      mesh.normals.push(vnx / vnl);
      mesh.normals.push(vny / vnl);
      mesh.normals.push(vnz / vnl);
      mesh.uvs.push((col) / (steps));
      mesh.uvs.push(v);
      col = col + 1;
    };
    if ( closed ) {
      const base = (mesh.positions.length) - (steps * 3);
      mesh.positions.push(mesh.positions[base]);
      mesh.positions.push(mesh.positions[(base + 1)]);
      mesh.positions.push(mesh.positions[(base + 2)]);
      const nbase = (mesh.normals.length) - (steps * 3);
      mesh.normals.push(mesh.normals[nbase]);
      mesh.normals.push(mesh.normals[(nbase + 1)]);
      mesh.normals.push(mesh.normals[(nbase + 2)]);
      mesh.uvs.push(1.0);
      mesh.uvs.push(v);
    }
    row = row + 1;
  };
  let r = 0;
  while (r < (rows - 1)) {
    let colMax = steps - 1;
    if ( closed ) {
      colMax = steps;
    }
    let c = 0;
    while (c < colMax) {
      const cn = c + 1;
      const ia = (r * vertCols) + c;
      const ib = (r * vertCols) + cn;
      const ic = ((r + 1) * vertCols) + cn;
      const id = ((r + 1) * vertCols) + c;
      mesh.indices.push(ia);
      mesh.indices.push(id);
      mesh.indices.push(ib);
      mesh.indices.push(ib);
      mesh.indices.push(id);
      mesh.indices.push(ic);
      c = c + 1;
    };
    r = r + 1;
  };
  mesh.profileX = profX;
  mesh.profileY = profY;
  mesh.orbitX = orbX;
  mesh.orbitY = orbY;
  mesh.rowSeg = profSeg;
  mesh.colSeg = orbSeg;
  mesh.rows = rows;
  mesh.steps = steps;
  mesh.vertCols = vertCols;
  return mesh;
};

export { SplineVec2, SplineKnot, SplineMesh, SplineLathe };
export default SplineLathe;
