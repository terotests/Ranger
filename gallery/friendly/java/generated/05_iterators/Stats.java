import java.util.*;

public class Stats { 
  
  public Integer total( final ArrayList<Integer> xs ) {
    Integer acc = 0;
    for ( int i = 0; i < xs.size(); i++) {
      Integer v = xs.get(i);
      acc = acc + v;
    }
    return acc;
  }
  
  public Integer evenCount( final ArrayList<Integer> xs ) {
    Integer n = 0;
    for ( int i = 0; i < xs.size(); i++) {
      Integer v = xs.get(i);
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n;
  }
  
  public ArrayList<Integer> doubled( final ArrayList<Integer> xs ) {
    ArrayList<Integer> out = new ArrayList<Integer>();
    for ( int i = 0; i < xs.size(); i++) {
      Integer v = xs.get(i);
      out.add(v * 2);
    }
    return out;
  }
  
  public ArrayList<Integer> applyEach( final ArrayList<Integer> xs , final LambdaSignature1 f ) {
    ArrayList<Integer> out = new ArrayList<Integer>();
    for ( int i = 0; i < xs.size(); i++) {
      Integer v = xs.get(i);
      final Integer next = f.run(v);
      out.add(next);
    }
    return out;
  }
}
