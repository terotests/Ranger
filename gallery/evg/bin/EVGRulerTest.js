#!/usr/bin/env node
class EVGRuler  {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 22;
    this.pageX = 0;
    this.pageW = 0;
    this.marginL = 0;
    this.marginR = 0;
    this.indentFirst = 0;
    this.indentLeft = 0;
    this.indentRight = 0;
    this.pxPerUnit = 96.0;
    this.ticksPerUnit = 8;
  }
  textLeftX () {
    return (this.pageX + this.marginL) + this.indentLeft;
  };
  textRightX () {
    return ((this.pageX + this.pageW) - this.marginR) - this.indentRight;
  };
  firstLineX () {
    return ((this.pageX + this.marginL) + this.indentLeft) + this.indentFirst;
  };
  marginLeftX () {
    return this.pageX + this.marginL;
  };
  marginRightX () {
    return (this.pageX + this.pageW) - this.marginR;
  };
  tickCount () {
    if ( this.pxPerUnit <= 0.0 ) {
      return 0;
    }
    const per = this.pxPerUnit / (this.ticksPerUnit);
    if ( per <= 0.0 ) {
      return 0;
    }
    return (Math.floor( ((this.pageW) / per))) + 1;
  };
  tickX (i) {
    const per = this.pxPerUnit / (this.ticksPerUnit);
    return this.pageX + (Math.floor( ((i) * per)));
  };
  tickIsUnit (i) {
    if ( this.ticksPerUnit <= 0 ) {
      return false;
    }
    return (i % this.ticksPerUnit) == 0;
  };
  tickIsHalf (i) {
    if ( this.ticksPerUnit <= 0 ) {
      return false;
    }
    const half = ((this.ticksPerUnit / 2) | 0);
    if ( half <= 0 ) {
      return false;
    }
    return (i % half) == 0;
  };
  tickLabel (i) {
    if ( this.ticksPerUnit <= 0 ) {
      return 0;
    }
    return ((i / this.ticksPerUnit) | 0);
  };
  markerX (which) {
    if ( which == 0 ) {
      return this.firstLineX();
    }
    if ( which == 1 ) {
      return this.textLeftX();
    }
    return this.textRightX();
  };
  hitMarker (px, py) {
    if ( py < this.y ) {
      return -1;
    }
    if ( py >= (this.y + this.h) ) {
      return -1;
    }
    const half = ((this.h / 2) | 0);
    const top = py < (this.y + half);
    if ( top ) {
      if ( this.nearX(px, this.firstLineX()) ) {
        return 0;
      }
    } else {
      if ( this.nearX(px, this.textLeftX()) ) {
        return 1;
      }
    }
    if ( this.nearX(px, this.textRightX()) ) {
      return 2;
    }
    return -1;
  };
  nearX (px, at) {
    let d = px - at;
    if ( d < 0 ) {
      d = 0 - d;
    }
    return d <= 6;
  };
  indentFor (which, px) {
    const colL = this.pageX + this.marginL;
    const colR = (this.pageX + this.pageW) - this.marginR;
    const span = colR - colL;
    if ( span < 1 ) {
      return 0;
    }
    if ( which == 2 ) {
      let r = colR - px;
      if ( r < 0 ) {
        r = 0;
      }
      if ( r > (span - 1) ) {
        r = span - 1;
      }
      return r;
    }
    let v = px - colL;
    if ( which == 1 ) {
      if ( v < 0 ) {
        v = 0;
      }
      if ( v > (span - 1) ) {
        v = span - 1;
      }
      return v;
    }
    let f = (px - colL) - this.indentLeft;
    const lo = 0 - (this.indentLeft + 1);
    if ( f < lo ) {
      f = lo;
    }
    if ( f > (span - 1) ) {
      f = span - 1;
    }
    return f;
  };
}
EVGRuler.markerFirst = function() {
  return 0;
};
EVGRuler.markerLeft = function() {
  return 1;
};
EVGRuler.markerRight = function() {
  return 2;
};
class RulerCheck  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  ok (name, cond) {
    if ( cond ) {
      this.passed = this.passed + 1;
      console.log("  PASS  " + name);
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL  " + name);
    }
  };
  eqInt (name, got, want) {
    this.ok((((name + " (got ") + ((got.toString()))) + " want ") + (((want.toString())) + ")"), got == want);
  };
}
class EVGRulerTest  {
  constructor() {
    this.c = new RulerCheck();
  }
  run () {
    console.log("=== EVGRulerTest ===");
    this.testColumn();
    this.testTicks();
    this.testIndents();
    this.testHit();
    this.testDrag();
    console.log("");
    console.log(("passed = " + ((this.c.passed.toString()))) + ("  failed = " + ((this.c.failed.toString()))));
    if ( this.c.failed == 0 ) {
      console.log("ALL PASS");
    } else {
      console.log("SOME FAILED");
    }
  };
  testColumn () {
    console.log("--- where the paper and the text are ---");
    const r = EVGRulerTest.page();
    this.c.eqInt("the text column starts an inch into the paper", r.marginLeftX(), 196);
    this.c.eqInt("and ends an inch before its right edge", r.marginRightX(), 820);
    this.c.eqInt("with no indents the text starts at the margin", r.textLeftX(), 196);
    this.c.eqInt("and ends at the other one", r.textRightX(), 820);
  };
  testTicks () {
    console.log("--- the marks ---");
    const r = EVGRulerTest.page();
    this.c.eqInt("the first tick is at the left edge of the paper", r.tickX(0), 100);
    this.c.eqInt("the eighth is one inch along", r.tickX(8), 196);
    this.c.ok("and it is a whole unit", r.tickIsUnit(8));
    this.c.eqInt("numbered 1", r.tickLabel(8), 1);
    this.c.ok("a half is a half and not a unit", r.tickIsHalf(4) && (r.tickIsUnit(4) == false));
    this.c.ok("an eighth is neither", (r.tickIsHalf(3) == false) && (r.tickIsUnit(3) == false));
    this.c.ok("the marks cover the paper", r.tickCount() >= 68);
  };
  testIndents () {
    console.log("--- and the paragraph's own indents ---");
    const r = EVGRulerTest.page();
    r.indentLeft = 48;
    r.indentRight = 24;
    this.c.eqInt("a left indent moves the text in", r.textLeftX(), 244);
    this.c.eqInt("a right indent brings the other end in", r.textRightX(), 796);
    this.c.eqInt("and the first line follows the left one", r.firstLineX(), 244);
    r.indentFirst = -24;
    this.c.eqInt("a hanging first line starts left of the paragraph", r.firstLineX(), 220);
    this.c.ok("which is left of the body", r.firstLineX() < r.textLeftX());
  };
  testHit () {
    console.log("--- which marker the pointer is on ---");
    const r = EVGRulerTest.page();
    this.c.eqInt("the top half of the band is the first line", r.hitMarker(196, (r.y + 3)), EVGRuler.markerFirst());
    this.c.eqInt("the bottom half is the left indent", r.hitMarker(196, ((r.y + r.h) - 3)), EVGRuler.markerLeft());
    this.c.eqInt("the right indent is at the other end", r.hitMarker(820, ((r.y + r.h) - 3)), EVGRuler.markerRight());
    this.c.eqInt("the middle of the ruler is no marker", r.hitMarker(500, (r.y + 8)), -1);
    this.c.eqInt("and neither is a point above the band", r.hitMarker(196, (r.y - 4)), -1);
    this.c.eqInt("a near miss still finds it", r.hitMarker(200, (r.y + 3)), EVGRuler.markerFirst());
  };
  testDrag () {
    console.log("--- and where dragging one puts it ---");
    const r = EVGRulerTest.page();
    this.c.eqInt("dragging the left indent an inch in", r.indentFor(1, 292), 96);
    this.c.eqInt("dragging the right indent an inch in", r.indentFor(2, 724), 96);
    this.c.eqInt("dragged off the left edge it stops at the margin", r.indentFor(1, 0), 0);
    this.c.eqInt("dragged off the right edge it stops too", r.indentFor(2, 5000), 0);
    const colR = r.marginRightX();
    const colL = r.marginLeftX();
    this.c.ok("and cannot be dragged past the far side", r.indentFor(1, 5000) < (colR - colL));
    r.indentLeft = 48;
    this.c.eqInt("the first line can be dragged left of the paragraph", r.indentFor(0, 220), -24);
    this.c.ok("but not off the paper", r.indentFor(0, 0) >= (0 - 49));
  };
}
EVGRulerTest.page = function() {
  const r = new EVGRuler();
  r.x = 0;
  r.y = 40;
  r.w = 1000;
  r.h = 22;
  r.pageX = 100;
  r.pageW = 816;
  r.marginL = 96;
  r.marginR = 96;
  r.pxPerUnit = 96.0;
  return r;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const t = new EVGRulerTest();
  t.run();
}
__js_main();
