import java.io.*;

public class TraitsMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final TraitsMain app = new TraitsMain();
    final User u = new User();
    u.name = "ada";
    u.age = 36;
    System.out.println(String.valueOf( app.show(u) ) );
    final Bot b = new Bot();
    b.name = "r2";
    System.out.println(String.valueOf( b.asString() ) );
  }
  
  public String show( final User who ) {
    return ("label=" + who.label()) + (" text=" + who.asString());
  }
}
