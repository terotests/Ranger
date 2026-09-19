import java.util.*;

public class Stats { 
  
  public Integer total( final ArrayList<Integer> xs ) {
    Integer acc = 0;
    for ( Integer v : xs) {
      acc = acc + v;
    }
    return acc;
  }
  
  public Integer evenCount( final ArrayList<Integer> xs ) {
    Integer n = 0;
    for ( Integer v : xs) {
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n;
  }
  
  public ArrayList<Integer> doubled( final ArrayList<Integer> xs ) {
    ArrayList<Integer> out = new ArrayList<Integer>();
    for ( Integer v : xs) {
      out.add(v * 2);
    }
    return out;
  }
  
  public ArrayList<Integer> applyEach( final ArrayList<Integer> xs , final LambdaSignature1 f ) {
    ArrayList<Integer> out = new ArrayList<Integer>();
    for ( Integer v : xs) {
      final Integer next = f.run(v);
      out.add(next);
    }
    return out;
  }
}
