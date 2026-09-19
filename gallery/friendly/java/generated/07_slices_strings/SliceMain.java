import java.io.*;
import java.util.*;

public class SliceMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final TextTools t = new TextTools();
    System.out.println(String.valueOf( t.greet("ada") ) );
    final ArrayList<Integer> xs = new ArrayList<Integer>(Arrays.asList( new Integer[] {1, 2, 3}));
    System.out.println(String.valueOf( "twice " + String.valueOf(t.twice(xs) ) ) );
    System.out.println(String.valueOf( "first " + t.firstChar("grace") ) );
  }
}
