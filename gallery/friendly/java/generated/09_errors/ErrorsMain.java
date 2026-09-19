import java.io.*;

public class ErrorsMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final Guard g = new Guard();
    System.out.println(String.valueOf( g.describe(g.check(3)) ) );
    System.out.println(String.valueOf( g.describe(g.check((0 - 1))) ) );
  }
}
