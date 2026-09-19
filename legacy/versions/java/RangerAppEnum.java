import java.util.*;
import java.util.Optional;

class RangerAppEnum { 
  public String name = ""     /** note: unused */;
  public int cnt = 0;
  public HashMap<String,Integer> values = new HashMap<String,Integer>();
  public Optional<CodeNode> node = Optional.empty()     /** note: unused */;
  
  public void add( String n ) {
    values.put(n, cnt);
    cnt = cnt + 1;
  }
}
