#!/usr/bin/env node
class Point  {
  constructor() {
    this.x = 0;
    this.y = 0;     /* note: unused */
  }
}
class OptionalParams  {
  constructor() {
  }
  shown (maybe) {
    if ( typeof(maybe) === "undefined" ) {
      return "unknown";
    }
    return maybe;
  };
  shownInt (a) {
    if ( typeof(a) === "undefined" ) {
      return 0;
    }
    const r = a;
    return r;
  };
  shownPoint (p) {
    if ( typeof(p) === "undefined" ) {
      return 0;
    }
    const q = p;
    return q.x;
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const app = new OptionalParams();
  let hit;
  hit = "ada";
  console.log("name " + app.shown(hit));
  let miss;
  console.log("miss " + app.shown(miss));
  let n;
  n = 41;
  console.log("int " + (app.shownInt(n).toString()));
  let p;
  const pt = new Point();
  pt.x = 7;
  p = pt;
  console.log("point " + (app.shownPoint(p).toString()));
}
__js_main();
