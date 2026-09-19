#!/usr/bin/env node
class TextTools  {
  constructor() {
  }
  greet (name) {
    return "hello " + name;
  };
  total (xs) {
    let acc = 0;
    for ( const v of xs) {
      acc = acc + v;
    }
    return acc;
  };
  firstChar (s) {
    if ( s.length == 0 ) {
      return "";
    }
    return s.substring(0, 1 );
  };
  twice (xs) {
    return this.total(xs) + this.total(xs);
  };
}
class SliceMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const t = new TextTools();
  console.log(t.greet("ada"));
  const xs = [1, 2, 3];
  console.log("twice " + (t.twice(xs).toString()));
  console.log("first " + t.firstChar("grace"));
}
__js_main();
