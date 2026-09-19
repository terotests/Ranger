#!/usr/bin/env node
class Stats  {
  constructor() {
  }
  total (xs) {
    let acc = 0;
    for ( let i = 0; i < xs.length; i++) {
      var v = xs[i];
      acc = acc + v;
    };
    return acc;
  };
  evenCount (xs) {
    let n = 0;
    for ( let i = 0; i < xs.length; i++) {
      var v = xs[i];
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    };
    return n;
  };
  doubled (xs) {
    let out = [];
    for ( let i = 0; i < xs.length; i++) {
      var v = xs[i];
      out.push(v * 2);
    };
    return out;
  };
  applyEach (xs, f) {
    let out = [];
    for ( let i = 0; i < xs.length; i++) {
      var v = xs[i];
      const next = f(v);
      out.push(next);
    };
    return out;
  };
}
class IterMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const s = new Stats();
  const xs = [1, 2, 3, 4];
  console.log("sum " + (s.total(xs).toString()));
  console.log("evens " + (s.evenCount(xs).toString()));
  const twice = s.doubled(xs);
  console.log("doubled0 " + (twice[0].toString()));
  const addOne = ((p) => { 
    return p + 1;
  });
  const bumped = s.applyEach(xs, addOne);
  console.log("bumped0 " + (bumped[0].toString()));
}
__js_main();
