#!/usr/bin/env node
class User  {
  constructor() {
    this.age = 0;
    this.name = "";
  }
  asString () {
    return (this.name + " ") + (this.age.toString());
  };
  label () {
    return this.name;
  };
}
class Bot  {
  constructor() {
    this.name = "";
  }
  asString () {
    return "bot:" + this.name;
  };
  label () {
    return this.name;
  };
}
class TraitsMain  {
  constructor() {
  }
  show (who) {
    return ("label=" + who.label()) + (" text=" + who.asString());
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const app = new TraitsMain();
  const u = new User();
  u.name = "ada";
  u.age = 36;
  console.log(app.show(u));
  const b = new Bot();
  b.name = "r2";
  console.log(b.asString());
}
__js_main();
