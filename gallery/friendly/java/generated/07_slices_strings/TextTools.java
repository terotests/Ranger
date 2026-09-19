import java.util.*;

public class TextTools { 
  
  public String greet( final String name ) {
    return "hello " + name;
  }
  
  public Integer total( final ArrayList<Integer> xs ) {
    Integer acc = 0;
    for ( int i = 0; i < xs.size(); i++) {
      Integer v = xs.get(i);
      acc = acc + v;
    }
    return acc;
  }
  
  public String firstChar( final String s ) {
    if ( s.length() == 0 ) {
      return "";
    }
    return s.substring(0, 1 );
  }
  
  public Integer twice( final ArrayList<Integer> xs ) {
    return TextTools.this.total(xs) + TextTools.this.total(xs);
  }
}
