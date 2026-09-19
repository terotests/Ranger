import java.util.*;

public class Stack_string { 
  
  static Integer _getIntegerOrNull ( String str ) {
      try {
         return (Integer.parseInt(str));
      } catch ( NumberFormatException e ) {
          return null;
      }
  }
  
  public ArrayList<String> items = new ArrayList<String>();
  
  public void put( final String item ) {
    items.add(item);
  }
  
  public Integer size() {
    return items.size();
  }
  
  public String peek() {
    String found = null;
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
