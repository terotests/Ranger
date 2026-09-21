
enum class Color {
  Red,
  Green,
  Blue,
}

sealed interface union_Message

class Message_Ping : union_Message 
 {
}

class Message_Text( body : String ) : union_Message 
 {
  @JvmField var body : String  = "";
  
  init {
    this.body = body;
  }
}

class Message_Move( dx : Int, dy : Int ) : union_Message 
 {
  @JvmField var dx : Int  = 0;
  @JvmField var dy : Int  = 0;
  
  init {
    this.dx = dx;
    this.dy = dy;
  }
}

class Message__ops 
 {
  companion object {
    
    fun  equals( a : union_Message, b : union_Message) : Boolean {
      if( a is Message_Ping ) /* union case */ {
        val __ea0 : Message_Ping = a as Message_Ping;
        if( b is Message_Ping ) /* union case */ {
          val __eb0 : Message_Ping = b as Message_Ping;
          return true;
        }
        return false;
      }
      if( a is Message_Text ) /* union case */ {
        val __ea1 : Message_Text = a as Message_Text;
        if( b is Message_Text ) /* union case */ {
          val __eb1 : Message_Text = b as Message_Text;
          if ( __ea1.body != __eb1.body ) {
            return false;
          }
          return true;
        }
        return false;
      }
      if( a is Message_Move ) /* union case */ {
        val __ea2 : Message_Move = a as Message_Move;
        if( b is Message_Move ) /* union case */ {
          val __eb2 : Message_Move = b as Message_Move;
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
    
    fun  notEquals( a : union_Message, b : union_Message) : Boolean {
      if ( Message__ops.equals(a, b) ) {
        return false;
      }
      return true;
    }
  }
}



class EnumsMain 
 {
  
  
  fun  colorName( c : Color) : String {
    if ( c == Color.Red ) {
      return "red";
    }
    if ( c == Color.Green ) {
      return "green";
    }
    return "blue";
  }
  
  fun  describe( m : union_Message) : String {
    var out : String  = "?";
    if( m is Message_Ping ) /* union case */ {
      val __match0 : Message_Ping = m as Message_Ping;
      out = "ping";
    }
    if( m is Message_Text ) /* union case */ {
      val t : Message_Text = m as Message_Text;
      out = "text:" + t.body;
    }
    if( m is Message_Move ) /* union case */ {
      val mv : Message_Move = m as Message_Move;
      out = ("move:" + (mv.dx.toString())) + ("," + (mv.dy.toString()));
    }
    return out;
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val app : EnumsMain  =  EnumsMain();
  println( "color " + app.colorName(Color.Green) )
  println( app.describe( Message_Ping()) )
  println( app.describe( Message_Text("hi")) )
  println( app.describe( Message_Move(2, 3)) )
}
