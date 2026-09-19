import java.util.*;
import java.io.*;

public class IterMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final Stats s = new Stats();
    final ArrayList<Integer> xs = new ArrayList<Integer>(Arrays.asList( new Integer[] {1, 2, 3, 4}));
    System.out.println(String.valueOf( "sum " + String.valueOf(s.total(xs) ) ) );
    System.out.println(String.valueOf( "evens " + String.valueOf(s.evenCount(xs) ) ) );
    final ArrayList<Integer> twice = s.doubled(xs);
    System.out.println(String.valueOf( "doubled0 " + String.valueOf(twice.get(0) ) ) );
    final LambdaSignature1 addOne = new LambdaSignature1() { 
      public Integer run( final Integer p) {
        return p + 1;
      }
    };
    final ArrayList<Integer> bumped = s.applyEach(xs, addOne);
    System.out.println(String.valueOf( "bumped0 " + String.valueOf(bumped.get(0) ) ) );
  }
}
