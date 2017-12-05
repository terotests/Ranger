class Vec2  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
  }
}
Vec2.CreateNew = function(i, j) {
  const v = new Vec2();
  v.x = i;
  v.y = j;
  return v;
};
class Mat2  {
  constructor() {
    this.m0 = 1.0;
    this.m1 = 0.0;
    this.m2 = 0.0;
    this.m3 = 1.0;
    this.m4 = 0.0;
    this.m5 = 0.0;
  }
  toIdentity () {
    this.m0 = 1.0;
    this.m1 = 0.0;
    this.m2 = 0.0;
    this.m3 = 1.0;
    this.m4 = 0.0;
    this.m5 = 0.0;
  };
  setTranslate (tx, ty) {
    this.m4 = tx;
    this.m5 = ty;
  };
  setScale (sx, sy) {
    this.m1 = sx;
    this.m3 = sy;
  };
  setSkewX (v) {
    this.m0 = 1.0;
    this.m1 = 0.0;
    this.m2 = Math.tan(v);
    this.m3 = 1.0;
    this.m4 = 0.0;
    this.m5 = 0.0;
  };
  setSkewY (v) {
    this.m0 = 1.0;
    this.m1 = Math.tan(v);
    this.m2 = 0.0;
    this.m3 = 1.0;
    this.m4 = 0.0;
    this.m5 = 0.0;
  };
  setRotation (v) {
    const cs = Math.cos(v);
    const sn = Math.sin(v);
    this.m0 = cs;
    this.m1 = sn;
    this.m2 = -1.0 * sn;
    this.m3 = cs;
    this.m4 = 0.0;
    this.m5 = 0.0;
  };
  multiply (b) {
    const t0 = (this.m0 * b.m0) + (this.m1 * b.m2);
    const t2 = (this.m2 * b.m0) + (this.m3 * b.m2);
    const t4 = ((this.m4 * b.m0) + (this.m5 * b.m2)) + b.m4;
    this.m1 = (this.m0 * b.m1) + (this.m1 * b.m3);
    this.m3 = (this.m2 * b.m1) + (this.m3 * b.m3);
    this.m5 = ((this.m4 * b.m1) + (this.m5 * b.m3)) + b.m5;
    this.m0 = t0;
    this.m2 = t2;
    this.m4 = t4;
  };
  inverse () {
    let invdet = (this.m0 * this.m3) - (this.m2 * this.m1);
    const det = invdet;
    if ( (det > -0.0001) && (det < 0.0001) ) {
      this.toIdentity();
      return this;
    }
    invdet = 1.0 / det;
    const inv = new Mat2();
    inv.m0 = this.m3 * invdet;
    inv.m2 = (-1.0 * this.m2) * invdet;
    inv.m4 = (this.m2 * this.m5) - ((this.m3 * this.m4) * invdet);
    inv.m1 = (-1.0 * this.m1) * invdet;
    inv.m3 = this.m0 * invdet;
    inv.m5 = (this.m1 * this.m4) - ((this.m0 * this.m5) * invdet);
    return inv;
  };
  transformPoint (v) {
    const res = new Vec2();
    res.x = ((v.x * this.m0) + (v.y * this.m2)) + this.m4;
    res.y = ((v.x * this.m1) + (v.y * this.m3)) + this.m5;
    return res;
  };
  rotateVector (v) {
    const res = new Vec2();
    res.x = (v.x * this.m0) + (v.y * this.m2);
    res.y = (v.x * this.m1) + (v.y * this.m3);
    return res;
  };
}
class PathExecutor  {
  constructor() {
  }
  Move (x, y) {
    console.log((("Move called with " + x) + ", ") + y);
  };
  Line (x, y) {
    console.log((("Line called with " + x) + ", ") + y);
  };
  Curve (x0, y0, x1, y1, x2, y2) {
    console.log(((((((((((("Cubic bezier curve called with " + x0) + ", ") + y0) + " ") + x1) + ", ") + y1) + " ") + x2) + ", ") + y2) + " ");
  };
}
class PathCollector  extends PathExecutor {
  constructor() {
    super()
    this.pathParts = [];
  }
  Move (x, y) {
    this.pathParts.push(((("M " + x) + " ") + y) + " ");
  };
  Line (x, y) {
    this.pathParts.push(((("L " + x) + " ") + y) + " ");
  };
  Curve (x0, y0, x1, y1, x2, y2) {
    this.pathParts.push(((((((((((("C " + x0) + " ") + y0) + " ") + x1) + " ") + y1) + " ") + x2) + " ") + y2) + " ");
  };
  getString () {
    return this.pathParts.join(" ");
  };
}
class PathSegment  {
  constructor() {
    this.t0 = 0.0;
    this.t1 = 0.0;
    this.t2 = 0.0;
    this.t3 = 0.0;
    this.t4 = 0.0;
    this.t5 = 0.0;
    this.t6 = 0.0;
  }
}
class EVGBezierPath  {
  constructor() {
    this.points = [];     /** note: unused */
    this.pointCnt = 0;     /** note: unused */
    this.closed = false;
    this.bounds = Vec2.CreateNew(0.0, 0.0);     /** note: unused */
    this.cp1 = Vec2.CreateNew(0.0, 0.0);     /** note: unused */
    this.cp2 = Vec2.CreateNew(0.0, 0.0);     /** note: unused */
    this.controlPoint = Vec2.CreateNew(0.0, 0.0);
  }
  close () {
    this.closed = true;
  };
  Line (point) {
  };
  moveTo (point) {
    this.controlPoint.x = point.x;
    this.controlPoint.y = point.y;
  };
}
class EVGPathParser  {
  constructor() {
    this.i = 0;
    this.__len = 0;
    this.last_number = 0.0;
  }
  __sqr (v) {
    return v * v;
  };
  __xformPoint (point, seg) {
    const res = Vec2.CreateNew((((point.x * seg.t0) + (point.y * seg.t2)) + seg.t4), (((point.x * seg.t1) + (point.y * seg.t3)) + seg.t5));
    return res;
  };
  __xformVec (point, seg) {
    return Vec2.CreateNew(((point.x * seg.t0) + (point.y * seg.t2)), ((point.x * seg.t1) + (point.y * seg.t3)));
  };
  __vmag (point) {
    return Math.sqrt(((point.x * point.x) + (point.y * point.y)));
  };
  __vecrat (u, v) {
    return ((u.x * v.x) + (u.y * v.y)) / (this.__vmag(u) * this.__vmag(v));
  };
  __vecang (u, v) {
    let r = this.__vecrat(u, v);
    if ( r < -1.0 ) {
      r = -1.0;
    }
    if ( r > 1.0 ) {
      r = 1.0;
    }
    let res = 1.0;
    if ( (u.x * v.y) < (u.y * v.x) ) {
      res = -1.0;
    }
    return res * (Math.acos(r));
  };
  scanNumber () {
    const s = this.buff;
    let fc = s.charCodeAt(this.i );
    let c = fc;
    let sp = 0;
    let ep = 0;
    fc = s.charCodeAt(this.i );
    if ( (((fc == 45) && ((s.charCodeAt((this.i + 1) )) >= 46)) && ((s.charCodeAt((this.i + 1) )) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
      sp = this.i;
      this.i = 1 + this.i;
      c = s.charCodeAt(this.i );
      while ((this.i < this.__len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((this.i == sp) && ((c == (43)) || (c == (45)))))) {
        this.i = 1 + this.i;
        if ( this.i >= this.__len ) {
          break;
        }
        c = s.charCodeAt(this.i );
      };
      ep = this.i;
      this.last_number = (isNaN( parseFloat((s.substring(sp, ep ))) ) ? undefined : parseFloat((s.substring(sp, ep ))));
      return true;
    }
    return false;
  };
  pathArcTo (callback, cp, args, rel) {
    let rx = 0.0;
    let ry = 0.0;
    let rotx = 0.0;
    let x1 = 0.0;
    let y1 = 0.0;
    let x2 = 0.0;
    let y2 = 0.0;
    let cx = 0.0;
    let cy = 0.0;
    let dx = 0.0;
    let dy = 0.0;
    let d = 0.0;
    let x1p = 0.0;
    let y1p = 0.0;
    let cxp = 0.0;
    let cyp = 0.0;
    let s = 0.0;
    let sa = 0.0;
    let sb = 0.0;
    /** unused:  const ux = 0.0   **/ 
    /** unused:  const uy = 0.0   **/ 
    /** unused:  const vx = 0.0   **/ 
    /** unused:  const vy = 0.0   **/ 
    let a1 = 0.0;
    let da = 0.0;
    let x = 0.0;
    let y = 0.0;
    let tanx = 0.0;
    let tany = 0.0;
    let a = 0.0;
    let px = 0.0;
    let py = 0.0;
    let ptanx = 0.0;
    let ptany = 0.0;
    const t = new PathSegment();
    let sinrx = 0.0;
    let cosrx = 0.0;
    let fa = 0.0;
    let fs = 0.0;
    let i_1 = 0;
    let ndivs = 0;
    let hda = 0.0;
    let kappa = 0.0;
    const PI_VALUE = Math.PI;
    const cpx = cp.x;
    const cpy = cp.y;
    rx = Math.abs(args.t0);
    ry = Math.abs(args.t1);
    rotx = (args.t2 / 180.0) * PI_VALUE;
    fa = ((Math.abs(args.t3)) > 0.00001) ? 1.0 : 0.0;
    fs = ((Math.abs(args.t4)) > 0.00001) ? 1.0 : 0.0;
    x1 = cpx;
    y1 = cpy;
    if ( rel ) {
      x2 = cpx + args.t5;
      y2 = cpy + args.t6;
    } else {
      x2 = args.t5;
      y2 = args.t6;
    }
    dx = x1 - x2;
    dy = y1 - y2;
    d = Math.sqrt(((dx * dx) + (dy * dy)));
    if ( ((d < 0.00001) || (rx < 0.00001)) || (ry < 0.00001) ) {
      callback.Line(x2, y2);
      return Vec2.CreateNew(x2, y2);
    }
    sinrx = Math.sin(rotx);
    cosrx = Math.cos(rotx);
    x1p = ((cosrx * dx) / 2.0) + ((sinrx * dy) / 2.0);
    y1p = (((-1.0 * sinrx) * dx) / 2.0) + ((cosrx * dy) / 2.0);
    d = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
    if ( d > 1.0 ) {
      d = Math.sqrt(d);
      rx = rx * d;
      ry = ry * d;
    }
    s = 0.0;
    sa = (((rx * rx) * (ry * ry)) - ((rx * rx) * (y1p * y1p))) - ((ry * ry) * (x1p * x1p));
    sb = ((rx * rx) * (y1p * y1p)) + ((ry * ry) * (x1p * x1p));
    if ( sa < 0.0 ) {
      sa = 0.0;
    }
    if ( sb > 0.0 ) {
      s = Math.sqrt((sa / sb));
    }
    if ( fa == fs ) {
      s = -1.0 * s;
    }
    cxp = ((s * rx) * y1p) / ry;
    cyp = ((s * (-1.0 * ry)) * x1p) / rx;
    cx = ((x1 + x2) / 2.0) + ((cosrx * cxp) - (sinrx * cyp));
    cy = ((y1 + y2) / 2.0) + ((sinrx * cxp) + (cosrx * cyp));
    const u = Vec2.CreateNew(((x1p - cxp) / rx), ((y1p - cyp) / ry));
    const v = Vec2.CreateNew((((-1.0 * x1p) - cxp) / rx), (((-1.0 * y1p) - cyp) / ry));
    const unitV = Vec2.CreateNew(1.0, 0.0);
    a1 = this.__vecang(unitV, u);
    da = this.__vecang(u, v);
    if ( (fs == 0.0) && (da > 0.0) ) {
      da = da - (2.0 * PI_VALUE);
    } else {
      if ( (fs == 1.0) && (da < 0.0) ) {
        da = (2.0 * PI_VALUE) + da;
      }
    }
    t.t0 = cosrx;
    t.t1 = sinrx;
    t.t2 = -1.0 * sinrx;
    t.t3 = cosrx;
    t.t4 = cx;
    t.t5 = cy;
    ndivs = Math.floor( (((Math.abs(da)) / (PI_VALUE * 0.5)) + 1.0));
    hda = (da / (ndivs)) / 2.0;
    kappa = Math.abs((((4.0 / 3.0) * (1.0 - (Math.cos(hda)))) / (Math.sin(hda))));
    if ( da < 0.0 ) {
      kappa = -1.0 * kappa;
    }
    i_1 = 0;
    while (i_1 <= ndivs) {
      a = a1 + ((da * (i_1)) / (ndivs));
      dx = Math.cos(a);
      dy = Math.sin(a);
      const trans = this.__xformPoint(Vec2.CreateNew((dx * rx), (dy * ry)), t);
      x = trans.x;
      y = trans.y;
      const v_trans = this.__xformVec(Vec2.CreateNew((((-1.0 * dy) * rx) * kappa), ((dx * ry) * kappa)), t);
      tanx = v_trans.x;
      tany = v_trans.y;
      if ( i_1 > 0 ) {
        callback.Curve(px + ptanx, py + ptany, x - tanx, y - tany, x, y);
      }
      px = x;
      py = y;
      ptanx = tanx;
      ptany = tany;
      i_1 = i_1 + 1;
    };
    const rv = Vec2.CreateNew(x2, y2);
    return rv;
  };
  parsePath (path, callback) {
    this.i = 0;
    this.buff = path;
    const s = this.buff;
    this.__len = s.length;
    /** unused:  const buff_1 = path   **/ 
    let cmd = 76;
    /** unused:  const path_1 = new EVGBezierPath()   **/ 
    const args = new PathSegment();
    let require_args = 2;
    let arg_cnt = 0;
    const QPx = new PathSegment();
    const QPy = new PathSegment();
    const CPx = new PathSegment();
    const CPy = new PathSegment();
    let cx = 0.0;
    let cy = 0.0;
    let cx2 = 0.0;
    let cy2 = 0.0;
    let last_i = -1;
    while (this.i < this.__len) {
      if ( last_i == this.i ) {
        this.i = this.i + 1;
      }
      last_i = this.i;
      const c = s.charCodeAt(this.i );
      if ( (((c == (86)) || (c == (118))) || (c == (72))) || (c == (104)) ) {
        cmd = c;
        require_args = 1;
        arg_cnt = 0;
        continue;
      }
      if ( (((((c == (109)) || (c == (77))) || (c == (76))) || (c == (108))) || (c == (116))) || (c == (84)) ) {
        cmd = c;
        require_args = 2;
        arg_cnt = 0;
        continue;
      }
      if ( (((c == (113)) || (c == (81))) || (c == (83))) || (c == (115)) ) {
        cmd = c;
        require_args = 4;
        arg_cnt = 0;
        continue;
      }
      if ( (c == (99)) || (c == (67)) ) {
        cmd = c;
        require_args = 6;
        arg_cnt = 0;
        continue;
      }
      if ( (c == (97)) || (c == (65)) ) {
        cmd = c;
        require_args = 7;
        arg_cnt = 0;
        continue;
      }
      if ( this.scanNumber() ) {
        switch (arg_cnt ) { 
          case 0 : 
            args.t0 = this.last_number;
            break;
          case 1 : 
            args.t1 = this.last_number;
            break;
          case 2 : 
            args.t2 = this.last_number;
            break;
          case 3 : 
            args.t3 = this.last_number;
            break;
          case 4 : 
            args.t4 = this.last_number;
            break;
          case 5 : 
            args.t5 = this.last_number;
            break;
          case 6 : 
            args.t6 = this.last_number;
            break;
          default: 
            break;
        };
        arg_cnt = arg_cnt + 1;
        if ( arg_cnt >= require_args ) {
          switch (cmd ) { 
            case 109 : 
              callback.Move(cx + args.t0, cy + args.t1);
              cx = args.t0;
              cy = args.t1;
              cmd = 76;
              require_args = 2;
              cx2 = cx;
              cy2 = cy;
              break;
            case 77 : 
              callback.Move(args.t0, args.t1);
              cx = args.t0;
              cy = args.t1;
              cmd = 76;
              require_args = 2;
              cx2 = cx;
              cy2 = cy;
              break;
            case 108 : 
              callback.Line(cx + args.t0, cy + args.t1);
              cx = cx + args.t0;
              cy = cy + args.t1;
              cx2 = cx;
              cy2 = cy;
              break;
            case 76 : 
              callback.Line(args.t0, args.t1);
              cx = args.t0;
              cy = args.t1;
              cx2 = cx;
              cy2 = cy;
              break;
            case 104 : 
              callback.Line(cx + args.t0, cy);
              cx = cx + args.t0;
              cx2 = cx;
              break;
            case 72 : 
              callback.Line(args.t0, cy);
              cx = args.t0;
              cx2 = cx;
              break;
            case 118 : 
              callback.Line(cx, cy + args.t0);
              cy = cy + args.t0;
              cy2 = cy;
              break;
            case 86 : 
              callback.Line(cx, args.t0);
              cy = args.t0;
              cy2 = cy;
              break;
            case 99 : 
              callback.Curve(cx + args.t0, cy + args.t1, cx + args.t2, cy + args.t3, cx + args.t4, cy + args.t5);
              cx2 = cx + args.t2;
              cy2 = cy + args.t3;
              cx = cx + args.t4;
              cy = cy + args.t5;
              break;
            case 67 : 
              callback.Curve(args.t0, args.t1, args.t2, args.t3, args.t4, args.t5);
              cx2 = args.t2;
              cy2 = args.t3;
              cx = args.t4;
              cy = args.t5;
              break;
            case 115 : 
              callback.Curve((cx + cx) - cx2, (cy + cy) - cy2, cx + args.t0, cy + args.t1, cx + args.t2, cy + args.t3);
              cx2 = cx + args.t0;
              cy2 = cy + args.t1;
              cx = cx + args.t2;
              cy = cy + args.t3;
              break;
            case 83 : 
              callback.Curve((cx + cx) - cx2, (cy + cy) - cy2, args.t0, args.t1, args.t2, args.t3);
              cx2 = args.t0;
              cy2 = args.t1;
              cx = args.t2;
              cy = args.t3;
              break;
            case 113 : 
              QPx.t0 = cx;
              QPy.t0 = cy;
              QPx.t1 = cx + args.t0;
              QPy.t1 = cy + args.t1;
              QPx.t2 = cx + args.t2;
              QPy.t2 = cy + args.t3;
              CPx.t0 = QPx.t0;
              CPy.t0 = QPy.t0;
              CPx.t1 = QPx.t0 + ((2.0 / 3.0) * (QPx.t1 - QPx.t0));
              CPy.t1 = QPy.t0 + ((2.0 / 3.0) * (QPy.t1 - QPy.t0));
              CPx.t2 = QPx.t2 + ((2.0 / 3.0) * (QPx.t1 - QPx.t2));
              CPy.t2 = QPy.t2 + ((2.0 / 3.0) * (QPy.t1 - QPy.t2));
              CPx.t3 = QPx.t2;
              CPy.t3 = QPy.t2;
              callback.Curve(CPx.t1, CPy.t1, CPx.t2, CPy.t2, CPx.t3, CPy.t3);
              cx2 = CPx.t2;
              cy2 = CPy.t2;
              cx = CPx.t3;
              cy = CPy.t3;
              break;
            case 81 : 
              QPx.t0 = cx;
              QPy.t0 = cy;
              QPx.t1 = args.t0;
              QPy.t1 = args.t1;
              QPx.t2 = args.t2;
              QPy.t2 = args.t3;
              CPx.t0 = QPx.t0;
              CPy.t0 = QPy.t0;
              CPx.t1 = QPx.t0 + ((2.0 / 3.0) * (QPx.t1 - QPx.t0));
              CPy.t1 = QPy.t0 + ((2.0 / 3.0) * (QPy.t1 - QPy.t0));
              CPx.t2 = QPx.t2 + ((2.0 / 3.0) * (QPx.t1 - QPx.t2));
              CPy.t2 = QPy.t2 + ((2.0 / 3.0) * (QPy.t1 - QPy.t2));
              CPx.t3 = QPx.t2;
              CPy.t3 = QPy.t2;
              callback.Curve(CPx.t1, CPy.t1, CPx.t2, CPy.t2, CPx.t3, CPy.t3);
              cx2 = CPx.t1;
              cy2 = CPy.t1;
              cx = CPx.t2;
              cy = CPy.t3;
              break;
            case 84 : 
              QPx.t0 = cx;
              QPy.t0 = cy;
              QPx.t1 = (2.0 * cx) - cx2;
              QPy.t1 = (2.0 * cy) - cy2;
              QPx.t2 = args.t0;
              QPy.t2 = args.t1;
              CPx.t0 = QPx.t0;
              CPy.t0 = QPy.t0;
              CPx.t1 = QPx.t0 + ((2.0 / 3.0) * (QPx.t1 - QPx.t0));
              CPy.t1 = QPy.t0 + ((2.0 / 3.0) * (QPy.t1 - QPy.t0));
              CPx.t2 = QPx.t2;
              CPy.t2 = QPy.t2;
              callback.Curve(CPx.t0, CPy.t0, CPx.t1, CPy.t1, CPx.t2, CPy.t2);
              cx2 = CPx.t1;
              cy2 = CPy.t1;
              cx = CPx.t2;
              cy = CPy.t3;
              break;
            case 116 : 
              QPx.t0 = cx;
              QPy.t0 = cy;
              QPx.t1 = (2.0 * cx) - cx2;
              QPy.t1 = (2.0 * cy) - cy2;
              QPx.t2 = cx + args.t0;
              QPy.t2 = cy + args.t1;
              CPx.t0 = QPx.t0;
              CPy.t0 = QPy.t0;
              CPx.t1 = QPx.t0 + ((2.0 / 3.0) * (QPx.t1 - QPx.t0));
              CPy.t1 = QPy.t0 + ((2.0 / 3.0) * (QPy.t1 - QPy.t0));
              CPx.t2 = QPx.t2;
              CPy.t2 = QPy.t2;
              callback.Curve(CPx.t0, CPy.t0, CPx.t1, CPy.t1, CPx.t2, CPy.t2);
              cx2 = CPx.t1;
              cy2 = CPy.t1;
              cx = CPx.t2;
              cy = CPy.t3;
              break;
            case 97 : 
              const res = this.pathArcTo(callback, Vec2.CreateNew(cx, cy), args, true);
              cx = res.x;
              cy = res.y;
              cx2 = cx;
              cy2 = cy;
              break;
            case 65 : 
              const res_1 = this.pathArcTo(callback, Vec2.CreateNew(cx, cy), args, false);
              cx = res_1.x;
              cy = res_1.y;
              cx2 = cx;
              cy2 = cy;
              break;
            default: 
              if ( arg_cnt >= 2 ) {
                cx = args.t0;
                cy = args.t1;
                cx2 = cx;
                cy2 = cy;
              }
              break;
          };
          arg_cnt = 0;
        }
      }
    };
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const path1 = "M130 110 C 120 140, 180 140, 170 110";
  const path2 = "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80";
  const path3 = "M10 80 Q 95 10 180 80";
  const path4 = "M10 80 Q 52.5 10, 95 80 T 180 80";
  const path5 = "M-130 -110 C 120 140, 180 140, 170 110";
  const path6 = "M10 315\r\n           L 110 215\r\n           A 30 50 0 0 1 162.55 162.45\r\n           L 172.55 152.45\r\n           A 30 50 -45 0 1 215.1 109.9\r\n           L 315 10";
  const path7 = "M 14.781 14.347 h 1.738 c 0.24 0 0.436 -0.194 0.436 -0.435 v -1.739 c 0 -0.239 -0.195 -0.435 -0.436 -0.435 h -1.738 c -0.239 0 -0.435 0.195 -0.435 0.435 v 1.739 C 14.347 14.152 14.542 14.347 14.781 14.347 M 18.693 3.045 H 1.307 c -0.48 0 -0.869 0.39 -0.869 0.869 v 12.17 c 0 0.479 0.389 0.869 0.869 0.869 h 17.387 c 0.479 0 0.869 -0.39 0.869 -0.869 V 3.915 C 19.562 3.435 19.173 3.045 18.693 3.045 M 18.693 16.085 H 1.307 V 9.13 h 17.387 V 16.085 Z M 18.693 5.653 H 1.307 V 3.915 h 17.387 V 5.653 Z M 3.48 12.608 h 7.824 c 0.24 0 0.435 -0.195 0.435 -0.436 c 0 -0.239 -0.194 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.195 -0.435 0.435 C 3.045 12.413 3.24 12.608 3.48 12.608 M 3.48 14.347 h 6.085 c 0.24 0 0.435 -0.194 0.435 -0.435 s -0.195 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.194 -0.435 0.435 S 3.24 14.347 3.48 14.347";
  const path8 = "M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 c -0.245 -0.916 -1.186 -1.458 -2.101 -1.213 L 3.592 2.912 C 2.676 3.157 2.133 4.098 2.378 5.014 l 0.186 0.695 H 2.278 c -0.947 0 -1.716 0.768 -1.716 1.716 V 17.72 c 0 0.947 0.769 1.716 1.716 1.716 h 13.728 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 C 19.438 11.624 18.669 10.856 17.722 10.856 M 16.006 6.566 c 0.473 0 0.857 0.384 0.857 0.858 v 0.238 c -0.253 -0.146 -0.544 -0.238 -0.857 -0.238 h -0.157 l -0.229 -0.858 H 16.006 Z M 14.41 5.372 l 0.55 2.053 H 6.67 L 14.41 5.372 Z M 3.814 3.741 l 8.657 -2.29 c 0.458 -0.123 0.928 0.149 1.051 0.607 l 0.222 0.828 L 3.43 5.621 l -0.223 -0.83 C 3.084 4.333 3.356 3.863 3.814 3.741 M 1.42 7.424 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 0.517 l 0.229 0.858 H 2.278 c -0.314 0 -0.605 0.091 -0.858 0.238 V 7.424 Z M 16.863 17.72 c 0 0.474 -0.385 0.858 -0.857 0.858 H 2.278 c -0.474 0 -0.858 -0.385 -0.858 -0.858 V 9.141 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 13.728 c 0.473 0 0.857 0.384 0.857 0.858 v 1.715 h -1.716 c -0.947 0 -1.716 0.768 -1.716 1.716 v 1.716 c 0 0.947 0.769 1.716 1.716 1.716 h 1.716 V 17.72 Z M 18.58 14.288 c 0 0.474 -0.385 0.857 -0.858 0.857 h -2.574 c -0.474 0 -0.857 -0.384 -0.857 -0.857 v -1.716 c 0 -0.474 0.384 -0.858 0.857 -0.858 h 2.574 c 0.474 0 0.858 0.385 0.858 0.858 V 14.288 Z M 9.571 16.861 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.236 0 0.429 -0.191 0.429 -0.429 S 9.808 16.861 9.571 16.861 M 12.145 16.861 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.43 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.191 0.43 -0.429 S 12.382 16.861 12.145 16.861 M 9.571 9.141 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 C 9.808 9.998 10 9.806 10 9.569 S 9.808 9.141 9.571 9.141";
  const path9 = "M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 -3 -4";
  const path10 = "M 16.853 8.355 V 5.888 c 0 -3.015 -2.467 -5.482 -5.482 -5.482 H 8.629 c -3.015 0 -5.482 2.467 -5.482 5.482 v 2.467 l -2.741 7.127 c 0 1.371 4.295 4.112 9.594 4.112 s 9.594 -2.741 9.594 -4.112 L 16.853 8.355 Z M 5.888 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 6.402 17.137 6.173 17.367 5.888 17.367 Z M 5.203 10 c 0 -0.377 0.19 -0.928 0.423 -1.225 c 0 0 0.651 -0.831 1.976 -0.831 c 0.672 0 1.141 0.309 1.141 0.309 C 9.057 8.46 9.315 8.938 9.315 9.315 v 1.028 c 0 0.188 -0.308 0.343 -0.685 0.343 H 5.888 C 5.511 10.685 5.203 10.377 5.203 10 Z M 7.944 16.853 H 7.259 v -1.371 l 0.685 -0.685 V 16.853 Z M 9.657 16.853 H 8.629 v -2.741 h 1.028 V 16.853 Z M 8.972 13.426 v -1.028 c 0 -0.568 0.46 -1.028 1.028 -1.028 c 0.568 0 1.028 0.46 1.028 1.028 v 1.028 H 8.972 Z M 11.371 16.853 h -1.028 v -2.741 h 1.028 V 16.853 Z M 12.741 16.853 h -0.685 v -2.056 l 0.685 0.685 V 16.853 Z M 14.112 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 14.626 17.137 14.396 17.367 14.112 17.367 Z M 14.112 10.685 h -2.741 c -0.377 0 -0.685 -0.154 -0.685 -0.343 V 9.315 c 0 -0.377 0.258 -0.855 0.572 -1.062 c 0 0 0.469 -0.309 1.141 -0.309 c 1.325 0 1.976 0.831 1.976 0.831 c 0.232 0.297 0.423 0.848 0.423 1.225 S 14.489 10.685 14.112 10.685 Z M 18.347 15.801 c -0.041 0.016 -0.083 0.023 -0.124 0.023 c -0.137 0 -0.267 -0.083 -0.319 -0.218 l -2.492 -6.401 c -0.659 -1.647 -1.474 -2.289 -2.905 -2.289 c -0.95 0 -1.746 0.589 -1.754 0.595 c -0.422 0.317 -1.084 0.316 -1.507 0 C 9.239 7.505 8.435 6.916 7.492 6.916 c -1.431 0 -2.246 0.642 -2.906 2.292 l -2.491 6.398 c -0.069 0.176 -0.268 0.264 -0.443 0.195 c -0.176 -0.068 -0.264 -0.267 -0.195 -0.444 l 2.492 -6.401 c 0.765 -1.911 1.824 -2.726 3.543 -2.726 c 1.176 0 2.125 0.702 2.165 0.731 c 0.179 0.135 0.506 0.135 0.685 0 c 0.04 -0.029 0.99 -0.731 2.165 -0.731 c 1.719 0 2.779 0.814 3.542 2.723 l 2.493 6.404 C 18.611 15.534 18.524 15.733 18.347 15.801 Z";
  /** unused:  const path11 = "M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z"   **/ 
  const ex = new PathExecutor();
  const parser = new EVGPathParser();
  parser.parsePath(path1, ex);
  parser.parsePath(path2, ex);
  parser.parsePath(path3, ex);
  parser.parsePath(path4, ex);
  parser.parsePath(path5, ex);
  parser.parsePath(path6, ex);
  const coll = new PathCollector();
  parser.parsePath(path6, coll);
  console.log(coll.getString());
  const coll_2 = new PathCollector();
  parser.parsePath(path7, coll_2);
  console.log(coll_2.getString());
  console.log(" -----  ");
  const coll_3 = new PathCollector();
  parser.parsePath(path8, coll_3);
  console.log(coll_3.getString());
  console.log(" -----  ");
  const coll_4 = new PathCollector();
  parser.parsePath(path9, coll_4);
  console.log(coll_4.getString());
  console.log(" -----  ");
  const coll_5 = new PathCollector();
  parser.parsePath(path10, coll_5);
  console.log(coll_5.getString());
}
__js_main();
