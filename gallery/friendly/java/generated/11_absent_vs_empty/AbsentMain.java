import java.io.*;

public class AbsentMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final AbsentMain app = new AbsentMain();
    String s = null;
    System.out.println(String.valueOf( app.report("unset", s) ) );
    s = "";
    System.out.println(String.valueOf( app.report("empty", s) ) );
    System.out.println(String.valueOf( "empty ?? " + ((s != null ) ? s : "FALLBACK") ) );
    s = "x";
    System.out.println(String.valueOf( app.report("set", s) ) );
    Integer n = null;
    if ( n == null ) {
      System.out.println(String.valueOf( "int unset: absent" ) );
    } else {
      System.out.println(String.valueOf( "int unset: present" ) );
    }
    n = 0;
    if ( n == null ) {
      System.out.println(String.valueOf( "int zero: absent" ) );
    } else {
      System.out.println(String.valueOf( "int zero: present" ) );
    }
    System.out.println(String.valueOf( "int zero ?? " + String.valueOf((n != null ) ? n : 99 ) ) );
  }
  
  public String report( final String label , final String s ) {
    if ( s == null ) {
      return label + ": absent";
    }
    return ((label + ": present [") + s) + "]";
  }
}
