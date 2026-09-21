#!/usr/bin/env node
class Guarded_Ok  {
  constructor(value) {
    this.__rg_kind = "Guarded_Ok";
    this.value = 0;
    this.value = value;
  }
}
class Guarded_Err  {
  constructor(message) {
    this.__rg_kind = "Guarded_Err";
    this.message = "";
    this.message = message;
  }
}
class Guarded__ops  {
  constructor() {
  }
}
Guarded__ops.equals = function(a, b) {
  if( a != null && a.__rg_kind === "Guarded_Ok" ) /* union case */ {
    var __ea0 = a;
    if( b != null && b.__rg_kind === "Guarded_Ok" ) /* union case */ {
      var __eb0 = b;
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "Guarded_Err" ) /* union case */ {
    var __ea1 = a;
    if( b != null && b.__rg_kind === "Guarded_Err" ) /* union case */ {
      var __eb1 = b;
      if ( __ea1.message != __eb1.message ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
};
Guarded__ops.notEquals = function(a, b) {
  if ( Guarded__ops.equals(a, b) ) {
    return false;
  }
  return true;
};
class Guard  {
  constructor() {
  }
  check (value) {
    if ( value < 0 ) {
      return new Guarded_Err("negative");
    }
    return new Guarded_Ok(value);
  };
  describe (g) {
    let out = "?";
    if( g != null && g.__rg_kind === "Guarded_Ok" ) /* union case */ {
      var o = g;
      out = "ok:" + (o.value.toString());
    };
    if( g != null && g.__rg_kind === "Guarded_Err" ) /* union case */ {
      var e = g;
      out = "err:" + e.message;
    };
    return out;
  };
}
class ErrorsMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const g = new Guard();
  console.log(g.describe(g.check(3)));
  console.log(g.describe(g.check(0 - 1)));
}
__js_main();
