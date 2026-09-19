#!/usr/bin/env node
class ParseOutcome_Ok  {
  constructor(value) {
    this.__rg_kind = "ParseOutcome_Ok";
    this.value = 0;
    this.value = value;
  }
}
class ParseOutcome_Err  {
  constructor(message) {
    this.__rg_kind = "ParseOutcome_Err";
    this.message = "";
    this.message = message;
  }
}
class ParseOutcome__ops  {
  constructor() {
  }
}
ParseOutcome__ops.equals = function(a, b) {
  if( a != null && a.__rg_kind === "ParseOutcome_Ok" ) /* union case */ {
    var __ea0 = a;
    if( b != null && b.__rg_kind === "ParseOutcome_Ok" ) /* union case */ {
      var __eb0 = b;
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ParseOutcome_Err" ) /* union case */ {
    var __ea1 = a;
    if( b != null && b.__rg_kind === "ParseOutcome_Err" ) /* union case */ {
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
ParseOutcome__ops.notEquals = function(a, b) {
  if ( ParseOutcome__ops.equals(a, b) ) {
    return false;
  }
  return true;
};
class Lookup  {
  constructor() {
  }
  findName (names, key) {
    let found;
    for ( const n of names) {
      if ( n == key ) {
        found = n;
        return found;
      }
    }
    return found;
  };
  parseInt (text) {
    if ( text == "" ) {
      return new ParseOutcome_Err("empty");
    }
    const parsed = isNaN( parseInt(text) ) ? undefined : parseInt(text);
    if ( typeof(parsed) === "undefined" ) {
      return new ParseOutcome_Err("not a number");
    }
    return new ParseOutcome_Ok(parsed);
  };
  describe (r) {
    let out = "?";
    if( r != null && r.__rg_kind === "ParseOutcome_Ok" ) /* union case */ {
      var o = r;
      out = "ok:" + (o.value.toString());
    };
    if( r != null && r.__rg_kind === "ParseOutcome_Err" ) /* union case */ {
      var e = r;
      out = "err:" + e.message;
    };
    return out;
  };
}
class OptionResultMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const box = new Lookup();
  const names = ["ada", "grace"];
  const hit = box.findName(names, "ada");
  console.log("found " + (((typeof(hit) !== "undefined" && hit != null ) ) ? hit : "unknown"));
  const miss = box.findName(names, "alan");
  console.log("miss " + (((typeof(miss) !== "undefined" && miss != null ) ) ? miss : "unknown"));
  if ( typeof(miss) === "undefined" ) {
    console.log("miss is empty");
  }
  console.log(box.describe(box.parseInt("42")));
  console.log(box.describe(box.parseInt("")));
  console.log(box.describe(box.parseInt("nope")));
}
__js_main();
