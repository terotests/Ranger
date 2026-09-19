#!/usr/bin/env node
class Point  {
  constructor(x, y) {
    this.x = 0;
    this.y = 0;
    this.x = x;
    this.y = y;
  }
}
class PointOps  {
  constructor() {
  }
  manhattan (p) {
    let ax = p.x;
    if ( ax < 0 ) {
      ax = 0 - ax;
    }
    let ay = p.y;
    if ( ay < 0 ) {
      ay = 0 - ay;
    }
    return ax + ay;
  };
  addPoints (a, b) {
    return new Point(a.x + b.x, a.y + b.y);
  };
}
class Counter  {
  constructor() {
    this.value = 0;
  }
  reading () {
    return this.value;
  };
  add (amount) {
    this.value = this.value + amount;
  };
}
class TreeNode  {
  constructor() {
    this.name = "";
    this.kids = [];
    this.parent = undefined;
  }
  adopt (c) {
    c.parent = this;
    this.kids.push(c);
  };
  childCount () {
    return this.kids.length;
  };
}
class OwnershipMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const ops = new PointOps();
  const origin = new Point(3, 4);
  console.log("manhattan " + (ops.manhattan(origin).toString()));
  const summed = ops.addPoints(origin, origin);
  console.log("sum.x " + (summed.x.toString()));
  const left = new Counter();
  const alias = left;
  alias.add(1);
  console.log("shared " + (left.reading().toString()));
  const root = new TreeNode();
  root.name = "root";
  const leaf = new TreeNode();
  leaf.name = "leaf";
  root.adopt(leaf);
  console.log("kids " + (root.childCount().toString()));
  if ( typeof(leaf.parent) === "undefined" ) {
    console.log("parent missing");
  } else {
    const back = leaf.parent;
    console.log("parent " + back.name);
  }
}
__js_main();
