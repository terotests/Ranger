
abstract class union_Message {}

class Message_Ping implements union_Message {
}

class Message_Text implements union_Message {
  String body = "";
  
  Message_Text(String body) {
    this.body = body;
  }
}

class Message_Move implements union_Message {
  int dx = 0;
  int dy = 0;
  
  Message_Move(int dx, int dy) {
    this.dx = dx;
    this.dy = dy;
  }
}

class Message__ops {
  
  static bool equals(union_Message a, union_Message b) {
    if( a is Message_Ping ) /* union case */ {
      Message_Ping __ea0 = a as Message_Ping;
      if( b is Message_Ping ) /* union case */ {
        Message_Ping __eb0 = b as Message_Ping;
        return true;
      }
      return false;
    }
    if( a is Message_Text ) /* union case */ {
      Message_Text __ea1 = a as Message_Text;
      if( b is Message_Text ) /* union case */ {
        Message_Text __eb1 = b as Message_Text;
        if ( __ea1.body != __eb1.body ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is Message_Move ) /* union case */ {
      Message_Move __ea2 = a as Message_Move;
      if( b is Message_Move ) /* union case */ {
        Message_Move __eb2 = b as Message_Move;
        if ( __ea2.dx != __eb2.dx ) {
          return false;
        }
        if ( __ea2.dy != __eb2.dy ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  
  static bool notEquals(union_Message a, union_Message b) {
    if ( Message__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}

class EnumsMain {
  
  String colorName(int c) {
    if ( c == 0 ) {
      return "red";
    }
    if ( c == 1 ) {
      return "green";
    }
    return "blue";
  }
  
  String describe(union_Message m) {
    String out = "?";
    if( m is Message_Ping ) /* union case */ {
      Message_Ping __match0 = m as Message_Ping;
      out = "ping";
    }
    if( m is Message_Text ) /* union case */ {
      Message_Text t = m as Message_Text;
      out = "text:" + t.body;
    }
    if( m is Message_Move ) /* union case */ {
      Message_Move mv = m as Message_Move;
      out = ("move:" + (mv.dx.toString())) + ("," + (mv.dy.toString()));
    }
    return out;
  }
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  EnumsMain app =  EnumsMain();
  print( "color " + app.colorName(1) );
  print( app.describe(( Message_Ping())) );
  print( app.describe(( Message_Text("hi"))) );
  print( app.describe(( Message_Move(2, 3))) );
}
