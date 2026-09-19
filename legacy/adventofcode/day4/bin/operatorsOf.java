import java.util.*;

public class operatorsOf { 
  
  public static void forEach_2( final ArrayList<String> __self , final LambdaSignature1 cb ) {
    for ( int i = 0; i < __self.size(); i++) {
      String it = __self.get(i);
      cb.run(it, i);
    }
  }
}
