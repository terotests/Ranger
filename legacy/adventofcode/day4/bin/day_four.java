import java.util.*;
import java.io.*;

public class day_four { 
  
  public static Boolean is_valid_passphrase( final String str ) {
    final HashMap<String,Boolean> word_index = new HashMap<String,Boolean>();
    if ( (str.length()) > 0 ) {
      final ArrayList<String> words = new ArrayList<String>(Arrays.asList(str.split(" ")));
      final Boolean[] b_valid =  new Boolean[]{true};
      operatorsOf.forEach_2(words, new LambdaSignature1() { 
        public void run( final String item,  final Integer index) {
          if ( word_index.containsKey(item) ) {
            b_valid[0] = false;
          }
          word_index.put(item, true);
          // captured var word_index
          // captured var b_valid
        }
      });
      return b_valid[0];
    }
    return false;
  }
  
  public static void main(String [] args ) {
    final inputData data = new inputData();
    final ArrayList<String> lines = new ArrayList<String>(Arrays.asList((data).get().split("\n")));
    System.out.println(String.valueOf( "lines " + (lines.size()) ) );
    final Integer[] valid_cnt =  new Integer[]{0};
    operatorsOf.forEach_2(lines, new LambdaSignature1() { 
      public void run( final String item,  final Integer index) {
        if ( day_four.is_valid_passphrase((item.trim())) ) {
          valid_cnt[0] = valid_cnt[0] + 1;
        }
        // captured var valid_cnt
      }
    });
    System.out.println(String.valueOf( "valid: " + valid_cnt[0] ) );
  }
}
