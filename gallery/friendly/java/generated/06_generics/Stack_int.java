import java.util.*;

public class Stack_int { 
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
}
