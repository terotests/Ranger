#!/usr/bin/env node
class Acc  {
  constructor() {
    this.items = [];
  }
  add (n) {
    this.items.push(n);
    return this;
  };
  get () {
    let s = 0;
    for ( let idx = 0; idx < this.items.length; idx++) {
      var v = this.items[idx];
      s = s + v;
    };
    return s;
  };
}
class ChainFluentBuilder  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const n = ((((new Acc()).add(1)).add(2)).add(3)).get();
  console.log((n.toString()));
}
__js_main();
