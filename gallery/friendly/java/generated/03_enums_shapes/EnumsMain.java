import java.io.*;

public class EnumsMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final EnumsMain app = new EnumsMain();
    System.out.println(String.valueOf( "color " + app.colorName(1) ) );
    System.out.println(String.valueOf( app.describe((new Message_Ping())) ) );
    System.out.println(String.valueOf( app.describe((new Message_Text("hi"))) ) );
    System.out.println(String.valueOf( app.describe((new Message_Move(2, 3))) ) );
  }
  
  public String colorName( final Integer c ) {
    if ( c == 0 ) {
      return "red";
    }
    if ( c == 1 ) {
      return "green";
    }
    return "blue";
  }
  
  public String describe( final Object m ) {
    String out = "?";
    if( m instanceof Message_Ping) {
      Message_Ping __match0 = (Message_Ping) m;
      out = "ping";
    }
    if( m instanceof Message_Text) {
      Message_Text t = (Message_Text) m;
      out = "text:" + t.body;
    }
    if( m instanceof Message_Move) {
      Message_Move mv = (Message_Move) m;
      out = ("move:" + String.valueOf(mv.dx )) + ("," + String.valueOf(mv.dy ));
    }
    return out;
  }
}
