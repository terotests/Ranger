import java.util.*;

public class operatorsOf { 
  
  public static void forEach_2( final ArrayList<String> __self , final LambdaSignature1 cb ) {
    for ( int i = 0; i < __self.size(); i++) {
      String it = __self.get(i);
      cb.run(it, i);
    }
  }
  
  public static void forEach_3( final ArrayList<Integer> __self , final LambdaSignature2 cb ) {
    for ( int i_1 = 0; i_1 < __self.size(); i_1++) {
      Integer it_1 = __self.get(i_1);
      cb.run(it_1, i_1);
    }
  }
}
