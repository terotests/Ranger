import java.io.*;

public class operatorsOfboolean_5 { 
  
  public static void assert_6( final Boolean condition , final String txt ) {
    if ( condition ) {
      System.out.println(String.valueOf( "ERROR " + txt ) );
    }
  }
}
