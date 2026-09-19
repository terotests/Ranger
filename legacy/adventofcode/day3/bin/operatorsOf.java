import java.util.*;

public class operatorsOf { 
  
  public static ArrayList<String> map_2( final ArrayList<Integer> __self , final LambdaSignature2 cb ) {
    /** unused:  final Integer __len = __self.size()   **/ ;
    ArrayList<String> res = new ArrayList<String>();
    for ( int i = 0; i < __self.size(); i++) {
      Integer it = __self.get(i);
      res.add(cb.run(it, i));
    }
    return res;
  }
}
