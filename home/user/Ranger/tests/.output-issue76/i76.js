#!/usr/bin/env node
class Inner  {
  constructor() {
    this.tag = "unset";
  }
}
class Item  {
  constructor() {
    this.name = "unset";
    this.n = 0;
    this.inner = new Inner();
  }
  self () {
    return this;
  };
}
class Box  {
  constructor() {
    this.items = [];
  }
  add () {
    const it = new Item();
    this.items.push(it);
  };
  at (idx) {
    return this.items[idx];
  };
  first () {
    return this.items[0];
  };
}
class Main  {
  constructor() {
  }
}
Main.say = function(b) {
  const z = b.at(0);
  const o = b.at(1);
  console.log((((z.name + "|") + (z.n.toString())) + "|") + z.inner.tag);
  console.log((((o.name + "|") + (o.n.toString())) + "|") + o.inner.tag);
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const b = new Box();
  b.add();
  b.add();
  const __rgr_recv_1 = b.at(0);
  __rgr_recv_1.name = "zero";
  const __rgr_recv_2 = b.at(1);
  __rgr_recv_2.name = "one";
  const __rgr_recv_3 = b.first();
  __rgr_recv_3.n = 42;
  const __rgr_recv_4 = b.at(1).self();
  __rgr_recv_4.n = 7;
  const __rgr_recv_5 = b.at(0);
  __rgr_recv_5.inner.tag = "deep";
  Main.say(b);
  let k = 0;
  while (k < 2) {
    const __rgr_recv_6 = b.at(k);
    __rgr_recv_6.n = k + 100;
    const __rgr_recv_7 = b.at(k);
    __rgr_recv_7.inner.tag = "in-loop-" + (k.toString());
    k = k + 1;
  };
  Main.say(b);
  const __rgr_recv_8 = b.at(0);
  __rgr_recv_8.name = "paren";
  const __rgr_recv_9 = b.at(1);
  __rgr_recv_9.inner.tag = "paren-deep";
  const __rgr_recv_10 = b.at(0);
  __rgr_recv_10.n = 5;
  Main.say(b);
  const r = b.at(0).name;
  console.log("read|" + r);
  if ( b.at(1).name == "one" ) {
    console.log("cmp|ok");
  }
}
__js_main();
