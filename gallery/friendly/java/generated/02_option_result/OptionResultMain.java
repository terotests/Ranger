import java.util.*;
import java.io.*;

public class OptionResultMain { 
  
  public static void main(String [] args ) {
    final Lookup box = new Lookup();
    final ArrayList<String> names = new ArrayList<String>(Arrays.asList( new String[] {"ada", "grace"}));
    final String hit = box.findName(names, "ada");
    System.out.println(String.valueOf( "found " + ((hit != null ) ? hit : "unknown") ) );
    final String miss = box.findName(names, "alan");
    System.out.println(String.valueOf( "miss " + ((miss != null ) ? miss : "unknown") ) );
    if ( miss == null ) {
      System.out.println(String.valueOf( "miss is empty" ) );
    }
    System.out.println(String.valueOf( box.describe(box.parseInt("42")) ) );
    System.out.println(String.valueOf( box.describe(box.parseInt("")) ) );
    System.out.println(String.valueOf( box.describe(box.parseInt("nope")) ) );
  }
}
