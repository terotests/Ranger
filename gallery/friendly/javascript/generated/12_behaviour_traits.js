#!/usr/bin/env node
class User  {
  constructor() {
    this.uname = "";     /* note: unused */
  }
  label () {
    return "anon";
  };
  weight () {
    return 1;
  };
}
class Bot  {
  constructor() {
    this.id = 0;     /* note: unused */
  }
  label () {
    return "anon";
  };
}
class TraitsMain  {
  constructor() {
  }
  show (n) {
    return n.label();
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const app = new TraitsMain();
  const u = new User();
  const b = new Bot();
  console.log("user " + app.show(u));
  console.log("bot " + app.show(b));
  console.log("weight " + (u.weight().toString()));
}
__js_main();
