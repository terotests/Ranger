import java.io.*;

public class TraitsMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final TraitsMain app = new TraitsMain();
    final User u = new User();
    final Bot b = new Bot();
    System.out.println(String.valueOf( "user " + app.show(u) ) );
    System.out.println(String.valueOf( "bot " + app.show(b) ) );
    System.out.println(String.valueOf( "weight " + String.valueOf(u.weight() ) ) );
  }
  
  public String show( final Named n ) {
    return n.label();
  }
}
