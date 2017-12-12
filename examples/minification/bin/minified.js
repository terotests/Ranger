class Mat2  {
  constructor() {
    this.m0 = 1.0;
    this.m1 = 0.0;
    this.m2 = 0.0;
    this.m3 = 1.0;
    this.m4 = 0.0;
    this.m5 = 0.0;
  }
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
