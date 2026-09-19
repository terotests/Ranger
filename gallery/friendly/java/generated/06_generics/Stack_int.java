import java.util.*;

public class Stack_int { 
  
  static Integer _getIntegerOrNull ( String str ) {
      try {
         return (Integer.parseInt(str));
      } catch ( NumberFormatException e ) {
          return null;
      }
  }
  
  public ArrayList<Integer> items = new ArrayList<Integer>();
  
  public void put( final Integer item ) {
    items.add(item);
  }
  
  public Integer size() {
    return items.size();
  }
  
  public Integer peek() {
    Integer found = null;
    final Integer n = items.size();
    if ( n == 0 ) {
      return found;
    }
    found = items.get((n - 1));
    return found;
  }
  
  public Integer _optionalInt( final String text ) {
    return _getIntegerOrNull(text );
  }
}
