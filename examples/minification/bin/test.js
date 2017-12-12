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
class tester  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const m1 = new Mat2();
  const m2 = new Mat2();
  m1.setRotation(1.2 * (Math.PI));
  m2.setRotation(0.4 * (Math.PI));
  m1.multiply(m2);
}
__js_main();
