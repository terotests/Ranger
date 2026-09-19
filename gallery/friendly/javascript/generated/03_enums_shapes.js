#!/usr/bin/env node
class Message_Ping  {
  constructor() {
    this.__rg_kind = "Message_Ping";
  }
}
class Message_Text  {
  constructor(body) {
    this.__rg_kind = "Message_Text";
    this.body = "";
    this.body = body;
  }
}
class Message_Move  {
  constructor(dx, dy) {
    this.__rg_kind = "Message_Move";
    this.dx = 0;
    this.dy = 0;
    this.dx = dx;
    this.dy = dy;
  }
}
class Message__ops  {
  constructor() {
  }
}
Message__ops.equals = function(a, b) {
  if( a != null && a.__rg_kind === "Message_Ping" ) /* union case */ {
    var __ea0 = a;
    if( b != null && b.__rg_kind === "Message_Ping" ) /* union case */ {
      var __eb0 = b;
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "Message_Text" ) /* union case */ {
    var __ea1 = a;
    if( b != null && b.__rg_kind === "Message_Text" ) /* union case */ {
      var __eb1 = b;
      if ( __ea1.body != __eb1.body ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "Message_Move" ) /* union case */ {
    var __ea2 = a;
    if( b != null && b.__rg_kind === "Message_Move" ) /* union case */ {
      var __eb2 = b;
      if ( __ea2.dx != __eb2.dx ) {
        return false;
      }
      if ( __ea2.dy != __eb2.dy ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
};
Message__ops.notEquals = function(a, b) {
  if ( Message__ops.equals(a, b) ) {
    return false;
  }
  return true;
};
class EnumsMain  {
  constructor() {
  }
  colorName (c) {
    if ( c == 0 ) {
      return "red";
    }
    if ( c == 1 ) {
      return "green";
    }
    return "blue";
  };
  describe (m) {
    let out = "?";
    if( m != null && m.__rg_kind === "Message_Ping" ) /* union case */ {
      var __match0 = m;
      out = "ping";
    };
    if( m != null && m.__rg_kind === "Message_Text" ) /* union case */ {
      var t = m;
      out = "text:" + t.body;
    };
    if( m != null && m.__rg_kind === "Message_Move" ) /* union case */ {
      var mv = m;
      out = ("move:" + (mv.dx.toString())) + ("," + (mv.dy.toString()));
    };
    return out;
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const app = new EnumsMain();
  console.log("color " + app.colorName(1));
  console.log(app.describe((new Message_Ping())));
  console.log(app.describe((new Message_Text("hi"))));
  console.log(app.describe((new Message_Move(2, 3))));
}
__js_main();
