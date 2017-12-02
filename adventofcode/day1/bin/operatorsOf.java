import java.util.*;

public class operatorsOf { 
  
  public static ArrayList<Integer> map_2( final ArrayList<String> __self , final LambdaSignature1 cb ) {
    /** unused:  final Integer __len = __self.size()   **/ ;
    ArrayList<Integer> res = new ArrayList<Integer>();
    for ( int i = 0; i < __self.size(); i++) {
      String it = __self.get(i);
      res.add(cb.run(it, i));
    }
    return res;
  }
  
  public static Integer reduce_3( final ArrayList<Integer> __self , final LambdaSignature3 cb , final Integer initialValue ) {
    final Integer len_1 = __self.size();
    Integer res_1 = initialValue;
    if ( len_1 >= 1 ) {
      for ( int i_1 = 0; i_1 < __self.size(); i_1++) {
        Integer it_1 = __self.get(i_1);
        res_1 = cb.run(res_1, it_1, i_1);
      }
    }
    return res_1;
  }
}
