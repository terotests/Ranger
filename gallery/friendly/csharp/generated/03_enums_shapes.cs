using System;

public enum Color : int {
  Red = 0,
  Green = 1,
  Blue = 2,
}

public interface union_Message { }
class Message_Ping  : union_Message {
}
class Message_Text  : union_Message {
  public String body = "";
  public Message_Text( String body  ) {
    this.body = body;
  }
}
class Message_Move  : union_Message {
  public int dx = 0;
  public int dy = 0;
  public Message_Move( int dx , int dy  ) {
    this.dx = dx;
    this.dy = dy;
  }
}
class Message__ops  {
  public static bool equals( union_Message a , union_Message b ) {
    if( a is Message_Ping ) {
      Message_Ping __ea0 = (Message_Ping)a;
      if( b is Message_Ping ) {
        Message_Ping __eb0 = (Message_Ping)b;
        return true;
      }
      return false;
    }
    if( a is Message_Text ) {
      Message_Text __ea1 = (Message_Text)a;
      if( b is Message_Text ) {
        Message_Text __eb1 = (Message_Text)b;
        if ( __ea1.body != __eb1.body ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is Message_Move ) {
      Message_Move __ea2 = (Message_Move)a;
      if( b is Message_Move ) {
        Message_Move __eb2 = (Message_Move)b;
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
  public static bool notEquals( union_Message a , union_Message b ) {
    if ( Message__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
class EnumsMain  {
  static void Main( string [] args ) {
    EnumsMain app = new EnumsMain();
    Console.WriteLine("color " + app.colorName(Color.Green));
    Console.WriteLine(app.describe(new Message_Ping()));
    Console.WriteLine(app.describe(new Message_Text("hi")));
    Console.WriteLine(app.describe(new Message_Move(2, 3)));
  }
  public String colorName( Color c ) {
    if ( c == Color.Red ) {
      return "red";
    }
    if ( c == Color.Green ) {
      return "green";
    }
    return "blue";
  }
  public String describe( union_Message m ) {
    String _out = "?";
    if( m is Message_Ping ) {
      Message_Ping __match0 = (Message_Ping)m;
      _out = "ping";
    }
    if( m is Message_Text ) {
      Message_Text t = (Message_Text)m;
      _out = "text:" + t.body;
    }
    if( m is Message_Move ) {
      Message_Move mv = (Message_Move)m;
      _out = ("move:" + mv.dx.ToString()) + ("," + mv.dy.ToString());
    }
    return _out;
  }
}
