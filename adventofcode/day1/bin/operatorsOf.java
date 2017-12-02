import java.util.*;

public class operatorsOf { 
  
  public static ArrayList<String> filter_2( final ArrayList<String> __self , final LambdaSignature1 cb ) {
    ArrayList<String> res = new ArrayList<String>();
    for ( int i = 0; i < __self.size(); i++) {
      String it = __self.get(i);
      if ( cb.run(it, i) ) {
        res.add(it);
      }
    }
    return res;
  }
  
  public static ArrayList<Integer> map_3( final ArrayList<String> __self , final LambdaSignature2 cb ) {
    /** unused:  final Integer __len = __self.size()   **/ ;
    ArrayList<Integer> res_1 = new ArrayList<Integer>();
    for ( int i_1 = 0; i_1 < __self.size(); i_1++) {
      String it_1 = __self.get(i_1);
      res_1.add(cb.run(it_1, i_1));
    }
    return res_1;
  }
  
  public static Integer reduce_4( final ArrayList<Integer> __self , final LambdaSignature3 cb , final Integer initialValue ) {
    final Integer len_1 = __self.size();
    Integer res_2 = initialValue;
    if ( len_1 >= 1 ) {
      for ( int i_2 = 0; i_2 < __self.size(); i_2++) {
        Integer it_2 = __self.get(i_2);
        res_2 = cb.run(res_2, it_2, i_2);
      }
    }
    return res_2;
  }
}
